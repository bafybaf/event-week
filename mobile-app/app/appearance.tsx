import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { useThemeColor } from '../hooks/use-theme-color';
import { useTheme } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';

export default function AppearanceScreen() {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const modes: { id: 'light' | 'dark' | 'auto'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'light', label: 'Açık', icon: 'sunny-outline' },
    { id: 'dark', label: 'Karanlık', icon: 'moon-outline' },
    { id: 'auto', label: 'Otomatik', icon: 'phone-portrait-outline' },
  ];

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Tema Ayarları" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon-outline" size={22} color={primaryColor} />
              <View>
                <Text style={[styles.label, { color: textColor }]}>Karanlık mod</Text>
                <Text style={[styles.hint, { color: textSecondary }]}>
                  {theme === 'dark' ? 'Karanlık tema aktif' : 'Açık tema aktif'}
                </Text>
              </View>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={() => toggleTheme()}
              trackColor={{ false: borderColor, true: primaryColor }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: textSecondary }]}>Tema modu</Text>
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          {modes.map((mode, index) => {
            const active = themeMode === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeRow,
                  index < modes.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
                ]}
                onPress={() => setThemeMode(mode.id)}
              >
                <View style={styles.rowLeft}>
                  <Ionicons name={mode.icon} size={20} color={active ? primaryColor : textSecondary} />
                  <Text style={[styles.label, { color: textColor }]}>{mode.label}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={primaryColor} />}
              </TouchableOpacity>
            );
          })}
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
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
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
