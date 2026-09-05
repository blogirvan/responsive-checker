import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  RefreshCw, 
  ExternalLink,
  Search,
  Maximize,
  Settings2,
  RotateCw,
  Loader2,
  Grid3X3,
  Camera,
  AlertCircle,
  X,
  Columns,
  MonitorSmartphone,
  ShieldAlert,
  Globe,
  ServerCrash,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  Pipette,
  Copy,
  Check,
  History,
  ChevronDown,
  Trash2,
  Link2,
  Unlink2,
  HelpCircle,
  Code,
  Download,
  Image as ImageIcon,
  Layers
} from 'lucide-react';
import { DeviceDefinition, DeviceType } from './types';

// Helper to composite website screenshot into an authentic device bezel mockup
async function createMockupImage(imgBlob: Blob, deviceType: DeviceType, isRotated: boolean): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imgBlob);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imgBlob);
        return;
      }

      const imgW = img.width;
      const imgH = img.height;

      const padX = deviceType === 'mobile' ? 20 : deviceType === 'tablet' ? 26 : 32;
      const padY = deviceType === 'mobile' ? 28 : deviceType === 'tablet' ? 32 : 36;
      const bottomExtra = (deviceType === 'laptop' || deviceType === 'desktop') ? 24 : 0;

      canvas.width = imgW + padX * 2;
      canvas.height = imgH + padY * 2 + bottomExtra;

      // Outer bezel body
      ctx.fillStyle = '#18181b';
      const radius = deviceType === 'mobile' ? 40 : deviceType === 'tablet' ? 28 : 16;

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, canvas.width, canvas.height - bottomExtra, radius);
      } else {
        ctx.rect(0, 0, canvas.width, canvas.height - bottomExtra);
      }
      ctx.fill();

      // Outer metallic rim
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw screen content
      ctx.save();
      ctx.beginPath();
      const innerRadius = Math.max(radius - 14, 4);
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(padX, padY, imgW, imgH, innerRadius);
      } else {
        ctx.rect(padX, padY, imgW, imgH);
      }
      ctx.clip();
      ctx.drawImage(img, padX, padY, imgW, imgH);
      ctx.restore();

      // Mobile dynamic island
      if (deviceType === 'mobile' && !isRotated) {
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        const islandW = Math.min(imgW * 0.28, 90);
        const islandH = 18;
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect((canvas.width - islandW) / 2, padY + 8, islandW, islandH, islandH / 2);
        } else {
          ctx.rect((canvas.width - islandW) / 2, padY + 8, islandW, islandH);
        }
        ctx.fill();
      }

      // Laptop / Desktop base
      if (deviceType === 'laptop' || deviceType === 'desktop') {
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        const baseW = canvas.width - 24;
        const baseX = 12;
        const baseY = canvas.height - bottomExtra - 2;
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(baseX, baseY, baseW, bottomExtra + 2, [0, 0, 10, 10]);
        } else {
          ctx.rect(baseX, baseY, baseW, bottomExtra + 2);
        }
        ctx.fill();

        // Notch in laptop base
        ctx.fillStyle = '#52525b';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(canvas.width / 2 - 30, baseY, 60, 5, [0, 0, 4, 4]);
        } else {
          ctx.rect(canvas.width / 2 - 30, baseY, 60, 5);
        }
        ctx.fill();
      }

      canvas.toBlob((blob) => {
        resolve(blob || imgBlob);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(imgBlob);
    };
    img.src = objectUrl;
  });
}

function hexToRgb(hex: string) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  return { r, g, b };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

const DEVICES: DeviceDefinition[] = [
  { id: 'mobile', name: 'Mobile', width: 375, height: 812, icon: Smartphone },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024, icon: Tablet },
  { id: 'laptop', name: 'Laptop', width: 1024, height: 768, icon: Laptop },
  { id: 'desktop', name: 'Desktop', width: 1440, height: 900, icon: Monitor },
  { id: 'responsive', name: 'Responsive', width: '100%', height: '100%', icon: Maximize },
  { id: 'custom', name: 'Custom', width: 800, height: 600, icon: Settings2 },
];

