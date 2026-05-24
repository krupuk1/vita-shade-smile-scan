import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/users")({
  component: AdminUsers,
  head: () => ({ meta: [{ title: "Admin · Pengguna — Tintify" }] }),
});

function AdminUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-all"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        const a = roleMap.get(r.user_id) ?? [];
        a.push(r.role);
        roleMap.set(r.user_id, a);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.user_id) ?? [] }));
    },
  });

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daftar lengkap pengguna terdaftar.</p>
        </div>
      </header>

      <div className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Gender</th>
                <th className="px-3 py-2.5">Usia</th>
                <th className="px-3 py-2.5">Plan</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Daftar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">Memuat…</td></tr>
              )}
              {(data ?? []).map((u: any) => (
                <tr key={u.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-foreground">{u.display_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground capitalize">{u.gender ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{u.age ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.subscription === "premium" ? "bg-amber-100 text-amber-700" : "bg-secondary text-muted-foreground"}`}>
                      {u.subscription ?? "free"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {(u.roles as string[]).map((r) => (
                        <span key={r} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r === "admin" ? "bg-violet-100 text-violet-700" : "bg-secondary text-muted-foreground"}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
              {!isLoading && (!data || data.length === 0) && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">Belum ada pengguna</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
