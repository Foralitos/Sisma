/**
 * Seed: Incidentes de demo para CDMX → MongoDB
 *
 * Uso:
 *   node scripts/seed-incidents.mjs
 *
 * Requiere MONGODB_URI en .env
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

dotenv.config({ path: resolve(ROOT, ".env") });
dotenv.config({ path: resolve(ROOT, ".env.local"), override: true });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI no encontrada en .env");
  process.exit(1);
}

// ── Schema inline ──────────────────────────────────────────────────────────────
const schema = new mongoose.Schema(
  {
    type:        { type: String, required: true },
    severity:    { type: Number, min: 1, max: 5, default: 3 },
    lat:         { type: Number, required: true },
    lng:         { type: Number, required: true },
    notes:       { type: String },
    reportedBy:  { type: mongoose.Schema.Types.ObjectId, default: null },
    serviceType: { type: String, required: true },
    status:      { type: String, default: "active" },
    attendedBy:  { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

const Incident = mongoose.models.Incident || mongoose.model("Incident", schema);

// ── Incidentes de demo ─────────────────────────────────────────────────────────
// Distribuidos en colonias reales de CDMX (Doctores, Roma, Tepito, Centro,
// Tlatelolco, Xochimilco, Iztapalapa, Coyoacán, Polanco, etc.)
const INCIDENTS = [

  // ── Pánicos ciudadanos (6) ─────────────────────────────────────────────────
  {
    type: "civilian_panic",
    severity: 5,
    lat: 19.4250,
    lng: -99.1178,
    notes: "Persona atrapada bajo escombros — Tepito",
    serviceType: "ciudadano",
  },
  {
    type: "civilian_panic",
    severity: 5,
    lat: 19.4173,
    lng: -99.1600,
    notes: "Edificio colapsado — Col. Doctores",
    serviceType: "ciudadano",
  },
  {
    type: "civilian_panic",
    severity: 4,
    lat: 19.4120,
    lng: -99.1728,
    notes: "Familia atrapada en segundo piso — Roma Norte",
    serviceType: "ciudadano",
  },
  {
    type: "civilian_panic",
    severity: 5,
    lat: 19.4477,
    lng: -99.1309,
    notes: "Persona herida grave — Tlatelolco",
    serviceType: "ciudadano",
  },
  {
    type: "civilian_panic",
    severity: 3,
    lat: 19.3598,
    lng: -99.0621,
    notes: "Adulto mayor atrapado — Iztapalapa",
    serviceType: "ciudadano",
  },
  {
    type: "civilian_panic",
    severity: 4,
    lat: 19.3486,
    lng: -99.1620,
    notes: "Niños atrapados en escuela — Coyoacán",
    serviceType: "ciudadano",
  },

  // ── Daño estructural / Derrumbes (5) ──────────────────────────────────────
  {
    type: "structural_damage",
    severity: 5,
    lat: 19.4285,
    lng: -99.1340,
    notes: "Edificio de 4 pisos derrumbado — Centro Histórico, Mesones y Uruguay",
    serviceType: "bomberos",
  },
  {
    type: "structural_damage",
    severity: 4,
    lat: 19.4153,
    lng: -99.1660,
    notes: "Colapso parcial de fachada — Col. Obrera, Arcos de Belén",
    serviceType: "bomberos",
  },
  {
    type: "structural_damage",
    severity: 3,
    lat: 19.3700,
    lng: -99.1640,
    notes: "Grietas estructurales graves — Xochimilco, Av. División del Norte",
    serviceType: "bomberos",
  },
  {
    type: "structural_damage",
    severity: 4,
    lat: 19.4501,
    lng: -99.1351,
    notes: "Puente peatonal dañado — Tlatelolco, Eje Central",
    serviceType: "bomberos",
  },
  {
    type: "structural_damage",
    severity: 3,
    lat: 19.3850,
    lng: -99.0540,
    notes: "Viviendas con daño severo — Iztapalapa, Unidad Ctm",
    serviceType: "bomberos",
  },

  // ── Incendios (3) ─────────────────────────────────────────────────────────
  {
    type: "fire",
    severity: 5,
    lat: 19.4330,
    lng: -99.1490,
    notes: "Incendio en edificio comercial — Eje Central y Juárez, Centro",
    serviceType: "bomberos",
  },
  {
    type: "fire",
    severity: 4,
    lat: 19.4680,
    lng: -99.1220,
    notes: "Incendio en bodega — GAM, Av. de las Granjas",
    serviceType: "bomberos",
  },
  {
    type: "fire",
    severity: 3,
    lat: 19.3940,
    lng: -99.1140,
    notes: "Incendio en local — Venustiano Carranza, Congreso de la Unión",
    serviceType: "bomberos",
  },

  // ── Fugas de gas (2) ──────────────────────────────────────────────────────
  {
    type: "gas_leak",
    severity: 4,
    lat: 19.4098,
    lng: -99.1589,
    notes: "Ruptura de ducto de gas — Col. Doctores, Dr. Río de la Loza y Dr. Carmona",
    serviceType: "bomberos",
  },
  {
    type: "gas_leak",
    severity: 3,
    lat: 19.4550,
    lng: -99.1530,
    notes: "Fuga en cocina de hospital — La Villa, Av. Insurgentes Norte",
    serviceType: "bomberos",
  },

  // ── Vialidades bloqueadas (5) ─────────────────────────────────────────────
  {
    type: "road_blocked",
    severity: 4,
    lat: 19.4231,
    lng: -99.1460,
    notes: "Eje Central completamente cerrado entre Juárez y Chapultepec — escombros en calzada",
    serviceType: "policia",
  },
  {
    type: "road_blocked",
    severity: 3,
    lat: 19.4050,
    lng: -99.1720,
    notes: "Insurgentes bloqueada sentido norte — Álvaro Obregón a Sonora",
    serviceType: "policia",
  },
  {
    type: "road_blocked",
    severity: 4,
    lat: 19.3980,
    lng: -99.1052,
    notes: "Circuito Interior cortado — Av. Río Churubusco, Viaducto",
    serviceType: "policia",
  },
  {
    type: "road_blocked",
    severity: 3,
    lat: 19.4730,
    lng: -99.1290,
    notes: "Av. IPN bloqueada entre La Villa y Tlatelolco — vehículo volcado",
    serviceType: "policia",
  },
  {
    type: "road_blocked",
    severity: 2,
    lat: 19.3560,
    lng: -99.1680,
    notes: "División del Norte reducida a un carril — fuga de agua secundaria",
    serviceType: "policia",
  },

  // ── Zonas de evacuación (2) ───────────────────────────────────────────────
  {
    type: "evacuation_zone",
    severity: 5,
    lat: 19.4280,
    lng: -99.1510,
    notes: "Evacuación obligatoria radio 300m — derrumbe Centro Histórico, alto riesgo de réplica",
    serviceType: "policia",
  },
  {
    type: "evacuation_zone",
    severity: 4,
    lat: 19.4150,
    lng: -99.1630,
    notes: "Zona de exclusión por fuga de gas — Col. Obrera, 5 cuadras",
    serviceType: "policia",
  },

  // ── Emergencias médicas (2) ───────────────────────────────────────────────
  {
    type: "medical",
    severity: 4,
    lat: 19.4185,
    lng: -99.1540,
    notes: "Múltiples heridos por derrumbe — requerida coordinación con hospitales cercanos",
    serviceType: "ambulancia",
  },
  {
    type: "medical",
    severity: 3,
    lat: 19.3890,
    lng: -99.0962,
    notes: "Adulto mayor con politraumatismo — Iztapalapa, Unidad Habitacional",
    serviceType: "ambulancia",
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🔌  Conectando a MongoDB…");
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Conectado\n");

  // Borrar incidentes seeded anteriormente (sin reportedBy)
  const deleted = await Incident.deleteMany({ reportedBy: null });
  console.log(`🗑   Eliminados ${deleted.deletedCount} incidentes de demo previos`);

  const result = await Incident.insertMany(INCIDENTS);
  console.log(`🚨  Insertados ${result.length} incidentes de demo en CDMX\n`);

  // Resumen por tipo
  const byType = {};
  result.forEach((i) => { byType[i.type] = (byType[i.type] ?? 0) + 1; });

  console.log("📊  Distribución por tipo:");
  console.log(`    🆘 Pánico ciudadano:     ${byType.civilian_panic    ?? 0}`);
  console.log(`    🏚️  Daño estructural:     ${byType.structural_damage ?? 0}`);
  console.log(`    🔥 Incendio:              ${byType.fire              ?? 0}`);
  console.log(`    💨 Fuga de gas:           ${byType.gas_leak          ?? 0}`);
  console.log(`    🚧 Vialidad bloqueada:    ${byType.road_blocked      ?? 0}`);
  console.log(`    🚨 Zona de evacuación:   ${byType.evacuation_zone   ?? 0}`);
  console.log(`    🚑 Emergencia médica:    ${byType.medical           ?? 0}`);

  await mongoose.disconnect();
  console.log("\n✅  Listo.");
}

seed().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
