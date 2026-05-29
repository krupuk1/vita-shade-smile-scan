import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AiProvider = "lovable" | "openai" | "gemini" | "openrouter" | "openai_compatible";

export interface AiProviderSettings {
  provider: AiProvider;
  model: string;
  api_key: string | null;
  base_url: string | null;
  updated_at: string | null;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = (data ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Error("Admin only");
}

export const getAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("ai_provider_settings")
      .select("provider, model, api_key, base_url, updated_at")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const cfg = (data ?? { provider: "lovable", model: "google/gemini-2.5-flash", api_key: null, base_url: null, updated_at: null }) as AiProviderSettings;
    // Mask api_key — never send full key to browser
    const maskedKey = cfg.api_key ? `••••${cfg.api_key.slice(-4)}` : null;
    return { ...cfg, api_key: maskedKey, has_key: Boolean(cfg.api_key) };
  });

export const updateAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: AiProvider; model: string; api_key?: string | null; base_url?: string | null }) => {
    const allowed: AiProvider[] = ["lovable", "openai", "gemini", "openrouter", "openai_compatible"];
    if (!allowed.includes(data.provider)) throw new Error("Invalid provider");
    if (!data.model || typeof data.model !== "string" || data.model.length > 200) throw new Error("Invalid model");
    if (data.api_key && data.api_key.length > 500) throw new Error("API key too long");
    if (data.base_url && data.base_url.length > 500) throw new Error("Base URL too long");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const patch: {
      provider: AiProvider;
      model: string;
      base_url: string | null;
      updated_by: string;
      api_key?: string;
    } = {
      provider: data.provider,
      model: data.model,
      base_url: data.base_url || null,
      updated_by: userId,
    };
    if (typeof data.api_key === "string" && data.api_key.trim().length > 0) {
      patch.api_key = data.api_key.trim();
    }

    // Check if row exists; insert if not, update if yes (singleton pattern).
    const { data: existing } = await supabase
      .from("ai_provider_settings")
      .select("id")
      .eq("singleton", true)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("ai_provider_settings")
        .update(patch)
        .eq("singleton", true);
      if (error) throw new Error(error.message);
    } else {
      const insertRow = { ...patch, singleton: true, api_key: patch.api_key ?? null };
      const { error } = await supabase
        .from("ai_provider_settings")
        .insert(insertRow);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
