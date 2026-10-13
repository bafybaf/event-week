import { useCallback, useRef } from 'react';
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

  const fadeThenEnter = useCallback(
    (duration = INTRO_FADE_MS) => {
      if (entered.current || fading.current) return;
      fading.current = true;
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: Math.max(320, Number.isFinite(duration) ? duration : INTRO_FADE_MS),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) enterApp();
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
