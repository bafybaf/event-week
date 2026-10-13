import {  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert , Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '../../hooks/use-theme-color';
import { apiService } from '../../src/services/apiService';
import { pickProfileImage } from '../../src/config/apiConfig';
import { pickProfilePhoto, uploadProfilePhoto } from '../../src/utils/profileImageUpload';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import notificationService from '../../src/services/notificationService';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageKey, setImageKey] = useState(0); // Image cache busting için
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState({
    sessions: 0,
    appointments: 0,
    votes: 0,
    activities: 0,
  });

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  // API'den güncel kullanıcı verilerini çek
  const fetchUserFromAPI = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      const { API_BASE_URL } = require('../../src/config/apiConfig');
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const payload = await response.json();
        const user = payload.user || payload.data?.user || payload;
        if (!user?.id) {
          await loadUserData();
          return null;
        }
        const profileImageUrl = pickProfileImage(user);
        await AsyncStorage.setItem('currentUser', JSON.stringify({
          ...user,
          profileImage: user.profileImage || user.profile_image || null,
        }));

        const currentProfileImage = userData?.profileImage;
        if (currentProfileImage !== profileImageUrl) {
          setImageKey(prev => prev + 1);
        }

        setUserData({
          id: user.id,
          name: `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || 'Kullanıcı',
          title: user.title || '',
          department: user.department || '',
          company: user.company || '',
          email: user.email || '',
          phone: user.phoneNumber || user.phone || user.phone_number || '',
          profileImage: profileImageUrl,
        });
        return user;
      } else {
        console.error('❌ API response not OK:', response.status);
        await loadUserData();
      }
    } catch (error) {
      console.error('❌ Error fetching user from API:', error);
      await loadUserData();
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
    return null;
  };

  useEffect(() => {
    // İlk yüklemede API'den çek (her zaman güncel veri için)
    fetchUserFromAPI(true).then(() => {
      loadStats();
    });
  }, []);

  // Sayfa focus olduğunda kullanıcı verilerini yeniden yükle
  // Bu sayede profil düzenleme sayfasından dönüldüğünde güncel veriler görünür
  // Ayrıca mobil web'de yapılan değişiklikler Expo Go'da da görünür
  // Debounce ekleyerek sürekli çağrılmasını önle
  useFocusEffect(
    useCallback(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      
      // 500ms debounce - sayfa focus olduktan sonra kısa bir süre bekle
      timeoutId = setTimeout(() => {
        fetchUserFromAPI(false);
      }, 500);
      
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, [])
  );

  // Fallback: AsyncStorage'dan yükle (sadece API çalışmazsa)
  const loadUserData = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('currentUser');
      
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserData({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Kullanıcı',
          title: user.title || '',
          department: user.department || '',
          company: user.company || '',
          email: user.email || '',
          phone: user.phoneNumber || '',
          profileImage: pickProfileImage(user),
        });
      }
    } catch (error) {
      console.error('Error loading user data from AsyncStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // TODO: Implement real stats from API
      // For now, we'll count from AsyncStorage or calculate from API
      const selectedEvent = await AsyncStorage.getItem('selectedEvent');
      if (selectedEvent) {
        // Load real stats from backend
        // This is a placeholder - implement actual API calls
        setStats({
          sessions: 0,
          appointments: 0,
          votes: 0,
          activities: 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const menuItems = [
    {
      title: 'QR Kodum',
      icon: 'qr-code-outline',
      route: '/(tabs)/qr-code',
      action: () => router.push('/(tabs)/qr-code'),
    },
    {
      title: 'Destek',
      icon: 'chatbubbles-outline',
      route: '/support',
      action: () => router.push('/support'),
    },
    {
      title: 'Profil Bilgileri',
      icon: 'person-outline',
      route: '/edit-profile',
      action: () => router.push('/edit-profile'),
    },
    {
      title: 'Bildirim Ayarları',
      icon: 'notifications-outline',
      route: '/notification-settings',
      action: () => router.push('/notification-settings'),
    },
    {
      title: 'Güvenlik',
      icon: 'shield-outline',
      route: '/security',
      action: () => router.push('/security'),
    },
    {
      title: 'Tema Ayarları',
      icon: 'color-palette-outline',
      route: '/appearance',
      action: () => router.push('/appearance'),
    },
  ];

  const performLogout = async () => {
    try {
      console.log('🚪 Çıkış yapılıyor...');
      
      // Tüm AsyncStorage verilerini temizle (tamamen çıkış için)
      await notificationService.unregisterPushToken();
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage tamamen temizlendi');
      
      // State'leri temizle
      setUserData(null);
      setStats({
        sessions: 0,
        appointments: 0,
        votes: 0,
        activities: 0,
      });
      
      // Uygulamayı hiç giriş yapmamış gibi yeniden başlat
      console.log('🔄 Uygulama yeniden başlatılıyor...');
      
      // Web için sayfayı tamamen yenile
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = '/';
        return;
      }
      
      // Native için: Uygulamayı yeniden başlat
      // Production build'de Updates.reloadAsync() kullan
      // Development'ta (Expo Go) ise navigation kullan
      // Expo Go'da Updates.isEnabled genellikle false döner ve executionEnvironment === 'storeClient' olur
      // Sadece standalone (production build) ve Updates.isEnabled true ise reloadAsync kullan
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      const canUseUpdates = !isExpoGo && Updates.isEnabled && Constants.executionEnvironment === 'standalone';
      
      if (canUseUpdates) {
        try {
          console.log('🔄 Production build - Updates.reloadAsync() çağrılıyor...');
          // Updates.reloadAsync() parametre almaz
          await Updates.reloadAsync();
        } catch (error) {
          console.error('Updates.reloadAsync() hatası:', error);
          // Hata durumunda navigation kullan
          router.replace('/');
        }
      } else {
        // Development (Expo Go) veya updates disabled için: Navigation ile root'a git
        console.log('🔄 Development/Expo Go - Navigation ile root\'a gidiliyor...');
        try {
          // Tüm navigation stack'ini temizle ve root'a git
          router.replace('/');
          // Kısa bir gecikme ile tekrar replace yap (stack'i tamamen temizle)
          setTimeout(() => {
            router.replace('/');
            console.log('✅ Navigasyon tamamlandı');
          }, 100);
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
    }
  };

  const handleLogout = async () => {
    // Web platformunda Alert yerine window.confirm kullan
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Çıkış yapmak istediğinizden emin misiniz?');
      if (!confirmed) return;
      await performLogout();
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
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor }]}>
        <Text style={[styles.loadingText, { color: textSecondary }]}>Yükleniyor...</Text>
      </View>
    );
  }

  const handlePickProfileImage = async () => {
    const userId = userData?.id;
    if (!userId || uploadingImage) return;
    try {
      const uri = await pickProfilePhoto();
      if (!uri) return;
      setUploadingImage(true);
      const imageUrl = await uploadProfilePhoto(userId, uri);
      if (imageUrl) {
        setUserData((prev: any) => ({ ...prev, profileImage: imageUrl }));
        setImageKey((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error('Profile image pick error:', error);
      Alert.alert('Hata', error?.message || 'Resim seçilirken hata oluştu');
    } finally {
      setUploadingImage(false);
    }
  };

  const displayUser = userData || {
    id: '',
    name: 'Kullanıcı',
    title: '',
    department: '',
    company: '',
    email: '',
    phone: '',
    profileImage: null,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={{ paddingBottom: 16 }}>
      <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Profilim</Text>
        <TouchableOpacity
          onPress={() => router.push('/edit-profile')}
          style={styles.editButton}
        >
          <Ionicons name="create-outline" size={24} color={primaryColor} />
        </TouchableOpacity>
      </View>

      <View style={[styles.profileSection, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.profileImageContainer}>
          {displayUser.profileImage ? (
            <Image 
              key={`profile-${imageKey}-${displayUser.profileImage}`} // Key ile force re-render
              source={{ 
                uri: displayUser.profileImage,
              }} 
              style={styles.profileImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => {}}
            />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: backgroundColor }]}>
              <Ionicons name="person" size={40} color={textSecondary} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.editImageButton, { backgroundColor: primaryColor }]}
            onPress={handlePickProfileImage}
            disabled={uploadingImage}
            accessibilityRole="button"
            accessibilityLabel="Profil fotoğrafı seç"
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.userName, { color: textColor }]}>{displayUser.name}</Text>
        {displayUser.title ? <Text style={[styles.userTitle, { color: textSecondary }]}>{displayUser.title}</Text> : null}
        {(displayUser.department || displayUser.company) ? (
          <Text style={[styles.userDepartment, { color: textSecondary }]}>
            {displayUser.department}{displayUser.department && displayUser.company ? ' - ' : ''}{displayUser.company}
          </Text>
        ) : null}
      </View>

      {(displayUser.email || displayUser.phone) ? (
        <View style={[styles.contactInfo, { backgroundColor: cardBackground, borderColor }]}>
          {displayUser.email ? (
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={20} color={primaryColor} />
              <Text style={[styles.contactText, { color: textSecondary }]}>{displayUser.email}</Text>
            </View>
          ) : null}
          {displayUser.phone ? (
            <View style={styles.contactItem}>
              <Ionicons name="call" size={20} color={primaryColor} />
              <Text style={[styles.contactText, { color: textSecondary }]}>{displayUser.phone}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.menuSection, { backgroundColor: cardBackground, borderColor }]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderBottomColor: borderColor }]}
            onPress={() => {
              if (item.action) {
                item.action();
              } else {
                router.push(item.route as any);
              }
            }}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={24} color={textSecondary} />
              <Text style={[styles.menuText, { color: textColor }]}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.statsSection, { backgroundColor: cardBackground, borderColor }]}>
        <Text style={[styles.statsTitle, { color: textColor }]}>Etkinlik İstatistikleri</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: backgroundColor }]}>
            <Text style={[styles.statNumber, { color: primaryColor }]}>{stats.sessions}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Katıldığım Oturum</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: backgroundColor }]}>
            <Text style={[styles.statNumber, { color: primaryColor }]}>{stats.appointments}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Randevu</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: backgroundColor }]}>
            <Text style={[styles.statNumber, { color: primaryColor }]}>{stats.votes}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Oylama</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: backgroundColor }]}>
            <Text style={[styles.statNumber, { color: primaryColor }]}>{stats.activities}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Aktivite</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: cardBackground, borderColor }]} 
        onPress={() => {
          console.log('🔘 Profil sayfasında Çıkış Yap butonuna tıklandı');
          handleLogout();
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={[styles.logoutText, { color: '#DC2626' }]}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  profileSection: {
    alignItems: 'center',
    padding: 32,
    margin: 20,
    borderRadius: 20,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? {

      boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',

    } : {

      shadowColor: '#000',

      shadowOffset: { width: 0, height: 2 },

      shadowOpacity: 0.1,

      shadowRadius: 3.84,

      elevation: 5,

    }),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  userDepartment: {
    fontSize: 14,
  },
  contactInfo: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    marginLeft: 12,
  },
  menuSection: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
  },
  statsSection: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
});
