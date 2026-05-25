import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Loader2, ShieldCheck, ChevronDown, Lightbulb, Brain, TrendingUp, ArrowRight, Info } from "lucide-react";
import { generateRiskAnalysis, type RiskAnalysis, type RiskItem } from "@/lib/ai-insights.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/risk-analysis")({
  component: RiskPage,
  head: () => ({ meta: [{ title: "Risk Analysis — Tintify" }] }),
});

const SHADE_COLORS: Record<string, string> = {
  B1: "#f4ecd6", A1: "#efe3c4", B2: "#ecdcb4", D2: "#e6d4ab",
  A2: "#e3cf9f", C1: "#dec8a0", C2: "#d2b98c", D4: "#cdb284",
  A3: "#c9ac7b", D3: "#c1a574", B3: "#bb9e6b", "A3.5": "#b69664",
  B4: "#ad8b58", C3: "#a4824f", A4: "#8f6e3f", C4: "#7a5a30",
};
const SHADE_DESC: Record<string, string> = {
  B1: "Sangat terang, putih natural", A1: "Putih krem alami",
  A2: "Light Yellow — kuning sangat ringan", B2: "Putih kekuningan ringan",
  D2: "Putih keabuan", C1: "Putih keabu-abuan",
  A3: "Kuning sedang", B3: "Kuning kecokelatan ringan",
};

