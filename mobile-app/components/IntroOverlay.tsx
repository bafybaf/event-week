import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventLogo } from './EventLogo';
import { MatrixText } from './MatrixText';
import { getMatrixPalette, type IntroTheme } from '../constants/matrix';
import { Fonts } from '../constants/fonts';

type IntroOverlayProps = {
  displayName: string;
  eventName: string;
  progress: number;
  onSkip: () => void;
  logoUrl?: string | null;
  theme?: IntroTheme;
};

export function IntroOverlay({
  displayName,
  eventName,
  progress,
  onSkip,
  logoUrl,
  theme = 'filli',
}: IntroOverlayProps) {
  const insets = useSafeAreaInsets();
  const palette = getMatrixPalette(theme);
  const tone = theme === 'filli' ? 'green' : 'cyan';
  const nameText = (displayName || '').trim() || 'Katılımcı';
  const scrim = theme === 'filli'
    ? (['rgba(1,10,4,0.72)', 'rgba(1,10,4,0.38)', 'rgba(1,10,4,0.88)'] as const)
    : (['rgba(2,12,22,0.72)', 'rgba(7,20,34,0.42)', 'rgba(7,20,34,0.9)'] as const);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[...scrim]} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { top: Math.max(insets.top, 12) + 8 }]} pointerEvents="box-none">
        <View />
        <TouchableOpacity
          onPress={onSkip}
          style={[styles.skipBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
          accessibilityRole="button"
          accessibilityLabel="Uygulamaya geç"
        >
          <MatrixText text="Atla" tone={tone} delayMs={0} style={styles.skipText} />
        </TouchableOpacity>
      </View>
      <View style={styles.center} pointerEvents="none">
        <View style={styles.logoWrap}>
          <EventLogo uri={logoUrl} width={260} height={110} />
        </View>
        <MatrixText text="Hoş geldiniz" tone={tone} delayMs={40} style={styles.welcome} />
        <MatrixText text={nameText} tone={tone} delayMs={80} style={styles.name} numberOfLines={2} />
        {eventName ? (
          <MatrixText text={eventName} tone={tone} delayMs={120} style={styles.event} numberOfLines={2} />
        ) : null}
      </View>
      <View
        style={[
          styles.progressTrack,
          {
            bottom: Math.max(insets.bottom, 16) + 12,
            backgroundColor: theme === 'filli' ? 'rgba(0, 255, 65, 0.18)' : 'rgba(43, 182, 232, 0.18)',
          },
        ]}
      >
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress * 100))}%`, backgroundColor: palette.button }]} />
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
    borderWidth: 1,
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
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
