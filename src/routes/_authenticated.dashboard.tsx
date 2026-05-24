import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, Activity, ListChecks, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Tintify" }] }),
});

function Dashboard() {
  const { user, isAdmin } = useAuth();

  const { data: scans } = useQuery({
    queryKey: ["my-scans", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tooth_scans").select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const lastScan = scans?.[0];

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Halo, {user?.user_metadata?.display_name || user?.email?.split("@")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{isAdmin ? "Mode admin aktif." : "Selamat datang kembali di Tintify."}</p>
        </div>
        <Link to="/scan" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90" style={{ background: "var(--gradient-primary)" }}>
          <Camera className="h-4 w-4" /> Scan baru
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Total Scan" value={scans?.length ?? 0} icon={Camera} />
        <StatCard label="Shade Terakhir" value={lastScan?.primary_shade ?? "—"} icon={TrendingUp} />
        <StatCard label="Hygiene Score" value={lastScan?.hygiene_score ? `${Math.round(Number(lastScan.hygiene_score))}/100` : "—"} icon={Activity} />
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <QuickCard to="/risk-analysis" title="Risk Analysis" desc="Lihat risiko gigi berbasis AI" icon={Activity} />
        <QuickCard to="/recommendations" title="Recommendations" desc="Saran perawatan personal" icon={Sparkles} />
        <QuickCard to="/habit-tracker" title="Habit Tracker" desc="Catat kebiasaan harian" icon={ListChecks} />
      </div>

      {/* Recent scans */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Scan Terbaru</h2>
        {scans && scans.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Shade</th><th className="px-4 py-3">Brightness</th><th className="px-4 py-3">Confidence</th></tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{s.primary_shade}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.brightness}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.confidence ? `${Math.round(Number(s.confidence))}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada scan. <Link to="/scan" className="text-primary hover:underline">Mulai scan pertama →</Link></p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function QuickCard({ to, title, desc, icon: Icon }: { to: string; title: string; desc: string; icon: any }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
