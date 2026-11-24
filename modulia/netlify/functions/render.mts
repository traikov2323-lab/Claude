// Фотореалистичен рендер с AI (Gemini през Netlify AI Gateway, без собствен ключ).
// POST /api/render { mode: "scene" | "room", prompt, images: [{ data: base64, mime }] } → { image: dataURL }
//   scene: 1 изображение — 3D изгледът, който става на снимка
//   room:  2 изображения — снимката на клиента и същата снимка с 3D макета на новата кухня
import { GoogleGenAI } from "@google/genai";
import type { Config, Context } from "@netlify/functions";

const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return Response.json({ error: "Само POST" }, { status: 405 });
  let body: { mode?: string; prompt?: string; images?: Array<{ data?: string; mime?: string }> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Невалидни данни" }, { status: 400 });
  }
  const { mode, prompt } = body;
  const images = Array.isArray(body.images) ? body.images : [];
  if (mode !== "scene" && mode !== "room") return Response.json({ error: "Непознат режим" }, { status: 400 });
  if (!prompt || prompt.length > 6000) return Response.json({ error: "Невалидна заявка" }, { status: 400 });
  if (images.length !== (mode === "room" ? 2 : 1)) return Response.json({ error: "Грешен брой снимки" }, { status: 400 });
  for (const im of images)
    if (!im.data || im.data.length > 2_500_000 || !/^[A-Za-z0-9+/=]+$/.test(im.data)) return Response.json({ error: "Снимката е твърде голяма" }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY || Netlify.env.get("GEMINI_API_KEY");
  const baseUrl = process.env.GOOGLE_GEMINI_BASE_URL || Netlify.env.get("GOOGLE_GEMINI_BASE_URL");
  if (!apiKey) return Response.json({ error: "Рендерът се активира, опитай след малко" }, { status: 503 });
  const ai = new GoogleGenAI({ apiKey, httpOptions: baseUrl ? { baseUrl } : undefined });
  const parts = [
    ...images.map((im) => ({ inlineData: { mimeType: MIME.has(String(im.mime)) ? String(im.mime) : "image/jpeg", data: String(im.data) } })),
    { text: prompt },
  ];
  let lastErr = "";
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: { responseModalities: ["IMAGE"] },
      });
      const out = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData && p.inlineData.data);
      if (out && out.inlineData) return Response.json({ image: `data:${out.inlineData.mimeType || "image/png"};base64,${out.inlineData.data}`, model });
      lastErr = "Моделът не върна изображение";
    } catch (e) {
      lastErr = String((e as Error).message || e).slice(0, 200);
      if ((e as { status?: number }).status === 429) return Response.json({ error: "Твърде много заявки. Опитай след минута." }, { status: 429 });
    }
  }
  return Response.json({ error: "Рендерът не стана: " + lastErr }, { status: 502 });
};

export const config: Config = {
  path: "/api/render",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 4 },
};
