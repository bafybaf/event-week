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
  Image,
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

interface Activity {
  id: number;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number | null;
  registeredCount: number;
  price: number;
  isActive: boolean;
  requiresRegistration: boolean;
  imageUrl: string;
  event?: {
    id: number;
    name: string;
  };
}

const ActivitiesScreen: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
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
      fetchActivities();
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

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const activities = await apiService.getActivities(selectedEvent?.id) as any;
      setActivities(Array.isArray(activities) ? activities : []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      Alert.alert('Hata', 'Aktiviteler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'workshop':
        return 'hammer-outline';
      case 'seminar':
      case 'training':
        return 'school-outline';
      case 'conference':
      case 'panel':
        return 'mic-outline';
      case 'networking':
        return 'people-outline';
      case 'social':
      case 'entertainment':
        return 'happy-outline';
      case 'dinner':
      case 'lunch':
      case 'breakfast':
      case 'cooking':
        return 'restaurant-outline';
      case 'coffee':
        return 'cafe-outline';
      case 'sports':
      case 'fitness':
        return 'fitness-outline';
      case 'yoga':
        return 'leaf-outline';
      case 'cultural':
      case 'museum':
      case 'tour':
        return 'library-outline';
      case 'concert':
      case 'music':
        return 'musical-notes-outline';
      case 'theater':
      case 'dance':
        return 'film-outline';
      case 'exhibition':
      case 'art':
      case 'photography':
        return 'image-outline';
      case 'team-building':
        return 'people-circle-outline';
      case 'competition':
      case 'quiz':
        return 'trophy-outline';
      case 'award':
        return 'medal-outline';
      case 'opening':
      case 'closing':
        return 'flag-outline';
      case 'gala':
      case 'cocktail':
        return 'wine-outline';
      case 'game':
        return 'game-controller-outline';
      case 'wine-tasting':
        return 'wine-outline';
      case 'technology':
      case 'innovation':
        return 'laptop-outline';
      case 'startup':
        return 'rocket-outline';
      case 'investment':
      case 'business':
        return 'briefcase-outline';
      default:
        return 'calendar-outline';
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'workshop':
        return '#8b5cf6'; // Purple
      case 'seminar':
        return '#06b6d4'; // Cyan
      case 'conference':
        return '#2BB6E8'; // Blue
      case 'panel':
        return '#6366f1'; // Indigo
      case 'networking':
        return '#10b981'; // Emerald
      case 'social':
        return '#f59e0b'; // Amber
      case 'dinner':
      case 'lunch':
      case 'breakfast':
      case 'coffee':
        return '#f97316'; // Orange
      case 'sports':
      case 'fitness':
      case 'yoga':
        return '#ef4444'; // Red
      case 'cultural':
      case 'tour':
      case 'museum':
        return '#84cc16'; // Lime
      case 'concert':
      case 'theater':
      case 'music':
      case 'dance':
        return '#ec4899'; // Pink
      case 'exhibition':
      case 'art':
      case 'photography':
        return '#a855f7'; // Violet
      case 'training':
      case 'team-building':
        return '#14b8a6'; // Teal
      case 'competition':
      case 'quiz':
      case 'game':
        return '#f59e0b'; // Amber
      case 'award':
      case 'opening':
      case 'closing':
      case 'gala':
      case 'cocktail':
        return '#eab308'; // Yellow
      case 'entertainment':
        return '#f43f5e'; // Rose
      case 'cooking':
      case 'wine-tasting':
        return '#f97316'; // Orange
      case 'technology':
      case 'innovation':
      case 'startup':
        return '#06b6d4'; // Cyan
      case 'investment':
      case 'business':
        return '#2BB6E8'; // Blue
      default:
        return primaryColor;
    }
  };

  const getActivityTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      'workshop': 'Atölye Çalışması',
      'seminar': 'Seminer',
      'conference': 'Konferans',
      'panel': 'Panel',
      'networking': 'Networking',
      'social': 'Sosyal Etkinlik',
      'dinner': 'Akşam Yemeği',
      'lunch': 'Öğle Yemeği',
      'breakfast': 'Kahvaltı',
      'coffee': 'Kahve Molası',
      'sports': 'Spor Aktiviteleri',
      'fitness': 'Fitness',
      'yoga': 'Yoga',
      'cultural': 'Kültürel Etkinlik',
      'tour': 'Gezi',
      'museum': 'Müze Ziyareti',
      'concert': 'Konser',
      'theater': 'Tiyatro',
      'exhibition': 'Sergi',
      'training': 'Eğitim',
      'team-building': 'Takım Çalışması',
      'competition': 'Yarışma',
      'award': 'Ödül Töreni',
      'opening': 'Açılış',
      'closing': 'Kapanış',
      'gala': 'Gala',
      'cocktail': 'Kokteyl',
      'entertainment': 'Eğlence',
      'game': 'Oyun',
      'quiz': 'Bilgi Yarışması',
      'photography': 'Fotoğrafçılık',
      'art': 'Sanat',
      'music': 'Müzik',
      'dance': 'Dans',
      'cooking': 'Yemek',
      'wine-tasting': 'Şarap Tadımı',
      'technology': 'Teknoloji',
      'innovation': 'İnovasyon',
      'startup': 'Girişimcilik',
      'investment': 'Yatırım',
      'business': 'İş',
      'other': 'Diğer'
    };
    return typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleActivityPress = (activity: Activity) => {
    Alert.alert(
      activity.name,
      `${activity.description}\n\n📍 ${activity.location}\n📅 ${formatDate(activity.startDate)}\n${activity.price} ₺`,
      [
        { text: 'Kapat', style: 'cancel' },
        ...(activity.requiresRegistration ? [{ text: 'Kayıt Ol', onPress: () => handleRegister(activity) }] : []),
      ]
    );
  };

  const handleRegister = (activity: Activity) => {
    Alert.alert(
      'Kayıt Ol',
      `${activity.name} aktivitesine kayıt olmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Kayıt Ol', onPress: () => {
          // TODO: Implement registration logic
          Alert.alert('Başarılı', 'Aktiviteye başarıyla kayıt oldunuz!');
        }},
      ]
    );
  };

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      style={[styles.activityCard, { backgroundColor: cardBackground, borderColor }]}
      onPress={() => handleActivityPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.activityHeader}>
        <View style={[styles.activityIconContainer, { backgroundColor: backgroundTertiary }]}>
          <Ionicons
            name={getActivityTypeIcon(item.type) as any}
            size={24}
            color={getActivityTypeColor(item.type)}
          />
        </View>
        <View style={styles.activityInfo}>
          <Text style={[styles.activityName, { color: textColor }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.activityType, { color: textSecondary }]}>
            {getActivityTypeLabel(item.type)}
          </Text>
        </View>
        <View style={styles.activityStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.isActive ? successColor : warningColor }
          ]}>
            <Text style={styles.statusText}>
              {item.isActive ? 'Aktif' : 'Pasif'}
            </Text>
          </View>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.activityDescription, { color: textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.activityDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color={textSecondary} />
          <Text style={[styles.detailText, { color: textSecondary }]}>
            {item.location || 'Belirtilmemiş'}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={textSecondary} />
          <Text style={[styles.detailText, { color: textSecondary }]}>
            {formatDate(item.startDate)}
          </Text>
        </View>
      </View>

      <View style={styles.activityFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="people-outline" size={16} color={textSecondary} />
          <Text style={[styles.footerText, { color: textSecondary }]}>
            {item.registeredCount}/{item.capacity || '∞'}
          </Text>
        </View>
        
        <View style={styles.footerItem}>
          <Text style={[styles.footerText, { color: textSecondary }]}>
            {item.price} ₺
          </Text>
        </View>
        
        {item.requiresRegistration && (
          <View style={styles.footerItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color={primaryColor} />
            <Text style={[styles.footerText, { color: primaryColor }]}>
              Kayıt Gerekli
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color={textSecondary} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        Aktiviteler Bulunamadı
      </Text>
      <Text style={[styles.emptyDescription, { color: textSecondary }]}>
        {selectedEvent ? 
          `${selectedEvent.name} etkinliği için henüz aktivite eklenmemiş.` :
          'Lütfen önce bir etkinlik seçin.'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: textSecondary }]}>
          Aktiviteler yükleniyor...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header 
        title="Aktiviteler" 
        subtitle={selectedEvent?.name}
      />

      <FlatList
        data={activities}
        renderItem={renderActivityItem}
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
  activityCard: {
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
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  activityStatus: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  activityDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  activityFooter: {
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
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
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

export default ActivitiesScreen;