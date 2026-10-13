import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { MatrixPalette } from '../constants/matrix';

const GLYPHS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789#$%<>';

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      ctx.fillStyle = MatrixPalette.rainFade;
      ctx.fillRect(0, 0, width, height);
      ctx.font = '13px ui-monospace, Menlo, Consolas, monospace';
      for (let i = 0; i < drops.length; i += 1) {
        const x = i * 16;
        const y = drops[i] * 16;
        ctx.fillStyle = i % 7 === 0 ? MatrixPalette.rainHead : MatrixPalette.rain;
        ctx.fillText(randomGlyph(), x, y);
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
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </View>
  );
}
