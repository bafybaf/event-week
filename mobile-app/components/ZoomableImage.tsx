import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function ZoomableImage({
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
  const announced = useSharedValue(false);

  const reportZoom = (zoomed: boolean) => {
    onZoomedChange?.(zoomed);
  };

  const reset = () => {
    'worklet';
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedX.value = 0;
    savedY.value = 0;
    announced.value = false;
    runOnJS(reportZoom)(false);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const next = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(next, MIN_SCALE), MAX_SCALE);
      if (scale.value > 1.01 && !announced.value) {
        announced.value = true;
        runOnJS(reportZoom)(true);
      }
    })
    .onEnd(() => {
      if (scale.value <= 1.02) {
        reset();
        return;
      }
      savedScale.value = scale.value;
      runOnJS(reportZoom)(scale.value > 1.01);
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
      translateX.value = savedX.value + event.translationX;
      translateY.value = savedY.value + event.translationY;
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
        runOnJS(reportZoom)(false);
        return;
      }
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const gesture = Gesture.Simultaneous(pinch, pan);

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
      <Animated.View style={[{ width, height }, animatedStyle]}>
        <Image source={{ uri }} style={{ width, height }} contentFit="contain" />
      </Animated.View>
    </GestureDetector>
  );
}
