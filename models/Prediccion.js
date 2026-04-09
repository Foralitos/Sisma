import mongoose from "mongoose";
import toJSON from "@/models/plugins/toJSON";

const prediccionPorMesSchema = new mongoose.Schema(
  {
    mes: { type: String, required: true },       // "2026-04"
    label: { type: String },                      // "Abril 2026"
    nivelRiesgo: { type: String, required: true }, // "ALTO" | "MEDIO-ALTO" | "MEDIO" | "BAJO"
    color: { type: String, required: true },       // "#ef4444" etc.
    magnitudEsperada: { type: Number },
    fundamentoEstadistico: { type: String },
  },
  { _id: false }
);

const zonaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    puntos: { type: [[Number]], default: [] },  // [[lon, lat], ...]
    centroide: { type: [Number], default: [] }, // [lon, lat]
    prediccionesPorMes: [prediccionPorMesSchema],
  },
  { _id: false }
);

const prediccionSchema = new mongoose.Schema(
  {
    fechaGeneracion: { type: Date, default: Date.now },
    nivelRiesgoGlobal: { type: String, required: true },
    meses: [{ mes: String, label: String }],
    zonas: [zonaSchema],
    resumenTexto: { type: String },
  },
  { timestamps: true }
);

prediccionSchema.index({ fechaGeneracion: -1 });
prediccionSchema.plugin(toJSON);

export default mongoose.models.Prediccion ||
  mongoose.model("Prediccion", prediccionSchema);
