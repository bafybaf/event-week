import { useCallback, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '../hooks/use-theme-color';
import { EventLogo, pickEventLogoUri } from './EventLogo';
import { refreshSelectedEvent } from '../src/utils/eventStorage';
import { Fonts } from '../constants/fonts';

type AppTopBarProps = {
  rightExtra?: ReactNode;
};

const roleLabel = (role?: string) => {
  if (role === 'speaker') return 'Konuşmacı';
  if (role === 'organizer') return 'Organizatör';
  if (role === 'admin') return 'Yönetici';
  return 'Katılımcı';
};

export function AppTopBar({ rightExtra }: AppTopBarProps) {
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [eventRaw, userRaw] = await Promise.all([
          AsyncStorage.getItem('selectedEvent'),
          AsyncStorage.getItem('currentUser'),
        ]);
        const cachedEvent = eventRaw ? JSON.parse(eventRaw) : null;
        const user = userRaw ? JSON.parse(userRaw) : null;
        setLogoUri(pickEventLogoUri(cachedEvent));
        const event = await refreshSelectedEvent();
        setLogoUri(pickEventLogoUri(event || cachedEvent));
        const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
        setFullName(name || 'Katılımcı');
        const extras = [user?.title, user?.company, roleLabel(user?.role)].filter(Boolean);
        setSubtitle(extras.join(' · '));
      };
      load();
    }, [])
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.bar, { borderBottomColor: borderColor }]}>
        <View style={styles.left}>
          <EventLogo uri={logoUri} size={40} />
          <View style={styles.identity}>
            <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
              {fullName}
            </Text>
            {!!subtitle && (
              <Text style={[styles.meta, { color: textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.right}>
          {rightExtra}
          <TouchableOpacity
            onPress={() => router.push('/menu' as any)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Menü"
            style={styles.iconBtn}
          >
            <Ionicons name="menu-outline" size={28} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    ...(Platform.OS === 'web'
      ? {}
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 2,
        }),
  },
  bar: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconBtn: {
    padding: 4,
  },
});
