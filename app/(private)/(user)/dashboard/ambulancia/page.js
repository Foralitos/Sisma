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

const INCIDENT_WARNINGS = {
  road_blocked:      { color: "#eab308", label: "Vialidad bloqueada", emoji: "🚧" },
  structural_damage: { color: "#78716c", label: "Zona de derrumbe",   emoji: "🏚️" },
  gas_leak:          { color: "#a855f7", label: "Fuga de gas",         emoji: "💨" },
  evacuation_zone:   { color: "#3b82f6", label: "Zona de evacuación",  emoji: "🚨" },
};

const CAPACITY_CONFIG = {
  available: { color: "#22c55e", label: "Disponible", emoji: "🟢", borderColor: "border-l-green-500",  badgeBg: "bg-green-900/60 text-green-300" },
  partial:   { color: "#eab308", label: "Saturado",   emoji: "🟡", borderColor: "border-l-yellow-500", badgeBg: "bg-yellow-900/60 text-yellow-300" },
  full:      { color: "#ef4444", label: "Lleno",      emoji: "🔴", borderColor: "border-l-red-500",    badgeBg: "bg-red-900/60 text-red-300" },
};

// Colores del panel lateral (claro)
const CARD_BORDER = {
  available: "border-l-green-500",
  partial:   "border-l-yellow-500",
  full:      "border-l-red-500",
};

