import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { Upload, Sparkles, Loader2, RotateCcw, Camera, ShieldCheck, Hand, FileImage, Video, ListChecks, Activity } from "lucide-react";
import { analyzeTeeth, saveScan, type ToothAnalysis } from "@/lib/analyze-teeth.functions";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/scan")({
  component: ScanPage,
  head: () => ({ meta: [{ title: "Tooth Scan — Tintify" }] }),
});

const SHADE_COLORS: Record<string, string> = {
  B1: "#f4ecd6", A1: "#efe3c4", B2: "#ecdcb4", D2: "#e6d4ab",
  A2: "#e3cf9f", C1: "#dec8a0", C2: "#d2b98c", D4: "#cdb284",
  A3: "#c9ac7b", D3: "#c1a574", B3: "#bb9e6b", "A3.5": "#b69664",
  B4: "#ad8b58", C3: "#a4824f", A4: "#8f6e3f", C4: "#7a5a30",
};
const SHADES = Object.keys(SHADE_COLORS);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ScanPage() {
  const analyzeFn = useServerFn(analyzeTeeth);
  const saveFn = useServerFn(saveScan);
  const [preview, setPreview] = useState<string | null>(null);
  const [method, setMethod] = useState<"upload" | "photo" | "manual">("upload");

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await fileToBase64(file);
      setPreview(base64);
      const result = await analyzeFn({ data: { imageBase64: base64 } });
      await saveFn({ data: { result, method, imageBase64: base64 } }).catch(() => {});
      return result;
    },
    onError: (err: Error) => toast.error(err.message || "Analisis gagal"),
  });

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("File harus berupa gambar");
    if (file.size > 7 * 1024 * 1024) return toast.error("Ukuran maksimal 7MB");
    mutation.mutate(file);
  };

  const reset = () => { setPreview(null); mutation.reset(); };

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tooth Scan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Analisis warna gigi berbasis VITA Classical Shade.</p>
      </header>

      {!preview && !mutation.data && (
        <Tabs value={method} onValueChange={(v) => setMethod(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upload"><FileImage className="mr-1.5 h-4 w-4" />Upload</TabsTrigger>
            <TabsTrigger value="photo"><Video className="mr-1.5 h-4 w-4" />Foto</TabsTrigger>
            <TabsTrigger value="manual"><Hand className="mr-1.5 h-4 w-4" />Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <UploadZone onPick={handleFile} mode="upload" />
          </TabsContent>
          <TabsContent value="photo" className="mt-6">
            <UploadZone onPick={handleFile} mode="photo" />
          </TabsContent>
          <TabsContent value="manual" className="mt-6">
            <ManualShadePicker />
          </TabsContent>
        </Tabs>
      )}

      {preview && (
        <section className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-card p-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <img src={preview} alt="Foto gigi" className="aspect-square w-full rounded-2xl object-cover" />
            <button onClick={reset} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-secondary">
              <RotateCcw className="h-4 w-4" /> Analisis foto lain
            </button>
          </div>
          <div className="flex flex-col">
            {mutation.isPending && <LoadingPanel />}
            {mutation.data && <ResultPanel result={mutation.data} />}
          </div>
        </section>
      )}

      <footer className="mt-12 flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted-foreground backdrop-blur">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p><span className="font-medium text-foreground">Disclaimer:</span> Hasil bersifat estimasi berbasis foto dan tidak menggantikan pemeriksaan dokter gigi profesional.</p>
      </footer>
    </div>
  );
}

function UploadZone({ onPick, mode }: { onPick: (f: File) => void; mode: "upload" | "photo" }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) onPick(f); }}
        onClick={() => ref.current?.click()}
        className={`group cursor-pointer rounded-3xl border-2 border-dashed bg-card/70 p-12 text-center backdrop-blur transition md:p-16 ${over ? "border-primary bg-accent/40" : "border-border hover:border-primary"}`}
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          {mode === "photo" ? <Camera className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
        </div>
        <h2 className="text-2xl font-semibold text-foreground">{mode === "photo" ? "Ambil foto sekarang" : "Unggah foto gigi"}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {mode === "photo" ? "Buka kamera dan ambil foto gigi dengan pencahayaan terang." : "Tarik & lepas, atau klik untuk memilih. JPG/PNG, maks 7MB."}
        </p>
      </div>
      <input ref={ref} type="file" accept="image/*" {...(mode === "photo" ? { capture: "environment" as any } : {})} className="hidden" onChange={(e) => onPick(e.target.files?.[0] as File)} />
    </>
  );
}

function ManualShadePicker() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="rounded-3xl bg-card p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-sm text-muted-foreground">Pilih shade yang paling mendekati warna gigi Anda (cocokkan di depan cermin dengan pencahayaan terang).</p>
      <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8">
        {SHADES.map((code) => (
          <button
            key={code}
            onClick={() => setSelected(code)}
            className={`rounded-xl border p-2 text-center transition ${selected === code ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}
          >
            <div className="aspect-square w-full rounded-lg" style={{ background: SHADE_COLORS[code], boxShadow: "inset 0 -6px 12px rgba(0,0,0,0.1)" }} />
            <p className="mt-1.5 text-xs font-medium text-foreground">{code}</p>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm text-foreground">Anda memilih: <span className="font-semibold text-primary">{selected}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Hasil manual tidak tersimpan otomatis. Untuk analisis lengkap & history, gunakan tab Upload atau Foto.</p>
        </div>
      )}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-3xl bg-card p-10 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <h3 className="mt-4 text-xl font-semibold text-foreground">Menganalisis…</h3>
      <p className="mt-1 text-sm text-muted-foreground">AI sedang mencocokkan dengan VITA shade guide</p>
    </div>
  );
}

function ResultPanel({ result }: { result: ToothAnalysis }) {
  const low = result.confidence < 40;
  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-card p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-5">
        <div className="h-24 w-24 shrink-0 rounded-2xl border border-border" style={{ background: SHADE_COLORS[result.primaryShade] ?? "#ddd", boxShadow: "inset 0 -8px 16px rgba(0,0,0,0.1)" }} />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">VITA Shade Utama</p>
          <p className="mt-1 text-5xl font-semibold text-foreground">{result.primaryShade}</p>
          {result.secondaryShade?.trim() && <p className="text-sm text-muted-foreground">Alternatif: <span className="font-medium">{result.secondaryShade}</span></p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Kecerahan" value={brightnessLabel(result.brightness)} />
        <Metric label="Confidence" value={`${Math.round(result.confidence)}%`} />
        <Metric label="Hygiene" value={`${Math.round(result.hygieneScore)}/100`} />
        <Metric label="Tipe" value="Estetika" />
      </div>
      <p className="rounded-2xl bg-secondary/60 p-4 text-sm leading-relaxed text-foreground">{result.summary}</p>
      {low && <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">Confidence rendah — coba foto ulang dengan pencahayaan lebih terang.</p>}
      <Section title="Observasi" items={result.observations} />
      <Section title="Rekomendasi" items={result.recommendations} accent />

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Link to="/habit-tracker" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90" style={{ background: "var(--gradient-primary)" }}>
          <ListChecks className="h-4 w-4" /> Catat Habit Hari Ini
        </Link>
        <Link to="/risk-analysis" className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10">
          <Activity className="h-4 w-4" /> Lihat Risk Analysis
        </Link>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Section({ title, items, accent = false }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accent ? "bg-primary" : "bg-foreground/40"}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function brightnessLabel(b: ToothAnalysis["brightness"]) {
  return ({ "very-light": "Sangat Terang", light: "Terang", medium: "Sedang", dark: "Gelap" } as const)[b];
}
