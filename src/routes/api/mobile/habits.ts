import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json, preflight } from "@/lib/mobile-api.server";

export const Route = createFileRoute("/api/mobile/habits")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const url = new URL(request.url);
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        let q = auth.supabase.from("habit_logs").select("*")
          .eq("user_id", auth.userId).order("log_date", { ascending: false });
        if (from) q = q.gte("log_date", from);
        if (to) q = q.lte("log_date", to);
        const { data, error } = await q.limit(365);
        if (error) return json({ error: error.message }, 500);
        return json({ habits: data ?? [] });
      },
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const body = await request.json().catch(() => ({}));
        const log_date = typeof body.log_date === "string"
          ? body.log_date
          : new Date().toISOString().slice(0, 10);
        const payload = {
          user_id: auth.userId,
          log_date,
          cigarettes: Number(body.cigarettes ?? 0),
          tea_cups: Number(body.tea_cups ?? 0),
          coffee_cups: Number(body.coffee_cups ?? 0),
          mouthwash: !!body.mouthwash,
          flossing: !!body.flossing,
          brushing_morning: !!body.brushing_morning,
          brushing_night: !!body.brushing_night,
        };
        const { data, error } = await auth.supabase
          .from("habit_logs")
          .upsert(payload, { onConflict: "user_id,log_date" })
          .select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ habit: data });
      },
    },
  },
});
