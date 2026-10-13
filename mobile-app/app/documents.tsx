import React, { useState, useEffect } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../hooks/use-theme-color';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../src/services/apiService';
import { Header } from '../components/Header';
import { fixFileUrl } from '../src/config/apiConfig';

interface Document {
  id: number;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  version: string;
  language: string;
  isPublic: boolean;
  requiresAuth: boolean;
  downloadCount: number;
  viewCount: number;
  event?: {
    id: number;
    name: string;
  };
  uploader?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const DocumentsScreen: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const backgroundTertiary = useThemeColor({}, 'backgroundTertiary');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');

  useEffect(() => {
    loadSelectedEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchDocuments();
    }
  }, [selectedEvent]);

  const loadSelectedEvent = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      if (eventData) {
        setSelectedEvent(JSON.parse(eventData));
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading selected event:', error);
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      if (!selectedEvent?.id) {
        console.warn('No event selected, cannot fetch documents');
        setDocuments([]);
        return;
      }
      
      const response = await apiService.getDocuments(selectedEvent.id) as any;
      console.log('Documents API response:', response);
      
      // apiService.getDocuments zaten response.documents || response döndürüyor
      // Eğer response bir array ise direkt kullan, değilse response.documents kontrol et
      let documentsList: Document[] = [];
      
      if (Array.isArray(response)) {
        documentsList = response;
      } else if (response?.documents && Array.isArray(response.documents)) {
        documentsList = response.documents;
      } else if (response?.success && Array.isArray(response.documents)) {
        documentsList = response.documents;
      }
      
      console.log('Parsed documents list:', documentsList.length, 'documents');
      
      // Sayısal değerleri normalize et (NaN ve undefined kontrolü)
      const normalizedDocuments = documentsList.map((doc: any) => ({
        ...doc,
        fileSize: doc.fileSize && !isNaN(doc.fileSize) ? doc.fileSize : 0,
        viewCount: doc.viewCount && !isNaN(doc.viewCount) ? doc.viewCount : 0,
        downloadCount: doc.downloadCount && !isNaN(doc.downloadCount) ? doc.downloadCount : 0,
        fileName: doc.fileName || doc.fileUrl?.split('/').pop() || 'Dosya',
      }));
      
      setDocuments(normalizedDocuments);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Dokümanlar yüklenirken bir hata oluştu';
      console.error('Error details:', errorMessage);
      // Sessizce hata göster, boş liste göster
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return 'document-text-outline';
      case 'doc':
      case 'docx':
        return 'document-outline';
      case 'xls':
      case 'xlsx':
        return 'grid-outline';
      case 'ppt':
      case 'pptx':
        return 'easel-outline';
      case 'txt':
        return 'text-outline';
      case 'image':
        return 'image-outline';
      case 'video':
        return 'videocam-outline';
      default:
        return 'document-outline';
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '#ef4444'; // Red
      case 'doc':
      case 'docx':
        return '#0EA5D4'; // Blue
      case 'xls':
      case 'xlsx':
        return '#059669'; // Green
      case 'ppt':
      case 'pptx':
        return '#d97706'; // Orange
      case 'txt':
        return '#64748b'; // Gray
      case 'image':
        return '#8b5cf6'; // Purple
      case 'video':
        return '#dc2626'; // Red
      default:
        return primaryColor;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'agenda':
        return 'Gündem';
      case 'presentation':
        return 'Sunum';
      case 'handout':
        return 'El Kitabı';
      case 'certificate':
        return 'Sertifika';
      case 'manual':
        return 'Kılavuz';
      case 'guide':
        return 'Rehber';
      case 'form':
        return 'Form';
      default:
        return 'Diğer';
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    // Null, undefined veya geçersiz değer kontrolü
    if (!bytes || bytes === 0 || isNaN(bytes) || !isFinite(bytes)) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Tarih yok';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Geçersiz tarih';
      }
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };

  const handleDocumentPress = (document: Document) => {
    Alert.alert(
      document.title,
      `${document.description || ''}\n\n📄 ${document.fileName || 'Dosya'}\n📊 ${formatFileSize(document.fileSize)}\n📅 ${formatDate(document.uploadDate || document.created_at || new Date().toISOString())}\n👁️ ${document.viewCount || 0} görüntüleme\n⬇️ ${document.downloadCount || 0} indirme`,
      [
        { text: 'Kapat', style: 'cancel' },
        { text: 'İndir', onPress: () => handleDownload(document) },
        { text: 'Görüntüle', onPress: () => handleView(document) },
      ]
    );
  };

  const handleDownload = async (document: Document) => {
    try {
      // URL'yi düzelt (localhost -> IP adresi)
      const fixedUrl = fixFileUrl(document.fileUrl);
      if (!fixedUrl) {
        Alert.alert('Hata', 'Doküman URL\'si geçersiz.');
        return;
      }

      console.log('📥 Downloading document:', { original: document.fileUrl, fixed: fixedUrl });

      const supported = await Linking.canOpenURL(fixedUrl);
      if (supported) {
        await Linking.openURL(fixedUrl);
        Alert.alert('Başarılı', 'Doküman indirilmeye başlandı!');
      } else {
        Alert.alert('Hata', 'Bu dosya türü desteklenmiyor.');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Hata', 'Doküman açılırken bir hata oluştu.');
    }
  };

  const handleView = async (document: Document) => {
    try {
      // URL'yi düzelt (localhost -> IP adresi)
      const fixedUrl = fixFileUrl(document.fileUrl);
      if (!fixedUrl) {
        Alert.alert('Hata', 'Doküman URL\'si geçersiz.');
        return;
      }

      console.log('👁️ Viewing document:', { original: document.fileUrl, fixed: fixedUrl });

      const supported = await Linking.canOpenURL(fixedUrl);
      if (supported) {
        await Linking.openURL(fixedUrl);
      } else {
        Alert.alert('Hata', 'Bu dosya türü görüntülenemiyor.');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      Alert.alert('Hata', 'Doküman görüntülenirken bir hata oluştu.');
    }
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[styles.documentCard, { backgroundColor: cardBackground, borderColor }]}
      onPress={() => handleDocumentPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.documentHeader}>
        <View style={[styles.fileIconContainer, { backgroundColor: backgroundTertiary }]}>
          <Ionicons
            name={getFileTypeIcon(item.fileType) as any}
            size={32}
            color={getFileTypeColor(item.fileType)}
          />
        </View>
        <View style={styles.documentInfo}>
          <Text style={[styles.documentTitle, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.fileName, { color: textSecondary }]} numberOfLines={1}>
            {item.fileName}
          </Text>
        </View>
        <View style={styles.documentActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={() => handleView(item)}
          >
            <Ionicons name="eye-outline" size={16} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: successColor }]}
            onPress={() => handleDownload(item)}
          >
            <Ionicons name="download-outline" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.documentDescription, { color: textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.documentDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="folder-outline" size={16} color={textSecondary} />
            <Text style={[styles.detailText, { color: textSecondary }]}>
              {getCategoryText(item.category)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="resize-outline" size={16} color={textSecondary} />
            <Text style={[styles.detailText, { color: textSecondary }]}>
              {formatFileSize(item.fileSize)}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="language-outline" size={16} color={textSecondary} />
            <Text style={[styles.detailText, { color: textSecondary }]}>
              {(item.language || 'tr').toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="git-branch-outline" size={16} color={textSecondary} />
            <Text style={[styles.detailText, { color: textSecondary }]}>
              v{item.version || '1.0'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.documentFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="eye-outline" size={14} color={textSecondary} />
          <Text style={[styles.footerText, { color: textSecondary }]}>
            {item.viewCount || 0}
          </Text>
        </View>
        
        <View style={styles.footerItem}>
          <Ionicons name="download-outline" size={14} color={textSecondary} />
          <Text style={[styles.footerText, { color: textSecondary }]}>
            {item.downloadCount || 0}
          </Text>
        </View>
        
        {item.requiresAuth && (
          <View style={styles.footerItem}>
            <Ionicons name="lock-closed-outline" size={14} color={warningColor} />
            <Text style={[styles.footerText, { color: warningColor }]}>
              Giriş Gerekli
            </Text>
          </View>
        )}
        
        {!item.isPublic && (
          <View style={styles.footerItem}>
            <Ionicons name="eye-off-outline" size={14} color={textSecondary} />
            <Text style={[styles.footerText, { color: textSecondary }]}>
              Özel
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color={textSecondary} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        Doküman Bulunamadı
      </Text>
      <Text style={[styles.emptyDescription, { color: textSecondary }]}>
        {selectedEvent ? 
          `${selectedEvent.name} etkinliği için henüz doküman eklenmemiş.` :
          'Lütfen önce bir etkinlik seçin.'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: textSecondary }]}>
          Dokümanlar yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header 
        title="Dokümanlar" 
        subtitle={selectedEvent?.name}
      />

      <FlatList
        data={documents}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  documentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 12,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  documentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 6,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});

export default DocumentsScreen;