import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(systemPrompt: string, userPrompt: string, schema: object, toolName: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY belum terkonfigurasi");

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: toolName,
            description: "Return structured analysis",
            parameters: schema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: toolName } },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Rate limit AI. Coba lagi sebentar.");
    if (res.status === 402) throw new Error("Kredit AI habis. Tambahkan di Workspace.");
    console.error("AI gateway error", res.status, text);
    throw new Error("AI gagal merespons.");
  }

  const json = await res.json();
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("Respons AI tidak valid.");
  return JSON.parse(toolCall.function.arguments);
}

export interface RiskAnalysis {
  overallRisk: "low" | "moderate" | "high";
  summary: string;
  highImpactFactors: { name: string; icon: string; current: string; explanation: string }[];
  moderateImpactFactors: { name: string; icon: string; current: string; explanation: string }[];
  protectiveFactors: { name: string; icon: string; current: string }[];
}

export const generateRiskAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { currentShade?: string; recentHabits?: Record<string, unknown> }) => d)
  .handler(async ({ data }) => {
    const system = `Anda adalah asisten kesehatan gigi yang menganalisis risiko diskolorasi gigi berdasarkan shade VITA saat ini dan kebiasaan pengguna. Berikan output dalam Bahasa Indonesia.`;
    const user = `Shade VITA saat ini: ${data.currentShade ?? "belum ada"}.
Kebiasaan terkini (rata-rata 7 hari): ${JSON.stringify(data.recentHabits ?? {})}.
Analisis risiko diskolorasi. Tentukan tingkat risiko (low/moderate/high), ringkasan 1-2 kalimat, faktor berdampak tinggi (kopi, rokok, dll dengan nilai user), faktor berdampak sedang (teh, anggur, dll), dan faktor pelindung (sikat gigi, flossing, air, dll). Untuk icon, gunakan emoji yang relevan (☕ kopi, 🚬 rokok, 🍵 teh, 🪥 sikat gigi, 🧵 flossing, 💧 air, dll).`;

    const schema = {
      type: "object",
      properties: {
        overallRisk: { type: "string", enum: ["low", "moderate", "high"] },
        summary: { type: "string" },
        highImpactFactors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              icon: { type: "string" },
              current: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["name", "icon", "current", "explanation"],
          },
        },
        moderateImpactFactors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              icon: { type: "string" },
              current: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["name", "icon", "current", "explanation"],
          },
        },
        protectiveFactors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              icon: { type: "string" },
              current: { type: "string" },
            },
            required: ["name", "icon", "current"],
          },
        },
      },
      required: ["overallRisk", "summary", "highImpactFactors", "moderateImpactFactors", "protectiveFactors"],
    };

    return (await callAI(system, user, schema, "report_risk_analysis")) as RiskAnalysis;
  });

export interface RecommendationsResult {
  priorityActions: {
    title: string;
    icon: string;
    severity: "critical" | "high" | "moderate";
    current: string;
    target: string;
    difficulty: number;
    progressNote: string;
    actionSteps: string[];
  }[];
  professionalRecs: string[];
  dailyTip: string;
  educational: { title: string; type: "article" | "video"; duration: string }[];
}

export const generateRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { currentShade?: string; recentHabits?: Record<string, unknown> }) => d)
  .handler(async ({ data }) => {
    const system = `Anda adalah asisten gigi yang membuat rencana aksi prioritas personal untuk memutihkan/menjaga warna gigi. Berikan output dalam Bahasa Indonesia.`;
    const user = `Shade VITA saat ini: ${data.currentShade ?? "belum ada"}.
Kebiasaan terkini: ${JSON.stringify(data.recentHabits ?? {})}.
Buat 3-5 rekomendasi prioritas (urutkan dari paling kritis). Setiap rekomendasi: title, icon (emoji), severity, current value, target value, difficulty (1-4), progress note, 3 action steps. Plus 2-3 rekomendasi profesional (mis. dental cleaning), 1 daily tip, dan 2-3 resource edukatif.`;

    const schema = {
      type: "object",
      properties: {
        priorityActions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              icon: { type: "string" },
              severity: { type: "string", enum: ["critical", "high", "moderate"] },
              current: { type: "string" },
              target: { type: "string" },
              difficulty: { type: "number", minimum: 1, maximum: 4 },
              progressNote: { type: "string" },
              actionSteps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
            },
            required: ["title", "icon", "severity", "current", "target", "difficulty", "progressNote", "actionSteps"],
          },
        },
        professionalRecs: { type: "array", items: { type: "string" } },
        dailyTip: { type: "string" },
        educational: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              type: { type: "string", enum: ["article", "video"] },
              duration: { type: "string" },
            },
            required: ["title", "type", "duration"],
          },
        },
      },
      required: ["priorityActions", "professionalRecs", "dailyTip", "educational"],
    };

    return (await callAI(system, user, schema, "report_recommendations")) as RecommendationsResult;
  });

export interface HabitInsights {
  encouragement: string;
  dailyTip: string;
  riskAlert: string | null;
}

export const generateHabitInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { recentHabits?: Record<string, unknown> }) => d)
  .handler(async ({ data }) => {
    const system = "Asisten gigi memberikan motivasi singkat berdasarkan kebiasaan 7 hari. Output Bahasa Indonesia.";
    const user = `Kebiasaan 7 hari terakhir: ${JSON.stringify(data.recentHabits ?? {})}. Buat encouragement 1 kalimat, daily tip praktis 1 kalimat, dan risk alert 1 kalimat (null jika tidak ada risiko mencolok).`;
    const schema = {
      type: "object",
      properties: {
        encouragement: { type: "string" },
        dailyTip: { type: "string" },
        riskAlert: { type: "string" },
      },
      required: ["encouragement", "dailyTip", "riskAlert"],
    };
    const r = (await callAI(system, user, schema, "report_habit_insights")) as HabitInsights;
    if (r.riskAlert && r.riskAlert.trim().toLowerCase() === "null") r.riskAlert = null;
    return r;
  });
