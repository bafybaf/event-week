import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { useThemeColor } from '../hooks/use-theme-color';
import { Fonts } from '../constants/fonts';
import notificationService from '../src/services/notificationService';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '../src/utils/notificationPrefs';

const CATEGORIES: { key: keyof NotificationPrefs; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'notifyAnnouncements', label: 'Duyurular', hint: 'Yeni duyurular', icon: 'megaphone-outline' },
  { key: 'notifyProgram', label: 'Program', hint: 'Program güncellemeleri', icon: 'calendar-outline' },
  { key: 'notifyAppointments', label: 'Randevular', hint: 'Randevu bildirimleri', icon: 'people-outline' },
  { key: 'notifySupport', label: 'Destek', hint: 'Destek mesajları', icon: 'chatbubbles-outline' },
  { key: 'notifyVoting', label: 'Oylama', hint: 'Aktif oylamalar', icon: 'thumbs-up-outline' },
  { key: 'notifyDocuments', label: 'Dokümanlar', hint: 'Yeni dokümanlar', icon: 'document-text-outline' },
];

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const nativePush = notificationService.isAvailable();

  useFocusEffect(
    useCallback(() => {
      loadNotificationPrefs().then(setPrefs);
    }, [])
  );

  const updatePref = async (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    const next = await saveNotificationPrefs({ [key]: value });
    setPrefs(next);

    if (key === 'notificationsEnabled') {
      if (value) {
        notificationService.registerPushToken().catch(() => {});
      } else {
        notificationService.unregisterPushToken().catch(() => {});
      }
    }
  };

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Bildirim Ayarları" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={22} color={primaryColor} />
              <View style={styles.rowText}>
                <Text style={[styles.label, { color: textColor }]}>Anlık bildirimler</Text>
                <Text style={[styles.hint, { color: textSecondary }]}>
                  {nativePush
                    ? 'Uygulama kapalıyken de bildirim alın'
                    : 'Anlık bildirimler iOS ve Android uygulamalarında çalışır. Tercihiniz yine de kaydedilir.'}
                </Text>
              </View>
            </View>
            <Switch
              value={prefs.notificationsEnabled}
              onValueChange={(value) => updatePref('notificationsEnabled', value)}
              trackColor={{ false: borderColor, true: primaryColor }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: textSecondary }]}>Bildirim türleri</Text>
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          {CATEGORIES.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.row,
                index < CATEGORIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
              ]}
            >
              <View style={styles.rowLeft}>
                <Ionicons name={item.icon} size={20} color={primaryColor} />
                <View style={styles.rowText}>
                  <Text style={[styles.label, { color: textColor }]}>{item.label}</Text>
                  <Text style={[styles.hint, { color: textSecondary }]}>{item.hint}</Text>
                </View>
              </View>
              <Switch
                value={prefs.notificationsEnabled && prefs[item.key]}
                disabled={!prefs.notificationsEnabled}
                onValueChange={(value) => updatePref(item.key, value)}
                trackColor={{ false: borderColor, true: primaryColor }}
                thumbColor="#ffffff"
              />
            </View>
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  rowText: { flex: 1, minWidth: 0 },
  label: { fontSize: 16, fontFamily: Fonts.semiBold, fontWeight: '600' },
  hint: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
});
