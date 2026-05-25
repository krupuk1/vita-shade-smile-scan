import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Camera, Activity, ListChecks, ArrowRight, ShieldCheck,
  PlayCircle, ScanLine, BookOpenCheck, Star,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import heroImage from "@/assets/hero-tooth.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Tintify — Tooth Color Intelligence Platform" },
      { name: "description", content: "Platform pintar untuk Smart Scanning dan Behavior Change Against Tooth Discoloration. Pantau warna gigi, kebiasaan, dan dapatkan rekomendasi personal dari AI." },
    ],
  }),
});

function Landing() {
  const { isAuthenticated } = useAuth();
  const startHref = isAuthenticated ? "/scan" : "/signup";

  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-primary">Tintify</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm text-foreground/70 md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it Works</a>
          <a href="#testimonials" className="hover:text-foreground">Testimonials</a>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/dashboard" className="rounded-full px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" style={{ background: "var(--gradient-primary)" }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground md:inline-block">
                Masuk
              </Link>
              <Link to="/signup" className="rounded-full px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" style={{ background: "var(--gradient-primary)" }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Tooth Color Intelligence Platform
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              <span className="text-primary">TINTIFY:</span> Tooth Color<br />Intelligence Platform
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              Platform pintar untuk Smart Scanning dan Behavior Change Against Tooth Discoloration. Pantau warna gigi, kebiasaan, dan dapatkan rekomendasi personal dari AI untuk senyum lebih cerah.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={startHref} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}>
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/60 px-6 py-3 text-sm font-medium text-primary hover:bg-card">
                <PlayCircle className="h-4 w-4" /> Watch Demo
              </a>
            </div>
            <div className="mt-7 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {["from-pink-400 to-rose-500", "from-amber-400 to-orange-500", "from-violet-400 to-fuchsia-500", "from-emerald-400 to-teal-500"].map((c, i) => (
                  <span key={i} className={`h-7 w-7 rounded-full border-2 border-card bg-gradient-to-br ${c}`} />
                ))}
              </div>
              <span>10K+ pengguna mempercayai Tintify</span>
            </div>
          </div>

          {/* Mascot */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 m-auto h-72 w-72 rounded-full blur-3xl opacity-60" style={{ background: "var(--gradient-primary)" }} />
            <div className="relative grid h-72 w-72 place-items-center rounded-full border border-primary/30 bg-card/60 backdrop-blur" style={{ boxShadow: "var(--shadow-glow)" }}>
              <div className="text-[120px] leading-none drop-shadow-lg">🦷</div>
            </div>
            <span className="absolute -right-2 top-6 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-md">✦ Smart Scan</span>
            <span className="absolute -left-2 bottom-12 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-md">✦ AI Insight</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">Key <span className="text-primary">Features</span></h2>
          <p className="mt-2 text-sm text-muted-foreground">Advanced technology to help you achieve a healthier smile</p>
        </div>

        <div className="mt-12 space-y-16">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}>
              <div className="relative overflow-hidden rounded-3xl bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className={`flex h-64 items-center justify-center text-7xl ${f.bgClass}`}>{f.emoji}</div>
                <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  <f.icon className="h-4 w-4" />
                </span>
              </div>
              <div>
                <p className="text-5xl font-light text-primary/30">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-2xl font-semibold">{f.title}</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">{f.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {f.tags.map((t) => (
                    <span key={t} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">✦ {t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12" style={{ background: "var(--gradient-primary)" }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 text-center text-primary-foreground md:grid-cols-4">
          {[
            { v: "10K+", l: "Active Users" },
            { v: "50K+", l: "Scans Performed" },
            { v: "85%", l: "Satisfaction Rate" },
            { v: "4.8", l: "User Rating" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-4xl font-semibold md:text-5xl">{s.v}</p>
              <p className="mt-1 text-xs uppercase tracking-widest opacity-80">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">How it <span className="text-primary">Works</span></h2>
          <p className="mt-2 text-sm text-muted-foreground">Three easy steps to start your journey towards a healthier smile</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: ScanLine, title: "Scan Your Teeth", desc: "Gunakan kamera atau pilih shade manual dengan panduan VITA Classical.", n: 1 },
            { icon: ListChecks, title: "Track Habits", desc: "Catat sikat gigi, flossing, kopi, rokok, dan kebiasaan harian.", n: 2 },
            { icon: BookOpenCheck, title: "Get Insights", desc: "Dapatkan rekomendasi personal AI untuk menjaga gigi tetap cerah.", n: 3 },
          ].map((s) => (
            <div key={s.title} className="rounded-3xl bg-card p-6 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="mx-auto grid h-32 w-32 place-items-center rounded-2xl text-5xl" style={{ background: "var(--gradient-hero)" }}>
                <s.icon className="h-10 w-10 text-primary" />
              </div>
              <span className="mx-auto mt-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-secondary/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">What They <span className="text-primary">Say</span></h2>
            <p className="mt-2 text-sm text-muted-foreground">Tintify user experiences from various backgrounds</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { n: "Sari Dewi", r: "Karyawan", t: "Tintify sangat membantu saya memantau warna gigi setiap hari." },
              { n: "Andi Pratama", r: "Pelajar", t: "Fitur habit tracker sangat membantu menjaga konsistensi sikat gigi saya." },
              { n: "drg. Ratna Sari", r: "Dokter", t: "Rekomendasi AI-nya cukup akurat untuk panduan perawatan harian." },
            ].map((tm) => (
              <div key={tm.n} className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-3 text-sm text-foreground/80">"{tm.t}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{tm.n.split(" ").map(p => p[0]).join("")}</span>
                  <div>
                    <p className="text-sm font-medium">{tm.n}</p>
                    <p className="text-xs text-muted-foreground">{tm.r}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">Ready For a <span className="text-primary">Brighter Smile?</span></h2>
        <p className="mt-3 text-sm text-muted-foreground">Mulai perjalanan menuju kesehatan gigi terbaik hari ini.</p>
        <Link to={startHref} className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}>
          ✦ Start Free Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-[oklch(0.18_0.04_285)] px-6 py-12 text-sm text-white/70">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-primary)" }}><Sparkles className="h-4 w-4" /></span>
              Tintify
            </div>
            <p className="mt-3 max-w-xs text-xs">Tooth Color Intelligence Platform untuk Smart Scanning & Behavior Change.</p>
          </div>
          {[
            { h: "Product", links: ["Features", "Pricing", "FAQ"] },
            { h: "Company", links: ["About Us", "Careers", "Contact"] },
            { h: "Legal", links: ["Privacy", "Terms", "Cookies"] },
          ].map((c) => (
            <div key={c.h}>
              <p className="font-semibold text-white">{c.h}</p>
              <ul className="mt-3 space-y-2 text-xs">
                {c.links.map((l) => <li key={l}><a href="#" className="hover:text-white">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6 text-center text-xs">
          © 2026 Tintify. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

const FEATURES = [
  { icon: Camera, title: "Smart Scanning", desc: "Teknologi analisis gigi VITA Shade berbasis AI untuk akurasi dan personal.", emoji: "🦷", bgClass: "bg-gradient-to-br from-violet-100 to-fuchsia-100", tags: ["AI Powered", "VITA Shade Guide", "Instant Result"] },
  { icon: ListChecks, title: "Behavior Tracking", desc: "Pantau kebiasaan kopi, teh, sikat, dan flossing untuk mencegah perubahan warna gigi.", emoji: "📊", bgClass: "bg-gradient-to-br from-emerald-100 to-teal-100", tags: ["Daily Logging", "Insights", "Achievements"] },
  { icon: Activity, title: "Risk Analysis", desc: "Deteksi dini risiko karies, plak, dan stain dengan AI yang transparan.", emoji: "📈", bgClass: "bg-gradient-to-br from-rose-100 to-amber-100", tags: ["AI Score", "Transparency", "Alerts"] },
  { icon: ShieldCheck, title: "Smart Recommendations", desc: "Rekomendasi personal sesuai pola Anda — actionable & dapat dijalankan.", emoji: "💡", bgClass: "bg-gradient-to-br from-sky-100 to-indigo-100", tags: ["Personalized", "Evidence-based", "Actionable"] },
];