export default function AmbulanceDashboard() {
  const [hospitals, setHospitals]   = useState([]);
  const [warnings, setWarnings]     = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [lastOpened, setLastOpened] = useState(null);
  const [error, setError]           = useState(null);

  // Cargar warnings de incidentes al montar
  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((all) =>
        setWarnings(all.filter((i) => i.type in INCIDENT_WARNINGS))
      )
      .catch(() => {});
  }, []);

  // Cargar hospitales al montar
  useEffect(() => {
    fetch("/api/hospitals")
      .then((r) => r.json())
      .then(setHospitals)
      .catch(() => setError("No se pudieron cargar los hospitales"));
  }, []);

  // Geolocation del browser
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      () => {}
    );
  }, []);

  // Pusher: actualizaciones en tiempo real (hospitales + incidentes)
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const chH = pusher.subscribe("hospitals");
    chH.bind("capacity-updated", (data) => {
      setHospitals((prev) =>
        prev.map((h) => (h._id === data._id ? { ...h, ...data } : h))
      );
    });

    const chI = pusher.subscribe("incidents");
    chI.bind("incident-created", (inc) => {
      if (inc.type in INCIDENT_WARNINGS) {
        setWarnings((prev) => [inc, ...prev]);
      }
    });
    chI.bind("incident-resolved", ({ _id }) => {
      setWarnings((prev) => prev.filter((w) => w._id !== _id));
    });

    return () => {
      chH.unbind_all();
      chI.unbind_all();
      pusher.disconnect();
    };
  }, []);

  function openGoogleMaps(hospital) {
    setLastOpened(hospital._id);
    const dest = `${hospital.lat},${hospital.lng}`;
    const url = myLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${dest}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    window.open(url, "_blank");
  }

  const sortedHospitals = [...hospitals].sort((a, b) => {
    const order = { available: 0, partial: 1, full: 2 };
    return order[a.capacity] - order[b.capacity];
  });

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Panel lateral ────────────────────────────────────────────────── */}
      <aside className="w-72 flex flex-col border-r bg-base-100 overflow-y-auto shrink-0">

        {/* Header */}
        <div className="p-4 border-b sticky top-0 bg-base-100 z-10">
          <h2 className="font-extrabold text-base">🚑 Hospitales CDMX</h2>
          <p className="text-xs text-base-content/50 mt-0.5">
            {myLocation ? "📍 Geolocalización activa" : "Sin geolocalización — actívala para rutas exactas"}
          </p>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-2 p-3">
          {sortedHospitals.map((h) => {
            const cfg = CAPACITY_CONFIG[h.capacity] ?? CAPACITY_CONFIG.available;
            const isLast = lastOpened === h._id;
            return (
              <div
                key={h._id}
                className={`
                  rounded-xl border border-base-200 border-l-4 ${CARD_BORDER[h.capacity] ?? CARD_BORDER.available}
                  bg-base-100 p-3 space-y-2 transition-all
                  ${isLast ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                `}
              >
                {/* Nombre + red */}
                <div>
                  <p className="font-bold text-sm leading-tight">{h.name}</p>
                  {h.network && (
                    <p className="text-xs text-base-content/50 mt-0.5">{h.network}</p>
                  )}
                </div>

                {/* Capacidad */}
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
                  ${h.capacity === "available" ? "bg-green-100 text-green-800" :
                    h.capacity === "partial"   ? "bg-yellow-100 text-yellow-800" :
                                                  "bg-red-100 text-red-800"}`}>
                  {cfg.emoji} {cfg.label}
                </span>

                {/* Especialidades */}
                {h.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {h.specialties.map((s) => (
                      <span key={s} className="text-xs bg-base-200 text-base-content/70 px-1.5 py-0.5 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notas */}
                {h.notes && (
                  <p className="text-xs italic text-base-content/50 leading-snug">{h.notes}</p>
                )}

                {/* Botón */}
                <button
                  className="btn btn-sm btn-primary w-full gap-1.5"
                  onClick={() => openGoogleMaps(h)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Cómo llegar
                </button>
              </div>
            );
          })}

          {hospitals.length === 0 && (
            <p className="text-xs text-center text-base-content/40 py-10">
              Cargando hospitales…
            </p>
          )}
        </div>

        {/* Advertencias de vialidades */}
        {warnings.length > 0 && (
          <div className="p-3 border-t">
            <h3 className="font-bold text-xs text-warning mb-1.5">⚠️ Advertencias de ruta ({warnings.length})</h3>
            <div className="flex flex-col gap-1">
              {warnings.slice(0, 3).map((w) => {
                const cfg = INCIDENT_WARNINGS[w.type];
                return (
                  <div key={w._id} className="bg-yellow-950/30 border border-yellow-900 rounded-lg p-2 text-xs">
                    <span className="font-semibold text-yellow-400">{cfg.emoji} {cfg.label}</span>
                    {w.notes && <p className="text-base-content/60 mt-0.5 italic">{w.notes}</p>}
                  </div>
                );
              })}
              {warnings.length > 3 && (
                <p className="text-xs text-base-content/40 text-center">+{warnings.length - 3} más</p>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-error text-xs px-3 pb-3">{error}</p>}
      </aside>

      {/* ── Mapa ─────────────────────────────────────────────────────────── */}
      <div className="flex-1">
        <Map viewport={{ center: [-99.1332, 19.4326], zoom: 11 }} className="w-full h-full">
          <MapControls showZoom showCompass showLocate />

          {/* Pin de la ambulancia */}
          {myLocation && (
            <MapMarker longitude={myLocation.lng} latitude={myLocation.lat}>
              <MarkerContent>
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse" />
              </MarkerContent>
            </MapMarker>
          )}

          {/* Pins de advertencias (vialidades bloqueadas, derrumbes, etc.) */}
          {warnings.map((w) => {
            const cfg = INCIDENT_WARNINGS[w.type];
            return (
              <MapMarker key={`warn-${w._id}`} longitude={w.lng} latitude={w.lat}>
                <MarkerContent>
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs"
                    style={{ backgroundColor: cfg.color }}
                    title={cfg.label}
                  />
                </MarkerContent>
                <MarkerPopup className="!bg-gray-950 !border-gray-700 !text-white !p-0 !shadow-2xl overflow-hidden min-w-[180px]">
                  <div className="p-3 space-y-1">
                    <p className="font-bold text-sm text-white">{cfg.emoji} {cfg.label}</p>
                    {w.notes && <p className="text-xs text-gray-300 italic">{w.notes}</p>}
                    <p className="text-xs text-gray-500">
                      {new Date(w.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </MarkerPopup>
              </MapMarker>
            );
          })}

          {/* Pins de hospitales */}
          {hospitals.map((h) => {
            const cfg = CAPACITY_CONFIG[h.capacity] ?? CAPACITY_CONFIG.available;
            return (
              <MapMarker key={h._id} longitude={h.lng} latitude={h.lat}>

                {/* Pin circular color-coded */}
                <MarkerContent>
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: cfg.color }}
                  />
                </MarkerContent>

                {/* Popup con fondo sólido */}
                <MarkerPopup className="!bg-gray-950 !border-gray-700 !text-white !p-0 !shadow-2xl overflow-hidden min-w-[220px]">
                  {/* Franja de color según capacidad */}
                  <div className={`border-l-4 ${cfg.borderColor} p-4 space-y-2.5`}>

                    {/* Nombre */}
                    <div>
                      <p className="font-bold text-sm text-white leading-tight">{h.name}</p>
                      {h.network && (
                        <p className="text-xs text-gray-400 mt-0.5">{h.network}</p>
                      )}
                    </div>

                    {/* Capacidad badge */}
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
                      {cfg.emoji} {cfg.label}
                    </span>

                    {/* Teléfono */}
                    {h.phone && (
                      <p className="text-xs text-gray-300">📞 {h.phone}</p>
                    )}

                    {/* Dirección */}
                    {h.address && (
                      <p className="text-xs text-gray-400 leading-snug">{h.address}</p>
                    )}

                    {/* Especialidades */}
                    {h.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {h.specialties.map((s) => (
                          <span key={s} className="text-xs bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notas */}
                    {h.notes && (
                      <p className="text-xs italic text-gray-400 leading-snug">{h.notes}</p>
                    )}

                    {/* Botón Google Maps */}
                    <button
                      onClick={() => openGoogleMaps(h)}
                      className="w-full mt-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
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
        </Map>
      </div>
    </div>
  );
}
