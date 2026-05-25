import { createFileRoute } from "@tanstack/react-router";
import { Code2, Download, Lock, Unlock } from "lucide-react";

export const Route = createFileRoute("/admin/api-docs")({
  component: ApiDocs,
  head: () => ({ meta: [{ title: "API Documentation — Admin" }] }),
});

type Endpoint = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  auth: boolean;
  desc: string;
  body?: string;
  response?: string;
};

const groups: { title: string; endpoints: Endpoint[] }[] = [
  {
    title: "Authentication",
    endpoints: [
      {
        method: "POST", path: "/api/mobile/auth/signup", auth: false,
        desc: "Daftar pengguna baru. display_name, gender, age opsional.",
        body: `{ "email": "user@mail.com", "password": "min8chars", "display_name": "Andi", "gender": "male", "age": 28 }`,
        response: `{ "user": { "id": "...", "email": "..." }, "session": { "access_token": "...", "refresh_token": "..." } | null }`,
      },
      {
        method: "POST", path: "/api/mobile/auth/login", auth: false,
        desc: "Login dengan email & password. Mengembalikan access_token JWT.",
        body: `{ "email": "user@mail.com", "password": "..." }`,
        response: `{ "access_token": "<jwt>", "refresh_token": "...", "expires_at": 1700000000, "user": {...} }`,
      },
    ],
  },
  {
    title: "Profile",
    endpoints: [
      { method: "GET", path: "/api/mobile/profile", auth: true, desc: "Profil pengguna saat ini.", response: `{ "profile": { "display_name": "...", "gender": "...", "age": 28, "avatar_url": null } }` },
      { method: "PUT", path: "/api/mobile/profile", auth: true, desc: "Update display_name, gender, age, avatar_url.", body: `{ "display_name": "Andi B.", "age": 29 }` },
    ],
  },
  {
    title: "Tooth Scans",
    endpoints: [
      { method: "GET", path: "/api/mobile/scans?limit=50", auth: true, desc: "Riwayat scan gigi pengguna." },
      { method: "POST", path: "/api/mobile/scans", auth: true, desc: "Simpan hasil scan.", body: `{ "method": "upload", "primary_shade": "A2", "secondary_shade": "A3", "brightness": "medium", "confidence": 87, "hygiene_score": 82, "observations": ["..."], "recommendations": ["..."], "summary": "..." }` },
      { method: "DELETE", path: "/api/mobile/scans?id={uuid}", auth: true, desc: "Hapus scan milik pengguna." },
      { method: "POST", path: "/api/mobile/analyze", auth: true, desc: "Analisis foto gigi via AI (Gemini). Kirim base64 image.", body: `{ "image_base64": "data:image/jpeg;base64,...." }`, response: `{ "analysis": { "primaryShade": "A2", "brightness": "medium", "confidence": 88, "observations": [...], "recommendations": [...], "hygieneScore": 80, "summary": "..." } }` },
    ],
  },
  {
    title: "Habit Tracker",
    endpoints: [
      { method: "GET", path: "/api/mobile/habits?from=2026-05-01&to=2026-05-31", auth: true, desc: "Log kebiasaan harian pengguna." },
      { method: "POST", path: "/api/mobile/habits", auth: true, desc: "Upsert log untuk satu hari (default hari ini).", body: `{ "log_date": "2026-05-25", "cigarettes": 0, "tea_cups": 1, "coffee_cups": 2, "brushing_morning": true, "brushing_night": true, "flossing": true, "mouthwash": false }` },
    ],
  },
  {
    title: "AI Recommendations",
    endpoints: [
      { method: "GET", path: "/api/mobile/recommendations", auth: true, desc: "Daftar rekomendasi AI pengguna." },
      { method: "POST", path: "/api/mobile/recommendations", auth: true, desc: "Simpan rekomendasi baru.", body: `{ "items": [{ "title": "...", "body": "..." }] }` },
    ],
  },
  {
    title: "Content (Public)",
    endpoints: [
      { method: "GET", path: "/api/mobile/articles?category=hygiene", auth: false, desc: "Daftar artikel terpublikasi. Filter via ?slug atau ?category." },
    ],
  },
];

