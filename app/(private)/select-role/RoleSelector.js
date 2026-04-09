"use client";

import { useState } from "react";

const ROLES = [
  {
    id: "ciudadano",
    label: "Ciudadano",
    emoji: "🧑",
    description: "Reporta emergencias desde tu ubicación y ve hospitales disponibles cerca de ti",
    color: "border-purple-500 hover:bg-purple-50",
    selectedColor: "border-purple-500 bg-purple-50",
    badge: "badge-secondary",
  },
  {
    id: "ambulancia",
    label: "Ambulancia",
    emoji: "🚑",
    description: "Reporta emergencias médicas y accede a hospitales disponibles cercanos",
    color: "border-red-500 hover:bg-red-50",
    selectedColor: "border-red-500 bg-red-50",
    badge: "badge-error",
  },
  {
    id: "policia",
    label: "Policía",
    emoji: "👮",
    description: "Reporta vialidades bloqueadas e incidentes de seguridad en la zona",
    color: "border-blue-500 hover:bg-blue-50",
    selectedColor: "border-blue-500 bg-blue-50",
    badge: "badge-info",
  },
  {
    id: "bomberos",
    label: "Bomberos",
    emoji: "🚒",
    description: "Reporta incendios, daños estructurales y zonas de alto riesgo",
    color: "border-orange-500 hover:bg-orange-50",
    selectedColor: "border-orange-500 bg-orange-50",
    badge: "badge-warning",
  },
  {
    id: "hospital",
    label: "Hospital",
    emoji: "🏥",
    description: "Gestiona la capacidad disponible y especialidades activas de tu unidad",
    color: "border-green-500 hover:bg-green-50",
    selectedColor: "border-green-500 bg-green-50",
    badge: "badge-success",
  },
];

export default function RoleSelector() {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSelect(roleId) {
    if (loading) return;
    setSelected(roleId);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleId }),
      });

      if (!res.ok) throw new Error("Error al asignar el rol");

      window.location.href = "/dashboard";
    } catch (e) {
      setError("Ocurrió un error. Intenta de nuevo.");
      setSelected(null);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-base-100">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">¿Cuál es tu servicio?</h1>
          <p className="text-base-content/60 text-base">
            Selecciona tu tipo de unidad para acceder a tu tablero personalizado
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            const isDisabled = loading && !isSelected;

            return (
              <button
                key={role.id}
                onClick={() => handleSelect(role.id)}
                disabled={isDisabled}
                className={`
                  relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 text-left
                  transition-all duration-150 cursor-pointer
                  ${isSelected ? role.selectedColor : role.color}
                  ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}
                `}
              >
                {/* Emoji */}
                <span className="text-5xl">{role.emoji}</span>

                {/* Label + badge */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{role.label}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-base-content/60 text-center leading-snug">
                  {role.description}
                </p>

                {/* Loading spinner overlay */}
                {isSelected && loading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-base-100/60">
                    <span className="loading loading-spinner loading-md" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-error text-sm">{error}</p>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-base-content/40">
          Tu rol determina qué información ves y qué puedes reportar en SISMA
        </p>
      </div>
    </main>
  );
}
