import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Database, Download, Upload, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportDatabase, importDatabase } from "@/lib/admin-backup.functions";

export const Route = createFileRoute("/admin/backup")({
  component: AdminBackup,
  head: () => ({ meta: [{ title: "Backup & Restore — Admin Tintify" }] }),
});

function AdminBackup() {
  const exportFn = useServerFn(exportDatabase);
  const importFn = useServerFn(importDatabase);
  const fileRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ counts: Record<string, number>; exported_at: string } | null>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string; payload: any; counts: Record<string, number> } | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [lastImport, setLastImport] = useState<{ mode: string; result: Record<string, { inserted: number }> } | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const res: any = await exportFn();
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `tintify-backup-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setLastExport({ counts: res.meta.counts, exported_at: res.meta.exported_at });
      toast.success("Backup berhasil diunduh");
    } catch (e: any) {
      toast.error(e?.message || "Export gagal");
    } finally {
      setExporting(false);
    }
  }

  async function handleFileSelected(file: File) {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload?.data || typeof payload.data !== "object") {
        throw new Error("Format file backup tidak valid");
      }
      const counts: Record<string, number> = {};
      for (const [t, rows] of Object.entries(payload.data)) {
        counts[t] = Array.isArray(rows) ? rows.length : 0;
      }
      setPendingFile({ name: file.name, payload, counts });
      setLastImport(null);
    } catch (e: any) {
      toast.error(e?.message || "File tidak valid");
    }
  }

  async function handleImport() {
    if (!pendingFile) return;
    if (mode === "replace") {
      const ok = confirm(
        "MODE REPLACE akan MENGHAPUS semua data saat ini sebelum restore. Tindakan ini tidak bisa dibatalkan. Lanjutkan?",
      );
      if (!ok) return;
    }
    setImporting(true);
    try {
      const res: any = await importFn({ data: { payload: pendingFile.payload, mode } });
      setLastImport({ mode: res.mode, result: res.result });
      toast.success("Restore selesai");
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast.error(e?.message || "Restore gagal");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Backup & Restore</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ekspor seluruh data aplikasi ke file JSON dan pulihkan kembali bila diperlukan.
          </p>
        </div>
      </header>

      {/* Export */}
      <section className="mb-6 rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Download className="h-4 w-4 text-primary" /> Backup Database
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mengunduh semua tabel publik (profil, peran, artikel, scan, habit, risk, rekomendasi, pengaturan AI) ke satu file JSON.
        </p>
        <div className="mt-4">
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Mengekspor…" : "Unduh Backup (.json)"}
          </Button>
        </div>
        {lastExport && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
            <div className="mb-2 flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Backup terakhir: {new Date(lastExport.exported_at).toLocaleString("id-ID")}
            </div>
            <CountsGrid counts={lastExport.counts} />
          </div>
        )}
      </section>

      {/* Restore */}
      <section className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Upload className="h-4 w-4 text-primary" /> Restore Database
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pulihkan dari file backup. Pilih mode <b>Merge</b> (upsert berdasarkan id) atau <b>Replace</b> (hapus dulu lalu isi ulang).
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelected(f);
            }}
            className="block w-full max-w-sm text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-secondary/80"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" checked={mode === "merge"} onChange={() => setMode("merge")} />
            Merge (aman — update jika id sama)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
            Replace (hapus semua dulu)
          </label>
        </div>

        {mode === "replace" && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Mode Replace akan menghapus seluruh data publik sebelum restore. Pastikan file backup valid.
          </div>
        )}

        {pendingFile && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
            <div className="mb-2 font-medium text-foreground">File: {pendingFile.name}</div>
            <CountsGrid counts={pendingFile.counts} />
          </div>
        )}

        <div className="mt-4">
          <Button onClick={handleImport} disabled={!pendingFile || importing} variant={mode === "replace" ? "destructive" : "default"}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? "Memulihkan…" : `Jalankan Restore (${mode})`}
          </Button>
        </div>

        {lastImport && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
            <div className="mb-2 flex items-center gap-2 font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Restore selesai (mode: {lastImport.mode})
            </div>
            <CountsGrid counts={Object.fromEntries(Object.entries(lastImport.result).map(([k, v]) => [k, v.inserted]))} />
          </div>
        )}
      </section>
    </div>
  );
}

function CountsGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {Object.entries(counts).map(([t, n]) => (
        <div key={t} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5">
          <span className="text-xs text-muted-foreground">{t}</span>
          <span className="text-sm font-semibold text-foreground">{n}</span>
        </div>
      ))}
    </div>
  );
}
