import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, ListChecks, ArrowRight,
  PlayCircle, ScanLine, BookOpenCheck, Star,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/language-switcher";
import heroImage from "@/assets/hero-tooth.jpg";
import featureSmartScanningImage from "@/assets/feature-smart-scanning.jpg";
import featureBehaviorTrackingImage from "@/assets/feature-behavior-tracking.jpg";
import featureRiskAnalysisImage from "@/assets/feature-risk-analysis.jpg";
import featureSmartRecommendationsImage from "@/assets/feature-smart-recommendations.jpg";

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
  const t = useT();
  const startHref = isAuthenticated ? "/scan" : "/signup";

  const FEATURES = [
    { image: featureSmartScanningImage, imageAlt: t.landing.features.scanTitle, title: t.landing.features.scanTitle, desc: t.landing.features.scanDesc, tags: t.landing.features.scanTags },
    { image: featureBehaviorTrackingImage, imageAlt: t.landing.features.behaviorTitle, title: t.landing.features.behaviorTitle, desc: t.landing.features.behaviorDesc, tags: t.landing.features.behaviorTags },
    { image: featureRiskAnalysisImage, imageAlt: t.landing.features.riskTitle, title: t.landing.features.riskTitle, desc: t.landing.features.riskDesc, tags: t.landing.features.riskTags },
    { image: featureSmartRecommendationsImage, imageAlt: t.landing.features.recTitle, title: t.landing.features.recTitle, desc: t.landing.features.recDesc, tags: t.landing.features.recTags },
  ];

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
          <a href="#features" className="hover:text-foreground">{t.nav.features}</a>
          <a href="#how" className="hover:text-foreground">{t.nav.how}</a>
          <a href="#testimonials" className="hover:text-foreground">{t.nav.testimonials}</a>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="pill" />
          {isAuthenticated ? (
            <Link to="/dashboard" className="rounded-full px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" style={{ background: "var(--gradient-primary)" }}>
              {t.common.dashboard}
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground md:inline-block">
                {t.common.login}
              </Link>
              <Link to="/signup" className="rounded-full px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" style={{ background: "var(--gradient-primary)" }}>
                {t.common.getStarted}
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
              <Sparkles className="h-3.5 w-3.5" /> {t.landing.tagline}
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              <span className="text-primary">{t.landing.heroTitleA}</span> {t.landing.heroTitleB.split("\n").map((line, i) => (
                <span key={i}>{i > 0 && <br />}{line}</span>
              ))}
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              {t.landing.heroDesc}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={startHref} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}>
                {t.common.getStarted} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/60 px-6 py-3 text-sm font-medium text-primary hover:bg-card">
                <PlayCircle className="h-4 w-4" /> {t.landing.watchDemo}
              </a>
            </div>
            <div className="mt-7 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {["from-pink-400 to-rose-500", "from-amber-400 to-orange-500", "from-violet-400 to-fuchsia-500", "from-emerald-400 to-teal-500"].map((c, i) => (
                  <span key={i} className={`h-7 w-7 rounded-full border-2 border-card bg-gradient-to-br ${c}`} />
                ))}
              </div>
              <span>{t.landing.trustedBy}</span>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 m-auto h-72 w-72 rounded-full blur-3xl opacity-50" style={{ background: "var(--gradient-primary)" }} />
            <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/60 backdrop-blur" style={{ boxShadow: "var(--shadow-glow)" }}>
              <img src={heroImage} alt="Tintify" width={1024} height={1024} className="h-80 w-80 object-cover md:h-96 md:w-96" />
            </div>
            <span className="absolute -right-2 top-6 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-md">✦ Smart Scan</span>
            <span className="absolute -left-2 bottom-12 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-md">✦ AI Insight</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">{t.landing.keyFeaturesTitle} <span className="text-primary">{t.landing.keyFeatures}</span></h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.landing.keyFeaturesSub}</p>
        </div>

        <div className="mt-12 space-y-16">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}>
              <div className="relative overflow-hidden rounded-3xl bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
                <img src={f.image} alt={f.imageAlt} loading="lazy" width={1024} height={768} className="h-64 w-full object-cover" />
              </div>
              <div>
                <p className="text-5xl font-light text-primary/30">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-2xl font-semibold">{f.title}</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">{f.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {f.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">✦ {tag}</span>
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
            { v: "10K+", l: t.landing.stats.users },
            { v: "50K+", l: t.landing.stats.scans },
            { v: "85%", l: t.landing.stats.satisfaction },
            { v: "4.8", l: t.landing.stats.rating },
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
          <h2 className="text-3xl font-semibold md:text-4xl">{t.landing.howTitle} <span className="text-primary">{t.nav.how}</span></h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.landing.howSub}</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: ScanLine, title: t.landing.step1Title, desc: t.landing.step1Desc, n: 1 },
            { icon: ListChecks, title: t.landing.step2Title, desc: t.landing.step2Desc, n: 2 },
            { icon: BookOpenCheck, title: t.landing.step3Title, desc: t.landing.step3Desc, n: 3 },
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
            <h2 className="text-3xl font-semibold md:text-4xl">{t.landing.testimonialsTitle} <span className="text-primary">{t.nav.testimonials}</span></h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.landing.testimonialsSub}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {t.landing.testimonials.map((tm) => (
              <div key={tm.n} className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-3 text-sm text-foreground/80">"{tm.t}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{tm.n.split(" ").map((p: string) => p[0]).join("")}</span>
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
        <h2 className="text-3xl font-semibold md:text-4xl">{t.landing.ctaTitle} <span className="text-primary">{t.landing.ctaTitleAccent}</span></h2>
        <p className="mt-3 text-sm text-muted-foreground">{t.landing.ctaDesc}</p>
        <Link to={startHref} className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}>
          {t.landing.ctaButton}
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
            <p className="mt-3 max-w-xs text-xs">{t.landing.footer.tagline}</p>
          </div>
          {[
            { h: t.landing.footer.product, links: [t.nav.features, "Pricing", "FAQ"] },
            { h: t.landing.footer.company, links: ["About Us", "Careers", "Contact"] },
            { h: t.landing.footer.legal, links: ["Privacy", "Terms", "Cookies"] },
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
          {t.landing.footer.rights}
        </div>
      </footer>
    </main>
  );
}
