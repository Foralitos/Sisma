import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const incidentSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "structural_damage",
        "fire",
        "gas_leak",
        "road_blocked",
        "evacuation_zone",
        "medical",
        "civilian_panic",
        "resolved",
      ],
      required: true,
    },
    severity: { type: Number, min: 1, max: 5, default: 3 },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    notes: { type: String, trim: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    serviceType: {
      type: String,
      enum: ["ambulancia", "policia", "bomberos", "ciudadano"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
    attendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

incidentSchema.index({ status: 1, createdAt: -1 });
incidentSchema.index({ lat: 1, lng: 1 });

incidentSchema.plugin(toJSON);

export default mongoose.models.Incident ||
  mongoose.model("Incident", incidentSchema);
