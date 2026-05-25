import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json, preflight } from "@/lib/mobile-api.server";

export const Route = createFileRoute("/api/mobile/recommendations")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const { data, error } = await auth.supabase
          .from("recommendations").select("*")
          .eq("user_id", auth.userId)
          .order("created_at", { ascending: false }).limit(50);
        if (error) return json({ error: error.message }, 500);
        return json({ recommendations: data ?? [] });
      },
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const body = await request.json().catch(() => ({}));
        const items = Array.isArray(body.items) ? body.items : [];
        const { data, error } = await auth.supabase
          .from("recommendations").insert({ user_id: auth.userId, items }).select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ recommendation: data }, 201);
      },
    },
  },
});
