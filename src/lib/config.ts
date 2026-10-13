/**
 * Runtime configuration, resolved once and shared by every caller.
 *
 * Reads `PUBLIC_*` variables so the same values are available during the static
 * build and inside browser islands. Only public values live here — a `pk_` key
 * grants exactly what an anonymous visitor may do, so shipping it is safe by
 * design. An `sk_` key must never reach this file.
 */

const env = import.meta.env as Record<string, string | undefined>;

function str(key: string, fallback = ''): string {
  const raw = env[key];
  return typeof raw === 'string' ? raw.trim() : fallback;
}

const apiBaseUrl = str('PUBLIC_API_BASE_URL').replace(/\/+$/, '');
const apiKey = str('PUBLIC_API_KEY');
const demoFlag = str('PUBLIC_DEMO_MODE').toLowerCase();

/**
 * Demo mode turns itself on whenever credentials are absent, so the site always
 * builds and always renders a finished-looking page. Setting
 * `PUBLIC_DEMO_MODE=false` forces real calls even without credentials, which is
 * how you verify the designed error states.
 */
const explicitDemo = demoFlag === 'true' || demoFlag === '1';
const explicitLive = demoFlag === 'false' || demoFlag === '0';
const credentialsPresent = Boolean(apiBaseUrl && apiKey);

export const config = {
  apiBaseUrl,
  apiKey,
  credentialsPresent,
  isDemo: explicitDemo || (!explicitLive && !credentialsPresent),
  timeoutMs: Number(str('PUBLIC_API_TIMEOUT_MS', '8000')) || 8000,
  siteUrl: str('PUBLIC_SITE_URL', 'https://example.com').replace(/\/+$/, ''),
} as const;

/**
 * Origin of the platform deployment, derived by stripping the `/api/v1` suffix
 * from the API base URL. Uploads are served from there, not from the API path.
 */
export const deploymentOrigin = apiBaseUrl.replace(/\/api\/v\d+$/, '');

/**
 * Turn a storage key from `/profile` into a servable URL.
 * Returns `null` for empty keys so callers can branch on it directly rather
 * than rendering an image element pointing at nothing.
 */
export function uploadUrl(key: string | undefined | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  if (!deploymentOrigin) return null;
  return `${deploymentOrigin}/uploads/${key.replace(/^\/+/, '')}`;
}

/** Absolute URL on this site, for canonical tags and Stripe return URLs. */
export function absoluteUrl(path = '/'): string {
  return `${config.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
