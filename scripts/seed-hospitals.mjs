/**
 * Seed: Hospitales reales de la Ciudad de México → MongoDB
 *
 * Uso:
 *   node scripts/seed-hospitals.mjs
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

// ── Schema (inline para no depender del transpilador) ─────────────────────────
const schema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    network:    { type: String },
    lat:        { type: Number, required: true },
    lng:        { type: Number, required: true },
    address:    { type: String },
    phone:      { type: String },
    capacity:   { type: String, default: "available" },
    specialties:{ type: [String], default: [] },
    notes:      { type: String },
    owner:      { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

const HospitalUnit =
  mongoose.models.HospitalUnit || mongoose.model("HospitalUnit", schema);

// ── Datos: hospitales reales de CDMX ─────────────────────────────────────────
const HOSPITALS = [
  // ── SSA / Secretaría de Salud ─────────────────────────────────────────────
  {
    name: "Hospital General de México Dr. Eduardo Liceaga",
    network: "SSA",
    lat: 19.4169,
    lng: -99.1522,
    address: "Dr. Balmis 148, Col. Doctores, Cuauhtémoc",
    phone: "55 2789 2000",
    capacity: "partial",
    specialties: ["urgencias", "cirugia", "trauma", "uci", "pediatria"],
    notes: "Principal hospital de referencia del gobierno federal. Entrada de urgencias por Dr. Lucio.",
  },
  {
    name: "Hospital Juárez de México",
    network: "SSA",
    lat: 19.4889,
    lng: -99.1281,
    address: "Av. Instituto Politécnico Nacional 5160, Magdalena de las Salinas, GAM",
    phone: "55 5747 7560",
    capacity: "available",
    specialties: ["urgencias", "cirugia", "trauma", "quemados", "uci"],
    notes: "Centro de referencia nacional para quemados y trauma grave.",
  },
  {
    name: "Hospital de la Mujer",
    network: "SSA",
    lat: 19.4047,
    lng: -99.1723,
    address: "Baja California 205, Col. Hipódromo, Cuauhtémoc",
    phone: "55 5264 3200",
    capacity: "available",
    specialties: ["urgencias", "cirugia", "pediatria"],
    notes: "Especialidad en ginecología y obstetricia. Urgencias obstétricas 24 hrs.",
  },
  {
    name: "Hospital Nacional Homeopático",
    network: "SSA",
    lat: 19.4133,
    lng: -99.1408,
    address: "Chimalpopoca 130, Col. Obrera, Cuauhtémoc",
    phone: "55 5578 3700",
    capacity: "available",
    specialties: ["urgencias"],
    notes: "Capacidad limitada en urgencias. Referir casos graves a HGM.",
  },

  // ── IMSS ──────────────────────────────────────────────────────────────────
  {
    name: "CMN Siglo XXI — Hospital de Especialidades IMSS",
    network: "IMSS",
    lat: 19.4158,
    lng: -99.1501,
    address: "Av. Cuauhtémoc 330, Col. Doctores, Cuauhtémoc",
    phone: "55 5627 6900",
    capacity: "full",
    specialties: ["urgencias", "cirugia", "trauma", "uci"],
    notes: "Saturación alta por ingreso masivo. Desviar pacientes a HGM o Balbuena.",
  },
  {
    name: "CMN Siglo XXI — Hospital de Ginecología y Obstetricia IMSS",
    network: "IMSS",
    lat: 19.4143,
    lng: -99.1491,
    address: "Av. Cuauhtémoc 330 (Torre Sur), Col. Doctores, Cuauhtémoc",
    phone: "55 5627 6900",
    capacity: "partial",
    specialties: ["urgencias", "cirugia", "pediatria"],
  },
  {
    name: "Hospital General de Zona No. 1 IMSS",
    network: "IMSS",
    lat: 19.4138,
    lng: -99.1380,
    address: "Río Piedad 5, Col. Obrera, Cuauhtémoc",
    phone: "55 5762 0333",
    capacity: "available",
    specialties: ["urgencias", "cirugia", "trauma"],
  },
  {
    name: "Hospital General de Zona No. 32 IMSS",
    network: "IMSS",
    lat: 19.3580,
    lng: -99.0840,
    address: "Av. Tláhuac 1226, Iztapalapa",
    phone: "55 5686 0033",
    capacity: "available",
    specialties: ["urgencias", "cirugia"],
    notes: "Zona sureste de la ciudad. Buena disponibilidad actual.",
  },
  {
    name: "Hospital General de Zona No. 2 IMSS La Villa",
    network: "IMSS",
    lat: 19.4746,
    lng: -99.1185,
    address: "Insurgentes Norte 1132, Col. Capultitlán, GAM",
    phone: "55 5577 1199",
    capacity: "partial",
    specialties: ["urgencias", "cirugia", "trauma"],
  },

  // ── ISSSTE ────────────────────────────────────────────────────────────────
  {
    name: "CMN 20 de Noviembre ISSSTE",
    network: "ISSSTE",
    lat: 19.3868,
    lng: -99.1608,
    address: "Félix Cuevas 540, Col. Del Valle, Benito Juárez",
    phone: "55 5200 5003",
    capacity: "partial",
    specialties: ["urgencias", "cirugia", "uci", "trauma"],
    notes: "Centro de alta especialidad. Urgencias con capacidad moderada.",
  },
  {
    name: "Hospital Regional 1° de Octubre ISSSTE",
    network: "ISSSTE",
    lat: 19.4881,
    lng: -99.1368,
    address: "Av. Instituto Politécnico Nacional 1669, Col. Lindavista, GAM",
    phone: "55 5754 3588",
    capacity: "available",
    specialties: ["urgencias", "cirugia", "trauma", "uci"],
    notes: "Urgencias 24 hrs. Buen acceso desde Eje 7 Norte.",
  },
  {
    name: "Hospital General Dr. Darío Fernández ISSSTE",
    network: "ISSSTE",
    lat: 19.4828,
    lng: -99.1702,
    address: "Aquiles Serdán 1880, Col. Argentina Antigua, GAM",
    phone: "55 5527 4600",
    capacity: "available",
    specialties: ["urgencias", "cirugia"],
  },

  // ── SEDESA ────────────────────────────────────────────────────────────────
  {
    name: "Hospital General Balbuena SEDESA",
    network: "SEDESA",
    lat: 19.4210,
    lng: -99.1089,
    address: "Córdoba 1, Col. Vista Alegre, Cuauhtémoc",
    phone: "55 5552 6736",
    capacity: "available",
    specialties: ["urgencias", "cirugia", "trauma", "pediatria"],
    notes: "Referente de Oriente. Buena capacidad disponible.",
  },
  {
    name: "Hospital General Xoco SEDESA",
    network: "SEDESA",
    lat: 19.3847,
    lng: -99.1678,
    address: "Río Churubusco 263, Col. Xoco, Benito Juárez",
    phone: "55 5539 5450",
    capacity: "full",
    specialties: ["urgencias", "cirugia"],
    notes: "Sin camas disponibles en urgencias. Solo estabilización y traslado.",
  },
  {
    name: "Hospital General Iztapalapa SEDESA",
    network: "SEDESA",
    lat: 19.3709,
    lng: -99.0580,
    address: "Av. Combate de Celaya s/n, Unidad Habitacional CTM, Iztapalapa",
    phone: "55 5686 8765",
    capacity: "partial",
    specialties: ["urgencias", "cirugia", "pediatria"],
  },
  {
    name: "Hospital General Ticomán SEDESA",
    network: "SEDESA",
    lat: 19.5181,
    lng: -99.1189,
    address: "Plan de San Luis 4800, Col. Ticomán, GAM",
    phone: "55 5119 9200",
    capacity: "available",
    specialties: ["urgencias", "cirugia"],
    notes: "Norte de la ciudad. Acceso por Calzada Ticomán.",
  },
  {
    name: "Hospital Pediátrico Moctezuma SEDESA",
    network: "SEDESA",
    lat: 19.4267,
    lng: -99.0897,
    address: "Retorno 19 de Emiliano Zapata 97, Col. Moctezuma 2a Sección, Venustiano Carranza",
    phone: "55 5552 6736",
    capacity: "available",
    specialties: ["urgencias", "pediatria"],
    notes: "Especialidad pediátrica. Urgencias para menores de 18 años.",
  },
  {
    name: "Hospital General Enrique Cabrera SEDESA",
    network: "SEDESA",
    lat: 19.3428,
    lng: -99.1785,
    address: "Av. Eje Central Lázaro Cárdenas 100, Col. Presidentes Ejidales, Coyoacán",
    phone: "55 5672 3911",
    capacity: "available",
    specialties: ["urgencias", "cirugia", "trauma"],
    notes: "Sur de la ciudad. Zona Coyoacán / Ajusco.",
  },

  // ── Cruz Roja ─────────────────────────────────────────────────────────────
  {
    name: "Cruz Roja Mexicana — Delegación CDMX",
    network: "Cruz Roja",
    lat: 19.4378,
    lng: -99.1921,
    address: "Ejército Nacional 1032, Col. Polanco IV Sección, Miguel Hidalgo",
    phone: "55 5395 1111",
    capacity: "partial",
    specialties: ["urgencias", "trauma", "quemados"],
    notes: "Recibe pacientes sin derechohabiencia. Coordinación con ambulancias propias.",
  },

  // ── Privados ──────────────────────────────────────────────────────────────
  {
    name: "Hospital ABC — Campus Observatorio",
    network: "Privado",
    lat: 19.3921,
    lng: -99.1998,
    address: "Sur 136 No. 116, Col. Las Américas, Álvaro Obregón",
    phone: "55 5230 8000",
    capacity: "available",
    specialties: ["urgencias", "cirugia", "uci", "trauma", "quemados"],
    notes: "Alta complejidad. Acepta casos graves con previa autorización de seguro.",
  },
  {
    name: "Hospital ABC — Campus Santa Fe",
    network: "Privado",
    lat: 19.3622,
    lng: -99.2713,
    address: "Carlos Graef Fernández 154, Col. Santa Fe, Cuajimalpa",
    phone: "55 1664 6400",
    capacity: "available",
    specialties: ["urgencias", "cirugia", "uci", "trauma"],
    notes: "Urgencias 24 hrs. Zona Santa Fe / Cuajimalpa.",
  },
  {
    name: "Hospital Médica Sur",
    network: "Privado",
    lat: 19.3083,
    lng: -99.1778,
    address: "Puente de Piedra 150, Col. Toriello Guerra, Tlalpan",
    phone: "55 5424 7200",
    capacity: "available",
    specialties: ["urgencias", "cirugia", "uci", "trauma", "pediatria"],
    notes: "Urgencias disponibles. Sur de la ciudad.",
  },
  {
    name: "Hospital Español de México",
    network: "Privado",
    lat: 19.4333,
    lng: -99.1963,
    address: "Ejército Nacional 613, Col. Granada, Miguel Hidalgo",
    phone: "55 5255 9600",
    capacity: "full",
    specialties: ["urgencias", "cirugia", "uci"],
    notes: "Urgencias saturadas. Capacidad de UCI al límite.",
  },
  {
    name: "Hospital Ángeles Metropolitano",
    network: "Privado",
    lat: 19.4073,
    lng: -99.1558,
    address: "Tlacotalpan 59, Col. Roma Sur, Cuauhtémoc",
    phone: "55 5265 1800",
    capacity: "partial",
    specialties: ["urgencias", "cirugia", "uci", "trauma"],
    notes: "Zona Roma. Urgencias con capacidad moderada.",
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🔌  Conectando a MongoDB…");
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Conectado");

  // Borrar hospitales seeded anteriormente (sin owner)
  const deleted = await HospitalUnit.deleteMany({ owner: null });
  console.log(`🗑   Eliminados ${deleted.deletedCount} hospitales seeded previos`);

  const result = await HospitalUnit.insertMany(HOSPITALS);
  console.log(`🏥  Insertados ${result.length} hospitales reales de CDMX\n`);

  // Resumen de capacidades
  const byCapacity = { available: 0, partial: 0, full: 0 };
  result.forEach((h) => byCapacity[h.capacity]++);
  console.log("📊  Distribución de capacidad:");
  console.log(`    🟢 Disponible: ${byCapacity.available}`);
  console.log(`    🟡 Saturado:   ${byCapacity.partial}`);
  console.log(`    🔴 Lleno:      ${byCapacity.full}`);

  await mongoose.disconnect();
  console.log("\n✅  Listo.");
}

seed().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
