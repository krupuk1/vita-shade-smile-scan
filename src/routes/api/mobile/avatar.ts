import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json, preflight } from "@/lib/mobile-api.server";

// POST /api/mobile/avatar — upload avatar.
// Body: multipart/form-data with field "file", OR JSON { base64: "<data>", contentType: "image/jpeg" }.
// Returns: { avatar_url, path }
export const Route = createFileRoute("/api/mobile/avatar")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      DELETE: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        // List user's folder and remove
        const { data: files } = await auth.supabase.storage.from("avatars").list(auth.userId);
        if (files?.length) {
          await auth.supabase.storage.from("avatars").remove(files.map((f) => `${auth.userId}/${f.name}`));
        }
        await auth.supabase.from("profiles").update({ avatar_url: null }).eq("user_id", auth.userId);
        return json({ ok: true });
      },
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;

        const ctype = request.headers.get("content-type") ?? "";
        let bytes: Uint8Array;
        let contentType = "image/jpeg";

        if (ctype.includes("multipart/form-data")) {
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) return json({ error: "file field required" }, 400);
          if (file.size > 5 * 1024 * 1024) return json({ error: "Max 5MB" }, 400);
          contentType = file.type || "image/jpeg";
          bytes = new Uint8Array(await file.arrayBuffer());
        } else {
          const body = await request.json().catch(() => null);
          const base64 = typeof body?.base64 === "string" ? body.base64.replace(/^data:[^,]+,/, "") : "";
          if (!base64) return json({ error: "base64 or multipart file required" }, 400);
          contentType = typeof body?.contentType === "string" ? body.contentType : "image/jpeg";
          const bin = atob(base64);
          bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          if (bytes.length > 5 * 1024 * 1024) return json({ error: "Max 5MB" }, 400);
        }

        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
        const path = `${auth.userId}/avatar-${Date.now()}.${ext}`;

        const { error: upErr } = await auth.supabase.storage
          .from("avatars")
          .upload(path, bytes, { contentType, upsert: true });
        if (upErr) return json({ error: upErr.message }, 400);

        const { data: pub } = auth.supabase.storage.from("avatars").getPublicUrl(path);
        const avatar_url = pub.publicUrl;

        await auth.supabase.from("profiles").update({ avatar_url }).eq("user_id", auth.userId);
        return json({ avatar_url, path });
      },
    },
  },
});
