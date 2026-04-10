"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import IncidentMap from "@/components/dashboard/IncidentMap";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const INCIDENT_TYPES = [
  { value: "road_blocked",    label: "🚧 Vialidad bloqueada" },
  { value: "evacuation_zone", label: "🚨 Zona de evacuación" },
];

const SEVERITY_LABELS = ["", "1 Leve", "2 Menor", "3 Moderado", "4 Grave", "5 Crítico"];
const SEVERITY_COLORS = ["", "bg-green-700", "bg-lime-700", "bg-yellow-700", "bg-orange-700", "bg-red-700"];

export default function PolicíaDashboard() {
  const [panics, setPanics]     = useState([]);
  const [roadBlocks, setRoadBlocks] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [form, setForm]         = useState({ type: "road_blocked", severity: 3, notes: "" });
  const [sending, setSending]   = useState(false);
  const [toast, setToast]       = useState(null);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Cargar incidentes iniciales
  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((all) => {
        setPanics(all.filter((i) => i.type === "civilian_panic"));
        setRoadBlocks(all.filter((i) => i.type === "road_blocked" || i.type === "evacuation_zone"));
      })
      .catch(() => {});
  }, []);

  // Pusher
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    const ch = pusher.subscribe("incidents");
    ch.bind("incident-created", (inc) => {
      if (inc.type === "civilian_panic") setPanics((prev) => [inc, ...prev]);
      if (inc.type === "road_blocked" || inc.type === "evacuation_zone")
        setRoadBlocks((prev) => [inc, ...prev]);
    });
    ch.bind("incident-resolved", ({ _id }) => {
      setPanics((prev) => prev.filter((i) => i._id !== _id));
      setRoadBlocks((prev) => prev.filter((i) => i._id !== _id));
    });
    return () => { ch.unbind_all(); pusher.disconnect(); };
  }, []);

  function startTour() {
    driver({
      showProgress: true,
      nextBtnText: "Siguiente →",
      prevBtnText: "← Anterior",
      doneBtnText: "¡Entendido!",
      steps: [
        {
          element: "#pol-header",
          popover: {
            title: "👮 Dashboard Policía",
            description: "Tu centro de operaciones durante el sismo. Ves pánicos ciudadanos, bloqueos viales activos y puedes reportar incidentes que afectan el tráfico y la seguridad.",
            side: "right",
          },
        },
        {
          element: "#pol-counters",
          popover: {
            title: "📊 Contadores en vivo",
            description: "Resumen rápido de cuántos <b>pánicos ciudadanos</b> y <b>vialidades bloqueadas</b> hay activos en este momento. Se actualiza solo en tiempo real.",
            side: "right",
          },
        },
        {
          element: "#pol-panics",
          popover: {
            title: "🆘 Pánicos ciudadanos",
            description: "Alertas de personas en peligro con ubicación GPS exacta. Usa <b>Ir a rescatar</b> para abrir la ruta directa en Google Maps y llegar en el menor tiempo posible.",
            side: "right",
          },
        },
        {
          element: "#pol-vialidades",
          popover: {
            title: "🚧 Vialidades bloqueadas",
            description: "Bloqueos y zonas de evacuación que tú u otras unidades han reportado. Las ambulancias también ven estos avisos para evitar rutas cortadas.",
            side: "right",
          },
        },
        {
          element: "#pol-form",
          popover: {
            title: "📡 Reportar incidente",
            description: "Reporta bloqueos o zonas de evacuación desde tu ubicación GPS actual. El reporte se comparte con <b>todos los servicios</b> al instante vía Pusher.",
            side: "right",
          },
        },
        {
          element: "#pol-mapa",
          popover: {
            title: "🗺️ Mapa compartido en tiempo real",
            description: "<b>🔴 Pulsante</b>: pánico ciudadano · <b>🚧 Amarillo</b>: vialidad bloqueada · <b>🚨 Azul</b>: zona de evacuación · <b>🏚️ Gris</b>: derrumbe · <b>🔥 Naranja</b>: incendio · <b>Hospital</b>: verde/amarillo/rojo según capacidad. Clic en cualquier pin para atenderlo o resolverlo.",
            side: "left",
          },
        },
      ],
    }).drive();
  }

  useEffect(() => {
    const yaVio = sessionStorage.getItem("sisma-tour-policia");
    if (!yaVio) {
      setTimeout(startTour, 800);
      sessionStorage.setItem("sisma-tour-policia", "1");
    }
  }, []);

  async function submitReport(e) {
    e.preventDefault();
    if (!myLocation) {
      setToast({ type: "error", msg: "Activa la geolocalización primero" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lat: myLocation.lat,
          lng: myLocation.lng,
          serviceType: "policia",
        }),
      });
      if (res.ok) {
        setToast({ type: "ok", msg: "Incidente reportado" });
        setForm({ type: "road_blocked", severity: 3, notes: "" });
      } else {
        setToast({ type: "error", msg: "Error al reportar" });
      }
    } catch {
      setToast({ type: "error", msg: "Error de conexión" });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Panel lateral ─────────────────────────────────────────────────── */}
      <aside className="w-80 flex flex-col border-r bg-base-100 overflow-y-auto shrink-0">

        {/* Header */}
        <div id="pol-header" className="p-4 border-b sticky top-0 bg-base-100 z-10">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base">👮 Dashboard Policía</h2>
            <button onClick={startTour} className="btn btn-ghost btn-xs gap-1" title="Ver guía">❓ Guía</button>
          </div>
          <p className="text-xs text-base-content/50 mt-0.5">
            {myLocation ? "📍 Geolocalización activa" : "Sin geolocalización"}
          </p>
        </div>

        {/* Contadores */}
        <div id="pol-counters" className="grid grid-cols-2 gap-2 p-3 border-b">
          <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-black text-red-400">{panics.length}</p>
            <p className="text-xs text-base-content/60 mt-0.5">Pánicos activos</p>
          </div>
          <div className="bg-yellow-950/40 border border-yellow-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-black text-yellow-400">{roadBlocks.length}</p>
            <p className="text-xs text-base-content/60 mt-0.5">Vialidades bloqueadas</p>
          </div>
        </div>

        {/* Feed de pánicos */}
        <div id="pol-panics" className="p-3 border-b">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            🆘 Pánicos ciudadanos
            {panics.length > 0 && (
              <span className="badge badge-error badge-sm animate-pulse">{panics.length}</span>
            )}
          </h3>
          {panics.length === 0 ? (
            <p className="text-xs text-base-content/40 py-1">Sin alertas activas</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {panics.slice(0, 4).map((p) => (
                <div key={p._id} className="bg-red-950/30 border border-red-900 rounded-lg p-2 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-red-400">🆘 Ciudadano</span>
                    <span className="text-base-content/40">
                      {new Date(p.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {p.notes && <p className="text-base-content/60 italic">{p.notes}</p>}
                  <a
                    href={myLocation
                      ? `https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${p.lat},${p.lng}&travelmode=driving`
                      : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full bg-blue-700 hover:bg-blue-600 text-white font-semibold py-1.5 rounded-lg transition-colors"
                  >
                    🗺️ Ir a rescatar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feed de vialidades */}
        <div id="pol-vialidades" className="p-3 border-b">
          <h3 className="font-bold text-sm mb-2">🚧 Vialidades bloqueadas</h3>
          {roadBlocks.length === 0 ? (
            <p className="text-xs text-base-content/40 py-1">Sin bloqueos activos</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {roadBlocks.slice(0, 4).map((rb) => (
                <div key={rb._id} className="bg-yellow-950/30 border border-yellow-900 rounded-lg p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-yellow-400">
                      {rb.type === "road_blocked" ? "🚧 Bloqueada" : "🚨 Evacuación"}
                    </span>
                    <span className="text-base-content/40">
                      {new Date(rb.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {rb.notes && <p className="text-base-content/60 mt-0.5 italic">{rb.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario de reporte */}
        <form id="pol-form" onSubmit={submitReport} className="p-3 border-b space-y-3">
          <h3 className="font-bold text-sm">Reportar incidente</h3>

          <div className="space-y-1">
            <label className="text-xs font-medium text-base-content/70">Tipo</label>
            <div className="flex flex-col gap-1">
              {INCIDENT_TYPES.map((t) => (
                <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={t.value}
                    checked={form.type === t.value}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="radio radio-sm"
                  />
                  <span className="text-sm">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-base-content/70">
              Severidad: <span className={`ml-1 px-1.5 rounded text-white text-xs ${SEVERITY_COLORS[form.severity]}`}>{SEVERITY_LABELS[form.severity]}</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: Number(e.target.value) }))}
              className="range range-sm range-warning w-full"
            />
          </div>

          <textarea
            rows={2}
            placeholder="Ej: Insurgentes entre Sonora y Álvaro Obregón completamente bloqueada"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="textarea textarea-bordered textarea-sm w-full text-xs"
          />

          <button
            type="submit"
            disabled={sending || !myLocation}
            className="btn btn-warning btn-sm w-full"
          >
            {sending ? <span className="loading loading-spinner loading-xs" /> : "📡 Reportar desde mi ubicación"}
          </button>

          {!myLocation && (
            <p className="text-xs text-warning text-center">Activa GPS para reportar</p>
          )}
        </form>

        {/* Toast */}
        {toast && (
          <div className={`mx-3 mt-3 rounded-lg px-3 py-2 text-xs font-medium ${toast.type === "ok" ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}>
            {toast.msg}
          </div>
        )}
      </aside>

      {/* ── Mapa ─────────────────────────────────────────────────────────── */}
      <div id="pol-mapa" className="flex-1">
        <IncidentMap serviceType="policia" myLocation={myLocation} />
      </div>
    </div>
  );
}
