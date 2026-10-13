import { View, Text, StyleSheet, Alert, TextInput, BackHandler, ActivityIndicator, Platform, TouchableOpacity, Keyboard, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/services/authService';
import notificationService from '../src/services/notificationService';
import { mapEventFromApi, mapUserFromApi, loadLoginEvent, loadAppLogo, loadAppIntroVideo } from '../src/utils/eventStorage';
import { clearSession, hasValidSession, isJwtExpired } from '../src/utils/session';
import { EventLogo } from '../components/EventLogo';
import { MatrixRain } from '../components/MatrixRain';
import { MatrixText } from '../components/MatrixText';
import { MatrixPalette } from '../constants/matrix';

export default function WelcomeScreen() {
  const skipCheckRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loginEvent, setLoginEvent] = useState<any>(null);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const redirectIfLoggedIn = async () => {
    if (await hasValidSession()) {
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 200);
      return true;
    }

    const token = await AsyncStorage.getItem('token');
    if (token && isJwtExpired(token)) {
      await clearSession();
    }
    return false;
  };

  useFocusEffect(
    useCallback(() => {
      const checkAndReset = async () => {
        const loggedIn = await redirectIfLoggedIn();
        if (loggedIn) return;

        setPhoneNumber('');
        skipCheckRef.current = true;
        setLoading(false);
        loadLoginEvent().then(setLoginEvent);
        loadAppLogo().then(setAppLogo);
      };

      checkAndReset();
    }, [])
  );

  const formatPhoneNumber = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('90') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  useEffect(() => {
    const initializeScreen = async () => {
      const loggedIn = await redirectIfLoggedIn();
      if (loggedIn) return;
      skipCheckRef.current = true;
      setLoading(false);
      loadLoginEvent().then(setLoginEvent);
      loadAppLogo().then(setAppLogo);
    };

    initializeScreen();

    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      showSub.remove();
      hideSub.remove();
      backHandler.remove();
    };
  }, []);

  const handlePhoneLogin = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numaranızı girin.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      Alert.alert(
        'Geçersiz Telefon Numarası',
        'Lütfen en az 10 haneli geçerli bir telefon numarası girin.\n\nÖrnek: 5551234567'
      );
      return;
    }

    if (cleanPhone.length > 15) {
      Alert.alert(
        'Geçersiz Telefon Numarası',
        'Telefon numarası çok uzun. Lütfen geçerli bir telefon numarası girin.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await authService.validatePhoneUser(cleanPhone);

      if (!response.success) {
        Alert.alert('Giriş Hatası', response.error || 'Giriş yapılamadı.');
        return;
      }

      const user = mapUserFromApi(response.user) || response.user;
      const eventData = mapEventFromApi(response.event || user?.event);

      if (!eventData) {
        Alert.alert('Giriş Hatası', 'Bu numaraya bağlı bir etkinlik bulunamadı.');
        return;
      }

      if (response.token) {
        await AsyncStorage.setItem('token', response.token);
      }
      await AsyncStorage.setItem('selectedEvent', JSON.stringify(eventData));
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      notificationService.registerPushToken().catch(() => {});

      setPhoneNumber('');
      const introVideoUrl = await loadAppIntroVideo();
      if (introVideoUrl) {
        router.replace('/welcome-intro' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.error || 'Giriş yapılırken bir hata oluştu.';

      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
        Alert.alert('Giriş Hatası', 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
        return;
      }

      if (errorMessage.toLowerCase().includes('timeout')) {
        Alert.alert('Giriş Hatası', 'Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.');
        return;
      }

      Alert.alert('Giriş Hatası', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={MatrixPalette.button} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <MatrixRain />
      <View style={styles.scrim} />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
            paddingBottom: Math.max(insets.bottom, 16) + keyboardHeight + 12,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <EventLogo uri={appLogo} width={220} height={88} />
          </View>
          <View style={styles.heroText}>
            <MatrixText
              text={loginEvent?.name || 'Event Week'}
              style={styles.title}
              numberOfLines={2}
            />
            <MatrixText
              text="Kayıtlı telefon numaranız ile giriş yapın"
              delayMs={40}
              style={styles.subtitle}
            />
          </View>
        </View>

        <View style={styles.card}>
          <MatrixText text="Telefon Numarası" delayMs={80} style={styles.phoneLabel} />
          <View style={styles.phoneInput}>
            <Ionicons name="call" size={20} color={MatrixPalette.text} />
            <TextInput
              style={styles.phoneTextInput}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              placeholder="5551234567"
              placeholderTextColor="rgba(125,217,248,0.35)"
              keyboardType="phone-pad"
              autoFocus
              editable={!submitting}
              onSubmitEditing={handlePhoneLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { opacity: submitting ? 0.7 : 1 }]}
            onPress={handlePhoneLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={MatrixPalette.buttonText} />
            ) : (
              <Text style={styles.submitButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MatrixPalette.bg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MatrixPalette.scrim,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoWrap: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  heroText: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 12, 22, 0.72)',
    maxWidth: 520,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.9,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: MatrixPalette.border,
    backgroundColor: MatrixPalette.card,
  },
  phoneLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'left',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MatrixPalette.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: MatrixPalette.input,
    fontFamily: Platform.OS === 'web' ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : 'monospace',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: MatrixPalette.button,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: MatrixPalette.buttonText,
    textShadowRadius: 0,
  },
});
