import mongoose from "mongoose";
import toJSON from "@/models/plugins/toJSON";

const sismoSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true },
    hora: { type: String, required: true },
    magnitud: { type: Number, required: true, index: true },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
    profundidad: { type: Number, required: true },
    referenciaLocalizacion: { type: String },
    fechaUTC: { type: Date },
    horaUTC: { type: String },
    estatus: { type: String },
    ubicacion: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number] }, // [longitud, latitud]
    },
  },
  {
    timestamps: true,
  }
);

// Índices para queries de predicción
sismoSchema.index({ fecha: 1 });
sismoSchema.index({ magnitud: 1, fecha: 1 });
sismoSchema.index({ ubicacion: "2dsphere" });
sismoSchema.index({ profundidad: 1, magnitud: 1 });

sismoSchema.plugin(toJSON);

export default mongoose.models.Sismo || mongoose.model("Sismo", sismoSchema);
