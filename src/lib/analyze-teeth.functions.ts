import { createServerFn } from "@tanstack/react-start";

const VITA_SHADES = [
  "B1", "A1", "B2", "D2", "A2", "C1", "C2", "D4",
  "A3", "D3", "B3", "A3.5", "B4", "C3", "A4", "C4",
];

export interface ToothAnalysis {
  primaryShade: string;
  secondaryShade: string | null;
  brightness: "very-light" | "light" | "medium" | "dark";
  confidence: number; // 0-100
  observations: string[];
  recommendations: string[];
  hygieneScore: number; // 0-100
  summary: string;
}

export const analyzeTeeth = createServerFn({ method: "POST" })
  .inputValidator((data: { imageBase64: string }) => {
    if (!data?.imageBase64 || typeof data.imageBase64 !== "string") {
      throw new Error("imageBase64 is required");
    }
    if (data.imageBase64.length > 10_000_000) {
      throw new Error("Image too large (max ~7MB)");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY belum terkonfigurasi");

    const dataUrl = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:image/jpeg;base64,${data.imageBase64}`;

    const systemPrompt = `Anda adalah asisten estetika gigi yang menganalisis warna gigi berdasarkan panduan VITA Classical Shade. 
Gunakan 16 shade: ${VITA_SHADES.join(", ")} (B1 paling terang/putih, C4 paling gelap).
PENTING: Ini hanya estimasi visual berbasis foto, bukan diagnosis medis. Selalu sarankan konsultasi dokter gigi untuk pencocokan akurat.
Jawab HANYA dengan JSON valid sesuai schema yang diberikan, tanpa teks tambahan.`;

    const userPrompt = `Analisis foto gigi ini. Tentukan:
1. VITA shade utama yang paling cocok (dari 16 shade VITA Classical).
2. Shade sekunder (alternatif terdekat), boleh null.
3. Tingkat kecerahan keseluruhan.
4. Confidence Anda 0-100 (turunkan jika foto buram/pencahayaan buruk/gigi tidak jelas).
5. 2-4 observasi singkat (warna, noda, plak, keseragaman).
6. 2-4 rekomendasi perawatan/estetika.
7. Skor kebersihan estimasi 0-100.
8. Ringkasan 1-2 kalimat dalam Bahasa Indonesia.

Jika gambar BUKAN gigi atau tidak bisa dianalisis, set confidence=0 dan summary jelaskan alasannya.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_tooth_analysis",
              description: "Laporkan hasil analisis gigi berbasis VITA shade.",
              parameters: {
                type: "object",
                properties: {
                  primaryShade: { type: "string", enum: VITA_SHADES },
                  secondaryShade: { type: ["string", "null"], enum: [...VITA_SHADES, null] },
                  brightness: {
                    type: "string",
                    enum: ["very-light", "light", "medium", "dark"],
                  },
                  confidence: { type: "number", minimum: 0, maximum: 100 },
                  observations: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 1,
                    maxItems: 5,
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 1,
                    maxItems: 5,
                  },
                  hygieneScore: { type: "number", minimum: 0, maximum: 100 },
                  summary: { type: "string" },
                },
                required: [
                  "primaryShade",
                  "secondaryShade",
                  "brightness",
                  "confidence",
                  "observations",
                  "recommendations",
                  "hygieneScore",
                  "summary",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_tooth_analysis" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429) {
        throw new Error("Rate limit tercapai. Coba lagi sebentar lagi.");
      }
      if (response.status === 402) {
        throw new Error("Kredit AI habis. Tambahkan kredit di Workspace Settings.");
      }
      console.error("AI gateway error", response.status, text);
      throw new Error("Gagal menganalisis gambar.");
    }

    const json = await response.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Respons AI tidak valid.");
    }
    const parsed = JSON.parse(toolCall.function.arguments) as ToothAnalysis;
    return parsed;
  });
