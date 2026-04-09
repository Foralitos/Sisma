"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
} from "@/components/ui/map";

// ── Colores y etiquetas por tipo de incidente ────────────────────────────────
const INCIDENT_CONFIG = {
  civilian_panic:    { color: "#ef4444", label: "Pánico ciudadano",  emoji: "🆘", pulse: true  },
  structural_damage: { color: "#78716c", label: "Derrumbe",          emoji: "🏚️", pulse: false },
  fire:              { color: "#f97316", label: "Incendio",           emoji: "🔥", pulse: false },
  gas_leak:          { color: "#a855f7", label: "Fuga de gas",        emoji: "💨", pulse: false },
  road_blocked:      { color: "#eab308", label: "Vialidad bloqueada", emoji: "🚧", pulse: false },
  evacuation_zone:   { color: "#3b82f6", label: "Zona de evacuación", emoji: "🚨", pulse: false },
  medical:           { color: "#22c55e", label: "Emergencia médica",  emoji: "🚑", pulse: false },
};

const HOSPITAL_CONFIG = {
  available: { color: "#22c55e", label: "Disponible", emoji: "🟢", badgeBg: "bg-green-900/60 text-green-300" },
  partial:   { color: "#eab308", label: "Saturado",   emoji: "🟡", badgeBg: "bg-yellow-900/60 text-yellow-300" },
  full:      { color: "#ef4444", label: "Lleno",      emoji: "🔴", badgeBg: "bg-red-900/60 text-red-300" },
};

/**
 * IncidentMap — Componente de mapa compartido para bomberos, policía y ambulancia.
 *
 * Props:
 *   serviceType  "bomberos" | "policia" | "ambulancia"
 *   myLocation   { lat, lng } | null
 *   onResolve    (incidentId) => void   — callback al resolver incidente
 */
export default function IncidentMap({ serviceType, myLocation, onResolve }) {
  const [incidents, setIncidents] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    fetch("/api/incidents").then((r) => r.json()).then(setIncidents).catch(() => {});
    fetch("/api/hospitals").then((r) => r.json()).then(setHospitals).catch(() => {});
  }, []);

  // Pusher: incidentes en tiempo real
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const ch = pusher.subscribe("incidents");
    ch.bind("incident-created", (data) => {
      setIncidents((prev) => [data, ...prev]);
    });
    ch.bind("incident-resolved", ({ _id }) => {
      setIncidents((prev) => prev.filter((i) => i._id !== _id));
    });

    const chH = pusher.subscribe("hospitals");
    chH.bind("capacity-updated", (data) => {
      setHospitals((prev) =>
        prev.map((h) => (h._id === data._id ? { ...h, ...data } : h))
      );
    });

    return () => {
      ch.unbind_all();
      chH.unbind_all();
      pusher.disconnect();
    };
  }, []);

  async function resolveIncident(id) {
    try {
      const res = await fetch(`/api/incidents/${id}`, { method: "PATCH" });
      if (res.ok) {
        setIncidents((prev) => prev.filter((i) => i._id !== id));
        onResolve?.(id);
      }
    } catch {}
  }

  function openGoogleMaps(lat, lng) {
    const dest = `${lat},${lng}`;
    const url = myLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${dest}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    window.open(url, "_blank");
  }

  return (
    <Map viewport={{ center: [-99.1332, 19.4326], zoom: 11 }} className="w-full h-full">
      <MapControls showZoom showCompass showLocate />

      {/* Pin de mi posición */}
      {myLocation && (
        <MapMarker longitude={myLocation.lng} latitude={myLocation.lat}>
          <MarkerContent>
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse" />
          </MarkerContent>
        </MapMarker>
      )}

      {/* Pins de hospitales */}
      {hospitals.map((h) => {
        const cfg = HOSPITAL_CONFIG[h.capacity] ?? HOSPITAL_CONFIG.available;
        return (
          <MapMarker key={`hosp-${h._id}`} longitude={h.lng} latitude={h.lat}>
            <MarkerContent>
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: cfg.color }}
                title={h.name}
              />
            </MarkerContent>
            <MarkerPopup className="!bg-gray-950 !border-gray-700 !text-white !p-0 !shadow-2xl overflow-hidden min-w-[200px]">
              <div className="p-3 space-y-1.5">
                <p className="font-bold text-sm text-white">{h.name}</p>
                {h.network && <p className="text-xs text-gray-400">{h.network}</p>}
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
                  {cfg.emoji} {cfg.label}
                </span>
                {h.phone && <p className="text-xs text-gray-300">📞 {h.phone}</p>}
                {h.address && <p className="text-xs text-gray-400 leading-snug">{h.address}</p>}
                <button
                  onClick={() => openGoogleMaps(h.lat, h.lng)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors mt-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Cómo llegar
                </button>
              </div>
            </MarkerPopup>
          </MapMarker>
        );
      })}

      {/* Pins de incidentes */}
      {incidents.map((inc) => {
        const cfg = INCIDENT_CONFIG[inc.type] ?? INCIDENT_CONFIG.structural_damage;
        const canResolve = serviceType === "bomberos" || serviceType === "policia";
        return (
          <MapMarker key={`inc-${inc._id}`} longitude={inc.lng} latitude={inc.lat}>
            <MarkerContent>
              <div
                className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs
                  ${cfg.pulse ? "animate-pulse ring-2 ring-red-400 ring-offset-1" : ""}`}
                style={{ backgroundColor: cfg.color }}
                title={cfg.label}
              >
                {/* show emoji as text inside pin */}
              </div>
            </MarkerContent>
            <MarkerPopup className="!bg-gray-950 !border-gray-700 !text-white !p-0 !shadow-2xl overflow-hidden min-w-[220px]">
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cfg.emoji}</span>
                  <div>
                    <p className="font-bold text-sm text-white">{cfg.label}</p>
                    <p className="text-xs text-gray-400">
                      Severidad: {"⭐".repeat(inc.severity ?? 3)}
                    </p>
                  </div>
                </div>
                {inc.notes && (
                  <p className="text-xs text-gray-300 leading-snug italic">{inc.notes}</p>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(inc.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <button
                  onClick={() => openGoogleMaps(inc.lat, inc.lng)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {inc.type === "civilian_panic" ? "🆘 Ir a rescatar" : "Cómo llegar"}
                </button>
                {canResolve && (
                  <button
                    onClick={() => resolveIncident(inc._id)}
                    className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                  >
                    ✅ Marcar como atendido
                  </button>
                )}
              </div>
            </MarkerPopup>
          </MapMarker>
        );
      })}
    </Map>
  );
}
