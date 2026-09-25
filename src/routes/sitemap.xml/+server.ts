import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;
	const now = new Date().toISOString();

	const urls = [
		{ path: '/', priority: '1.0', changefreq: 'weekly' },
		{ path: '/blog', priority: '0.8', changefreq: 'weekly' }
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) => `  <url>
    <loc>${origin}${u.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
};
