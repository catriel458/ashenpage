"use client";

import { useState, useEffect } from "react";

interface WorldRule {
  id: string;
  category: string;
  title: string;
  description: string | null;
}

const emptyForm = { category: "Magia", title: "", description: "" };

const categories = ["Magia", "Tecnología", "Sociedad", "Geografía", "Historia", "Religión", "Otro"];

export default function WorldRules({ projectId }: { projectId: string }) {
  const [rules, setRules] = useState<WorldRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WorldRule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRules(); }, [projectId]);

  async function fetchRules() {
    const res = await fetch(`/api/world-rules?projectId=${projectId}`);
    const data = await res.json();
    setRules(data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(rule: WorldRule) {
    setEditing(rule);
    setForm({
      category: rule.category,
      title: rule.title,
      description: rule.description || "",
    });
    setShowModal(true);
  }

  async function saveRule() {
    if (!form.title) return;
    setSaving(true);
    if (editing) {
      await fetch("/api/world-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch("/api/world-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...form }),
      });
    }
    setSaving(false);
    setShowModal(false);
    fetchRules();
  }

  async function deleteRule(id: string) {
    if (!confirm("¿Eliminar esta regla?")) return;
    await fetch(`/api/world-rules?id=${id}`, { method: "DELETE" });
    fetchRules();
  }

  const grouped = categories.reduce((acc, cat) => {
    const catRules = rules.filter((r) => r.category === cat);
    if (catRules.length > 0) acc[cat] = catRules;
    return acc;
  }, {} as Record<string, WorldRule[]>);

  if (loading) return <p className="text-zinc-500 text-sm">Cargando reglas...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-zinc-500 text-sm">
          {rules.length === 0 ? "Definí las reglas de tu universo" : `${rules.length} regla${rules.length > 1 ? "s" : ""}`}
        </p>
        <button
          onClick={openCreate}
          className="bg-white text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          + Nueva regla
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl h-64 flex items-center justify-center">
          <p className="text-zinc-600 text-sm">Las reglas de tu mundo aparecerán acá</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([category, catRules]) => (
            <div key={category}>
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 group"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{rule.title}</h4>
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(rule)}
                          className="text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {rule.description && (
                      <p className="text-zinc-500 text-sm">{rule.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg flex flex-col gap-4">
            <h3 className="text-lg font-semibold">{editing ? "Editar regla" : "Nueva regla"}</h3>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Título *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: La magia consume vida"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Explicá esta regla en detalle..."
                rows={3}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-zinc-700 text-zinc-400 py-2 rounded-lg text-sm hover:border-zinc-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveRule}
                disabled={saving || !form.title}
                className="flex-1 bg-white text-zinc-900 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear regla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}