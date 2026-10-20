import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { router } from 'expo-router';

export const INTRO_FADE_MS = 500;

export function useIntroFadeExit() {
  const entered = useRef(false);
  const fading = useRef(false);
  const contentOpacity = useRef(new Animated.Value(1)).current;

  const enterApp = useCallback(() => {
    if (entered.current) return;
    entered.current = true;
    router.replace('/(tabs)' as any);
  }, []);

  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    };
  }, []);

  const fadeThenEnter = useCallback(
    (duration = INTRO_FADE_MS) => {
      if (entered.current || fading.current) return;
      fading.current = true;
      const ms = Math.max(320, Number.isFinite(duration) ? duration : INTRO_FADE_MS);
      fallbackRef.current = setTimeout(() => enterApp(), ms + 500);
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: ms,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        enterApp();
      });
    },
    [enterApp, contentOpacity]
  );

  const maybeStartEndFade = useCallback(
    (remainingMs: number) => {
      if (fading.current || entered.current) return;
      if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
        fadeThenEnter(INTRO_FADE_MS);
        return;
      }
      if (remainingMs <= INTRO_FADE_MS) {
        fadeThenEnter(remainingMs);
      }
    },
    [fadeThenEnter]
  );

  return { contentOpacity, fadeThenEnter, enterApp, maybeStartEndFade };
}
