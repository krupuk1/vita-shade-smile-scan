import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json, preflight } from "@/lib/mobile-api.server";
import { aiChatCompletions } from "@/lib/ai-provider.server";

const SCHEMA = {
  type: "object",
  properties: {
    risks: {
      type: "array", minItems: 3, maxItems: 5,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          level: { type: "string", enum: ["low", "medium", "high"] },
          score: { type: "number", minimum: 0, maximum: 100 },
          reason: { type: "string" },
          factors: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
          criteria: {
            type: "array", minItems: 2, maxItems: 4,
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                score: { type: "number", minimum: 0, maximum: 100 },
                weight: { type: "number", minimum: 0, maximum: 1 },
                finding: { type: "string" },
              },
              required: ["label", "score", "weight", "finding"],
            },
          },
          recommendation: { type: "string" },
        },
        required: ["name", "level", "score", "reason", "factors", "criteria", "recommendation"],
      },
    },
    summary: { type: "string" },
    methodology: { type: "string" },
    overall_score: { type: "number", minimum: 0, maximum: 100 },
  },
  required: ["risks", "summary", "methodology", "overall_score"],
};

export const Route = createFileRoute("/api/mobile/risk-analysis")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const url = new URL(request.url);
        const history = url.searchParams.get("history") === "1";
        if (history) {
          const { data, error } = await auth.supabase
            .from("risk_analyses")
            .select("id, created_at, overall_score, summary")
            .eq("user_id", auth.userId)
            .order("created_at", { ascending: false })
            .limit(20);
          if (error) return json({ error: error.message }, 500);
          return json({ history: data ?? [] });
        }
        const { data, error } = await auth.supabase
          .from("risk_analyses")
          .select("id, analysis, created_at, overall_score")
          .eq("user_id", auth.userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return json({ error: error.message }, 500);
        return json({ latest: data ?? null });
      },
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;

        const [{ data: scans }, { data: habits }] = await Promise.all([
          auth.supabase.from("tooth_scans").select("*").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(10),
          auth.supabase.from("habit_logs").select("*").eq("user_id", auth.userId).order("log_date", { ascending: false }).limit(14),
        ]);

        const summary = `Scan terakhir: ${(scans ?? []).map((s: any) => `${s.primary_shade}(${s.hygiene_score ?? "?"})`).join(", ") || "belum ada"}.
Habit 14 hari: ${(habits ?? []).map((h: any) => `${h.log_date}: brush=${(h.brushing_morning ? 1 : 0) + (h.brushing_night ? 1 : 0)}/2, floss=${h.flossing}, kopi=${h.coffee_cups}, rokok=${h.cigarettes}`).join("; ") || "belum ada"}.`;

        const res = await aiChatCompletions({
          messages: [
            { role: "system", content: "Anda adalah asisten kesehatan gigi profesional. Analisis risiko berbasis data scan & habit user secara transparan. Jawab dalam Bahasa Indonesia." },
            { role: "user", content: `Berdasarkan data berikut, identifikasi 3-5 risiko utama (karies, plak/tartar, stain, gum disease, enamel erosion). Untuk SETIAP risiko sertakan: score 0-100, level (low/medium/high), reason 1 kalimat, factors 3-4 bukti dari data, criteria 3-4 (label/score/weight jumlah=1/finding), recommendation 1 saran. Juga: summary 2-3 kalimat, methodology, overall_score 0-100.\n\nData:\n${summary}` },
          ],
          tools: [{ type: "function", function: { name: "report_risk", description: "Laporkan hasil", parameters: SCHEMA } }],
          tool_choice: { type: "function", function: { name: "report_risk" } },
        });

        if (!res.ok) {
          if (res.status === 429) return json({ error: "Rate limited" }, 429);
          if (res.status === 402) return json({ error: "AI credits exhausted" }, 402);
          return json({ error: "AI service error" }, 502);
        }
        const j = await res.json();
        const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (!args) return json({ error: "Invalid AI response" }, 502);
        const analysis = JSON.parse(args);

        await auth.supabase.from("risk_analyses").insert({
          user_id: auth.userId,
          analysis,
          overall_score: analysis.overall_score,
          summary: analysis.summary,
        });

        return json({ analysis });
      },
    },
  },
});
