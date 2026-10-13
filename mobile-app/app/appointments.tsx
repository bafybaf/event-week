import {  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator , Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../src/services/apiService';
import { Header } from '../components/Header';
import { useThemeColor } from '../hooks/use-theme-color';

interface Appointment {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  speaker: {
    name: string;
    company: string;
  };
  status: 'available' | 'booked' | 'completed';
  maxParticipants: number;
  currentParticipants: number;
}

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    loadSelectedEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadAppointments();
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

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await apiService.getAppointments(selectedEvent?.id);
      const appointmentsList = Array.isArray(appointmentsData) ? appointmentsData : [];
      
      // Backend formatını mobil formatına çevir
      const formattedAppointments: Appointment[] = appointmentsList.map((apt: any) => ({
        id: apt.id?.toString() || String(apt.id),
        title: apt.title || apt.subject || 'Randevu',
        description: apt.description || apt.message || '',
        date: apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: apt.appointmentTime || apt.appointmentDate ? new Date(apt.appointmentDate).toTimeString().slice(0, 5) : '10:00',
        duration: apt.duration || 60,
        location: apt.location || '',
        speaker: {
          name: apt.requestedUser ? `${apt.requestedUser.firstName} ${apt.requestedUser.lastName}` : (apt.requester ? `${apt.requester.firstName} ${apt.requester.lastName}` : 'Konuşmacı'),
          company: apt.requestedUser?.company || apt.requester?.company || ''
        },
        status: apt.status === 'confirmed' ? 'available' : (apt.status === 'cancelled' ? 'cancelled' : (apt.status === 'completed' ? 'completed' : 'available')),
        maxParticipants: apt.maxParticipants || 1,
        currentParticipants: apt.currentParticipants || 0
      }));
      
      setAppointments(formattedAppointments);
      setFilteredAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = appointments;

    if (searchQuery) {
      filtered = filtered.filter(appointment =>
        appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDate) {
      filtered = filtered.filter(appointment => appointment.date === selectedDate);
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchQuery, selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'booked': return '#F59E0B';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Müsait';
      case 'booked': return 'Dolu';
      case 'completed': return 'Tamamlandı';
      default: return 'Bilinmiyor';
    }
  };

  const handleBookAppointment = (appointmentId: string) => {
    // Randevu rezervasyonu işlemi
    console.log('Randevu rezerve edildi:', appointmentId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header 
        title="Randevular" 
        subtitle={selectedEvent?.name}
      />
      <ScrollView style={styles.scrollView}>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: cardBackground, borderColor }]}>
          <Ionicons name="search" size={20} color={textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Randevu ara..."
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.appointmentsList}>
        {filteredAppointments.map((appointment) => (
          <View key={appointment.id} style={[styles.appointmentCard, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.appointmentHeader}>
              <View style={styles.appointmentInfo}>
                <Text style={[styles.appointmentTitle, { color: textColor }]}>{appointment.title}</Text>
                <Text style={[styles.appointmentDescription, { color: textSecondary }]}>{appointment.description}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
              </View>
            </View>

            <View style={styles.appointmentDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color={textSecondary} />
                <Text style={[styles.detailText, { color: textSecondary }]}>{appointment.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color={textSecondary} />
                <Text style={[styles.detailText, { color: textSecondary }]}>{appointment.time} ({appointment.duration} dk)</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={16} color={textSecondary} />
                <Text style={[styles.detailText, { color: textSecondary }]}>{appointment.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="person" size={16} color={textSecondary} />
                <Text style={[styles.detailText, { color: textSecondary }]}>{appointment.speaker.name} - {appointment.speaker.company}</Text>
              </View>
            </View>

            <View style={styles.participantsInfo}>
              <Text style={[styles.participantsText, { color: textSecondary }]}>
                Katılımcılar: {appointment.currentParticipants}/{appointment.maxParticipants}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(appointment.currentParticipants / appointment.maxParticipants) * 100}%`, backgroundColor: primaryColor }
                  ]} 
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.detailsButton, { borderColor }]}
              onPress={() => router.push({
                pathname: '/appointment-details',
                params: { appointmentId: appointment.id }
              })}
            >
              <Ionicons name="eye-outline" size={16} color={primaryColor} />
              <Text style={[styles.detailsButtonText, { color: primaryColor }]}>Detayları Gör</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {filteredAppointments.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={textMuted} />
          <Text style={[styles.emptyText, { color: textColor }]}>Randevu bulunamadı</Text>
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
  appointmentsList: {
    padding: 16,
  },
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  appointmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appointmentDescription: {
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
  appointmentDetails: {
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
  participantsInfo: {
    marginBottom: 16,
  },
  participantsText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  detailsButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
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