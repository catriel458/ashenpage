"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Characters from "./components/Characters";
import Places from "./components/Places";
import WorldRules from "./components/WorldRules";

interface Project {
  id: string;
  title: string;
  description: string | null;
  genre: string;
}

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("personajes");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchProject();
  }, [status]);

  async function fetchProject() {
    const res = await fetch(`/api/projects/single?id=${params.id}`);
    const data = await res.json();
    setProject(data);
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  const tabs = ["personajes", "lugares", "reglas del mundo"];

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
      </main>
    </div>
  );
}