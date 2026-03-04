"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Publication {
  id: string;
  title: string;
  description: string | null;
  genre: string;
  publishedAt: string;
  authorName: string | null;
  authorImage: string | null;
  avgRating: number | null;
  ratingCount: number;
  coverImage: string | null;
}

function StarDisplay({ rating, count }: { rating: number | null; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-xs ${rating && s <= Math.round(rating) ? "text-yellow-400" : "text-zinc-700"}`}>
          ★
        </span>
      ))}
      <span className="text-xs text-zinc-600 ml-1">
        {rating ? `${rating} (${count})` : "Sin valoraciones"}
      </span>
    </div>
  );
}

export default function ComunidadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("Todos");

  useEffect(() => {
    fetchPublications();
  }, []);

  async function fetchPublications() {
    const res = await fetch("/api/publications");
    const data = await res.json();
    setPublications(data);
    setLoading(false);
  }

  const genres = ["Todos", "Horror", "Ciencia Ficción", "Fantasía", "Terror Gótico", "Thriller", "Otro"];

  const filtered = publications.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.authorName?.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genreFilter === "Todos" || p.genre === genreFilter;
    return matchSearch && matchGenre;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-xl font-bold hover:opacity-80 transition-opacity">
            Ashen<span className="text-zinc-400">page</span>
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="text-xs text-zinc-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg">
              ← Mis proyectos
            </button>
            {session?.user && (
              <button onClick={() => router.push("/dashboard/profile")} className="text-xs text-zinc-500 hover:text-white transition-colors">
                {session.user.name}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Comunidad</h1>
          <p className="text-zinc-500 text-sm">Obras publicadas por escritores de Ashenpage</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o autor..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <div className="flex gap-2 flex-wrap">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenreFilter(g)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  genreFilter === g
                    ? "bg-white text-zinc-900 border-white"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-zinc-600 text-sm">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-xl p-16 flex flex-col items-center justify-center gap-3">
            <p className="text-zinc-600 text-sm">
              {publications.length === 0 ? "Todavía no hay obras publicadas" : "No hay resultados para tu búsqueda"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((pub) => (
              <div
                key={pub.id}
                onClick={() => router.push(`/comunidad/${pub.id}`)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col hover:border-zinc-600 transition-colors cursor-pointer group"
              >
                {/* Portada */}
                <div className="h-36 bg-zinc-800 overflow-hidden">
                  {pub.coverImage ? (
                    <img
                      src={pub.coverImage}
                      alt="portada"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-zinc-700 text-xs">Sin portada</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
                      {pub.genre}
                    </span>
                    <span className="text-xs text-zinc-700">
                      {new Date(pub.publishedAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-zinc-200 transition-colors">
                      {pub.title}
                    </h3>
                    {pub.description && (
                      <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{pub.description}</p>
                    )}
                  </div>
                  <div className="mt-auto flex flex-col gap-2">
                    <StarDisplay rating={pub.avgRating} count={pub.ratingCount} />
                    <div className="flex items-center gap-2">
                      {pub.authorImage ? (
                        <img src={pub.authorImage} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                          {pub.authorName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs text-zinc-500">{pub.authorName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}