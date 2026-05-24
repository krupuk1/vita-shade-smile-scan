import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { generateRecommendations, type Recommendation } from "@/lib/ai-insights.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recommendations")({
  component: RecsPage,
  head: () => ({ meta: [{ title: "Recommendations — Tintify" }] }),
});

function RecsPage() {
  const fn = useServerFn(generateRecommendations);
  const m = useMutation({ mutationFn: () => fn({}), onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Recommendations</h1>
        <p className="mt-1 text-sm text-muted-foreground">Saran perawatan personal berbasis AI.</p>
      </header>

      {!m.data && (
        <div className="rounded-3xl bg-card p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Dapatkan rekomendasi</h2>
          <p className="mt-2 text-sm text-muted-foreground">AI akan menyusun rekomendasi perawatan berbasis profil Anda.</p>
          <button onClick={() => m.mutate()} disabled={m.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60" style={{ background: "var(--gradient-primary)" }}>
            {m.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Menghasilkan…</> : "Generate"}
          </button>
        </div>
      )}

      {m.data && (
        <div className="grid gap-4 md:grid-cols-2">
          {m.data.items.map((r: Recommendation, i: number) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{r.title}</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r.category}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
              <p className="mt-3 text-xs text-foreground/70"><span className="font-medium">Kenapa:</span> {r.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
