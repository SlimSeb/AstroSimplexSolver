import type { APIRoute } from "astro";
import { localeMeta, localePath, locales } from "../i18n";

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://simplex-solver.example.com");

  const urls = locales
    .map((loc) => {
      const loc_url = new URL(localePath(loc), base).href;
      const alternates = locales
        .map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${localeMeta[alt].htmlLang}" href="${new URL(localePath(alt), base).href}" />`,
        )
        .join("\n");
      return `  <url>\n    <loc>${loc_url}</loc>\n${alternates}\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
