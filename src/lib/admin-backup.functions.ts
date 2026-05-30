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

    const tables: Record<string, any[]> = {};
    for (const t of TABLES) {
      const { data: rows, error } = await supabaseAdmin.from(t).select("*");
      if (error) throw new Error(`${t}: ${error.message}`);
      tables[t] = rows ?? [];
    }

    return {
      version: "1.0",
      created_at: new Date().toISOString(),
      source: "tintify-admin-backup",
      tables,
    };
  });

// Accept both new format ({version, tables}) and legacy ({meta, data}).
function extractTables(payload: any): Record<string, any[]> {
  if (payload?.tables && typeof payload.tables === "object" && !Array.isArray(payload.tables)) {
    return payload.tables;
  }
  if (payload?.data && typeof payload.data === "object") {
    return payload.data;
  }
  throw new Error("Invalid backup payload: missing 'tables'");
}

export const importDatabase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { payload: any; mode: "merge" | "replace" }) => {
      if (!input?.payload || typeof input.payload !== "object") {
        throw new Error("Invalid backup payload");
      }
      // Validate shape early
      extractTables(input.payload);
      if (input.mode !== "merge" && input.mode !== "replace") {
        throw new Error("Invalid mode");
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const tables = extractTables(data.payload);
    const result: Record<string, { inserted: number; skipped: number }> = {};

    if (data.mode === "replace") {
      for (const t of [...TABLES].reverse()) {
        const { error } = await supabaseAdmin.from(t).delete().not("id", "is", null);
        if (error) throw new Error(`Clear ${t}: ${error.message}`);
      }
    }

    for (const t of TABLES) {
      const rows = tables[t];
      if (!Array.isArray(rows) || rows.length === 0) {
        result[t] = { inserted: 0, skipped: 0 };
        continue;
      }
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
