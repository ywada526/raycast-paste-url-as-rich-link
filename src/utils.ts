import { withCache } from "@raycast/utils";

export function validateUrl(str: string): { ok: true; url: URL } | { ok: false; error: Error } {
  try {
    return { ok: true, url: new URL(str) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(`Invalid URL: ${str}`) };
  }
}

export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function unescapeHTML(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function _getPageTitle(url: string): Promise<{ ok: true; title: string } | { ok: false; error: Error }> {
  const response = await fetch(url);
  if (!response.ok) return { ok: false, error: new Error(`[${response.status}] ${await response.text()}`) };

  const html = await response.text();
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!titleMatch) return { ok: false, error: new Error(`No title found for ${url}`) };

  return { ok: true, title: unescapeHTML(titleMatch[1].trim()) };
}
export const getPageTitle = withCache(_getPageTitle, { maxAge: 1000 * 60 * 60 * 24 });
