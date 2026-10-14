import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { fixFileUrl } from '../src/config/apiConfig';
import { IntroOverlay } from '../components/IntroOverlay';
import { MatrixRain } from '../components/MatrixRain';
import { loadWelcomeIntroState } from '../src/utils/eventStorage';
import { getMatrixPalette, type IntroTheme } from '../constants/matrix';

const INTRO_FADE_MS = 500;
const MATRIX_WELCOME_MS = 4500;

export default function WelcomeIntroScreen() {
  const entered = useRef(false);
  const fading = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRaf = useRef<(() => void) | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [displayName, setDisplayName] = useState('Katılımcı');
  const [eventName, setEventName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [theme, setTheme] = useState<IntroTheme>('brand');
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeMs, setFadeMs] = useState(INTRO_FADE_MS);
  const [ready, setReady] = useState(false);
  const palette = getMatrixPalette(theme);

  const enterApp = useCallback(() => {
    if (entered.current) return;
    entered.current = true;
    router.replace('/(tabs)' as any);
  }, []);

  const fadeThenEnter = useCallback(
    (duration = INTRO_FADE_MS) => {
      if (entered.current || fading.current) return;
      fading.current = true;
      const ms = Math.max(320, Number.isFinite(duration) ? duration : INTRO_FADE_MS);
      setFadeMs(ms);
      setFadeOut(true);
      timeoutRef.current = setTimeout(enterApp, ms);
    },
    [enterApp]
  );

  const onVideoTime = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      const video = event.currentTarget;
      if (!video.duration || video.currentTime < 0.25) return;
      setProgress(video.currentTime / video.duration);
      const remainingMs = (video.duration - video.currentTime) * 1000;
      if (remainingMs <= INTRO_FADE_MS) fadeThenEnter(remainingMs);
    },
    [fadeThenEnter]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopRaf.current?.();
    };
  }, []);

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
      <div
        id="intro-fade-layer"
        style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          opacity: fadeOut ? 0 : 1,
          transition: `opacity ${fadeMs}ms ease-out`,
        }}
      >
        {!videoUrl && <MatrixRain theme={theme} eventName={eventName} />}
        {!!videoUrl && (
          <video
            src={videoUrl}
            autoPlay
            muted
            playsInline
            onTimeUpdate={onVideoTime}
            onEnded={() => fadeThenEnter(INTRO_FADE_MS)}
            onLoadedData={(event) => {
              const video = event.currentTarget;
              stopRaf.current?.();
              let raf = 0;
              let stopped = false;
              const tick = () => {
                if (stopped) return;
                if (video.duration && video.currentTime > 0.2) {
                  const remainingMs = (video.duration - video.currentTime) * 1000;
                  if (remainingMs <= INTRO_FADE_MS) fadeThenEnter(remainingMs);
                }
                raf = requestAnimationFrame(tick);
              };
              raf = requestAnimationFrame(tick);
              stopRaf.current = () => {
                stopped = true;
                cancelAnimationFrame(raf);
              };
              video.muted = true;
              const play = video.play();
              if (play && typeof play.catch === 'function') {
                play.catch(() => {});
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              background: palette.bg,
            }}
          />
        )}
        <IntroOverlay
          displayName={displayName}
          eventName={eventName}
          logoUrl={logoUrl}
          progress={progress}
          theme={theme}
          onSkip={() => fadeThenEnter(360)}
        />
      </div>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
