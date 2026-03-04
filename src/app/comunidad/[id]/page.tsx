"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import CoverCropper from "@/components/CoverCropper";

interface Chapter {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
}

interface Scene {
  id: string;
  title: string;
  content: string;
  order: number;
}

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
  chapters: Chapter[];
  coverImage: string | null;
  userId: string;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  authorName: string | null;
  authorImage: string | null;
}

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
          className={`text-xl transition-colors ${
            s <= (hover || value) ? "text-yellow-400" : "text-zinc-700"
          } ${!readonly ? "hover:scale-110 transition-transform cursor-pointer" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PublicationPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();

  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    fetchPublication();
    fetchComments();
    if (session?.user) fetchUserRating();
  }, [id, session]);

  async function fetchPublication() {
    const res = await fetch(`/api/publications?id=${id}`);
    const data = await res.json();
    setPublication(data);
    if (data.chapters?.length > 0) {
      setSelectedChapter(data.chapters[0].id);
      if (data.chapters[0].scenes?.length > 0) {
        setSelectedScene(data.chapters[0].scenes[0]);
      }
    }
    setLoading(false);
  }

  async function fetchComments() {
    const res = await fetch(`/api/publication-comments?publicationId=${id}`);
    const data = await res.json();
    setComments(data);
  }

  async function fetchUserRating() {
    const res = await fetch(`/api/ratings?publicationId=${id}`);
    const data = await res.json();
    if (data?.stars) {
      setUserRating(data.stars);
      setRatingSubmitted(true);
    }
  }

  async function submitRating(stars: number) {
    if (!session?.user) { router.push("/login"); return; }
    setUserRating(stars);
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicationId: id, stars }),
    });
    setRatingSubmitted(true);
    fetchPublication();
  }

  async function uploadCover(file: File) {
    setShowCropper(false);
    setUploadingCover(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) {
      await fetch("/api/publications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, coverImage: data.url }),
      });
      setPublication((prev) => prev ? { ...prev, coverImage: data.url } : prev);
    }
    setUploadingCover(false);
  }

  async function postComment() {
    if (!session?.user) { router.push("/login"); return; }
    if (!newComment.trim()) return;
    setPosting(true);
    const res = await fetch("/api/publication-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicationId: id, text: newComment }),
    });
    const comment = await res.json();
    setComments((prev) => [comment, ...prev]);
    setNewComment("");
    setPosting(false);
  }

  async function deleteComment(commentId: string) {
    await fetch(`/api/publication-comments?id=${commentId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  const isAuthor = session?.user?.id === publication?.userId;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Publicación no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/comunidad")} className="text-xl font-bold hover:opacity-80 transition-opacity">
            Ashen<span className="text-zinc-400">page</span>
          </button>
          <button onClick={() => router.push("/comunidad")} className="text-xs text-zinc-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg">
            ← Comunidad
          </button>
        </div>
      </header>

      {/* Portada hero */}
      <div className="relative w-full h-64 bg-zinc-900 overflow-hidden">
        {publication.coverImage ? (
          <img src={publication.coverImage} alt="portada" className="w-full h-full object-contain opacity-80" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-zinc-800 text-sm">Sin portada</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

        {isAuthor && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={() => setShowCropper(true)}
              disabled={uploadingCover}
              className="text-xs bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm"
            >
              {uploadingCover ? "Subiendo..." : publication.coverImage ? "✎ Cambiar portada" : "＋ Agregar portada"}
            </button>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10 flex gap-8">

        {/* Sidebar — índice */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div className="sticky top-8">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-3">Índice</p>
            <div className="flex flex-col gap-1">
              {publication.chapters.map((chapter) => (
                <div key={chapter.id}>
                  <button
                    onClick={() => setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
                    className="text-xs text-zinc-400 hover:text-white w-full text-left py-1 transition-colors font-medium"
                  >
                    {chapter.title}
                  </button>
                  {selectedChapter === chapter.id && (
                    <div className="ml-3 flex flex-col gap-0.5">
                      {chapter.scenes.map((scene) => (
                        <button
                          key={scene.id}
                          onClick={() => setSelectedScene(scene)}
                          className={`text-xs py-0.5 text-left transition-colors ${
                            selectedScene?.id === scene.id ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                          }`}
                        >
                          {scene.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 min-w-0">
          {/* Info del proyecto */}
          <div className="mb-8 pb-8 border-b border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">{publication.genre}</span>
              <span className="text-xs text-zinc-700">{formatDate(publication.publishedAt)}</span>
            </div>
            <h1 className="text-3xl font-bold mb-3">{publication.title}</h1>
            {publication.description && (
              <p className="text-zinc-400 leading-relaxed mb-4">{publication.description}</p>
            )}
            <div className="flex items-center gap-3">
              {publication.authorImage ? (
                <img src={publication.authorImage} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                  {publication.authorName?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-zinc-400">{publication.authorName}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-8 pb-8 border-b border-zinc-800">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Valoración general</p>
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(publication.avgRating || 0)} readonly />
                  <span className="text-zinc-400 text-sm">
                    {publication.avgRating ? `${publication.avgRating} de 5` : "Sin valoraciones"}
                  </span>
                  <span className="text-zinc-700 text-xs">({publication.ratingCount} votos)</span>
                </div>
              </div>
              {session?.user && (
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">
                    {ratingSubmitted ? "Tu valoración" : "Valorar esta obra"}
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRating value={userRating} onChange={submitRating} />
                    {ratingSubmitted && <span className="text-xs text-zinc-600">✓ Guardado</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lector */}
          {selectedScene ? (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs text-zinc-600">
                  {publication.chapters.find(c => c.scenes.some(s => s.id === selectedScene.id))?.title}
                </span>
                <span className="text-zinc-800">›</span>
                <span className="text-xs text-zinc-400">{selectedScene.title}</span>
              </div>
              <div
                className="prose prose-invert max-w-none text-zinc-300 leading-relaxed"
                style={{ fontFamily: "Georgia, serif", fontSize: "18px", lineHeight: "1.9" }}
                dangerouslySetInnerHTML={{ __html: selectedScene.content || "<p class='text-zinc-700'>Esta escena no tiene contenido.</p>" }}
              />
              <div className="flex justify-between mt-10 pt-6 border-t border-zinc-900">
                {(() => {
                  const allScenes = publication.chapters.flatMap(c => c.scenes);
                  const idx = allScenes.findIndex(s => s.id === selectedScene.id);
                  const prev = allScenes[idx - 1];
                  const next = allScenes[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button onClick={() => setSelectedScene(prev)} className="text-xs text-zinc-500 hover:text-white transition-colors">
                          ← {prev.title}
                        </button>
                      ) : <div />}
                      {next ? (
                        <button onClick={() => setSelectedScene(next)} className="text-xs text-zinc-500 hover:text-white transition-colors">
                          {next.title} →
                        </button>
                      ) : <div />}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-zinc-600 text-sm">Seleccioná una escena del índice para leer</p>
            </div>
          )}

          {/* Comentarios */}
          <div className="border-t border-zinc-800 pt-8">
            <h2 className="text-lg font-semibold mb-6">
              Comentarios <span className="text-zinc-600 text-sm font-normal">({comments.length})</span>
            </h2>
            {session?.user ? (
              <div className="flex gap-3 mb-8">
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0 mt-1">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribí tu comentario..."
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                  />
                  <button
                    onClick={postComment}
                    disabled={posting || !newComment.trim()}
                    className="self-end bg-white text-zinc-900 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {posting ? "Publicando..." : "Comentar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-4 border border-zinc-800 rounded-lg text-center">
                <p className="text-zinc-500 text-sm">
                  <button onClick={() => router.push("/login")} className="text-white underline">Iniciá sesión</button> para comentar
                </p>
              </div>
            )}
            <div className="flex flex-col gap-4">
              {comments.length === 0 ? (
                <p className="text-zinc-700 text-sm text-center py-8">Todavía no hay comentarios</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0 mt-0.5">
                      {comment.authorImage ? (
                        <img src={comment.authorImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        comment.authorName?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-zinc-300">{comment.authorName}</span>
                        <span className="text-xs text-zinc-700">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">{comment.text}</p>
                    </div>
                    {session?.user?.id === comment.userId && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-zinc-700 hover:text-red-400 text-xs transition-colors flex-shrink-0"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {showCropper && (
        <CoverCropper
          onUpload={uploadCover}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}