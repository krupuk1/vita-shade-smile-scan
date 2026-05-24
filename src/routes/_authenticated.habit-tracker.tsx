import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ListChecks, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { generateHabitInsights } from "@/lib/ai-insights.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/habit-tracker")({
  component: HabitPage,
  head: () => ({ meta: [{ title: "Habit Tracker — Tintify" }] }),
});

function HabitPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const insightFn = useServerFn(generateHabitInsights);
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    brushing_morning: false, brushing_night: false, flossing: false, mouthwash: false,
    coffee_cups: 0, tea_cups: 0, cigarettes: 0,
  });

  const { data: logs } = useQuery({
    queryKey: ["habit-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(7);
      return data ?? [];
    },
    enabled: !!user,
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("habit_logs").upsert({
        ...form, user_id: user!.id, log_date: today,
      }, { onConflict: "user_id,log_date" as any });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Habit hari ini tersimpan"); qc.invalidateQueries({ queryKey: ["habit-logs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const insight = useMutation({ mutationFn: () => insightFn({}), onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <ListChecks className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Habit Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catat kebiasaan harian Anda — AI akan beri insight.</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-semibold text-foreground">Log Hari Ini</h2>
          <div className="mt-4 space-y-3">
            {[
              { key: "brushing_morning", label: "Sikat gigi pagi" },
              { key: "brushing_night", label: "Sikat gigi malam" },
              { key: "flossing", label: "Floss" },
              { key: "mouthwash", label: "Mouthwash" },
            ].map((it) => (
              <label key={it.key} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5 cursor-pointer">
                <input type="checkbox" checked={(form as any)[it.key]} onChange={(e) => setForm({ ...form, [it.key]: e.target.checked })} className="h-4 w-4 accent-primary" />
                <span className="text-sm text-foreground">{it.label}</span>
              </label>
            ))}
            {[
              { key: "coffee_cups", label: "Cangkir kopi" },
              { key: "tea_cups", label: "Cangkir teh" },
              { key: "cigarettes", label: "Batang rokok" },
            ].map((it) => (
              <div key={it.key} className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2">
                <span className="text-sm text-foreground">{it.label}</span>
                <input type="number" min={0} max={50} value={(form as any)[it.key]} onChange={(e) => setForm({ ...form, [it.key]: parseInt(e.target.value || "0") })} className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm text-right" />
              </div>
            ))}
          </div>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60" style={{ background: "var(--gradient-primary)" }}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">AI Insight</h2>
              <button onClick={() => insight.mutate()} disabled={insight.isPending} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15">
                {insight.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate
              </button>
            </div>
            {insight.data ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{insight.data.insight}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Klik Generate untuk dapat insight berbasis 7 hari terakhir.</p>
            )}
          </div>

          <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="text-lg font-semibold text-foreground">7 Hari Terakhir</h2>
            <div className="mt-3 space-y-1.5 text-sm">
              {logs && logs.length > 0 ? logs.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                  <span className="text-foreground">{new Date(l.log_date).toLocaleDateString("id-ID")}</span>
                  <span className="text-xs text-muted-foreground">
                    🪥 {(l.brushing_morning ? 1 : 0) + (l.brushing_night ? 1 : 0)}/2 · ☕ {l.coffee_cups} · 🚬 {l.cigarettes}
                  </span>
                </div>
              )) : <p className="text-sm text-muted-foreground">Belum ada log.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
