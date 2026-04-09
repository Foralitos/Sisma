"use client";

import { useState, useEffect } from "react";

const HOSPITAL_BADGE = {
  available: { label: "Disponible", bg: "bg-green-100 text-green-800" },
  partial:   { label: "Saturado",   bg: "bg-yellow-100 text-yellow-800" },
  full:      { label: "Lleno",      bg: "bg-red-100 text-red-800" },
};

export default function CiudadanoDashboard() {
  const [status, setStatus]       = useState("idle"); // idle | locating | sending | sent | error
  const [myLocation, setMyLocation] = useState(null);
  const [hospitals, setHospitals]   = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
    fetch("/api/hospitals")
      .then((r) => r.json())
      .then((all) =>
        setHospitals(all.filter((h) => h.capacity !== "full").slice(0, 4))
      )
      .catch(() => {});
  }, []);

  async function sendPanic() {
    if (status !== "idle" && status !== "error") return;

    if (!myLocation) {
      setStatus("locating");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMyLocation(loc);
          await doSend(loc);
        },
        () => setStatus("error")
      );
      return;
    }
    await doSend(myLocation);
  }

  async function doSend(loc) {
    setStatus("sending");
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "civilian_panic",
          severity: 5,
          lat: loc.lat,
          lng: loc.lng,
          notes: "Alerta de pánico ciudadano",
          serviceType: "ciudadano",
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  function mapsUrl(h) {
    const dest = `${h.lat},${h.lng}`;
    return myLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${dest}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-start pt-12 px-6 pb-16">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-black">¿Necesitas ayuda?</h1>
          <p className="text-base-content/50 text-sm mt-1">
            {myLocation ? "📍 Tu ubicación está lista" : "Activa el GPS para recibir ayuda exacta"}
          </p>
        </div>

        {/* Botón principal */}
        {status === "idle" && (
          <button
            onClick={sendPanic}
            className="w-full py-8 rounded-3xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-2xl uppercase tracking-wide transition-all shadow-2xl animate-pulse"
          >
            🆘 NECESITO AYUDA
          </button>
        )}

        {(status === "locating" || status === "sending") && (
          <div className="w-full py-8 rounded-3xl bg-red-900/60 border border-red-800 text-white text-center space-y-2">
            <span className="loading loading-spinner loading-md" />
            <p className="font-bold text-sm">
              {status === "locating" ? "Obteniendo tu ubicación..." : "Enviando alerta..."}
            </p>
          </div>
        )}

        {status === "sent" && (
          <div className="w-full py-8 rounded-3xl bg-green-900/40 border border-green-700 text-center space-y-2 px-6">
            <p className="text-4xl">✅</p>
            <p className="font-black text-green-400 text-lg">¡Alerta enviada!</p>
            <p className="text-sm text-base-content/60 leading-snug">
              Policía y bomberos fueron notificados con tu ubicación y van en camino.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-2 text-xs text-base-content/40 hover:text-base-content/70 transition-colors underline"
            >
              Enviar otra alerta
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <div className="w-full py-6 rounded-3xl bg-error/10 border border-error/40 text-center px-6">
              <p className="font-bold text-error">No se pudo enviar</p>
              <p className="text-xs text-base-content/50 mt-1">Llama al 911 de inmediato</p>
            </div>
            <a
              href="tel:911"
              className="flex items-center justify-center w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xl transition-colors"
            >
              📞 Llamar al 911
            </a>
            <button
              onClick={() => setStatus("idle")}
              className="w-full text-xs text-base-content/40 hover:text-base-content/60 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Hospitales disponibles */}
        {hospitals.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-base-content/60 uppercase tracking-wider">
              Hospitales disponibles
            </h2>
            <div className="flex flex-col gap-2">
              {hospitals.map((h) => {
                const badge = HOSPITAL_BADGE[h.capacity] ?? HOSPITAL_BADGE.available;
                return (
                  <div key={h._id} className="bg-base-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">{h.name}</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    <a
                      href={mapsUrl(h)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                    >
                      🗺️ Ir
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Llamada de emergencia siempre visible */}
        <div className="text-center">
          <a href="tel:911" className="text-sm text-base-content/40 hover:text-base-content/70 transition-colors">
            ¿Sin internet? Llama al <span className="font-bold">911</span>
          </a>
        </div>
      </div>
    </div>
  );
}
