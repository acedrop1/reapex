import { NextRequest, NextResponse } from 'next/server';

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// GET /api/og-image?url=https://example.com
// Returns { thumbnail_url: "..." } — either a YouTube thumbnail or an OpenGraph image
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // 1. YouTube — predictable thumbnail URL, no fetch needed
    const ytId = getYouTubeVideoId(url);
    if (ytId) {
      return NextResponse.json({
        thumbnail_url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        source: 'youtube',
      });
    }

    // 2. Vimeo — use oEmbed API
    if (url.includes('vimeo.com')) {
      try {
        const oembedRes = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          if (data.thumbnail_url) {
            return NextResponse.json({
              thumbnail_url: data.thumbnail_url,
              source: 'vimeo',
            });
          }
        }
      } catch {
        // Fall through to generic OG fetch
      }
    }

    // 3. Generic — fetch page HTML and parse og:image meta tag
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReapexBot/1.0)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ thumbnail_url: null, error: 'Could not fetch URL' });
    }

    // Only read first 50KB to find meta tags (no need for full page)
    const reader = res.body?.getReader();
    let html = '';
    if (reader) {
      const decoder = new TextDecoder();
      let bytesRead = 0;
      while (bytesRead < 50000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        bytesRead += value.length;
      }
      reader.cancel();
    }

    // Parse og:image
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
    );

    if (ogImageMatch?.[1]) {
      let imageUrl = ogImageMatch[1];
      // Handle relative URLs
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.origin}${imageUrl}`;
      }
      return NextResponse.json({
        thumbnail_url: imageUrl,
        source: 'opengraph',
      });
    }

    // Fallback: try twitter:image
    const twitterImageMatch = html.match(
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i
    );

    if (twitterImageMatch?.[1]) {
      let imageUrl = twitterImageMatch[1];
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.origin}${imageUrl}`;
      }
      return NextResponse.json({
        thumbnail_url: imageUrl,
        source: 'twitter',
      });
    }

    return NextResponse.json({ thumbnail_url: null });
  } catch (error: any) {
    console.error('OG image fetch error:', error.message);
    return NextResponse.json({ thumbnail_url: null });
  }
}
