import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { CORS_HEADERS, json, preflight } from "@/lib/mobile-api.server";

export const Route = createFileRoute("/api/mobile/auth/login")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          const email = typeof body?.email === "string" ? body.email.trim() : "";
          const password = typeof body?.password === "string" ? body.password : "";
          if (!email || !password) return json({ error: "email and password required" }, 400);

          const SUPABASE_URL = process.env.SUPABASE_URL!;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error || !data.session) return json({ error: error?.message ?? "Login failed" }, 401);

          return json({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: { id: data.user!.id, email: data.user!.email },
          });
        } catch (e: any) {
          return json({ error: e?.message ?? "Server error" }, 500);
        }
      },
    },
  },
});

export const _cors = CORS_HEADERS;
