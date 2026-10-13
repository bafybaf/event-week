import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { apiService } from '../src/services/apiService';
import { Header } from '../components/Header';
import { useThemeColor } from '../hooks/use-theme-color';

interface AppointmentDetails {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  status: string;
  requester?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  requestedUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  event?: {
    name: string;
  };
  notes?: string;
}

export default function AppointmentDetailsScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    if (appointmentId) {
      loadAppointmentDetails();
    }
  }, [appointmentId]);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);
      const appointmentData = await apiService.get(`/appointments/${appointmentId}`) as any;
      
      const appointmentDetails: AppointmentDetails = {
        id: appointmentData.appointment?.id || appointmentData.id,
        title: appointmentData.appointment?.title || appointmentData.title,
        description: appointmentData.appointment?.description || appointmentData.description || '',
        date: appointmentData.appointment?.appointmentDate 
          ? new Date(appointmentData.appointment.appointmentDate).toLocaleDateString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          : '',
        time: appointmentData.appointment?.appointmentDate 
          ? new Date(appointmentData.appointment.appointmentDate).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit'
            })
          : '',
        duration: appointmentData.appointment?.duration || appointmentData.duration || 30,
        location: appointmentData.appointment?.location || appointmentData.location || '',
        status: appointmentData.appointment?.status || appointmentData.status || 'pending',
        requester: appointmentData.appointment?.requester || appointmentData.requester,
        requestedUser: appointmentData.appointment?.requestedUser || appointmentData.requestedUser,
        event: appointmentData.appointment?.event || appointmentData.event,
        notes: appointmentData.appointment?.notes || appointmentData.notes || ''
      };
      
      setAppointment(appointmentDetails);
    } catch (error) {
      console.error('Error loading appointment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'accepted': case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'completed': return '#3B82F6';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        <Header title="Randevu Detayları" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        <Header title="Randevu Detayları" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={textSecondary} />
          <Text style={[styles.errorText, { color: textColor }]}>Randevu bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <Header title="Randevu Detayları" />

      <ScrollView style={styles.scrollView}>
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: textColor }]}>{appointment.title}</Text>

          {/* Description */}
          {appointment.description ? (
            <Text style={[styles.description, { color: textSecondary }]}>{appointment.description}</Text>
          ) : null}

          {/* Details */}
          <View style={styles.detailsSection}>
            {appointment.date && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color={primaryColor} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: textSecondary }]}>Tarih</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{appointment.date}</Text>
                </View>
              </View>
            )}

            {appointment.time && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color={primaryColor} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: textSecondary }]}>Saat</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {appointment.time} ({appointment.duration} dakika)
                  </Text>
                </View>
              </View>
            )}

            {appointment.location && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color={primaryColor} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: textSecondary }]}>Konum</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{appointment.location}</Text>
                </View>
              </View>
            )}

            {appointment.event && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color={primaryColor} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: textSecondary }]}>Etkinlik</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{appointment.event.name}</Text>
                </View>
              </View>
            )}

            {appointment.requester && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color={primaryColor} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: textSecondary }]}>Talep Eden</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {appointment.requester.firstName} {appointment.requester.lastName}
                  </Text>
                  <Text style={[styles.detailSubValue, { color: textSecondary }]}>
                    {appointment.requester.email}
                  </Text>
                </View>
              </View>
            )}

            {appointment.requestedUser && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color={primaryColor} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: textSecondary }]}>Randevu Alacak</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {appointment.requestedUser.firstName} {appointment.requestedUser.lastName}
                  </Text>
                  <Text style={[styles.detailSubValue, { color: textSecondary }]}>
                    {appointment.requestedUser.email}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Notes */}
          {appointment.notes && (
            <View style={[styles.notesSection, { borderTopColor: borderColor }]}>
              <Text style={[styles.notesLabel, { color: textSecondary }]}>Notlar</Text>
              <Text style={[styles.notesText, { color: textColor }]}>{appointment.notes}</Text>
            </View>
          )}
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailSubValue: {
    fontSize: 14,
    marginTop: 2,
  },
  notesSection: {
    paddingTop: 20,
    borderTopWidth: 1,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

