"use client";

import { useState } from "react";

export default function PanicoPage() {
  const [status, setStatus] = useState("idle"); // idle | locating | sending | sent | error | no-geo
  const [message, setMessage] = useState("");

  async function handlePanic() {
    if (status === "sent" || status === "sending" || status === "locating") return;

    if (!navigator.geolocation) {
      setStatus("no-geo");
      return;
    }

    setStatus("locating");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("sending");
        try {
          const res = await fetch("/api/incidents", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-sisma-public": "true",
            },
            body: JSON.stringify({
              type: "civilian_panic",
              severity: 5,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              notes: "Alerta de pánico ciudadano",
              serviceType: "ciudadano",
            }),
          });

          if (res.ok) {
            setStatus("sent");
            setMessage("Tu alerta fue enviada. Los servicios de emergencia han sido notificados.");
          } else {
            setStatus("error");
            setMessage("No se pudo enviar la alerta. Llama al 911.");
          }
        } catch {
          setStatus("error");
          setMessage("Error de conexión. Llama al 911 de inmediato.");
        }
      },
      () => {
        setStatus("no-geo");
      },
      { timeout: 10000 }
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-white">

      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">SISMA — Sistema de Alertas</p>
        <h1 className="text-4xl font-black text-white">Botón de Emergencia</h1>
      </div>

      {/* Estado: idle o locating o sending */}
      {(status === "idle" || status === "locating" || status === "sending") && (
        <div className="flex flex-col items-center gap-8">
          <button
            onClick={handlePanic}
            disabled={status !== "idle"}
            className={`
              w-56 h-56 rounded-full text-white font-black text-2xl uppercase tracking-wide
              shadow-2xl border-4 border-red-400 transition-all select-none
              ${status === "idle"
                ? "bg-red-600 hover:bg-red-500 active:scale-95 cursor-pointer animate-pulse"
                : "bg-red-800 cursor-wait opacity-80"}
            `}
          >
            {status === "idle" && "NECESITO\nAYUDA"}
            {status === "locating" && "📡\nLocalizando..."}
            {status === "sending" && "📤\nEnviando..."}
          </button>

          <p className="text-gray-400 text-sm text-center max-w-xs">
            Presiona el botón. Usaremos tu ubicación GPS para alertar a los servicios de emergencia de inmediato.
          </p>
        </div>
      )}

      {/* Estado: enviado */}
      {status === "sent" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-32 h-32 rounded-full bg-green-700 flex items-center justify-center text-6xl">
            ✅
          </div>
          <h2 className="text-2xl font-black text-green-400">¡Alerta enviada!</h2>
          <p className="text-gray-300 max-w-sm leading-relaxed">{message}</p>
          <p className="text-gray-500 text-sm">
            Si el peligro persiste, llama al <span className="text-white font-bold">911</span>
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 px-6 py-2 rounded-full border border-gray-600 text-gray-400 text-sm hover:text-white hover:border-gray-400 transition-colors"
          >
            Enviar otra alerta
          </button>
        </div>
      )}

      {/* Estado: error */}
      {status === "error" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-32 h-32 rounded-full bg-red-900 flex items-center justify-center text-6xl">
            ❌
          </div>
          <h2 className="text-2xl font-black text-red-400">Error al enviar</h2>
          <p className="text-gray-300 max-w-sm leading-relaxed">{message}</p>
          <a
            href="tel:911"
            className="mt-4 px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xl transition-colors"
          >
            📞 Llamar al 911
          </a>
          <button
            onClick={() => setStatus("idle")}
            className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado: sin geolocalización */}
      {status === "no-geo" && (
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="w-32 h-32 rounded-full bg-yellow-900 flex items-center justify-center text-6xl">
            📍
          </div>
          <h2 className="text-2xl font-black text-yellow-400">Activa el GPS</h2>
          <p className="text-gray-300 leading-relaxed">
            Tu dispositivo no tiene acceso a la ubicación. Para recibir ayuda:
          </p>
          <ol className="text-gray-400 text-sm text-left space-y-2 list-decimal list-inside">
            <li>Activa el GPS en la configuración de tu dispositivo</li>
            <li>Permite el acceso a la ubicación en tu navegador</li>
            <li>Recarga esta página y vuelve a intentarlo</li>
          </ol>
          <a
            href="tel:911"
            className="mt-4 px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xl transition-colors"
          >
            📞 Llamar al 911
          </a>
          <button
            onClick={() => setStatus("idle")}
            className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="mt-16 text-gray-700 text-xs text-center">
        SISMA · Sistema Inteligente de Situación y Manejo de Alertas · CDMX
      </p>
    </div>
  );
}
