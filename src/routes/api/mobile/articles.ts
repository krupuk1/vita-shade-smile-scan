import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { json, preflight } from "@/lib/mobile-api.server";

export const Route = createFileRoute("/api/mobile/articles")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      // Public — list published articles. No auth required.
      GET: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug");
        const category = url.searchParams.get("category");

        let q = supabase.from("articles").select("*").eq("published", true);
        if (slug) q = q.eq("slug", slug);
        if (category) q = q.eq("category", category);
        const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
        if (error) return json({ error: error.message }, 500);
        return json({ articles: data ?? [] });
      },
    },
  },
});
