import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Incident from "@/models/Incident";
import pusher from "@/libs/pusher";

// PATCH — Marca incidente como resuelto
export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const incident = await Incident.findById(params.id);
    if (!incident) {
      return NextResponse.json({ error: "Incidente no encontrado" }, { status: 404 });
    }
    if (incident.status === "resolved") {
      return NextResponse.json({ error: "Ya estaba resuelto" }, { status: 400 });
    }

    incident.status = "resolved";
    incident.attendedBy = session.user.id;
    await incident.save();

    await pusher.trigger("incidents", "incident-resolved", {
      _id: incident._id.toString(),
    });

    return NextResponse.json(incident);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
