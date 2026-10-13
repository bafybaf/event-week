import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useThemeColor } from '../hooks/use-theme-color';
import { fixFileUrl } from '../src/config/apiConfig';
import { PdfToolbar } from '../components/PdfToolbar';

const buildViewerHtml = (pdfUrl: string) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=6.0, user-scalable=yes" />
  <style>
    html, body { margin: 0; padding: 0; background: #e2e8f0; height: 100%; font-family: system-ui, sans-serif; }
    #viewer { padding: 8px 0 40px; }
    canvas { display: block; margin: 14px auto; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.18); }
    .error { color: #0f172a; padding: 24px; text-align: center; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
  <div id="viewer"></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const url = ${JSON.stringify(pdfUrl)};
    let pdfDoc = null;
    let scale = 1;
    let pageWidth = 1;
    let currentPage = 1;
    let viewer = document.getElementById('viewer');

    function post(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function clamp(value) {
      return Math.max(0.5, Math.min(3, Math.round(value * 100) / 100));
    }

    async function renderPages() {
      if (!pdfDoc) return;
      const nextViewer = document.createElement('div');
      nextViewer.id = 'viewer';
      const dpr = window.devicePixelRatio || 1;
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: scale });
        const canvas = document.createElement('canvas');
        canvas.id = 'p' + i;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        nextViewer.appendChild(canvas);
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      }
      viewer.replaceWith(nextViewer);
      viewer = nextViewer;
      post({ type: 'ready', pages: pdfDoc.numPages, scale: scale, page: currentPage });
    }

    window.__pdfApi = {
      setScale: function(next) {
        scale = clamp(Number(next) || 1);
        renderPages();
      },
      zoomBy: function(delta) {
        window.__pdfApi.setScale(scale + delta);
      },
      fit: function() {
        window.__pdfApi.setScale((window.innerWidth - 24) / pageWidth);
      },
      goPage: function(n) {
        currentPage = Math.min(pdfDoc.numPages, Math.max(1, Number(n) || 1));
        const el = document.getElementById('p' + currentPage);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        post({ type: 'page', page: currentPage, pages: pdfDoc.numPages, scale: scale });
      }
    };

    window.addEventListener('scroll', function() {
      if (!pdfDoc) return;
      const canvases = viewer.querySelectorAll('canvas');
      let next = 1;
      canvases.forEach(function(canvas, index) {
        if (canvas.getBoundingClientRect().top < 160) next = index + 1;
      });
      if (next !== currentPage) {
        currentPage = next;
        post({ type: 'page', page: currentPage, pages: pdfDoc.numPages, scale: scale });
      }
    });

    pdfjsLib.getDocument({ url: url, withCredentials: false }).promise.then(async function(pdf) {
      pdfDoc = pdf;
      const first = await pdf.getPage(1);
      pageWidth = first.getViewport({ scale: 1 }).width;
      scale = clamp((window.innerWidth - 24) / pageWidth);
      await renderPages();
    }).catch(function() {
      document.body.innerHTML = '<p class="error">PDF yüklenemedi. İnternet bağlantınızı kontrol edin.</p>';
      post({ type: 'error' });
    });
  </script>
</body>
</html>`;

export default function ProgramViewerScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const rawUrl = Array.isArray(url) ? url[0] : url;
  const pdfUrl = rawUrl ? (fixFileUrl(decodeURIComponent(rawUrl)) || '') : '';
  const webviewRef = useRef<WebView>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const html = useMemo(() => (pdfUrl ? buildViewerHtml(pdfUrl) : ''), [pdfUrl]);

  const inject = (code: string) => {
    webviewRef.current?.injectJavaScript(`${code}; true;`);
  };

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready' || data.type === 'page') {
        setReady(true);
        setBusy(false);
        if (data.pages) setPages(data.pages);
        if (data.page) setPage(data.page);
        if (data.scale) setScale(data.scale);
      }
    } catch (error) {
      // ignore malformed messages
    }
  };

  const zoom = (delta: number) => {
    setBusy(true);
    inject(`window.__pdfApi.zoomBy(${delta})`);
  };

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
        onPrev={() => inject(`window.__pdfApi.goPage(${page - 1})`)}
        onNext={() => inject(`window.__pdfApi.goPage(${page + 1})`)}
        onZoomOut={() => zoom(-0.25)}
        onZoomIn={() => zoom(0.25)}
        onFit={() => {
          setBusy(true);
          inject('window.__pdfApi.fit()');
        }}
        onDownload={pdfUrl ? () => Linking.openURL(pdfUrl) : undefined}
      />

      {!pdfUrl ? (
        <View style={styles.centered}>
          <Text style={{ color: textColor }}>PDF adresi bulunamadı</Text>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html }}
          startInLoadingState
          javaScriptEnabled
          setSupportMultipleWindows={false}
          mixedContentMode="always"
          allowFileAccess
          onMessage={onMessage}
          renderLoading={() => (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={primaryColor} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
