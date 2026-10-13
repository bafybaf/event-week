import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '../config/apiConfig';

export async function uploadSupportAttachment(asset: {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
}) {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Oturum bulunamadı');
  const fileName = asset.name || `ek-${Date.now()}`;

  if (Platform.OS === 'web') {
    const formData = new FormData();
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    formData.append('file', blob, fileName);
    const uploadResponse = await fetch(`${API_BASE_URL}/upload/support`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await uploadResponse.json();
    if (!uploadResponse.ok || !data.success) {
      throw new Error(data.error || 'Yükleme başarısız');
    }
    return data.data;
  }

  const uploadType = FileSystem.FileSystemUploadType?.MULTIPART || 'multipart';
  const uploadResult = await FileSystem.uploadAsync(`${API_BASE_URL}/upload/support`, asset.uri, {
    httpMethod: 'POST',
    uploadType,
    fieldName: 'file',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = JSON.parse(uploadResult.body);
  if (uploadResult.status !== 200 || !data.success) {
    throw new Error(data.error || 'Yükleme başarısız');
  }
  return data.data;
}
