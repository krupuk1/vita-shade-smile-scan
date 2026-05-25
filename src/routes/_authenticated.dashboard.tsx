import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Camera, Activity, ListChecks, Sparkles, TrendingUp, Coffee, Cigarette, Brush, CheckCircle2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Tintify" }] }),
});

const SHADE_ORDER = ["A1", "A2", "A3", "A3.5", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D2", "D3", "D4"];
function shadeIndex(s: string) {
  const i = SHADE_ORDER.indexOf(s);
  return i >= 0 ? i : 5;
}

function Dashboard() {
  const { user, isAdmin } = useAuth();

  const { data: scans } = useQuery({
    queryKey: ["my-scans", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tooth_scans").select("*").order("created_at", { ascending: true }).limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: habits } = useQuery({
    queryKey: ["my-habits-7", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(7);
      return data ?? [];
    },
    enabled: !!user,
  });

  const lastScan = scans?.[scans.length - 1];
  const recentScans = useMemo(() => (scans ?? []).slice().reverse().slice(0, 5), [scans]);

  const chartData = useMemo(() => (scans ?? []).map((s: any) => ({
    date: new Date(s.created_at).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
    shade: shadeIndex(s.primary_shade),
    shadeLabel: s.primary_shade,
  })), [scans]);

  const behavior = useMemo(() => {
    const arr = habits ?? [];
    if (arr.length === 0) return null;
    const avg = (k: string) => arr.reduce((s, h: any) => s + (h[k] ?? 0), 0) / arr.length;
    const brushPct = arr.reduce((s, h: any) => s + (h.brushing_morning ? 1 : 0) + (h.brushing_night ? 1 : 0), 0) / (arr.length * 2);
    return {
      coffee: avg("coffee_cups").toFixed(1),
      cigarettes: avg("cigarettes").toFixed(1),
      brushPct,
      flossPct: arr.filter((h: any) => h.flossing).length / arr.length,
    };
  }, [habits]);

  function level(v: number, hi: number, mid: number): { label: string; cls: string } {
    if (v >= hi) return { label: "High", cls: "bg-red-100 text-red-600" };
    if (v >= mid) return { label: "Moderate", cls: "bg-amber-100 text-amber-700" };
    return { label: "Good", cls: "bg-emerald-100 text-emerald-700" };
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      {/* Welcome hero */}
      <div className="rounded-3xl p-7 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <h1 className="text-2xl md:text-3xl font-semibold">
          Halo, {user?.user_metadata?.display_name || user?.email?.split("@")[0]} 👋
        </h1>
        <p className="mt-1 text-sm opacity-90">{isAdmin ? "Mode admin aktif." : "Lanjutkan perjalanan Anda menuju gigi yang lebih sehat."}</p>
      </div>

      {/* Steps */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StepCard n={1} title="Scan Gigi" desc="Scan warna gigi via kamera atau pilih manual." to="/scan" />
        <StepCard n={2} title="Log Kebiasaan" desc="Catat kopi, teh, rokok, dan rutinitas sikat gigi." to="/habit-tracker" />
        <StepCard n={3} title="Lihat Analisis" desc="Risk analysis & rekomendasi personal AI." to="/risk-analysis" />
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Shade Saat Ini" value={lastScan?.primary_shade ?? "—"} icon={TrendingUp} />
        <StatCard label="Total Scan" value={scans?.length ?? 0} icon={Camera} />
        <StatCard label="Hygiene Score" value={lastScan?.hygiene_score ? `${Math.round(Number(lastScan.hygiene_score))}/100` : "—"} icon={Activity} />
        <StatCard label="Log Habit (7H)" value={habits?.length ?? 0} icon={ListChecks} />
      </div>

      {/* Chart + Behavior */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-semibold text-foreground">Tooth Color Progress</h2>
          <p className="text-xs text-muted-foreground">Perubahan shade dari scan ke scan (lebih rendah = lebih putih)</p>
          <div className="mt-4 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="shadeFill" x1="0" y1="1" x2="0" y2="2.5">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="55%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1e-9} />
                    </linearGradient>
                    <linearGradient id="shadeLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary-glow))" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} reversed
                    tickFormatter={(v) => SHADE_ORDER[v] ?? ""}
                    domain={[0, SHADE_ORDER.length - 1]}
                    tickLine={false}
                    axisLine={false}
                    width={36} />
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0] as any;
                        return (
                          <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
                            <p className="text-[11px] text-muted-foreground">{label}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "hsl(var(--primary))" }} />
                              <p className="text-sm font-semibold text-foreground">Shade {p?.payload?.shadeLabel ?? "—"}</p>
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{(p?.payload?.shade ?? 5) <= 1 ? "Mendekati goal" : "Perlu perbaikan"}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={1} stroke="hsl(var(--primary))" strokeDasharray="6 4" strokeOpacity={2e-1}
                    label={{ value: "Goal A2", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--primary))", dy: -4 }} />
                  <Area
                    type="monotone"
                    dataKey="shade"
                    stroke="url(#shadeLine)"
                    strokeWidth={2.5}
                    fill="url(#shadeFill)"
                    dot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Belum ada data scan. <Link to="/scan" className="ml-1 text-primary hover:underline">Mulai →</Link>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-semibold text-foreground">Ringkasan Kebiasaan</h2>
          <p className="text-xs text-muted-foreground">Rata-rata 7 hari terakhir</p>
          {behavior ? (
            <div className="mt-4 space-y-2.5">
              <BehaviorRow icon={Coffee} label="Kopi" value={`${behavior.coffee} cup/hari`} lvl={level(Number(behavior.coffee), 3, 1)} />
              <BehaviorRow icon={Cigarette} label="Rokok" value={`${behavior.cigarettes} btg/hari`} lvl={level(Number(behavior.cigarettes), 5, 1)} />
              <BehaviorRow icon={Brush} label="Sikat Gigi" value={`${Math.round(behavior.brushPct * 100)}%`} lvl={level(1 - behavior.brushPct, 0.5, 0.2)} />
              <BehaviorRow icon={CheckCircle2} label="Flossing" value={`${Math.round(behavior.flossPct * 100)}%`} lvl={level(1 - behavior.flossPct, 0.7, 0.3)} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Belum ada log habit. <Link to="/habit-tracker" className="text-primary hover:underline">Catat sekarang →</Link></p>
          )}
        </div>
      </div>

      {/* Quick actions + Recent */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-semibold text-foreground">Aksi Cepat</h2>
          <div className="mt-4 space-y-3">
            <QuickAction to="/scan" title="Tooth Scan" desc="Cek warna gigi saat ini" icon={Camera} primary />
            <QuickAction to="/habit-tracker" title="Log Habit" desc="Catat aktivitas hari ini" icon={ListChecks} />
            <QuickAction to="/recommendations" title="Recommendations" desc="Lihat saran personal" icon={Sparkles} />
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-semibold text-foreground">Scan Terbaru</h2>
          {recentScans.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-4 py-2.5">Tanggal</th><th className="px-4 py-2.5">Shade</th><th className="px-4 py-2.5">Brightness</th><th className="px-4 py-2.5">Confidence</th></tr>
                </thead>
                <tbody>
                  {recentScans.map((s: any) => (
                    <tr key={s.id} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-2.5 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{s.primary_shade}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{s.brightness ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{s.confidence ? `${Math.round(Number(s.confidence))}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Belum ada scan. <Link to="/scan" className="text-primary hover:underline">Mulai scan pertama →</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StepCard({ n, title, desc, to }: { n: number; title: string; desc: string; to: string }) {
  return (
    <Link to={to} className="group rounded-2xl bg-card p-5 transition hover:border-primary/40 border border-transparent" style={{ boxShadow: "var(--shadow-card)" }}>
      <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>{n}</span>
      <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}

function QuickAction({ to, title, desc, icon: Icon, primary }: { to: string; title: string; desc: string; icon: any; primary?: boolean }) {
  return (
    <Link to={to}
      className={`flex items-center gap-3 rounded-xl p-3.5 transition ${primary ? "text-primary-foreground" : "bg-secondary/40 hover:bg-secondary/70 text-foreground"}`}
      style={primary ? { background: "var(--gradient-primary)" } : undefined}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${primary ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className={`text-[11px] ${primary ? "opacity-90" : "text-muted-foreground"}`}>{desc}</p>
      </div>
    </Link>
  );
}

function BehaviorRow({ icon: Icon, label, value, lvl }: { icon: any; label: string; value: string; lvl: { label: string; cls: string } }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card">
        <Icon className="h-4 w-4 text-foreground/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{value}</p>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${lvl.cls}`}>{lvl.label}</span>
    </div>
  );
}
