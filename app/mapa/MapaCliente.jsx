"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
} from "@/components/ui/map";

const RIESGO_CONFIG = {
  ALTO: { color: "#ef4444", label: "Alto", emoji: "🔴" },
  "MEDIO-ALTO": { color: "#f97316", label: "Medio-Alto", emoji: "🟠" },
  MEDIO: { color: "#eab308", label: "Medio", emoji: "🟡" },
  BAJO: { color: "#22c55e", label: "Bajo", emoji: "🟢" },
};

function startTour() {
  const driverObj = driver({
    showProgress: true,
    nextBtnText: "Siguiente →",
    prevBtnText: "← Anterior",
    doneBtnText: "¡Entendido!",
    steps: [
      {
        element: "#mapa-header",
        popover: {
          title: "🗺️ Mapa de Predicción Sísmica",
          description:
            "Este mapa muestra las zonas de la Ciudad de México con mayor probabilidad de actividad sísmica, basado en datos históricos del SSN-UNAM (1990–2024).",
          side: "bottom",
        },
      },
      {
        element: "#riesgo-global",
        popover: {
          title: "⚠️ Nivel de Riesgo Global",
          description:
            "Indica el nivel de riesgo general del período predicho, calculado a partir del promedio ponderado de todas las zonas.",
          side: "bottom",
        },
      },
      {
        element: "#mapa-container",
        popover: {
          title: "📍 Pines de Riesgo",
          description:
            "Cada pin representa una zona de CDMX. El color indica el nivel de riesgo: 🔴 Alto, 🟠 Medio-Alto, 🟡 Medio, 🟢 Bajo. Haz clic en cualquier pin para ver el detalle.",
          side: "left",
        },
      },
      {
        element: "#panel-zonas",
        popover: {
          title: "📋 Detalle por Zona",
          description:
            "Aquí puedes ver todas las zonas analizadas, su nivel de riesgo, la magnitud esperada y el fundamento estadístico de cada predicción.",
          side: "left",
        },
      },
      {
        element: "#leyenda",
        popover: {
          title: "🎨 Leyenda",
          description:
            "Referencia rápida de los colores del mapa. Las predicciones son probabilísticas, basadas en patrones históricos y no garantizan la ocurrencia de sismos.",
          side: "top",
        },
      },
    ],
  });
  driverObj.drive();
}

