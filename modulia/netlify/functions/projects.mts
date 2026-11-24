// Проекти в акаунта: всеки потребител вижда и променя само своите.
// GET /api/projects          → списък
// GET /api/projects?id=K123  → един проект
// PUT /api/projects          → запази { project, total }
// DELETE /api/projects?id=   → изтрий
import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";
import type { Config, Context } from "@netlify/functions";

const json = (data: unknown, status = 200) => Response.json(data, { status });
const safeId = (s: unknown) => typeof s === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(s);

export default async (req: Request, context: Context) => {
  const user = await getUser();
  if (!user) return json({ error: "Влез в акаунта" }, 401);
  const store = getStore({ name: "projects", consistency: "strong" });
  const prefix = `${user.id}/`;
  const id = new URL(req.url).searchParams.get("id");

  if (req.method === "GET" && !id) {
    const { blobs } = await store.list({ prefix });
    const items = await Promise.all(
      blobs.map(async (b) => {
        const meta = await store.getMetadata(b.key);
        return meta ? { id: b.key.slice(prefix.length), ...(meta.metadata as Record<string, unknown>) } : null;
      })
    );
    const list = items.filter(Boolean) as Array<{ updatedAt?: string }>;
    list.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    return json(list);
  }

  if (req.method === "GET" && id) {
    if (!safeId(id)) return json({ error: "Невалиден проект" }, 400);
    const data = await store.get(prefix + id, { type: "json" });
    if (data === null) return json({ error: "Няма такъв проект" }, 404);
    return json(data);
  }

  if (req.method === "PUT") {
    const text = await req.text();
    if (text.length > 400_000) return json({ error: "Проектът е твърде голям" }, 413);
    let body: { project?: Record<string, any>; total?: number };
    try {
      body = JSON.parse(text);
    } catch {
      return json({ error: "Невалидни данни" }, 400);
    }
    const p = body.project;
    if (!p || !safeId(p.id) || !p.room || !p.mats) return json({ error: "Невалиден проект" }, 400);
    const r = p.room;
    const summary = `${r.shape === "L" ? "Г-образна" : "Права"} · A ${r.wallA}${r.shape === "L" ? " · B " + r.wallB : ""} мм`;
    const updatedAt = new Date().toISOString();
    await store.setJSON(prefix + p.id, { project: p, total: Number(body.total) || 0, updatedAt }, {
      metadata: { name: String(p.name || "Кухня").slice(0, 60), total: Number(body.total) || 0, summary, updatedAt },
    });
    return json({ ok: true, id: p.id, updatedAt });
  }

  if (req.method === "DELETE") {
    if (!safeId(id)) return json({ error: "Невалиден проект" }, 400);
    await store.delete(prefix + id);
    return new Response(null, { status: 204 });
  }

  return json({ error: "Методът не се поддържа" }, 405);
};

export const config: Config = { path: "/api/projects" };
