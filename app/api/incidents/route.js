import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Incident from "@/models/Incident";
import pusher from "@/libs/pusher";

// GET — Lista todos los incidentes activos (público)
export async function GET() {
  try {
    await connectMongo();
    const incidents = await Incident.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return NextResponse.json(incidents);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Crea incidente (auth requerida O header x-sisma-public para pánico ciudadano)
export async function POST(req) {
  try {
    const isPublicPanic = req.headers.get("x-sisma-public") === "true";
    let reportedBy = null;
    let serviceType = "ciudadano";

    if (!isPublicPanic) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      reportedBy = session.user.id;
      serviceType = session.user.role ?? "ciudadano";
    }

    const body = await req.json();

    const VALID_TYPES = [
      "structural_damage", "fire", "gas_leak", "road_blocked",
      "evacuation_zone", "medical", "civilian_panic",
    ];
    const VALID_SERVICES = ["ambulancia", "policia", "bomberos", "ciudadano"];

    if (!body.type || !VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "Tipo de incidente inválido" }, { status: 400 });
    }
    if (!body.lat || !body.lng) {
      return NextResponse.json({ error: "Coordenadas requeridas" }, { status: 400 });
    }

    const finalServiceType = VALID_SERVICES.includes(body.serviceType)
      ? body.serviceType
      : serviceType;

    await connectMongo();

    const incident = await Incident.create({
      type: body.type,
      severity: body.severity ?? 3,
      lat: body.lat,
      lng: body.lng,
      notes: body.notes ?? "",
      reportedBy,
      serviceType: finalServiceType,
      status: "active",
    });

    await pusher.trigger("incidents", "incident-created", {
      _id: incident._id.toString(),
      type: incident.type,
      severity: incident.severity,
      lat: incident.lat,
      lng: incident.lng,
      notes: incident.notes,
      serviceType: incident.serviceType,
      status: incident.status,
      createdAt: incident.createdAt,
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
