import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Activity, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { generateRiskAnalysis, type RiskAnalysis } from "@/lib/ai-insights.functions";
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
        <p className="mt-1 text-sm text-muted-foreground">Analisis risiko gigi berbasis AI dari history scan & habit Anda.</p>
      </header>

      {!m.data && (
        <div className="rounded-3xl bg-card p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Activity className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Generate Risk Analysis</h2>
          <p className="mt-2 text-sm text-muted-foreground">AI akan menganalisis history scan dan habit Anda untuk menilai risiko.</p>
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
      <div className="grid gap-4 md:grid-cols-3">
        {data.risks.map((r) => (
          <div key={r.name} className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{r.name}</p>
              <RiskBadge level={r.level} />
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-secondary">
              <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: levelColor(r.level) }} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{r.reason}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Ringkasan</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
      </div>
      <button onClick={onRetry} className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary">Analisis ulang</button>
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
