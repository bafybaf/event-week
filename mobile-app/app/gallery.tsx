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
  Dimensions,
  Platform,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { AppVideo } from '../components/AppVideo';
import { useThemeColor } from '../hooks/use-theme-color';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../src/services/apiService';
import { Header } from '../components/Header';
import { API_BASE_URL } from '../src/config/apiConfig';

const { width } = Dimensions.get('window');
const imageSize = (width - 48) / 2; // 2 columns with padding

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  category: string;
  tags: string;
  photographer: string;
  takenDate: string;
  isPublic: boolean;
  isFeatured: boolean;
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

const GalleryScreen: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'category'>('category');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');

  useEffect(() => {
    loadSelectedEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchGalleryItems();
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

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      console.log('Fetching gallery items for event:', selectedEvent?.id);
      const galleryData = await apiService.getGalleryItems(selectedEvent?.id) as any;
      console.log('Gallery data received:', galleryData);
      
      const itemsList = Array.isArray(galleryData) ? galleryData : [];
      console.log('Gallery items count:', itemsList.length);
      
      // Map backend fields to frontend format
      const mappedItems = itemsList.map((item: any) => ({
        id: item.id,
        title: item.title || 'Başlıksız',
        description: item.description || '',
        imageUrl: item.imageUrl || item.image_url || '',
        thumbnailUrl: item.thumbnailUrl || item.thumbnail_url || item.imageUrl || item.image_url || '',
        category: item.category || 'general',
        tags: item.tags || '',
        photographer: item.photographer || (item.uploader ? `${item.uploader.firstName || ''} ${item.uploader.lastName || ''}`.trim() : '') || 'Bilinmiyor',
        takenDate: item.takenDate || item.taken_date || item.createdAt || item.created_at || new Date().toISOString(),
        isPublic: item.isPublic !== undefined ? item.isPublic : (item.is_public !== undefined ? item.is_public : true),
        isFeatured: item.isFeatured !== undefined ? item.isFeatured : (item.is_featured !== undefined ? item.is_featured : false),
        viewCount: item.viewCount !== undefined ? item.viewCount : (item.view_count !== undefined ? item.view_count : 0),
        event: item.event || (item.eventId ? { id: item.eventId, name: '' } : undefined),
        uploader: item.uploader
      }));
      
      console.log('Mapped gallery items:', mappedItems.length);
      setGalleryItems(mappedItems);
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      Alert.alert('Hata', 'Galeri yüklenirken bir hata oluştu');
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGalleryItems();
    setRefreshing(false);
  };

  const categories = [
    { value: 'general', label: 'Genel', icon: 'folder-outline', emoji: '📁' },
    { value: 'speakers', label: 'Konuşmacılar', icon: 'mic-outline', emoji: '🎤' },
    { value: 'activities', label: 'Aktiviteler', icon: 'target-outline', emoji: '🎯' },
    { value: 'venue', label: 'Mekan', icon: 'business-outline', emoji: '🏢' },
    { value: 'food', label: 'Yemek', icon: 'restaurant-outline', emoji: '🍽️' },
    { value: 'networking', label: 'Networking', icon: 'people-outline', emoji: '🤝' },
    { value: 'awards', label: 'Ödüller', icon: 'trophy-outline', emoji: '🏆' },
    { value: 'sponsors', label: 'Sponsorlar', icon: 'briefcase-outline', emoji: '💼' },
    { value: 'team', label: 'Ekip', icon: 'people-outline', emoji: '👥' },
    { value: 'behind_scenes', label: 'Sahne Arkası', icon: 'film-outline', emoji: '🎬' },
    { value: 'opening', label: 'Açılış', icon: 'sparkles-outline', emoji: '🎉' },
    { value: 'closing', label: 'Kapanış', icon: 'balloon-outline', emoji: '🎊' },
    { value: 'workshop', label: 'Atölye', icon: 'construct-outline', emoji: '🔧' },
    { value: 'panel', label: 'Panel', icon: 'chatbubbles-outline', emoji: '💬' }
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || 'image-outline';
  };

  const getCategoryEmoji = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.emoji || '📁';
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'general': '#6b7280',
      'speakers': '#2BB6E8',
      'activities': '#10b981',
      'venue': '#8b5cf6',
      'food': '#f59e0b',
      'networking': '#ec4899',
      'awards': '#eab308',
      'sponsors': '#6366f1',
      'team': '#ef4444',
      'behind_scenes': '#6b7280',
      'opening': '#06b6d4',
      'closing': '#14b8a6',
      'workshop': '#f59e0b',
      'panel': '#8b5cf6'
    };
    return colorMap[category] || primaryColor;
  };

  // Kategorilere göre grupla
  const groupedByCategory = categories.reduce((acc, category) => {
    const items = galleryItems.filter(item => item.category === category.value);
    if (items.length > 0) {
      acc[category.value] = {
        category,
        items
      };
    }
    return acc;
  }, {} as Record<string, { category: typeof categories[0], items: GalleryItem[] }>);

  const toggleCategory = (categoryValue: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryValue)) {
      newExpanded.delete(categoryValue);
    } else {
      newExpanded.add(categoryValue);
    }
    setExpandedCategories(newExpanded);
  };

  const isVideoFile = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const getFileType = (url: string) => {
    if (!url) return 'image';
    if (isVideoFile(url)) return 'video';
    return 'image';
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

  const handleImagePress = (item: GalleryItem) => {
    Alert.alert(
      item.title,
      `${item.description || ''}\n\n📸 ${item.photographer || 'Bilinmiyor'}\n📅 ${formatDate(item.takenDate)}\n👁️ ${item.viewCount || 0} görüntüleme`,
      [
        { text: 'Kapat', style: 'cancel' },
        { text: 'Tam Boyut', onPress: () => handleFullSize(item) },
      ]
    );
  };

  const handleFullSize = (item: GalleryItem) => {
    setSelectedImage(item);
    setShowFullScreen(true);
  };

  // Helper function to ensure full URL with correct IP for native platforms
  const getImageUrl = (url: string | undefined | null): string | null => {
    if (!url) return null;
    
    // Get base URL without /api
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    // If URL is relative, prepend base URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
      return url;
    }
    
    // If URL contains localhost or 127.0.0.1, replace with device IP for native platforms
    if (Platform.OS !== 'web' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
      // Extract path from URL (everything after the host)
      const pathMatch = url.match(/https?:\/\/[^\/]+(\/.*)$/);
      if (pathMatch) {
        const path = pathMatch[1];
        url = `${baseUrl}${path}`;
        console.log('Image URL converted:', url);
      } else {
        // Simple replace fallback
        url = url.replace(/https?:\/\/localhost:(\d+)/, baseUrl);
        url = url.replace(/https?:\/\/127\.0\.0\.1:(\d+)/, baseUrl);
      }
    }
    
    return url;
  };

  const renderGridItem = ({ item }: { item: GalleryItem }) => {
    const imageUrl = getImageUrl(item.thumbnailUrl || item.imageUrl);
    const fileType = getFileType(item.imageUrl || item.thumbnailUrl);
    const videoUrl = getImageUrl(item.imageUrl || item.thumbnailUrl);
    
    return (
      <TouchableOpacity
        style={[styles.gridItem, { backgroundColor: cardBackground, borderColor }]}
        onPress={() => {
          if (fileType === 'video') {
            setSelectedImage(item);
            setShowFullScreen(true);
          } else {
            handleImagePress(item);
          }
        }}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {fileType === 'video' ? (
            <View style={styles.videoThumbnail}>
              {videoUrl ? (
                <AppVideo
                  uri={videoUrl}
                  style={styles.gridImage}
                  contentFit="cover"
                  shouldPlay={false}
                  nativeControls={false}
                />
              ) : (
                <View style={[styles.gridImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="videocam-outline" size={32} color="#fff" />
                </View>
              )}
              <View style={styles.playButtonOverlay}>
                <Ionicons name="play-circle" size={40} color="#fff" />
              </View>
            </View>
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.gridImage}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              onError={(error) => {
                console.error('Image load error:', error, imageUrl);
              }}
            />
          ) : (
            <View style={[styles.gridImage, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={32} color={textSecondary} />
            </View>
          )}
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="#ffffff" />
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Ionicons
              name={getCategoryIcon(item.category) as any}
              size={12}
              color="#ffffff"
            />
          </View>
        </View>
        
        <View style={styles.gridInfo}>
          <Text style={[styles.gridTitle, { color: textColor }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.gridMeta}>
            <Ionicons name="eye-outline" size={12} color={textSecondary} />
            <Text style={[styles.viewCount, { color: textSecondary }]}>
              {item.viewCount || 0}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: GalleryItem }) => {
    const imageUrl = getImageUrl(item.thumbnailUrl || item.imageUrl);
    const fileType = getFileType(item.imageUrl || item.thumbnailUrl);
    const videoUrl = getImageUrl(item.imageUrl || item.thumbnailUrl);
    
    return (
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: cardBackground, borderColor }]}
        onPress={() => {
          if (fileType === 'video') {
            setSelectedImage(item);
            setShowFullScreen(true);
          } else {
            handleImagePress(item);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.listImageContainer}>
          {fileType === 'video' ? (
            <View style={styles.videoThumbnail}>
              {videoUrl ? (
                <AppVideo
                  uri={videoUrl}
                  style={styles.listImage}
                  contentFit="cover"
                  shouldPlay={false}
                  nativeControls={false}
                />
              ) : (
                <View style={[styles.listImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="videocam-outline" size={24} color="#fff" />
                </View>
              )}
              <View style={styles.playButtonOverlay}>
                <Ionicons name="play-circle" size={32} color="#fff" />
              </View>
            </View>
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.listImage}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              onError={(error) => {
                console.error('Image load error:', error, imageUrl);
              }}
            />
          ) : (
            <View style={[styles.listImage, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={24} color={textSecondary} />
            </View>
          )}
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="#ffffff" />
            </View>
          )}
        </View>
        
        <View style={styles.listInfo}>
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[
            styles.categoryBadgeLarge,
            { backgroundColor: getCategoryColor(item.category) }
          ]}>
            <Ionicons
              name={getCategoryIcon(item.category) as any}
              size={14}
              color="#ffffff"
            />
            <Text style={styles.categoryText}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={[styles.listDescription, { color: textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.listMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={14} color={textSecondary} />
            <Text style={[styles.metaText, { color: textSecondary }]}>
              {item.photographer || 'Bilinmiyor'}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={textSecondary} />
            <Text style={[styles.metaText, { color: textSecondary }]}>
              {formatDate(item.takenDate)}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={14} color={textSecondary} />
            <Text style={[styles.metaText, { color: textSecondary }]}>
              {item.viewCount || 0}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="images-outline" size={64} color={textSecondary} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        Galeri Boş
      </Text>
      <Text style={[styles.emptyDescription, { color: textSecondary }]}>
        {selectedEvent ? 
          `${selectedEvent.name} etkinliği için henüz fotoğraf eklenmemiş.` :
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
          Galeri yükleniyor...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      {/* Header removed for detail pages as requested */}
      <Header
        title="Galeri"
        subtitle={selectedEvent?.name}
        rightComponent={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.viewModeButton}
              onPress={() => setViewMode('category')}
            >
              <Ionicons
                name="folder-outline"
                size={24}
                color={viewMode === 'category' ? primaryColor : textColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewModeButton}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons
                name="grid-outline"
                size={24}
                color={viewMode === 'grid' ? primaryColor : textColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewModeButton}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list-outline"
                size={24}
                color={viewMode === 'list' ? primaryColor : textColor}
              />
            </TouchableOpacity>
          </View>
        }
      />

      {viewMode === 'category' ? (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[primaryColor]}
              tintColor={primaryColor}
            />
          }
        >
          {Object.keys(groupedByCategory).length === 0 ? (
            renderEmptyState()
          ) : (
            Object.values(groupedByCategory).map(({ category, items }) => (
              <View key={category.value} style={[styles.categoryCard, { backgroundColor: cardBackground, borderColor }]}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Text style={styles.categoryEmoji}>{getCategoryEmoji(category.value)}</Text>
                    <View>
                      <Text style={[styles.categoryTitle, { color: textColor }]}>
                        {category.label}
                      </Text>
                      <Text style={[styles.categoryCount, { color: textSecondary }]}>
                        {items.length} öğe
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={expandedCategories.has(category.value) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={textSecondary}
                  />
                </TouchableOpacity>
                
                {expandedCategories.has(category.value) && (
                  <View style={styles.categoryContent}>
                    <View style={styles.categoryGrid}>
                      {items.map((item) => {
                        const fileType = getFileType(item.imageUrl || item.thumbnailUrl);
                        const imageUrl = getImageUrl(item.thumbnailUrl || item.imageUrl);
                        
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.categoryItem}
                            onPress={() => {
                              if (fileType === 'video') {
                                setSelectedImage(item);
                                setShowFullScreen(true);
                              } else {
                                handleFullSize(item);
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={styles.categoryItemImageContainer}>
                              {fileType === 'video' ? (
                                <View style={styles.videoThumbnail}>
                                  {imageUrl ? (
                                    <AppVideo
                                      uri={imageUrl}
                                      style={styles.categoryItemImage}
                                      contentFit="cover"
                                      shouldPlay={false}
                                      nativeControls={false}
                                    />
                                  ) : (
                                    <View style={[styles.categoryItemImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                                      <Ionicons name="videocam-outline" size={32} color="#fff" />
                                    </View>
                                  )}
                                  <View style={styles.playButtonOverlay}>
                                    <Ionicons name="play-circle" size={40} color="#fff" />
                                  </View>
                                </View>
                              ) : (
                                imageUrl ? (
                                  <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.categoryItemImage}
                                    contentFit="cover"
                                    transition={200}
                                  />
                                ) : (
                                  <View style={[styles.categoryItemImage, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="image-outline" size={24} color={textSecondary} />
                                  </View>
                                )
                              )}
                            </View>
                            <Text style={[styles.categoryItemTitle, { color: textColor }]} numberOfLines={1}>
                              {item.title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={galleryItems}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
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
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
        />
      )}

      {/* Full Screen Image Modal */}
      {showFullScreen && selectedImage && (
        <View style={styles.fullScreenModal}>
          <SafeAreaView style={styles.fullScreenContainer} edges={['top', 'bottom']}>
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowFullScreen(false);
                  setSelectedImage(null);
                }}
              >
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.fullScreenImageContainer}>
              {getFileType(selectedImage.imageUrl || selectedImage.thumbnailUrl) === 'video' ? (
                <AppVideo
                  uri={getImageUrl(selectedImage.imageUrl || selectedImage.thumbnailUrl) || ''}
                  style={styles.fullScreenVideo}
                  contentFit="contain"
                  shouldPlay
                />
              ) : (
                <Image
                  source={{ uri: getImageUrl(selectedImage.imageUrl || selectedImage.thumbnailUrl) || '' }}
                  style={styles.fullScreenImage}
                  contentFit="contain"
                  transition={200}
                />
              )}
            </View>

            <View style={styles.fullScreenInfo}>
              <Text style={styles.fullScreenTitle}>{selectedImage.title}</Text>
              {selectedImage.description && (
                <Text style={styles.fullScreenDescription}>{selectedImage.description}</Text>
              )}
              <View style={styles.fullScreenMeta}>
                <View style={styles.fullScreenMetaItem}>
                  <Ionicons name="person-outline" size={16} color={textSecondary} />
                  <Text style={styles.fullScreenMetaText}>{selectedImage.photographer || 'Bilinmiyor'}</Text>
                </View>
                <View style={styles.fullScreenMetaItem}>
                  <Ionicons name="calendar-outline" size={16} color={textSecondary} />
                  <Text style={styles.fullScreenMetaText}>{formatDate(selectedImage.takenDate)}</Text>
                </View>
                <View style={styles.fullScreenMetaItem}>
                  <Ionicons name="eye-outline" size={16} color={textSecondary} />
                  <Text style={styles.fullScreenMetaText}>{selectedImage.viewCount || 0} görüntüleme</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
      )}
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
  viewModeButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  // Grid styles
  gridItem: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
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
  imageContainer: {
    position: 'relative',
    height: imageSize,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 4,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  gridInfo: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  // List styles
  listItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
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
  listImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listInfo: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  categoryBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  listDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  listMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
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
  // Full Screen Modal Styles
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  fullScreenInfo: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  fullScreenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  fullScreenDescription: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
    marginBottom: 16,
  },
  fullScreenMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fullScreenMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  fullScreenMetaText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryContent: {
    padding: 16,
    paddingTop: 0,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryItem: {
    width: (width - 48 - 12) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  categoryItemImageContainer: {
    position: 'relative',
    width: '100%',
    height: (width - 48 - 12) / 2,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  categoryItemImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryItemTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default GalleryScreen;