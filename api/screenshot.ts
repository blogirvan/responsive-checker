export default async function handler(req: any, res: any) {
  let targetUrl = '';
  let width = 1200;
  let height = 800;
  let delay = 0;

  if (req.query) {
    if (req.query.url) targetUrl = req.query.url as string;
    if (req.query.width) width = parseInt(req.query.width as string) || 1200;
    if (req.query.height) height = parseInt(req.query.height as string) || 800;
    if (req.query.delay) delay = parseInt(req.query.delay as string) || 0;
  } else if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      targetUrl = parsed.searchParams.get('url') || '';
      if (parsed.searchParams.get('width')) width = parseInt(parsed.searchParams.get('width')!) || 1200;
      if (parsed.searchParams.get('height')) height = parseInt(parsed.searchParams.get('height')!) || 800;
      if (parsed.searchParams.get('delay')) delay = parseInt(parsed.searchParams.get('delay')!) || 0;
    } catch {
      // ignore
    }
  }

  width = Math.min(Math.max(width, 320), 2560);
  height = Math.min(Math.max(height, 320), 2560);
  delay = Math.min(Math.max(delay, 0), 10);

  if (!targetUrl) {
    if (res && typeof res.status === 'function') {
      return res.status(400).json({ ok: false, error: 'URL target diperlukan' });
    }
    return new Response(JSON.stringify({ ok: false, error: 'URL target diperlukan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let formattedUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  const isMobile = width < 768;

  try {
    let arrayBuffer: ArrayBuffer | null = null;

    // Strategi 1: Microlink Headless Chrome (Eksekusi JavaScript penuh, support modern SPAs)
    try {
      let microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(formattedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=${width}&viewport.height=${height}&viewport.isMobile=${isMobile}&viewport.hasTouch=${isMobile}`;
      if (delay > 0) {
        microlinkUrl += `&waitForTimeout=${delay * 1000}`;
      }
      const microRes = await fetch(microlinkUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });

      if (microRes.ok && microRes.headers.get('content-type')?.includes('image')) {
        arrayBuffer = await microRes.arrayBuffer();
      }
    } catch (microErr) {
      console.warn('Microlink error, trying fallback:', microErr);
    }

    // Strategi 2: Thum.io dengan parameter wait (Memberi waktu tunggu agar JS website me-render halaman)
    if (!arrayBuffer) {
      const waitTime = Math.max(delay, 3);
      const thumUrl = `https://image.thum.io/get/wait/${waitTime}/noanimate/width/${width}/crop/${height}/${formattedUrl}`;
      const response = await fetch(thumUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });

      if (response.ok) {
        arrayBuffer = await response.arrayBuffer();
      }
    }

    if (!arrayBuffer) {
      throw new Error('Semua penyedia tangkapan layar gagal mengambil pratinjau website.');
    }

    if (res && typeof res.status === 'function') {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="screenshot-${width}x${height}.png"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(Buffer.from(arrayBuffer));
    }

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="screenshot-${width}x${height}.png"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Screenshot function error:', error);
    const payload = { ok: false, error: 'Gagal mengambil screenshot', details: error?.message };
    if (res && typeof res.status === 'function') {
      return res.status(502).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
