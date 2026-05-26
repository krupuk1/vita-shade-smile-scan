import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json, preflight } from "@/lib/mobile-api.server";
import { aiChatCompletions } from "@/lib/ai-provider.server";

export const Route = createFileRoute("/api/mobile/habit-insights")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;

        const { data: habits } = await auth.supabase
          .from("habit_logs").select("*")
          .eq("user_id", auth.userId)
          .order("log_date", { ascending: false }).limit(7);
        const summary = JSON.stringify(habits ?? []).slice(0, 1000);

        const res = await aiChatCompletions({
          messages: [
            { role: "system", content: "Anda asisten kesehatan gigi. Analisis pola habit & beri insight singkat actionable. Bahasa Indonesia." },
            { role: "user", content: `Data habit 7 hari:\n${summary}\n\nBeri insight 3-5 kalimat: pola baik, area perlu perbaikan, saran konkret.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_insight",
              parameters: {
                type: "object",
                properties: { insight: { type: "string" } },
                required: ["insight"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report_insight" } },
        });

        if (!res.ok) {
          if (res.status === 429) return json({ error: "Rate limited" }, 429);
          if (res.status === 402) return json({ error: "AI credits exhausted" }, 402);
          return json({ error: "AI service error" }, 502);
        }
        const j = await res.json();
        const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (!args) return json({ error: "Invalid AI response" }, 502);
        return json(JSON.parse(args));
      },
    },
  },
});
