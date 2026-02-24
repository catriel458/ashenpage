"use client";

import { useState, useEffect } from "react";

interface Character {
  id: string;
  name: string;
  age: string | null;
  personality: string | null;
  backstory: string | null;
  fears: string | null;
  motivations: string | null;
  voice: string | null;
  notes: string | null;
}

const emptyForm = {
  name: "",
  age: "",
  personality: "",
  backstory: "",
  fears: "",
  motivations: "",
  voice: "",
  notes: "",
};

export default function Characters({ projectId }: { projectId: string }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Character | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Character | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, [projectId]);

  async function fetchCharacters() {
    const res = await fetch(`/api/characters?projectId=${projectId}`);
    const data = await res.json();
    setCharacters(data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(character: Character) {
    setEditing(character);
    setForm({
      name: character.name,
      age: character.age || "",
      personality: character.personality || "",
      backstory: character.backstory || "",
      fears: character.fears || "",
      motivations: character.motivations || "",
      voice: character.voice || "",
      notes: character.notes || "",
    });
    setShowModal(true);
  }

  async function saveCharacter() {
    if (!form.name) return;
    setSaving(true);

    if (editing) {
      await fetch("/api/characters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...form }),
      });
    }

    setSaving(false);
    setShowModal(false);
    setSelected(null);
    fetchCharacters();
  }

  async function deleteCharacter(id: string) {
    if (!confirm("¿Eliminar este personaje?")) return;
    await fetch(`/api/characters?id=${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    fetchCharacters();
  }

  if (loading) return <p className="text-zinc-500 text-sm">Cargando personajes...</p>;

  return (
    <div className="flex gap-6">
      {/* Lista */}
      <div className="w-64 flex-shrink-0">
        <button
          onClick={openCreate}
          className="w-full bg-white text-zinc-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors mb-4"
        >
          + Nuevo personaje
        </button>

        {characters.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center mt-8">
            Todavía no hay personajes
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelected(char)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selected?.id === char.id
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {char.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detalle */}
      <div className="flex-1">
        {!selected ? (
          <div className="border border-dashed border-zinc-800 rounded-xl h-64 flex items-center justify-center">
            <p className="text-zinc-600 text-sm">Seleccioná un personaje para ver sus detalles</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => openEdit(selected)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteCharacter(selected.id)}
                  className="text-sm text-zinc-600 hover:text-red-400 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Edad", value: selected.age },
                { label: "Personalidad", value: selected.personality },
                { label: "Backstory", value: selected.backstory },
                { label: "Miedos", value: selected.fears },
                { label: "Motivaciones", value: selected.motivations },
                { label: "Voz / Forma de hablar", value: selected.voice },
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">
              {editing ? "Editar personaje" : "Nuevo personaje"}
            </h3>

            {[
              { key: "name", label: "Nombre *", placeholder: "Nombre del personaje" },
              { key: "age", label: "Edad", placeholder: "Ej: 34 años" },
              { key: "personality", label: "Personalidad", placeholder: "Cómo es..." },
              { key: "backstory", label: "Historia", placeholder: "De dónde viene..." },
              { key: "fears", label: "Miedos", placeholder: "Qué le da miedo..." },
              { key: "motivations", label: "Motivaciones", placeholder: "Qué busca..." },
              { key: "voice", label: "Voz", placeholder: "Cómo habla, qué expresiones usa..." },
              { key: "notes", label: "Notas", placeholder: "Cualquier otra cosa..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-zinc-400 text-sm">{label}</label>
                <textarea
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  rows={key === "name" || key === "age" ? 1 : 2}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
            ))}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-zinc-700 text-zinc-400 py-2 rounded-lg text-sm hover:border-zinc-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveCharacter}
                disabled={saving || !form.name}
                className="flex-1 bg-white text-zinc-900 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear personaje"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}