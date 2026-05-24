import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/articles")({
  component: AdminArticles,
  head: () => ({ meta: [{ title: "Artikel — Admin Tintify" }] }),
});

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  category: string | null;
  published: boolean;
  created_at: string;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}

function AdminArticles() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Article> | null>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Hapus artikel ini?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Artikel dihapus");
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
  }

  async function togglePublish(a: Article) {
    const { error } = await supabase.from("articles").update({ published: !a.published }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success(a.published ? "Disembunyikan" : "Dipublikasi");
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <header className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Artikel & Konten</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola artikel edukasi untuk pengguna.</p>
          </div>
        </div>
        <button
          onClick={() => setEditing({ title: "", slug: "", excerpt: "", content: "", category: "", cover_url: "", published: false })}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Plus className="h-4 w-4" /> Artikel Baru
        </button>
      </header>

      <div className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !articles?.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Belum ada artikel. Klik "Artikel Baru" untuk membuat.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">Judul</th>
                  <th className="px-3 py-2.5">Kategori</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Dibuat</th>
                  <th className="px-3 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-3">
                      <div className="font-medium text-foreground">{a.title}</div>
                      <div className="text-[11px] text-muted-foreground">/{a.slug}</div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{a.category || "-"}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${a.published ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {a.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => togglePublish(a)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title={a.published ? "Sembunyikan" : "Publikasi"}>
                          {a.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setEditing(a)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <ArticleEditor article={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin-articles"] }); }} />}
    </div>
  );
}

function ArticleEditor({ article, onClose, onSaved }: { article: Partial<Article>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: article.title ?? "",
    slug: article.slug ?? "",
    excerpt: article.excerpt ?? "",
    content: article.content ?? "",
    category: article.category ?? "",
    cover_url: article.cover_url ?? "",
    published: article.published ?? false,
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!article.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Judul wajib diisi");
    const slug = form.slug.trim() || slugify(form.title);
    setSaving(true);
    const payload = { ...form, slug, excerpt: form.excerpt || null, cover_url: form.cover_url || null, category: form.category || null };
    const { error } = isEdit
      ? await supabase.from("articles").update(payload).eq("id", article.id!)
      : await supabase.from("articles").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Artikel diperbarui" : "Artikel dibuat");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-card p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{isEdit ? "Edit Artikel" : "Artikel Baru"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Judul">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug (URL)">
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="Kategori">
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tips, Edukasi, ..." className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
          </div>
          <Field label="URL Cover (opsional)">
            <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </Field>
          <Field label="Ringkasan">
            <textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </Field>
          <Field label="Konten (Markdown)">
            <textarea required rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 rounded border-border" />
            Publikasikan sekarang
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-border bg-background px-4 py-2 text-sm hover:bg-secondary">Batal</button>
            <button disabled={saving} type="submit" className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60" style={{ background: "var(--gradient-primary)" }}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
