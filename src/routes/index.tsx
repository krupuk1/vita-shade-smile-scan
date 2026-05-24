import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Palette, ShieldCheck, Camera, Activity, ListChecks, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Tintify — Tooth Color Intelligence Platform" },
      { name: "description", content: "Cek warna gigi Anda secara instan dengan AI berdasarkan VITA Classical Shade. Dapatkan analisis risiko, rekomendasi, dan habit tracker." },
    ],
  }),
});

function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-4 w-4" />
          </span>
          Tintify
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/shades" className="hidden rounded-full px-3 py-2 text-sm text-foreground/70 transition hover:text-foreground md:inline-block">
            VITA Shades
          </Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="rounded-full px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90" style={{ background: "var(--gradient-primary)" }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:text-foreground">
                Masuk
              </Link>
              <Link to="/signup" className="rounded-full px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90" style={{ background: "var(--gradient-primary)" }}>
                Daftar
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-20 text-center md:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full bg-card/60 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Bertenaga AI Visi
        </div>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
          Cek warna gigi Anda dengan <span className="italic text-primary">AI</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
          Tintify menganalisis foto gigi berdasarkan VITA Classical Shade Guide dan memberi rekomendasi personal — instan, akurat, dan personal.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={isAuthenticated ? "/scan" : "/signup"}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
          >
            Mulai sekarang <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/shades" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-medium text-foreground transition hover:bg-card">
            <Palette className="h-4 w-4 text-primary" /> Lihat VITA Shades
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Camera, title: "Tooth Scan AI", desc: "Upload foto, ambil langsung, atau pilih manual dari panduan VITA Classical." },
            { icon: Activity, title: "Risk Analysis", desc: "AI menganalisis risiko karies, plak, dan stain berbasis pola warna gigi Anda." },
            { icon: ListChecks, title: "Habit Tracker", desc: "Pantau kebiasaan harian — sikat, floss, kopi, rokok — dengan insight personal." },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <footer className="mt-12 flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted-foreground backdrop-blur">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p><span className="font-medium text-foreground">Disclaimer:</span> Tintify memberi estimasi berbasis foto dan tidak menggantikan pemeriksaan dokter gigi profesional.</p>
        </footer>
      </section>
    </main>
  );
}
