import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  clampCropOffset,
  containRect,
  cropFrameForAspect,
  displayCropToImage,
} from '../utils/cropMath';

type AspectKey = 'original' | '1:1' | '4:5' | '16:9' | '9:16';

const ASPECTS: { key: AspectKey; label: string; value: number | null }[] = [
  { key: 'original', label: 'Orijinal', value: null },
  { key: '1:1', label: '1:1', value: 1 },
  { key: '4:5', label: '4:5', value: 4 / 5 },
  { key: '16:9', label: '16:9', value: 16 / 9 },
  { key: '9:16', label: '9:16', value: 9 / 16 },
];

interface ImageCropperProps {
  visible: boolean;
  uri: string;
  imageWidth: number;
  imageHeight: number;
  onCancel: () => void;
  onDone: (uri: string) => void;
}

export default function ImageCropper({
  visible,
  uri,
  imageWidth,
  imageHeight,
  onCancel,
  onDone,
}: ImageCropperProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [aspectKey, setAspectKey] = useState<AspectKey>('original');
  const [frameOrigin, setFrameOrigin] = useState({ x: 0, y: 0 });
  const [applying, setApplying] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const aspect = ASPECTS.find((item) => item.key === aspectKey)?.value ?? null;
  const display = useMemo(
    () => containRect(imageWidth, imageHeight, box.width, box.height),
    [imageWidth, imageHeight, box]
  );
  const frameSize = useMemo(
    () => cropFrameForAspect(display.width, display.height, aspect),
    [display, aspect]
  );

  useEffect(() => {
    if (!display.width) return;
    setFrameOrigin({
      x: display.x + (display.width - frameSize.width) / 2,
      y: display.y + (display.height - frameSize.height) / 2,
    });
  }, [aspectKey, display.x, display.y, display.width, display.height, frameSize.width, frameSize.height]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => aspectKey !== 'original',
        onMoveShouldSetPanResponder: () => aspectKey !== 'original',
        onPanResponderGrant: () => {
          dragStart.current = frameOrigin;
        },
        onPanResponderMove: (_, gesture) => {
          setFrameOrigin(
            clampCropOffset(
              dragStart.current.x + gesture.dx,
              dragStart.current.y + gesture.dy,
              frameSize.width,
              frameSize.height,
              display.x,
              display.y,
              display.width,
              display.height
            )
          );
        },
      }),
    [aspectKey, display, frameOrigin, frameSize]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  };

  const applyCrop = async () => {
    if (aspectKey === 'original') {
      onDone(uri);
      return;
    }
    try {
      setApplying(true);
      const crop = displayCropToImage({
        frameX: frameOrigin.x,
        frameY: frameOrigin.y,
        frameWidth: frameSize.width,
        frameHeight: frameSize.height,
        displayX: display.x,
        displayY: display.y,
        scale: display.scale,
        imageWidth,
        imageHeight,
      });
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      onDone(result.uri);
    } catch (error) {
      console.error('Crop error:', error);
      onDone(uri);
    } finally {
      setApplying(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.topBtn}>Vazgeç</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Görseli kırp</Text>
          <TouchableOpacity onPress={applyCrop} disabled={applying}>
            <Text style={styles.topBtn}>{applying ? '...' : 'Uygula'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Görselin tamamı görünür. İstersen oranı seçip çerçeveyi kaydır.</Text>
        <View style={styles.stage} onLayout={handleLayout} {...panResponder.panHandlers}>
          {!!uri && (
            <Image
              source={{ uri }}
              style={[
                styles.fullImage,
                {
                  left: display.x,
                  top: display.y,
                  width: display.width,
                  height: display.height,
                },
              ]}
              contentFit="contain"
            />
          )}
          {aspectKey !== 'original' && display.width > 0 && (
            <>
              <View style={[styles.dim, { top: 0, left: 0, right: 0, height: frameOrigin.y }]} />
              <View style={[styles.dim, { top: frameOrigin.y + frameSize.height, left: 0, right: 0, bottom: 0 }]} />
              <View
                style={[
                  styles.dim,
                  { top: frameOrigin.y, left: 0, width: frameOrigin.x, height: frameSize.height },
                ]}
              />
              <View
                style={[
                  styles.dim,
                  {
                    top: frameOrigin.y,
                    left: frameOrigin.x + frameSize.width,
                    right: 0,
                    height: frameSize.height,
                  },
                ]}
              />
              <View
                style={[
                  styles.frame,
                  {
                    left: frameOrigin.x,
                    top: frameOrigin.y,
                    width: frameSize.width,
                    height: frameSize.height,
                  },
                ]}
              />
            </>
          )}
          {applying && (
            <View style={styles.applying}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.aspects}>
          {ASPECTS.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setAspectKey(item.key)}
              style={[styles.aspectBtn, aspectKey === item.key && styles.aspectBtnActive]}
            >
              <Text style={[styles.aspectText, aspectKey === item.key && styles.aspectTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBtn: { color: '#2BB6E8', fontWeight: '700', fontSize: 16 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hint: { color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20, marginBottom: 8 },
  stage: { flex: 1, marginHorizontal: 12, marginBottom: 12, overflow: 'hidden', backgroundColor: '#020617' },
  fullImage: { position: 'absolute' },
  dim: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  frame: { position: 'absolute', borderWidth: 2, borderColor: '#fff' },
  applying: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  aspects: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, gap: 8 },
  aspectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  aspectBtnActive: { backgroundColor: '#2BB6E8', borderColor: '#2BB6E8' },
  aspectText: { color: '#e2e8f0', fontWeight: '600', fontSize: 12 },
  aspectTextActive: { color: '#fff' },
});
