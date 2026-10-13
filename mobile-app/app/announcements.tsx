import {  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl , Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../src/services/apiService';
import { router } from 'expo-router';
import { useThemeColor } from '../hooks/use-theme-color';
import { Header } from '../components/Header';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'update' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  publishDate: string;
  author: string;
  isRead: boolean;
  attachments?: string[];
}

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const loadSelectedEvent = async () => {
    try {
      const eventJson = await AsyncStorage.getItem('selectedEvent');
      if (eventJson) {
        const event = JSON.parse(eventJson);
        setSelectedEvent(event);
        return event;
      }
    } catch (error) {
      console.error('Error loading selected event:', error);
    }
    return null;
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const event = await loadSelectedEvent();
      
      if (!event || !event.id) {
        console.log('No event selected, skipping announcements fetch');
        setAnnouncements([]);
        setFilteredAnnouncements([]);
        return;
      }

      console.log('Fetching announcements for event:', event.id);
      const data = await apiService.getAnnouncements(event.id);
      console.log('Announcements data received:', data);

      // Map backend format to frontend format
      const mappedAnnouncements: Announcement[] = (Array.isArray(data) ? data : []).map((ann: any) => ({
        id: ann.id || '',
        title: ann.title || '',
        content: ann.content || '',
        type: mapBackendTypeToFrontend(ann.type),
        priority: (ann.priority === 'medium' ? 'medium' : ann.priority) || 'medium',
        publishDate: ann.publishedDate || ann.createdAt || '',
        author: ann.authorName || ann.author || 'Unknown',
        isRead: false,
        attachments: ann.attachments || []
      }));

      console.log('Mapped announcements:', mappedAnnouncements);
      setAnnouncements(mappedAnnouncements);
      setFilteredAnnouncements(mappedAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
      setFilteredAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const mapBackendTypeToFrontend = (backendType: string): 'general' | 'urgent' | 'update' | 'reminder' => {
    switch (backendType) {
      case 'info': return 'general';
      case 'warning': return 'urgent';
      case 'success': return 'update';
      case 'error': return 'urgent';
      default: return 'general';
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = announcements;

    if (selectedType) {
      filtered = filtered.filter(announcement => announcement.type === selectedType);
    }

    setFilteredAnnouncements(filtered);
  }, [announcements, selectedType]);

  const getTypeText = (type: string) => {
    switch (type) {
      case 'general': return 'Genel';
      case 'urgent': return 'Acil';
      case 'update': return 'Güncelleme';
      case 'reminder': return 'Hatırlatma';
      default: return 'Bilinmiyor';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'general': return '#6B7280';
      case 'urgent': return '#EF4444';
      case 'update': return '#3B82F6';
      case 'reminder': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Düşük';
      case 'medium': return 'Orta';
      case 'high': return 'Yüksek';
      default: return 'Bilinmiyor';
    }
  };

  const handleMarkAsRead = (announcementId: string) => {
    setAnnouncements(announcements.map(announcement => 
      announcement.id === announcementId 
        ? { ...announcement, isRead: true }
        : announcement
    ));
  };

  const unreadCount = announcements.filter(announcement => !announcement.isRead).length;

  if (loading && announcements.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ marginTop: 12, fontSize: 14, color: textSecondary }}>Duyurular yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header 
        title="Duyurular" 
        subtitle={selectedEvent?.name}
        rightComponent={
          unreadCount > 0 ? (
            <View style={[styles.unreadBadge, { backgroundColor: primaryColor }]}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          ) : undefined
        }
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >

        <View style={[styles.filters, { backgroundColor }]}>
          <TouchableOpacity
            style={[
              styles.filterButton, 
              { backgroundColor: cardBackground, borderColor },
              selectedType === '' && [styles.filterButtonActive, { backgroundColor: primaryColor }]
            ]}
            onPress={() => setSelectedType('')}
          >
            <Text style={[
              styles.filterText, 
              { color: selectedType === '' ? '#ffffff' : textSecondary }
            ]}>
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton, 
              { backgroundColor: cardBackground, borderColor },
              selectedType === 'urgent' && [styles.filterButtonActive, { backgroundColor: primaryColor }]
            ]}
            onPress={() => setSelectedType('urgent')}
          >
            <Text style={[
              styles.filterText, 
              { color: selectedType === 'urgent' ? '#ffffff' : textSecondary }
            ]}>
              Acil
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton, 
              { backgroundColor: cardBackground, borderColor },
              selectedType === 'update' && [styles.filterButtonActive, { backgroundColor: primaryColor }]
            ]}
            onPress={() => setSelectedType('update')}
          >
            <Text style={[
              styles.filterText, 
              { color: selectedType === 'update' ? '#ffffff' : textSecondary }
            ]}>
              Güncelleme
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton, 
              { backgroundColor: cardBackground, borderColor },
              selectedType === 'reminder' && [styles.filterButtonActive, { backgroundColor: primaryColor }]
            ]}
            onPress={() => setSelectedType('reminder')}
          >
            <Text style={[
              styles.filterText, 
              { color: selectedType === 'reminder' ? '#ffffff' : textSecondary }
            ]}>
              Hatırlatma
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.announcementsList}>
          {filteredAnnouncements.map((announcement) => (
            <TouchableOpacity 
              key={announcement.id} 
              style={[
                styles.announcementCard,
                { backgroundColor: cardBackground, borderColor },
                !announcement.isRead && [styles.unreadCard, { borderLeftColor: primaryColor }]
              ]}
              onPress={() => handleMarkAsRead(announcement.id)}
            >
              <View style={styles.announcementHeader}>
                <View style={styles.announcementInfo}>
                  <Text style={[
                    styles.announcementTitle,
                    { color: textColor },
                    !announcement.isRead && styles.unreadTitle
                  ]}>
                    {announcement.title}
                  </Text>
                  <Text style={[styles.announcementContent, { color: textSecondary }]}>{announcement.content}</Text>
                </View>
                {!announcement.isRead && (
                  <View style={[styles.unreadDot, { backgroundColor: primaryColor }]} />
                )}
              </View>

              <View style={styles.announcementMeta}>
                <View style={styles.metaRow}>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(announcement.type) }]}>
                    <Text style={styles.typeText}>{getTypeText(announcement.type)}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority) }]}>
                    <Text style={styles.priorityText}>{getPriorityText(announcement.priority)}</Text>
                  </View>
                </View>
                
                <View style={styles.metaRow}>
                  <View style={styles.authorInfo}>
                    <Ionicons name="person" size={14} color={textSecondary} />
                    <Text style={[styles.authorText, { color: textSecondary }]}>{announcement.author}</Text>
                  </View>
                  <Text style={[styles.dateText, { color: textSecondary }]}>{announcement.publishDate}</Text>
                </View>
              </View>

              {announcement.attachments && announcement.attachments.length > 0 && (
                <View style={[styles.attachmentsContainer, { borderTopColor: borderColor }]}>
                  <Text style={[styles.attachmentsLabel, { color: textSecondary }]}>Ekler:</Text>
                  <View style={styles.attachmentsList}>
                    {announcement.attachments.map((attachment, index) => (
                      <View key={index} style={[styles.attachmentTag, { backgroundColor: backgroundColor }]}>
                        <Ionicons name="document" size={12} color={textSecondary} />
                        <Text style={[styles.attachmentText, { color: textSecondary }]}>{attachment}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {filteredAnnouncements.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textColor }]}>Duyuru bulunamadı</Text>
            <Text style={[styles.emptySubtext, { color: textSecondary }]}>
              Duyurular burada görünecek
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonActive: {
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  announcementsList: {
    padding: 16,
  },
  announcementCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  unreadCard: {
    borderLeftWidth: 4,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  announcementInfo: {
    flex: 1,
    marginRight: 12,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  announcementContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  announcementMeta: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    marginLeft: 4,
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
  },
  attachmentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  attachmentsLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attachmentText: {
    marginLeft: 4,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});



