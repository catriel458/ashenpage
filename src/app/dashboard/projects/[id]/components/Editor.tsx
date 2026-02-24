"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Chapter {
  id: string;
  title: string;
  order: number;
}

interface Scene {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  order: number;
}

export default function Editor({ projectId }: { projectId: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [scenes, setScenes] = useState<Record<string, Scene[]>>({});
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newSceneTitles, setNewSceneTitles] = useState<Record<string, string>>({});
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchChapters();
  }, [projectId]);

  async function fetchChapters() {
    const res = await fetch(`/api/chapters?projectId=${projectId}`);
    const data = await res.json();
    setChapters(data);
    for (const chapter of data) {
      await fetchScenes(chapter.id);
    }
  }

  async function fetchScenes(chapterId: string) {
    const res = await fetch(`/api/scenes?chapterId=${chapterId}`);
    const data = await res.json();
    setScenes((prev) => ({ ...prev, [chapterId]: data }));
  }

  async function createChapter() {
    if (!newChapterTitle.trim()) return;
    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: newChapterTitle.trim(),
        order: chapters.length,
      }),
    });
    const data = await res.json();
    setChapters((prev) => [...prev, data]);
    setScenes((prev) => ({ ...prev, [data.id]: [] }));
    setNewChapterTitle("");
  }

  async function createScene(chapterId: string) {
    const title = newSceneTitles[chapterId]?.trim();
    if (!title) return;
    const chapterScenes = scenes[chapterId] || [];
    const res = await fetch("/api/scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterId,
        title,
        order: chapterScenes.length,
      }),
    });
    const data = await res.json();
    setScenes((prev) => ({
      ...prev,
      [chapterId]: [...(prev[chapterId] || []), data],
    }));
    setNewSceneTitles((prev) => ({ ...prev, [chapterId]: "" }));
  }

  async function deleteChapter(id: string) {
    if (!confirm("¿Eliminar este capítulo y todas sus escenas?")) return;
    await fetch(`/api/chapters?id=${id}`, { method: "DELETE" });
    setChapters((prev) => prev.filter((c) => c.id !== id));
    setScenes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (selectedScene?.chapterId === id) {
      setSelectedScene(null);
      setContent("");
    }
  }

  async function deleteScene(id: string, chapterId: string) {
    if (!confirm("¿Eliminar esta escena?")) return;
    await fetch(`/api/scenes?id=${id}`, { method: "DELETE" });
    setScenes((prev) => ({
      ...prev,
      [chapterId]: prev[chapterId].filter((s) => s.id !== id),
    }));
    if (selectedScene?.id === id) {
      setSelectedScene(null);
      setContent("");
    }
  }

  async function renameChapter(id: string, title: string) {
    await fetch("/api/chapters", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title }),
    });
    setChapters((prev) => prev.map((c) => c.id === id ? { ...c, title } : c));
    setEditingChapter(null);
  }

  async function renameScene(id: string, chapterId: string, title: string) {
    await fetch("/api/scenes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title }),
    });
    setScenes((prev) => ({
      ...prev,
      [chapterId]: prev[chapterId].map((s) => s.id === id ? { ...s, title } : s),
    }));
    setEditingScene(null);
  }

  function selectScene(scene: Scene) {
    if (selectedScene?.id === scene.id) return;
    if (!saved) saveContent(selectedScene!, content);
    setSelectedScene(scene);
    setContent(scene.content || "");
    setSaved(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  const saveContent = useCallback(async (scene: Scene, text: string) => {
    setSaving(true);
    await fetch("/api/scenes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: scene.id, content: text }),
    });
    setScenes((prev) => ({
      ...prev,
      [scene.chapterId]: prev[scene.chapterId].map((s) =>
        s.id === scene.id ? { ...s, content: text } : s
      ),
    }));
    setSaving(false);
    setSaved(true);
  }, []);

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (selectedScene) saveContent(selectedScene, val);
    }, 1500);
  }

  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const charCount = content.length;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0">

      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-zinc-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createChapter()}
              placeholder="Nuevo capítulo..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            <button
              onClick={createChapter}
              disabled={!newChapterTitle.trim()}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded text-xs transition-colors disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chapters.length === 0 ? (
            <p className="text-zinc-700 text-xs text-center mt-8 px-4">
              Creá tu primer capítulo
            </p>
          ) : (
            chapters.map((chapter) => (
              <div key={chapter.id} className="border-b border-zinc-900">
                {/* Chapter header */}
                <div className="flex items-center justify-between px-3 py-2 group">
                  {editingChapter === chapter.id ? (
                    <input
                      autoFocus
                      defaultValue={chapter.title}
                      onBlur={(e) => renameChapter(chapter.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameChapter(chapter.id, e.currentTarget.value);
                        if (e.key === "Escape") setEditingChapter(null);
                      }}
                      className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-xs text-white focus:outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => setEditingChapter(chapter.id)}
                      className="text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate cursor-default"
                    >
                      {chapter.title}
                    </span>
                  )}
                  <button
                    onClick={() => deleteChapter(chapter.id)}
                    className="text-zinc-700 hover:text-red-400 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>

                {/* Scenes */}
                <div className="pb-2">
                  {(scenes[chapter.id] || []).map((scene) => (
                    <div
                      key={scene.id}
                      className={`flex items-center justify-between px-4 py-1.5 group cursor-pointer ${
                        selectedScene?.id === scene.id
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                      }`}
                      onClick={() => selectScene(scene)}
                    >
                      {editingScene === scene.id ? (
                        <input
                          autoFocus
                          defaultValue={scene.title}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => renameScene(scene.id, chapter.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renameScene(scene.id, chapter.id, e.currentTarget.value);
                            if (e.key === "Escape") setEditingScene(null);
                          }}
                          className="flex-1 bg-zinc-700 border border-zinc-500 rounded px-1 py-0.5 text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => { e.stopPropagation(); setEditingScene(scene.id); }}
                          className="text-xs truncate"
                        >
                          {scene.title}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteScene(scene.id, chapter.id); }}
                        className="text-zinc-700 hover:text-red-400 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Nueva escena */}
                  <div className="flex gap-1 px-3 pt-1">
                    <input
                      type="text"
                      value={newSceneTitles[chapter.id] || ""}
                      onChange={(e) => setNewSceneTitles((prev) => ({ ...prev, [chapter.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && createScene(chapter.id)}
                      placeholder="Nueva escena..."
                      className="flex-1 bg-transparent border-b border-zinc-800 focus:border-zinc-600 px-1 py-0.5 text-xs text-zinc-600 placeholder-zinc-700 focus:outline-none focus:text-zinc-400 transition-colors"
                    />
                    <button
                      onClick={() => createScene(chapter.id)}
                      disabled={!newSceneTitles[chapter.id]?.trim()}
                      className="text-zinc-700 hover:text-zinc-400 text-xs disabled:opacity-30 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedScene ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-zinc-700 text-sm">Seleccioná una escena para empezar a escribir</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-8 py-3 border-b border-zinc-900">
              <h2 className="text-sm text-zinc-400">{selectedScene.title}</h2>
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-700">{wordCount} palabras</span>
                <span className="text-xs text-zinc-700">{charCount} caracteres</span>
                <span className={`text-xs ${saving ? "text-zinc-500" : saved ? "text-zinc-700" : "text-zinc-500"}`}>
                  {saving ? "Guardando..." : saved ? "Guardado" : "Sin guardar"}
                </span>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 overflow-y-auto px-16 py-10">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder="Escribí tu historia acá..."
                className="w-full max-w-2xl mx-auto block bg-transparent text-zinc-300 text-base leading-8 resize-none focus:outline-none placeholder-zinc-800 min-h-full"
                style={{ minHeight: "calc(100vh - 250px)" }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}