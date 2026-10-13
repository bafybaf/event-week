import { useEffect, useState } from 'react';
import { Platform, Text, type StyleProp, type TextStyle } from 'react-native';
import { MatrixPalette } from '../constants/matrix';

const GLYPHS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%*+<>';

function scrambleText(value: string) {
  return Array.from(value)
    .map((char) => {
      if (char === ' ' || char === '\n') return char;
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    })
    .join('');
}

type MatrixTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  delayMs?: number;
  numberOfLines?: number;
};

export function MatrixText({ text, style, delayMs = 0, numberOfLines }: MatrixTextProps) {
  const [display, setDisplay] = useState(() => scrambleText(text));

  useEffect(() => {
    if (!text) {
      setDisplay('');
      return;
    }

    let frame = 0;
    let started = false;
    const startAt = Date.now() + delayMs;
    const chars = Array.from(text);
    setDisplay(scrambleText(text));

    const id = setInterval(() => {
      if (!started) {
        if (Date.now() < startAt) return;
        started = true;
      }
      frame += 1;
      const revealCount = Math.min(chars.length, frame);
      const next = chars
        .map((char, index) => {
          if (char === ' ' || char === '\n') return char;
          if (index < revealCount) return char;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');
      setDisplay(next);
      if (revealCount >= chars.length && frame > chars.length + 6) {
        setDisplay(text);
        clearInterval(id);
      }
    }, 36);

    return () => clearInterval(id);
  }, [text, delayMs]);

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: MatrixPalette.text,
          fontFamily: Platform.OS === 'web' ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : 'monospace',
          letterSpacing: 0.8,
          textAlign: 'center',
          textShadowColor: MatrixPalette.glow,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 12,
          ...(Platform.OS === 'web'
            ? { textShadow: MatrixPalette.glowCss }
            : {}),
        },
        style,
      ]}
    >
      {display}
    </Text>
  );
}
