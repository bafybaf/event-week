import {  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator , Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../src/services/apiService';
import { Header } from '../components/Header';
import { useThemeColor } from '../hooks/use-theme-color';

interface VoteOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface Voting {
  id: string;
  title: string;
  description: string;
  type: 'single' | 'multiple';
  status: 'active' | 'completed' | 'upcoming';
  endDate: string;
  options: VoteOption[];
  totalVotes: number;
  hasVoted: boolean;
  userVotes: string[];
}

export default function VotingScreen() {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [filteredVotings, setFilteredVotings] = useState<Voting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');

  useEffect(() => {
    loadSelectedEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadVotings();
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

  const loadVotings = async () => {
    try {
      setLoading(true);
      // Programs'ı al ve her program için voting durumunu kontrol et
      const programsData = await apiService.getPrograms(selectedEvent?.id);
      const programsList = Array.isArray(programsData) ? programsData : [];
      
      // Sadece voting enabled olan programları filtrele
      const votingPrograms = programsList.filter((p: any) => p.isVotingEnabled && p.votingQuestion);
      
      // Her program için oyları al ve voting session formatına çevir
      const votingsList: Voting[] = [];
      const currentUser = await AsyncStorage.getItem('user');
      const userData = currentUser ? JSON.parse(currentUser) : null;
      
      for (const program of votingPrograms) {
        try {
          // Program'ın voting options'ını al
          const votingOptions = program.votingOptions || [];
          if (votingOptions.length === 0) continue;
          
          // Bu program için oyları al
          const votesData = await apiService.getVotes(program.id);
          const votesList = Array.isArray(votesData) ? votesData : [];
          
          // Oyları option'lara göre grupla
          const optionsMap: { [key: string]: { id: string; text: string; votes: number } } = {};
          
          // Önce program'daki tüm seçenekleri ekle
          votingOptions.forEach((opt: string, idx: number) => {
            optionsMap[opt] = {
              id: String(idx + 1),
              text: opt,
              votes: 0
            };
          });
          
          // Sonra oyları say
          votesList.forEach((vote: any) => {
            if (vote.selectedOption && optionsMap[vote.selectedOption]) {
              optionsMap[vote.selectedOption].votes++;
            }
          });
          
          const options = Object.values(optionsMap);
          const totalVotes = votesList.length;
          const hasVoted = userData ? votesList.some((v: any) => v.user?.id === userData.id || v.userId === userData.id) : false;
          const userVotes = userData ? votesList
            .filter((v: any) => v.user?.id === userData.id || v.userId === userData.id)
            .map((v: any) => v.selectedOption || '') : [];
          
          votingsList.push({
            id: program.id?.toString() || String(program.id),
            title: program.title || 'Oylama',
            description: program.votingQuestion || program.description || '',
            type: 'single', // Şimdilik tek seçim
            status: program.endTime && new Date(program.endTime) < new Date() ? 'completed' : 
                   program.status === 'completed' ? 'completed' : 'active',
            endDate: program.endTime ? new Date(program.endTime).toISOString().split('T')[0] : '',
            totalVotes: totalVotes,
            hasVoted: hasVoted,
            userVotes: userVotes,
            options: options.map(opt => ({
              ...opt,
              percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
            }))
          });
        } catch (error) {
          console.error(`Error loading votes for program ${program.id}:`, error);
        }
      }
      
      setVotings(votingsList);
      setFilteredVotings(votingsList);
    } catch (error) {
      console.error('Error loading votings:', error);
      setVotings([]);
      setFilteredVotings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = votings;

    if (searchQuery) {
      filtered = filtered.filter(voting =>
        voting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voting.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(voting => voting.status === selectedStatus);
    }

    setFilteredVotings(filtered);
  }, [votings, searchQuery, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#6B7280';
      case 'upcoming': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      case 'upcoming': return 'Yakında';
      default: return 'Bilinmiyor';
    }
  };

  const handleVote = async (votingId: string, optionId: string) => {
    try {
      // Program bilgisini bul
      const program = await apiService.getProgram(votingId);
      if (!program || !program.votingQuestion) {
        Alert.alert('Hata', 'Oylama bilgisi bulunamadı');
        return;
      }

      // Seçenek metnini bul
      const votingOptions = program.votingOptions || [];
      const selectedOption = votingOptions[parseInt(optionId) - 1] || optionId;

      // Oylama gönder
      await apiService.submitVote({
        programId: votingId,
        question: program.votingQuestion,
        selectedOption: selectedOption
      });

      Alert.alert('Başarılı', 'Oy başarıyla gönderildi');
      
      // Oylamaları yeniden yükle
      await loadVotings();
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      Alert.alert('Hata', error.message || 'Oy gönderilirken bir hata oluştu');
    }
  };

  const renderVotingCard = (voting: Voting) => (
    <View key={voting.id} style={[styles.votingCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.votingHeader}>
        <View style={styles.votingInfo}>
          <Text style={[styles.votingTitle, { color: textColor }]}>{voting.title}</Text>
          <Text style={[styles.votingDescription, { color: textSecondary }]}>{voting.description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(voting.status) }]}>
          <Text style={styles.statusText}>{getStatusText(voting.status)}</Text>
        </View>
      </View>

      <View style={styles.votingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={textSecondary} />
          <Text style={[styles.detailText, { color: textSecondary }]}>Bitiş: {voting.endDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color={textSecondary} />
          <Text style={[styles.detailText, { color: textSecondary }]}>Toplam Oy: {voting.totalVotes}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="checkmark-circle" size={16} color={textSecondary} />
          <Text style={[styles.detailText, { color: textSecondary }]}>
            {voting.type === 'single' ? 'Tek Seçim' : 'Çoklu Seçim'}
          </Text>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        {voting.options.map((option) => (
          <View key={option.id} style={styles.optionItem}>
            <View style={styles.optionHeader}>
              <Text style={[styles.optionText, { color: textColor }]}>{option.text}</Text>
              <Text style={[styles.optionVotes, { color: textSecondary }]}>{option.votes} oy ({option.percentage}%)</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${option.percentage}%`, backgroundColor: primaryColor }
                ]} 
              />
            </View>
            {voting.status === 'active' && !voting.hasVoted && (
              <TouchableOpacity 
                style={[styles.voteButton, { backgroundColor: `${primaryColor}22` }]}
                onPress={() => handleVote(voting.id, option.id)}
              >
                <Ionicons name="thumbs-up" size={16} color={primaryColor} />
                <Text style={[styles.voteButtonText, { color: primaryColor }]}>Oy Ver</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {voting.hasVoted && (
        <View style={[styles.votedIndicator, { backgroundColor: `${successColor}22`, borderColor: successColor }]}>
          <Ionicons name="checkmark-circle" size={20} color={successColor} />
          <Text style={[styles.votedText, { color: successColor }]}>Oyladınız</Text>
        </View>
      )}
    </View>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVotings();
    setRefreshing(false);
  };

  if (loading && votings.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        <Header 
          title="Oylama" 
          subtitle={selectedEvent?.name}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Oylamalar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header 
        title="Oylama" 
        subtitle={selectedEvent?.name}
      />
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: cardBackground, borderColor }]}>
            <Ionicons name="search" size={20} color={textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Oylama ara..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: cardBackground, borderColor },
              selectedStatus === '' && { backgroundColor: primaryColor, borderColor: primaryColor },
            ]}
            onPress={() => setSelectedStatus('')}
          >
            <Text style={[styles.filterText, { color: selectedStatus === '' ? '#ffffff' : textSecondary }]}>
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: cardBackground, borderColor },
              selectedStatus === 'active' && { backgroundColor: primaryColor, borderColor: primaryColor },
            ]}
            onPress={() => setSelectedStatus('active')}
          >
            <Text style={[styles.filterText, { color: selectedStatus === 'active' ? '#ffffff' : textSecondary }]}>
              Aktif
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: cardBackground, borderColor },
              selectedStatus === 'completed' && { backgroundColor: primaryColor, borderColor: primaryColor },
            ]}
            onPress={() => setSelectedStatus('completed')}
          >
            <Text style={[styles.filterText, { color: selectedStatus === 'completed' ? '#ffffff' : textSecondary }]}>
              Tamamlanan
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.votingsList}>
          {filteredVotings.map(renderVotingCard)}
        </View>

        {filteredVotings.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="thumbs-up-outline" size={64} color={textMuted} />
            <Text style={[styles.emptyText, { color: textColor }]}>Oylama bulunamadı</Text>
            <Text style={[styles.emptySubtext, { color: textSecondary }]}>
              {selectedEvent ? 'Bu etkinlik için aktif oylama bulunmamaktadır' : 'Lütfen bir etkinlik seçin'}
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
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  votingsList: {
    padding: 16,
  },
  votingCard: {
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
  votingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  votingInfo: {
    flex: 1,
    marginRight: 12,
  },
  votingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  votingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  votingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionItem: {
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  optionVotes: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  voteButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  votedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  votedText: {
    marginLeft: 8,
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});