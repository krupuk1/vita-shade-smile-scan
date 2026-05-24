import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Info, SlidersHorizontal, RotateCcw, Save, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/shades")({
  component: ShadesPage,
  head: () => ({
    meta: [
      { title: "Panduan Warna VITA Shade — Tintify" },
      {
        name: "description",
        content:
          "Panduan lengkap VITA Classical Shade dengan kalibrasi warna interaktif untuk menyesuaikan dengan referensi Anda.",
      },
    ],
  }),
});

interface VitaShade {
  code: string;
  hex: string;
  group: "A" | "B" | "C" | "D";
  description: string;
  position: number;
}

// Kalibrasi mendekati VITA Classical A1–D4 (representasi sRGB)
const DEFAULT_SHADES: VitaShade[] = [
  { code: "B1",   hex: "#ede6d3", group: "B", description: "Paling terang & putih", position: 1 },
  { code: "A1",   hex: "#eadfc6", group: "A", description: "Putih krem terang", position: 2 },
  { code: "B2",   hex: "#e6d8b5", group: "B", description: "Putih kekuningan terang", position: 3 },
  { code: "D2",   hex: "#decda8", group: "D", description: "Kuning pucat terang", position: 4 },
  { code: "A2",   hex: "#dbc79a", group: "A", description: "Krem alami terang", position: 5 },
  { code: "C1",   hex: "#d5c19a", group: "C", description: "Abu-abu kekuningan terang", position: 6 },
  { code: "C2",   hex: "#c6b084", group: "C", description: "Abu-abu kekuningan", position: 7 },
  { code: "D4",   hex: "#c2a87a", group: "D", description: "Kuning pucat", position: 8 },
  { code: "A3",   hex: "#bfa070", group: "A", description: "Krem alami sedang", position: 9 },
  { code: "D3",   hex: "#b89868", group: "D", description: "Kuning pucat sedang", position: 10 },
  { code: "B3",   hex: "#b59563", group: "B", description: "Putih kekuningan sedang", position: 11 },
  { code: "A3.5", hex: "#ae8c57", group: "A", description: "Krem alami gelap", position: 12 },
  { code: "B4",   hex: "#a2804a", group: "B", description: "Putih kekuningan gelap", position: 13 },
  { code: "C3",   hex: "#997743", group: "C", description: "Abu-abu kekuningan gelap", position: 14 },
  { code: "A4",   hex: "#856634", group: "A", description: "Krem alami sangat gelap", position: 15 },
  { code: "C4",   hex: "#6f5325", group: "C", description: "Paling gelap", position: 16 },
];

const GROUP_INFO: Record<string, { label: string; color: string; desc: string }> = {
  A: { label: "Grup A", color: "#bfa070", desc: "Krem kecoklatan (reddish-brownish)" },
  B: { label: "Grup B", color: "#e6d8b5", desc: "Putih kekuningan (reddish-yellowish)" },
  C: { label: "Grup C", color: "#997743", desc: "Abu-abu kekuningan (greyish)" },
  D: { label: "Grup D", color: "#c2a87a", desc: "Kuning pucat (reddish-greyish)" },
};

const STORAGE_KEY = "tintify.vita.calibration.v1";

function loadOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

