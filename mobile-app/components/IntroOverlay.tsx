import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventLogo } from './EventLogo';
import { MatrixText } from './MatrixText';
import { MatrixPalette } from '../constants/matrix';
import { Fonts } from '../constants/fonts';

type IntroOverlayProps = {
  displayName: string;
  eventName: string;
  progress: number;
  onSkip: () => void;
  logoUrl?: string | null;
};

export function IntroOverlay({ displayName, eventName, progress, onSkip, logoUrl }: IntroOverlayProps) {
  const insets = useSafeAreaInsets();
  const nameText = (displayName || '').trim() || 'Katılımcı';

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['rgba(2,12,22,0.72)', 'rgba(2,12,22,0.38)', 'rgba(2,12,22,0.88)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.topBar, { top: Math.max(insets.top, 12) + 8 }]} pointerEvents="box-none">
        <View />
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn} accessibilityRole="button" accessibilityLabel="Uygulamaya geç">
          <MatrixText text="Atla" delayMs={0} style={styles.skipText} />
        </TouchableOpacity>
      </View>
      <View style={styles.center} pointerEvents="none">
        <View style={styles.logoWrap}>
          <EventLogo uri={logoUrl} width={260} height={110} />
        </View>
        <MatrixText text="Hoş geldiniz" delayMs={40} style={styles.welcome} />
        <MatrixText text={nameText} delayMs={80} style={styles.name} numberOfLines={2} />
        {!!eventName && (
          <MatrixText text={eventName} delayMs={120} style={styles.event} numberOfLines={2} />
        )}
      </View>
      <View style={[styles.progressTrack, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress * 100))}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  skipBtn: {
    backgroundColor: 'rgba(4, 24, 40, 0.55)',
    borderWidth: 1,
    borderColor: MatrixPalette.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  skipText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoWrap: {
    marginBottom: 20,
    alignItems: 'center',
  },
  welcome: {
    fontSize: 16,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  name: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  event: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.92,
  },
  progressTrack: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 36,
    height: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(125, 217, 248, 0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: MatrixPalette.button,
  },
});
