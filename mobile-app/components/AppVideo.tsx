import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

type AppVideoProps = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'contain' | 'cover' | 'fill';
  shouldPlay?: boolean;
  isLooping?: boolean;
  nativeControls?: boolean;
  surfaceType?: 'textureView' | 'surfaceView';
  onProgress?: (ratio: number, remainingMs: number) => void;
  onFinish?: () => void;
  onError?: () => void;
};

export function AppVideo({
  uri,
  style,
  contentFit = 'contain',
  shouldPlay = false,
  isLooping = false,
  nativeControls = true,
  surfaceType,
  onProgress,
  onFinish,
  onError,
}: AppVideoProps) {
  const player = useVideoPlayer(uri || null, (next) => {
    next.loop = isLooping;
    next.timeUpdateEventInterval = 0.25;
    if (shouldPlay && uri) next.play();
  });

  useEventListener(player, 'playToEnd', () => {
    onFinish?.();
  });

  useEventListener(player, 'statusChange', (payload: { status?: string }) => {
    if (payload?.status === 'readyToPlay' && shouldPlay) {
      player.play();
    }
    if (payload?.status === 'error') onError?.();
  });

  useEffect(() => {
    if (!shouldPlay || !uri) return;
    const start = setTimeout(() => {
      try {
        player.play();
      } catch {
        // Oynatma hazır olunca statusChange tekrar dener
      }
    }, 150);
    return () => clearTimeout(start);
  }, [player, shouldPlay, uri]);

  useEventListener(player, 'timeUpdate', (payload: { currentTime?: number }) => {
    const duration = player.duration || 0;
    const current = payload?.currentTime ?? player.currentTime;
    if (duration > 0) {
      onProgress?.(current / duration, (duration - current) * 1000);
    }
  });

  if (!uri) return null;

  return (
    <VideoView
      player={player}
      style={style}
      contentFit={contentFit}
      nativeControls={nativeControls}
      surfaceType={surfaceType}
    />
  );
}
