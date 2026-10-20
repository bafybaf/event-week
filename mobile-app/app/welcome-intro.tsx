import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppVideo } from '../components/AppVideo';
import { fixFileUrl } from '../src/config/apiConfig';
import { IntroOverlay } from '../components/IntroOverlay';
import { MatrixRain } from '../components/MatrixRain';
import { loadWelcomeIntroState } from '../src/utils/eventStorage';
import { INTRO_FADE_MS, useIntroFadeExit } from '../hooks/useIntroFadeExit';
import { getMatrixPalette, type IntroTheme } from '../constants/matrix';

const MATRIX_WELCOME_MS = 4500;

export default function WelcomeIntroScreen() {
  const { contentOpacity, fadeThenEnter, maybeStartEndFade } = useIntroFadeExit();
  const [videoUrl, setVideoUrl] = useState('');
  const [displayName, setDisplayName] = useState('Katılımcı');
  const [eventName, setEventName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [theme, setTheme] = useState<IntroTheme>('brand');
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const progressRef = useRef(0);
  const palette = getMatrixPalette(theme);

  useEffect(() => {
    const load = async () => {
      const state = await loadWelcomeIntroState();
      setDisplayName(state.displayName);
      setEventName(state.eventName);
      setLogoUrl(fixFileUrl(state.logoUrl) || '');
      setVideoUrl(fixFileUrl(state.videoUrl) || '');
      setTheme(state.theme);
      setReady(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!ready || !videoUrl) return;
    const started = Date.now();
    let lastProgress = 0;
    let lastMove = Date.now();
    const timer = setInterval(() => {
      const current = progressRef.current;
      if (current > lastProgress + 0.005) {
        lastProgress = current;
        lastMove = Date.now();
      }
      const stalled = Date.now() - lastMove > 8000;
      const tooLong = Date.now() - started > 45000;
      if (stalled || tooLong) {
        clearInterval(timer);
        fadeThenEnter(360);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [ready, videoUrl, fadeThenEnter]);

  useEffect(() => {
    if (!ready || videoUrl) return;
    const started = Date.now();
    const tick = setInterval(() => {
      const ratio = Math.min(1, (Date.now() - started) / MATRIX_WELCOME_MS);
      setProgress(ratio);
      if (ratio >= 1) {
        clearInterval(tick);
        fadeThenEnter(INTRO_FADE_MS);
      }
    }, 80);
    return () => clearInterval(tick);
  }, [ready, videoUrl, fadeThenEnter]);

  if (!ready) {
    return <View style={[styles.container, { backgroundColor: palette.bg }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <StatusBar style="light" />
      {!!videoUrl && (
        <AppVideo
          uri={videoUrl}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          shouldPlay
          nativeControls={false}
          surfaceType="textureView"
          onProgress={(ratio, remainingMs) => {
            progressRef.current = ratio;
            setProgress(ratio);
            maybeStartEndFade(remainingMs);
          }}
          onFinish={() => fadeThenEnter(INTRO_FADE_MS)}
          onError={() => setVideoUrl('')}
        />
      )}
      <Animated.View nativeID="intro-fade-layer" style={[styles.layer, { opacity: contentOpacity }]}>
        {!videoUrl && <MatrixRain theme={theme} eventName={eventName} />}
        <IntroOverlay
          displayName={displayName}
          eventName={eventName}
          logoUrl={logoUrl}
          progress={progress}
          theme={theme}
          onSkip={() => fadeThenEnter(360)}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layer: {
    flex: 1,
  },
});
