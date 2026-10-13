import { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppVideo } from '../components/AppVideo';
import { fixFileUrl } from '../src/config/apiConfig';
import { IntroOverlay } from '../components/IntroOverlay';
import { pickEventLogoUri } from '../components/EventLogo';
import { loadAppIntroVideo, refreshSelectedEvent, formatPersonName } from '../src/utils/eventStorage';
import { INTRO_FADE_MS, useIntroFadeExit } from '../hooks/useIntroFadeExit';

export default function WelcomeIntroScreen() {
  const { contentOpacity, fadeThenEnter, enterApp, maybeStartEndFade } = useIntroFadeExit();
  const [videoUrl, setVideoUrl] = useState('');
  const [displayName, setDisplayName] = useState('Katılımcı');
  const [eventName, setEventName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [progress, setProgress] = useState(0);

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
      <Animated.View nativeID="intro-fade-layer" style={[styles.layer, { opacity: contentOpacity }]}>
        {!!videoUrl && (
          <AppVideo
            uri={videoUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            shouldPlay
            nativeControls={false}
            onProgress={(ratio, remainingMs) => {
              setProgress(ratio);
              maybeStartEndFade(remainingMs);
            }}
            onFinish={() => fadeThenEnter(INTRO_FADE_MS)}
            onError={enterApp}
          />
        )}
        <IntroOverlay
          displayName={displayName}
          eventName={eventName}
          logoUrl={logoUrl}
          progress={progress}
          onSkip={() => fadeThenEnter(360)}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020C16',
  },
  layer: {
    flex: 1,
  },
});
