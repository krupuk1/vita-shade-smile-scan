import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json, preflight } from "@/lib/mobile-api.server";

export const Route = createFileRoute("/api/mobile/profile")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const { data, error } = await auth.supabase
          .from("profiles").select("*").eq("user_id", auth.userId).maybeSingle();
        if (error) return json({ error: error.message }, 500);
        return json({ profile: data });
      },
      PUT: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const body = await request.json().catch(() => ({} as any));
        const patch: {
          display_name?: string | null;
          gender?: string | null;
          age?: number | null;
          avatar_url?: string | null;
        } = {};
        if ("display_name" in body) patch.display_name = body.display_name ?? null;
        if ("gender" in body) patch.gender = body.gender ?? null;
        if ("age" in body) patch.age = body.age == null ? null : Number(body.age);
        if ("avatar_url" in body) patch.avatar_url = body.avatar_url ?? null;
        const { data, error } = await auth.supabase
          .from("profiles").update(patch).eq("user_id", auth.userId).select().maybeSingle();
        if (error) return json({ error: error.message }, 400);
        return json({ profile: data });
      },
    },
  },
});
