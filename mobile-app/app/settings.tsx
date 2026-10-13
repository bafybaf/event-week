import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { useThemeColor } from '../hooks/use-theme-color';
import { Fonts } from '../constants/fonts';

const ITEMS: { title: string; hint: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { title: 'Profil bilgileri', hint: 'Ad, iletişim ve fotoğraf', icon: 'person-outline', route: '/edit-profile' },
  { title: 'Bildirim ayarları', hint: 'Anlık bildirimleri yönetin', icon: 'notifications-outline', route: '/notification-settings' },
  { title: 'Güvenlik', hint: 'Hesap ve şifre', icon: 'shield-outline', route: '/security' },
  { title: 'Tema ayarları', hint: 'Açık, karanlık veya otomatik', icon: 'color-palette-outline', route: '/appearance' },
];

export default function SettingsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Ayarlar" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          {ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.row,
                index < ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.rowLeft}>
                <Ionicons name={item.icon} size={22} color={primaryColor} />
                <View>
                  <Text style={[styles.label, { color: textColor }]}>{item.title}</Text>
                  <Text style={[styles.hint, { color: textSecondary }]}>{item.hint}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  label: { fontSize: 16, fontFamily: Fonts.semiBold, fontWeight: '600' },
  hint: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
});
