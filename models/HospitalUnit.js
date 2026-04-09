import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const hospitalUnitSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    network: {
      type: String,
      enum: ["IMSS", "ISSSTE", "SSA", "SEDESA", "Cruz Roja", "Privado", "Otro"],
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    capacity: {
      type: String,
      enum: ["available", "partial", "full"],
      default: "available",
    },
    specialties: [
      {
        type: String,
        enum: ["urgencias", "cirugia", "pediatria", "quemados", "trauma", "uci"],
      },
    ],
    notes: { type: String, trim: true },
    // The user (role=hospital) who manages this unit — null for seeded records
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

hospitalUnitSchema.index({ capacity: 1 });
hospitalUnitSchema.index({ lat: 1, lng: 1 });

hospitalUnitSchema.plugin(toJSON);

export default mongoose.models.HospitalUnit ||
  mongoose.model("HospitalUnit", hospitalUnitSchema);
