import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemeColor } from '../hooks/use-theme-color';
import { fixFileUrl } from '../src/config/apiConfig';
import { PdfToolbar } from '../components/PdfToolbar';

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

const loadPdfJs = () => {
  const w = window as any;
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      w.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(w.pdfjsLib);
    };
    script.onerror = () => reject(new Error('PDF motoru yüklenemedi'));
    document.body.appendChild(script);
  });
};

const clampScale = (value: number) =>
  Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(value * 100) / 100));

export default function ProgramViewerScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const rawUrl = Array.isArray(url) ? url[0] : url;
  const pdfUrl = rawUrl ? (fixFileUrl(decodeURIComponent(rawUrl)) || '') : '';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<any>(null);
  const pageWidthRef = useRef(1);
  const busyRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [ready, setReady] = useState(false);

  const renderPages = useCallback(async (nextScale: number) => {
    const pdf = pdfRef.current;
    const host = containerRef.current;
    if (!pdf || !host) return;
    const canvases: HTMLCanvasElement[] = [];
    const dpr = window.devicePixelRatio || 1;
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const pdfPage = await pdf.getPage(i);
      const viewport = pdfPage.getViewport({ scale: nextScale });
      const canvas = document.createElement('canvas');
      canvas.id = `p${i}`;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      canvas.style.display = 'block';
      canvas.style.margin = '16px auto';
      canvas.style.background = '#fff';
      canvas.style.boxShadow = '0 8px 24px rgba(15,23,42,.16)';
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvases.push(canvas);
      await pdfPage.render({ canvasContext: ctx, viewport }).promise;
    }
    host.replaceChildren(...canvases);
  }, []);

  useEffect(() => {
    if (!pdfUrl) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error('PDF alınamadı');
        const data = await response.arrayBuffer();
        const pdfjsLib: any = await loadPdfJs();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        pdfRef.current = pdf;
        const first = await pdf.getPage(1);
        pageWidthRef.current = first.getViewport({ scale: 1 }).width;
        const hostWidth = containerRef.current?.clientWidth || Math.min(window.innerWidth - 32, 960);
        const fitted = clampScale(hostWidth / pageWidthRef.current);
        setPages(pdf.numPages);
        setScale(fitted);
        await renderPages(fitted);
        setReady(true);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'PDF görüntülenemedi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, renderPages]);

  const applyScale = async (next: number) => {
    if (busyRef.current) return;
    const clamped = clampScale(next);
    busyRef.current = true;
    setScale(clamped);
    setBusy(true);
    await renderPages(clamped);
    setBusy(false);
    busyRef.current = false;
  };

  const goPage = (next: number) => {
    const target = Math.min(pages, Math.max(1, next));
    setPage(target);
    document.getElementById(`p${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fitWidth = () => {
    const hostWidth = containerRef.current?.clientWidth || Math.min(window.innerWidth - 32, 960);
    applyScale(hostWidth / pageWidthRef.current);
  };

  const onScroll = () => {
    const host = containerRef.current;
    if (!host) return;
    const canvases = Array.from(host.querySelectorAll('canvas'));
    let current = 1;
    canvases.forEach((canvas, index) => {
      if (canvas.getBoundingClientRect().top < 180) current = index + 1;
    });
    setPage((prev) => (prev === current ? prev : current));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!ready) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') goPage(page + 1);
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') goPage(page - 1);
      if (event.key === '+' || event.key === '=') applyScale(scale + 0.25);
      if (event.key === '-') applyScale(scale - 0.25);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, page, pages, scale]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <PdfToolbar
        title={Array.isArray(title) ? title[0] : title || 'Program'}
        page={page}
        pages={pages}
        scale={scale}
        enabled={ready}
        busy={busy}
        onBack={() => router.back()}
        onPrev={() => goPage(page - 1)}
        onNext={() => goPage(page + 1)}
        onZoomOut={() => applyScale(scale - 0.25)}
        onZoomIn={() => applyScale(scale + 0.25)}
        onFit={fitWidth}
        onDownload={pdfUrl ? () => Linking.openURL(pdfUrl) : undefined}
      />

      {!pdfUrl ? (
        <View style={styles.centered}>
          <Text style={{ color: textColor }}>PDF adresi bulunamadı</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={{ color: textColor, marginTop: 12 }}>PDF yükleniyor...</Text>
            </View>
          )}
          {error && !loading && (
            <View style={styles.centered}>
              <Text style={{ color: textColor, textAlign: 'center' }}>{error}</Text>
            </View>
          )}
          <div ref={containerRef} style={{ width: '100%', minHeight: loading ? 0 : 400 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  centered: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
});
