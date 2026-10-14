import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { getMatrixPalette, matrixGlyphsForEvent, type IntroTheme } from '../constants/matrix';

type MatrixRainProps = {
  theme?: IntroTheme;
  eventName?: string;
};

function randomGlyph(glyphs: string) {
  return glyphs[Math.floor(Math.random() * glyphs.length)];
}

export function MatrixRain({ theme = 'filli', eventName }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const palette = getMatrixPalette(theme);
  const glyphs = useMemo(() => matrixGlyphsForEvent(eventName), [eventName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let drops: number[] = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const columns = Math.max(12, Math.floor(width / 16));
      drops = Array.from({ length: columns }, () => Math.random() * -40);
    };

    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      if (time - last < 33) return;
      last = time;
      ctx.fillStyle = palette.rainFade;
      ctx.fillRect(0, 0, width, height);
      ctx.font = '13px ui-monospace, Menlo, Consolas, monospace';
      for (let i = 0; i < drops.length; i += 1) {
        const x = i * 16;
        const y = drops[i] * 16;
        ctx.fillStyle = i % 7 === 0 ? palette.rainHead : palette.rain;
        ctx.fillText(randomGlyph(glyphs), x, y);
        if (y > height && Math.random() > 0.975) drops[i] = 0;
        else drops[i] += 1;
      }
    };

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [palette, glyphs]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </View>
  );
}
