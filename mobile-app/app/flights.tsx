import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../src/services/apiService';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { Fonts } from '../constants/fonts';

interface Flight {
  id: number;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  duration?: string;
  aircraft?: string;
  terminal?: string;
  gate?: string;
  seatClass: string;
  price?: number;
  status: string;
  baggageAllowance?: string;
  mealService?: boolean;
  wifiAvailable?: boolean;
  entertainment?: boolean;
  notes?: string;
  event?: {
    id: number;
    name: string;
  };
}

function airportCode(value?: string) {
  if (!value) return '—';
  const match = value.toUpperCase().match(/\b([A-Z]{3})\b/);
  if (match) return match[1];
  const letters = value.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 3) return letters.slice(0, 3).toUpperCase();
  return value.slice(0, 3).toUpperCase();
}

function airportLabel(value?: string) {
  if (!value) return '';
  const cleaned = value.replace(/\s*\(?[A-Z]{3}\)?\s*/g, ' ').trim();
  return cleaned || value;
}

function formatTime(timeString?: string) {
  if (!timeString) return '--:--';
  const match = String(timeString).match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  const date = new Date(timeString);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return String(timeString).slice(0, 5);
}

function formatDate(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function formatPrice(price?: number) {
  if (price == null || Number.isNaN(Number(price))) return null;
  return `${Number(price).toLocaleString('tr-TR')} ₺`;
}

const FlightsScreen: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [booked, setBooked] = useState(false);

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
      fetchFlights();
    }
  }, [selectedEvent]);

  const loadSelectedEvent = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      if (eventData) {
        setSelectedEvent(JSON.parse(eventData));
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading selected event:', error);
      setLoading(false);
    }
  };

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFlights(selectedEvent?.id) as any;
      setFlights(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFlights();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'active':
        return primaryColor;
      case 'boarding':
        return warningColor;
      case 'departed':
      case 'arrived':
        return successColor;
      case 'delayed':
        return warningColor;
      case 'cancelled':
        return errorColor;
      default:
        return textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'active':
        return 'Planlandı';
      case 'boarding':
        return 'Biniş';
      case 'departed':
        return 'Kalktı';
      case 'arrived':
        return 'İndi';
      case 'delayed':
        return 'Gecikmeli';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  };

  const getSeatClassText = (seatClass: string) => {
    switch (seatClass) {
      case 'economy':
        return 'Ekonomi';
      case 'business':
        return 'Business';
      case 'first':
        return 'First';
      default:
        return seatClass;
    }
  };

  const closeDetail = () => {
    setSelectedFlight(null);
    setConfirming(false);
    setBooked(false);
  };

  const handleBooking = () => {
    setBooked(true);
    setConfirming(false);
  };

  const renderTicket = (item: Flight, compact = true) => {
    const statusColor = getStatusColor(item.status);
    const price = formatPrice(item.price);
    const depLabel = airportLabel(item.departureAirport);
    const arrLabel = airportLabel(item.arrivalAirport);

    return (
      <View style={[styles.ticket, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.ticketTop}>
          <View style={styles.airlineRow}>
            <View style={[styles.airlineMark, { backgroundColor: `${primaryColor}18` }]}>
              <Ionicons name="airplane" size={16} color={primaryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.airlineName, { color: textColor }]} numberOfLines={1}>
                {item.airline}
              </Text>
              <Text style={[styles.flightNumber, { color: primaryColor }]}>
                {item.flightNumber}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: `${statusColor}55` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.airportCol}>
            <Text style={[styles.iata, { color: textColor }]}>{airportCode(item.departureAirport)}</Text>
            <Text style={[styles.city, { color: textSecondary }]} numberOfLines={1}>
              {depLabel || 'Kalkış'}
            </Text>
            <Text style={[styles.clock, { color: textColor }]}>{formatTime(item.departureTime)}</Text>
            <Text style={[styles.day, { color: textSecondary }]}>{formatDate(item.departureDate)}</Text>
          </View>

          <View style={styles.pathCol}>
            <View style={[styles.pathLine, { backgroundColor: `${primaryColor}44` }]} />
            <View style={[styles.pathPlane, { backgroundColor: `${primaryColor}18` }]}>
              <Ionicons name="airplane" size={14} color={primaryColor} />
            </View>
            <Text style={[styles.duration, { color: textSecondary }]}>
              {item.duration || 'Direkt'}
            </Text>
          </View>

          <View style={[styles.airportCol, styles.airportRight]}>
            <Text style={[styles.iata, { color: textColor }]}>{airportCode(item.arrivalAirport)}</Text>
            <Text style={[styles.city, { color: textSecondary }]} numberOfLines={1}>
              {arrLabel || 'Varış'}
            </Text>
            <Text style={[styles.clock, { color: textColor }]}>{formatTime(item.arrivalTime)}</Text>
            <Text style={[styles.day, { color: textSecondary }]}>{formatDate(item.arrivalDate)}</Text>
          </View>
        </View>

        <View style={styles.perforation}>
          <View style={[styles.notch, styles.notchLeft, { backgroundColor }]} />
          <View style={[styles.dashLine, { borderColor }]} />
          <View style={[styles.notch, styles.notchRight, { backgroundColor }]} />
        </View>

        <View style={styles.metaRow}>
          {item.gate ? (
            <View style={[styles.metaChip, { backgroundColor: `${primaryColor}12` }]}>
              <Text style={[styles.metaKey, { color: textSecondary }]}>Kapı</Text>
              <Text style={[styles.metaVal, { color: textColor }]}>{item.gate}</Text>
            </View>
          ) : null}
          {item.terminal ? (
            <View style={[styles.metaChip, { backgroundColor: `${primaryColor}12` }]}>
              <Text style={[styles.metaKey, { color: textSecondary }]}>Terminal</Text>
              <Text style={[styles.metaVal, { color: textColor }]}>{item.terminal}</Text>
            </View>
          ) : null}
          <View style={[styles.metaChip, { backgroundColor: `${primaryColor}12` }]}>
            <Text style={[styles.metaKey, { color: textSecondary }]}>Sınıf</Text>
            <Text style={[styles.metaVal, { color: textColor }]}>{getSeatClassText(item.seatClass)}</Text>
          </View>
          {price ? (
            <View style={[styles.metaChip, styles.priceChip, { backgroundColor: `${primaryColor}18` }]}>
              <Text style={[styles.metaVal, { color: primaryColor }]}>{price}</Text>
            </View>
          ) : null}
        </View>

        {!compact && item.aircraft ? (
          <Text style={[styles.aircraftLine, { color: textSecondary }]}>
            {item.aircraft}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderFlightItem = ({ item }: { item: Flight }) => (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => {
        setConfirming(false);
        setBooked(false);
        setSelectedFlight(item);
      }}
    >
      {renderTicket(item)}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: `${primaryColor}16` }]}>
        <Ionicons name="airplane-outline" size={36} color={primaryColor} />
      </View>
      <Text style={[styles.emptyTitle, { color: textColor }]}>Uçuş bulunamadı</Text>
      <Text style={[styles.emptyDescription, { color: textSecondary }]}>
        {selectedEvent
          ? `${selectedEvent.name} için henüz uçuş bilgisi eklenmemiş.`
          : 'Lütfen önce bir etkinlik seçin.'}
      </Text>
    </View>
  );

  const amenity = (on: boolean | undefined, icon: keyof typeof Ionicons.glyphMap, label: string) => (
    <View style={[styles.amenity, { borderColor, opacity: on ? 1 : 0.38 }]}>
      <Ionicons name={icon} size={16} color={on ? primaryColor : textSecondary} />
      <Text style={[styles.amenityText, { color: on ? textColor : textSecondary }]}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <Screen style={[styles.container, { backgroundColor }]}>
        <Header title="Uçuşlar" subtitle={selectedEvent?.name} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Uçuşlar yükleniyor...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Uçuşlar" subtitle={selectedEvent?.name} />

      <FlatList
        data={flights}
        renderItem={renderFlightItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContainer, flights.length === 0 && styles.listEmpty]}
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

      <Modal visible={!!selectedFlight} transparent animationType="fade" onRequestClose={closeDetail}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPressIn={closeDetail} accessibilityLabel="Kapat" />
          {selectedFlight ? (
            <View style={[styles.modalSheet, { backgroundColor: cardBackground, borderColor }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderTicket(selectedFlight, false)}

                <View style={styles.detailBlock}>
                  {selectedFlight.aircraft ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="airplane-outline" size={18} color={primaryColor} />
                      <Text style={[styles.detailLabel, { color: textSecondary }]}>Uçak</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{selectedFlight.aircraft}</Text>
                    </View>
                  ) : null}
                  {selectedFlight.baggageAllowance ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="briefcase-outline" size={18} color={primaryColor} />
                      <Text style={[styles.detailLabel, { color: textSecondary }]}>Bagaj</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{selectedFlight.baggageAllowance}</Text>
                    </View>
                  ) : null}
                  {selectedFlight.notes ? (
                    <Text style={[styles.notes, { color: textSecondary }]}>{selectedFlight.notes}</Text>
                  ) : null}
                  <View style={styles.amenityRow}>
                    {amenity(selectedFlight.mealService, 'restaurant-outline', 'Yemek')}
                    {amenity(selectedFlight.wifiAvailable, 'wifi-outline', 'Wi-Fi')}
                    {amenity(selectedFlight.entertainment, 'film-outline', 'Eğlence')}
                  </View>
                </View>

                {booked ? (
                  <View style={[styles.successBox, { backgroundColor: `${successColor}18` }]}>
                    <Ionicons name="checkmark-circle" size={22} color={successColor} />
                    <Text style={[styles.successText, { color: successColor }]}>
                      Rezervasyon talebiniz alındı.
                    </Text>
                  </View>
                ) : confirming ? (
                  <Text style={[styles.confirmCopy, { color: textSecondary }]}>
                    {selectedFlight.airline} {selectedFlight.flightNumber} uçuşu için rezervasyon yapılsın mı?
                  </Text>
                ) : null}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.ghostBtn, { borderColor }]}
                  onPress={closeDetail}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Kapat"
                >
                  <Text style={[styles.ghostBtnText, { color: textColor }]}>Kapat</Text>
                </TouchableOpacity>
                {selectedFlight.status !== 'cancelled' && !booked ? (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: primaryColor }]}
                    onPress={() => (confirming ? handleBooking() : setConfirming(true))}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={confirming ? 'Rezervasyonu onayla' : 'Rezervasyon'}
                  >
                    <Text style={styles.primaryBtnText}>
                      {confirming ? 'Onayla' : 'Rezervasyon'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  listEmpty: {
    flexGrow: 1,
  },
  ticket: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  airlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  airlineMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  flightNumber: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    letterSpacing: 0.6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  airportCol: {
    flex: 1,
  },
  airportRight: {
    alignItems: 'flex-end',
  },
  iata: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 34,
  },
  city: {
    fontSize: 12,
    marginBottom: 8,
  },
  clock: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  day: {
    fontSize: 12,
    marginTop: 2,
  },
  pathCol: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pathLine: {
    position: 'absolute',
    top: 16,
    left: 8,
    right: 8,
    height: 1,
  },
  pathPlane: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '90deg' }],
  },
  duration: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  perforation: {
    marginTop: 8,
    height: 20,
    justifyContent: 'center',
  },
  dashLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    marginHorizontal: 18,
  },
  notch: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    top: 1,
  },
  notchLeft: {
    left: -9,
  },
  notchRight: {
    right: -9,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  metaChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceChip: {
    marginLeft: 'auto',
  },
  metaKey: {
    fontSize: 10,
    marginBottom: 1,
  },
  metaVal: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  aircraftLine: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 12, 22, 0.72)',
    zIndex: 1,
  },
  modalSheet: {
    position: 'relative',
    zIndex: 5,
    elevation: 12,
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: 22,
    borderWidth: 1,
    paddingTop: 10,
    paddingBottom: 16,
  },
  detailBlock: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    width: 56,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  notes: {
    fontSize: 13,
    lineHeight: 19,
  },
  amenityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  amenity: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  amenityText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  successBox: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  confirmCopy: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#042033',
    fontFamily: Fonts.semiBold,
    fontWeight: '700',
  },
});

export default FlightsScreen;
