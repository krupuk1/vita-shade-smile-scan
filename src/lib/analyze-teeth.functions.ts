import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiChatCompletions } from "@/lib/ai-provider.server";

const VITA_SHADES = [
  "B1", "A1", "B2", "D2", "A2", "C1", "C2", "D4",
  "A3", "D3", "B3", "A3.5", "B4", "C3", "A4", "C4",
];

export interface ToothAnalysis {
  primaryShade: string;
  secondaryShade: string | null;
  brightness: "very-light" | "light" | "medium" | "dark";
  confidence: number;
  observations: string[];
  recommendations: string[];
  hygieneScore: number;
  summary: string;
}

export const analyzeTeeth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { imageBase64: string }) => {
    if (!data?.imageBase64 || typeof data.imageBase64 !== "string") throw new Error("imageBase64 required");
    if (data.imageBase64.length > 10_000_000) throw new Error("Image too large (max ~7MB)");
    return data;
  })
  .handler(async ({ data }) => {
    const dataUrl = data.imageBase64.startsWith("data:") ? data.imageBase64 : `data:image/jpeg;base64,${data.imageBase64}`;

    const response = await aiChatCompletions({
      messages: [
        { role: "system", content: `Anda asisten estetika gigi. Analisis warna gigi pakai 16 VITA shade: ${VITA_SHADES.join(", ")}. Bahasa Indonesia. Jawab via function call.` },
        {
          role: "user",
          content: [
            { type: "text", text: "Analisis foto gigi ini & laporkan VITA shade, brightness, confidence, observasi, rekomendasi, hygiene score, summary." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "report_tooth_analysis",
          description: "Laporkan hasil analisis gigi.",
          parameters: {
            type: "object",
            properties: {
              primaryShade: { type: "string", enum: VITA_SHADES },
              secondaryShade: { type: "string" },
              brightness: { type: "string", enum: ["very-light", "light", "medium", "dark"] },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              observations: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
              recommendations: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
              hygieneScore: { type: "number", minimum: 0, maximum: 100 },
              summary: { type: "string" },
            },
            required: ["primaryShade", "secondaryShade", "brightness", "confidence", "observations", "recommendations", "hygieneScore", "summary"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "report_tooth_analysis" } },
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Rate limit. Coba lagi sebentar.");
      if (response.status === 402) throw new Error("Kredit AI habis.");
      throw new Error("Gagal menganalisis gambar.");
    }
    const json = await response.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Respons AI tidak valid.");
    return JSON.parse(args) as ToothAnalysis;
  });

export const saveScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { result: ToothAnalysis; method: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("tooth_scans").insert({
      user_id: userId,
      method: data.method,
      primary_shade: data.result.primaryShade,
      secondary_shade: data.result.secondaryShade || null,
      brightness: data.result.brightness,
      confidence: data.result.confidence,
      hygiene_score: data.result.hygieneScore,
      observations: data.result.observations,
      recommendations: data.result.recommendations,
      summary: data.result.summary,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
