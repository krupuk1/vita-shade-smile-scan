import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AiProvider = "lovable" | "openai" | "gemini" | "openrouter" | "openai_compatible";

export interface AiConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl: string;
}

const DEFAULT_BASE_URLS: Record<AiProvider, string> = {
  lovable: "https://ai.gateway.lovable.dev/v1",
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
  openai_compatible: "",
};

export async function getAiConfig(): Promise<AiConfig> {
  const { data } = await supabaseAdmin
    .from("ai_provider_settings")
    .select("provider, model, api_key, base_url")
    .eq("singleton", true)
    .maybeSingle();

  const provider = (data?.provider ?? "lovable") as AiProvider;
  const model = data?.model || "google/gemini-2.5-flash";
  const baseUrl = (data?.base_url || DEFAULT_BASE_URLS[provider] || "").replace(/\/$/, "");

  let apiKey = data?.api_key || "";
  if (provider === "lovable" || !apiKey) {
    apiKey = process.env.LOVABLE_API_KEY ?? "";
  }
  if (!apiKey) throw new Error("AI API key belum terkonfigurasi");
  if (!baseUrl) throw new Error("AI base URL belum terkonfigurasi");

  return { provider, model, apiKey, baseUrl };
}

export async function aiChatCompletions(body: Record<string, unknown>) {
  const cfg = await getAiConfig();
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, model: (body as any).model ?? cfg.model }),
  });
  return res;
}
