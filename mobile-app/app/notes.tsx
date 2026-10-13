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
  Platform,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../hooks/use-theme-color';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../src/services/apiService';
import { Header } from '../components/Header';

interface Note {
  id: number;
  userId?: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  isPublic: boolean;
  tags: string;
  event?: {
    id: number;
    name: string;
  };
  author?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const NotesScreen: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

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
      fetchNotes();
    }
  }, [selectedEvent]);

  const loadSelectedEvent = async () => {
    try {
      const [eventData, userData] = await Promise.all([
        AsyncStorage.getItem('selectedEvent'),
        AsyncStorage.getItem('currentUser'),
      ]);
      if (eventData) {
        setSelectedEvent(JSON.parse(eventData));
      }
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(String(user.id || ''));
      }
    } catch (error) {
      console.error('Error loading selected event:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotes(selectedEvent?.id) as any;
      console.log('Notes API response:', response);
      
      // Handle different response formats
      let notesList = [];
      if (Array.isArray(response)) {
        notesList = response;
      } else if (response && response.notes) {
        notesList = response.notes;
      } else if (response && Array.isArray(response.data)) {
        notesList = response.data;
      }
      
      // Map backend fields to frontend format (handle both camelCase and snake_case)
      const mappedNotes = notesList.map((note: any) => ({
        id: note.id,
        userId: note.userId || note.user_id || note.user?.id || '',
        title: note.title || '',
        content: note.content || note.content_text || '',
        category: note.category || 'general',
        priority: note.priority || 'medium',
        isPublic: note.isPublic !== undefined ? note.isPublic : (note.is_public !== undefined ? note.is_public : false),
        tags: note.tags || '',
        event: note.event || (note.eventId ? { id: note.eventId, name: '' } : undefined),
        author: note.user || note.author || (note.userId ? { id: note.userId, firstName: '', lastName: '' } : undefined),
      }));
      
      console.log('Mapped notes:', mappedNotes.length);
      setNotes(mappedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      Alert.alert('Hata', 'Notlar yüklenirken bir hata oluştu');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  const handleNotePress = (note: Note) => {
    setSelectedNote(note);
    setShowDetailModal(true);
  };

  const isMine = (note?: Note | null) => {
    if (!note || !currentUserId) return false;
    return String(note.userId || note.author?.id || '') === currentUserId;
  };

  const openCreate = () => {
    setEditingNote(null);
    setDraftTitle('');
    setDraftContent('');
    setShowEditor(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setShowDetailModal(false);
    setShowEditor(true);
  };

  const saveNote = async () => {
    const title = draftTitle.trim();
    const content = draftContent.trim();
    if (!title || !content) {
      Alert.alert('Eksik bilgi', 'Başlık ve not metni gerekli.');
      return;
    }
    if (!selectedEvent?.id) {
      Alert.alert('Hata', 'Etkinlik bulunamadı.');
      return;
    }
    setSaving(true);
    try {
      if (editingNote) {
        await apiService.updateNote(editingNote.id, { title, content });
      } else {
        await apiService.createNote({
          title,
          content,
          eventId: selectedEvent.id,
          category: 'personal',
          isPublic: false,
        });
      }
      setShowEditor(false);
      setEditingNote(null);
      await fetchNotes();
    } catch (error: any) {
      Alert.alert('Hata', error?.message || 'Not kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = (note: Note) => {
    Alert.alert('Notu sil', 'Bu not silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteNote(note.id);
            setShowDetailModal(false);
            setSelectedNote(null);
            await fetchNotes();
          } catch (error: any) {
            Alert.alert('Hata', error?.message || 'Not silinemedi');
          }
        },
      },
    ]);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'information-circle';
      case 'low':
        return 'checkmark-circle';
      default:
        return 'document-text';
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'people';
      case 'reminder':
        return 'alarm';
      case 'idea':
        return 'bulb';
      case 'task':
        return 'checkmark-circle';
      case 'general':
      case 'personal':
        return 'document-text';
      default:
        return 'document-text';
    }
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
      onPress={() => handleNotePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
          <Ionicons
            name={getPriorityIcon(item.priority) as any}
            size={24}
            color={getPriorityColor(item.priority)}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        </View>
        {isMine(item) ? (
          <View style={[styles.badge, { backgroundColor: primaryColor }]}>
            <Text style={styles.badgeText}>Benim</Text>
          </View>
        ) : item.isPublic ? (
          <View style={[styles.badge, { backgroundColor: successColor }]}>
            <Text style={styles.badgeText}>Genel</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardDetails}>
        {item.content ? (
          <Text style={[styles.cardDescription, { color: textSecondary }]} numberOfLines={3}>
            {item.content}
          </Text>
        ) : (
          <Text style={[styles.cardDescription, { color: textSecondary, fontStyle: 'italic' }]}>
            İçerik bulunmuyor
          </Text>
        )}
        
        {item.tags ? (
          <View style={styles.tagsContainer}>
            {item.tags.split(',').slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: primaryColor + '20' }]}>
                <Text style={[styles.tagText, { color: primaryColor }]}>
                  {tag.trim()}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <Ionicons name={getCategoryIcon(item.category) as any} size={16} color={textSecondary} />
          <Text style={[styles.statusText, { color: textSecondary, marginLeft: 4 }]}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: primaryColor }]}
          onPress={() => handleNotePress(item)}
        >
          <Text style={styles.actionButtonText}>Detaylar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color={textSecondary} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        Notlar Bulunamadı
      </Text>
      <Text style={[styles.emptyDescription, { color: textSecondary }]}>
        {selectedEvent
          ? 'Henüz not yok. Kendi notunu ekleyebilirsin.'
          : 'Lütfen önce bir etkinlik seçin.'}
      </Text>
      {selectedEvent ? (
        <TouchableOpacity style={[styles.emptyButton, { backgroundColor: primaryColor }]} onPress={openCreate}>
          <Text style={styles.emptyButtonText}>Not ekle</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: textSecondary }]}>Notlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header
        title="Notlar"
        subtitle={selectedEvent?.name}
        rightComponent={
          <TouchableOpacity onPress={openCreate} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="add-circle" size={28} color={primaryColor} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContainer, { paddingBottom: 88 }]}
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

      {/* Note Detail Modal */}
      {showDetailModal && selectedNote && (
        <Modal
          visible={showDetailModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowDetailModal(false);
            setSelectedNote(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBackground, borderColor }]}>
              <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]} numberOfLines={2}>
                  {selectedNote.title}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    setSelectedNote(null);
                  }}
                >
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Category and Priority */}
                <View style={styles.modalMetaRow}>
                  <View style={[styles.modalBadge, { backgroundColor: getPriorityColor(selectedNote.priority) + '20' }]}>
                    <Ionicons
                      name={getPriorityIcon(selectedNote.priority) as any}
                      size={16}
                      color={getPriorityColor(selectedNote.priority)}
                    />
                    <Text style={[styles.modalBadgeText, { color: getPriorityColor(selectedNote.priority) }]}>
                      {selectedNote.priority === 'high' ? 'Yüksek' : selectedNote.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </Text>
                  </View>
                  <View style={[styles.modalBadge, { backgroundColor: primaryColor + '20' }]}>
                    <Ionicons
                      name={getCategoryIcon(selectedNote.category) as any}
                      size={16}
                      color={primaryColor}
                    />
                    <Text style={[styles.modalBadgeText, { color: primaryColor }]}>
                      {selectedNote.category.charAt(0).toUpperCase() + selectedNote.category.slice(1)}
                    </Text>
                  </View>
                  {selectedNote.isPublic && (
                    <View style={[styles.modalBadge, { backgroundColor: successColor + '20' }]}>
                      <Ionicons name="globe-outline" size={16} color={successColor} />
                      <Text style={[styles.modalBadgeText, { color: successColor }]}>Genel</Text>
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: textColor }]}>İçerik</Text>
                  {selectedNote.content ? (
                    <Text style={[styles.modalContentText, { color: textColor }]}>
                      {selectedNote.content}
                    </Text>
                  ) : (
                    <Text style={[styles.modalContentText, { color: textSecondary, fontStyle: 'italic' }]}>
                      İçerik bulunmuyor
                    </Text>
                  )}
                </View>

                {selectedNote.tags ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: textColor }]}>Etiketler</Text>
                    <View style={styles.modalTagsContainer}>
                      {selectedNote.tags.split(',').filter((tag) => tag.trim()).map((tag, index) => (
                        <View key={index} style={[styles.modalTag, { backgroundColor: primaryColor + '20' }]}>
                          <Text style={[styles.modalTagText, { color: primaryColor }]}>
                            {tag.trim()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Event Info */}
                {selectedNote.event && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: textColor }]}>Etkinlik</Text>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="calendar-outline" size={18} color={textSecondary} />
                      <Text style={[styles.modalInfoText, { color: textSecondary }]}>
                        {selectedNote.event.name || 'Etkinlik bilgisi yok'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Author Info */}
                {selectedNote.author ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: textColor }]}>Yazar</Text>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="person-outline" size={18} color={textSecondary} />
                      <Text style={[styles.modalInfoText, { color: textSecondary }]}>
                        {selectedNote.author.firstName} {selectedNote.author.lastName}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {isMine(selectedNote) ? (
                  <View style={styles.editorActions}>
                    <TouchableOpacity
                      style={[styles.editorButton, { borderColor, backgroundColor }]}
                      onPress={() => openEdit(selectedNote)}
                    >
                      <Text style={[styles.editorButtonText, { color: textColor }]}>Düzenle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editorButton, { backgroundColor: errorColor }]}
                      onPress={() => deleteNote(selectedNote)}
                    >
                      <Text style={[styles.editorButtonText, { color: '#fff' }]}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={showEditor}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditor(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBackground, borderColor }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {editingNote ? 'Notu düzenle' : 'Yeni not'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowEditor(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalSectionTitle, { color: textColor }]}>Başlık</Text>
              <TextInput
                value={draftTitle}
                onChangeText={setDraftTitle}
                placeholder="Örn. Oturum notları"
                placeholderTextColor={textSecondary}
                style={[styles.input, { color: textColor, borderColor, backgroundColor }]}
              />
              <Text style={[styles.modalSectionTitle, { color: textColor }]}>Notun</Text>
              <TextInput
                value={draftContent}
                onChangeText={setDraftContent}
                placeholder="Buraya yaz..."
                placeholderTextColor={textSecondary}
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.inputMultiline, { color: textColor, borderColor, backgroundColor }]}
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: primaryColor, opacity: saving ? 0.7 : 1 }]}
                onPress={saveNote}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{editingNote ? 'Kaydet' : 'Notu ekle'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primaryColor, bottom: 16 }]}
        onPress={openCreate}
        accessibilityRole="button"
        accessibilityLabel="Not ekle"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
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
  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  inputMultiline: {
    minHeight: 140,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  editorActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  editorButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  editorButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.3)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: '70%',
    padding: 20,
  },
  modalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalContentText: {
    fontSize: 15,
    lineHeight: 24,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  modalTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalInfoText: {
    fontSize: 14,
    marginLeft: 8,
  },
});

export default NotesScreen;