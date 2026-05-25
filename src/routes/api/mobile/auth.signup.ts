import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { json, preflight } from "@/lib/mobile-api.server";

export const Route = createFileRoute("/api/mobile/auth/signup")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          const email = typeof body?.email === "string" ? body.email.trim() : "";
          const password = typeof body?.password === "string" ? body.password : "";
          const display_name = typeof body?.display_name === "string" ? body.display_name : "";
          const gender = typeof body?.gender === "string" ? body.gender : null;
          const age = Number.isFinite(body?.age) ? Number(body.age) : null;

          if (!email || !password) return json({ error: "email and password required" }, 400);
          if (password.length < 8) return json({ error: "password must be at least 8 characters" }, 400);

          const SUPABASE_URL = process.env.SUPABASE_URL!;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name, gender, age } },
          });
          if (error) return json({ error: error.message }, 400);
          return json({
            user: data.user ? { id: data.user.id, email: data.user.email } : null,
            session: data.session
              ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
              : null,
          });
        } catch (e: any) {
          return json({ error: e?.message ?? "Server error" }, 500);
        }
      },
    },
  },
});
