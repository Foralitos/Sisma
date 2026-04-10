"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import IncidentMap from "@/components/dashboard/IncidentMap";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const INCIDENT_TYPES = [
  { value: "structural_damage", label: "🏚️ Derrumbe" },
  { value: "fire",              label: "🔥 Incendio" },
  { value: "gas_leak",          label: "💨 Fuga de gas" },
];

const SEVERITY_LABELS = ["", "1 Leve", "2 Menor", "3 Moderado", "4 Grave", "5 Crítico"];
const SEVERITY_COLORS = ["", "bg-green-700", "bg-lime-700", "bg-yellow-700", "bg-orange-700", "bg-red-700"];

export default function BomberosDashboard() {
  const [panics, setPanics]     = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [form, setForm]         = useState({ type: "structural_damage", severity: 3, notes: "" });
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

  // Cargar pánicos ciudadanos activos
  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((all) => setPanics(all.filter((i) => i.type === "civilian_panic")))
      .catch(() => {});
  }, []);

  // Pusher: escuchar nuevos pánicos
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    const ch = pusher.subscribe("incidents");
    ch.bind("incident-created", (inc) => {
      if (inc.type === "civilian_panic") {
        setPanics((prev) => [inc, ...prev]);
        // Vibrar si está disponible
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
      }
    });
    ch.bind("incident-resolved", ({ _id }) => {
      setPanics((prev) => prev.filter((i) => i._id !== _id));
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
          element: "#bomb-header",
          popover: {
            title: "🚒 Dashboard Bomberos",
            description: "Este es tu centro de operaciones. Ves alertas ciudadanas en tiempo real, puedes reportar incidentes y coordinar con otros servicios desde el mapa compartido.",
            side: "right",
          },
        },
        {
          element: "#bomb-panics",
          popover: {
            title: "🆘 Pánicos ciudadanos",
            description: "Cuando un ciudadano presiona el botón de emergencia, aparece aquí al instante con su ubicación. Haz clic en <b>Ir a rescatar</b> para abrir la ruta en Google Maps.",
            side: "right",
          },
        },
        {
          element: "#bomb-form",
          popover: {
            title: "📡 Reportar incidente",
            description: "Reporta derrumbes, incendios o fugas de gas desde tu ubicación GPS. El reporte aparece en el mapa de <b>todos los servicios</b> (policía, ambulancias) en tiempo real.",
            side: "right",
          },
        },
        {
          element: "#bomb-mapa",
          popover: {
            title: "🗺️ Mapa compartido en tiempo real",
            description: "<b>🔴 Pulsante</b>: pánico ciudadano (prioridad máxima) · <b>🏚️ Gris</b>: derrumbe · <b>🔥 Naranja</b>: incendio · <b>💨 Morado</b>: fuga de gas · <b>🚧 Amarillo</b>: vialidad bloqueada · <b>🟢/🟡/🔴 Hospital</b>: disponibilidad. Haz clic en cualquier pin para ver detalles y marcar como atendido.",
            side: "left",
          },
        },
      ],
    }).drive();
  }

  useEffect(() => {
    const yaVio = sessionStorage.getItem("sisma-tour-bomberos");
    if (!yaVio) {
      setTimeout(startTour, 800);
      sessionStorage.setItem("sisma-tour-bomberos", "1");
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
          serviceType: "bomberos",
        }),
      });
      if (res.ok) {
        setToast({ type: "ok", msg: "Incidente reportado y broadcast a todos los dashboards" });
        setForm({ type: "structural_damage", severity: 3, notes: "" });
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
        <div id="bomb-header" className="p-4 border-b sticky top-0 bg-base-100 z-10">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base">🚒 Dashboard Bomberos</h2>
            <button onClick={startTour} className="btn btn-ghost btn-xs gap-1" title="Ver guía">❓ Guía</button>
          </div>
          <p className="text-xs text-base-content/50 mt-0.5">
            {myLocation ? "📍 Geolocalización activa" : "Sin geolocalización"}
          </p>
        </div>

        {/* Pánicos ciudadanos */}
        <div id="bomb-panics" className="p-3 border-b">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            🆘 Pánicos ciudadanos
            {panics.length > 0 && (
              <span className="badge badge-error badge-sm animate-pulse">{panics.length}</span>
            )}
          </h3>
          {panics.length === 0 ? (
            <p className="text-xs text-base-content/40 py-2">Sin alertas activas</p>
          ) : (
            <div className="flex flex-col gap-2">
              {panics.slice(0, 5).map((p) => (
                <div key={p._id} className="bg-red-950/40 border border-red-800 rounded-lg p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-red-400">🆘 Pánico ciudadano</span>
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
              {panics.length > 5 && (
                <p className="text-xs text-base-content/40 text-center">+{panics.length - 5} más en el mapa</p>
              )}
            </div>
          )}
        </div>

        {/* Formulario de reporte */}
        <form id="bomb-form" onSubmit={submitReport} className="p-3 border-b space-y-3">
          <h3 className="font-bold text-sm">Reportar incidente</h3>

          {/* Tipo */}
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

          {/* Severidad */}
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
              className="range range-sm range-error w-full"
            />
          </div>

          {/* Notas */}
          <textarea
            rows={2}
            placeholder="Notas adicionales (opcional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="textarea textarea-bordered textarea-sm w-full text-xs"
          />

          <button
            type="submit"
            disabled={sending || !myLocation}
            className="btn btn-error btn-sm w-full"
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
      <div id="bomb-mapa" className="flex-1">
        <IncidentMap serviceType="bomberos" myLocation={myLocation} />
      </div>
    </div>
  );
}
