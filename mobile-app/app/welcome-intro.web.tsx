import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fixFileUrl } from '../src/config/apiConfig';
import { IntroOverlay } from '../components/IntroOverlay';
import { pickEventLogoUri } from '../components/EventLogo';
import { loadAppIntroVideo, refreshSelectedEvent, formatPersonName } from '../src/utils/eventStorage';
import { MatrixGreen } from '../constants/matrix';

const INTRO_FADE_MS = 500;

export default function WelcomeIntroScreen() {
  const entered = useRef(false);
  const fading = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRaf = useRef<(() => void) | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [displayName, setDisplayName] = useState('Katılımcı');
  const [eventName, setEventName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeMs, setFadeMs] = useState(INTRO_FADE_MS);

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
      const eventRaw = await AsyncStorage.getItem('selectedEvent');
      const userRaw = await AsyncStorage.getItem('currentUser');
      const cachedEvent = eventRaw ? JSON.parse(eventRaw) : null;
      const event = (await refreshSelectedEvent()) || cachedEvent;
      const user = userRaw ? JSON.parse(userRaw) : null;
      setDisplayName(formatPersonName(user));
      setEventName(event?.name || '');
      setLogoUrl(fixFileUrl(pickEventLogoUri(event) || '') || '');
      const url = fixFileUrl((await loadAppIntroVideo()) || '') || '';
      if (!url) {
        enterApp();
        return;
      }
      setVideoUrl(url);
    };
    load();
  }, [enterApp]);

  return (
    <View style={styles.container}>
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
              background: MatrixGreen.bg,
            }}
          />
        )}
        <IntroOverlay
          displayName={displayName}
          eventName={eventName}
          logoUrl={logoUrl}
          progress={progress}
          onSkip={() => fadeThenEnter(360)}
        />
      </div>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MatrixGreen.bg,
  },
});
