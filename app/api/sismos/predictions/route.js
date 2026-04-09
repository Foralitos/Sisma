import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Sismo from "@/models/Sismo";
import Prediccion from "@/models/Prediccion";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

const COLORES = {
  ALTO: "#ef4444",
  "MEDIO-ALTO": "#f97316",
  MEDIO: "#eab308",
  BAJO: "#22c55e",
};

function calcularCentroide(puntos) {
  if (!puntos.length) return [];
  const lon = puntos.reduce((s, p) => s + p[0], 0) / puntos.length;
  const lat = puntos.reduce((s, p) => s + p[1], 0) / puntos.length;
  return [+lon.toFixed(6), +lat.toFixed(6)];
}

function mesLabel(mesStr) {
  // "2026-04" → "Abril 2026"
  const [anio, mes] = mesStr.split("-");
  const nombre = new Date(+anio, +mes - 1).toLocaleString("es-MX", {
    month: "long",
  });
  return `${nombre.charAt(0).toUpperCase() + nombre.slice(1)} ${anio}`;
}

// Genera la lista de meses "YYYY-MM" entre dos fechas ISO
function generarMeses(desde, hasta) {
  const meses = [];
  const d = new Date(desde);
  const h = new Date(hasta);
  d.setDate(1);
  h.setDate(1);
  while (d <= h) {
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses.push({ mes, label: mesLabel(mes) });
    d.setMonth(d.getMonth() + 1);
  }
  return meses;
}

// ── POST /api/sismos/predictions ──────────────────────────────────────────────

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      periodoDesde,
      periodoHasta,
      nivelRiesgoGlobal,
      zonas,
      resumenTexto,
    } = body;

    if (!nivelRiesgoGlobal || !zonas || !Array.isArray(zonas) || !zonas.length) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: nivelRiesgoGlobal, zonas[]" },
        { status: 400 }
      );
    }

    await connectMongo();

    const meses = generarMeses(
      periodoDesde || new Date().toISOString().slice(0, 10),
      periodoHasta || new Date().toISOString().slice(0, 10)
    );

    // Para cada zona buscamos sus coordenadas reales en la colección sismos
    const zonasEnriquecidas = await Promise.all(
      zonas.map(async (zona) => {
        const sisMosZona = await Sismo.find({
          referenciaLocalizacion: { $regex: zona.nombre, $options: "i" },
        })
          .select("latitud longitud")
          .lean();

        const puntos = sisMosZona.map((s) => [s.longitud, s.latitud]);
        const centroide = calcularCentroide(puntos);

        // Si la zona tiene prediccionesPorMes en el body las usamos,
        // si no, replicamos el mismo nivel para todos los meses del período
        let prediccionesPorMes;
        if (zona.prediccionesPorMes && zona.prediccionesPorMes.length) {
          prediccionesPorMes = zona.prediccionesPorMes.map((p) => ({
            ...p,
            label: mesLabel(p.mes),
            color: COLORES[p.nivelRiesgo] || COLORES.BAJO,
          }));
        } else {
          prediccionesPorMes = meses.map((m) => ({
            mes: m.mes,
            label: m.label,
            nivelRiesgo: zona.nivelRiesgo,
            color: COLORES[zona.nivelRiesgo] || COLORES.BAJO,
            magnitudEsperada: zona.magnitudEsperada ?? null,
            fundamentoEstadistico: zona.fundamentoEstadistico ?? null,
          }));
        }

        return {
          nombre: zona.nombre,
          puntos,
          centroide,
          prediccionesPorMes,
        };
      })
    );

    const prediccion = await Prediccion.create({
      fechaGeneracion: new Date(),
      nivelRiesgoGlobal,
      meses,
      zonas: zonasEnriquecidas,
      resumenTexto: resumenTexto || null,
    });

    return NextResponse.json({
      success: true,
      predictionId: prediccion._id,
      mapUrl: "/mapa",
      zonasProcesadas: zonasEnriquecidas.length,
    });
  } catch (e) {
    console.error("[POST /api/sismos/predictions]", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── GET /api/sismos/predictions ───────────────────────────────────────────────

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "1", 10), 10);

    await connectMongo();

    const predicciones = await Prediccion.find()
      .sort({ fechaGeneracion: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ total: predicciones.length, predicciones });
  } catch (e) {
    console.error("[GET /api/sismos/predictions]", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
