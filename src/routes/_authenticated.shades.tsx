import { createFileRoute } from "@tanstack/react-router";
import { Palette, Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export const Route = createFileRoute("/_authenticated/shades")({
  component: ShadesPage,
  head: () => ({ meta: [{ title: "VITA Shades — Tintify" }] }),
});

const SHADES = [
  { code: "B1", hex: "#ede6d3", group: "B", desc: "Paling terang & putih" },
  { code: "A1", hex: "#eadfc6", group: "A", desc: "Putih krem terang" },
  { code: "B2", hex: "#e6d8b5", group: "B", desc: "Putih kekuningan terang" },
  { code: "D2", hex: "#decda8", group: "D", desc: "Kuning pucat terang" },
  { code: "A2", hex: "#dbc79a", group: "A", desc: "Krem alami terang" },
  { code: "C1", hex: "#d5c19a", group: "C", desc: "Abu-abu kekuningan terang" },
  { code: "C2", hex: "#c6b084", group: "C", desc: "Abu-abu kekuningan" },
  { code: "D4", hex: "#c2a87a", group: "D", desc: "Kuning pucat" },
  { code: "A3", hex: "#bfa070", group: "A", desc: "Krem alami sedang" },
  { code: "D3", hex: "#b89868", group: "D", desc: "Kuning pucat sedang" },
  { code: "B3", hex: "#b59563", group: "B", desc: "Putih kekuningan sedang" },
  { code: "A3.5", hex: "#ae8c57", group: "A", desc: "Krem alami gelap" },
  { code: "B4", hex: "#a2804a", group: "B", desc: "Putih kekuningan gelap" },
  { code: "C3", hex: "#997743", group: "C", desc: "Abu-abu kekuningan gelap" },
  { code: "A4", hex: "#856634", group: "A", desc: "Krem alami sangat gelap" },
  { code: "C4", hex: "#6f5325", group: "C", desc: "Paling gelap" },
];

function ShadesPage() {
  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">VITA Shades</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Referensi 16 VITA Classical Shades — hover untuk detail.</p>
      </header>

      <section className="mb-8 overflow-hidden rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="mb-4 text-sm font-semibold text-foreground">Spektrum Warna (Terang → Gelap)</p>
        <div className="flex h-14 overflow-hidden rounded-2xl border border-border md:h-16">
          {SHADES.map((s) => (
            <HoverCard key={s.code} openDelay={80}>
              <HoverCardTrigger asChild>
                <button className="group relative flex flex-1 items-end justify-center pb-1 transition hover:flex-[1.5]" style={{ backgroundColor: s.hex }}>
                  <span className="text-[10px] font-bold text-foreground/70 opacity-60 transition group-hover:opacity-100 md:text-xs">{s.code}</span>
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-56 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-10 w-10 rounded-md border border-border" style={{ background: s.hex }} />
                  <div>
                    <p className="text-sm font-semibold">Shade {s.code}</p>
                    <p className="text-[10px] text-muted-foreground">Grup {s.group}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{s.desc}</p>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <p>VITA Classical adalah standar internasional untuk klasifikasi warna gigi. Tintify menggunakan 16 shade ini sebagai referensi analisis.</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {SHADES.map((s) => (
          <div key={s.code} className="overflow-hidden rounded-2xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="h-24 w-full border-b border-border" style={{ backgroundColor: s.hex }} />
            <div className="p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-foreground">{s.code}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{s.group}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{s.hex}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