export default function App() {
  const [url, setUrl] = useState('https://example.com');
  const [inputUrl, setInputUrl] = useState('https://example.com');
  const [key, setKey] = useState(0); 
  const [showGrid, setShowGrid] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [showCorsWarning, setShowCorsWarning] = useState(false);
  const [showBezel, setShowBezel] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [urlStatus, setUrlStatus] = useState<{ ok: boolean, errorType?: string, status?: number } | null>(null);
  
  const [pickedColor, setPickedColor] = useState<{hex: string, rgb: string, hsl: string} | null>(null);
  const [isEyedropperSupported, setIsEyedropperSupported] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  useEffect(() => {
    if ('EyeDropper' in window) {
      setIsEyedropperSupported(true);
    }
  }, []);

  const handlePickColor = async () => {
    if (!('EyeDropper' in window)) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex;
      const { r, g, b } = hexToRgb(hex);
      const { h, s, l } = rgbToHsl(r, g, b);
      
      setPickedColor({
        hex: hex.toUpperCase(),
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${h}, ${s}%, ${l}%)`
      });
    } catch (e) {
      // User cancelled
    }
  };

  const handleCopyColor = (format: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  useEffect(() => {
    async function checkUrl() {
      try {
        const res = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`);
        const contentType = res.headers.get('content-type') || '';
        
        // If the backend endpoint is not found or returned HTML (e.g. on Vercel static fallback)
        if (!res.ok && !contentType.includes('application/json')) {
          console.warn('Endpoint /api/check-url tidak tersedia (hosting statis/Vercel tanpa backend). Mengizinkan iframe memuat langsung.');
          setUrlStatus({ ok: true });
          return;
        }

        const data = await res.json();
        setUrlStatus(data);
      } catch (err) {
        // Jika fetch gagal (misal koneksi atau hosting statis murni), jangan blokir iframe dengan Connection Error
        console.warn('Gagal memverifikasi URL via API, memuat iframe langsung:', err);
        setUrlStatus({ ok: true });
      }
    }
    checkUrl();
  }, [url, key]);

  // Pane 1 State
  const [activeDevice, setActiveDevice] = useState<DeviceType>('laptop');
  const [customWidth, setCustomWidth] = useState<number>(800);
  const [customHeight, setCustomHeight] = useState<number>(600);
  const [isRotated, setIsRotated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [responsiveWidth, setResponsiveWidth] = useState<number | '100%'>('100%');
  const containerRef = useRef<HTMLDivElement>(null);

  // Pane 2 State
  const [activeDevice2, setActiveDevice2] = useState<DeviceType>('mobile');
  const [customWidth2, setCustomWidth2] = useState<number>(375);
  const [customHeight2, setCustomHeight2] = useState<number>(812);
  const [isRotated2, setIsRotated2] = useState(false);
  const [isLoading2, setIsLoading2] = useState(true);
  const [isCapturing2, setIsCapturing2] = useState(false);
  const [zoom2, setZoom2] = useState(100);
  const [responsiveWidth2, setResponsiveWidth2] = useState<number | '100%'>('100%');
  const containerRef2 = useRef<HTMLDivElement>(null);

  // Split View & Sync Scroll State
  const [isSyncScroll, setIsSyncScroll] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('syncScroll');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });
  const [showSyncInfoModal, setShowSyncInfoModal] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Screenshot Management State
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotPane, setScreenshotPane] = useState<1 | 2>(1);
  const [screenshotMode, setScreenshotMode] = useState<'device' | 'tab'>('device');
  const [includeBezelMockup, setIncludeBezelMockup] = useState(false);
  const [screenshotResult, setScreenshotResult] = useState<{
    url: string;
    blob: Blob;
    width: number;
    height: number;
    deviceName: string;
    sizeKb: number;
  } | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [copiedScreenshot, setCopiedScreenshot] = useState(false);

  const iframeRef1 = useRef<HTMLIFrameElement>(null);
  const iframeRef2 = useRef<HTMLIFrameElement>(null);
  const paneContainerRef1 = useRef<HTMLDivElement>(null);
  const paneContainerRef2 = useRef<HTMLDivElement>(null);
  const isSyncScrollRef = useRef(isSyncScroll);
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    isSyncScrollRef.current = isSyncScroll;
    try {
      localStorage.setItem('syncScroll', JSON.stringify(isSyncScroll));
    } catch (e) {}
  }, [isSyncScroll]);

  // Synchronize scroll events between iframes via postMessage and DOM access
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (!isSyncScrollRef.current) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      const scrollEventTypes = ['IFRAME_SCROLL', 'SCROLL', 'sync-scroll', 'scroll', 'PAGE_SCROLL'];
      if (scrollEventTypes.includes(data.type)) {
        // Determine whether message came from iframe 1 or iframe 2
        let sourcePane: 1 | 2 = 1;
        if (event.source === iframeRef2.current?.contentWindow || data.sourcePane === 2 || data.pane === 2) {
          sourcePane = 2;
        } else if (event.source === iframeRef1.current?.contentWindow || data.sourcePane === 1 || data.pane === 1) {
          sourcePane = 1;
        }

        const targetPane = sourcePane === 1 ? 2 : 1;
        const targetIframe = targetPane === 2 ? iframeRef2.current : iframeRef1.current;
        if (!targetIframe || !targetIframe.contentWindow) return;

        // 1. Forward postMessage to the target iframe
        targetIframe.contentWindow.postMessage({
          type: 'SCROLL_TO',
          sourcePane: sourcePane,
          scrollY: data.scrollY ?? data.y ?? 0,
          scrollX: data.scrollX ?? data.x ?? 0,
          scrollPercentY: data.scrollPercentY ?? data.percentY ?? (typeof data.percent === 'number' ? data.percent : undefined),
          scrollPercentX: data.scrollPercentX ?? data.percentX ?? 0
        }, '*');

        // 2. Direct same-origin fallback if target iframe allows access
        try {
          const targetDoc = targetIframe.contentDocument;
          const targetWin = targetIframe.contentWindow;
          if (targetDoc && targetWin) {
            isProgrammaticScroll.current = true;
            const maxScroll = (targetDoc.documentElement.scrollHeight || targetDoc.body.scrollHeight) - targetWin.innerHeight;
            let targetY = data.scrollY ?? data.y ?? 0;
            if (typeof data.scrollPercentY === 'number' && maxScroll > 0) {
              targetY = data.scrollPercentY * maxScroll;
            }
            targetWin.scrollTo({ top: targetY, behavior: 'instant' as any });
            setTimeout(() => {
              isProgrammaticScroll.current = false;
            }, 60);
          }
        } catch (e) {
          // Cross-origin iframe
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  const handleIframeLoaded = (paneNumber: 1 | 2) => {
    if (paneNumber === 1) setIsLoading(false);
    else setIsLoading2(false);

    const targetIframe = paneNumber === 1 ? iframeRef1.current : iframeRef2.current;
    if (!targetIframe) return;

    try {
      const doc = targetIframe.contentDocument;
      const win = targetIframe.contentWindow;
      if (doc && win) {
        // Same-origin access permitted: attach scroll listener and postMessage to parent
        win.addEventListener('scroll', () => {
          if (!isSyncScrollRef.current || isProgrammaticScroll.current) return;
          const maxScrollY = (doc.documentElement.scrollHeight || doc.body.scrollHeight) - win.innerHeight;
          const percentY = maxScrollY > 0 ? win.scrollY / maxScrollY : 0;
          win.parent.postMessage({
            type: 'IFRAME_SCROLL',
            sourcePane: paneNumber,
            scrollY: win.scrollY,
            scrollX: win.scrollX,
            scrollPercentY: percentY
          }, '*');
        }, { passive: true });

        // Listen for incoming SCROLL_TO from parent/other iframe
        win.addEventListener('message', (event) => {
          if (!event.data || typeof event.data !== 'object') return;
          if (event.data.type === 'SCROLL_TO' && event.data.sourcePane !== paneNumber) {
            isProgrammaticScroll.current = true;
            const maxScrollY = (doc.documentElement.scrollHeight || doc.body.scrollHeight) - win.innerHeight;
            let targetY = event.data.scrollY || 0;
            if (typeof event.data.scrollPercentY === 'number' && maxScrollY > 0) {
              targetY = event.data.scrollPercentY * maxScrollY;
            }
            win.scrollTo({ top: targetY, left: event.data.scrollX || 0, behavior: 'instant' as any });
            setTimeout(() => {
              isProgrammaticScroll.current = false;
            }, 60);
          }
        });
      }
    } catch (e) {
      // Cross-origin iframe (handled via postMessage listener)
    }
  };

  const handleContainerScroll = (sourcePane: 1 | 2) => {
    if (!isSplit || !isSyncScrollRef.current || isProgrammaticScroll.current) return;
    const source = sourcePane === 1 ? paneContainerRef1.current : paneContainerRef2.current;
    const target = sourcePane === 1 ? paneContainerRef2.current : paneContainerRef1.current;
    if (!source || !target) return;

    const maxScrollSourceY = source.scrollHeight - source.clientHeight;
    const maxScrollTargetY = target.scrollHeight - target.clientHeight;
    const percentY = maxScrollSourceY > 0 ? source.scrollTop / maxScrollSourceY : 0;

    const maxScrollSourceX = source.scrollWidth - source.clientWidth;
    const maxScrollTargetX = target.scrollWidth - target.clientWidth;
    const percentX = maxScrollSourceX > 0 ? source.scrollLeft / maxScrollSourceX : 0;

    isProgrammaticScroll.current = true;
    if (maxScrollTargetY > 0) target.scrollTop = percentY * maxScrollTargetY;
    if (maxScrollTargetX > 0) target.scrollLeft = percentX * maxScrollTargetX;
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 50);
  };

  const handleCopySyncSnippet = () => {
    const snippet = `// Sync Scroll Helper Script
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.parent.postMessage({
    type: 'IFRAME_SCROLL',
    scrollY: window.scrollY,
    scrollPercentY: max > 0 ? window.scrollY / max : 0
  }, '*');
}, { passive: true });

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SCROLL_TO') {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = typeof e.data.scrollPercentY === 'number' && max > 0
      ? e.data.scrollPercentY * max
      : (e.data.scrollY || 0);
    window.scrollTo({ top: targetY, behavior: 'instant' });
  }
});`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentUrls');
      if (stored) {
        setRecentUrls(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRecentDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentUrl = (newUrl: string) => {
    setRecentUrls(prev => {
      const updated = [newUrl, ...prev.filter(u => u !== newUrl)].slice(0, 10);
      try {
        localStorage.setItem('recentUrls', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const removeRecentUrl = (targetUrl: string) => {
    setRecentUrls(prev => {
      const updated = prev.filter(u => u !== targetUrl);
      try {
        localStorage.setItem('recentUrls', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const clearRecentUrls = () => {
    setRecentUrls([]);
    try {
      localStorage.removeItem('recentUrls');
    } catch (e) {}
    setShowRecentDropdown(false);
  };

  const handleGo = (e?: React.FormEvent) => {
    e?.preventDefault();
    let finalUrl = inputUrl.trim();
    if (!finalUrl) return;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
      setInputUrl(finalUrl);
    }
    
    setShowRecentDropdown(false);
    saveRecentUrl(finalUrl);
    
    if (finalUrl !== url) {
      setIsLoading(true);
      setIsLoading2(true);
      setUrl(finalUrl);
    } else {
      handleRefresh();
    }
  };

  const loadRecentUrl = (recentUrl: string) => {
    setInputUrl(recentUrl);
    setShowRecentDropdown(false);
    saveRecentUrl(recentUrl);
    
    if (recentUrl !== url) {
      setIsLoading(true);
      setIsLoading2(true);
      setUrl(recentUrl);
    } else {
      handleRefresh();
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setIsLoading2(true);
    setKey(prev => prev + 1);
  };

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getDeviceDimensions = (pane: 1 | 2) => {
    const activeDev = pane === 1 ? activeDevice : activeDevice2;
    const isRot = pane === 1 ? isRotated : isRotated2;
    const cWidth = pane === 1 ? customWidth : customWidth2;
    const cHeight = pane === 1 ? customHeight : customHeight2;
    const resW = pane === 1 ? responsiveWidth : responsiveWidth2;

    let targetW = 1024;
    let targetH = 800;
    let devName = 'Responsive';

    if (activeDev === 'custom') {
      targetW = isRot ? cHeight : cWidth;
      targetH = isRot ? cWidth : cHeight;
      devName = `Custom (${targetW}×${targetH})`;
    } else if (activeDev === 'responsive') {
      targetW = typeof resW === 'number' ? resW : 1024;
      targetH = 800;
      devName = `Responsive (${targetW}px)`;
    } else {
      const dev = DEVICES.find(d => d.id === activeDev) || DEVICES[2];
      const baseW = typeof dev.width === 'number' ? dev.width : 1024;
      const baseH = typeof dev.height === 'number' ? dev.height : 768;
      targetW = isRot ? baseH : baseW;
      targetH = isRot ? baseW : baseH;
      devName = dev.name;
    }

    return { targetW, targetH, devName, activeDev, isRot };
  };

  const handleOpenScreenshotModal = (pane: 1 | 2) => {
    setScreenshotPane(pane);
    setShowScreenshotModal(true);
    setScreenshotError(null);
    setScreenshotResult(null);

    // Otomatis pakai mode 'device' dan sync bezel
    const useBezel = showBezel;
    setIncludeBezelMockup(useBezel);

    // Langsung mulai proses pengambilan tangkapan layar
    executeScreenshot(pane, screenshotMode, useBezel);
  };

  const executeScreenshot = async (
    pane: 1 | 2,
    mode: 'device' | 'tab' = screenshotMode,
    withBezel: boolean = includeBezelMockup
  ) => {
    if (pane === 1) setIsCapturing(true);
    else setIsCapturing2(true);

    setScreenshotError(null);
    setCopiedScreenshot(false);

    const { targetW, targetH, devName, activeDev, isRot } = getDeviceDimensions(pane);

    try {
      let finalBlob: Blob | null = null;

      if (mode === 'tab') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Peramban ini tidak mendukung Screen Capture API.');
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser' } as any,
          audio: false,
        });

        const track = stream.getVideoTracks()[0];
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        track.stop();
        stream.getTracks().forEach(t => t.stop());

        finalBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
        if (!finalBlob) throw new Error('Gagal mengekstrak gambar dari peramban.');
      } else {
        // Mode Device Viewport Capture
        let cleanUrl = url.trim();
        if (!/^https?:\/\//i.test(cleanUrl)) {
          cleanUrl = `https://${cleanUrl}`;
        }

        const isLocal = cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1');
        if (isLocal) {
          throw new Error('Website lokal (localhost) tidak dapat diakses server luar. Silakan beralih ke tab opsi "Tangkap Layar Tab Browser" di atas.');
        }

        // Coba endpoint backend /api/screenshot terlebih dahulu
        try {
          const apiRes = await fetch(`/api/screenshot?url=${encodeURIComponent(cleanUrl)}&width=${targetW}&height=${targetH}`);
          if (apiRes.ok && apiRes.headers.get('content-type')?.includes('image')) {
            finalBlob = await apiRes.blob();
          }
        } catch (apiErr) {
          console.warn('Backend screenshot endpoint tidak merespons, mencoba direct fallback:', apiErr);
        }

        // Fallback langsung ke service jika backend tidak tersedia
        if (!finalBlob) {
          const directThumUrl = `https://image.thum.io/get/width/${targetW}/crop/${targetH}/${cleanUrl}`;
          const directRes = await fetch(directThumUrl);
          if (directRes.ok) {
            finalBlob = await directRes.blob();
          } else {
            throw new Error('Layanan tangkapan layar tidak dapat menjangkau website ini. Silakan coba mode "Tangkap Layar Tab Browser".');
          }
        }
      }

      // Jika opsi mockup bezel aktif pada mode device
      if (withBezel && finalBlob && mode === 'device') {
        finalBlob = await createMockupImage(finalBlob, activeDev, isRot);
      }

      if (!finalBlob) {
        throw new Error('Gagal menghasilkan file gambar.');
      }

      const objectUrl = URL.createObjectURL(finalBlob);
      const sizeKb = Math.round(finalBlob.size / 1024);

      setScreenshotResult({
        url: objectUrl,
        blob: finalBlob,
        width: targetW,
        height: targetH,
        deviceName: devName,
        sizeKb,
      });

      // Otomatis unduh file hasil screenshot
      const safeDevName = devName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `responsive-cek-${safeDevName}-${targetW}x${targetH}-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = objectUrl;
      link.click();
    } catch (err: any) {
      console.error('Screenshot error:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setScreenshotError('Pengambilan tangkapan layar dibatalkan.');
      } else {
        setScreenshotError(err?.message || 'Gagal mengambil tangkapan layar.');
      }
    } finally {
      if (pane === 1) setIsCapturing(false);
      else setIsCapturing2(false);
    }
  };

  const downloadScreenshotResult = () => {
    if (!screenshotResult) return;
    const safeDevName = screenshotResult.deviceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `responsive-cek-${safeDevName}-${screenshotResult.width}x${screenshotResult.height}-${Date.now()}.png`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = screenshotResult.url;
    link.click();
  };

  const copyScreenshotToClipboard = async () => {
    if (!screenshotResult || !navigator.clipboard) return;
    try {
      if (window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [screenshotResult.blob.type || 'image/png']: screenshotResult.blob })
        ]);
        setCopiedScreenshot(true);
        setTimeout(() => setCopiedScreenshot(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy screenshot to clipboard:', err);
    }
  };

  const handleFitZoom = (pane: 1 | 2) => {
    const ref = pane === 1 ? containerRef : containerRef2;
    const activeDev = pane === 1 ? activeDevice : activeDevice2;
    const isRot = pane === 1 ? isRotated : isRotated2;
    const cWidth = pane === 1 ? customWidth : customWidth2;
    const cHeight = pane === 1 ? customHeight : customHeight2;
    const resWidth = pane === 1 ? responsiveWidth : responsiveWidth2;

    let targetW = 1024;
    if (activeDev === 'custom') {
      targetW = isRot ? cHeight : cWidth;
    } else if (activeDev === 'responsive') {
      targetW = typeof resWidth === 'number' ? resWidth : 1024;
    } else {
      const dev = DEVICES.find(d => d.id === activeDev);
      if (dev && typeof dev.width === 'number') {
        targetW = isRot && typeof dev.height === 'number' ? dev.height : dev.width;
      }
    }

    const previewContainer = ref.current?.closest('.preview-pane-container');
    if (previewContainer) {
      const availableWidth = previewContainer.clientWidth - 48;
      if (availableWidth > 0 && targetW > 0) {
        const calculatedZoom = Math.min(100, Math.max(25, Math.floor((availableWidth / targetW) * 100)));
        if (pane === 1) setZoom(calculatedZoom);
        else setZoom2(calculatedZoom);
      }
    } else {
      const availableWidth = window.innerWidth - 64;
      if (availableWidth > 0 && targetW > 0) {
        const calculatedZoom = Math.min(100, Math.max(25, Math.floor((availableWidth / targetW) * 100)));
        if (pane === 1) setZoom(calculatedZoom);
        else setZoom2(calculatedZoom);
      }
    }
  };

  const renderDeviceControls = (
    activeDev: DeviceType, setActiveDev: any,
    cWidth: number, setCWidth: any,
    cHeight: number, setCHeight: any,
    isRot: boolean, setIsRot: any,
    zoomVal: number, setZoomVal: any,
    onFit?: () => void
  ) => (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <div className="flex items-center gap-0.5 sm:gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors shrink-0">
        {DEVICES.map(device => {
          const Icon = device.icon;
          const isActive = activeDev === device.id;
          return (
            <button
              key={device.id}
              onClick={() => { setActiveDev(device.id); setIsRot(false); }}
              title={device.name}
              className={`p-1.5 sm:p-2 rounded-md transition-all ${
                isActive 
                  ? 'bg-white dark:bg-neutral-800 shadow-xs text-black dark:text-white border border-neutral-200/80 dark:border-neutral-700 font-medium' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      {activeDev === 'custom' && (
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors shrink-0">
          <input 
            type="number" 
            min="200"
            max="3840"
            value={cWidth}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setCWidth(isNaN(val) ? 800 : Math.min(val, 3840));
            }}
            className="w-13 sm:w-14 bg-white dark:bg-neutral-800 px-1 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded outline-none focus:border-black dark:focus:border-white text-center dark:text-white transition-colors"
            placeholder="W"
            title="Lebar (px)"
          />
          <span className="text-neutral-400 text-xs font-medium">×</span>
          <input 
            type="number" 
            min="200"
            max="3840"
            value={cHeight}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setCHeight(isNaN(val) ? 600 : Math.min(val, 3840));
            }}
            className="w-13 sm:w-14 bg-white dark:bg-neutral-800 px-1 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded outline-none focus:border-black dark:focus:border-white text-center dark:text-white transition-colors"
            placeholder="H"
            title="Tinggi (px)"
          />
        </div>
      )}

      <button 
        onClick={() => {
          if (activeDev === 'custom') {
            setCWidth(cHeight);
            setCHeight(cWidth);
          } else {
            setIsRot(!isRot);
          }
        }}
        disabled={activeDev === 'responsive'}
        className="p-1.5 sm:p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white rounded-lg transition-colors disabled:opacity-30 shrink-0"
        title="Rotasi Orientasi (Landscape / Portrait)"
      >
        <RotateCw size={16} className={isRot ? "rotate-90 transition-transform" : "transition-transform"} />
      </button>

      <div className="flex items-center gap-1 sm:gap-1.5 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors shrink-0">
        <button 
          onClick={() => setZoomVal((prev: number) => Math.max(25, prev - 10))}
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          title="Perkecil Zoom"
        >
          <ZoomOut size={14} />
        </button>
        <input 
          type="range" 
          min="25" 
          max="200" 
          step="5"
          value={zoomVal}
          onChange={(e) => setZoomVal(Number(e.target.value))}
          className="w-14 sm:w-18 md:w-20 accent-black dark:accent-white h-1 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
          title="Zoom preview"
        />
        <button 
          onClick={() => setZoomVal((prev: number) => Math.min(200, prev + 10))}
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          title="Perbesar Zoom"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setZoomVal(100)}
          className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white px-1 py-0.5 rounded transition-colors"
          title="Reset ke 100%"
        >
          {zoomVal}%
        </button>
        {onFit && (
          <button
            onClick={onFit}
            className="text-[10px] font-semibold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 rounded transition-colors"
            title="Paskan dengan layar (Fit)"
          >
            Fit
          </button>
        )}
      </div>
    </div>
  );

  const renderWithBezel = (device: DeviceType, isRot: boolean, content: React.ReactNode) => {
    if (!showBezel || device === 'responsive' || device === 'custom') {
      return content;
    }

    if (device === 'mobile') {
      return (
        <div className="bg-neutral-900 dark:bg-black p-3 md:p-4 rounded-[2.5rem] relative shadow-[0_0_0_2px_#e5e7eb,0_25px_50px_-12px_rgba(0,0,0,0.5)] dark:shadow-[0_0_0_2px_#3f3f46,0_25px_50px_-12px_rgba(0,0,0,0.8)] shrink-0 transition-all">
          <div className={`absolute ${isRot ? 'left-3 top-1/2 -translate-y-1/2 w-5 h-24 rounded-r-2xl' : 'top-3 left-1/2 -translate-x-1/2 h-5 w-24 rounded-b-2xl'} bg-black dark:bg-neutral-900 z-40 transition-colors`}></div>
          {content}
        </div>
      );
    }
    
    if (device === 'tablet') {
      return (
        <div className="bg-neutral-900 dark:bg-black p-5 md:p-6 rounded-[2rem] relative shadow-2xl ring-1 ring-neutral-200 dark:ring-neutral-700 shrink-0 transition-all">
           <div className={`absolute ${isRot ? 'left-3 top-1/2 -translate-y-1/2' : 'top-3 left-1/2 -translate-x-1/2'} w-2 h-2 rounded-full bg-neutral-700 dark:bg-neutral-800`}></div>
           {content}
        </div>
      );
    }
    
    if (device === 'laptop') {
      return (
        <div className="flex flex-col items-center shrink-0 drop-shadow-2xl">
          <div className="bg-neutral-900 dark:bg-black p-2 md:p-3 pb-4 rounded-t-xl md:rounded-t-2xl relative transition-colors">
             <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neutral-700 dark:bg-neutral-800"></div>
             {content}
             <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-neutral-500 font-bold tracking-widest">LAPTOP</div>
          </div>
          <div className="w-[110%] h-4 md:h-6 bg-neutral-300 dark:bg-neutral-800 rounded-b-xl md:rounded-b-2xl relative shadow-md flex justify-center border-t border-neutral-400 dark:border-neutral-700 transition-colors">
            <div className="w-1/5 h-1.5 md:h-2 bg-neutral-400 dark:bg-neutral-600 rounded-b-md"></div>
          </div>
        </div>
      );
    }
    
    if (device === 'desktop') {
      return (
        <div className="flex flex-col items-center drop-shadow-2xl shrink-0">
          <div className="bg-neutral-900 dark:bg-black p-3 md:p-4 pb-12 md:pb-16 rounded-xl relative overflow-hidden ring-1 ring-neutral-800 dark:ring-neutral-700 transition-colors">
             <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neutral-700 dark:bg-neutral-800"></div>
             <div className="absolute bottom-0 left-0 right-0 h-10 md:h-12 bg-neutral-200 dark:bg-neutral-900 border-t border-neutral-300 dark:border-neutral-800 flex items-center justify-center transition-colors">
                <div className="w-8 h-8 rounded-full border-4 border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800"></div>
             </div>
             <div className="relative z-10">{content}</div>
          </div>
          <div className="w-24 md:w-32 h-16 md:h-20 bg-gradient-to-b from-neutral-300 to-neutral-400 dark:from-neutral-800 dark:to-neutral-900 border-x border-neutral-400 dark:border-neutral-700" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}></div>
          <div className="w-36 md:w-48 h-2 bg-neutral-400 dark:bg-neutral-700 rounded-t-full"></div>
        </div>
      );
    }

    return content;
  };

  const renderPreviewPane = (
    pane: 1 | 2,
    activeDev: DeviceType,
    cWidth: number,
    cHeight: number,
    isRot: boolean,
    loading: boolean,
    setLoading: any,
    zoomVal: number,
    resWidth: number | '100%',
    setResWidth: any,
    ref: React.RefObject<HTMLDivElement>
  ) => {
    let currentDevice = DEVICES.find(d => d.id === activeDev) || DEVICES[2];
    if (activeDev === 'custom') {
      currentDevice = { ...currentDevice, width: cWidth, height: cHeight };
    } else if (activeDev === 'responsive') {
      currentDevice = { ...currentDevice, width: resWidth, height: '100%' };
    } else if (isRot && currentDevice.width !== '100%') {
      currentDevice = { 
        ...currentDevice, 
        width: currentDevice.height, 
        height: currentDevice.width 
      };
    }

    const iframeContainerStyles = {
      width: currentDevice.width === '100%' ? '100%' : `${currentDevice.width}px`,
      height: currentDevice.height === '100%' ? '100%' : `${currentDevice.height}px`,
      transition: 'width 0.3s ease, height 0.3s ease',
    };

    const hasError = urlStatus && !urlStatus.ok;
    const isCustomOrResponsive = activeDev === 'responsive' || activeDev === 'custom';

    const renderErrorState = () => {
      if (!urlStatus) return null;
      let icon = <Globe className="w-12 h-12 text-neutral-400 mb-4" />;
      let title = "Failed to load";
      let desc = "The requested URL could not be displayed.";

      if (urlStatus.errorType === 'x_frame_options') {
        icon = <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />;
        title = "Embedding Blocked";
        desc = "This website restricts being displayed in an iframe (X-Frame-Options or CSP).";
      } else if (urlStatus.errorType === 'connection_error' || urlStatus.errorType === 'invalid_url') {
        icon = <Globe className="w-12 h-12 text-neutral-400 mb-4" />;
        title = "Connection Error";
        desc = "Could not reach the server. Check the URL or your internet connection.";
      } else if (urlStatus.errorType === 'http_error') {
        icon = <ServerCrash className="w-12 h-12 text-orange-500 mb-4" />;
        title = `HTTP Error ${urlStatus.status || ''}`;
        desc = "The server returned an error response.";
      }

      return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-6 text-center transition-colors">
          {icon}
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">{title}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">{desc}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button 
              onClick={() => setUrlStatus({ ok: true })}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm font-medium rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <span>Tetap Coba Muat Iframe</span>
            </button>
            <button 
              onClick={openInNewTab}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <span>Buka di Tab Baru</span>
              <ExternalLink size={15} />
            </button>
          </div>
        </div>
      );
    };

    const innerContent = (
      <div ref={ref} className={`relative overflow-hidden bg-white dark:bg-black shrink-0 transition-colors ${
        showBezel && !isCustomOrResponsive ? '' : 'shadow-2xl rounded-lg ring-1 ring-black/5 dark:ring-white/10'
      } ${showBezel && activeDev === 'mobile' ? 'rounded-[1.75rem]' : ''} ${showBezel && activeDev === 'tablet' ? 'rounded-lg' : ''} ${showBezel && (activeDev === 'laptop' || activeDev === 'desktop') ? 'rounded-sm' : ''}`} style={iframeContainerStyles}>
        {showGrid && (
          <div 
            className="absolute inset-0 z-30 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(236, 72, 153, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(236, 72, 153, 0.3) 1px, transparent 1px),
                linear-gradient(to right, rgba(236, 72, 153, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(236, 72, 153, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
            }}
          />
        )}
        {loading && !hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm transition-colors">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-2" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Loading preview...</span>
          </div>
        )}
        {hasError && renderErrorState()}
        {!hasError && (
          <iframe
            ref={pane === 1 ? iframeRef1 : iframeRef2}
            key={key}
            src={url}
            onLoad={() => handleIframeLoaded(pane)}
            title={`Preview Pane ${pane}`}
            className={`w-full h-full border-none bg-white dark:bg-black transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        )}
      </div>
    );

    const MIN_W = 320;
    const MAX_W = 1920;
    const BREAKPOINTS = [
      { name: 'Mobile', value: 375 },
      { name: 'Tablet', value: 768 },
      { name: 'Laptop', value: 1024 },
      { name: 'Desktop', value: 1440 }
    ];

    const currentResWidth = resWidth === '100%' ? 1024 : resWidth;

    return (
      <div 
        ref={pane === 1 ? paneContainerRef1 : paneContainerRef2}
        onScroll={() => handleContainerScroll(pane)}
        className={`preview-pane-container flex-1 overflow-auto flex flex-col items-center p-3 sm:p-6 relative w-full ${activeDev === 'responsive' ? 'pt-2 sm:pt-4' : 'pt-4 sm:pt-8'}`}
      >
        {/* Device Info Badge */}
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <div className="bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-300 text-xs px-3 py-1 rounded-full font-mono border border-neutral-200 dark:border-neutral-800 shadow-xs backdrop-blur-sm flex items-center gap-2">
            <span className="font-semibold text-black dark:text-white">{currentDevice.name}</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span>{currentDevice.width === '100%' ? (resWidth === '100%' ? 'Responsive (100%)' : `${resWidth}px`) : `${currentDevice.width} × ${currentDevice.height}`}</span>
            {zoomVal !== 100 && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="text-neutral-500">{zoomVal}%</span>
              </>
            )}
          </div>
        </div>

        {/* Responsive Mode Breakpoint Scrubber */}
        {activeDev === 'responsive' && (
          <div className="w-full max-w-3xl shrink-0 flex flex-col gap-2.5 z-30 mb-5 bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs transition-colors">
            {/* Quick Breakpoint Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Presets</span>
              <div className="flex flex-wrap items-center gap-1">
                {BREAKPOINTS.map(bp => (
                  <button
                    key={bp.name}
                    onClick={() => setResWidth(bp.value)}
                    className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${
                      resWidth === bp.value
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {bp.name} <span className="opacity-70 font-mono">({bp.value})</span>
                  </button>
                ))}
                <button
                  onClick={() => setResWidth('100%')}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                    resWidth === '100%'
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  Full Width
                </button>
              </div>
            </div>

            {/* Range Scrubber Row */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">{MIN_W}px</span>
              
              <div className="relative flex-1 h-6 flex items-center">
                <input
                  type="range"
                  min={MIN_W}
                  max={MAX_W}
                  value={currentResWidth}
                  onChange={(e) => setResWidth(Number(e.target.value))}
                  className="w-full accent-black dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full cursor-ew-resize appearance-none"
                />
              </div>

              <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">{MAX_W}px</span>
              
              <div className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 min-w-[64px] text-center shrink-0">
                {resWidth === '100%' ? '100%' : `${resWidth}px`}
              </div>
            </div>
          </div>
        )}

        {/* Viewport Canvas */}
        <div className="flex-1 w-full flex items-start justify-center">
          <div 
            className={`flex justify-center transition-transform duration-200 ${activeDev === 'responsive' ? 'w-full h-full' : ''}`}
            style={{ transform: `scale(${zoomVal / 100})`, transformOrigin: 'top center' }}
          >
            {renderWithBezel(activeDev, isRot, innerContent)}
          </div>
        </div>
        
        {pane === 1 && !isSplit && (
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-4 max-w-md text-center shrink-0">
            Beberapa situs membatasi penyematan iframe melalui header keamanan (X-Frame-Options / CSP).
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'}`}>
      {/* Header Controls */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-2.5 shadow-xs z-20 shrink-0 transition-colors">
        
        {/* Top Header Row: Brand + Primary Actions */}
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-xs">
              <Monitor size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base tracking-tight text-black dark:text-white leading-tight">Responsive Cek</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 hidden sm:inline leading-none">Multi-Device Viewport Tester</span>
            </div>
          </div>

          {/* Quick Utility Tools */}
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={handlePickColor}
              disabled={!isEyedropperSupported}
              className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white rounded-lg transition-colors disabled:opacity-40"
              title={isEyedropperSupported ? "Ambil warna dari halaman (Eyedropper)" : "Eyedropper tidak didukung di peramban ini"}
            >
              <Pipette size={17} />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white rounded-lg transition-colors"
              title={isDarkMode ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button 
              onClick={() => setIsSplit(!isSplit)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isSplit ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              title="Split View (Bandingkan 2 perangkat)"
            >
              <Columns size={17} />
            </button>
            <button 
              onClick={handleRefresh}
              className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white rounded-lg transition-colors"
              title="Muat ulang halaman"
            >
              <RefreshCw size={17} />
            </button>
            <button 
              onClick={openInNewTab}
              className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white rounded-lg transition-colors"
              title="Buka URL di tab baru"
            >
              <ExternalLink size={17} />
            </button>
          </div>
        </div>

        {/* Second Row: URL Form & Device Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 w-full">
          {/* URL Input Form */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <form 
              onSubmit={handleGo}
              className="flex items-center bg-neutral-100 dark:bg-neutral-950 rounded-lg sm:rounded-full border border-neutral-300 dark:border-neutral-700 overflow-hidden focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all shadow-xs"
            >
              <div className="pl-3 sm:pl-4 text-neutral-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Masukkan URL website (contoh: wikipedia.org)"
                className="flex-1 bg-transparent px-2.5 sm:px-3 py-1.5 sm:py-2 outline-none text-xs sm:text-sm w-full text-neutral-900 dark:text-neutral-100"
              />
              {recentUrls.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                  className={`px-2 py-1 sm:py-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 ${showRecentDropdown ? 'text-black dark:text-white font-semibold' : ''}`}
                  title="Riwayat URL yang pernah dibuka"
                >
                  <History size={15} />
                  <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 rounded-full px-1.5 py-0.2 font-mono">
                    {recentUrls.length}
                  </span>
                </button>
              )}
              <button 
                type="submit"
                className="bg-black dark:bg-white text-white dark:text-black px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Cek
              </button>
            </form>
            
            {/* Recent URLs Dropdown */}
            {showRecentDropdown && recentUrls.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-w-full">
                <div className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                  <span>Riwayat Kunjungan</span>
                  <button
                    onClick={clearRecentUrls}
                    className="text-[10px] text-red-500 hover:text-red-700 dark:hover:text-red-400 font-normal hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Hapus Semua
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto py-1 divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {recentUrls.map((rUrl, idx) => (
                    <div
                      key={idx}
                      className="w-full px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors flex items-center justify-between gap-2 group text-neutral-700 dark:text-neutral-300"
                    >
                      <button
                        onClick={() => loadRecentUrl(rUrl)}
                        className="flex-1 flex items-center gap-2 text-left truncate cursor-pointer"
                      >
                        <Globe size={13} className="text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors shrink-0" />
                        <span className="truncate font-mono">{rUrl}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentUrl(rUrl);
                        }}
                        className="p-1 text-neutral-400 hover:text-red-500 rounded transition-colors"
                        title="Hapus dari riwayat"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary View Controls (When NOT in Split View) */}
          {!isSplit && (
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 shrink-0">
              {renderDeviceControls(
                activeDevice, setActiveDevice,
                customWidth, setCustomWidth,
                customHeight, setCustomHeight,
                isRotated, setIsRotated,
                zoom, setZoom,
                () => handleFitZoom(1)
              )}
              
              <div className="flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-800 pl-2 shrink-0">
                <button 
                  onClick={() => handleOpenScreenshotModal(1)}
                  disabled={isCapturing}
                  className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  title="Ambil tangkapan layar perangkat"
                >
                  {isCapturing ? <Loader2 size={16} className="animate-spin text-emerald-600" /> : <Camera size={16} />}
                </button>
                <button 
                  onClick={() => setShowBezel(!showBezel)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${showBezel ? 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                  title="Bingkai perangkat (Bezel)"
                >
                  <MonitorSmartphone size={16} />
                </button>
                <button 
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${showGrid ? 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                  title="Grid overlay bantuan"
                >
                  <Grid3X3 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Split View Secondary Control Row */}
        {isSplit && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full bg-neutral-50 dark:bg-neutral-950 p-2 sm:p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top-1 transition-colors">
            {/* View 1 Controls */}
            <div className="flex-1 flex flex-wrap items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded shrink-0">
                  Tampilan 1
                </span>
                <button 
                  onClick={() => handleOpenScreenshotModal(1)}
                  disabled={isCapturing}
                  className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
                  title="Tangkapan layar Tampilan 1"
                >
                  {isCapturing ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <Camera size={14} />}
                </button>
              </div>
              {renderDeviceControls(
                activeDevice, setActiveDevice,
                customWidth, setCustomWidth,
                customHeight, setCustomHeight,
                isRotated, setIsRotated,
                zoom, setZoom,
                () => handleFitZoom(1)
              )}
            </div>

            {/* Sync Scroll Toggle Between Views */}
            <div className="flex items-center justify-between sm:justify-center gap-2 py-1.5 lg:py-0 border-t lg:border-t-0 lg:border-x border-neutral-200 dark:border-neutral-800 lg:px-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsSyncScroll(!isSyncScroll)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                  isSyncScroll
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                }`}
                title={isSyncScroll ? "Sync Scroll Aktif: Scroll kedua iframe disinkronkan lewat postMessage" : "Sync Scroll Nonaktif: Klik untuk menyinkronkan"}
              >
                {isSyncScroll ? <Link2 size={14} className="text-white" /> : <Unlink2 size={14} />}
                <span>Sync Scroll</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isSyncScroll ? 'bg-white/20 text-white' : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                }`}>
                  {isSyncScroll ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowSyncInfoModal(true)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 rounded-lg transition-colors cursor-pointer"
                title="Petunjuk & Kode Integrasi postMessage Sync Scroll"
              >
                <HelpCircle size={15} />
              </button>
            </div>

            {/* View 2 Controls */}
            <div className="flex-1 flex flex-wrap items-center justify-between sm:justify-start gap-2 border-t lg:border-t-0 pt-2 lg:pt-0 border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded shrink-0">
                  Tampilan 2
                </span>
                <button 
                  onClick={() => handleOpenScreenshotModal(2)}
                  disabled={isCapturing2}
                  className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
                  title="Tangkapan layar Tampilan 2"
                >
                  {isCapturing2 ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <Camera size={14} />}
                </button>
              </div>
              {renderDeviceControls(
                activeDevice2, setActiveDevice2,
                customWidth2, setCustomWidth2,
                customHeight2, setCustomHeight2,
                isRotated2, setIsRotated2,
                zoom2, setZoom2,
                () => handleFitZoom(2)
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Stage */}
      <div className="flex-1 relative overflow-hidden">
        <main className="w-full h-full flex flex-col lg:flex-row bg-neutral-100 dark:bg-neutral-950 transition-colors overflow-hidden">
          {renderPreviewPane(1, activeDevice, customWidth, customHeight, isRotated, isLoading, setIsLoading, zoom, responsiveWidth, setResponsiveWidth, containerRef)}
          
          {isSplit && (
            <>
              <div className="w-full h-px lg:w-px lg:h-full bg-neutral-300 dark:border-neutral-800 shadow-xs z-10 shrink-0"></div>
              {renderPreviewPane(2, activeDevice2, customWidth2, customHeight2, isRotated2, isLoading2, setIsLoading2, zoom2, responsiveWidth2, setResponsiveWidth2, containerRef2)}
            </>
          )}
        </main>

        {/* Color Picker Result Floating Panel */}
        {pickedColor && (
          <div className="fixed sm:absolute bottom-4 right-4 left-4 sm:left-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl p-4 z-50 animate-in slide-in-from-bottom-4 fade-in max-w-sm sm:w-80 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Pipette size={16} className="text-neutral-500" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Warna Terpilih</h3>
              </div>
              <button 
                onClick={() => setPickedColor(null)} 
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex gap-3 mb-3 items-center bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <div 
                className="w-12 h-12 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-inner shrink-0"
                style={{ backgroundColor: pickedColor.hex }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Nilai HEX</span>
                <span className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 truncate">{pickedColor.hex}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {[
                { label: 'HEX', value: pickedColor.hex },
                { label: 'RGB', value: pickedColor.rgb },
                { label: 'HSL', value: pickedColor.hsl }
              ].map(format => (
                <div key={format.label} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-100 dark:border-neutral-800 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 w-8">{format.label}</span>
                    <span className="text-xs font-mono text-neutral-800 dark:text-neutral-200 truncate">{format.value}</span>
                  </div>
                  <button 
                    onClick={() => handleCopyColor(format.label, format.value)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors text-neutral-500 dark:text-neutral-400 shrink-0 ml-2"
                    title={`Salin nilai ${format.label}`}
                  >
                    {copiedFormat === format.label ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Scroll Info Modal */}
        {showSyncInfoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl animate-in zoom-in-95 text-neutral-900 dark:text-neutral-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Link2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Sinkronisasi Scroll (Sync Scroll)</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Protokol postMessage dua arah antar-iframe</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSyncInfoModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-md"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <p>
                  Fitur <strong>Sync Scroll</strong> menyinkronkan posisi scroll kedua tampilan saat salah satu digulir dengan mengukur persentase dan offset scroll secara presisi.
                </p>

                <div className="bg-neutral-100 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-500" />
                    <span>Otomatis untuk Domain Sama / Localhost</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Jika website berada di domain yang sama atau mengizinkan akses dokumen, listener scroll dan sinkronisasi aktif otomatis tanpa konfigurasi tambahan.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <Code size={14} className="text-blue-500" />
                      <span>Script postMessage untuk Website Anda</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySyncSnippet}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {copiedSnippet ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Salin Script</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-neutral-950 text-neutral-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto border border-neutral-800 leading-normal">
{`// Pasang di web Anda untuk sync scroll
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.parent.postMessage({
    type: 'IFRAME_SCROLL',
    scrollY: window.scrollY,
    scrollPercentY: max > 0 ? window.scrollY / max : 0
  }, '*');
}, { passive: true });

window.addEventListener('message', (e) => {
  if (e.data?.type === 'SCROLL_TO') {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = typeof e.data.scrollPercentY === 'number' && max > 0
      ? e.data.scrollPercentY * max
      : (e.data.scrollY || 0);
    window.scrollTo({ top: targetY, behavior: 'instant' });
  }
});`}
                  </pre>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSyncInfoModal(false)}
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Responsive Screenshot Modal */}
        {showScreenshotModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl animate-in zoom-in-95 text-neutral-900 dark:text-neutral-100 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Camera size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">Tangkapan Layar Resolusi Perangkat</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {isSplit ? `Tampilan ${screenshotPane} • ` : ''}
                      {getDeviceDimensions(screenshotPane).devName} ({getDeviceDimensions(screenshotPane).targetW} × {getDeviceDimensions(screenshotPane).targetH} px)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScreenshotModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-md transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mode Switcher & Settings */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 shrink-0">
                <div className="flex items-center gap-1 bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotMode('device');
                      executeScreenshot(screenshotPane, 'device', includeBezelMockup);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      screenshotMode === 'device'
                        ? 'bg-white dark:bg-neutral-900 text-black dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Resolusi Perangkat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotMode('tab');
                      executeScreenshot(screenshotPane, 'tab', false);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      screenshotMode === 'tab'
                        ? 'bg-white dark:bg-neutral-900 text-black dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Tangkap Layar Tab (Localhost)
                  </button>
                </div>

                {screenshotMode === 'device' && (
                  <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeBezelMockup}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeBezelMockup(checked);
                        executeScreenshot(screenshotPane, 'device', checked);
                      }}
                      className="rounded border-neutral-300 text-black focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Bingkai Mockup (Bezel)</span>
                  </label>
                )}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                {/* Loading State */}
                {(isCapturing || isCapturing2) && (
                  <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center space-y-3 min-h-[220px]">
                    <Loader2 size={32} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-semibold text-sm">Mengambil Tangkapan Layar...</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Memproses resolusi {getDeviceDimensions(screenshotPane).targetW} × {getDeviceDimensions(screenshotPane).targetH} px
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {!isCapturing && !isCapturing2 && screenshotError && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex items-start gap-2 text-red-700 dark:text-red-300 font-semibold">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{screenshotError}</span>
                    </div>
                    {screenshotMode === 'device' && (
                      <div className="pt-2 border-t border-red-200/60 dark:border-red-900/60 flex items-center justify-between gap-2">
                        <span className="text-red-600 dark:text-red-400 text-[11px]">
                          Jika website berjalan di localhost/port lokal, gunakan mode tangkap tab.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotMode('tab');
                            executeScreenshot(screenshotPane, 'tab', false);
                          }}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium shrink-0 cursor-pointer"
                        >
                          Coba Tangkap Tab
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Result Preview */}
                {!isCapturing && !isCapturing2 && screenshotResult && (
                  <div className="space-y-3">
                    <div className="relative group bg-neutral-100 dark:bg-neutral-950 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center overflow-hidden max-h-[340px]">
                      <img
                        src={screenshotResult.url}
                        alt="Hasil screenshot responsive"
                        className="max-h-[320px] max-w-full object-contain rounded shadow-md"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-400">PNG</span>
                        <span>•</span>
                        <span>{screenshotResult.width} × {screenshotResult.height} px</span>
                        <span>•</span>
                        <span>{screenshotResult.sizeKb} KB</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 p-2.5 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>File tangkapan layar otomatis terunduh ke perangkat Anda.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => executeScreenshot(screenshotPane, screenshotMode, includeBezelMockup)}
                    disabled={isCapturing || isCapturing2}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isCapturing || isCapturing2 ? 'animate-spin' : ''} />
                    <span>Ambil Ulang</span>
                  </button>
                  {screenshotResult && (
                    <button
                      type="button"
                      onClick={() => window.open(screenshotResult.url, '_blank')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Buka gambar penuh di tab baru"
                    >
                      <ExternalLink size={13} />
                      <span className="hidden sm:inline">Ukuran Penuh</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {screenshotResult && (
                    <button
                      type="button"
                      onClick={copyScreenshotToClipboard}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      {copiedScreenshot ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Salin Gambar</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={downloadScreenshotResult}
                    disabled={!screenshotResult}
                    className="flex items-center gap-1.5 bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
                  >
                    <Download size={13} />
                    <span>Unduh PNG</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
