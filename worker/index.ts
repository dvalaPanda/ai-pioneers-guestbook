import type { Env } from "./env";
import { json } from "./lib/json";
import { handleState } from "./routes/state";
import { handlePostVisitor } from "./routes/visitors";
import { handlePostNote } from "./routes/notes";

type RouteHandler = (req: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

const ROUTES: Record<string, RouteHandler> = {
  "GET /api/state": handleState,
  "POST /api/visitors": handlePostVisitor,
  "POST /api/notes": handlePostNote,
  "GET /api/health": async () => json({ ok: true }),
};

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      const key = `${req.method} ${url.pathname}`;
      const handler = ROUTES[key];
      if (!handler) return json({ error: "not_found" }, 404);
      try {
        return await handler(req, env, ctx);
      } catch (e) {
        console.error("api error", key, e);
        return json({ error: "internal" }, 500);
      }
    }
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
