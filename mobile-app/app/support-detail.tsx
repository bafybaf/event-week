import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '../components/Header';
import { useThemeColor } from '../hooks/use-theme-color';
import { fixFileUrl } from '../src/config/apiConfig';
import apiService from '../src/services/apiService';
import { uploadSupportAttachment } from '../src/services/supportUpload';

export default function SupportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiService.getSupportTicket(id);
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Support detail error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [load]);

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

  const send = async () => {
    if (!id) return;
    try {
      setSending(true);
      const created = await apiService.replySupportTicket(id, { body, attachments });
      setMessages((prev) => [...prev, created]);
      setBody('');
      setAttachments([]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    if (!ticket) return;
    const status = ticket.status === 'open' ? 'closed' : 'open';
    try {
      const updated = await apiService.updateSupportTicketStatus(ticket.id, status);
      setTicket({ ...ticket, ...updated });
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Durum güncellenemedi');
    }
  };

  const openFile = (url: string) => {
    const href = fixFileUrl(url);
    if (href) Linking.openURL(href);
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <Header
        title={ticket?.subject || 'Talep'}
        rightComponent={
          ticket ? (
            <TouchableOpacity onPress={toggleStatus}>
              <Text style={{ color: primaryColor, fontWeight: '600' }}>
                {ticket.status === 'open' ? 'Kapat' : 'Aç'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={primaryColor} />
      ) : (
        <>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const staff = item.sender?.role === 'admin' || item.sender?.role === 'organizer';
              return (
                <View
                  style={[
                    styles.bubble,
                    { backgroundColor: staff ? primaryColor : cardBackground, borderColor },
                    staff ? styles.mine : styles.theirs,
                  ]}
                >
                  <Text style={[styles.meta, { color: staff ? '#dbeafe' : textSecondary }]}>
                    {`${item.sender?.firstName || ''} ${item.sender?.lastName || ''}`.trim() || 'Kullanıcı'}
                    {staff ? ' · Admin' : ''}
                  </Text>
                  {!!item.body && (
                    <Text style={{ color: staff ? '#fff' : textColor }}>{item.body}</Text>
                  )}
                  {(item.attachments || []).map((file: any) => (
                    <TouchableOpacity key={file.url} onPress={() => openFile(file.url)} style={{ marginTop: 8 }}>
                      {file.category === 'image' ? (
                        <Image source={{ uri: fixFileUrl(file.url) || '' }} style={styles.image} contentFit="contain" />
                      ) : (
                        <Text style={{ color: staff ? '#fff' : primaryColor }}>{file.fileName}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            }}
          />
          {ticket?.status === 'open' ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={[styles.bar, { borderColor }]}>
                <TouchableOpacity onPress={pickFile}>
                  <Ionicons name="attach" size={22} color={primaryColor} />
                </TouchableOpacity>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="Yanıt yaz..."
                  placeholderTextColor={textSecondary}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <TouchableOpacity onPress={send} disabled={sending}>
                  <Ionicons name="send" size={22} color={primaryColor} />
                </TouchableOpacity>
              </View>
              {attachments.length > 0 && (
                <Text style={[styles.attachNote, { color: textSecondary }]}>
                  {attachments.map((file) => file.fileName).join(', ')}
                </Text>
              )}
            </KeyboardAvoidingView>
          ) : (
            <Text style={[styles.closed, { color: textSecondary }]}>Bu talep kapalı.</Text>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bubble: { maxWidth: '82%', borderWidth: 1, borderRadius: 14, padding: 10, marginBottom: 10 },
  mine: { alignSelf: 'flex-end' },
  theirs: { alignSelf: 'flex-start' },
  meta: { fontSize: 11, marginBottom: 4 },
  image: { width: 180, height: 140, borderRadius: 8, backgroundColor: '#020617' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  attachNote: { paddingHorizontal: 16, paddingBottom: 8, fontSize: 12 },
  closed: { textAlign: 'center', padding: 16 },
});
