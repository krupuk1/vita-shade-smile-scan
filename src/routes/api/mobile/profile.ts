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
        const body = await request.json().catch(() => ({}));
        const patch: Record<string, unknown> = {};
        for (const k of ["display_name", "gender", "age", "avatar_url"]) {
          if (k in body) patch[k] = body[k];
        }
        const { data, error } = await auth.supabase
          .from("profiles").update(patch).eq("user_id", auth.userId).select().maybeSingle();
        if (error) return json({ error: error.message }, 400);
        return json({ profile: data });
      },
    },
  },
});
