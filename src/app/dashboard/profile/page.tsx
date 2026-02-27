"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface Profile {
  bio: string;
  website: string;
  location: string;
  avatar: string;
}

interface User {
  name: string;
  email: string;
  image: string;
  provider: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({ bio: "", website: "", location: "", avatar: "" });
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchProfile();
  }, [status]);

  async function fetchProfile() {
    const res = await fetch("/api/profile");
    const data = await res.json();
    setUser(data.user);
    setName(data.user.name || "");
    setProfile({
      bio: data.profile.bio || "",
      website: data.profile.website || "",
      location: data.profile.location || "",
      avatar: data.profile.avatar || "",
    });
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("La imagen debe ser menor a 1MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

    async function saveProfile() {
      setSaving(true);
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...profile }),
      });
      await update({ name });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

  function getAvatar() {
    if (profile.avatar) return profile.avatar;
    if (user?.image) return user.image;
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="text-zinc-500 hover:text-white transition-colors text-sm">
              ← Mis proyectos
            </button>
            <span className="text-zinc-700">/</span>
            <h1 className="text-sm font-medium">Mi perfil</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-10 flex flex-col gap-8">

        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative group">
            {getAvatar() ? (
              <img
                src={getAvatar()!}
                alt={name}
                className="w-20 h-20 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl text-zinc-400">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white"
            >
              Cambiar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-white font-medium">{name}</p>
            <p className="text-zinc-500 text-sm">{user.email}</p>
            <p className="text-zinc-700 text-xs mt-1">
              {user.provider === "credentials" ? "Cuenta propia" : "Cuenta Google"}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Biografía</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Contá algo sobre vos y tu escritura..."
              rows={3}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Ubicación</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              placeholder="Ciudad, País"
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Sitio web</label>
            <input
              type="text"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              placeholder="https://..."
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {user.provider === "credentials" && (
            <div className="border-t border-zinc-800 pt-5 flex flex-col gap-3">
              <p className="text-xs text-zinc-600 uppercase tracking-wider">Cambiar contraseña</p>
              <ChangePassword />
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-white text-zinc-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
          </button>
        </div>

        {/* Cuenta */}
        <div className="border-t border-zinc-800 pt-6">
          <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">Tu cuenta</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2 border-b border-zinc-900">
              <span className="text-sm text-zinc-400">Email</span>
              <span className="text-sm text-zinc-500">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-zinc-900">
              <span className="text-sm text-zinc-400">Proveedor</span>
              <span className="text-sm text-zinc-500">{user.provider === "credentials" ? "Cuenta propia" : "Google"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-zinc-900">
              <span className="text-sm text-zinc-400">Plan</span>
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">Free</span>
            </div>
          </div>
        </div>

        {/* Cerrar sesión */}
        <div className="border-t border-zinc-800 pt-6">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

      </main>
    </div>
  );
}

function ChangePassword() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleChange() {
    setError("");
    setMessage("");
    if (form.next !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.next.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Contraseña actualizada");
      setForm({ current: "", next: "", confirm: "" });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="password"
        value={form.current}
        onChange={(e) => setForm({ ...form, current: e.target.value })}
        placeholder="Contraseña actual"
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
      />
      <input
        type="password"
        value={form.next}
        onChange={(e) => setForm({ ...form, next: e.target.value })}
        placeholder="Nueva contraseña"
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
      />
      <input
        type="password"
        value={form.confirm}
        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        placeholder="Confirmar nueva contraseña"
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {message && <p className="text-green-400 text-xs">{message}</p>}
      <button
        onClick={handleChange}
        disabled={loading || !form.current || !form.next || !form.confirm}
        className="border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        {loading ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </div>
  );
}