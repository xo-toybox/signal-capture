/**
 * Server-side utility to scrape page titles from URLs.
 * Used by the enrich-title API route.
 */

const TIMEOUT_MS = 5000;

/**
 * Block SSRF: reject URLs pointing at localhost, link-local, or RFC-1918
 * private networks (including the cloud metadata endpoint 169.254.x.x).
 */
function isPrivateHost(hostname: string): boolean {
  // Strip brackets from IPv6 literals like [::1]
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();

  // Exact-match blocklist
  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(host)) {
    return true;
  }

  // IPv4 range checks
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10) return true;                          // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
    if (a === 192 && b === 168) return true;             // 192.168.0.0/16
    if (a === 169 && b === 254) return true;             // 169.254.0.0/16 (link-local / cloud metadata)
    if (a === 127) return true;                          // 127.0.0.0/8
    if (a === 0) return true;                            // 0.0.0.0/8
  }

  // IPv6: Unique Local Addresses fc00::/7
  if (host.startsWith('fc') || host.startsWith('fd')) return true;
  // IPv6: Link-local fe80::/10
  if (host.startsWith('fe80')) return true;
  // IPv6: IPv4-mapped addresses ::ffff:A.B.C.D
  const v4mapped = host.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4mapped) {
    return isPrivateHost(v4mapped[1]);
  }

  return false;
}

// Sites where <title> is unhelpful — go straight to og:title
const OG_TITLE_PREFERRED = new Set([
  'twitter.com',
  'x.com',
  'reddit.com',
  'youtube.com',
  'www.reddit.com',
  'www.youtube.com',
]);

function decodeEntities(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const cp = Number(code);
      if (cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) return '';
      return String.fromCodePoint(cp);
    });
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1].trim()) : null;
}

function extractOgTitle(html: string): string | null {
  const match = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  ) ?? html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i
  );
  return match ? decodeEntities(match[1].trim()) : null;
}

export async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const { hostname } = new URL(url);
    if (isPrivateHost(hostname)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SignalCapture/1.0 (title-fetch)',
        Accept: 'text/html',
      },
      redirect: 'manual',
    });

    // Follow at most 1 redirect, validating the target against SSRF
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('Location');
      if (!location) { clearTimeout(timer); return null; }
      const redirectUrl = new URL(location, url);
      if (isPrivateHost(redirectUrl.hostname)) { clearTimeout(timer); return null; }
      res = await fetch(redirectUrl.href, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SignalCapture/1.0 (title-fetch)',
          Accept: 'text/html',
        },
        redirect: 'manual',
      });
    }

    clearTimeout(timer);

    if (!res.ok) return null;

    // Only read first 50KB — title is always in <head>
    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = '';
    const decoder = new TextDecoder();
    while (html.length < 50_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    const preferOg = OG_TITLE_PREFERRED.has(hostname);

    if (preferOg) {
      return extractOgTitle(html) ?? extractTitle(html) ?? null;
    }

    return extractTitle(html) ?? extractOgTitle(html) ?? null;
  } catch {
    return null;
  }
}
