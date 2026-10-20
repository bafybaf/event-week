import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image as RNImage,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { AppVideo } from '../../components/AppVideo';
import { ZoomableImage } from '../../components/ZoomableImage';
import { FeedCarousel, type FeedSlide } from '../../components/FeedCarousel';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from 'expo-router';
import { Header } from '../../components/Header';
import { AppTopBar } from '../../components/AppTopBar';
import ImageCropper from '../../components/ImageCropper';
import { useThemeColor } from '../../hooks/use-theme-color';
import { API_BASE_URL, fixImageUrl } from '../../src/config/apiConfig';
import apiService from '../../src/services/apiService';
import { getSessionToken, isAuthError } from '../../src/utils/session';
import { logoutAndReset } from '../../src/utils/logout';

type FeedKind = 'post' | 'story';
type MediaType = 'image' | 'video';

interface FeedAuthor {
  id?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

interface FeedItem {
  id: string;
  eventId: string;
  authorId: string;
  kind: FeedKind;
  caption?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  media?: Array<{ url?: string; type?: MediaType; mediaUrl?: string; mediaType?: MediaType }>;
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  createdAt?: string;
  author?: FeedAuthor;
}

interface FeedComment {
  id: string;
  text: string;
  userId: string;
  createdAt?: string;
  user?: FeedAuthor;
}

const MAX_POST_MEDIA = 10;

function slidesFor(item: FeedItem): FeedSlide[] {
  const source = Array.isArray(item.media) && item.media.length
    ? item.media
    : item.mediaUrl
      ? [{ url: item.mediaUrl, type: item.mediaType }]
      : [];
  return source
    .map((entry) => ({
      url: fixImageUrl(entry.url || entry.mediaUrl) || '',
      type: (entry.type || entry.mediaType || 'image') as MediaType,
    }))
    .filter((entry) => !!entry.url);
}

function FeedMedia({ item, onOpen }: { item: FeedItem; onOpen: (index: number) => void }) {
  const screenW = Dimensions.get('window').width - 24;
  return <FeedCarousel media={slidesFor(item)} width={screenW} onOpen={onOpen} />;
}

const displayName = (author?: FeedAuthor) =>
  `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || 'Katılımcı';

const initials = (author?: FeedAuthor) => {
  const first = author?.firstName?.[0] || '';
  const last = author?.lastName?.[0] || '';
  return (first + last).toUpperCase() || 'K';
};

export default function FeedScreen() {
  const [stories, setStories] = useState<FeedItem[]>([]);
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventId, setEventId] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [features, setFeatures] = useState({ postsEnabled: true, storiesEnabled: true, commentsEnabled: true });
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<FeedKind>('post');
  const [caption, setCaption] = useState('');
  const [pickedList, setPickedList] = useState<{ uri: string; type: MediaType; name: string }[]>([]);
  const [cropSource, setCropSource] = useState<{ uri: string; width: number; height: number; name: string } | null>(null);
  const [viewerItem, setViewerItem] = useState<FeedItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [storyIndex, setStoryIndex] = useState(-1);
  const [commentItem, setCommentItem] = useState<FeedItem | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [actionItem, setActionItem] = useState<FeedItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const leavingRef = useRef(false);

  const leaveToLogin = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    await logoutAndReset();
  };

  const fetchFeed = async (scopedEventId?: string) => {
    if (leavingRef.current) return;

    const token = await getSessionToken();
    if (!token) {
      await leaveToLogin();
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [data, appFeatures] = await Promise.all([
        apiService.getFeed(scopedEventId || eventId || undefined),
        apiService.getPublicFeatures(),
      ]);
      setStories(data.stories || []);
      setPosts(data.posts || []);
      setFeatures(appFeatures);
    } catch (error: any) {
      if (isAuthError(error)) {
        await leaveToLogin();
      } else {
        console.error('Feed load error:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      const [eventData, userData] = await Promise.all([
        AsyncStorage.getItem('selectedEvent'),
        AsyncStorage.getItem('currentUser'),
      ]);
      const parsedEvent = eventData ? JSON.parse(eventData) : null;
      if (parsedEvent?.id) {
        setEventId(parsedEvent.id);
      }
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
      await fetchFeed(parsedEvent?.id);
    };
    boot();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (eventId) {
        fetchFeed();
      }
    }, [eventId])
  );

  const storyGroups = useMemo(() => {
    const groups: { authorId: string; author?: FeedAuthor; items: FeedItem[] }[] = [];
    const map = new Map<string, { authorId: string; author?: FeedAuthor; items: FeedItem[] }>();
    stories.forEach((story) => {
      const key = String(story.authorId);
      if (!map.has(key)) {
        const group = { authorId: key, author: story.author, items: [] as FeedItem[] };
        map.set(key, group);
        groups.push(group);
      }
      map.get(key)!.items.push(story);
    });
    return groups;
  }, [stories]);

  const flatStories = storyGroups.flatMap((group) => group.items);
  const activeStory = storyIndex >= 0 ? flatStories[storyIndex] : null;

  const appendPicked = (items: { uri: string; type: MediaType; name: string }[]) => {
    setPickedList((prev) => {
      const limit = composerKind === 'story' ? 1 : MAX_POST_MEDIA;
      const base = composerKind === 'story' ? [] : prev;
      return [...base, ...items].slice(0, limit);
    });
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Galeri erişimi olmadan paylaşım yapılamaz.');
      return;
    }
    const multiple = composerKind === 'post';
    const mediaTypes =
      (ImagePicker as any).MediaTypeOptions?.All ||
      ['images', 'videos'];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? MAX_POST_MEDIA : 1,
    });
    if (result.canceled || !result.assets?.length) return;
    const assets = result.assets.map((asset, index) => {
      const type: MediaType = asset.type === 'video' ? 'video' : 'image';
      const name = asset.fileName || `feed-${Date.now()}-${index}.${type === 'video' ? 'mp4' : 'jpg'}`;
      return { asset, type, name };
    });
    if (assets.length === 1 && assets[0].type === 'image') {
      const { asset, name } = assets[0];
      const openCrop = (width: number, height: number) => {
        setCropSource({ uri: asset.uri, width, height, name });
      };
      if (asset.width && asset.height) {
        openCrop(asset.width, asset.height);
        return;
      }
      RNImage.getSize(
        asset.uri,
        (width, height) => openCrop(width, height),
        () => appendPicked([{ uri: asset.uri, type: 'image', name }])
      );
      return;
    }
    appendPicked(assets.map(({ asset, type, name }) => ({ uri: asset.uri, type, name })));
  };

  const uploadMedia = async (picked: { uri: string; type: MediaType; name: string }) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Oturum bulunamadı');

    if (Platform.OS === 'web') {
      const formData = new FormData();
      const response = await fetch(picked.uri);
      const blob = await response.blob();
      formData.append('media', blob, picked.name);
      const uploadResponse = await fetch(`${API_BASE_URL}/upload/feed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await uploadResponse.json();
      if (!uploadResponse.ok || !data.success) {
        throw new Error(data.error || 'Yükleme başarısız');
      }
      return data.data;
    }

    const uploadType = FileSystem.FileSystemUploadType?.MULTIPART || 'multipart';
    const uploadResult = await FileSystem.uploadAsync(`${API_BASE_URL}/upload/feed`, picked.uri, {
      httpMethod: 'POST',
      uploadType,
      fieldName: 'media',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = JSON.parse(uploadResult.body);
    if (uploadResult.status !== 200 || !data.success) {
      throw new Error(data.error || 'Yükleme başarısız');
    }
    return data.data;
  };

  const publish = async () => {
    const queue = composerKind === 'story' ? pickedList.slice(0, 1) : pickedList.slice(0, MAX_POST_MEDIA);
    if (!queue.length) {
      Alert.alert('Medya seçin', 'Görsel veya video ekleyin.');
      return;
    }
    try {
      setSaving(true);
      const uploaded = [];
      for (const picked of queue) {
        const file = await uploadMedia(picked);
        uploaded.push({
          url: file.url,
          type: file.category === 'video' || picked.type === 'video' ? 'video' : 'image',
          thumbnailUrl: file.thumbnail,
          fileName: file.fileName || picked.name,
          fileSize: file.size,
        });
      }
      const first = uploaded[0];
      await apiService.createFeedItem({
        eventId,
        kind: composerKind,
        caption,
        mediaUrl: first.url,
        mediaType: first.type,
        thumbnailUrl: first.thumbnailUrl,
        fileName: first.fileName,
        fileSize: first.fileSize,
        media: uploaded,
      });
      setComposerOpen(false);
      setCaption('');
      setPickedList([]);
      await fetchFeed();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Paylaşım gönderilemedi');
    } finally {
      setSaving(false);
    }
  };

  const toggleLike = async (item: FeedItem, isStory = false) => {
    try {
      const result = await apiService.toggleFeedLike(item.id);
      const apply = (list: FeedItem[]) =>
        list.map((entry) =>
          entry.id === item.id
            ? { ...entry, likedByMe: result.liked, likeCount: result.likeCount }
            : entry
        );
      if (isStory) setStories(apply);
      else setPosts(apply);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const openComments = async (item: FeedItem) => {
    setCommentItem(item);
    setCommentText('');
    setCommentsLoading(true);
    try {
      const list = await apiService.getFeedComments(item.id);
      setComments(list);
    } catch (error) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const sendComment = async () => {
    if (!commentItem || !commentText.trim()) return;
    try {
      const created = await apiService.addFeedComment(commentItem.id, commentText.trim());
      setComments((prev) => [...prev, created]);
      setCommentText('');
      setPosts((prev) =>
        prev.map((entry) =>
          entry.id === commentItem.id
            ? { ...entry, commentCount: (entry.commentCount || 0) + 1 }
            : entry
        )
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Yorum gönderilemedi');
    }
  };

  const deleteActionItem = async () => {
    if (!actionItem) return;
    try {
      setDeleting(true);
      await apiService.deleteFeedItem(actionItem.id);
      setActionItem(null);
      await fetchFeed();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Silinemedi');
    } finally {
      setDeleting(false);
    }
  };

  const renderMedia = (item: FeedItem) => (
    <FeedMedia
      item={item}
      onOpen={(index) => {
        setViewerIndex(index);
        setViewerItem(item);
      }}
    />
  );

  const renderPost = ({ item }: { item: FeedItem }) => (
    <View style={[styles.postCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.postHeader}>
        <View style={styles.authorRow}>
          <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
            {item.author?.profileImage ? (
              <Image source={{ uri: fixImageUrl(item.author.profileImage) || '' }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials(item.author)}</Text>
            )}
          </View>
          <Text style={[styles.authorName, { color: textColor }]}>{displayName(item.author)}</Text>
        </View>
        {String(item.authorId) === String(currentUser?.id) && (
          <TouchableOpacity
            onPress={() => setActionItem(item)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Paylaşım menüsü"
            style={styles.moreBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {renderMedia(item)}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => toggleLike(item)} style={styles.actionBtn}>
          <Ionicons
            name={item.likedByMe ? 'heart' : 'heart-outline'}
            size={24}
            color={item.likedByMe ? '#ef4444' : textColor}
          />
          <Text style={[styles.actionText, { color: textColor }]}>{item.likeCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openComments(item)} style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={22} color={textColor} />
          <Text style={[styles.actionText, { color: textColor }]}>{item.commentCount || 0}</Text>
        </TouchableOpacity>
      </View>
      {!!item.caption && (
        <Text style={[styles.caption, { color: textColor }]}>
          <Text style={styles.captionName}>{displayName(item.author)} </Text>
          {item.caption}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={[]} style={[styles.container, { backgroundColor }]}>
      <AppTopBar
        rightExtra={
          features.postsEnabled ? (
            <TouchableOpacity onPress={() => { setComposerKind('post'); setComposerOpen(true); }} accessibilityLabel="Paylaş">
              <Ionicons name="add-outline" size={28} color={primaryColor} />
            </TouchableOpacity>
          ) : null
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeed(); }} />}
          ListHeaderComponent={
            !features.storiesEnabled && storyGroups.length === 0 ? null : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
              {features.storiesEnabled ? (
              <TouchableOpacity style={styles.storyItem} onPress={() => { setComposerKind('story'); setComposerOpen(true); }}>
                <View style={[styles.storyRing, { borderColor: primaryColor }]}>
                  <View style={[styles.storyInner, { backgroundColor: cardBackground }]}>
                    <Ionicons name="add" size={22} color={primaryColor} />
                  </View>
                </View>
                <Text style={[styles.storyName, { color: textSecondary }]} numberOfLines={1}>Story</Text>
              </TouchableOpacity>
              ) : null}
              {storyGroups.map((group, index) => {
                const startIndex = storyGroups.slice(0, index).reduce((sum, g) => sum + g.items.length, 0);
                return (
                  <TouchableOpacity key={group.authorId} style={styles.storyItem} onPress={() => setStoryIndex(startIndex)}>
                    <View style={[styles.storyRing, { borderColor: primaryColor }]}>
                      <View style={[styles.storyInner, { backgroundColor: cardBackground }]}>
                        {group.author?.profileImage ? (
                          <Image source={{ uri: fixImageUrl(group.author.profileImage) || '' }} style={styles.storyImage} />
                        ) : (
                          <Text style={[styles.avatarText, { color: textColor }]}>{initials(group.author)}</Text>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.storyName, { color: textSecondary }]} numberOfLines={1}>
                      {displayName(group.author)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            )
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: textSecondary, textAlign: 'center', paddingHorizontal: 24 }}>
                {features.postsEnabled
                  ? 'Bu etkinlikte henüz post yok. İlk paylaşımı sen yap.'
                  : 'Bu etkinlikte henüz post yok.'}
              </Text>
            </View>
          }
          contentContainerStyle={posts.length === 0 ? styles.emptyList : styles.list}
        />
      )}

      <Modal visible={!!activeStory} animationType="fade" onRequestClose={() => setStoryIndex(-1)}>
        <View style={styles.storyViewer}>
          {activeStory && (
            <>
              {activeStory.mediaType === 'video' ? (
                <AppVideo
                  uri={fixImageUrl(activeStory.mediaUrl) || ''}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                  shouldPlay
                />
              ) : (
                <Image
                  source={{ uri: fixImageUrl(activeStory.mediaUrl) || '' }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                />
              )}
              <SafeAreaView style={styles.storyOverlay}>
                <View style={styles.storyTop}>
                  <Text style={styles.storyViewerName}>{displayName(activeStory.author)}</Text>
                  <TouchableOpacity onPress={() => setStoryIndex(-1)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.storyNav}>
                  <TouchableOpacity style={styles.storyNavHit} onPress={() => setStoryIndex((i) => Math.max(0, i - 1))} />
                  <TouchableOpacity
                    style={styles.storyNavHit}
                    onPress={() => setStoryIndex((i) => (i + 1 >= flatStories.length ? -1 : i + 1))}
                  />
                </View>
                <View style={styles.storyBottom}>
                  {!!activeStory.caption && <Text style={styles.storyCaption}>{activeStory.caption}</Text>}
                  <TouchableOpacity onPress={() => toggleLike(activeStory, true)} style={styles.actionBtn}>
                    <Ionicons
                      name={activeStory.likedByMe ? 'heart' : 'heart-outline'}
                      size={28}
                      color={activeStory.likedByMe ? '#ef4444' : '#fff'}
                    />
                    <Text style={styles.storyLikeCount}>{activeStory.likeCount || 0}</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </>
          )}
        </View>
      </Modal>

      <Modal
        visible={!!actionItem}
        transparent
        animationType="fade"
        onRequestClose={() => setActionItem(null)}
      >
        <View style={styles.menuOverlay}>
          <Pressable style={styles.menuBackdrop} onPressIn={() => setActionItem(null)} accessibilityLabel="Menüyü kapat" />
          <View style={styles.menuSheet}>
            <Text style={[styles.menuTitle, { color: textSecondary }]}>Paylaşım</Text>
            <Pressable
              style={styles.menuAction}
              onPress={deleteActionItem}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Paylaşımı sil"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.menuDanger}>{deleting ? 'Siliniyor...' : 'Sil'}</Text>
            </Pressable>
            <Pressable
              style={styles.menuAction}
              onPressIn={() => setActionItem(null)}
              accessibilityRole="button"
              accessibilityLabel="Vazgeç"
            >
              <Text style={[styles.menuCancel, { color: textColor }]}>Vazgeç</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={!!commentItem} animationType="slide" onRequestClose={() => setCommentItem(null)}>
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
          <Header title="Yorumlar" onBackPress={() => setCommentItem(null)} />
          {commentsLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={primaryColor} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Text style={[styles.captionName, { color: textColor }]}>{displayName(item.user)}</Text>
                  <Text style={{ color: textColor }}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={{ color: textSecondary }}>{features.commentsEnabled ? 'İlk yorumu yaz.' : 'Yorum yok.'}</Text>}
            />
          )}
          {features.commentsEnabled ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.commentBar, { borderColor }]}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Yorum yaz..."
                placeholderTextColor={textSecondary}
                style={[styles.commentInput, { color: textColor, borderColor }]}
              />
              <TouchableOpacity onPress={sendComment}>
                <Ionicons name="send" size={22} color={primaryColor} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
          ) : (
            <Text style={{ color: textSecondary, textAlign: 'center', padding: 16 }}>Yorumlar kapalı.</Text>
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={composerOpen} animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
          <Header title="Paylaş" onBackPress={() => setComposerOpen(false)} />
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={styles.kindRow}>
              {(['post', 'story'] as FeedKind[]).filter((kind) => (
                kind === 'post' ? features.postsEnabled : features.storiesEnabled
              )).map((kind) => (
                <TouchableOpacity
                  key={kind}
                  onPress={() => {
                    setComposerKind(kind);
                    if (kind === 'story') setPickedList((prev) => prev.slice(0, 1));
                  }}
                  style={[
                    styles.kindBtn,
                    { borderColor },
                    composerKind === kind && { backgroundColor: primaryColor, borderColor: primaryColor },
                  ]}
                >
                  <Text style={{ color: composerKind === kind ? '#fff' : textColor, fontWeight: '600' }}>
                    {kind === 'post' ? 'Post' : 'Story'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.pickBtn, { borderColor }]} onPress={pickMedia}>
              <Ionicons name="images-outline" size={22} color={primaryColor} />
              <Text style={{ color: textColor, marginLeft: 8 }}>
                {pickedList.length
                  ? `${pickedList.length} dosya seçildi`
                  : composerKind === 'post'
                    ? 'Görsel veya video seç, birden fazla eklenebilir'
                    : 'Görsel veya video seç'}
              </Text>
            </TouchableOpacity>
            {pickedList.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
                {pickedList.map((picked, index) => (
                  <View key={`${picked.uri}-${index}`} style={styles.previewTile}>
                    {picked.type === 'video' ? (
                      <View style={[styles.previewThumb, styles.previewVideo]}>
                        <Ionicons name="videocam" size={22} color="#fff" />
                      </View>
                    ) : (
                      <Image source={{ uri: picked.uri }} style={styles.previewThumb} contentFit="cover" />
                    )}
                    <TouchableOpacity
                      style={styles.previewRemove}
                      onPress={() => setPickedList((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Açıklama yaz (isteğe bağlı)"
              placeholderTextColor={textSecondary}
              multiline
              style={[styles.captionInput, { color: textColor, borderColor, backgroundColor: cardBackground }]}
            />
            <TouchableOpacity
              style={[styles.publishBtn, { backgroundColor: primaryColor, opacity: saving ? 0.6 : 1 }]}
              onPress={publish}
              disabled={saving}
            >
              <Text style={styles.publishText}>{saving ? 'Gönderiliyor...' : 'Paylaş'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!cropSource} animationType="fade" onRequestClose={() => setCropSource(null)}>
        {cropSource && (
          <ImageCropper
            visible
            uri={cropSource.uri}
            imageWidth={cropSource.width}
            imageHeight={cropSource.height}
            onCancel={() => setCropSource(null)}
            onDone={(uri) => {
              appendPicked([{ uri, type: 'image', name: cropSource.name }]);
              setCropSource(null);
              setComposerOpen(true);
            }}
          />
        )}
      </Modal>

      <Modal visible={!!viewerItem} animationType="fade" onRequestClose={() => setViewerItem(null)}>
        <GestureHandlerRootView style={styles.storyViewer}>
          <SafeAreaView style={styles.storyOverlay}>
            <View style={styles.storyTop}>
              <Text style={styles.storyViewerName}>{displayName(viewerItem?.author)}</Text>
              <TouchableOpacity onPress={() => setViewerItem(null)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            {viewerItem && slidesFor(viewerItem).length > 1 && (
              <Text style={styles.viewerCount}>
                {Math.min(viewerIndex + 1, slidesFor(viewerItem).length)}/{slidesFor(viewerItem).length}
              </Text>
            )}
            {viewerItem && (
              <FlatList
                data={slidesFor(viewerItem)}
                horizontal
                pagingEnabled
                initialScrollIndex={Math.min(viewerIndex, Math.max(slidesFor(viewerItem).length - 1, 0))}
                getItemLayout={(_, index) => ({
                  length: Dimensions.get('window').width,
                  offset: Dimensions.get('window').width * index,
                  index,
                })}
                keyExtractor={(_, index) => `${viewerItem.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const width = Dimensions.get('window').width;
                  setViewerIndex(Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1)));
                }}
                renderItem={({ item: slide, index }) => (
                  <View style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.72 }}>
                    {slide.type === 'video' ? (
                      <AppVideo
                        uri={slide.url}
                        style={{ flex: 1 }}
                        contentFit="contain"
                        shouldPlay={index === viewerIndex}
                      />
                    ) : (
                      <ZoomableImage key={`${viewerItem.id}-${index}-${slide.url}`} uri={slide.url} />
                    )}
                  </View>
                )}
                style={{ flex: 1 }}
              />
            )}
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  list: { paddingBottom: 24 },
  emptyList: { flexGrow: 1 },
  storyRow: { paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  storyItem: { width: 72, alignItems: 'center' },
  storyRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, padding: 3 },
  storyInner: { flex: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  storyImage: { width: '100%', height: '100%' },
  storyName: { fontSize: 11, marginTop: 4, width: 72, textAlign: 'center' },
  postCard: { marginHorizontal: 12, marginBottom: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: 36, height: 36 },
  avatarText: { color: '#fff', fontWeight: '700' },
  authorName: { fontWeight: '600' },
  moreBtn: { padding: 6, zIndex: 2 },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 12, 22, 0.72)',
    zIndex: 1,
  },
  menuSheet: {
    position: 'relative',
    zIndex: 5,
    elevation: 12,
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(43, 182, 232, 0.28)',
    backgroundColor: '#102536',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuTitle: { textAlign: 'center', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  menuAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  menuDanger: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  menuCancel: { fontSize: 16, fontWeight: '600' },
  media: { width: '100%' },
  actions: { flexDirection: 'row', gap: 16, paddingHorizontal: 12, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14 },
  caption: { paddingHorizontal: 12, paddingVertical: 10, lineHeight: 20 },
  captionName: { fontWeight: '700' },
  storyViewer: { flex: 1, backgroundColor: '#000' },
  storyOverlay: { flex: 1, justifyContent: 'space-between' },
  storyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  storyViewerName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  storyNav: { flex: 1, flexDirection: 'row' },
  storyNavHit: { flex: 1 },
  storyBottom: { padding: 16, gap: 10 },
  storyCaption: { color: '#fff', fontSize: 15 },
  storyLikeCount: { color: '#fff', fontWeight: '600' },
  commentRow: { marginBottom: 12, gap: 4 },
  commentBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  kindRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  kindBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  pickBtn: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  preview: { width: '100%', height: 280, borderRadius: 12, marginBottom: 12, backgroundColor: '#020617' },
  previewRow: { gap: 8, paddingBottom: 12 },
  previewTile: { width: 84, height: 84 },
  previewThumb: { width: 84, height: 84, borderRadius: 10, backgroundColor: '#020617' },
  previewVideo: { alignItems: 'center', justifyContent: 'center' },
  previewRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCount: { color: '#fff', textAlign: 'center', fontWeight: '700', marginBottom: 8 },
  captionInput: { borderWidth: 1, borderRadius: 12, minHeight: 90, padding: 12, textAlignVertical: 'top' },
  publishBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  publishText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
