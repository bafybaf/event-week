import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { apiService } from '../services/apiService';

export async function pickProfilePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişim izni gereklidir');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: Platform.OS === 'ios',
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }
  return result.assets[0].uri;
}

export async function uploadProfilePhoto(userId: string, imageUri: string): Promise<string | null> {
  const token = await AsyncStorage.getItem('token');
  const filename = imageUri.split('/').pop() || 'profile.jpg';

  let data: any;

  if (Platform.OS === 'web') {
    const formData = new FormData();
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('image', blob, filename);

    const uploadResponse = await fetch(`${API_BASE_URL}/upload/profile-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    data = await uploadResponse.json();
  } else {
    const uploadType = FileSystem.FileSystemUploadType?.MULTIPART || 'multipart';
    const uploadResult = await FileSystem.uploadAsync(
      `${API_BASE_URL}/upload/profile-image`,
      imageUri,
      {
        httpMethod: 'POST',
        uploadType,
        fieldName: 'image',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (uploadResult.status !== 200) {
      throw new Error(`Upload failed: ${uploadResult.status}`);
    }
    data = JSON.parse(uploadResult.body);
  }

  if (!data?.success || !data?.data?.original) {
    throw new Error(data?.error || 'Resim yüklenirken hata oluştu');
  }

  const imageUrl = data.data.original;
  await apiService.put(`/users/${userId}`, { profileImage: imageUrl });

  const currentUserJson = await AsyncStorage.getItem('currentUser');
  if (currentUserJson) {
    const currentUser = JSON.parse(currentUserJson);
    await AsyncStorage.setItem(
      'currentUser',
      JSON.stringify({ ...currentUser, profileImage: imageUrl })
    );
  }

  return imageUrl;
}
