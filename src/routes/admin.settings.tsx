import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, ShieldCheck, ShieldOff, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
  head: () => ({ meta: [{ title: "Settings — Admin Tintify" }] }),
});

function AdminSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("user_id, email, display_name").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const adminSet = new Set((roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
      return (profiles ?? []).map((p: any) => ({ ...p, isAdmin: adminSet.has(p.user_id) }));
    },
  });

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    if (userId === user?.id && !makeAdmin) {
      if (!confirm("Anda akan mencabut akses admin diri sendiri. Lanjutkan?")) return;
    }
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Dijadikan admin");
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Akses admin dicabut");
    }
    qc.invalidateQueries({ queryKey: ["admin-roles"] });
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Pengaturan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Konfigurasi sistem & manajemen akses admin.</p>
        </div>
      </header>

      <section className="mb-6 rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Info className="h-4 w-4 text-primary" /> Info Aplikasi</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Row k="Nama Aplikasi" v="Tintify" />
          <Row k="Versi" v="1.0.0" />
          <Row k="Mode AI" v="Lovable AI Gateway" />
          <Row k="Akun Admin Aktif" v={String(data?.filter((p) => p.isAdmin).length ?? "-")} />
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Manajemen Role Admin</h2>
        <p className="mt-1 text-xs text-muted-foreground">Jadikan pengguna lain admin atau cabut akses.</p>

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-3 py-2.5">Pengguna</th><th className="px-3 py-2.5">Email</th><th className="px-3 py-2.5">Role</th><th className="px-3 py-2.5 text-right">Aksi</th></tr>
              </thead>
              <tbody>
                {(data ?? []).map((p) => (
                  <tr key={p.user_id} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-3 font-medium text-foreground">{p.display_name || "-"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${p.isAdmin ? "bg-violet-500/10 text-violet-600" : "bg-muted text-muted-foreground"}`}>
                        {p.isAdmin ? "admin" : "user"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => toggleAdmin(p.user_id, !p.isAdmin)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${p.isAdmin ? "border border-border bg-background text-foreground hover:bg-destructive/10 hover:text-destructive" : "text-primary-foreground hover:opacity-90"}`}
                        style={p.isAdmin ? undefined : { background: "var(--gradient-primary)" }}
                      >
                        {p.isAdmin ? <><ShieldOff className="h-3 w-3" /> Cabut Admin</> : <><ShieldCheck className="h-3 w-3" /> Jadikan Admin</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="text-sm font-medium text-foreground">{v}</dd>
    </div>
  );
}
