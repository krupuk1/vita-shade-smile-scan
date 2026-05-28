import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiChatCompletions } from "@/lib/ai-provider.server";
import { langFromCookieHeader, aiLanguageInstruction } from "@/i18n/lang.server";

function getLang() {
  try { return langFromCookieHeader(getRequestHeader("cookie") ?? null); } catch { return "id" as const; }
}

export interface RiskCriterion { label: string; score: number; weight: number; finding: string; }
export interface RiskItem {
  name: string;
  level: "low" | "medium" | "high";
  score: number;
  reason: string;
  factors: string[];
  criteria: RiskCriterion[];
  recommendation: string;
}
export interface RiskAnalysis {
  risks: RiskItem[];
  summary: string;
  methodology: string;
  overall_score: number;
}
export interface Recommendation {
  title: string;
  description: string;
  category: string;
  reason: string;
  priority: "critical" | "high" | "moderate" | "low";
  current: string;
  target: string;
  difficulty: number;
  steps: string[];
}

async function callAI(systemPrompt: string, userPrompt: string, toolName: string, schema: any) {
  const res = await aiChatCompletions({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [{ type: "function", function: { name: toolName, description: "Laporkan hasil", parameters: schema } }],
    tool_choice: { type: "function", function: { name: toolName } },
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
    const { supabase, userId } = context;
    const [{ data: scans }, { data: habits }] = await Promise.all([
      supabase.from("tooth_scans").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(14),
    ]);

    const summary = `Scan terakhir: ${(scans ?? []).map((s: any) => `${s.primary_shade}(${s.hygiene_score ?? "?"})`).join(", ") || "belum ada"}.
Habit 14 hari: ${(habits ?? []).map((h: any) => `${h.log_date}: brush=${(h.brushing_morning ? 1 : 0) + (h.brushing_night ? 1 : 0)}/2, floss=${h.flossing}, kopi=${h.coffee_cups}, rokok=${h.cigarettes}`).join("; ") || "belum ada"}.`;

    const result = (await callAI(
      "Anda adalah asisten kesehatan gigi profesional. Analisis risiko berbasis data scan & habit user secara transparan. Jawab dalam Bahasa Indonesia.",
      `Berdasarkan data berikut, identifikasi 3-5 risiko utama (karies, plak/tartar, stain, gum disease, enamel erosion). Untuk SETIAP risiko, sertakan:
- score 0-100 dan level (low/medium/high)
- reason: penjelasan singkat (1 kalimat)
- factors: 3-4 bukti spesifik dari data yang mendukung penilaian
- criteria: 3-4 kriteria penilaian dengan label, score 0-100, weight 0-1 (jumlah weight = 1), dan finding spesifik
- recommendation: 1 saran konkret untuk mitigasi
Juga sertakan: summary 2-3 kalimat, methodology (penjelasan bagaimana AI menilai dari data scan + habit), overall_score 0-100.\n\nData:\n${summary}`,
      "report_risk",
      {
        type: "object",
        properties: {
          risks: {
            type: "array", minItems: 3, maxItems: 5,
            items: { type: "object", properties: {
              name: { type: "string" },
              level: { type: "string", enum: ["low", "medium", "high"] },
              score: { type: "number", minimum: 0, maximum: 100 },
              reason: { type: "string" },
              factors: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
              criteria: {
                type: "array", minItems: 2, maxItems: 4,
                items: { type: "object", properties: {
                  label: { type: "string" },
                  score: { type: "number", minimum: 0, maximum: 100 },
                  weight: { type: "number", minimum: 0, maximum: 1 },
                  finding: { type: "string" }
                }, required: ["label", "score", "weight", "finding"] }
              },
              recommendation: { type: "string" }
            }, required: ["name", "level", "score", "reason", "factors", "criteria", "recommendation"] }
          },
          summary: { type: "string" },
          methodology: { type: "string" },
          overall_score: { type: "number", minimum: 0, maximum: 100 }
        },
        required: ["risks", "summary", "methodology", "overall_score"]
      }
    )) as RiskAnalysis;

    await supabase.from("risk_analyses").insert({
      user_id: userId,
      analysis: result as any,
      overall_score: result.overall_score,
      summary: result.summary,
    });

    return result;
  });

export const getLatestRiskAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("risk_analyses")
      .select("id, analysis, created_at, overall_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      created_at: data.created_at,
      analysis: data.analysis as unknown as RiskAnalysis,
    };
  });

export const getRiskHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("risk_analyses")
      .select("id, created_at, overall_score, summary")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });



export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("recommendations")
      .select("items, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      items: ((data?.items as unknown) as Recommendation[]) ?? null,
      updated_at: data?.updated_at ?? null,
    };
  });

export const generateRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: scans }, { data: habits }] = await Promise.all([
      supabase.from("tooth_scans").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(7),
    ]);
    const habitLines = (habits ?? []).map((h: any) =>
      `- ${h.log_date}: sikat_pagi=${h.brushing_morning ? "YA" : "TIDAK"}, sikat_malam=${h.brushing_night ? "YA" : "TIDAK"}, flossing=${h.flossing ? "YA" : "TIDAK"}, mouthwash=${h.mouthwash ? "YA" : "TIDAK"}, kopi=${h.coffee_cups ?? 0} cangkir, teh=${h.tea_cups ?? 0} cangkir, rokok=${h.cigarettes ?? 0} batang`
    ).join("\n") || "(belum ada data habit)";
    const summary = `Scan terakhir: ${(scans ?? []).map((s: any) => s.primary_shade).join(", ") || "—"}.\n\nHabit 7 hari terakhir:\n${habitLines}`;

    const result = (await callAI(
      "Anda asisten perawatan gigi. Beri rekomendasi personal yang spesifik & actionable, dengan prioritas, langkah aksi, dan target terukur. PENTING: Baca data habit dengan seksama. Jangan menyarankan kebiasaan yang sudah konsisten dilakukan user (mis. jika sikat_malam=YA setiap hari, JANGAN menyarankan 'mulai sikat gigi malam'). Fokus pada area yang masih kurang. Bahasa Indonesia.",
      `Beri 4-6 rekomendasi personal berdasarkan data berikut. Cek kolom YA/TIDAK secara teliti sebelum memberi saran.\n\n${summary}\n\nUntuk SETIAP rekomendasi sertakan:\n- title singkat\n- description 1-2 kalimat\n- category: oral_care | lifestyle | professional | diet | whitening\n- priority: critical | high | moderate | low\n- reason: kenapa AI menyarankan ini (kutip data spesifik)\n- current: kondisi saat ini (singkat, mis. "5 cangkir/hari")\n- target: target yang diinginkan (singkat)\n- difficulty: 1-4\n- steps: 3 langkah aksi konkret`,
      "report_recommendations",
      {
        type: "object",
        properties: {
          items: {
            type: "array", minItems: 4, maxItems: 6,
            items: { type: "object", properties: {
              title: { type: "string" }, description: { type: "string" },
              category: { type: "string" }, reason: { type: "string" },
              priority: { type: "string", enum: ["critical", "high", "moderate", "low"] },
              current: { type: "string" }, target: { type: "string" },
              difficulty: { type: "number", minimum: 1, maximum: 4 },
              steps: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } }
            }, required: ["title", "description", "category", "reason", "priority", "current", "target", "difficulty", "steps"] }
          }
        }, required: ["items"]
      }
    )) as { items: Recommendation[] };

    await supabase.from("recommendations").upsert(
      { user_id: userId, items: result.items as any, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    return result;
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
