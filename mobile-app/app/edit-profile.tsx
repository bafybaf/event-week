import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useThemeColor } from '../hooks/use-theme-color';
import { apiService } from '../src/services/apiService';
import { API_BASE_URL, pickProfileImage } from '../src/config/apiConfig';
import { pickProfilePhoto } from '../src/utils/profileImageUpload';
import { Screen } from '../components/Screen';

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [user, setUser] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
    department: '',
    title: '',
    profileImage: null as string | null,
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
        console.warn('⚠️ No token found');
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      const { API_BASE_URL: API_URL } = require('../src/config/apiConfig');
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const user = userData.user || userData.data?.user || userData;
        const fixedProfileImage = pickProfileImage(user);

        await AsyncStorage.setItem('currentUser', JSON.stringify({
          ...user,
          profileImage: user.profileImage || user.profile_image || null,
        }));
        
        setUser({
          id: user.id || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || user.phone || '',
          company: user.company || '',
          department: user.department || '',
          title: user.title || '',
          profileImage: fixedProfileImage,
        });
        
        return user;
      }
    } catch (error) {
      console.error('❌ Error fetching user from API:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
    return null;
  };

  useEffect(() => {
    // İlk yüklemede API'den çek (her zaman güncel veri için)
    fetchUserFromAPI(true);
  }, []);

  // Sayfa focus olduğunda kullanıcı verilerini yeniden yükle
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

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('currentUser');
      const token = await AsyncStorage.getItem('token');

      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser({
          id: userData.id || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || userData.phone || '',
          company: userData.company || '',
          department: userData.department || '',
          title: userData.title || '',
          profileImage: userData.profileImage || null,
        });
      } else if (token) {
        // Try to fetch user from API
        try {
          const { API_BASE_URL: API_URL } = require('../src/config/apiConfig');
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const userData = await response.json();
            await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
            setUser({
              id: userData.id || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              phoneNumber: userData.phoneNumber || userData.phone || '',
              company: userData.company || '',
              department: userData.department || '',
              title: userData.title || '',
              profileImage: userData.profileImage || null,
            });
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Hata', 'Kullanıcı bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const uri = await pickProfilePhoto();
      if (uri) {
        await uploadProfileImage(uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Resim seçilirken hata oluştu');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      const token = await AsyncStorage.getItem('token');
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      console.log('📤 Uploading image to:', `${API_BASE_URL}/upload/profile-image`);
      console.log('📦 Platform:', Platform.OS, 'URI:', imageUri);

      let data: any;

      if (Platform.OS === 'web') {
        // Web için fetch + FormData kullan
        const formData = new FormData();
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, filename);

        const uploadResponse = await fetch(`${API_BASE_URL}/upload/profile-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('❌ Upload failed:', errorText);
          throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
        }

        data = await uploadResponse.json();
      } else {
        // Native (Android/iOS) için FileSystem.uploadAsync kullan
        // Bu metod Android'de daha güvenilir çalışır
        const uploadUrl = `${API_BASE_URL}/upload/profile-image`;
        
        // FileSystemUploadType enum'ı kontrol et, yoksa string kullan
        const uploadType = FileSystem.FileSystemUploadType?.MULTIPART || 'multipart';
        
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, imageUri, {
          httpMethod: 'POST',
          uploadType: uploadType,
          fieldName: 'image',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('📥 Upload response status:', uploadResult.status);
        console.log('📥 Upload response body:', uploadResult.body);

        if (uploadResult.status !== 200) {
          console.error('❌ Upload failed:', uploadResult.body);
          throw new Error(`Upload failed: ${uploadResult.status} ${uploadResult.body}`);
        }

        try {
          data = JSON.parse(uploadResult.body);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          throw new Error('Invalid response from server');
        }
      }

      console.log('✅ Upload success:', data);

      if (data.success) {
        const imageUrl = data.data.original;
        setUser(prev => ({ ...prev, profileImage: imageUrl }));
        
        // Automatically save profile image URL to user data
        try {
          const updateResponse = await apiService.put(`/users/${user.id}`, { profileImage: imageUrl });
          
          // AsyncStorage'daki currentUser'ı güncelle
          const currentUserJson = await AsyncStorage.getItem('currentUser');
          if (currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);
            const updatedUser = {
              ...currentUser,
              profileImage: imageUrl
            };
            await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
            console.log('✅ AsyncStorage updated with new profile image');
          }
          
          Alert.alert('Başarılı', 'Profil resmi başarıyla yüklendi ve kaydedildi', [
            {
              text: 'Tamam',
              onPress: () => {
                // Profil sayfasına dön ve otomatik yenilenecek
                router.back();
              }
            }
          ]);
        } catch (error: any) {
          console.error('Error saving profile image URL:', error);
          Alert.alert('Uyarı', 'Resim yüklendi ancak kaydedilirken hata oluştu');
        }
      } else {
        Alert.alert('Hata', data.error || 'Resim yüklenirken hata oluştu');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      const errorMessage = error.message || 'Resim yüklenirken hata oluştu';
      console.error('Error details:', {
        message: errorMessage,
        apiUrl: `${API_BASE_URL}/upload/profile-image`,
        platform: Platform.OS,
      });
      
      // Network hatası için özel mesaj
      if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
        Alert.alert(
          'Bağlantı Hatası',
          'Backend sunucusuna bağlanılamadı. Lütfen:\n\n1. Backend sunucusunun çalıştığından emin olun\n2. API URL\'inin doğru olduğunu kontrol edin\n3. İnternet bağlantınızı kontrol edin',
          [{ text: 'Tamam' }]
        );
      } else {
        Alert.alert('Hata', errorMessage);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user.firstName || !user.lastName) {
      Alert.alert('Hata', 'Ad ve soyad alanları zorunludur');
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || undefined,
        phoneNumber: user.phoneNumber,
        company: user.company || undefined,
        department: user.department || undefined,
        title: user.title || undefined,
        profileImage: user.profileImage || undefined,
      };

      const response = await apiService.put(`/users/${user.id}`, updateData);

      if (response.success || response.user) {
        // API'den güncel veriyi çek (tüm platformlarda senkronizasyon için)
        try {
          const { API_BASE_URL: API_URL } = require('../src/config/apiConfig');
          const token = await AsyncStorage.getItem('token');
          const refreshResponse = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const refreshedUser = refreshData.user || refreshData;
            await AsyncStorage.setItem('currentUser', JSON.stringify(refreshedUser));
            console.log('✅ Profile updated and synced from API');
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
        
        Alert.alert('Başarılı', 'Profil başarıyla güncellendi', [
          {
            text: 'Tamam',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Hata', 'Profil güncellenirken hata oluştu');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Hata', error.message || 'Profil güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen style={[styles.container, styles.centerContent, { backgroundColor }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: textSecondary }]}>Yükleniyor...</Text>
      </Screen>
    );
  }

  return (
    <Screen style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Profil Düzenle</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.profileImageSection, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.profileImageContainer}>
          {user.profileImage ? (
            <Image 
              source={{ uri: user.profileImage }} 
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
            onPress={handleImagePicker}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={[styles.imageHint, { color: textSecondary }]}>
          Profil resminizi güncellemek için yukarıdaki ikona tıklayın
        </Text>
      </View>

      <View style={[styles.formSection, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>
            Ad <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: backgroundColor, borderColor, color: textColor }]}
            value={user.firstName}
            onChangeText={(text) => setUser(prev => ({ ...prev, firstName: text }))}
            placeholder="Adınız"
            placeholderTextColor={textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>
            Soyad <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: backgroundColor, borderColor, color: textColor }]}
            value={user.lastName}
            onChangeText={(text) => setUser(prev => ({ ...prev, lastName: text }))}
            placeholder="Soyadınız"
            placeholderTextColor={textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>E-posta</Text>
          <TextInput
            style={[styles.input, { backgroundColor: backgroundColor, borderColor, color: textColor }]}
            value={user.email}
            onChangeText={(text) => setUser(prev => ({ ...prev, email: text }))}
            placeholder="ornek@email.com"
            placeholderTextColor={textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>
            Telefon Numarası <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: backgroundColor, borderColor, color: textColor }]}
            value={user.phoneNumber}
            onChangeText={(text) => setUser(prev => ({ ...prev, phoneNumber: text }))}
            placeholder="0555 123 45 67"
            placeholderTextColor={textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Şirket</Text>
          <TextInput
            style={[styles.input, { backgroundColor: backgroundColor, borderColor, color: textColor }]}
            value={user.company}
            onChangeText={(text) => setUser(prev => ({ ...prev, company: text }))}
            placeholder="Şirket adı"
            placeholderTextColor={textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Departman</Text>
          <TextInput
            style={[styles.input, { backgroundColor: backgroundColor, borderColor, color: textColor }]}
            value={user.department}
            onChangeText={(text) => setUser(prev => ({ ...prev, department: text }))}
            placeholder="Departman"
            placeholderTextColor={textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Ünvan</Text>
          <TextInput
            style={[styles.input, { backgroundColor: backgroundColor, borderColor, color: textColor }]}
            value={user.title}
            onChangeText={(text) => setUser(prev => ({ ...prev, title: text }))}
            placeholder="Ünvanınız"
            placeholderTextColor={textSecondary}
          />
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: backgroundColor, borderColor }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelButtonText, { color: textColor }]}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: primaryColor }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </Screen>
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
    paddingTop: 40, // Üst boşluk ekle
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  profileImageSection: {
    alignItems: 'center',
    padding: 32,
    margin: 20,
    marginBottom: 0,
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
  },
  imageHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  formSection: {
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

