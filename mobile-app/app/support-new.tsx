import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Header } from '../components/Header';
import { useThemeColor } from '../hooks/use-theme-color';
import { fixFileUrl } from '../src/config/apiConfig';
import apiService from '../src/services/apiService';
import { uploadSupportAttachment } from '../src/services/supportUpload';

export default function SupportNewScreen() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      const uploaded = await uploadSupportAttachment(result.assets[0]);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Dosya yüklenemedi');
    }
  };

  const submit = async () => {
    try {
      setSaving(true);
      const eventData = await AsyncStorage.getItem('selectedEvent');
      const event = eventData ? JSON.parse(eventData) : null;
      const ticket = await apiService.createSupportTicket({
        eventId: event?.id,
        subject,
        body,
        attachments,
      });
      router.replace({ pathname: '/support-detail', params: { id: ticket.id } });
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Talep açılamadı');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <Header title="Yeni talep" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="Konu"
          placeholderTextColor={textSecondary}
          style={[styles.input, { color: textColor, borderColor, backgroundColor: cardBackground }]}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Mesajın"
          placeholderTextColor={textSecondary}
          multiline
          style={[styles.input, styles.area, { color: textColor, borderColor, backgroundColor: cardBackground }]}
        />
        <TouchableOpacity style={[styles.attach, { borderColor }]} onPress={pickFile}>
          <Ionicons name="attach" size={20} color={primaryColor} />
          <Text style={{ color: textColor, marginLeft: 8 }}>Görsel veya PDF ekle</Text>
        </TouchableOpacity>
        {attachments.map((file) => (
          <View key={file.url} style={styles.fileRow}>
            {file.category === 'image' ? (
              <Image source={{ uri: fixFileUrl(file.url) || '' }} style={styles.thumb} contentFit="contain" />
            ) : (
              <Ionicons name="document-outline" size={18} color={textSecondary} />
            )}
            <Text style={{ color: textSecondary, marginLeft: 8 }}>{file.fileName}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.submit, { backgroundColor: primaryColor, opacity: saving ? 0.6 : 1 }]}
          onPress={submit}
          disabled={saving}
        >
          <Text style={styles.submitText}>{saving ? 'Gönderiliyor...' : 'Talebi aç'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  area: { minHeight: 140, textAlignVertical: 'top' },
  attach: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  fileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#020617' },
  submit: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
