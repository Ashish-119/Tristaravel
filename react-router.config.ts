import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	ssr: true,
	// NOTE: prerendering is intentionally disabled. This is a dynamic, database-
	// backed SSR app (quote form, driver portal, API routes), so pages are
	// rendered on demand by the Hono server. The old `prerender: ['/*?']` default
	// tried to statically prerender every route and pulled server-only code
	// (top-level await) into the browser bundle, breaking `react-router build`.
} satisfies Config;
