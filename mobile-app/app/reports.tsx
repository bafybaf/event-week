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

interface Report {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  category: string;
  isPublic: boolean;
  event?: {
    id: number;
    name: string;
  };
  createdBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const ReportsScreen: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const errorColor = useThemeColor({}, 'error');

  useEffect(() => {
    loadSelectedEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchReports();
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

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await apiService.getReports(selectedEvent?.id) as any;
      setReports(response.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Hata', 'Raporlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const handleReportPress = (report: Report) => {
    Alert.alert('Rapor Detayı', `Seçilen Rapor: ${report.title}`);
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'analytics':
        return 'bar-chart';
      case 'summary':
        return 'document-text';
      case 'feedback':
        return 'chatbubbles';
      case 'performance':
        return 'trending-up';
      case 'financial':
        return 'cash';
      case 'attendance':
        return 'people';
      default:
        return 'document';
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'analytics':
        return primaryColor;
      case 'summary':
        return successColor;
      case 'feedback':
        return warningColor;
      case 'performance':
        return '#8b5cf6';
      case 'financial':
        return '#059669';
      case 'attendance':
        return '#dc2626';
      default:
        return primaryColor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return successColor;
      case 'in_progress':
        return warningColor;
      case 'pending':
        return errorColor;
      case 'draft':
        return textSecondary;
      default:
        return primaryColor;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'pending':
        return 'Beklemede';
      case 'draft':
        return 'Taslak';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return errorColor;
      case 'medium':
        return warningColor;
      case 'low':
        return successColor;
      default:
        return primaryColor;
    }
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
      onPress={() => handleReportPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getReportTypeColor(item.type) + '20' }]}>
          <Ionicons
            name={getReportTypeIcon(item.type) as any}
            size={24}
            color={getReportTypeColor(item.type)}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <Text style={[styles.cardDescription, { color: textSecondary }]} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.reportInfo}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="folder-outline" size={16} color={textSecondary} />
              <Text style={[styles.infoText, { color: textSecondary }]}>
                {item.category}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="flag-outline" size={16} color={getPriorityColor(item.priority)} />
              <Text style={[styles.infoText, { color: getPriorityColor(item.priority) }]}>
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              </Text>
            </View>
          </View>
          
          {item.createdBy && (
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={16} color={textSecondary} />
              <Text style={[styles.infoText, { color: textSecondary }]}>
                {item.createdBy.firstName} {item.createdBy.lastName}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: textSecondary }]}>
            {getStatusText(item.status)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: primaryColor }]}
          onPress={() => handleReportPress(item)}
        >
          <Text style={styles.actionButtonText}>Görüntüle</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color={textSecondary} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        Raporlar Bulunamadı
      </Text>
      <Text style={[styles.emptyDescription, { color: textSecondary }]}>
        {selectedEvent ?
          `${selectedEvent.name} etkinliği için henüz rapor eklenmemiş.` :
          'Lütfen önce bir etkinlik seçin.'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: textSecondary }]}>Raporlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header 
        title="Raporlar" 
        subtitle={selectedEvent?.name}
      />

      <FlatList
        data={reports}
        renderItem={renderReportItem}
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
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 24,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardDetails: {
    marginBottom: 16,
  },
  reportInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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

export default ReportsScreen;