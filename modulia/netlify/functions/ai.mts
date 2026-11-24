// AI за снимки: разчита стил на кухня и размери на стая. Claude през Netlify AI Gateway (без собствен ключ).
// POST /api/ai  { task: "style" | "room" | "sketch", prompt: string, image: base64, mediaType: "image/jpeg" }
import Anthropic from "@anthropic-ai/sdk";
import type { Config, Context } from "@netlify/functions";

const TASKS = new Set(["style", "room", "sketch"]);
const MEDIA = new Set(["image/jpeg", "image/png", "image/webp"]);

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return Response.json({ error: "Само POST" }, { status: 405 });

  let body: { task?: string; prompt?: string; image?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Невалидни данни" }, { status: 400 });
  }
  const { task, prompt, image } = body;
  const mediaType = MEDIA.has(String(body.mediaType)) ? String(body.mediaType) : "image/jpeg";
  if (!task || !TASKS.has(task)) return Response.json({ error: "Непозната задача" }, { status: 400 });
  if (!prompt || prompt.length > 12000) return Response.json({ error: "Невалидна заявка" }, { status: 400 });
  if (!image || image.length > 4_500_000 || !/^[A-Za-z0-9+/=]+$/.test(image)) return Response.json({ error: "Липсва снимка или е твърде голяма" }, { status: 400 });

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || Netlify.env.get("ANTHROPIC_API_KEY");
    const baseURL = process.env.ANTHROPIC_BASE_URL || Netlify.env.get("ANTHROPIC_BASE_URL");
    if (!apiKey) return Response.json({ error: "AI се активира, опитай след малко" }, { status: 503 });
    const client = new Anthropic({ apiKey, baseURL: baseURL || undefined });
    const msg = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 2000,
      system:
        "You are a kitchen design assistant inside a Bulgarian kitchen configurator. You read photos and hand sketches of kitchens and rooms. Always reply with exactly one JSON value and nothing else. Text values meant for the user are in Bulgarian.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg", data: image } },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
    const text = msg.content.map((c) => ("text" in c ? c.text : "")).join("").trim();
    return Response.json({ text });
  } catch (e) {
    const status = (e as { status?: number }).status;
    console.error("ai error", status, String((e as Error).message || e).slice(0, 300));
    return Response.json({ error: status === 429 ? "Твърде много заявки" : "AI не отговори" }, { status: status === 429 ? 429 : 502 });
  }
};

export const config: Config = {
  path: "/api/ai",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 8 },
};
