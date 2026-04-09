"use client";

import { useState } from "react";

const CAPACITIES = [
  { id: "available", label: "Disponible", emoji: "🟢", style: "border-green-500 bg-green-50 text-green-800" },
  { id: "partial",   label: "Saturado",   emoji: "🟡", style: "border-yellow-500 bg-yellow-50 text-yellow-800" },
  { id: "full",      label: "Lleno",      emoji: "🔴", style: "border-red-500 bg-red-50 text-red-800" },
];

const SPECIALTIES = [
  { id: "urgencias", label: "Urgencias" },
  { id: "cirugia",   label: "Cirugía" },
  { id: "pediatria", label: "Pediatría" },
  { id: "quemados",  label: "Quemados" },
  { id: "trauma",    label: "Trauma" },
  { id: "uci",       label: "UCI" },
];

export default function HospitalPanel({ unit }) {
  const [capacity, setCapacity]     = useState(unit.capacity);
  const [specialties, setSpecialties] = useState(unit.specialties ?? []);
  const [notes, setNotes]           = useState(unit.notes ?? "");
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [savingSpecialties, setSavingSpecialties] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(unit.updatedAt ? new Date(unit.updatedAt) : null);
  const [error, setError]           = useState(null);

  async function patch(body) {
    const res = await fetch(`/api/hospitals/${unit._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al guardar");
    }
    const updated = await res.json();
    setLastUpdated(new Date(updated.updatedAt));
    return updated;
  }

  async function handleCapacity(val) {
    if (val === capacity || savingCapacity) return;
    setSavingCapacity(true);
    setError(null);
    try {
      await patch({ capacity: val });
      setCapacity(val);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingCapacity(false);
    }
  }

  async function handleSpecialtyToggle(id) {
    const next = specialties.includes(id)
      ? specialties.filter((s) => s !== id)
      : [...specialties, id];
    setSpecialties(next);
    setSavingSpecialties(true);
    setError(null);
    try {
      await patch({ specialties: next });
    } catch (e) {
      // Revert on error
      setSpecialties(specialties);
      setError(e.message);
    } finally {
      setSavingSpecialties(false);
    }
  }

  async function handleNotesSave() {
    setError(null);
    try {
      await patch({ notes });
    } catch (e) {
      setError(e.message);
    }
  }

  const timeAgo = lastUpdated
    ? (() => {
        const diff = Math.round((Date.now() - lastUpdated.getTime()) / 60000);
        if (diff < 1) return "hace un momento";
        if (diff === 1) return "hace 1 minuto";
        if (diff < 60) return `hace ${diff} minutos`;
        return `hace ${Math.round(diff / 60)} horas`;
      })()
    : null;

  return (
    <main className="min-h-screen p-6 bg-base-100">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold">🏥 {unit.name}</h1>
          {unit.address && <p className="text-base-content/60 text-sm">{unit.address}</p>}
          {unit.phone && <p className="text-base-content/60 text-sm">📞 {unit.phone}</p>}
          {timeAgo && (
            <p className="text-xs text-base-content/40 mt-1">Última actualización {timeAgo}</p>
          )}
        </div>

        {/* Capacity selector */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Estado de capacidad</h2>
          <div className="grid grid-cols-3 gap-3">
            {CAPACITIES.map((cap) => {
              const isActive = capacity === cap.id;
              return (
                <button
                  key={cap.id}
                  onClick={() => handleCapacity(cap.id)}
                  disabled={savingCapacity}
                  className={`
                    flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all
                    ${isActive ? cap.style + " border-2" : "border-base-300 hover:border-base-400"}
                    ${savingCapacity && !isActive ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {savingCapacity && isActive ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <span className="text-2xl">{cap.emoji}</span>
                  )}
                  <span className="text-sm font-medium">{cap.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Specialties */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Especialidades activas</h2>
            {savingSpecialties && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SPECIALTIES.map((spec) => {
              const active = specialties.includes(spec.id);
              return (
                <label
                  key={spec.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                    ${active ? "border-blue-500 bg-blue-50" : "border-base-300 hover:border-base-400"}`}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={active}
                    onChange={() => handleSpecialtyToggle(spec.id)}
                    disabled={savingSpecialties}
                  />
                  <span className="text-sm font-medium">{spec.label}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Notes */}
        <section className="space-y-2">
          <h2 className="font-semibold text-base">Notas para otros servicios</h2>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            placeholder="Ej. Entrada de ambulancias por puerta lateral. Guardia saturada temporalmente."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button className="btn btn-sm btn-outline" onClick={handleNotesSave}>
            Guardar notas
          </button>
        </section>

        {error && <p className="text-error text-sm">{error}</p>}
      </div>
    </main>
  );
}