export default function MapaCliente({ prediccion }) {
  useEffect(() => {
    const yaVio = sessionStorage.getItem("sisma-tour-done");
    if (!yaVio) {
      setTimeout(startTour, 800);
      sessionStorage.setItem("sisma-tour-done", "1");
    }
  }, []);

  if (!prediccion) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-200">
        <div className="text-center">
          <p className="text-2xl font-bold">Sin predicciones disponibles</p>
          <p className="text-base-content/60 mt-2">
            El agente aún no ha generado ningún reporte.
          </p>
        </div>
      </div>
    );
  }

  const cfg =
    RIESGO_CONFIG[prediccion.nivelRiesgoGlobal] ?? RIESGO_CONFIG.MEDIO;

  // Usa el primer mes disponible o muestra todos sin filtro
  const primerMes = prediccion.meses?.[0]?.mes ?? null;

  const zonas = prediccion.zonas
    .map((zona) => {
      const pred =
        zona.prediccionesPorMes?.find((p) => p.mes === primerMes) ??
        zona.prediccionesPorMes?.[0];
      return { ...zona, pred };
    })
    .filter((z) => z.centroide?.length === 2);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div
        id="mapa-header"
        className="bg-base-100 border-base-300 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 md:px-6 md:py-3"
      >
        <div>
          <h1 className="text-sm font-bold md:text-lg">
            🗺️ Mapa de Predicción Sísmica — CDMX
          </h1>
          <p className="text-base-content/60 hidden text-sm sm:block">
            Generado el{" "}
            {new Date(prediccion.fechaGeneracion).toLocaleDateString("es-MX", {
              dateStyle: "long",
            })}
            {" · "}Período: {prediccion.meses?.[0]?.label} –{" "}
            {prediccion.meses?.at(-1)?.label}
          </p>
        </div>
        <div className="flex items-center gap-1 md:gap-3">
          <span
            id="riesgo-global"
            className="whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold text-white md:px-4 md:py-1.5 md:text-sm"
            style={{ backgroundColor: cfg.color }}
          >
            {cfg.emoji} Riesgo: {prediccion.nivelRiesgoGlobal}
          </span>
          <button
            onClick={startTour}
            className="btn btn-ghost btn-sm gap-1"
            title="Ver tutorial"
          >
            ❓ Guía
          </button>
        </div>
      </div>

      {/* Mapa + panel */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Mapa */}
        <div
          id="mapa-container"
          className="relative h-[100vh] md:h-auto md:flex-1"
        >
          <Map
            viewport={{ center: [-99.13, 19.43], zoom: 10.5 }}
            className="h-full w-full"
          >
            <MapControls />

            {zonas.map((zona) => {
              const zCfg = RIESGO_CONFIG[zona.pred?.nivelRiesgo ?? "BAJO"];
              const [lon, lat] = zona.centroide;

              return (
                <MapMarker key={zona.nombre} longitude={lon} latitude={lat}>
                  <MarkerContent>
                    <div
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white text-base shadow-lg transition-transform hover:scale-110"
                      style={{ backgroundColor: zCfg.color }}
                      title={zona.nombre}
                    >
                      {zCfg.emoji}
                    </div>
                  </MarkerContent>

                  <MarkerPopup>
                    <div
                      style={{
                        backgroundColor: "#1e1e2e",
                        border: `2px solid ${zCfg.color}`,
                        borderRadius: "12px",
                        padding: "14px 16px",
                        minWidth: "220px",
                        maxWidth: "280px",
                        boxShadow: `0 4px 24px rgba(0,0,0,0.6)`,
                        color: "#f0f0f0",
                        fontFamily: "sans-serif",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        <span style={{ fontSize: "20px" }}>{zCfg.emoji}</span>
                        <div>
                          <p
                            style={{
                              fontWeight: "700",
                              fontSize: "14px",
                              margin: 0,
                              color: "#fff",
                            }}
                          >
                            {zona.nombre}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              margin: 0,
                              color: zCfg.color,
                              fontWeight: "600",
                              textTransform: "uppercase",
                            }}
                          >
                            Riesgo {zona.pred?.nivelRiesgo}
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          height: "1px",
                          backgroundColor: "#ffffff20",
                          marginBottom: "10px",
                        }}
                      />
                      {zona.pred?.magnitudEsperada && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "12px", color: "#aaa" }}>
                            Magnitud esperada
                          </span>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#fff",
                            }}
                          >
                            M{zona.pred.magnitudEsperada}
                          </span>
                        </div>
                      )}
                      {zona.pred?.fundamentoEstadistico && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#bbb",
                            margin: 0,
                            lineHeight: "1.5",
                            marginTop: "6px",
                            borderTop: "1px solid #ffffff15",
                            paddingTop: "8px",
                          }}
                        >
                          {zona.pred.fundamentoEstadistico}
                        </p>
                      )}
                    </div>
                  </MarkerPopup>
                </MapMarker>
              );
            })}
          </Map>
        </div>

        {/* Panel lateral */}
        <div
          id="panel-zonas"
          className="bg-base-100 border-base-300 flex w-full flex-col gap-3 overflow-y-auto border-t p-4 md:w-72 md:border-t-0 md:border-l"
        >
          <h2 className="font-bold">Zonas analizadas</h2>

          {zonas.map((zona) => {
            const zCfg = RIESGO_CONFIG[zona.pred?.nivelRiesgo ?? "BAJO"];
            return (
              <div key={zona.nombre} className="bg-base-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{zona.nombre}</span>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: zCfg.color }}
                  >
                    {zCfg.emoji} {zCfg.label}
                  </span>
                </div>
                {zona.pred?.magnitudEsperada && (
                  <p className="text-base-content/60 mt-1 text-xs">
                    Magnitud esperada: M{zona.pred.magnitudEsperada}
                  </p>
                )}
                {zona.pred?.fundamentoEstadistico && (
                  <p className="text-base-content/60 mt-1 text-xs line-clamp-2">
                    {zona.pred.fundamentoEstadistico}
                  </p>
                )}
              </div>
            );
          })}

          {/* Leyenda */}
          <div id="leyenda" className="mt-auto border-t pt-3">
            <h3 className="mb-2 text-sm font-semibold">Leyenda</h3>
            {Object.entries(RIESGO_CONFIG).map(([key, c]) => (
              <div key={key} className="mb-1 flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.emoji} {c.label}
              </div>
            ))}
            <p className="text-base-content/40 mt-3 text-xs">
              Predicciones basadas en datos históricos SSN-UNAM 1990–2024.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
