import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { useThemeColor } from '../hooks/use-theme-color';
import { Fonts } from '../constants/fonts';
import { API_BASE_URL } from '../src/config/apiConfig';

export default function SecurityScreen() {
  const [user, setUser] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const inputBackground = useThemeColor({}, 'backgroundSecondary');

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('currentUser').then((raw) => {
        setUser(raw ? JSON.parse(raw) : null);
      });
    }, [])
  );

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      if (!token || token === 'dev') {
        Alert.alert('Hata', 'Şifre değiştirmek için gerçek bir oturum gerekir.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.errors?.[0]?.msg || 'Şifre değiştirilemedi');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Başarılı', 'Şifreniz güncellendi.');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Şifre değiştirilemedi');
    } finally {
      setSaving(false);
    }
  };

  const phone = user?.phoneNumber || user?.phone || '—';
  const email = user?.email || '—';
  const loginLabel = user?.phoneNumber || user?.phone ? 'Telefon numarası' : 'E-posta';

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Güvenlik" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Hesap</Text>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={primaryColor} />
              <View>
                <Text style={[styles.infoLabel, { color: textSecondary }]}>Telefon</Text>
                <Text style={[styles.infoValue, { color: textColor }]}>{phone}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={primaryColor} />
              <View>
                <Text style={[styles.infoLabel, { color: textSecondary }]}>E-posta</Text>
                <Text style={[styles.infoValue, { color: textColor }]}>{email}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="log-in-outline" size={20} color={primaryColor} />
              <View>
                <Text style={[styles.infoLabel, { color: textSecondary }]}>Giriş yöntemi</Text>
                <Text style={[styles.infoValue, { color: textColor }]}>{loginLabel}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Şifre değiştir</Text>
            <Text style={[styles.hint, { color: textSecondary }]}>
              Mevcut şifreniz varsa girin, ardından yeni şifrenizi belirleyin.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor, color: textColor }]}
              placeholder="Mevcut şifre"
              placeholderTextColor={textSecondary}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor, color: textColor }]}
              placeholder="Yeni şifre"
              placeholderTextColor={textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor, color: textColor }]}
              placeholder="Yeni şifre (tekrar)"
              placeholderTextColor={textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: primaryColor, opacity: saving ? 0.7 : 1 }]}
              onPress={changePassword}
              disabled={saving}
            >
              <Text style={styles.buttonText}>{saving ? 'Kaydediliyor...' : 'Şifreyi güncelle'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Gizlilik</Text>
            <Text style={[styles.hint, { color: textSecondary }]}>
              QR kodunuzu başkalarıyla paylaşmayın. Ortak bir cihazda uygulamayı kullandıysanız çıkış yapın.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  infoLabel: { fontSize: 12, fontFamily: Fonts.regular },
  infoValue: { fontSize: 15, fontFamily: Fonts.medium, fontWeight: '500' },
  hint: { fontSize: 13, fontFamily: Fonts.regular, marginBottom: 12, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  button: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    fontSize: 15,
  },
});
