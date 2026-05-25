import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json, preflight } from "@/lib/mobile-api.server";

export const Route = createFileRoute("/api/mobile/scans")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
        const { data, error } = await auth.supabase
          .from("tooth_scans").select("*")
          .eq("user_id", auth.userId)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) return json({ error: error.message }, 500);
        return json({ scans: data ?? [] });
      },
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const body = await request.json().catch(() => ({}));
        const row = {
          user_id: auth.userId,
          method: typeof body.method === "string" ? body.method : "upload",
          primary_shade: String(body.primary_shade ?? ""),
          secondary_shade: body.secondary_shade ?? null,
          brightness: body.brightness ?? null,
          confidence: body.confidence ?? null,
          hygiene_score: body.hygiene_score ?? null,
          observations: body.observations ?? [],
          recommendations: body.recommendations ?? [],
          summary: body.summary ?? null,
        };
        if (!row.primary_shade) return json({ error: "primary_shade required" }, 400);
        const { data, error } = await auth.supabase.from("tooth_scans").insert(row).select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ scan: data }, 201);
      },
      DELETE: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return json({ error: "id query param required" }, 400);
        const { error } = await auth.supabase.from("tooth_scans").delete().eq("id", id).eq("user_id", auth.userId);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      },
    },
  },
});
