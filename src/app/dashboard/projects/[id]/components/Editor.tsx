"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Typography from "@tiptap/extension-typography";
import { Mark, mergeAttributes } from "@tiptap/core";

// Marca personalizada para sugerencias de IA
const AISuggestion = Mark.create({
  name: "aiSuggestion",
  addAttributes() {
    return {
      class: {
        default: "ai-suggestion",
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-ai-suggestion]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-ai-suggestion": "true", class: "ai-suggestion" }), 0];
  },
});

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

const fonts = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Courier", value: "Courier New, monospace" },
  { label: "Sans", value: "system-ui, sans-serif" },
];

const aiActions = [
  { key: "continue", label: "Continuar escena" },
  { key: "improve", label: "Sugerir mejoras" },
  { key: "consistency", label: "Revisar consistencia" },
  { key: "alternative", label: "Versión alternativa" },
  { key: "tension", label: "Aumentar tensión" },
];

function ToolbarButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs transition-colors ${
        active ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-white hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

export default function Editor({ projectId }: { projectId: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [scenes, setScenes] = useState<Record<string, Scene[]>>({});
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newSceneTitles, setNewSceneTitles] = useState<Record<string, string>>({});
  const [font, setFont] = useState(fonts[0].value);
  const [fontSize, setFontSize] = useState("18");
  const [focusMode, setFocusMode] = useState(false);
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAction, setAiAction] = useState("continue");
  const [aiTone, setAiTone] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [hasPendingSuggestion, setHasPendingSuggestion] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Underline, Typography, TextStyle, AISuggestion],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-screen",
      },
    },
    onUpdate: ({ editor }) => {
      setSaved(false);
      if (saveTimer) clearTimeout(saveTimer);
      const timer = setTimeout(() => {
        if (selectedScene) saveContent(selectedScene, editor.getHTML());
      }, 1500);
      setSaveTimer(timer);
    },
  });

  useEffect(() => { fetchChapters(); }, [projectId]);

  async function fetchChapters() {
    const res = await fetch(`/api/chapters?projectId=${projectId}`);
    const data = await res.json();
    setChapters(data);
    for (const chapter of data) await fetchScenes(chapter.id);
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
      body: JSON.stringify({ projectId, title: newChapterTitle.trim(), order: chapters.length }),
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
      body: JSON.stringify({ chapterId, title, order: chapterScenes.length }),
    });
    const data = await res.json();
    setScenes((prev) => ({ ...prev, [chapterId]: [...(prev[chapterId] || []), data] }));
    setNewSceneTitles((prev) => ({ ...prev, [chapterId]: "" }));
  }

  async function deleteChapter(id: string) {
    if (!confirm("¿Eliminar este capítulo y todas sus escenas?")) return;
    await fetch(`/api/chapters?id=${id}`, { method: "DELETE" });
    setChapters((prev) => prev.filter((c) => c.id !== id));
    setScenes((prev) => { const next = { ...prev }; delete next[id]; return next; });
    if (selectedScene?.chapterId === id) { setSelectedScene(null); editor?.commands.setContent(""); }
  }

  async function deleteScene(id: string, chapterId: string) {
    if (!confirm("¿Eliminar esta escena?")) return;
    await fetch(`/api/scenes?id=${id}`, { method: "DELETE" });
    setScenes((prev) => ({ ...prev, [chapterId]: prev[chapterId].filter((s) => s.id !== id) }));
    if (selectedScene?.id === id) { setSelectedScene(null); editor?.commands.setContent(""); }
  }

  async function renameChapter(id: string, title: string) {
    await fetch("/api/chapters", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, title }) });
    setChapters((prev) => prev.map((c) => c.id === id ? { ...c, title } : c));
    setEditingChapter(null);
  }

  async function renameScene(id: string, chapterId: string, title: string) {
    await fetch("/api/scenes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, title }) });
    setScenes((prev) => ({ ...prev, [chapterId]: prev[chapterId].map((s) => s.id === id ? { ...s, title } : s) }));
    setEditingScene(null);
  }

  function selectScene(scene: Scene) {
    if (selectedScene?.id === scene.id) return;
    setSelectedScene(scene);
    editor?.commands.setContent(scene.content || "");
    setSaved(true);
    setHasPendingSuggestion(false);
  }

  const saveContent = useCallback(async (scene: Scene, html: string) => {
    setSaving(true);
    await fetch("/api/scenes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: scene.id, content: html }),
    });
    setScenes((prev) => ({
      ...prev,
      [scene.chapterId]: prev[scene.chapterId].map((s) => s.id === scene.id ? { ...s, content: html } : s),
    }));
    setSaving(false);
    setSaved(true);
  }, []);

  async function runAI() {
    if (!selectedScene || !editor) return;
    if (hasPendingSuggestion) {
      alert("Primero aceptá o descartá la sugerencia actual.");
      return;
    }
    setAiLoading(true);

    const context = editor.getText();
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, action: aiAction, context, tone: aiTone }),
    });

    const data = await res.json();
    if (data.text) {
      // Insertar el texto con la marca de IA al final
      const aiText = data.text;
      editor
        .chain()
        .focus()
        .insertContentAt(editor.state.doc.content.size, {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [{ type: "aiSuggestion" }],
              text: aiText,
            },
          ],
        })
        .run();
      setHasPendingSuggestion(true);
    }
    setAiLoading(false);
  }

  function acceptSuggestion() {
    if (!editor) return;
    // Remover la marca aiSuggestion de todo el documento
    const { doc } = editor.state;
    const tr = editor.state.tr;
    doc.descendants((node, pos) => {
      if (node.isText && node.marks.some((m) => m.type.name === "aiSuggestion")) {
        tr.removeMark(pos, pos + node.nodeSize, editor.schema.marks.aiSuggestion);
      }
    });
    editor.view.dispatch(tr);
    setHasPendingSuggestion(false);
  }

  function discardSuggestion() {
    if (!editor) return;
    // Eliminar todos los nodos con marca aiSuggestion
    const { doc } = editor.state;
    const tr = editor.state.tr;
    const toDelete: { from: number; to: number }[] = [];
    doc.descendants((node, pos) => {
      if (node.isText && node.marks.some((m) => m.type.name === "aiSuggestion")) {
        toDelete.push({ from: pos, to: pos + node.nodeSize });
      }
    });
    // Eliminar en orden inverso para no afectar posiciones
    toDelete.reverse().forEach(({ from, to }) => tr.delete(from, to));
    editor.view.dispatch(tr);
    setHasPendingSuggestion(false);
  }

  const wordCount = editor?.getText().trim() === "" ? 0 : editor?.getText().trim().split(/\s+/).length ?? 0;

  return (
    <div className={`flex h-[calc(100vh-120px)] ${focusMode ? "fixed inset-0 z-50 bg-zinc-950" : ""}`}>

      {/* Sidebar */}
      {!focusMode && (
        <div className="w-56 flex-shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">
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
              <button onClick={createChapter} disabled={!newChapterTitle.trim()} className="bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded text-xs transition-colors disabled:opacity-40">+</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chapters.length === 0 ? (
              <p className="text-zinc-700 text-xs text-center mt-8 px-4">Creá tu primer capítulo</p>
            ) : (
              chapters.map((chapter) => (
                <div key={chapter.id} className="border-b border-zinc-900">
                  <div className="flex items-center justify-between px-3 py-2 group">
                    {editingChapter === chapter.id ? (
                      <input autoFocus defaultValue={chapter.title}
                        onBlur={(e) => renameChapter(chapter.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") renameChapter(chapter.id, e.currentTarget.value); if (e.key === "Escape") setEditingChapter(null); }}
                        className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <span onDoubleClick={() => setEditingChapter(chapter.id)} className="text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate cursor-default">{chapter.title}</span>
                    )}
                    <button onClick={() => deleteChapter(chapter.id)} className="text-zinc-700 hover:text-red-400 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>

                  <div className="pb-2">
                    {(scenes[chapter.id] || []).map((scene) => (
                      <div key={scene.id}
                        className={`flex items-center justify-between px-4 py-1.5 group cursor-pointer ${selectedScene?.id === scene.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"}`}
                        onClick={() => selectScene(scene)}
                      >
                        {editingScene === scene.id ? (
                          <input autoFocus defaultValue={scene.title}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => renameScene(scene.id, chapter.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") renameScene(scene.id, chapter.id, e.currentTarget.value); if (e.key === "Escape") setEditingScene(null); }}
                            className="flex-1 bg-zinc-700 border border-zinc-500 rounded px-1 py-0.5 text-xs text-white focus:outline-none"
                          />
                        ) : (
                          <span onDoubleClick={(e) => { e.stopPropagation(); setEditingScene(scene.id); }} className="text-xs truncate">{scene.title}</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); deleteScene(scene.id, chapter.id); }} className="text-zinc-700 hover:text-red-400 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">×</button>
                      </div>
                    ))}

                    <div className="flex gap-1 px-3 pt-1">
                      <input type="text" value={newSceneTitles[chapter.id] || ""}
                        onChange={(e) => setNewSceneTitles((prev) => ({ ...prev, [chapter.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && createScene(chapter.id)}
                        placeholder="Nueva escena..."
                        className="flex-1 bg-transparent border-b border-zinc-800 focus:border-zinc-600 px-1 py-0.5 text-xs text-zinc-600 placeholder-zinc-700 focus:outline-none focus:text-zinc-400 transition-colors"
                      />
                      <button onClick={() => createScene(chapter.id)} disabled={!newSceneTitles[chapter.id]?.trim()} className="text-zinc-700 hover:text-zinc-400 text-xs disabled:opacity-30 transition-colors">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedScene ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-zinc-700 text-sm">Seleccioná una escena para empezar a escribir</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 flex-wrap gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")}><strong>N</strong></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")}><em>I</em></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")}><span className="underline">S</span></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")}><span className="line-through">T</span></ToolbarButton>
                <div className="w-px h-4 bg-zinc-800 mx-1" />
                <select value={font} onChange={(e) => setFont(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-400 focus:outline-none">
                  {fonts.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-400 focus:outline-none w-16">
                  {["14", "16", "18", "20", "22", "24"].map((s) => <option key={s} value={s}>{s}px</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-700">{wordCount} palabras</span>
                <span className={`text-xs ${saving ? "text-zinc-500" : saved ? "text-zinc-700" : "text-zinc-500"}`}>
                  {saving ? "Guardando..." : saved ? "✓ Guardado" : "Sin guardar"}
                </span>
                <button
                  onClick={() => setAiOpen(!aiOpen)}
                  className={`text-xs px-3 py-1 rounded border transition-colors ${aiOpen ? "bg-zinc-700 border-zinc-600 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"}`}
                >
                  ✦ IA
                </button>
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className="text-xs text-zinc-600 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 px-2 py-0.5 rounded"
                >
                  {focusMode ? "Salir del foco" : "Modo foco"}
                </button>
              </div>
            </div>

            {/* Banner sugerencia pendiente */}
            {hasPendingSuggestion && (
              <div className="flex items-center justify-between px-4 py-2 bg-red-950/40 border-b border-red-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-400">Sugerencia de IA pendiente</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={acceptSuggestion}
                    className="text-xs bg-green-900/50 hover:bg-green-800/50 text-green-400 px-3 py-1 rounded border border-green-800/50 transition-colors"
                  >
                    ✓ Aceptar
                  </button>
                  <button
                    onClick={discardSuggestion}
                    className="text-xs bg-red-900/50 hover:bg-red-800/50 text-red-400 px-3 py-1 rounded border border-red-800/50 transition-colors"
                  >
                    ✗ Descartar
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-1 overflow-hidden">
              {/* Texto */}
              <div className="flex-1 overflow-y-auto px-16 py-10" style={{ fontFamily: font, fontSize: `${fontSize}px` }}>
                <div className="max-w-2xl mx-auto">
                  <EditorContent editor={editor} />
                </div>
              </div>

              {/* Panel IA */}
              {aiOpen && (
                <div className="w-72 flex-shrink-0 border-l border-zinc-800 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">✦ Asistente IA</h3>
                    <div className="flex flex-col gap-2 mb-3">
                      {aiActions.map((action) => (
                        <button
                          key={action.key}
                          onClick={() => setAiAction(action.key)}
                          className={`text-left px-3 py-2 rounded text-xs transition-colors ${aiAction === action.key ? "bg-zinc-700 text-white" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      placeholder="Tono (ej: oscuro, poético...)"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 mb-3"
                    />
                    <button
                      onClick={runAI}
                      disabled={aiLoading || hasPendingSuggestion}
                      className="w-full bg-white text-zinc-900 py-2 rounded text-xs font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      {aiLoading ? "Generando..." : hasPendingSuggestion ? "Resolvé la sugerencia primero" : "Generar"}
                    </button>
                  </div>

                  <div className="flex-1 p-4">
                    {!hasPendingSuggestion && !aiLoading && (
                      <p className="text-zinc-700 text-xs text-center mt-4">
                        El texto generado aparecerá en rojo directamente en el editor
                      </p>
                    )}
                    {aiLoading && (
                      <div className="flex items-center justify-center h-24">
                        <p className="text-zinc-600 text-xs">Generando...</p>
                      </div>
                    )}
                    {hasPendingSuggestion && !aiLoading && (
                      <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3 mt-2">
                        <p className="text-red-400 text-xs leading-relaxed">
                          El texto en rojo en el editor es la sugerencia de la IA. Podés editarlo antes de aceptarlo.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}