import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, StyleSheet } from 'react-native';
import { useLayoutEffect, useRef } from 'react';
import { Fonts } from '../../constants/fonts';
import { hasValidSession } from '../../src/utils/session';

function TabGlyph({
  focused,
  color,
  active,
  inactive,
}: {
  focused: boolean;
  color: string;
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.glyph, focused && styles.glyphActive]}>
      <Ionicons name={focused ? active : inactive} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const bottomPad = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 48 : 12;
  const tabBarHeight = 52 + bottomPad;

  useLayoutEffect(() => {
    const checkAuth = async () => {
      if (hasRedirected.current) {
        return;
      }

      if (!(await hasValidSession())) {
        hasRedirected.current = true;
        try {
          router.replace('/');
        } catch {
          // ignore
        }
      }
    };

    checkAuth();
  }, []);

  return (
    <Tabs
      initialRouteName="feed"
      screenOptions={{
        tabBarActiveTintColor: '#2BB6E8',
        tabBarInactiveTintColor: '#7aa3b8',
        tabBarLabelPosition: 'below-icon',
        safeAreaInsets: { bottom: 0 },
        tabBarStyle: {
          backgroundColor: '#071422',
          borderTopColor: '#1A3A50',
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: bottomPad,
          height: Platform.OS === 'web' ? Math.max(74, tabBarHeight) : tabBarHeight,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Fonts.medium,
          fontWeight: '500',
          marginTop: 2,
          lineHeight: 14,
        },
        headerStyle: {
          backgroundColor: '#0D2130',
        },
        headerTintColor: '#f0f9ff',
        headerTitleStyle: {
          fontFamily: Fonts.bold,
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabGlyph focused={focused} color={color} active="home" inactive="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          title: 'Program',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabGlyph focused={focused} color={color} active="calendar" inactive="calendar-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="qr-code"
        options={{
          href: null,
          title: 'QR Kodum',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilim',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabGlyph focused={focused} color={color} active="person" inactive="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  glyph: {
    minWidth: 48,
    height: 24,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphActive: {
    backgroundColor: 'rgba(43, 182, 232, 0.16)',
  },
});
