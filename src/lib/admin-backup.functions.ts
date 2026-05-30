import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TABLES = [
  "profiles",
  "user_roles",
  "articles",
  "tooth_scans",
  "habit_logs",
  "risk_analyses",
  "recommendations",
  "ai_provider_settings",
] as const;

type TableName = (typeof TABLES)[number];

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = (data ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Error("Admin only");
}

export const exportDatabase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const data: Record<string, any[]> = {};
    const counts: Record<string, number> = {};
    for (const t of TABLES) {
      const { data: rows, error } = await supabaseAdmin.from(t).select("*");
      if (error) throw new Error(`${t}: ${error.message}`);
      data[t] = rows ?? [];
      counts[t] = (rows ?? []).length;
    }

    return {
      meta: {
        version: 1,
        exported_at: new Date().toISOString(),
        tables: TABLES,
        counts,
      },
      data,
    };
  });

export const importDatabase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { payload: { meta?: any; data: Record<string, any[]> }; mode: "merge" | "replace" }) => {
      if (!input?.payload?.data || typeof input.payload.data !== "object") {
        throw new Error("Invalid backup payload");
      }
      if (input.mode !== "merge" && input.mode !== "replace") {
        throw new Error("Invalid mode");
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const result: Record<string, { inserted: number; skipped: number }> = {};

    // For replace mode, delete in reverse dependency order (children first).
    if (data.mode === "replace") {
      for (const t of [...TABLES].reverse()) {
        const { error } = await supabaseAdmin.from(t).delete().not("id", "is", null);
        if (error) throw new Error(`Clear ${t}: ${error.message}`);
      }
    }

    for (const t of TABLES) {
      const rows = (data.payload.data as Record<string, any[]>)[t];
      if (!Array.isArray(rows) || rows.length === 0) {
        result[t] = { inserted: 0, skipped: 0 };
        continue;
      }
      // Chunk to avoid payload limits
      const chunkSize = 500;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabaseAdmin.from(t).upsert(chunk, { onConflict: "id" });
        if (error) throw new Error(`${t}: ${error.message}`);
        inserted += chunk.length;
      }
      result[t] = { inserted, skipped: 0 };
    }

    return { ok: true, mode: data.mode, result };
  });
