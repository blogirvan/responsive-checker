import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route to check URL health and iframe embeddability
  app.get("/api/check-url", async (req, res) => {
    const targetUrl = req.query.url as string;
    
    if (!targetUrl) {
      res.status(400).json({ ok: false, errorType: 'invalid_url' });
      return;
    }

    try {
      // Use fetch to check headers
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          // Send a generic user agent
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        // We don't want to actually download the whole body if we can avoid it, 
        // but some servers reject HEAD requests or behave differently.
        // We'll use GET but abort it quickly after getting headers to save bandwidth.
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
        if (cspLower.includes('frame-ancestors') && (!cspLower.includes('frame-ancestors *'))) {
          blocksIframe = true;
        }
      }

      if (!response.ok) {
        res.json({ 
          ok: false, 
          errorType: 'http_error', 
          status: response.status 
        });
        return;
      }

      if (blocksIframe) {
        res.json({ 
          ok: false, 
          errorType: 'x_frame_options' 
        });
        return;
      }

      res.json({ ok: true });
    } catch (error) {
      console.error('Error checking URL:', error);
      res.json({ ok: false, errorType: 'connection_error' });
    }
  });

  // API Route to capture screenshot of URL at given device width & height
  app.get("/api/screenshot", async (req, res) => {
    const targetUrl = req.query.url as string;
    const width = Math.min(Math.max(parseInt(req.query.width as string) || 1200, 320), 2560);
    const height = Math.min(Math.max(parseInt(req.query.height as string) || 800, 320), 2560);

    if (!targetUrl) {
      res.status(400).json({ ok: false, error: 'URL target diperlukan' });
      return;
    }

    let formattedUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const thumUrl = `https://image.thum.io/get/width/${width}/crop/${height}/${formattedUrl}`;
      const response = await fetch(thumUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Screenshot service HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="screenshot-${width}x${height}.png"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch (error: any) {
      console.error('Screenshot API error:', error);
      res.status(502).json({ ok: false, error: 'Gagal mengambil screenshot', details: error?.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
