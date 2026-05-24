import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/scans")({
  component: AdminScans,
  head: () => ({ meta: [{ title: "Admin · Scan — Tintify" }] }),
});

function AdminScans() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-scans-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tooth_scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Riwayat Scan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daftar 200 scan terakhir di seluruh platform.</p>
        </div>
      </header>

      <div className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">User</th>
                <th className="px-3 py-2.5">Primary</th>
                <th className="px-3 py-2.5">Secondary</th>
                <th className="px-3 py-2.5">Method</th>
                <th className="px-3 py-2.5">Confidence</th>
                <th className="px-3 py-2.5">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">Memuat…</td></tr>}
              {(data ?? []).map((s: any) => (
                <tr key={s.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{s.user_id.slice(0, 8)}…</td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{s.primary_shade}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.secondary_shade ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground capitalize">{s.method}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.confidence ? `${Math.round(Number(s.confidence) * 100)}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</td>
                </tr>
              ))}
              {!isLoading && (!data || data.length === 0) && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">Belum ada scan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
