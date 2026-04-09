import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import HospitalUnit from "@/models/HospitalUnit";

// GET — Lista todos los hospitales (acceso público para el mapa de ambulancias)
export async function GET() {
  try {
    await connectMongo();
    const hospitals = await HospitalUnit.find({}).select(
      "name network lat lng address phone capacity specialties notes updatedAt"
    );
    return NextResponse.json(hospitals);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Registra el hospital del usuario autenticado (solo una vez durante el setup)
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "hospital") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectMongo();

    // Evitar duplicados: un usuario solo puede tener un HospitalUnit
    const existing = await HospitalUnit.findOne({ owner: session.user.id });
    if (existing) {
      return NextResponse.json(
        { error: "Ya tienes un hospital registrado" },
        { status: 409 }
      );
    }

    const body = await req.json();
    const { name, network, lat, lng, address, phone } = body;

    if (!name || lat == null || lng == null) {
      return NextResponse.json(
        { error: "Nombre y ubicación son requeridos" },
        { status: 400 }
      );
    }

    const hospital = await HospitalUnit.create({
      name,
      network,
      lat,
      lng,
      address,
      phone,
      owner: session.user.id,
      updatedBy: session.user.id,
    });

    return NextResponse.json(hospital, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
