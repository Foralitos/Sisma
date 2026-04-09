import MapaCliente from "./MapaCliente";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Mapa de Predicción Sísmica — CDMX",
};

async function getPrediccion() {
  try {
    const base =
      process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/sismos/predictions?limit=1`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data?.predicciones?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function MapaPage() {
  const prediccion = await getPrediccion();
  return <MapaCliente prediccion={prediccion} />;
}
