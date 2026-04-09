import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import HospitalUnit from "@/models/HospitalUnit";
import pusher from "@/libs/pusher";

// PATCH — Actualiza capacidad, especialidades y/o notas del hospital
export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const hospital = await HospitalUnit.findById(params.id);
    if (!hospital) {
      return NextResponse.json({ error: "Hospital no encontrado" }, { status: 404 });
    }

    // Solo el dueño puede editar su propio hospital (los seeded no tienen dueño)
    if (!hospital.owner || hospital.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const VALID_CAPACITIES = ["available", "partial", "full"];
    const VALID_SPECIALTIES = ["urgencias", "cirugia", "pediatria", "quemados", "trauma", "uci"];

    if (body.capacity !== undefined && !VALID_CAPACITIES.includes(body.capacity)) {
      return NextResponse.json({ error: "Capacidad inválida" }, { status: 400 });
    }
    if (body.specialties !== undefined) {
      const invalid = body.specialties.filter((s) => !VALID_SPECIALTIES.includes(s));
      if (invalid.length > 0) {
        return NextResponse.json({ error: "Especialidades inválidas" }, { status: 400 });
      }
    }

    const updates = {};
    if (body.capacity !== undefined) updates.capacity = body.capacity;
    if (body.specialties !== undefined) updates.specialties = body.specialties;
    if (body.notes !== undefined) updates.notes = body.notes;
    updates.updatedBy = session.user.id;

    const updated = await HospitalUnit.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true }
    );

    // Broadcast en tiempo real a todos los dashboards de ambulancias
    await pusher.trigger("hospitals", "capacity-updated", {
      _id: updated._id.toString(),
      name: updated.name,
      lat: updated.lat,
      lng: updated.lng,
      capacity: updated.capacity,
      specialties: updated.specialties,
      notes: updated.notes,
      phone: updated.phone,
      updatedAt: updated.updatedAt,
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
