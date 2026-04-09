"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Map,
  MapMarker,
  MarkerContent,
  MapControls,
} from "@/components/ui/map";

const NETWORKS = ["IMSS", "ISSSTE", "SSA", "SEDESA", "Cruz Roja", "Privado", "Otro"];

const CDMX_CENTER = { lng: -99.1332, lat: 19.4326 };

export default function HospitalSetup() {
  const router = useRouter();
  const [position, setPosition] = useState(CDMX_CENTER);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    network: "",
    address: "",
    phone: "",
  });

  function handleField(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("El nombre del hospital es requerido");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          network: form.network || undefined,
          lat: position.lat,
          lng: position.lng,
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-6 bg-base-100">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold">Configura tu hospital</h1>
          <p className="text-base-content/60 text-sm mt-1">
            Coloca el pin en la ubicación de tu unidad y completa los datos. Esto solo se hace una vez.
          </p>
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border h-72">
          <Map
            viewport={{ center: [position.lng, position.lat], zoom: 13 }}
            className="w-full h-full"
          >
            <MapControls showZoom showCompass />
            <MapMarker
              longitude={position.lng}
              latitude={position.lat}
              draggable
              onDragEnd={({ lng, lat }) => setPosition({ lng, lat })}
            >
              <MarkerContent>
                <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-lg" />
              </MarkerContent>
            </MapMarker>
          </Map>
        </div>

        {/* Geolocation button */}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={useMyLocation}
          disabled={locating}
        >
          {locating ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
          Usar mi ubicación actual
        </button>

        {/* Coords display */}
        <p className="text-xs text-base-content/40 -mt-3">
          Lat {position.lat.toFixed(5)}, Lng {position.lng.toFixed(5)} — arrastra el pin para ajustar
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Nombre del hospital *</span></label>
            <input
              name="name"
              value={form.name}
              onChange={handleField}
              className="input input-bordered w-full"
              placeholder="Ej. Hospital General de México"
              required
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Red / Institución</span></label>
            <select name="network" value={form.network} onChange={handleField} className="select select-bordered w-full">
              <option value="">Seleccionar (opcional)</option>
              {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Dirección</span></label>
            <input
              name="address"
              value={form.address}
              onChange={handleField}
              className="input input-bordered w-full"
              placeholder="Dr. Balmis 148, Doctores, CDMX"
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Teléfono de emergencias</span></label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleField}
              className="input input-bordered w-full"
              placeholder="55 1234 5678"
            />
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : "Guardar y continuar"}
          </button>
        </form>
      </div>
    </main>
  );
}
