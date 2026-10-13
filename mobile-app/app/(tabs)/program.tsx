import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import apiService from '../../src/services/apiService';
import { useThemeColor } from '../../hooks/use-theme-color';
import { Header } from '../../components/Header';
import { fixFileUrl } from '../../src/config/apiConfig';

interface ProgramPdf {
  id: string;
  title: string;
  pdfUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export default function ProgramScreen() {
  const [programs, setPrograms] = useState<ProgramPdf[]>([]);
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

  useEffect(() => {
    loadSelectedEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchPrograms();
    }
  }, [selectedEvent]);

  const loadSelectedEvent = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      if (eventData) {
        setSelectedEvent(JSON.parse(eventData));
      }
    } catch (error) {
      console.error('Error loading selected event:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const programsData = await apiService.getPrograms(selectedEvent?.id) as any;
      const programsList = Array.isArray(programsData) ? programsData : [];
      setPrograms(programsList.filter((p: any) => p.pdfUrl));
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrograms();
    setRefreshing(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const openProgram = (item: ProgramPdf) => {
    const url = fixFileUrl(item.pdfUrl || '');
    if (!url) return;
    router.push({
      pathname: '/program-viewer',
      params: {
        url: encodeURIComponent(url),
        title: item.title || item.fileName || 'Program'
      }
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <Header
        title="Program"
        subtitle={selectedEvent?.name}
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="document-text-outline" size={48} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                Bu etkinlik için program PDF'i henüz yüklenmedi.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => openProgram(item)}
            >
              <View style={[styles.iconWrap, { backgroundColor: backgroundTertiary }]}>
                <Ionicons name="document-text" size={26} color="#DC2626" />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
                <Text style={[styles.meta, { color: textSecondary }]}>
                  {item.fileName || 'PDF'} {item.fileSize ? `• ${formatFileSize(item.fileSize)}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={primaryColor} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.06)',
    } : {
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    }),
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
  },
});
