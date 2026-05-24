import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Sparkles, Loader2, RefreshCw, Coffee, Cigarette, Brush, Apple,
  Stethoscope, BookOpen, Lightbulb, Calendar, CheckCircle2,
} from "lucide-react";
import { generateRecommendations, getRecommendations, type Recommendation } from "@/lib/ai-insights.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recommendations")({
  component: RecsPage,
  head: () => ({ meta: [{ title: "Recommendations — Tintify" }] }),
});

const CATEGORY_ICONS: Record<string, any> = {
  lifestyle: Coffee, oral_care: Brush, professional: Stethoscope, diet: Apple, whitening: Sparkles,
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-600", label: "CRITICAL" },
  high: { bg: "bg-amber-100", text: "text-amber-700", label: "HIGH" },
  moderate: { bg: "bg-blue-100", text: "text-blue-600", label: "MODERATE" },
  low: { bg: "bg-emerald-100", text: "text-emerald-600", label: "LOW" },
};

function RecsPage() {
  const qc = useQueryClient();
  const fetchFn = useServerFn(getRecommendations);
  const genFn = useServerFn(generateRecommendations);
  const [filter, setFilter] = useState<"all" | "critical" | "high">("all");
  const [progress, setProgress] = useState<Record<number, number>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => fetchFn({}),
  });

  const gen = useMutation({
    mutationFn: () => genFn({}),
    onSuccess: () => {
      toast.success("Rekomendasi berhasil dibuat");
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items: Recommendation[] | null = data?.items ?? null;
  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === "all") return items;
    return items.filter((i) => i.priority === filter);
  }, [items, filter]);

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Recommendations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalized action plan{data?.updated_at && ` · Updated ${new Date(data.updated_at).toLocaleDateString("id-ID")}`}
          </p>
        </div>
        {items && (
          <button
            onClick={() => gen.mutate()}
            disabled={gen.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/80 disabled:opacity-60"
          >
            {gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Generate Ulang
          </button>
        )}
      </header>

      {isLoading && (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      )}

      {!isLoading && !items && (
        <div className="rounded-3xl bg-card p-10 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Belum ada rekomendasi</h2>
          <p className="mt-2 text-sm text-muted-foreground">AI akan menyusun action plan personal berdasarkan scan & habit Anda.</p>
          <button
            onClick={() => gen.mutate()}
            disabled={gen.isPending}
            className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--gradient-primary)" }}
          >
            {gen.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Menghasilkan…</> : "Generate"}
          </button>
        </div>
      )}

      {items && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Priority Action Plan</h2>
                <p className="text-xs text-muted-foreground">Personalized recommendations based on your risk profile</p>
              </div>
              <div className="inline-flex rounded-full bg-secondary p-1 text-xs">
                {(["all", "critical", "high"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 capitalize transition ${filter === f ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                    {f === "all" ? "All" : f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filtered.map((r, i) => {
                const Icon = CATEGORY_ICONS[r.category] ?? Sparkles;
                const p = PRIORITY_STYLES[r.priority] ?? PRIORITY_STYLES.moderate;
                const pct = progress[i] ?? 0;
                return (
                  <div key={i} className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-foreground">{r.title}</h3>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${p.bg} ${p.text}`}>
                            {p.label}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                          <div><p className="text-muted-foreground">Current</p><p className="font-semibold text-red-600">{r.current}</p></div>
                          <div><p className="text-muted-foreground">Target</p><p className="font-semibold text-emerald-600">{r.target}</p></div>
                          <div>
                            <p className="text-muted-foreground">Difficulty</p>
                            <div className="mt-1 flex gap-1">
                              {[1, 2, 3, 4].map((d) => (
                                <span key={d} className={`h-2 w-2 rounded-full ${d <= r.difficulty ? "bg-primary" : "bg-secondary"}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">{pct}% completed</p>
                        </div>

                        <div className="mt-4 rounded-xl bg-secondary/50 p-3">
                          <p className="text-xs font-medium text-foreground">Action Steps:</p>
                          <ol className="mt-2 space-y-1.5">
                            {r.steps.map((s, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-foreground/80">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>{j + 1}</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <p className="mt-3 text-[11px] text-muted-foreground"><span className="font-medium text-foreground">Kenapa:</span> {r.reason}</p>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => setProgress((p) => ({ ...p, [i]: Math.min(100, (p[i] ?? 0) + 25) }))}
                            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Progress
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="flex items-center gap-2 font-semibold text-foreground"><Stethoscope className="h-4 w-4 text-primary" /> Professional</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {["Dental cleaning (6 bulan)", "Konsultasi whitening", "Pemeriksaan rutin"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-primary" /> <span className="text-foreground/80">{t}</span></li>
                ))}
              </ul>
              <button className="mt-4 w-full rounded-full border border-primary px-4 py-2 text-xs font-medium text-primary hover:bg-primary/5">
                <Calendar className="mr-1.5 inline h-3.5 w-3.5" /> Jadwalkan Kunjungan
              </button>
            </div>

            <div className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="flex items-center gap-2 font-semibold text-foreground"><BookOpen className="h-4 w-4 text-primary" /> Educational</h3>
              <ul className="mt-3 space-y-2">
                {[
                  { t: "Cara Menjaga Gigi Putih", m: "5 min read" },
                  { t: "Teknik Sikat yang Benar", m: "3 min watch" },
                  { t: "Makanan Sehat Gigi", m: "7 min read" },
                ].map((r) => (
                  <li key={r.t} className="rounded-lg bg-secondary/50 p-2.5">
                    <p className="text-xs font-medium text-foreground">{r.t}</p>
                    <p className="text-[11px] text-muted-foreground">{r.m}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl p-5 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <h3 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4" /> Daily Tip</h3>
              <p className="mt-2 text-xs leading-relaxed opacity-95">
                Minum air putih setelah konsumsi kopi atau teh dapat membantu mengurangi risiko noda pada gigi.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
