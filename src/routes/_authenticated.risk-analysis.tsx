import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Loader2, ShieldCheck, ChevronDown, Lightbulb, Brain, TrendingUp } from "lucide-react";
import { generateRiskAnalysis, type RiskAnalysis, type RiskItem } from "@/lib/ai-insights.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/risk-analysis")({
  component: RiskPage,
  head: () => ({ meta: [{ title: "Risk Analysis — Tintify" }] }),
});

function RiskPage() {
  const fn = useServerFn(generateRiskAnalysis);
  const m = useMutation({
    mutationFn: () => fn({}),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Risk Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Analisis risiko gigi berbasis AI dengan penjelasan kriteria & skor.</p>
      </header>

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

function RiskResult({ data, onRetry }: { data: RiskAnalysis; onRetry: () => void }) {
  return (
    <div className="space-y-6">
      {/* Overall + methodology */}
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

      {/* Risk cards */}
      <div className="space-y-4">
        {data.risks.map((r) => <RiskCard key={r.name} risk={r} />)}
      </div>

      {/* Summary */}
      <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Ringkasan</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
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
          {/* Factors */}
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

          {/* Criteria breakdown */}
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

          {/* Recommendation */}
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
