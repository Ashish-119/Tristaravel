import { Hono } from 'hono';
import type { Handler } from 'hono/types';

const API_BASENAME = '/api';
const api = new Hono();

// NOTE: the original template set `globalThis.fetch = updatedFetch` here (a
// wrapper from src/__create/fetch that rewrites first-party Create.xyz URLs).
// That import is what pulled the shared fetch module into THIS server-entry
// chunk, which the app build (server-build.js) then imported back — creating a
// circular top-level-await deadlock that stopped the production server from
// binding its port. The override is server-only and unused by this app (the
// sole server-side fetch is the Google Maps call, an absolute URL the wrapper
// passes through untouched), so it is intentionally removed. The app still uses
// the wrapper directly where it needs it (src/app/root.tsx imports it explicitly).

// Eagerly import every API route module. `import.meta.glob` is statically
// analyzed by Vite, so all matching modules get bundled into the production
// server build (and their `@/` import aliases resolved at build time).
//
// The previous implementation scanned the filesystem with `readdir` and did a
// runtime dynamic `import()` of the source files. That only works under the
// Vite dev server: in a bundled production build the `src/app/api` tree isn't
// shipped next to the server bundle, plain Node can't resolve the `@/` aliases,
// and the top-level `await` it relied on hung the server before it could bind a
// port. Registering from a static glob fixes all three and behaves identically
// in dev and production.
const routeModules = import.meta.glob<Record<string, Handler>>(
  '../src/app/api/**/route.js',
  { eager: true }
);

// Transform a glob key like '../src/app/api/driver/leads/[id]/claim/route.js'
// into the ordered Hono path segments for that route.
function getHonoPath(routeKey: string): { name: string; pattern: string }[] {
  const rel = routeKey.replace('../src/app/api/', '').replace(/\/?route\.js$/, '');
  const routeParts = rel.split('/').filter(Boolean);
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  return routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
}

function registerRoutes() {
  api.routes = [];

  // Longest path first so more-specific routes are matched before shallower ones.
  const entries = Object.entries(routeModules).sort((a, b) => b[0].length - a[0].length);

  for (const [routeKey, route] of entries) {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
    for (const method of methods) {
      if (!route[method]) {
        continue;
      }
      const parts = getHonoPath(routeKey);
      const honoPath = `/${parts.map(({ pattern }) => pattern).join('/')}`;
      const handler: Handler = async (c) => {
        const params = c.req.param();
        return await route[method](c.req.raw, { params });
      };
      switch (method.toLowerCase()) {
        case 'get':
          api.get(honoPath, handler);
          break;
        case 'post':
          api.post(honoPath, handler);
          break;
        case 'put':
          api.put(honoPath, handler);
          break;
        case 'delete':
          api.delete(honoPath, handler);
          break;
        case 'patch':
          api.patch(honoPath, handler);
          break;
        default:
          break;
      }
    }
  }
}

registerRoutes();

// In dev, the Vite config's `restart` plugin restarts the server when any
// `route.js` changes, which re-runs this module (and the glob) from scratch.
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.accept((newSelf) => {
    import.meta.hot?.invalidate();
  });
}

export { api, API_BASENAME };
