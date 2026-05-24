import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/recommendations")({
  component: AdminRecs,
  head: () => ({ meta: [{ title: "Admin · Rekomendasi — Tintify" }] }),
});

function AdminRecs() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-recs-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recommendations")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Rekomendasi AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">Rekomendasi terbaru yang dihasilkan AI untuk setiap pengguna.</p>
        </div>
      </header>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
        {(data ?? []).map((r: any) => {
          const items = Array.isArray(r.items) ? r.items : [];
          return (
            <div key={r.id} className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-muted-foreground">{r.user_id.slice(0, 8)}…</p>
                <p className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {items.slice(0, 4).map((it: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-foreground">
                    <p className="font-medium">{it.title ?? it.action ?? "Rekomendasi"}</p>
                    {it.description && <p className="mt-1 text-muted-foreground">{it.description}</p>}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Total {items.length} item</p>
            </div>
          );
        })}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">Belum ada rekomendasi.</p>
        )}
      </div>
    </div>
  );
}
