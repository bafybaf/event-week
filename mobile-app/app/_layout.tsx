import { Stack, useNavigationContainerRef, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useTheme } from '../contexts/ThemeContext';
import notificationService, { getRouteFromNotificationData } from '../src/services/notificationService';
import { poppinsAssets, installPoppinsDefaults } from '../constants/fonts';
import { registerLogoutReset } from '../src/utils/logout';

SplashScreen.preventAutoHideAsync().catch(() => {});

function PushNotificationBootstrap() {
  const router = useRouter();
  const handledResponseRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let receivedSub: any;
    let responseSub: any;
    let cancelled = false;

    const openFromData = async (data: any) => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const route = getRouteFromNotificationData(data);
      if (!route) return;
      router.push({
        pathname: route.pathname as any,
        params: route.params,
      } as any);
    };

    const boot = async () => {
      await notificationService.registerPushToken();
      if (cancelled) return;

      const last = await notificationService.getLastNotificationResponse();
      const lastId = last?.notification?.request?.identifier;
      if (lastId && handledResponseRef.current !== lastId) {
        handledResponseRef.current = lastId;
        await openFromData(last?.notification?.request?.content?.data);
      }

      receivedSub = notificationService.addNotificationListener(() => {});
      responseSub = notificationService.addNotificationResponseListener((response: any) => {
        const id = response?.notification?.request?.identifier;
        if (id && handledResponseRef.current === id) return;
        if (id) handledResponseRef.current = id;
        openFromData(response?.notification?.request?.content?.data);
      });
    };

    boot();

    return () => {
      cancelled = true;
      notificationService.removeNotificationListener(receivedSub);
      notificationService.removeNotificationListener(responseSub);
    };
  }, [router]);

  return null;
}

function StackNavigator() {
  const { theme } = useTheme();

  return (
        <Stack
          screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme === 'dark' ? '#071422' : '#ffffff',
            },
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              title: 'Event Week',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
              animation: 'fade',
              animationDuration: 600,
            }} 
          />
          <Stack.Screen 
            name="auth" 
            options={{ 
              title: 'Giriş',
              headerShown: false 
            }} 
          />
      <Stack.Screen 
        name="welcome-intro" 
        options={{ 
          headerShown: false,
          animation: 'fade',
          animationDuration: 700,
          gestureEnabled: false
        }} 
      />
      <Stack.Screen 
        name="menu" 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="gallery" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="announcements" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="speakers" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="activities" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="flights" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="accommodations" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="documents" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="program-viewer" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="surveys" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="transfers" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="appointments" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="voting" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen
        name="notification-settings"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="security"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="notes" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen
        name="appointment-details"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="quiz"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="support-new"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="support-detail"
        options={{
          headerShown: false
        }}
      />
        </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(poppinsAssets);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    registerLogoutReset(() => {
      if (!navigationRef.isReady()) return;
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'index' }],
      });
    });
  }, [navigationRef]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      installPoppinsDefaults();
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PushNotificationBootstrap />
          <StackNavigator />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ThemeProvider>
  );
}