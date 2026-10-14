import { useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { MatrixGreen, getMatrixPalette, matrixGlyphsForEvent, type IntroTheme } from '../constants/matrix';

type MatrixRainProps = {
  theme?: IntroTheme;
  eventName?: string;
};

function randomGlyph(glyphs: string) {
  return glyphs[Math.floor(Math.random() * glyphs.length)];
}

export function MatrixRain({ theme = 'filli', eventName }: MatrixRainProps) {
  const palette = getMatrixPalette(theme);
  const glyphs = useMemo(() => matrixGlyphsForEvent(eventName), [eventName]);
  const { width, height } = Dimensions.get('window');
  const columns = useMemo(() => Math.min(18, Math.max(10, Math.floor(width / 22))), [width]);
  const rows = useMemo(() => Math.max(12, Math.floor(height / 22)), [height]);
  const [grid, setGrid] = useState(() =>
    Array.from({ length: columns }, () => Array.from({ length: rows }, () => randomGlyph(glyphs)))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setGrid((prev) =>
        prev.map((col) => {
          const next = [randomGlyph(glyphs), ...col.slice(0, -1)];
          return Math.random() > 0.35 ? next : col;
        })
      );
    }, 140);
    return () => clearInterval(id);
  }, [glyphs]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.nativeWrap]}>
      {grid.map((col, x) => (
        <View key={x} style={styles.column}>
          {col.map((char, y) => (
            <Text
              key={`${x}-${y}`}
              style={[
                styles.nativeChar,
                {
                  color: y === 0 ? palette.rainHead : palette.rain,
                  opacity: y === 0 ? 0.95 : Math.max(0.12, 0.72 - y * 0.04),
                },
              ]}
            >
              {char}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nativeWrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
    opacity: 0.22,
  },
  column: {
    alignItems: 'center',
  },
  nativeChar: {
    color: MatrixGreen.rain,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'monospace',
  },
});
