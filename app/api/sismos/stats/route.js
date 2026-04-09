import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Sismo from "@/models/Sismo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectMongo();

    const [porMes, porZona, porMagnitud, porAnio] = await Promise.all([
      // Distribución por mes (1-12) — qué meses tienen más actividad
      Sismo.aggregate([
        {
          $group: {
            _id: { mes: { $month: "$fecha" } },
            total: { $sum: 1 },
            magnitudPromedio: { $avg: "$magnitud" },
            magnitudMaxima: { $max: "$magnitud" },
          },
        },
        { $sort: { "_id.mes": 1 } },
      ]),

      // Zonas más activas (top 10)
      Sismo.aggregate([
        { $match: { referenciaLocalizacion: { $ne: null } } },
        {
          $group: {
            _id: "$referenciaLocalizacion",
            total: { $sum: 1 },
            magnitudPromedio: { $avg: "$magnitud" },
            magnitudMaxima: { $max: "$magnitud" },
            ultimoSismo: { $max: "$fecha" },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),

      // Distribución por rango de magnitud
      Sismo.aggregate([
        {
          $bucket: {
            groupBy: "$magnitud",
            boundaries: [0, 1, 2, 3, 4, 5, 10],
            default: "otro",
            output: {
              total: { $sum: 1 },
              magnitudPromedio: { $avg: "$magnitud" },
            },
          },
        },
      ]),

      // Actividad por año
      Sismo.aggregate([
        {
          $group: {
            _id: { anio: { $year: "$fecha" } },
            total: { $sum: 1 },
            magnitudPromedio: { $avg: "$magnitud" },
            magnitudMaxima: { $max: "$magnitud" },
          },
        },
        { $sort: { "_id.anio": 1 } },
      ]),
    ]);

    const totalSismos = await Sismo.countDocuments();

    return NextResponse.json({
      resumen: {
        totalEventos: totalSismos,
        periodoAnios: "1990-2024",
        fuenteDatos: "SSN-UNAM Catálogo Ciudad de México",
      },
      patronesMensuales: porMes.map((m) => ({
        mes: m._id.mes,
        nombreMes: new Date(2000, m._id.mes - 1).toLocaleString("es-MX", {
          month: "long",
        }),
        totalSismos: m.total,
        magnitudPromedio: +m.magnitudPromedio.toFixed(2),
        magnitudMaxima: m.magnitudMaxima,
      })),
      zonasmasActivas: porZona.map((z) => ({
        zona: z._id,
        totalSismos: z.total,
        magnitudPromedio: +z.magnitudPromedio.toFixed(2),
        magnitudMaxima: z.magnitudMaxima,
        ultimoSismo: z.ultimoSismo,
      })),
      distribucionMagnitud: porMagnitud.map((b) => ({
        rangoMagnitud:
          b._id === "otro" ? "5+" : `${b._id}-${b._id + 1}`,
        totalSismos: b.total,
        magnitudPromedio: +b.magnitudPromedio.toFixed(2),
      })),
      actividadAnual: porAnio.map((a) => ({
        anio: a._id.anio,
        totalSismos: a.total,
        magnitudPromedio: +a.magnitudPromedio.toFixed(2),
        magnitudMaxima: a.magnitudMaxima,
      })),
    });
  } catch (e) {
    console.error("[/api/sismos/stats]", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
