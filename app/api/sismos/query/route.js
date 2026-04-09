import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Sismo from "@/models/Sismo";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // ── Parsear query params ──────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);

    const magnitudMin = parseFloat(searchParams.get("magnitudMin") ?? "0");
    const magnitudMax = parseFloat(searchParams.get("magnitudMax") ?? "10");
    const fechaDesde = new Date(searchParams.get("fechaDesde") ?? "1990-01-01");
    const fechaHasta = new Date(searchParams.get("fechaHasta") ?? new Date());
    const latitud = searchParams.get("latitud")
      ? parseFloat(searchParams.get("latitud"))
      : null;
    const longitud = searchParams.get("longitud")
      ? parseFloat(searchParams.get("longitud"))
      : null;
    const radioKm = parseFloat(searchParams.get("radioKm") ?? "50");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    // ── Validaciones básicas ──────────────────────────────────────────────────
    if (isNaN(magnitudMin) || isNaN(magnitudMax) || isNaN(limit)) {
      return NextResponse.json(
        { error: "Parámetros numéricos inválidos" },
        { status: 400 }
      );
    }
    if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
      return NextResponse.json(
        { error: "Fechas inválidas. Usa formato ISO: YYYY-MM-DD" },
        { status: 400 }
      );
    }

    await connectMongo();

    // ── Filtro base (magnitud + fecha) ────────────────────────────────────────
    const filtroBase = {
      magnitud: { $gte: magnitudMin, $lte: magnitudMax },
      fecha: { $gte: fechaDesde, $lte: fechaHasta },
    };

    const proyeccion =
      "fecha magnitud latitud longitud profundidad referenciaLocalizacion";

    let sismos;

    if (latitud !== null && longitud !== null) {
      // ── Query geoespacial: sismos cercanos a las coordenadas dadas ───────
      sismos = await Sismo.find({
        ...filtroBase,
        ubicacion: {
          $near: {
            $geometry: { type: "Point", coordinates: [longitud, latitud] },
            $maxDistance: radioKm * 1000,
          },
        },
      })
        .select(proyeccion)
        .limit(limit)
        .lean();
    } else {
      // ── Query plana: por magnitud y fecha, mayor magnitud primero ────────
      sismos = await Sismo.find(filtroBase)
        .select(proyeccion)
        .sort({ magnitud: -1, fecha: -1 })
        .limit(limit)
        .lean();
    }

    return NextResponse.json({ total: sismos.length, sismos });
  } catch (e) {
    console.error("[/api/sismos/query]", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
