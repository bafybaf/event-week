import { View, Text, StyleSheet, Alert, TextInput, BackHandler, ActivityIndicator, Platform, TouchableOpacity, Keyboard, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/services/authService';
import notificationService from '../src/services/notificationService';
import { mapEventFromApi, mapUserFromApi, loadAppLogo } from '../src/utils/eventStorage';
import { apiService } from '../src/services/apiService';
import { clearSession, hasValidSession, isJwtExpired } from '../src/utils/session';
import { EventLogo, pickEventLogoUri } from '../components/EventLogo';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/fonts';

export default function WelcomeScreen() {
  const skipCheckRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [matchedEvent, setMatchedEvent] = useState<any>(null);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [appTitle, setAppTitle] = useState('Event Week');
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
        setMatchedEvent(null);
        skipCheckRef.current = true;
        setLoading(false);
        loadAppLogo().then(setAppLogo);
        apiService.getPublicAppName().then(setAppTitle);
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
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      setMatchedEvent(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const event = await authService.lookupPhoneEvent(digits);
      if (!cancelled) {
        setMatchedEvent(mapEventFromApi(event));
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phoneNumber]);

  useEffect(() => {
    const initializeScreen = async () => {
      const loggedIn = await redirectIfLoggedIn();
      if (loggedIn) return;
      skipCheckRef.current = true;
      setLoading(false);
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
      router.replace('/welcome-intro' as any);
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

  const displayLogo = pickEventLogoUri(matchedEvent) || appLogo;
  const displayName = matchedEvent?.name || appTitle;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12) + 24,
            paddingBottom: Math.max(insets.bottom, 16) + keyboardHeight + 12,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <EventLogo uri={displayLogo} width={220} height={88} />
          </View>
          {displayName ? (
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {displayName}
            </Text>
          ) : null}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Kayıtlı telefon numaranız ile giriş yapın
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.phoneLabel, { color: colors.textSecondary }]}>Telefon Numarası</Text>
          <View style={[styles.phoneInput, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
            <Ionicons name="call" size={20} color={colors.primary} />
            <TextInput
              style={[styles.phoneTextInput, { color: colors.text }]}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              placeholder="5551234567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              autoFocus
              editable={!submitting}
              onSubmitEditing={handlePhoneLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handlePhoneLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#042033" />
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
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  phoneLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    fontWeight: '500',
    marginBottom: 10,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: Fonts.medium,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: '#042033',
  },
});
