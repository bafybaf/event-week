export const MatrixGreen = {
  bg: '#010A04',
  rain: '#00FF41',
  rainHead: '#D7FFD7',
  rainFade: 'rgba(1, 10, 4, 0.18)',
  text: '#00FF41',
  glow: 'rgba(0, 255, 65, 0.9)',
  glowCss: '0 0 8px #00FF41, 0 0 22px rgba(0,255,65,0.55)',
  button: '#00FF41',
  buttonText: '#021408',
  border: 'rgba(0, 255, 65, 0.45)',
  card: 'rgba(0, 18, 8, 0.86)',
  scrim: 'rgba(1, 10, 4, 0.55)',
  input: '#D7FFD7',
  placeholder: 'rgba(0, 255, 65, 0.35)',
  hero: 'rgba(1, 12, 5, 0.72)',
  field: 'rgba(0, 0, 0, 0.45)',
};

export const MatrixPalette = {
  bg: '#020C16',
  rain: '#2BB6E8',
  rainHead: '#D6F4FF',
  rainFade: 'rgba(2, 12, 22, 0.18)',
  text: '#7DD9F8',
  muted: '#A5E4FA',
  glow: 'rgba(34, 182, 232, 0.95)',
  glowCss: '0 0 8px #2BB6E8, 0 0 22px rgba(34,182,232,0.55)',
  button: '#2BB6E8',
  buttonText: '#042033',
  border: 'rgba(43, 182, 232, 0.42)',
  card: 'rgba(4, 24, 40, 0.84)',
  scrim: 'rgba(2, 12, 22, 0.55)',
  input: '#E8F7FF',
};

export const Brand = {
  primary: MatrixPalette.button,
  primaryDark: '#0E90C8',
  primaryLight: MatrixPalette.text,
  onPrimary: MatrixPalette.buttonText,
  rgb: '43, 182, 232',
};

export type IntroTheme = 'filli' | 'brand';

export function isFilliBoyaEvent(event?: { name?: string } | null) {
  return /filli/i.test(String(event?.name || ''));
}

export function getIntroTheme(event?: { name?: string } | null): IntroTheme {
  return isFilliBoyaEvent(event) ? 'filli' : 'brand';
}

export function getMatrixPalette(theme: IntroTheme = 'brand') {
  return theme === 'filli' ? MatrixGreen : MatrixPalette;
}

export function matrixGlyphsForEvent(eventName?: string | null) {
  const base = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789#$%<>';
  const extra = String(eventName || '')
    .toUpperCase()
    .replace(/[^A-Z0-9ÇĞİÖŞÜ]/g, '');
  return extra ? `${extra}${extra}${extra}${base}` : base;
}