function RiskPage() {
  const { user } = useAuth();
  const fn = useServerFn(generateRiskAnalysis);
  const m = useMutation({
    mutationFn: () => fn({}),
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: latestScan } = useQuery({
    queryKey: ["latest-scan", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("tooth_scans")
        .select("primary_shade, secondary_shade, brightness, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const shade = latestScan?.primary_shade ?? null;

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Risk Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Analisis risiko gigi berbasis AI dengan penjelasan kriteria & skor.</p>
      </header>

      {/* Current Tooth Shade Status */}
      <div className="mb-6 rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-lg font-semibold text-foreground">Current Tooth Shade Status</h2>
        {shade ? (
          <>
            <div className="mt-4 flex items-center gap-5">
              <div className="h-24 w-24 shrink-0 rounded-2xl border border-border" style={{ background: SHADE_COLORS[shade] ?? "#e5e5e5", boxShadow: "inset 0 -8px 16px rgba(0,0,0,0.1)" }} />
              <div>
                <p className="text-4xl font-semibold text-foreground">{shade}</p>
                <p className="text-sm text-muted-foreground">{SHADE_DESC[shade] ?? "VITA Classical Shade"}</p>
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {shadeRange(shade)}
                </span>
              </div>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Vita Shade Scale Position</p>
              <div className="grid grid-cols-9 gap-1">
                {["A1", "B1", "A2", "B2", "A3", "A3.5", "A4", "B4", "C4"].map((s) => (
                  <HoverCard key={s} openDelay={80}>
                    <HoverCardTrigger asChild>
                      <button type="button" className={`rounded-md px-1 py-2 text-center text-[10px] font-medium transition hover:scale-105 ${shade === s ? "ring-2 ring-primary scale-105" : ""}`} style={{ background: SHADE_COLORS[s] ?? "#ddd", color: "#3a2a1a" }}>
                        {s}
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-56 p-3">
                      <div className="flex items-center gap-2">
                        <span className="h-8 w-8 rounded-md border border-border" style={{ background: SHADE_COLORS[s] ?? "#ddd" }} />
                        <div>
                          <p className="text-sm font-semibold">Shade {s}</p>
                          <p className="text-[10px] text-muted-foreground">Grup {s[0]}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{SHADE_DESC[s] ?? "VITA Classical Shade"}</p>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>

            </div>
            <div className="mt-4 flex gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary" />
              <p>Warna gigi Anda saat ini di shade <strong>{shade}</strong>. {shadeAdvice(shade)}</p>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada scan. <Link to="/scan" className="font-medium text-primary hover:underline">Lakukan scan dulu →</Link></p>
        )}
      </div>

      {!m.data && (
        <div className="rounded-3xl bg-card p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Activity className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Generate Risk Analysis</h2>
          <p className="mt-2 text-sm text-muted-foreground">AI akan menganalisis history scan dan habit Anda untuk menilai risiko, kriteria penilaian, dan rekomendasi.</p>
          <button onClick={() => m.mutate()} disabled={m.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60" style={{ background: "var(--gradient-primary)" }}>
            {m.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Menganalisis…</> : "Mulai Analisis"}
          </button>
        </div>
      )}

      {m.data && <RiskResult data={m.data} onRetry={() => m.reset()} />}
    </div>
  );
}

function shadeRange(s: string) {
  if (["B1", "A1"].includes(s)) return "Sangat Terang";
  if (["A2", "B2", "D2", "C1"].includes(s)) return "Normal Range";
  if (["A3", "B3", "C2", "D3", "A3.5"].includes(s)) return "Mulai Menguning";
  return "Perlu Perhatian";
}
function shadeAdvice(s: string) {
  if (["B1", "A1"].includes(s)) return "Pertahankan dengan kebiasaan baik & kurangi konsumsi pewarna.";
  if (["A2", "B2", "D2", "C1"].includes(s)) return "Masih dalam range normal, namun perlu perhatian agar tidak menggelap.";
  return "Sebaiknya kurangi kopi/teh/rokok dan pertimbangkan konsultasi profesional.";
}

function RiskResult({ data, onRetry }: { data: RiskAnalysis; onRetry: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-card p-6 md:col-span-1" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Skor Risiko Keseluruhan
          </div>
          <p className="mt-2 text-5xl font-semibold text-foreground">{Math.round(data.overall_score)}<span className="text-xl text-muted-foreground">/100</span></p>
          <div className="mt-3 h-2 w-full rounded-full bg-secondary">
            <div className="h-full rounded-full" style={{ width: `${data.overall_score}%`, background: scoreColor(data.overall_score) }} />
          </div>
        </div>
        <div className="rounded-3xl bg-card p-6 md:col-span-2" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Brain className="h-4 w-4 text-primary" /> Bagaimana AI Menilai</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.methodology}</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.risks.map((r) => <RiskCard key={r.name} risk={r} />)}
      </div>

      <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Ringkasan</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
      </div>

      {/* CTA to recommendations */}
      <div className="flex items-center justify-between gap-4 rounded-3xl p-6 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4" /> Ingin Turunkan Risiko?</h3>
          <p className="mt-1 text-xs opacity-90">Lihat rekomendasi personal AI berdasarkan analisis Anda.</p>
        </div>
        <Link to="/recommendations" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-white/90">
          Lihat Rekomendasi <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <button onClick={onRetry} className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary">Analisis ulang</button>
    </div>
  );
}

function RiskCard({ risk }: { risk: RiskItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-secondary/30">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{risk.name}</p>
            <RiskBadge level={risk.level} />
            <span className="text-xs text-muted-foreground">Skor {risk.score}/100</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
            <div className="h-full rounded-full" style={{ width: `${risk.score}%`, background: levelColor(risk.level) }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{risk.reason}</p>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-5 border-t border-border bg-secondary/20 p-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bukti dari Data Anda</p>
            <ul className="space-y-1.5">
              {risk.factors.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Kriteria Penilaian</p>
            <div className="space-y-3">
              {risk.criteria.map((c, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{c.label}</span>
                    <span className="text-xs text-muted-foreground">Skor {c.score} · Bobot {Math.round(c.weight * 100)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: scoreColor(c.score) }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{c.finding}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Rekomendasi</p>
              <p className="mt-1 text-sm text-foreground">{risk.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const label = { low: "Rendah", medium: "Sedang", high: "Tinggi" }[level];
  return <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: levelColor(level) }}>{label}</span>;
}

function levelColor(l: string) {
  return l === "high" ? "#ef4444" : l === "medium" ? "#f59e0b" : "#10b981";
}

function scoreColor(score: number) {
  return score >= 67 ? "#ef4444" : score >= 34 ? "#f59e0b" : "#10b981";
}