function ShadesPage() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [calibrating, setCalibrating] = useState(false);

  useEffect(() => {
    const saved = loadOverrides();
    setOverrides(saved);
    setDraft(saved);
  }, []);

  const shades = useMemo(
    () => DEFAULT_SHADES.map((s) => ({ ...s, hex: (calibrating ? draft : overrides)[s.code] ?? s.hex })),
    [overrides, draft, calibrating]
  );

  function updateDraft(code: string, hex: string) {
    setDraft((d) => ({ ...d, [code]: hex }));
  }

  function saveCalibration() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setOverrides(draft);
    setCalibrating(false);
    toast.success("Kalibrasi warna disimpan");
  }

  function resetCalibration() {
    localStorage.removeItem(STORAGE_KEY);
    setOverrides({});
    setDraft({});
    toast.success("Warna direset ke default");
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-16">
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Panduan Warna <span className="italic text-primary">VITA Shade</span>
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                Skala VITA Classical A1–D4 (16 shade) tersusun dari terang ke gelap. Kalibrasi warna agar
                sesuai dengan referensi fisik dan kondisi layar Anda.
              </p>
            </div>
            <div className="flex gap-2">
              {!calibrating ? (
                <button
                  onClick={() => { setDraft({ ...overrides }); setCalibrating(true); }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Kalibrasi
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setDraft({ ...overrides }); setCalibrating(false); }}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
                  >
                    Batal
                  </button>
                  <button
                    onClick={saveCalibration}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Save className="h-4 w-4" /> Simpan
                  </button>
                </>
              )}
              {Object.keys(overrides).length > 0 && !calibrating && (
                <button
                  onClick={resetCalibration}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
                >
                  <RotateCcw className="h-4 w-4" /> Reset
                </button>
              )}
            </div>
          </div>
          {Object.keys(overrides).length > 0 && !calibrating && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Check className="h-3 w-3" /> {Object.keys(overrides).length} shade dikalibrasi
            </p>
          )}
        </header>

        {calibrating && (
          <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
            <p className="font-medium">Mode kalibrasi aktif</p>
            <p className="mt-1 text-muted-foreground">
              Klik kotak warna pada tiap shade untuk memilih warna dari color picker. Setelah cocok dengan referensi VITA fisik Anda, klik <strong>Simpan</strong>.
            </p>
          </div>
        )}

        <section
          className="mb-10 overflow-hidden rounded-3xl border border-border bg-card p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="mb-4 text-sm font-semibold text-foreground">Spektrum Warna (Terang → Gelap)</p>
          <div className="flex h-14 overflow-hidden rounded-2xl border border-border md:h-16">
            {shades.map((s) => (
              <div key={s.code} className="group relative flex flex-1 items-end justify-center pb-1 transition hover:flex-[1.5]" style={{ backgroundColor: s.hex }}>
                <span className="text-[10px] font-bold text-foreground/70 opacity-60 transition group-hover:opacity-100 md:text-xs">{s.code}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Object.entries(GROUP_INFO).map(([key, info]) => (
            <div key={key} className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-foreground/10" style={{ backgroundColor: info.color }} />
                <span className="text-sm font-semibold text-foreground">{info.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{info.desc}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {shades.map((shade) => (
            <ShadeCard
              key={shade.code}
              shade={shade}
              calibrating={calibrating}
              onChange={(hex) => updateDraft(shade.code, hex)}
            />
          ))}
        </section>

        <footer className="mt-14 flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted-foreground backdrop-blur">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Warna di atas adalah representasi digital. Gunakan mode <strong>Kalibrasi</strong> untuk
            menyesuaikan dengan VITA classical fisik Anda di bawah pencahayaan natural. Kalibrasi tersimpan
            di perangkat Anda.
          </p>
        </footer>
      </div>
    </main>
  );
}

function ShadeCard({ shade, calibrating, onChange }: { shade: VitaShade; calibrating: boolean; onChange: (hex: string) => void }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
      <label className="relative block h-28 w-full border-b border-border md:h-32" style={{ backgroundColor: shade.hex, cursor: calibrating ? "pointer" : "default" }}>
        {calibrating && (
          <input
            type="color"
            value={shade.hex}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        )}
        <div className="absolute bottom-2 right-2 rounded-md bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background opacity-0 transition group-hover:opacity-100">
          {shade.hex.toUpperCase()}
        </div>
        {calibrating && (
          <div className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground">
            Klik untuk ubah
          </div>
        )}
      </label>
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold text-foreground">{shade.code}</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: GROUP_INFO[shade.group].color }}>
            {shade.group}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{shade.description}</p>
        {calibrating && (
          <input
            type="text"
            value={shade.hex}
            onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1 text-xs font-mono"
            placeholder="#rrggbb"
          />
        )}
        <div className="mt-auto pt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(shade.position / 16) * 100}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Posisi {shade.position} / 16</p>
        </div>
      </div>
    </div>
  );
}
