import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ChevronDown, Mail, User as UserIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/recommendations")({
  component: AdminRecs,
  head: () => ({ meta: [{ title: "Admin · Rekomendasi — Tintify" }] }),
});

function AdminRecs() {
  const { data: recs, isLoading } = useQuery({
    queryKey: ["admin-recs-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recommendations")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-for-recs"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, email, display_name, avatar_url");
      return data ?? [];
    },
  });

  // Group recommendations by user_id
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    (recs ?? []).forEach((r: any) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r);
      map.set(r.user_id, arr);
    });
    const profMap = new Map<string, any>((profiles ?? []).map((p: any) => [p.user_id, p]));
    return Array.from(map.entries()).map(([uid, items]) => ({
      user_id: uid,
      profile: profMap.get(uid),
      items,
      latest: items[0],
      totalItems: items.reduce((s, r) => s + (Array.isArray(r.items) ? r.items.length : 0), 0),
    }));
  }, [recs, profiles]);

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Rekomendasi AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daftar pengguna yang memiliki rekomendasi — klik untuk lihat detail.</p>
        </div>
      </header>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
        {grouped.map((g) => (
          <UserRecCard key={g.user_id} group={g} />
        ))}
        {!isLoading && grouped.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada rekomendasi.</p>
        )}
      </div>
    </div>
  );
}

function UserRecCard({ group }: { group: any }) {
  const [open, setOpen] = useState(false);
  const name = group.profile?.display_name ?? "Pengguna tanpa nama";
  const email = group.profile?.email ?? group.user_id;

  return (
    <div className="overflow-hidden rounded-2xl bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-secondary/30">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {group.profile?.avatar_url ? (
            <img src={group.profile.avatar_url} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <UserIcon className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Mail className="h-3 w-3" /> {email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-foreground">{group.items.length} sesi</p>
          <p className="text-[11px] text-muted-foreground">{group.totalItems} item total</p>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border bg-secondary/20 p-5">
          {group.items.map((r: any) => {
            const items = Array.isArray(r.items) ? r.items : [];
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 text-xs text-muted-foreground">
                  {new Date(r.updated_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · {items.length} rekomendasi
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {items.map((it: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-foreground">
                      <p className="font-medium">{it.title ?? it.action ?? "Rekomendasi"}</p>
                      {it.description && <p className="mt-1 text-muted-foreground">{it.description}</p>}
                      {it.priority && (
                        <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {it.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
