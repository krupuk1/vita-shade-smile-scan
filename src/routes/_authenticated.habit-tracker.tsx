import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Loader2, Sparkles, Save, Sun, Moon, Droplet, Coffee, Cigarette, Trophy, Award, Crown, Star, Lock } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
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
      const { data } = await supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Preload today's log
  useEffect(() => {
    const t = logs?.find((l: any) => l.log_date === today);
    if (t) setForm({
      brushing_morning: !!t.brushing_morning, brushing_night: !!t.brushing_night,
      flossing: !!t.flossing, mouthwash: !!t.mouthwash,
      coffee_cups: t.coffee_cups ?? 0, tea_cups: t.tea_cups ?? 0, cigarettes: t.cigarettes ?? 0,
    });
  }, [logs, today]);

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

  // Stats
  const stats = useMemo(() => {
    const arr = logs ?? [];
    const last7 = arr.slice(0, 7);
    const avgCoffee = last7.length ? (last7.reduce((s, l: any) => s + (l.coffee_cups ?? 0), 0) / last7.length).toFixed(1) : "0";
    const brushingDone = last7.filter((l: any) => l.brushing_morning && l.brushing_night).length;
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dayScores: number[] = [0, 0, 0, 0, 0, 0, 0];
    arr.forEach((l: any) => {
      const d = new Date(l.log_date).getDay();
      const score = (l.brushing_morning ? 1 : 0) + (l.brushing_night ? 1 : 0) + (l.flossing ? 1 : 0);
      dayScores[d] += score;
    });
    const bestIdx = dayScores.indexOf(Math.max(...dayScores));
    return { avgCoffee, brushingDone, total: last7.length, bestDay: arr.length ? days[bestIdx] : "—" };
  }, [logs]);

  const coffeeChart = useMemo(() => {
    const arr = (logs ?? []).slice(0, 7).reverse();
    return arr.map((l: any) => ({ date: new Date(l.log_date).toLocaleDateString("id-ID", { weekday: "short" }), cups: l.coffee_cups ?? 0 }));
  }, [logs]);

  // Heatmap (last ~30 days, aligned by weekday columns Mon..Sun)
  const heatmap = useMemo(() => {
    const map = new Map<string, number>();
    (logs ?? []).forEach((l: any) => {
      const s = (l.brushing_morning ? 1 : 0) + (l.brushing_night ? 1 : 0) + (l.flossing ? 1 : 0) + (l.mouthwash ? 1 : 0);
      map.set(l.log_date, s);
    });
    // Build grid: start from Monday of (today - 4 weeks), 5 weeks * 7 days = 35 cells
    const today = new Date();
    const dow = (today.getDay() + 6) % 7; // 0 = Mon
    const start = new Date(today);
    start.setDate(today.getDate() - dow - 28); // 4 weeks back to Monday
    const weeks: { date: string; score: number; isFuture: boolean }[][] = [];
    for (let w = 0; w < 5; w++) {
      const row: { date: string; score: number; isFuture: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + w * 7 + d);
        const key = day.toISOString().split("T")[0];
        const isFuture = day > today;
        row.push({ date: key, score: map.get(key) ?? 0, isFuture });
      }
      weeks.push(row);
    }
    return weeks;
  }, [logs]);

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Habit Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">Catat kebiasaan harian — AI akan beri insight.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Log */}
        <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Daily Log — {new Date(today).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </h2>

          <p className="mt-5 text-sm font-medium text-foreground">Oral Hygiene</p>
          <div className="mt-3 space-y-2">
            {[
              { key: "brushing_morning", label: "Sikat gigi pagi", icon: Sun, color: "text-amber-500" },
              { key: "brushing_night", label: "Sikat gigi malam", icon: Moon, color: "text-indigo-500" },
              { key: "flossing", label: "Flossing", icon: Sparkles, color: "text-emerald-500" },
              { key: "mouthwash", label: "Mouthwash", icon: Droplet, color: "text-cyan-500" },
            ].map((it) => (
              <label key={it.key} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 cursor-pointer hover:border-primary/40 transition">
                <input type="checkbox" checked={(form as any)[it.key]} onChange={(e) => setForm({ ...form, [it.key]: e.target.checked })} className="h-4 w-4 accent-primary" />
                <it.icon className={`h-4 w-4 ${it.color}`} />
                <span className="text-sm text-foreground">{it.label}</span>
              </label>
            ))}
          </div>

          <p className="mt-6 text-sm font-medium text-foreground">Konsumsi Hari Ini</p>
          <div className="mt-3 space-y-2">
            {[
              { key: "coffee_cups", label: "Kopi", icon: Coffee, color: "text-amber-700" },
              { key: "tea_cups", label: "Teh", icon: Coffee, color: "text-emerald-600" },
              { key: "cigarettes", label: "Rokok", icon: Cigarette, color: "text-slate-500" },
            ].map((it) => (
              <div key={it.key} className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <it.icon className={`h-4 w-4 ${it.color}`} />
                  <span className="text-sm text-foreground">{it.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setForm({ ...form, [it.key]: Math.max(0, (form as any)[it.key] - 1) })}
                    className="h-7 w-7 rounded-full border border-primary text-primary hover:bg-primary/5">−</button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums text-foreground">{(form as any)[it.key]}</span>
                  <button onClick={() => setForm({ ...form, [it.key]: Math.min(50, (form as any)[it.key] + 1) })}
                    className="h-7 w-7 rounded-full border border-primary text-primary hover:bg-primary/5">+</button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => save.mutate()} disabled={save.isPending}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--gradient-primary)" }}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Log Hari Ini
          </button>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Heatmap */}
          <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">📅 Activity Heatmap</h2>
              <span className="text-xs text-muted-foreground">30 hari terakhir</span>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-7 gap-1.5 pb-1.5 text-[10px] text-muted-foreground">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                  <div key={d} className="text-center">{d}</div>
                ))}
              </div>
              <div className="space-y-1.5">
                {heatmap.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1.5">
                    {week.map((c) => (
                      <div
                        key={c.date}
                        title={c.isFuture ? c.date : `${c.date}: ${c.score}/4`}
                        className="aspect-square rounded-[4px]"
                        style={{
                          background: c.isFuture ? "transparent" :
                            c.score === 0 ? "hsl(var(--secondary))" :
                            c.score === 1 ? "rgb(187 247 208)" :
                            c.score === 2 ? "rgb(134 239 172)" :
                            c.score === 3 ? "rgb(74 222 128)" : "rgb(34 197 94)",
                          border: c.isFuture ? "1px dashed hsl(var(--border))" : "none",
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
              <span>Less</span>
              {["hsl(var(--secondary))", "rgb(187 247 208)", "rgb(134 239 172)", "rgb(74 222 128)", "rgb(34 197 94)"].map((c, i) => (
                <span key={i} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatBox value={stats.avgCoffee} label="Avg Coffee/Day" />
            <StatBox value={`${stats.brushingDone}/${stats.total}`} label="Brushing Complete" />
            <StatBox value={stats.bestDay} label="Best Day" small />
          </div>

          {/* AI Insight */}
          <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">AI Insight</h2>
              <button onClick={() => insight.mutate()} disabled={insight.isPending}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15">
                {insight.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate
              </button>
            </div>
            {insight.data ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{insight.data.insight}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Klik Generate untuk dapat insight berbasis 7 hari terakhir.</p>
            )}
          </div>
        </div>
      </div>

      {/* Coffee chart */}
      <div className="mt-6 rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-lg font-semibold text-foreground">Konsumsi Kopi (7 Hari)</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={coffeeChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="coffeeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1e-9} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
                        <p className="text-[11px] text-muted-foreground">{label}</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{payload[0].value} cups</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="cups"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#coffeeFill)"
                dot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievements */}
      <div className="mt-6 rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Trophy className="h-4 w-4 text-amber-500" /> Achievements
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { icon: Trophy, title: "7-Day Streak", desc: "Sikat gigi 7 hari berturut", earned: stats.brushingDone >= 7, color: "amber" },
            { icon: Star, title: "First Scan", desc: "Tooth scan pertama", earned: true, color: "rose" },
            { icon: Award, title: "Floss Master", desc: "Flossing tiap hari sebulan", earned: false, color: "purple" },
            { icon: Crown, title: "Consistency King", desc: "Log 30 hari berturut", earned: (logs?.length ?? 0) >= 30, color: "indigo" },
            { icon: Coffee, title: "Coffee Reducer", desc: "Turunkan kopi 20%", earned: false, color: "emerald" },
          ].map((a) => (
            <div key={a.title} className={`flex items-center gap-3 rounded-xl p-3 ${a.earned ? "bg-primary/5" : "bg-secondary/40 opacity-60"}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.earned ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{a.desc}</p>
                <p className={`mt-0.5 text-[10px] font-medium ${a.earned ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {a.earned ? "✓ Earned" : <><Lock className="mr-0.5 inline h-2.5 w-2.5" /> Locked</>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ value, label, small }: { value: string | number; label: string; small?: boolean }) {
  return (
    <div className="rounded-2xl bg-primary/5 p-4 text-center">
      <p className={`font-bold text-primary ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
