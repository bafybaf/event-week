import {  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Share , Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '../../hooks/use-theme-color';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export default function QRCodeScreen() {
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const qrCodeRef = useRef<any>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    loadQRCodeData();
  }, []);

  const loadQRCodeData = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('currentUser');
      const eventJson = await AsyncStorage.getItem('selectedEvent');
      
      if (userJson) {
        const user = JSON.parse(userJson);
        const event = eventJson ? JSON.parse(eventJson) : null;
        setSelectedEvent(event);
        
        const qrData = {
          userId: user.id || user.userId || 'USER123456',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Kullanıcı',
          company: user.company || '',
          eventId: event?.id || 'EVENT2024',
          email: user.email || '',
          role: user.role || 'participant',
        };
        
        setQrCodeData(qrData);
      } else {
        // Fallback data
        setQrCodeData({
          userId: 'USER123456',
          name: 'Kullanıcı',
          company: '',
          eventId: 'EVENT2024',
        });
      }
    } catch (error) {
      console.error('Error loading QR code data:', error);
    } finally {
      setLoading(false);
    }
  };

  // QR kod verisini yapılandırılmış formatta oluştur
  const qrCodeString = qrCodeData ? JSON.stringify({
    type: 'event-participant',
    version: '1.0',
    userId: qrCodeData.userId,
    name: qrCodeData.name,
    email: qrCodeData.email,
    eventId: qrCodeData.eventId,
    eventName: selectedEvent?.name || '',
    role: qrCodeData.role,
    company: qrCodeData.company || '',
    timestamp: new Date().toISOString(),
  }) : '';

  const handleShareQR = async () => {
    try {
      if (!qrCodeRef.current) {
        Alert.alert('Hata', 'QR kod henüz hazır değil');
        return;
      }

      // QR kod görselini base64 olarak al
      const qrCodeDataURL = await new Promise<string>((resolve, reject) => {
        try {
          qrCodeRef.current?.toDataURL((dataURL: string) => {
            if (dataURL) {
              resolve(dataURL);
            } else {
              reject(new Error('QR kod görseli alınamadı'));
            }
          });
        } catch (error) {
          reject(error);
        }
      });

      // Base64'ü dosya formatına çevir
      const base64Data = qrCodeDataURL.split(',')[1] || qrCodeDataURL;
      
      // Geçici dosya oluştur
      const fileName = `qr-code-${qrCodeData?.userId || 'user'}-${Date.now()}.png`;
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        throw new Error('Cache directory not available');
      }
      const fileUri = `${cacheDir}${fileName}`;
      
      // Legacy API kullanarak dosya yaz (deprecated uyarısını önlemek için)
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Paylaş
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'QR Kodunuzu Paylaş',
        });
      } else {
        // Web için alternatif yöntem
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          // Web'de base64'ü direkt paylaş
          const link = document.createElement('a');
          link.href = qrCodeDataURL;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          Alert.alert('Başarılı', 'QR kod görseli indirildi!');
        } else {
          // Fallback: Metin paylaş
          await Share.share({
            message: `Etkinlik QR Kodum: ${qrCodeData?.name}\n${qrCodeString}`,
            title: 'QR Kodum',
          });
        }
      }
    } catch (error: any) {
      console.error('QR kod paylaşma hatası:', error);
      Alert.alert('Hata', 'QR kod paylaşılırken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  if (loading || !qrCodeData) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>QR Kodum</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: textSecondary }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>QR Kodum</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>Hızlı geçiş için QR kodunuzu kullanın</Text>
      </View>

      <View style={[styles.qrContainer, { backgroundColor: cardBackground, borderColor }]}>
        <View style={[styles.qrCodeWrapper, { backgroundColor: '#FFFFFF' }]}>
          {qrCodeString ? (
            <QRCode
              getRef={(ref) => {
                qrCodeRef.current = ref;
              }}
              value={qrCodeString}
              size={250}
              color="#000000"
              backgroundColor="#FFFFFF"
              logo={undefined}
              logoSize={30}
              logoBackgroundColor="transparent"
              logoMargin={2}
              logoBorderRadius={15}
              quietZone={10}
              enableLinearGradient={false}
              ecl="M"
            />
          ) : (
            <View style={[styles.qrCodePlaceholder, { backgroundColor: backgroundColor }]}>
              <Ionicons name="qr-code" size={120} color={primaryColor} />
              <Text style={[styles.qrPlaceholderText, { color: textSecondary }]}>QR Kod Yükleniyor...</Text>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: textColor }]}>{qrCodeData.name}</Text>
          {qrCodeData.company && (
            <Text style={[styles.userCompany, { color: textSecondary }]}>{qrCodeData.company}</Text>
          )}
          <Text style={[styles.userId, { color: textSecondary }]}>ID: {qrCodeData.userId}</Text>
          {selectedEvent && (
            <Text style={[styles.eventName, { color: textSecondary }]}>{selectedEvent.name}</Text>
          )}
        </View>
      </View>

      <View style={[styles.actionsContainer, { backgroundColor }]}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: primaryColor }]} 
          onPress={handleShareQR}
        >
          <Ionicons name="share" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>QR Kod Görselini Paylaş</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoContainer, { backgroundColor }]}>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={[styles.infoText, { color: textSecondary }]}>Etkinlik alanına giriş</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={[styles.infoText, { color: textSecondary }]}>Restoran rezervasyonu</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={[styles.infoText, { color: textSecondary }]}>Oturum katılımı</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={[styles.infoText, { color: textSecondary }]}>Transfer hizmetleri</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 32,
    margin: 20,
    borderRadius: 20,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? {

      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',

    } : {

      shadowColor: '#000',

      shadowOffset: { width: 0, height: 4 },

      shadowOpacity: 0.1,

      shadowRadius: 8,

      elevation: 8,

    }),
  },
  qrCodeWrapper: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 290,
    minWidth: 290,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  qrCodePlaceholder: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 250,
    minWidth: 250,
  },
  qrPlaceholderText: {
    fontSize: 16,
    marginTop: 8,
  },
  qrCodeData: {
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userCompany: {
    fontSize: 16,
    marginBottom: 8,
  },
  userId: {
    fontSize: 14,
  },
  eventName: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContainer: {
    padding: 20,
    marginTop: 0,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 12,
  },
});
