/**
 * Script de migración: CSV del SSN → MongoDB
 * CSV: SSNMX_catalogo_19900101_20241231_CDMX.csv
 *
 * Uso:
 *   node scripts/import-sismos.mjs
 *
 * Requiere MONGODB_URI en el archivo .env del proyecto.
 */

import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

// ── Config ────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

dotenv.config({ path: resolve(ROOT, ".env") });
dotenv.config({ path: resolve(ROOT, ".env.local"), override: true });

const CSV_PATH = resolve(
  ROOT,
  "SSNMX_catalogo_19900101_20241231_CDMX.csv"
);
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI no encontrada en .env");
  process.exit(1);
}

// ── Mongoose schema (inline para no depender de ES modules de Next.js) ────────
const sismoSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true },
    hora: { type: String, required: true },
    magnitud: { type: Number, required: true },
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
  { timestamps: true }
);

sismoSchema.index({ fecha: 1 });
sismoSchema.index({ magnitud: 1, fecha: 1 });
sismoSchema.index({ ubicacion: "2dsphere" });
sismoSchema.index({ profundidad: 1, magnitud: 1 });

const Sismo =
  mongoose.models.Sismo || mongoose.model("Sismo", sismoSchema);

// ── Parser de CSV ─────────────────────────────────────────────────────────────
/**
 * Las primeras 4 líneas son cabeceras/comentarios del SSN.
 * Línea 5 (índice 4) es el header real con los nombres de columnas.
 * A partir de la línea 6 (índice 5) están los datos.
 */
function parseRow(line) {
  // El CSV usa comas pero algunas celdas van entre comillas
  const cols = [];
  let inQuote = false;
  let current = "";

  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      cols.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols;
}

function buildDoc(cols) {
  // Columnas: Fecha,Hora,Magnitud,Latitud,Longitud,Profundidad,
  //           Referencia de localizacion,Fecha UTC,Hora UTC,Estatus
  const [
    fecha,
    hora,
    magnitud,
    latitud,
    longitud,
    profundidad,
    referenciaLocalizacion,
    fechaUTCStr,
    horaUTC,
    estatus,
  ] = cols;

  if (!fecha || !hora || !magnitud) return null;

  const fechaDate = new Date(`${fecha}T${hora}-06:00`); // Hora Centro México
  const fechaUTCDate = fechaUTCStr
    ? new Date(`${fechaUTCStr}T${horaUTC}Z`)
    : null;

  const lat = parseFloat(latitud);
  const lon = parseFloat(longitud);

  return {
    fecha: fechaDate,
    hora,
    magnitud: parseFloat(magnitud),
    latitud: lat,
    longitud: lon,
    profundidad: parseFloat(profundidad),
    referenciaLocalizacion: referenciaLocalizacion || null,
    fechaUTC: fechaUTCDate,
    horaUTC: horaUTC || null,
    estatus: estatus || null,
    ubicacion: {
      type: "Point",
      coordinates: [lon, lat],
    },
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔌  Conectando a MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Conectado.\n");

  // Opcional: limpiar colección previa para evitar duplicados en reimportación
  const existing = await Sismo.countDocuments();
  if (existing > 0) {
    console.log(`⚠️   La colección ya tiene ${existing} documentos.`);
    console.log("    Eliminando registros previos para reimportar limpio...\n");
    await Sismo.deleteMany({});
  }

  const rl = createInterface({
    input: createReadStream(CSV_PATH, "utf8"),
    crlfDelay: Infinity,
  });

  const docs = [];
  let lineNum = 0;
  let skipped = 0;

  for await (const line of rl) {
    lineNum++;

    // Primeras 4 líneas: metadatos SSN
    // Línea 5: cabecera de columnas
    if (lineNum <= 5) {
      console.log(`   [meta] ${line}`);
      continue;
    }

    if (!line.trim()) continue;

    const cols = parseRow(line);
    const doc = buildDoc(cols);

    if (!doc) {
      skipped++;
      continue;
    }

    docs.push(doc);
  }

  console.log(`\n📄  Filas parseadas : ${docs.length}`);
  console.log(`⚠️   Filas omitidas  : ${skipped}`);

  if (docs.length === 0) {
    console.log("No hay datos que insertar.");
    await mongoose.disconnect();
    return;
  }

  console.log("\n💾  Insertando en MongoDB...");
  const result = await Sismo.insertMany(docs, { ordered: false });
  console.log(`✅  ${result.length} sismos insertados correctamente.`);

  // Resumen rápido
  const magnitudes = docs.map((d) => d.magnitud);
  const min = Math.min(...magnitudes).toFixed(1);
  const max = Math.max(...magnitudes).toFixed(1);
  const avg = (magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length).toFixed(2);

  console.log("\n📊  Resumen:");
  console.log(`   Período    : 1990-01-01 → 2024-12-31`);
  console.log(`   Total      : ${result.length} eventos`);
  console.log(`   Magnitud   : min ${min} | max ${max} | promedio ${avg}`);

  await mongoose.disconnect();
  console.log("\n🏁  Migración completada.");
}

main().catch((err) => {
  console.error("❌  Error durante la migración:", err);
  mongoose.disconnect();
  process.exit(1);
});
