import {  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl , Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../src/services/apiService';
import { useThemeColor } from '../hooks/use-theme-color';
import { Header } from '../components/Header';

interface Speaker {
  id: string;
  eventId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  bio: string;
  expertise: string;
  profileImage?: string;
  email?: string;
  phone?: string;
  isFeatured: boolean;
  program?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    room?: string;
  };
}

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
}

export default function SpeakersScreen() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [favoriteSpeakers, setFavoriteSpeakers] = useState<Set<string>>(new Set());
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    loadCurrentEvent();
    loadFavoriteSpeakers();
  }, []);

  const loadCurrentEvent = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      if (eventData) {
        const event = JSON.parse(eventData);
        setCurrentEvent(event);
        loadSpeakers(event.id);
      }
    } catch (error) {
      console.error('Error loading current event:', error);
    }
  };

  const loadFavoriteSpeakers = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favoriteSpeakers');
      if (favorites) {
        const favoriteIds = JSON.parse(favorites);
        setFavoriteSpeakers(new Set(favoriteIds));
      }
    } catch (error) {
      console.error('Error loading favorite speakers:', error);
    }
  };

  const saveFavoriteSpeakers = async (favorites: Set<string>) => {
    try {
      await AsyncStorage.setItem('favoriteSpeakers', JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error('Error saving favorite speakers:', error);
    }
  };

  const toggleFavorite = async (speakerId: string) => {
    const newFavorites = new Set(favoriteSpeakers);
    if (newFavorites.has(speakerId)) {
      newFavorites.delete(speakerId);
      Alert.alert('Başarılı', 'Konuşmacı favorilerden çıkarıldı');
    } else {
      newFavorites.add(speakerId);
      Alert.alert('Başarılı', 'Konuşmacı favorilere eklendi');
    }
    setFavoriteSpeakers(newFavorites);
    await saveFavoriteSpeakers(newFavorites);
  };

  const handleContactPress = (speaker: Speaker) => {
    if (speaker.email) {
      const emailUrl = `mailto:${speaker.email}?subject=${encodeURIComponent(`${currentEvent?.name || 'Etkinlik'} - İletişim`)}`;
      Linking.canOpenURL(emailUrl).then(supported => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert('Hata', 'E-posta uygulaması bulunamadı');
        }
      }).catch(() => {
        Alert.alert('Hata', 'E-posta gönderilemedi');
      });
    } else if (speaker.phone) {
      const phoneUrl = `tel:${speaker.phone}`;
      Linking.canOpenURL(phoneUrl).then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Hata', 'Telefon uygulaması bulunamadı');
        }
      }).catch(() => {
        Alert.alert('Hata', 'Telefon aranamadı');
      });
    } else {
      Alert.alert('Bilgi', 'Bu konuşmacının iletişim bilgisi bulunmuyor');
    }
  };

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSpeakers = async (eventId: string) => {
    try {
      setLoading(true);
      const speakersData = await apiService.getSpeakers(eventId) as any;
      const speakersList = Array.isArray(speakersData) ? speakersData : [];
      
      // Programs'ı çek
      const programsData = await apiService.getPrograms(eventId);
      const programsList = Array.isArray(programsData) ? programsData : [];
      
      // Her speaker için program bilgisini bul
      const formatted: Speaker[] = speakersList.map((s: any) => {
        // Bu speaker'ın yer aldığı programı bul
        const speakerProgram = programsList.find((p: any) => 
          Array.isArray(p.speakers) && 
          p.speakers.some((sp: any) => sp.id === s.id || String(sp.id) === String(s.id))
        );
        
        return {
          id: s.id?.toString() || String(s.id),
          eventId: s.eventId?.toString() || eventId,
          userId: s.userId || s.user?.id,
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          title: s.title || '',
          company: s.company || '',
          bio: s.bio || '',
          expertise: Array.isArray(s.expertise) ? s.expertise.join(', ') : s.expertise || '',
          profileImage: s.profileImage,
          email: s.email || s.user?.email,
          phone: s.phone,
          isFeatured: s.isKeynote || false,
          program: speakerProgram ? {
            id: speakerProgram.id,
            title: speakerProgram.title || '',
            startTime: speakerProgram.startTime || '',
            endTime: speakerProgram.endTime || '',
            location: speakerProgram.location || speakerProgram.room || '',
            room: speakerProgram.room || '',
          } : undefined,
        };
      });
      setSpeakers(formatted);
      setFilteredSpeakers(formatted);
    } catch (error) {
      console.error('Error loading speakers:', error);
      setSpeakers([]);
      setFilteredSpeakers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!currentEvent) return;
    setRefreshing(true);
    await loadSpeakers(currentEvent.id);
    setRefreshing(false);
  };


  useEffect(() => {
    let filtered = speakers;

    if (searchQuery) {
      filtered = filtered.filter(speaker =>
        `${speaker.firstName} ${speaker.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        speaker.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        speaker.expertise.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (showFeaturedOnly) {
      filtered = filtered.filter(speaker => speaker.isFeatured);
    }

    setFilteredSpeakers(filtered);
  }, [speakers, searchQuery, showFeaturedOnly]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header 
        title="Konuşmacılar" 
        subtitle={currentEvent?.name}
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
              showFeaturedOnly && [styles.filterButtonActive, { backgroundColor: primaryColor }]
            ]}
            onPress={() => setShowFeaturedOnly(!showFeaturedOnly)}
          >
            <Ionicons name="star" size={16} color={showFeaturedOnly ? "#FFFFFF" : primaryColor} />
            <Text style={[
              styles.filterText, 
              { color: showFeaturedOnly ? "#FFFFFF" : textSecondary }
            ]}>
              Öne Çıkanlar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.speakersList}>
          {filteredSpeakers.map((speaker) => {
            return (
              <View key={speaker.id} style={[styles.speakerCard, { backgroundColor: cardBackground, borderColor }]}>
                <View style={styles.speakerHeader}>
                  <View style={styles.speakerImageContainer}>
                    {speaker.profileImage ? (
                      <Image source={{ uri: speaker.profileImage }} style={styles.speakerImage} />
                    ) : (
                      <View style={[styles.speakerImagePlaceholder, { backgroundColor: backgroundColor }]}>
                        <Ionicons name="person" size={24} color={textSecondary} />
                      </View>
                    )}
                    {speaker.isFeatured && (
                      <View style={styles.featuredBadge}>
                        <Ionicons name="star" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.speakerInfo}>
                    <Text style={[styles.speakerName, { color: textColor }]}>
                      {speaker.firstName} {speaker.lastName}
                    </Text>
                    <Text style={[styles.speakerTitle, { color: textSecondary }]}>{speaker.title}</Text>
                    <Text style={[styles.speakerCompany, { color: textSecondary }]}>{speaker.company}</Text>
                  </View>
                </View>
                <Text style={[styles.speakerBio, { color: textSecondary }]}>{speaker.bio}</Text>
                <View style={styles.expertiseContainer}>
                  <Text style={[styles.expertiseLabel, { color: textColor }]}>Uzmanlık Alanları:</Text>
                  <Text style={[styles.expertise, { color: textSecondary }]}>{speaker.expertise}</Text>
                </View>
                {speaker.program && (
                  <View style={[styles.programInfo, { borderColor, backgroundColor }]}>
                    <View style={styles.programHeader}>
                      <Ionicons name="calendar" size={16} color={primaryColor} />
                      <Text style={[styles.programTitle, { color: textColor }]}>
                        {speaker.program.title}
                      </Text>
                    </View>
                    <View style={styles.programDetails}>
                      {speaker.program.startTime && (
                        <View style={styles.programDetailRow}>
                          <Ionicons name="time-outline" size={14} color={textSecondary} />
                          <Text style={[styles.programDetailText, { color: textSecondary }]}>
                            {new Date(speaker.program.startTime).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })} {new Date(speaker.program.startTime).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {new Date(speaker.program.endTime).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      )}
                      {speaker.program.location && (
                        <View style={styles.programDetailRow}>
                          <Ionicons name="location-outline" size={14} color={textSecondary} />
                          <Text style={[styles.programDetailText, { color: textSecondary }]}>
                            {speaker.program.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                <View style={styles.speakerActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => toggleFavorite(speaker.id)}
                  >
                    <Ionicons 
                      name={favoriteSpeakers.has(speaker.id) ? "heart" : "heart-outline"} 
                      size={16} 
                      color={favoriteSpeakers.has(speaker.id) ? primaryColor : textSecondary} 
                    />
                    <Text style={[
                      styles.actionText, 
                      { color: favoriteSpeakers.has(speaker.id) ? primaryColor : textSecondary }
                    ]}>
                      Favori
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleContactPress(speaker)}
                  >
                    <Ionicons name="mail-outline" size={16} color={textSecondary} />
                    <Text style={[styles.actionText, { color: textSecondary }]}>İletişim</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {filteredSpeakers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textColor }]}>Konuşmacı bulunamadı</Text>
            <Text style={[styles.emptySubtext, { color: textSecondary }]}>
              Arama kriterlerinizi değiştirmeyi deneyin
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
  scrollView: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonActive: {
    borderColor: 'transparent',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  speakersList: {
    padding: 16,
  },
  speakerCard: {
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
  speakerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  speakerImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  speakerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  speakerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  speakerTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  speakerCompany: {
    fontSize: 14,
    fontWeight: '500',
  },
  speakerBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  expertiseContainer: {
    marginBottom: 16,
  },
  expertiseLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  expertise: {
    fontSize: 14,
    fontWeight: '500',
  },
  programInfo: {
    marginTop: 12,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  programDetails: {
    marginTop: 4,
  },
  programDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  programDetailText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  speakerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
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
