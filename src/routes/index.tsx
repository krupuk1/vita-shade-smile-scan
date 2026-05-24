import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Upload, Sparkles, Loader2, RotateCcw, Camera, ShieldCheck } from "lucide-react";
import { analyzeTeeth, type ToothAnalysis } from "@/lib/analyze-teeth.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "DentaShade — Cek Warna Gigi VITA dengan AI" },
      {
        name: "description",
        content:
          "Unggah foto gigi dan dapatkan analisis warna VITA Classical Shade instan berbasis AI. Estimasi shade, kecerahan, dan rekomendasi perawatan.",
      },
    ],
  }),
});

// VITA shade swatches (approximate hex visualization)
const SHADE_COLORS: Record<string, string> = {
  B1: "#f4ecd6", A1: "#efe3c4", B2: "#ecdcb4", D2: "#e6d4ab",
  A2: "#e3cf9f", C1: "#dec8a0", C2: "#d2b98c", D4: "#cdb284",
  A3: "#c9ac7b", D3: "#c1a574", B3: "#bb9e6b", "A3.5": "#b69664",
  B4: "#ad8b58", C3: "#a4824f", A4: "#8f6e3f", C4: "#7a5a30",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Home() {
  const analyzeFn = useServerFn(analyzeTeeth);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await fileToBase64(file);
      setPreview(base64);
      return analyzeFn({ data: { imageBase64: base64 } });
    },
    onError: (err: Error) => toast.error(err.message || "Analisis gagal"),
  });

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      toast.error("Ukuran maksimal 7MB");
      return;
    }
    mutation.mutate(file);
  };

  const reset = () => {
    setPreview(null);
    mutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const result = mutation.data;

  return (
    <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Bertenaga AI Visi
          </div>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
            Denta<span className="italic text-primary">Shade</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Unggah foto gigi Anda dan dapatkan estimasi warna berdasarkan{" "}
            <span className="font-medium text-foreground">VITA Classical Shade Guide</span> secara
            instan.
          </p>
        </header>

        {/* Upload / Preview */}
        {!preview && !result && (
          <UploadZone
            onPick={() => fileInputRef.current?.click()}
            onDrop={(f) => handleFile(f)}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {preview && (
          <section className="grid gap-6 md:grid-cols-2">
            <div
              className="overflow-hidden rounded-3xl bg-card p-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <img
                src={preview}
                alt="Foto gigi yang dianalisis"
                className="aspect-square w-full rounded-2xl object-cover"
              />
              <button
                onClick={reset}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                <RotateCcw className="h-4 w-4" />
                Analisis foto lain
              </button>
            </div>

            <div className="flex flex-col">
              {mutation.isPending && <LoadingPanel />}
              {result && <ResultPanel result={result} />}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <footer className="mt-16 flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted-foreground backdrop-blur">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <span className="font-medium text-foreground">Disclaimer:</span> Hasil analisis bersifat
            estimasi berbasis foto dan tidak menggantikan pemeriksaan dokter gigi profesional.
            Pencahayaan, kamera, dan latar belakang dapat memengaruhi akurasi.
          </p>
        </footer>
      </div>
    </main>
  );
}

function UploadZone({ onPick, onDrop }: { onPick: () => void; onDrop: (f: File) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onDrop(f);
      }}
      onClick={onPick}
      className={`group cursor-pointer rounded-3xl border-2 border-dashed bg-card/70 p-12 text-center backdrop-blur transition md:p-20 ${
        over ? "border-primary bg-accent/40" : "border-border hover:border-primary"
      }`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-primary-foreground"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
      >
        <Upload className="h-9 w-9" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
        Unggah foto gigi Anda
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Tarik & lepas, atau klik untuk memilih. Senyum lebar dengan pencahayaan terang memberi
        hasil terbaik.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition group-hover:opacity-90">
        <Camera className="h-4 w-4" />
        Pilih foto
      </div>
      <p className="mt-4 text-xs text-muted-foreground">JPG / PNG, maks 7MB</p>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center rounded-3xl bg-card p-10 text-center"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <h3 className="mt-4 text-xl font-semibold text-foreground">Menganalisis…</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        AI sedang mencocokkan dengan VITA shade guide
      </p>
    </div>
  );
}

function ResultPanel({ result }: { result: ToothAnalysis }) {
  const lowConfidence = result.confidence < 40;
  return (
    <div
      className="flex flex-col gap-5 rounded-3xl bg-card p-6 md:p-8"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Primary shade hero */}
      <div className="flex items-center gap-5">
        <div
          className="h-24 w-24 shrink-0 rounded-2xl border border-border"
          style={{
            background: SHADE_COLORS[result.primaryShade] ?? "#ddd",
            boxShadow: "inset 0 -8px 16px rgba(0,0,0,0.1)",
          }}
        />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            VITA Shade Utama
          </p>
          <p className="mt-1 font-display text-5xl font-semibold text-foreground">
            {result.primaryShade}
          </p>
          {result.secondaryShade && result.secondaryShade.trim() !== "" && (
            <p className="text-sm text-muted-foreground">
              Alternatif: <span className="font-medium">{result.secondaryShade}</span>
            </p>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Kecerahan" value={brightnessLabel(result.brightness)} />
        <Metric label="Confidence" value={`${Math.round(result.confidence)}%`} />
        <Metric label="Skor Kebersihan" value={`${Math.round(result.hygieneScore)}/100`} />
        <Metric label="Tipe" value="Estetika" />
      </div>

      {/* Summary */}
      <p className="rounded-2xl bg-secondary/60 p-4 text-sm leading-relaxed text-foreground">
        {result.summary}
      </p>

      {lowConfidence && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          Confidence rendah — coba foto ulang dengan pencahayaan lebih terang dan gigi terlihat
          jelas.
        </p>
      )}

      {/* Observations */}
      <Section title="Observasi" items={result.observations} />
      <Section title="Rekomendasi" items={result.recommendations} accent />
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

function Section({
  title,
  items,
  accent = false,
}: {
  title: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                accent ? "bg-primary" : "bg-foreground/40"
              }`}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function brightnessLabel(b: ToothAnalysis["brightness"]) {
  return (
    {
      "very-light": "Sangat Terang",
      light: "Terang",
      medium: "Sedang",
      dark: "Gelap",
    } as const
  )[b];
}
