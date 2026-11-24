// Заявки от клиенти към мебелните цехове.
// POST  /api/requests          → всеки посетител изпраща заявка
// GET   /api/requests          → само профили „Мебелен цех“
// PATCH /api/requests?id=...   → смяна на статус (само цехове)
import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";
import type { Config, Context } from "@netlify/functions";

const json = (data: unknown, status = 200) => Response.json(data, { status });
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

type Req = { id: string; name: string; phone: string; city: string; note: string; total: number; summary: string; project: string; status: string; createdAt: string };

async function requireShop() {
  const user = await getUser();
  if (!user) return { error: json({ error: "Влез в акаунта" }, 401) };
  if ((user.userMetadata as Record<string, unknown> | undefined)?.account_type !== "workshop") return { error: json({ error: "Само за мебелни цехове" }, 403) };
  return { user };
}

export default async (req: Request, context: Context) => {
  const store = getStore({ name: "requests", consistency: "strong" });

  if (req.method === "POST") {
    const text = await req.text();
    if (text.length > 300_000) return json({ error: "Заявката е твърде голяма" }, 413);
    let b: Record<string, unknown>;
    try {
      b = JSON.parse(text);
    } catch {
      return json({ error: "Невалидни данни" }, 400);
    }
    const name = str(b.name, 80);
    const phone = str(b.phone, 30);
    if (!name || !/^[+\d][\d\s-]{6,}$/.test(phone)) return json({ error: "Липсва име или телефон" }, 400);
    const createdAt = new Date().toISOString();
    const id = createdAt.replace(/[^0-9]/g, "").slice(0, 14) + "-" + Math.random().toString(36).slice(2, 8);
    const rec: Req = {
      id,
      name,
      phone,
      city: str(b.city, 40),
      note: str(b.note, 600),
      total: Number(b.total) || 0,
      summary: str(b.summary, 300),
      project: typeof b.project === "string" ? b.project.slice(0, 250_000) : "",
      status: "нова",
      createdAt,
    };
    await store.setJSON(id, rec, { onlyIfNew: true });
    return json({ ok: true, id }, 201);
  }

  if (req.method === "GET") {
    const auth = await requireShop();
    if (auth.error) return auth.error;
    const { blobs } = await store.list();
    const keys = blobs.map((x) => x.key).sort().reverse().slice(0, 200);
    const list = (await Promise.all(keys.map((k) => store.get(k, { type: "json" })))).filter(Boolean);
    return json(list);
  }

  if (req.method === "PATCH") {
    const auth = await requireShop();
    if (auth.error) return auth.error;
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!/^[0-9]{14}-[a-z0-9]{1,8}$/.test(id)) return json({ error: "Невалидна заявка" }, 400);
    const rec = (await store.get(id, { type: "json" })) as Req | null;
    if (!rec) return json({ error: "Няма такава заявка" }, 404);
    const { status } = (await req.json().catch(() => ({}))) as { status?: string };
    rec.status = ["нова", "обработена", "оферта изпратена"].includes(String(status)) ? String(status) : rec.status;
    await store.setJSON(id, rec);
    return json({ ok: true });
  }

  return json({ error: "Методът не се поддържа" }, 405);
};

export const config: Config = { path: "/api/requests" };
