import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { router, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '../../hooks/use-theme-color';
import { logoutAndReset } from '../../src/utils/logout';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Fonts } from '../../constants/fonts';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  password: string;
  isActive: boolean;
}

interface EventUser {
  id: string;
  eventId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: 'participant' | 'speaker' | 'organizer';
  isActive: boolean;
}

export default function MenuScreen() {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [currentUser, setCurrentUser] = useState<EventUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const routerHook = useRouter();
  const hasRedirected = useRef(false);

  // Render'dan önce kontrol et - useLayoutEffect kullan
  useLayoutEffect(() => {
    let mounted = true;
    
    const checkAuthSync = async () => {
      // Eğer zaten yönlendirme yapıldıysa tekrar yapma
      if (hasRedirected.current) {
        return;
      }
      
      const token = await AsyncStorage.getItem('token');
      const eventData = await AsyncStorage.getItem('selectedEvent');
      const userData = await AsyncStorage.getItem('currentUser');
      
      if (!mounted) return;
      
      // Token yoksa veya stored data yoksa, root index'e yönlendir
      if (!token || !eventData || !userData) {
        hasRedirected.current = true;
        setShouldRedirect(true);
        setIsCheckingAuth(false);
        // Hemen yönlendir, bekleme
        routerHook.replace('/');
        return;
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuthSync();
    
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Auth kontrolü yapıldıktan sonra devam et
    if (shouldRedirect || isCheckingAuth) {
      return;
    }
    
    // Token ve stored data varsa, devam et
    const loadData = async () => {
      await loadCurrentData();
    };
    loadData();
  }, [isCheckingAuth, shouldRedirect]);

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }

    const checkSession = async () => {
      const token = await AsyncStorage.getItem('token');
      const eventData = await AsyncStorage.getItem('selectedEvent');
      const userData = await AsyncStorage.getItem('currentUser');
      if (!token || !eventData || !userData) {
        router.replace('/');
      }
    };
    checkSession();
  }, [isCheckingAuth]);

  const loadCurrentData = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      const userData = await AsyncStorage.getItem('currentUser');
      
      if (eventData) {
        setCurrentEvent(JSON.parse(eventData));
      }
      
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  };

  const handleLogout = async () => {
    // Web platformunda Alert yerine window.confirm kullan
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Çıkış yapmak istediğinizden emin misiniz?');
      if (!confirmed) return;
    } else {
      // Native için Alert
      Alert.alert(
        'Çıkış Yap',
        'Çıkış yapmak istediğinizden emin misiniz?',
        [
          {
            text: 'İptal',
            style: 'cancel'
          },
          {
            text: 'Çıkış Yap',
            style: 'destructive',
            onPress: async () => {
              await performLogout();
            }
          }
        ],
        { cancelable: true }
      );
      return;
    }
    
    // Web için direkt işlem
    await performLogout();
  };

  const performLogout = async () => {
    try {
      hasRedirected.current = true;
      setShouldRedirect(true);
      setCurrentEvent(null);
      setCurrentUser(null);
      await logoutAndReset();
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
      hasRedirected.current = false;
      setShouldRedirect(false);
    }
  };

  // Etkinlik bazlı menü öğeleri
  const getMenuItems = (): { title: string; icon: keyof typeof Ionicons.glyphMap; route: string; available: boolean }[] => {
    if (!currentEvent) return [];

    const baseItems: { title: string; icon: keyof typeof Ionicons.glyphMap; route: string; available: boolean }[] = [
      { title: 'Program', icon: 'calendar-outline', route: '/(tabs)/program', available: true },
      { title: 'Konuşmacılar', icon: 'mic-outline', route: '/speakers', available: true },
      { title: 'Duyurular', icon: 'notifications-outline', route: '/announcements', available: true },
      { title: 'Galeri', icon: 'images-outline', route: '/gallery', available: true },
      { title: 'Aktiviteler', icon: 'sparkles-outline', route: '/activities', available: true },
      { title: 'Uçuşlar', icon: 'airplane-outline', route: '/flights', available: true },
      { title: 'Rezervasyon', icon: 'bed-outline', route: '/accommodations', available: true },
      { title: 'Dokümanlar', icon: 'documents-outline', route: '/documents', available: true },
      { title: 'Notlar', icon: 'create-outline', route: '/notes', available: true },
      { title: 'Canlı Quiz', icon: 'flash-outline', route: '/quiz', available: true },
      { title: 'Çekiliş', icon: 'gift-outline', route: '/raffle', available: true },
      { title: 'Anketler', icon: 'stats-chart-outline', route: '/surveys', available: true },
      { title: 'Oylama', icon: 'checkbox-outline', route: '/voting', available: true },
      { title: 'Randevular', icon: 'today-outline', route: '/appointments', available: true },
      { title: 'Ayarlar', icon: 'settings-outline', route: '/settings', available: true },
    ];

    if (currentEvent.id === '1') {
      baseItems.push({ title: 'Transfer', icon: 'car-outline', route: '/transfers', available: true });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');

  // Yönlendirme yapılacaksa veya auth kontrolü yapılıyorsa hiçbir şey render etme
  if (shouldRedirect || isCheckingAuth) {
    return null;
  }
  
  // Event/user yoksa root index'e yönlendir
  if (!currentEvent || !currentUser) {
    // useEffect'te yönlendirme yapılıyor, burada sadece render etme
    return null;
  }

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Menü" />
    <ScrollView style={[styles.container, { backgroundColor }]} showsVerticalScrollIndicator={false}>
      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              { backgroundColor: cardBackground, borderColor },
              !item.available && styles.disabledMenuItem
            ]}
            onPress={() => item.available ? router.push(item.route as any) : null}
            disabled={!item.available}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: `${primaryColor}18` },
              !item.available && styles.disabledIconContainer
            ]}>
              <Ionicons name={item.icon} size={26} color={primaryColor} />
            </View>
            <Text style={[
              styles.menuText,
              { color: textColor },
              !item.available && styles.disabledMenuText
            ]}>
              {item.title}
            </Text>
            {!item.available && (
              <Text style={styles.comingSoonText}>Yakında</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: cardBackground, borderColor }]}
          onPress={() => router.push('/support' as any)}
          activeOpacity={0.82}
        >
          <View style={[styles.footerIcon, { backgroundColor: `${primaryColor}18` }]}>
            <Ionicons name="chatbubbles-outline" size={20} color={primaryColor} />
          </View>
          <Text style={[styles.footerLabel, { color: textColor }]}>Destek</Text>
          <Ionicons name="chevron-forward" size={18} color={primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: cardBackground, borderColor: `${errorColor}44` }]}
          onPress={() => {
            console.log('🔘 Çıkış Yap butonuna tıklandı');
            handleLogout();
          }}
          activeOpacity={0.82}
        >
          <View style={[styles.footerIcon, { backgroundColor: `${errorColor}18` }]}>
            <Ionicons name="log-out-outline" size={20} color={errorColor} />
          </View>
          <Text style={[styles.footerLabel, { color: errorColor }]}>Çıkış Yap</Text>
          <Ionicons name="chevron-forward" size={18} color={errorColor} />
        </TouchableOpacity>
      </View>
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerActions: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 10,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  footerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  disabledMenuItem: {
    opacity: 0.6,
  },
  disabledIconContainer: {
    opacity: 0.5,
  },
  disabledMenuText: {
    opacity: 0.7,
  },
  comingSoonText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 2,
  },
});