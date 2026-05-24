import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";

export const Route = createFileRoute("/shades")({
  component: ShadesPage,
  head: () => ({
    meta: [
      { title: "Panduan Warna VITA Shade — DentaShade" },
      {
        name: "description",
        content:
          "Panduan lengkap 16 warna VITA Classical Shade dari terang hingga gelap. Perbandingan visual untuk analisis estetika gigi.",
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

const VITA_SHADES: VitaShade[] = [
  { code: "B1", hex: "#f4ecd6", group: "B", description: "Paling terang & putih", position: 1 },
  { code: "A1", hex: "#efe3c4", group: "A", description: "Putih krem terang", position: 2 },
  { code: "B2", hex: "#ecdcb4", group: "B", description: "Putih kekuningan terang", position: 3 },
  { code: "D2", hex: "#e6d4ab", group: "D", description: "Kuning pucat terang", position: 4 },
  { code: "A2", hex: "#e3cf9f", group: "A", description: "Krem alami terang", position: 5 },
  { code: "C1", hex: "#dec8a0", group: "C", description: "Abu-abu kekuningan terang", position: 6 },
  { code: "C2", hex: "#d2b98c", group: "C", description: "Abu-abu kekuningan", position: 7 },
  { code: "D4", hex: "#cdb284", group: "D", description: "Kuning pucat", position: 8 },
  { code: "A3", hex: "#c9ac7b", group: "A", description: "Krem alami sedang", position: 9 },
  { code: "D3", hex: "#c1a574", group: "D", description: "Kuning pucat sedang", position: 10 },
  { code: "B3", hex: "#bb9e6b", group: "B", description: "Putih kekuningan sedang", position: 11 },
  { code: "A3.5", hex: "#b69664", group: "A", description: "Krem alami gelap", position: 12 },
  { code: "B4", hex: "#ad8b58", group: "B", description: "Putih kekuningan gelap", position: 13 },
  { code: "C3", hex: "#a4824f", group: "C", description: "Abu-abu kekuningan gelap", position: 14 },
  { code: "A4", hex: "#8f6e3f", group: "A", description: "Krem alami sangat gelap", position: 15 },
  { code: "C4", hex: "#7a5a30", group: "C", description: "Paling gelap", position: 16 },
];

const GROUP_INFO: Record<string, { label: string; color: string; desc: string }> = {
  A: { label: "Grup A", color: "#c9ac7b", desc: "Warna krem kecoklatan ( reddish-brownish )" },
  B: { label: "Grup B", color: "#ecdcb4", desc: "Warna putih kekuningan ( reddish-yellowish )" },
  C: { label: "Grup C", color: "#a4824f", desc: "Warna abu-abu kekuningan ( greyish shades )" },
  D: { label: "Grup D", color: "#cdb284", desc: "Warna kuning pucat ( reddish-greyish )" },
};

function ShadesPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-16">
        {/* Header */}
        <header className="mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Analisis
          </Link>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Panduan Warna <span className="italic text-primary">VITA Shade</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Skala VITA Classical Shade Guide terdiri dari 16 warna yang disusun berdasarkan tingkat
            kecerahan. B1 paling terang/putih, C4 paling gelap.
          </p>
        </header>

        {/* Gradient bar */}
        <section
          className="mb-10 overflow-hidden rounded-3xl border border-border bg-card p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="mb-4 text-sm font-semibold text-foreground">Spektrum Warna (Terang → Gelap)</p>
          <div className="flex h-14 overflow-hidden rounded-2xl border border-border md:h-16">
            {VITA_SHADES.map((s) => (
              <div
                key={s.code}
                className="group relative flex flex-1 items-end justify-center pb-1 transition hover:flex-[1.5]"
                style={{ backgroundColor: s.hex }}
              >
                <span className="text-[10px] font-bold text-foreground/70 opacity-60 transition group-hover:opacity-100 md:text-xs">
                  {s.code}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>Terang (B1)</span>
            <span>Gelap (C4)</span>
          </div>
        </section>

        {/* Group explainer */}
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Object.entries(GROUP_INFO).map(([key, info]) => (
            <div
              key={key}
              className="rounded-2xl border border-border bg-card p-4"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-foreground/10"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-sm font-semibold text-foreground">{info.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{info.desc}</p>
            </div>
          ))}
        </section>

        {/* Shade cards */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {VITA_SHADES.map((shade) => (
            <ShadeCard key={shade.code} shade={shade} />
          ))}
        </section>

        {/* Disclaimer */}
        <footer className="mt-14 flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted-foreground backdrop-blur">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Warna di atas adalah representasi digital perkiraan. Warna aktual pada panduan VITA fisik
            dapat sedikit berbeda tergantung pencahayaan dan kalibrasi layar Anda. Untuk pencocokan akurat,
            konsultasikan dengan dokter gigi.
          </p>
        </footer>
      </div>
    </main>
  );
}

function ShadeCard({ shade }: { shade: VitaShade }) {
  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="relative h-28 w-full border-b border-border md:h-32"
        style={{ backgroundColor: shade.hex }}
      >
        <div className="absolute bottom-2 right-2 rounded-md bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background opacity-0 transition group-hover:opacity-100">
          {shade.hex.toUpperCase()}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold text-foreground">{shade.code}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: GROUP_INFO[shade.group].color }}
          >
            {shade.group}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{shade.description}</p>
        <div className="mt-auto pt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(shade.position / 16) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Posisi {shade.position} / 16
          </p>
        </div>
      </div>
    </div>
  );
}
