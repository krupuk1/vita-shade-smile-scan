import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json, preflight } from "@/lib/mobile-api.server";

const VITA_SHADES = [
  "B1","A1","B2","D2","A2","C1","C2","D4",
  "A3","D3","B3","A3.5","B4","C3","A4","C4",
];

export const Route = createFileRoute("/api/mobile/analyze")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return json({ error: "AI service not configured" }, 500);

        const body = await request.json().catch(() => ({}));
        const imageBase64: string = body.image_base64 ?? body.imageBase64 ?? "";
        if (!imageBase64 || typeof imageBase64 !== "string")
          return json({ error: "image_base64 required" }, 400);
        if (imageBase64.length > 10_000_000)
          return json({ error: "Image too large (max ~7MB)" }, 400);

        const dataUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `Anda asisten estetika gigi. Analisis warna gigi pakai 16 VITA shade: ${VITA_SHADES.join(", ")}. Bahasa Indonesia. Jawab via function call.` },
              { role: "user", content: [
                { type: "text", text: "Analisis foto gigi & laporkan VITA shade, brightness, confidence, observasi, rekomendasi, hygiene score, summary." },
                { type: "image_url", image_url: { url: dataUrl } },
              ]},
            ],
            tools: [{
              type: "function",
              function: {
                name: "report_tooth_analysis",
                parameters: {
                  type: "object",
                  properties: {
                    primaryShade: { type: "string", enum: VITA_SHADES },
                    secondaryShade: { type: "string" },
                    brightness: { type: "string", enum: ["very-light", "light", "medium", "dark"] },
                    confidence: { type: "number" },
                    observations: { type: "array", items: { type: "string" } },
                    recommendations: { type: "array", items: { type: "string" } },
                    hygieneScore: { type: "number" },
                    summary: { type: "string" },
                  },
                  required: ["primaryShade","secondaryShade","brightness","confidence","observations","recommendations","hygieneScore","summary"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "report_tooth_analysis" } },
          }),
        });

        if (!res.ok) {
          if (res.status === 429) return json({ error: "Rate limited" }, 429);
          if (res.status === 402) return json({ error: "AI credits exhausted" }, 402);
          return json({ error: "AI service error" }, 502);
        }
        const j = await res.json();
        const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (!args) return json({ error: "Invalid AI response" }, 502);
        return json({ analysis: JSON.parse(args) });
      },
    },
  },
});
