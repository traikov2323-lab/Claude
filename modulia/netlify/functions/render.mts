// Фотореалистичен рендер с AI (Gemini през Netlify AI Gateway, без собствен ключ).
// POST /api/render { mode, prompt, images: [{ data: base64, mime }], aspect? } → { image: dataURL }
//   scene: 1 изображение (3D изгледът или снимка, която се преобразява)
//   room:  2 изображения (снимката на клиента и същата снимка с 3D макета)
//   edit:  1 до 3 изображения (снимка за преобразяване + референции: вдъхновение, вече готов ъгъл)
import { GoogleGenAI } from "@google/genai";
import type { Config, Context } from "@netlify/functions";

const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];
const ASPECTS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2", "4:5", "5:4", "21:9"]);
const COUNT: Record<string, [number, number]> = { scene: [1, 1], room: [2, 2], edit: [1, 3] };

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return Response.json({ error: "Само POST" }, { status: 405 });
  let body: { mode?: string; prompt?: string; aspect?: string; images?: Array<{ data?: string; mime?: string }> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Невалидни данни" }, { status: 400 });
  }
  const { mode, prompt } = body;
  const images = Array.isArray(body.images) ? body.images : [];
  const lim = COUNT[String(mode)];
  if (!lim) return Response.json({ error: "Непознат режим" }, { status: 400 });
  if (!prompt || prompt.length > 8000) return Response.json({ error: "Невалидна заявка" }, { status: 400 });
  if (images.length < lim[0] || images.length > lim[1]) return Response.json({ error: "Грешен брой снимки" }, { status: 400 });
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
  const aspect = ASPECTS.has(String(body.aspect)) ? String(body.aspect) : null;
  let lastErr = "";
  for (const model of MODELS) {
    // първо с точното съотношение на снимката, после без него (ако моделът не го поддържа)
    for (const withAspect of aspect ? [true, false] : [false]) {
      try {
        const config: Record<string, unknown> = { responseModalities: ["IMAGE"] };
        if (withAspect) config.imageConfig = { aspectRatio: aspect };
        const res = await ai.models.generateContent({ model, contents: [{ role: "user", parts }], config });
        const out = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData && p.inlineData.data);
        if (out && out.inlineData) return Response.json({ image: `data:${out.inlineData.mimeType || "image/png"};base64,${out.inlineData.data}`, model });
        lastErr = "Моделът не върна изображение";
        break;
      } catch (e) {
        lastErr = String((e as Error).message || e).slice(0, 200);
        if ((e as { status?: number }).status === 429) return Response.json({ error: "Твърде много заявки. Опитай след минута." }, { status: 429 });
      }
    }
  }
  return Response.json({ error: "Рендерът не стана: " + lastErr }, { status: 502 });
};

export const config: Config = {
  path: "/api/render",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 10 },
};
