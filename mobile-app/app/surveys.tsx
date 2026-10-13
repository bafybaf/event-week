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
  TextInput,
  ScrollView,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../hooks/use-theme-color';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../src/services/apiService';
import { Header } from '../components/Header';

interface Survey {
  id: number;
  title: string;
  description: string;
  questions: string;
  type: string;
  isActive: boolean;
  isPublic: boolean;
  startDate: string;
  endDate: string;
  maxResponses: number | null;
  currentResponses: number;
  event?: {
    id: number;
    name: string;
  };
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const SurveysScreen: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [surveyResponses, setSurveyResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

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
      fetchSurveys();
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

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const surveysData = await apiService.getSurveys(selectedEvent?.id) as any;
      const surveysList = Array.isArray(surveysData) ? surveysData : [];
      setSurveys(surveysList);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      Alert.alert('Hata', 'Anketler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSurveys();
    setRefreshing(false);
  };

  const handleSurveyPress = (survey: Survey) => {
    // Check if survey is active
    const now = new Date();
    if (!survey.isActive) {
      Alert.alert('Uyarı', 'Bu anket aktif değil');
      return;
    }
    if (survey.endDate && new Date(survey.endDate) < now) {
      Alert.alert('Uyarı', 'Bu anketin süresi dolmuş');
      return;
    }
    if (survey.maxResponses && survey.maxResponses > 0 && survey.currentResponses >= survey.maxResponses) {
      Alert.alert('Uyarı', 'Bu anketin yanıt kotası dolmuş');
      return;
    }

    setSelectedSurvey(survey);
    setSurveyResponses({});
    setShowResponseModal(true);
  };

  const handleSubmitSurvey = async () => {
    if (!selectedSurvey) return;

    // Parse questions
    let questions = [];
    try {
      questions = typeof selectedSurvey.questions === 'string' 
        ? JSON.parse(selectedSurvey.questions) 
        : selectedSurvey.questions;
    } catch (e) {
      Alert.alert('Hata', 'Anket soruları okunamadı');
      return;
    }

    // Validate required questions
    for (const q of questions) {
      if (q.required && !surveyResponses[q.question]) {
        Alert.alert('Eksik Yanıt', `"${q.question}" sorusu zorunludur`);
        return;
      }
    }

    // Prepare responses array
    const responses = questions.map((q: any) => ({
      question: q.question,
      answer: surveyResponses[q.question] || '',
      type: q.type
    }));

    try {
      setSubmitting(true);
      await apiService.submitSurveyResponse(selectedSurvey.id, { responses });
      Alert.alert('Başarılı', 'Anket yanıtınız başarıyla gönderildi', [
        {
          text: 'Tamam',
          onPress: () => {
            setShowResponseModal(false);
            setSelectedSurvey(null);
            setSurveyResponses({});
            fetchSurveys();
          }
        }
      ]);
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      Alert.alert('Hata', error.message || 'Anket yanıtı gönderilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: any, index: number) => {
    const value = surveyResponses[question.question] || '';

    if (question.type === 'multiple_choice') {
      return (
        <View key={index} style={styles.questionContainer}>
          <Text style={[styles.questionText, { color: textColor }]}>
            {question.question} {question.required && <Text style={{ color: errorColor }}>*</Text>}
          </Text>
          {question.options && question.options.map((option: string, optIndex: number) => (
            <TouchableOpacity
              key={optIndex}
              style={[
                styles.optionButton,
                {
                  backgroundColor: value === option ? primaryColor : cardBackground,
                  borderColor: value === option ? primaryColor : borderColor
                }
              ]}
              onPress={() => {
                setSurveyResponses({
                  ...surveyResponses,
                  [question.question]: option
                });
              }}
            >
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioCircle,
                  { borderColor: value === option ? primaryColor : borderColor }
                ]}>
                  {value === option && <View style={[styles.radioInner, { backgroundColor: primaryColor }]} />}
                </View>
                <Text style={[
                  styles.optionText,
                  { color: value === option ? '#ffffff' : textColor }
                ]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (question.type === 'rating') {
      const rating = value ? parseInt(value) : 0;
      return (
        <View key={index} style={styles.questionContainer}>
          <Text style={[styles.questionText, { color: textColor }]}>
            {question.question} {question.required && <Text style={{ color: errorColor }}>*</Text>}
          </Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  setSurveyResponses({
                    ...surveyResponses,
                    [question.question]: star.toString()
                  });
                }}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= rating ? warningColor : textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // Text input
    return (
      <View key={index} style={styles.questionContainer}>
        <Text style={[styles.questionText, { color: textColor }]}>
          {question.question} {question.required && <Text style={{ color: errorColor }}>*</Text>}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: cardBackground,
              borderColor,
              color: textColor
            }
          ]}
          value={value}
          onChangeText={(text) => {
            setSurveyResponses({
              ...surveyResponses,
              [question.question]: text
            });
          }}
          placeholder="Yanıtınızı yazın..."
          placeholderTextColor={textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>
    );
  };

  const getSurveyTypeIcon = (type: string) => {
    switch (type) {
      case 'feedback':
        return 'chatbubbles';
      case 'rating':
        return 'star';
      case 'multiple_choice':
        return 'list';
      case 'text':
        return 'document-text';
      case 'poll':
        return 'bar-chart';
      default:
        return 'help-circle';
    }
  };

  const getSurveyTypeColor = (type: string) => {
    switch (type) {
      case 'feedback':
        return primaryColor;
      case 'rating':
        return warningColor;
      case 'multiple_choice':
        return successColor;
      case 'text':
        return errorColor;
      case 'poll':
        return '#8b5cf6';
      default:
        return primaryColor;
    }
  };

  const getStatusColor = (survey: Survey) => {
    if (!survey.isActive) return errorColor;
    if (new Date(survey.endDate) < new Date()) return errorColor;
    if (survey.maxResponses && survey.currentResponses >= survey.maxResponses) return warningColor;
    return successColor;
  };

  const getStatusText = (survey: Survey) => {
    if (!survey.isActive) return 'Pasif';
    if (new Date(survey.endDate) < new Date()) return 'Süresi Dolmuş';
    if (survey.maxResponses && survey.currentResponses >= survey.maxResponses) return 'Dolu';
    return 'Aktif';
  };

  const getProgressPercentage = (survey: Survey): number | null => {
    if (!survey.maxResponses || survey.maxResponses === 0) {
      return null; // Sınırsız anket
    }
    return Math.round((survey.currentResponses / survey.maxResponses) * 100);
  };

  const getResponseText = (survey: Survey): string => {
    if (!survey.maxResponses || survey.maxResponses === 0) {
      return `${survey.currentResponses} yanıt (Sınırsız)`;
    }
    return `${survey.currentResponses}/${survey.maxResponses} yanıt`;
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  const renderSurveyItem = ({ item }: { item: Survey }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
      onPress={() => handleSurveyPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getSurveyTypeColor(item.type) + '20' }]}>
          <Ionicons
            name={getSurveyTypeIcon(item.type) as any}
            size={24}
            color={getSurveyTypeColor(item.type)}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' ')}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item) }]}>
          <Text style={styles.badgeText}>{getStatusText(item)}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <Text style={[styles.cardDescription, { color: textSecondary }]} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.surveyInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color={textSecondary} />
            <Text style={[styles.infoText, { color: textSecondary }]}>
              Bitiş: {formatDate(item.endDate)}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={16} color={textSecondary} />
            <Text style={[styles.infoText, { color: textSecondary }]}>
              {getResponseText(item)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.progressContainer}>
          {getProgressPercentage(item) !== null ? (
            <>
              <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: getStatusColor(item),
                      width: `${getProgressPercentage(item)}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: textSecondary }]}>
                {getProgressPercentage(item)}%
              </Text>
            </>
          ) : (
            <View style={styles.unlimitedBadge}>
              <Ionicons name="infinite-outline" size={16} color={successColor} />
              <Text style={[styles.unlimitedText, { color: successColor }]}>
                Sınırsız
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: primaryColor }]}
          onPress={() => handleSurveyPress(item)}
        >
          <Text style={styles.actionButtonText}>Katıl</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="help-circle-outline" size={64} color={textSecondary} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        Anketler Bulunamadı
      </Text>
      <Text style={[styles.emptyDescription, { color: textSecondary }]}>
        {selectedEvent ?
          `${selectedEvent.name} etkinliği için henüz anket eklenmemiş.` :
          'Lütfen önce bir etkinlik seçin.'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: textSecondary }]}>Anketler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header 
        title="Anketler" 
        subtitle={selectedEvent?.name}
      />

      <FlatList
        data={surveys}
        renderItem={renderSurveyItem}
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

      {/* Survey Response Modal */}
      {showResponseModal && selectedSurvey && (() => {
        let questions = [];
        try {
          questions = typeof selectedSurvey.questions === 'string' 
            ? JSON.parse(selectedSurvey.questions) 
            : selectedSurvey.questions;
        } catch (e) {
          questions = [];
        }

        return (
          <Modal
            visible={showResponseModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => {
              setShowResponseModal(false);
              setSelectedSurvey(null);
              setSurveyResponses({});
            }}
          >
            <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
              <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                <TouchableOpacity
                  onPress={() => {
                    setShowResponseModal(false);
                    setSelectedSurvey(null);
                    setSurveyResponses({});
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: textColor }]} numberOfLines={1}>
                  {selectedSurvey.title}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                {selectedSurvey.description && (
                  <Text style={[styles.surveyDescription, { color: textSecondary, backgroundColor: cardBackground }]}>
                    {selectedSurvey.description}
                  </Text>
                )}

                {questions.map((q: any, index: number) => renderQuestionInput(q, index))}

                <View style={styles.submitButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: primaryColor,
                        opacity: submitting ? 0.6 : 1
                      }
                    ]}
                    onPress={handleSubmitSurvey}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Gönder</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        );
      })()}
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
  surveyInfo: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  surveyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 14,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  submitButtonContainer: {
    paddingVertical: 24,
    paddingBottom: 32,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  unlimitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  unlimitedText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default SurveysScreen;