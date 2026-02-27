"use client";

import { useState, useEffect } from "react";

interface Scene {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  synopsis: string;
  status: string;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
}

interface SceneWithChapter extends Scene {
  chapterTitle: string;
}

const COLUMNS = [
  { id: "borrador", label: "Borrador", icon: "📋", color: "border-zinc-700" },
  { id: "en_progreso", label: "En progreso", icon: "✍️", color: "border-blue-800" },
  { id: "revisar", label: "Revisar", icon: "🔄", color: "border-yellow-800" },
  { id: "completa", label: "Completa", icon: "✅", color: "border-green-800" },
];

function wordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text === "" ? 0 : text.split(/\s+/).length;
}

export default function Board({ projectId }: { projectId: string }) {
  const [scenes, setScenes] = useState<SceneWithChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ synopsis: string }>({ synopsis: "" });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  async function fetchData() {
    const chaptersRes = await fetch(`/api/chapters?projectId=${projectId}`);
    const chapters: Chapter[] = await chaptersRes.json();

    const allScenes: SceneWithChapter[] = [];
    for (const chapter of chapters) {
      const scenesRes = await fetch(`/api/scenes?chapterId=${chapter.id}`);
      const chapterScenes: Scene[] = await scenesRes.json();
      chapterScenes.forEach((scene) => {
        allScenes.push({ ...scene, chapterTitle: chapter.title });
      });
    }

    setScenes(allScenes);
    setLoading(false);
  }

  async function updateStatus(sceneId: string, status: string) {
    setScenes((prev) => prev.map((s) => s.id === sceneId ? { ...s, status } : s));
    await fetch("/api/scenes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sceneId, status }),
    });
  }

  async function saveSynopsis(sceneId: string) {
    setScenes((prev) => prev.map((s) => s.id === sceneId ? { ...s, synopsis: editValues.synopsis } : s));
    await fetch("/api/scenes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sceneId, synopsis: editValues.synopsis }),
    });
    setEditingScene(null);
  }

  function handleDragStart(sceneId: string) {
    setDragging(sceneId);
  }

  function handleDragOver(e: React.DragEvent, columnId: string) {
    e.preventDefault();
    setDragOver(columnId);
  }

  function handleDrop(e: React.DragEvent, columnId: string) {
    e.preventDefault();
    if (dragging) updateStatus(dragging, columnId);
    setDragging(null);
    setDragOver(null);
  }

  const totalWords = scenes.reduce((acc, s) => acc + wordCount(s.content || ""), 0);
  const completedCount = scenes.filter((s) => s.status === "completa").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-600 text-sm">Cargando tablero...</p>
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-600 text-sm">Creá escenas en el editor para verlas acá</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Stats */}
      <div className="flex items-center gap-6 flex-wrap">
        {[
          { label: "Escenas totales", value: scenes.length },
          { label: "Completadas", value: `${completedCount}/${scenes.length}` },
          { label: "Palabras totales", value: totalWords.toLocaleString() },
          { label: "Progreso", value: `${scenes.length > 0 ? Math.round((completedCount / scenes.length) * 100) : 0}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2">
            <p className="text-xs text-zinc-600">{stat.label}</p>
            <p className="text-white font-semibold text-sm">{stat.value}</p>
          </div>
        ))}

        {/* Barra de progreso */}
        <div className="flex-1 min-w-48">
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${scenes.length > 0 ? (completedCount / scenes.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Columnas */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnScenes = scenes.filter((s) => (s.status || "borrador") === column.id);
          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-60 flex flex-col gap-2 rounded-xl border-t-2 ${column.color} ${dragOver === column.id ? "bg-zinc-900/50" : ""} transition-colors`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Header columna */}
              <div className="flex items-center justify-between px-2 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <span>{column.icon}</span>
                  <span className="text-xs font-semibold text-zinc-400">{column.label}</span>
                </div>
                <span className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">{columnScenes.length}</span>
              </div>

              {/* Tarjetas */}
              <div className="flex flex-col gap-2 px-2 pb-3 min-h-24">
                {columnScenes.length === 0 && (
                  <div className={`border border-dashed border-zinc-800 rounded-lg p-4 text-center ${dragOver === column.id ? "border-zinc-600" : ""}`}>
                    <p className="text-zinc-700 text-xs">Arrastrá escenas acá</p>
                  </div>
                )}

                {columnScenes.map((scene) => (
                  <div
                    key={scene.id}
                    draggable
                    onDragStart={() => handleDragStart(scene.id)}
                    className={`bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2 cursor-grab hover:border-zinc-700 transition-colors ${dragging === scene.id ? "opacity-40" : ""}`}
                  >
                    {/* Título y capítulo */}
                    <div>
                      <p className="text-white text-xs font-medium leading-snug">{scene.title}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{scene.chapterTitle}</p>
                    </div>

                    {/* Sinopsis */}
                    {editingScene === scene.id ? (
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          autoFocus
                          value={editValues.synopsis}
                          onChange={(e) => setEditValues({ synopsis: e.target.value })}
                          placeholder="Sinopsis corta..."
                          rows={3}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                        />
                        <div className="flex gap-1">
                          <button onClick={() => saveSynopsis(scene.id)} className="flex-1 bg-white text-zinc-900 py-1 rounded text-xs font-medium hover:bg-zinc-200 transition-colors">
                            Guardar
                          </button>
                          <button onClick={() => setEditingScene(null)} className="flex-1 text-zinc-600 hover:text-zinc-400 py-1 rounded text-xs transition-colors">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => { setEditingScene(scene.id); setEditValues({ synopsis: scene.synopsis || "" }); }}
                        className="cursor-pointer"
                      >
                        {scene.synopsis ? (
                          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{scene.synopsis}</p>
                        ) : (
                          <p className="text-zinc-700 text-xs italic">+ Agregar sinopsis</p>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-zinc-700 text-xs">{wordCount(scene.content || "")} palabras</span>
                      <select
                        value={scene.status || "borrador"}
                        onChange={(e) => updateStatus(scene.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-400 focus:outline-none cursor-pointer"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}