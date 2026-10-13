import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { articles } from '../../lib/content';

export async function GET(context: APIContext) {
  const site = context.site ?? new URL('https://example.com');
  return rss({
    title: 'Aurelia Sable — Journal',
    description: 'Essays on tarot, grief, decision-making and the history of the deck.',
    site: site.href,
    items: articles.map((article) => ({
      title: article.title,
      description: article.dek,
      pubDate: new Date(article.publishedAt),
      link: `/journal/${article.slug}`,
    })),
  });
}
