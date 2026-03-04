"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Characters from "./components/Characters";
import Places from "./components/Places";
import WorldRules from "./components/WorldRules";
import Editor from "./components/Editor";
import ExportModal from "./components/ExportModal";
import Board from "./components/Board";

interface Project {
  id: string;
  title: string;
  description: string | null;
  genre: string;
}

interface Publication {
  id: string;
  title: string;
}

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("personajes");
  const [showExport, setShowExport] = useState(false);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProject();
      fetchPublication();
    }
  }, [status]);

  async function fetchProject() {
    const res = await fetch(`/api/projects/single?id=${params.id}`);
    const data = await res.json();
    setProject(data);
  }

  async function fetchPublication() {
    const res = await fetch(`/api/publications?projectId=${params.id}`);
    const data = await res.json();
    setPublication(data);
  }

  async function publishProject() {
    if (!project) return;
    setPublishing(true);
    const res = await fetch("/api/publications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        title: project.title,
        description: project.description,
        genre: project.genre,
      }),
    });
    const data = await res.json();
    setPublication(data);
    setPublishing(false);
    setShowPublishModal(false);
  }

  async function unpublishProject() {
    if (!publication) return;
    if (!confirm("¿Despublicar este proyecto? Se eliminará del feed de la comunidad.")) return;
    setUnpublishing(true);
    await fetch(`/api/publications?id=${publication.id}`, { method: "DELETE" });
    setPublication(null);
    setUnpublishing(false);
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  const tabs = ["personajes", "lugares", "reglas del mundo", "editor", "tablero"];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-zinc-500 hover:text-white transition-colors text-sm"
            >
              ← Mis proyectos
            </button>
            <span className="text-zinc-700">/</span>
            <h1 className="text-sm font-medium">{project.title}</h1>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
              {project.genre}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {publication ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/comunidad/${publication.id}`)}
                  className="text-xs text-green-500 border border-green-900 hover:border-green-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  ✓ Publicado — Ver en comunidad
                </button>
                <button
                  onClick={unpublishProject}
                  disabled={unpublishing}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1.5"
                >
                  {unpublishing ? "..." : "Despublicar"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPublishModal(true)}
                className="text-xs border border-zinc-700 text-zinc-400 hover:border-green-700 hover:text-green-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                ↑ Publicar en comunidad
              </button>
            )}
            <button
              onClick={() => setShowExport(true)}
              className="text-xs border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Exportar
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-zinc-800 px-8">
        <div className="max-w-5xl mx-auto flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-8 py-8">
        {activeTab === "personajes" && <Characters projectId={params.id as string} />}
        {activeTab === "lugares" && <Places projectId={params.id as string} />}
        {activeTab === "reglas del mundo" && <WorldRules projectId={params.id as string} />}
        {activeTab === "editor" && <Editor projectId={params.id as string} />}
        {activeTab === "tablero" && <Board projectId={params.id as string} />}
      </main>

      {/* Modal publicar */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Publicar en la comunidad</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Tu proyecto <span className="text-white font-medium">"{project.title}"</span> aparecerá en el feed de la comunidad. Otros usuarios podrán leerlo, valorarlo y comentarlo.
            </p>
            <div className="bg-zinc-800 rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Título:</span>
                <span className="text-xs text-white">{project.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Género:</span>
                <span className="text-xs text-white">{project.genre}</span>
              </div>
              {project.description && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-zinc-500">Descripción:</span>
                  <span className="text-xs text-zinc-400 line-clamp-2">{project.description}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="flex-1 border border-zinc-700 text-zinc-400 py-2 rounded-lg text-sm hover:border-zinc-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={publishProject}
                disabled={publishing}
                className="flex-1 bg-white text-zinc-900 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {publishing ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExport && (
        <ExportModal
          projectId={params.id as string}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}