import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <span className="text-sm font-semibold tracking-[0.2em] uppercase text-zinc-400">
          Ashen<span className="text-white">page</span>
        </span>
        <Link
          href="/login"
          className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors duration-300 border border-zinc-800 hover:border-zinc-500 px-4 py-2 rounded-full"
        >
          Ingresar
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-40"
          >
            <source src="/cover.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-8 py-32">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.4em] uppercase text-zinc-500 mb-6">
              Para escritores de lo oscuro
            </p>
            <h1 className="text-6xl font-bold leading-none tracking-tight mb-6">
              <span className="block text-white">Tu historia</span>
              <span className="block text-zinc-500">vive aquí.</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-md">
              Una plataforma para escritores de horror y ciencia ficción.
              Construí tu universo, definí tus personajes, y escribí con una IA
              que conoce tu historia tan bien como vos.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="bg-white text-black px-8 py-3 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors duration-300 tracking-wide"
              >
                Empezar gratis
              </Link>
              <span className="text-zinc-600 text-xs">Sin tarjeta de crédito</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 bg-black border-t border-zinc-900 px-8 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-zinc-600 mb-16 text-center">
            Todo lo que necesitás para escribir
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-900">
            {[
              {
                icon: "◈",
                title: "La Biblia",
                description: "Definí personajes, lugares y las reglas de tu universo. La IA los recuerda y los usa.",
              },
              {
                icon: "◎",
                title: "IA Contextual",
                description: "No un chatbot genérico. Una IA que conoce tu historia y escribe en tu tono.",
              },
              {
                icon: "◉",
                title: "Editor Limpio",
                description: "Sin distracciones. Solo vos y tu historia. Guardado automático siempre.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-black p-8 flex flex-col gap-4 hover:bg-zinc-950 transition-colors duration-300"
              >
                <span className="text-2xl text-zinc-600">{feature.icon}</span>
                <h3 className="text-white font-semibold">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 bg-black border-t border-zinc-900 px-8 py-24">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
          <h2 className="text-4xl font-bold text-white">
            Tu próxima historia<br />
            <span className="text-zinc-600">te está esperando.</span>
          </h2>
          <Link
            href="/login"
            className="bg-white text-black px-8 py-3 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors duration-300 tracking-wide mt-4"
          >
            Crear mi primer proyecto
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-zinc-700 text-xs tracking-widest uppercase">Ashenpage</span>
          <span className="text-zinc-800 text-xs">© 2026</span>
        </div>
      </footer>

    </main>
  );
}