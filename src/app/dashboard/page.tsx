import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            Ashen<span className="text-zinc-400">page</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm">{session.user?.email}</span>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}>
              <button className="text-sm text-zinc-500 hover:text-white transition-colors">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-400">Bienvenido, {session.user?.name} 👋</p>
          <p className="text-zinc-600 text-sm mt-1">Tus proyectos aparecerán acá pronto.</p>
        </div>
      </div>
    </div>
  );
}