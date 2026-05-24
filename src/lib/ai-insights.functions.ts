import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface RiskItem { name: string; level: "low" | "medium" | "high"; score: number; reason: string; }
export interface RiskAnalysis { risks: RiskItem[]; summary: string; }
export interface Recommendation { title: string; description: string; category: string; reason: string; }

async function callAI(systemPrompt: string, userPrompt: string, toolName: string, schema: any) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY belum terkonfigurasi");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{ type: "function", function: { name: toolName, description: "Laporkan hasil", parameters: schema } }],
      tool_choice: { type: "function", function: { name: toolName } },
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit. Coba lagi sebentar.");
    if (res.status === 402) throw new Error("Kredit AI habis.");
    throw new Error("AI gateway error");
  }
  const json = await res.json();
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("Respons AI tidak valid");
  return JSON.parse(args);
}

export const generateRiskAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: scans }, { data: habits }] = await Promise.all([
      supabase.from("tooth_scans").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(14),
    ]);

    const summary = `Scan terakhir: ${(scans ?? []).map((s: any) => `${s.primary_shade}(${s.hygiene_score ?? "?"})`).join(", ") || "belum ada"}.
Habit 14 hari: ${(habits ?? []).map((h: any) => `${h.log_date}: brush=${(h.brushing_morning ? 1 : 0) + (h.brushing_night ? 1 : 0)}/2, floss=${h.flossing}, kopi=${h.coffee_cups}, rokok=${h.cigarettes}`).join("; ") || "belum ada"}.`;

    return (await callAI(
      "Anda adalah asisten kesehatan gigi. Analisis risiko berbasis data scan & habit user. Jawab dalam Bahasa Indonesia.",
      `Berdasarkan data berikut, identifikasi 3-5 risiko utama (karies, plak/tartar, stain, gum disease, enamel erosion) dengan skor 0-100 dan level (low/medium/high). Sertakan summary 2-3 kalimat.\n\nData:\n${summary}`,
      "report_risk",
      {
        type: "object",
        properties: {
          risks: {
            type: "array", minItems: 3, maxItems: 5,
            items: { type: "object", properties: {
              name: { type: "string" }, level: { type: "string", enum: ["low", "medium", "high"] },
              score: { type: "number", minimum: 0, maximum: 100 }, reason: { type: "string" }
            }, required: ["name", "level", "score", "reason"] }
          },
          summary: { type: "string" }
        },
        required: ["risks", "summary"]
      }
    )) as RiskAnalysis;
  });

export const generateRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: scans }, { data: habits }] = await Promise.all([
      supabase.from("tooth_scans").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(7),
    ]);
    const summary = `Scan: ${(scans ?? []).map((s: any) => s.primary_shade).join(", ") || "—"}. Habit 7 hari: ${JSON.stringify(habits ?? []).slice(0, 800)}`;

    return (await callAI(
      "Anda asisten perawatan gigi. Beri rekomendasi personal yang spesifik & actionable. Bahasa Indonesia.",
      `Beri 4-6 rekomendasi personal berdasarkan data:\n${summary}\n\nKategori: oral_care, lifestyle, professional, diet, whitening.`,
      "report_recommendations",
      {
        type: "object",
        properties: {
          items: {
            type: "array", minItems: 4, maxItems: 6,
            items: { type: "object", properties: {
              title: { type: "string" }, description: { type: "string" },
              category: { type: "string" }, reason: { type: "string" }
            }, required: ["title", "description", "category", "reason"] }
          }
        }, required: ["items"]
      }
    )) as { items: Recommendation[] };
  });

export const generateHabitInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: habits } = await supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(7);
    const summary = JSON.stringify(habits ?? []).slice(0, 1000);

    return (await callAI(
      "Anda asisten kesehatan gigi. Analisis pola habit & beri insight singkat actionable. Bahasa Indonesia.",
      `Data habit 7 hari:\n${summary}\n\nBeri insight 3-5 kalimat: pola yang baik, area yang perlu perbaikan, saran konkret.`,
      "report_insight",
      {
        type: "object",
        properties: { insight: { type: "string" } },
        required: ["insight"]
      }
    )) as { insight: string };
  });
