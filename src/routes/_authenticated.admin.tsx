import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, Camera, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userRes.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Tintify" }] }),
});

function AdminPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: userCount }, { count: scanCount }, { data: scans }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("tooth_scans").select("*", { count: "exact", head: true }),
        supabase.from("tooth_scans").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      return { userCount: userCount ?? 0, scanCount: scanCount ?? 0, recentScans: scans ?? [] };
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview seluruh aktivitas platform.</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total Pengguna" value={stats?.userCount ?? 0} icon={Users} />
        <Stat label="Total Scan" value={stats?.scanCount ?? 0} icon={Camera} />
        <Stat label="Status" value="Healthy" icon={Activity} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Scan Terbaru (Semua Pengguna)</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">User ID</th><th className="px-4 py-3">Shade</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Tanggal</th></tr>
            </thead>
            <tbody>
              {(stats?.recentScans ?? []).map((s: any) => (
                <tr key={s.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.user_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.primary_shade}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.method}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
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
