import type { APIRoute } from 'astro';
import { config } from '../lib/config';

export const GET: APIRoute = () => {
  const isPlaceholder = config.siteUrl.includes('example.com');
  const site = config.siteUrl;

  const body = isPlaceholder
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nDisallow: /account/\nDisallow: /booking/\n\nSitemap: ${site}/sitemap-index.xml\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
