import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json, preflight } from "@/lib/mobile-api.server";
import { aiChatCompletions } from "@/lib/ai-provider.server";

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array", minItems: 4, maxItems: 6,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          reason: { type: "string" },
          priority: { type: "string", enum: ["critical", "high", "moderate", "low"] },
          current: { type: "string" },
          target: { type: "string" },
          difficulty: { type: "number", minimum: 1, maximum: 4 },
          steps: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
        },
        required: ["title", "description", "category", "reason", "priority", "current", "target", "difficulty", "steps"],
      },
    },
  },
  required: ["items"],
};

export const Route = createFileRoute("/api/mobile/recommendations/generate")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;

        const [{ data: scans }, { data: habits }] = await Promise.all([
          auth.supabase.from("tooth_scans").select("*").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(5),
          auth.supabase.from("habit_logs").select("*").eq("user_id", auth.userId).order("log_date", { ascending: false }).limit(7),
        ]);

        const habitLines = (habits ?? []).map((h: any) =>
          `- ${h.log_date}: sikat_pagi=${h.brushing_morning ? "YA" : "TIDAK"}, sikat_malam=${h.brushing_night ? "YA" : "TIDAK"}, flossing=${h.flossing ? "YA" : "TIDAK"}, mouthwash=${h.mouthwash ? "YA" : "TIDAK"}, kopi=${h.coffee_cups ?? 0}, teh=${h.tea_cups ?? 0}, rokok=${h.cigarettes ?? 0}`
        ).join("\n") || "(belum ada data habit)";
        const summary = `Scan terakhir: ${(scans ?? []).map((s: any) => s.primary_shade).join(", ") || "—"}.\n\nHabit 7 hari:\n${habitLines}`;

        const res = await aiChatCompletions({
          messages: [
            { role: "system", content: "Anda asisten perawatan gigi. Beri rekomendasi personal spesifik & actionable. Jangan sarankan kebiasaan yang sudah konsisten dilakukan. Bahasa Indonesia." },
            { role: "user", content: `Beri 4-6 rekomendasi berdasarkan data berikut.\n\n${summary}\n\nSetiap rekomendasi: title, description, category (oral_care|lifestyle|professional|diet|whitening), priority (critical|high|moderate|low), reason (kutip data), current, target, difficulty 1-4, 3 steps konkret.` },
          ],
          tools: [{ type: "function", function: { name: "report_recommendations", description: "Laporkan rekomendasi", parameters: SCHEMA } }],
          tool_choice: { type: "function", function: { name: "report_recommendations" } },
        });

        if (!res.ok) {
          if (res.status === 429) return json({ error: "Rate limited" }, 429);
          if (res.status === 402) return json({ error: "AI credits exhausted" }, 402);
          return json({ error: "AI service error" }, 502);
        }
        const j = await res.json();
        const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (!args) return json({ error: "Invalid AI response" }, 502);
        const parsed = JSON.parse(args) as { items: unknown[] };

        await auth.supabase.from("recommendations").upsert(
          { user_id: auth.userId, items: parsed.items as any, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );

        return json({ recommendations: parsed.items });
      },
    },
  },
});
