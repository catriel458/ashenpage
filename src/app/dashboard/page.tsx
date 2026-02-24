"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
  description: string | null;
  genre: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", genre: "Horror" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchProjects();
  }, [status]);

  async function fetchProjects() {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  }

  async function createProject() {
    if (!form.title) return;
    setCreating(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", description: "", genre: "Horror" });
    setShowModal(false);
    setCreating(false);
    fetchProjects();
  }

  async function deleteProject(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    fetchProjects();
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">
            Ashen<span className="text-zinc-400">page</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 text-sm">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Mis proyectos</h2>
            <p className="text-zinc-500 text-sm mt-1">
              {projects.length === 0 ? "Todavía no tenés proyectos" : `${projects.length} proyecto${projects.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            + Nuevo proyecto
          </button>
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-xl p-16 flex flex-col items-center justify-center gap-3">
            <p className="text-zinc-600 text-sm">Tu primera historia te está esperando</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-zinc-400 hover:text-white text-sm underline transition-colors"
            >
              Crear proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-600 transition-colors cursor-pointer group"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
                    {project.genre}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                    className="text-zinc-700 hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100"
                  >
                    Eliminar
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{project.title}</h3>
                  {project.description && (
                    <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{project.description}</p>
                  )}
                </div>
                <p className="text-zinc-700 text-xs mt-auto">
                  {new Date(project.createdAt).toLocaleDateString("es-AR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal nuevo proyecto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Nuevo proyecto</h3>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Título *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="El nombre de tu historia"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="De qué trata tu historia..."
                rows={3}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Género *</label>
              <select
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
              >
                <option value="Horror">Horror</option>
                <option value="Ciencia Ficción">Ciencia Ficción</option>
                <option value="Fantasía">Fantasía</option>
                <option value="Terror Gótico">Terror Gótico</option>
                <option value="Thriller">Thriller</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-zinc-700 text-zinc-400 py-2 rounded-lg text-sm hover:border-zinc-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createProject}
                disabled={creating || !form.title}
                className="flex-1 bg-white text-zinc-900 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {creating ? "Creando..." : "Crear proyecto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}