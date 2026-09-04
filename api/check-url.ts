export default async function handler(req: any, res: any) {
  // Support both standard Node.js serverless and Edge runtimes on Vercel
  let targetUrl = '';
  if (req.query && req.query.url) {
    targetUrl = req.query.url as string;
  } else if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      targetUrl = parsed.searchParams.get('url') || '';
    } catch {
      // ignore
    }
  }

  if (!targetUrl) {
    if (res && typeof res.status === 'function') {
      return res.status(400).json({ ok: false, errorType: 'invalid_url' });
    }
    return new Response(JSON.stringify({ ok: false, errorType: 'invalid_url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const xFrameOptions = response.headers.get('x-frame-options');
    const csp = response.headers.get('content-security-policy');

    let blocksIframe = false;

    if (xFrameOptions) {
      const xfo = xFrameOptions.toUpperCase();
      if (xfo.includes('DENY') || xfo.includes('SAMEORIGIN')) {
        blocksIframe = true;
      }
    }

    if (csp) {
      const cspLower = csp.toLowerCase();
      if (cspLower.includes('frame-ancestors') && !cspLower.includes('frame-ancestors *')) {
        blocksIframe = true;
      }
    }

    if (!response.ok) {
      const payload = { ok: false, errorType: 'http_error', status: response.status };
      if (res && typeof res.status === 'function') return res.status(200).json(payload);
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (blocksIframe) {
      const payload = { ok: false, errorType: 'x_frame_options' };
      if (res && typeof res.status === 'function') return res.status(200).json(payload);
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = { ok: true };
    if (res && typeof res.status === 'function') return res.status(200).json(payload);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking URL on serverless function:', error);
    const payload = { ok: false, errorType: 'connection_error' };
    if (res && typeof res.status === 'function') return res.status(200).json(payload);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
