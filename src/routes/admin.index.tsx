import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, Camera, Activity, ListChecks, Sparkles, TrendingUp } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/")({
  component: AdminOverview,
  head: () => ({ meta: [{ title: "Admin Overview — Tintify" }] }),
});

function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: userCount },
        { count: scanCount },
        { count: habitCount },
        { count: recCount },
        { data: scans },
        { data: scans30 },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("tooth_scans").select("*", { count: "exact", head: true }),
        supabase.from("habit_logs").select("*", { count: "exact", head: true }),
        supabase.from("recommendations").select("*", { count: "exact", head: true }),
        supabase.from("tooth_scans").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("tooth_scans").select("created_at, primary_shade").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);

      const shadeCounts = new Map<string, number>();
      (scans30 ?? []).forEach((s: any) => {
        shadeCounts.set(s.primary_shade, (shadeCounts.get(s.primary_shade) ?? 0) + 1);
      });
      const shadeChart = Array.from(shadeCounts.entries())
        .map(([shade, count]) => ({ shade, count }))
        .sort((a, b) => a.shade.localeCompare(b.shade));

      const days: { day: string; scans: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const count = (scans30 ?? []).filter((s: any) => s.created_at.startsWith(key)).length;
        days.push({ day: d.toLocaleDateString("id-ID", { weekday: "short" }), scans: count });
      }

      return {
        userCount: userCount ?? 0,
        scanCount: scanCount ?? 0,
        habitCount: habitCount ?? 0,
        recCount: recCount ?? 0,
        recentScans: scans ?? [],
        shadeChart,
        trend: days,
      };
    },
  });

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ringkasan aktivitas seluruh platform Tintify.</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total Pengguna" value={stats?.userCount ?? 0} icon={Users} accent="from-violet-500 to-purple-500" />
        <Stat label="Total Scan" value={stats?.scanCount ?? 0} icon={Camera} accent="from-pink-500 to-rose-500" />
        <Stat label="Habit Logs" value={stats?.habitCount ?? 0} icon={ListChecks} accent="from-emerald-500 to-teal-500" />
        <Stat label="AI Rekomendasi" value={stats?.recCount ?? 0} icon={Sparkles} accent="from-amber-500 to-orange-500" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" /> Aktivitas Scan (7 Hari)
          </h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.trend ?? []}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Activity className="h-4 w-4 text-primary" /> Distribusi Shade (30 Hari)
          </h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.shadeChart ?? []}>
                <XAxis dataKey="shade" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-lg font-semibold text-foreground">Scan Terbaru</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-3 py-2.5">User</th><th className="px-3 py-2.5">Shade</th><th className="px-3 py-2.5">Tanggal</th></tr>
            </thead>
            <tbody>
              {(stats?.recentScans ?? []).map((s: any) => (
                <tr key={s.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{s.user_id.slice(0, 8)}…</td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{s.primary_shade}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{new Date(s.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</td>
                </tr>
              ))}
              {(!stats?.recentScans || stats.recentScans.length === 0) && (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-xs text-muted-foreground">Belum ada scan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: any; accent: string }) {
  return (
    <div className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
