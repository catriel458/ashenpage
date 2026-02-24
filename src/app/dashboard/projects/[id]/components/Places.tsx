"use client";

import { useState, useEffect } from "react";

interface Place {
  id: string;
  name: string;
  description: string | null;
  atmosphere: string | null;
  notes: string | null;
}

const emptyForm = { name: "", description: "", atmosphere: "", notes: "" };

export default function Places({ projectId }: { projectId: string }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);

  useEffect(() => { fetchPlaces(); }, [projectId]);

  async function fetchPlaces() {
    const res = await fetch(`/api/places?projectId=${projectId}`);
    const data = await res.json();
    setPlaces(data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(place: Place) {
    setEditing(place);
    setForm({
      name: place.name,
      description: place.description || "",
      atmosphere: place.atmosphere || "",
      notes: place.notes || "",
    });
    setShowModal(true);
  }

  async function savePlace() {
    if (!form.name) return;
    setSaving(true);
    if (editing) {
      await fetch("/api/places", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...form }),
      });
    }
    setSaving(false);
    setShowModal(false);
    setSelected(null);
    fetchPlaces();
  }

  async function deletePlace(id: string) {
    if (!confirm("¿Eliminar este lugar?")) return;
    await fetch(`/api/places?id=${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    fetchPlaces();
  }

  if (loading) return <p className="text-zinc-500 text-sm">Cargando lugares...</p>;

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0">
        <button onClick={openCreate} className="w-full bg-white text-zinc-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors mb-4">
          + Nuevo lugar
        </button>
        {places.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center mt-8">Todavía no hay lugares</p>
        ) : (
          <div className="flex flex-col gap-2">
            {places.map((place) => (
              <button
                key={place.id}
                onClick={() => setSelected(place)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selected?.id === place.id ? "bg-zinc-700 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {place.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1">
        {!selected ? (
          <div className="border border-dashed border-zinc-800 rounded-xl h-64 flex items-center justify-center">
            <p className="text-zinc-600 text-sm">Seleccioná un lugar para ver sus detalles</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <div className="flex gap-3">
                <button onClick={() => openEdit(selected)} className="text-sm text-zinc-400 hover:text-white transition-colors">Editar</button>
                <button onClick={() => deletePlace(selected.id)} className="text-sm text-zinc-600 hover:text-red-400 transition-colors">Eliminar</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Descripción", value: selected.description },
                { label: "Atmósfera", value: selected.atmosphere },
                { label: "Notas", value: selected.notes },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-zinc-500 text-xs uppercase tracking-wider">{label}</span>
                    <span className="text-zinc-300 text-sm">{value}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg flex flex-col gap-4">
            <h3 className="text-lg font-semibold">{editing ? "Editar lugar" : "Nuevo lugar"}</h3>
            {[
              { key: "name", label: "Nombre *", placeholder: "Nombre del lugar" },
              { key: "description", label: "Descripción", placeholder: "Cómo es este lugar..." },
              { key: "atmosphere", label: "Atmósfera", placeholder: "Qué se siente estar ahí..." },
              { key: "notes", label: "Notas", placeholder: "Cualquier otra cosa..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-zinc-400 text-sm">{label}</label>
                <textarea
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  rows={key === "name" ? 1 : 2}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
            ))}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-zinc-700 text-zinc-400 py-2 rounded-lg text-sm hover:border-zinc-500 transition-colors">Cancelar</button>
              <button onClick={savePlace} disabled={saving || !form.name} className="flex-1 bg-white text-zinc-900 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear lugar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}