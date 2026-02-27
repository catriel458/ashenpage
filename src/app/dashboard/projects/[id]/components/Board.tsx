"use client";

import { useState, useEffect } from "react";

interface Scene {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  synopsis: string;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
}

export default function Board({ projectId }: { projectId: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [synopsisValues, setSynopsisValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [projectId]);

  async function fetchData() {
    const res = await fetch(`/api/chapters?projectId=${projectId}`);
    const chaptersData = await res.json();

    const chaptersWithScenes = await Promise.all(
      chaptersData.map(async (chapter: Chapter) => {
        const scenesRes = await fetch(`/api/scenes?chapterId=${chapter.id}`);
        const scenes = await scenesRes.json();
        return { ...chapter, scenes };
      })
    );

    setChapters(chaptersWithScenes);

    // Inicializar valores de sinopsis
    const initialSynopsis: Record<string, string> = {};
    chaptersWithScenes.forEach((chapter: Chapter) => {
      chapter.scenes.forEach((scene: Scene) => {
        initialSynopsis[scene.id] = scene.synopsis || "";
      });
    });
    setSynopsisValues(initialSynopsis);
    setLoading(false);
  }

  async function saveSynopsis(sceneId: string) {
    await fetch("/api/scenes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sceneId, synopsis: synopsisValues[sceneId] }),
    });
    setEditingScene(null);
  }

  const totalScenes = chapters.reduce((acc, c) => acc + c.scenes.length, 0);
  const scenesWithSynopsis = chapters.reduce((acc, c) => acc + c.scenes.filter(s => s.synopsis).length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-600 text-sm">Cargando tablero...</p>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-600 text-sm">Creá capítulos y escenas en el editor para verlos acá</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Stats */}
      <div className="flex items-center gap-6 text-xs text-zinc-600">
        <span>{chapters.length} capítulos</span>
        <span>{totalScenes} escenas</span>
        <span>{scenesWithSynopsis}/{totalScenes} con sinopsis</span>
      </div>

      {/* Tablero */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="flex-shrink-0 w-56">

            {/* Header capítulo */}
            <div className="mb-3 px-1">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate">
                {chapter.title}
              </h3>
              <p className="text-xs text-zinc-700 mt-0.5">{chapter.scenes.length} escenas</p>
            </div>

            {/* Tarjetas de escenas */}
            <div className="flex flex-col gap-2">
              {chapter.scenes.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-lg p-4 text-center">
                  <p className="text-zinc-700 text-xs">Sin escenas</p>
                </div>
              ) : (
                chapter.scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2 hover:border-zinc-700 transition-colors"
                  >
                    <p className="text-white text-xs font-medium truncate">{scene.title}</p>

                    {editingScene === scene.id ? (
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          autoFocus
                          value={synopsisValues[scene.id] || ""}
                          onChange={(e) => setSynopsisValues((prev) => ({ ...prev, [scene.id]: e.target.value }))}
                          placeholder="Escribí una sinopsis corta..."
                          rows={3}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveSynopsis(scene.id)}
                            className="flex-1 bg-white text-zinc-900 py-1 rounded text-xs font-medium hover:bg-zinc-200 transition-colors"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingScene(null)}
                            className="flex-1 text-zinc-600 hover:text-zinc-400 py-1 rounded text-xs transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingScene(scene.id)}
                        className="cursor-pointer"
                      >
                        {synopsisValues[scene.id] ? (
                          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3">
                            {synopsisValues[scene.id]}
                          </p>
                        ) : (
                          <p className="text-zinc-700 text-xs italic">
                            + Agregar sinopsis
                          </p>
                        )}
                      </div>
                    )}

                    {/* Indicador de contenido */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${scene.content && scene.content !== "<p></p>" ? "bg-green-600" : "bg-zinc-700"}`} />
                      <span className="text-zinc-700 text-xs">
                        {scene.content && scene.content !== "<p></p>" ? "Con contenido" : "Sin contenido"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}