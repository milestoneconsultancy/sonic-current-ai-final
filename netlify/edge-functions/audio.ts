export default async function handler(request: Request) {
  const url = new URL(request.url);
  const rawTargetUrl = url.searchParams.get('url');
  const isDownload = url.searchParams.get('download') === 'true';
  const filenameParam = url.searchParams.get('filename') || 'song.mp3';

  if (!rawTargetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let targetUrl = rawTargetUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    try {
      targetUrl = atob(rawTargetUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL encoding' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  // Validate host
  try {
    const parsed = new URL(targetUrl);
    const host = parsed.hostname.toLowerCase();
    const isAllowed =
      host.includes('saavncdn.com') ||
      host.includes('jiosaavn.com') ||
      host.includes('jio.com') ||
      host.includes('saavn.com');

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Host not permitted' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid target URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Upstream bitrate fallbacks (_320.mp4 -> _160.mp4 -> _96.mp4 -> _128.mp4)
  const urlsToTry: string[] = [targetUrl];
  if (targetUrl.includes('_320.mp4')) {
    urlsToTry.push(targetUrl.replace('_320.mp4', '_160.mp4'));
    urlsToTry.push(targetUrl.replace('_320.mp4', '_96.mp4'));
    urlsToTry.push(targetUrl.replace('_320.mp4', '_128.mp4'));
  } else if (targetUrl.includes('_160.mp4')) {
    urlsToTry.push(targetUrl.replace('_160.mp4', '_96.mp4'));
  }

  const clientRange = request.headers.get('range');
  let upstreamResponse: Response | null = null;

  for (const tryUrl of urlsToTry) {
    try {
      const fetchHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.jiosaavn.com/',
        'Accept': '*/*',
      };
      if (clientRange && !isDownload) {
        fetchHeaders['Range'] = clientRange;
      }

      const res = await fetch(tryUrl, {
        headers: fetchHeaders,
        redirect: 'follow',
      });

      if (res.ok || res.status === 206) {
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('text/html') && !contentType.includes('application/json')) {
          upstreamResponse = res;
          break;
        }
      }
    } catch {
      // Continue to next URL fallback
    }
  }

  if (!upstreamResponse) {
    return new Response(JSON.stringify({ error: 'Audio source unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const rawContentType = upstreamResponse.headers.get('content-type') || '';
  const contentType =
    rawContentType && (rawContentType.startsWith('audio/') || rawContentType.startsWith('video/'))
      ? rawContentType
      : 'audio/mpeg';

  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', contentType);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
  responseHeaders.set('Accept-Ranges', 'bytes');

  const contentLength = upstreamResponse.headers.get('content-length');
  if (contentLength) responseHeaders.set('Content-Length', contentLength);

  const contentRange = upstreamResponse.headers.get('content-range');
  if (contentRange) responseHeaders.set('Content-Range', contentRange);

  if (isDownload) {
    const cleanFilename = filenameParam.replace(/[^a-zA-Z0-9_\-\.\s]/g, '_');
    responseHeaders.set(
      'Content-Disposition',
      `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
    );
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}
