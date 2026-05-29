import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Camera, Activity, ListChecks, Sparkles, TrendingUp, Coffee, Cigarette, Brush, CheckCircle2, Info } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useLang, useT } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Tintify" }] }),
});

const SHADE_ORDER = ["A1", "A2", "A3", "A3.5", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D2", "D3", "D4"];
const SHADE_COLORS: Record<string, string> = {
  B1: "#f4ecd6", A1: "#efe3c4", B2: "#ecdcb4", D2: "#e6d4ab",
  A2: "#e3cf9f", C1: "#dec8a0", C2: "#d2b98c", D4: "#cdb284",
  A3: "#c9ac7b", D3: "#c1a574", B3: "#bb9e6b", "A3.5": "#b69664",
  B4: "#ad8b58", C3: "#a4824f", A4: "#8f6e3f", C4: "#7a5a30",
};
const SHADE_DESC: Record<string, string> = {
  A1: "Putih krem — paling cerah grup A",
  A2: "Krem alami terang",
  A3: "Krem alami sedang",
  "A3.5": "Krem alami gelap",
  A4: "Krem sangat gelap",
  B1: "Paling cerah — putih murni",
  B2: "Putih kekuningan terang",
  B3: "Putih kekuningan sedang",
  B4: "Putih kekuningan gelap",
  C1: "Abu-abu kekuningan terang",
  C2: "Abu-abu kekuningan",
  C3: "Abu-abu kekuningan gelap",
  C4: "Paling gelap dari semua shade",
  D2: "Kuning pucat terang",
  D3: "Kuning pucat sedang",
  D4: "Kuning pucat",
};
function shadeIndex(s: string) {
  const i = SHADE_ORDER.indexOf(s);
  return i >= 0 ? i : 5;
}

function Dashboard() {
  const { user, isAdmin } = useAuth();
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "en" ? "en-US" : "id-ID";

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

  // Aggregate scans into the last 6 months (avg shade index per month, latest scan label)
  const chartData = useMemo(() => {
    const months: { key: string; label: string; date: Date }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString(locale, { month: "short", year: "2-digit" }),
        date: d,
      });
    }
    const buckets = new Map<string, { sum: number; n: number; last: string }>();
    (scans ?? []).forEach((s: any) => {
      const dt = new Date(s.created_at);
      const k = `${dt.getFullYear()}-${dt.getMonth()}`;
      const b = buckets.get(k) ?? { sum: 0, n: 0, last: s.primary_shade };
      b.sum += shadeIndex(s.primary_shade);
      b.n += 1;
      b.last = s.primary_shade;
      buckets.set(k, b);
    });
    return months.map((m) => {
      const b = buckets.get(m.key);
      return {
        date: m.label,
        shade: b ? b.sum / b.n : null,
        shadeLabel: b?.last ?? null,
        count: b?.n ?? 0,
      };
    });
  }, [scans]);
  const hasShadeData = chartData.some((d) => d.shade !== null);

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
    if (v >= hi) return { label: t.dashboard.level.high, cls: "bg-red-100 text-red-600" };
    if (v >= mid) return { label: t.dashboard.level.moderate, cls: "bg-amber-100 text-amber-700" };
    return { label: t.dashboard.level.good, cls: "bg-emerald-100 text-emerald-700" };
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 md:p-10">
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
        <ShadeStatCard shade={lastScan?.primary_shade ?? null} />
        <StatCard label="Total Scan" value={scans?.length ?? 0} icon={Camera} />
        <StatCard label="Hygiene Score" value={lastScan?.hygiene_score ? `${Math.round(Number(lastScan.hygiene_score))}/100` : "—"} icon={Activity} />
        <StatCard label="Log Habit (7H)" value={habits?.length ?? 0} icon={ListChecks} />
      </div>

      {/* Chart + Behavior */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Tooth Color Progress</h2>
              <p className="text-xs text-muted-foreground">6 bulan terakhir — lebih rendah = lebih putih</p>
            </div>
            <ShadeLegendButton />
          </div>
          <div className="mt-4 h-64">
            {hasShadeData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="shadeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary-glow)" stopOpacity={0.7} />
                      <stop offset="50%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="shadeLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--primary-glow)" />
                      <stop offset="100%" stopColor="var(--primary)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} reversed
                    tickFormatter={(v) => SHADE_ORDER[v] ?? ""}
                    domain={[0, SHADE_ORDER.length - 1]}
                    tickLine={false}
                    axisLine={false}
                    width={36} />
                  <Tooltip
                    cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0] as any;
                        const shadeLabel = p?.payload?.shadeLabel;
                        if (!shadeLabel) return null;
                        return (
                          <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
                            <p className="text-[11px] text-muted-foreground">{label}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="inline-block h-3 w-3 rounded-sm border border-border" style={{ background: SHADE_COLORS[shadeLabel] }} />
                              <p className="text-sm font-semibold text-foreground">Shade {shadeLabel}</p>
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{SHADE_DESC[shadeLabel] ?? ""}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">{p?.payload?.count} scan bulan ini</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={1} stroke="var(--primary)" strokeDasharray="6 4" strokeOpacity={0.4}
                    label={{ value: "Goal A2", position: "insideTopRight", fontSize: 10, fill: "var(--primary)", dy: -4 }} />
                  <Area
                    type="monotone"
                    dataKey="shade"
                    stroke="url(#shadeLine)"
                    strokeWidth={2.5}
                    fill="url(#shadeFill)"
                    connectNulls
                    dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--primary)" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }}
                  />

                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Belum ada data scan. <Link to="/scan" className="ml-1 text-primary hover:underline">Mulai →</Link>
              </div>
            )}
          </div>
          {/* Inline shade legend strip */}
          <div className="mt-4 border-t border-border/40 pt-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Skala VITA Shade (cerah → gelap)</p>
            <div className="flex flex-wrap gap-1.5">
              {SHADE_ORDER.map((s) => (
                <HoverCard key={s} openDelay={100}>
                  <HoverCardTrigger asChild>
                    <button className="flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5">
                      <span className="h-2.5 w-2.5 rounded-full border border-foreground/10" style={{ background: SHADE_COLORS[s] }} />
                      {s}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-56 p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-md border border-border" style={{ background: SHADE_COLORS[s] }} />
                      <div>
                        <p className="text-sm font-semibold">Shade {s}</p>
                        <p className="text-[10px] text-muted-foreground">Grup {s[0]}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{SHADE_DESC[s]}</p>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
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
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
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

function ShadeStatCard({ shade }: { shade: string | null }) {
  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <button className="text-left rounded-2xl bg-card p-5 transition hover:ring-2 hover:ring-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Shade Saat Ini</p>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold text-foreground">{shade ?? "—"}</p>
            {shade && SHADE_COLORS[shade] && (
              <span className="h-6 w-6 rounded-md border border-border" style={{ background: SHADE_COLORS[shade] }} />
            )}
          </div>
          {shade && SHADE_DESC[shade] && (
            <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">{SHADE_DESC[shade]}</p>
          )}
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-3">
        <p className="text-xs font-semibold text-foreground">Penjelasan Shade</p>
        {shade ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-9 w-9 rounded-md border border-border" style={{ background: SHADE_COLORS[shade] ?? "#ddd" }} />
              <div>
                <p className="text-sm font-semibold">Shade {shade}</p>
                <p className="text-[10px] text-muted-foreground">Grup {shade[0]}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{SHADE_DESC[shade] ?? "—"}</p>
          </>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Belum ada scan. Lakukan scan pertama untuk melihat shade Anda.</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

function ShadeLegendButton() {
  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
          <Info className="h-3 w-3" /> Legend
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-3">
        <p className="text-xs font-semibold">VITA Shade Guide</p>
        <p className="mt-1 text-[10px] text-muted-foreground">A = krem · B = putih kekuningan · C = abu kekuningan · D = kuning pucat</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {SHADE_ORDER.map((s) => (
            <div key={s} className="flex flex-col items-center gap-0.5">
              <span className="h-6 w-full rounded-md border border-border" style={{ background: SHADE_COLORS[s] }} title={SHADE_DESC[s]} />
              <span className="text-[10px] font-semibold text-foreground">{s}</span>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
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
