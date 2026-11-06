import { memo, useEffect, useMemo, useRef } from 'react';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function ZoomableImageComponent({
  uri,
  width,
  height,
  onZoomedChange,
}: {
  uri: string;
  width: number;
  height: number;
  onZoomedChange?: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const pageW = useSharedValue(width);
  const pageH = useSharedValue(height);
  const announced = useSharedValue(false);
  const onZoomedChangeRef = useRef(onZoomedChange);
  onZoomedChangeRef.current = onZoomedChange;

  const notify = useRef((zoomed: boolean) => {
    onZoomedChangeRef.current?.(zoomed);
  }).current;

  useEffect(() => {
    pageW.value = width;
    pageH.value = height;
  }, [width, height, pageW, pageH]);

  const gesture = useMemo(() => {
    const reset = () => {
      'worklet';
      scale.value = withTiming(1);
      savedScale.value = 1;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedX.value = 0;
      savedY.value = 0;
      if (announced.value) {
        announced.value = false;
        runOnJS(notify)(false);
      }
    };

    const pinch = Gesture.Pinch()
      .onBegin(() => {
        savedScale.value = scale.value;
        savedX.value = translateX.value;
        savedY.value = translateY.value;
      })
      .onUpdate((event) => {
        const next = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
        const ratio = next / Math.max(savedScale.value, 0.01);
        const centerX = pageW.value / 2;
        const centerY = pageH.value / 2;
        translateX.value = savedX.value * ratio + (event.focalX - centerX) * (1 - ratio);
        translateY.value = savedY.value * ratio + (event.focalY - centerY) * (1 - ratio);
        scale.value = next;
        if (next > 1.01 && !announced.value) {
          announced.value = true;
          runOnJS(notify)(true);
        }
      })
      .onEnd(() => {
        if (scale.value <= 1.02) {
          reset();
          return;
        }
        savedScale.value = scale.value;
        savedX.value = translateX.value;
        savedY.value = translateY.value;
      });

    const pan = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .manualActivation(true)
      .onTouchesDown((_event, state) => {
        if (scale.value <= 1.01) state.fail();
      })
      .onTouchesMove((_event, state) => {
        if (scale.value > 1.01) state.activate();
        else state.fail();
      })
      .onUpdate((event) => {
        if (scale.value <= 1) return;
        const limitX = ((scale.value - 1) * pageW.value) / 2;
        const limitY = ((scale.value - 1) * pageH.value) / 2;
        translateX.value = clamp(savedX.value + event.translationX, -limitX, limitX);
        translateY.value = clamp(savedY.value + event.translationY, -limitY, limitY);
      })
      .onEnd(() => {
        savedX.value = translateX.value;
        savedY.value = translateY.value;
      });

    return Gesture.Simultaneous(pinch, pan);
  }, [announced, notify, pageH, pageW, savedScale, savedX, savedY, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!uri || width < 1 || height < 1) return null;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View renderToHardwareTextureAndroid style={[{ width, height }, animatedStyle]}>
        <Image
          source={{ uri }}
          style={{ width, height }}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={uri}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export const ZoomableImage = memo(ZoomableImageComponent);