function ApiDocs() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-app.lovable.app";

  function downloadMarkdown() {
    const md = buildMarkdown(baseUrl);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tintify-mobile-api.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <Code2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">Mobile API Documentation</h1>
          <p className="mt-1 text-sm text-muted-foreground">REST endpoints untuk aplikasi mobile Tintify.</p>
        </div>
        <button
          onClick={downloadMarkdown}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Download className="h-4 w-4" /> Download .md
        </button>
      </header>

      <section className="mb-8 rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-lg font-semibold">Base URL</h2>
        <code className="mt-2 block rounded-lg bg-muted px-3 py-2 text-sm">{baseUrl}</code>
        <h3 className="mt-5 text-sm font-semibold">Authentication</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Endpoint yang ditandai <Lock className="inline h-3 w-3" /> memerlukan header berikut:
        </p>
        <code className="mt-2 block rounded-lg bg-muted px-3 py-2 text-xs">
          Authorization: Bearer &lt;access_token dari /api/mobile/auth/login&gt;
        </code>
        <p className="mt-3 text-xs text-muted-foreground">
          Token kedaluwarsa setelah ~1 jam. Gunakan <code>refresh_token</code> via Supabase client SDK
          atau panggil ulang <code>/auth/login</code>.
        </p>
      </section>

      {groups.map((g) => (
        <section key={g.title} className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">{g.title}</h2>
          <div className="space-y-3">
            {g.endpoints.map((e) => (
              <div key={`${e.method}-${e.path}`} className="rounded-xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold text-white ${methodColor(e.method)}`}>{e.method}</span>
                  <code className="text-sm font-mono">{e.path}</code>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {e.auth ? (<><Lock className="h-3 w-3" /> auth</>) : (<><Unlock className="h-3 w-3" /> public</>)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{e.desc}</p>
                {e.body && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request body</p>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs"><code>{e.body}</code></pre>
                  </div>
                )}
                {e.response && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</p>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs"><code>{e.response}</code></pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mb-12 rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-lg font-semibold">Contoh cURL</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs"><code>{`# 1) Login
curl -X POST ${baseUrl}/api/mobile/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@mail.com","password":"secret123"}'

# 2) Ambil profil
curl ${baseUrl}/api/mobile/profile \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`}</code></pre>
      </section>
    </div>
  );
}

function methodColor(m: string) {
  switch (m) {
    case "GET": return "bg-emerald-600";
    case "POST": return "bg-blue-600";
    case "PUT": return "bg-amber-600";
    case "DELETE": return "bg-rose-600";
    default: return "bg-slate-600";
  }
}

function buildMarkdown(baseUrl: string): string {
  const lines: string[] = [];
  lines.push(`# Tintify Mobile API`, ``);
  lines.push(`**Base URL:** \`${baseUrl}\``, ``);
  lines.push(`## Authentication`, ``);
  lines.push(`Endpoint dengan tanda \`auth\` memerlukan header:`, ``);
  lines.push(`\`\`\``, `Authorization: Bearer <access_token>`, `\`\`\``, ``);
  lines.push(`Dapatkan token via \`POST /api/mobile/auth/login\`. Token kedaluwarsa ~1 jam.`, ``);

  for (const g of groups) {
    lines.push(`## ${g.title}`, ``);
    for (const e of g.endpoints) {
      lines.push(`### ${e.method} ${e.path}`);
      lines.push(`**Auth:** ${e.auth ? "required" : "public"}  `);
      lines.push(e.desc, ``);
      if (e.body) {
        lines.push(`**Request body:**`, "```json", e.body, "```", ``);
      }
      if (e.response) {
        lines.push(`**Response:**`, "```json", e.response, "```", ``);
      }
    }
  }

  lines.push(`## Contoh cURL`, ``);
  lines.push("```bash");
  lines.push(`# 1) Login`);
  lines.push(`curl -X POST ${baseUrl}/api/mobile/auth/login \\`);
  lines.push(`  -H "Content-Type: application/json" \\`);
  lines.push(`  -d '{"email":"user@mail.com","password":"secret123"}'`);
  lines.push(``);
  lines.push(`# 2) Ambil profil`);
  lines.push(`curl ${baseUrl}/api/mobile/profile \\`);
  lines.push(`  -H "Authorization: Bearer <ACCESS_TOKEN>"`);
  lines.push("```");
  return lines.join("\n");
}
