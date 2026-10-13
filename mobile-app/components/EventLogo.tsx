import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { fixImageUrl } from '../src/config/apiConfig';
import { Fonts } from '../constants/fonts';

type EventLogoProps = {
  uri?: string | null;
  size?: number;
  width?: number;
  height?: number;
  light?: boolean;
  plain?: boolean;
};

export function pickEventLogoUri(event?: {
  logo?: string | null;
} | null) {
  return event?.logo || null;
}

export function EventLogo({ uri, size = 36, width, height }: EventLogoProps) {
  const src = fixImageUrl(uri || '');
  const [failed, setFailed] = useState(false);
  const boxW = width ?? size;
  const boxH = height ?? size;

  if (src && !failed) {
    return (
      <View
        style={{
          width: boxW,
          height: boxH,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={{ uri: src }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          accessibilityLabel="Etkinlik logosu"
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallback, { width: boxW, height: boxH }]}>
      <Text style={[styles.fallbackText, { fontSize: Math.max(11, Math.min(boxW, boxH) * 0.32) }]}>EW</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  fallbackText: {
    color: '#ffffff',
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
});
