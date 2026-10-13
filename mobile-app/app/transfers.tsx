import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../src/services/apiService';
import { useThemeColor } from '../hooks/use-theme-color';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { Fonts } from '../constants/fonts';

interface Transfer {
  id: string;
  name: string;
  description: string;
  type: 'airport' | 'hotel' | 'venue' | 'custom';
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  capacity: number;
  currentBookings: number;
  price: number;
  currency: string;
  vehicleType: 'bus' | 'minibus' | 'car' | 'van' | 'shuttle';
  driverName: string;
  driverPhone: string;
  vehicleNumber?: string;
  status: 'available' | 'full' | 'cancelled' | 'completed';
  isActive: boolean;
  notes?: string;
}

interface TransferBooking {
  id: string;
  transferId: string;
  passengers: number;
  bookingDate: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
}

function formatTime(value?: string) {
  if (!value) return '--:--';
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return String(value).slice(0, 5);
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function money(amount?: number, currency = 'TRY') {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  const symbol = currency === 'TRY' || currency === 'TL' ? '₺' : currency;
  return `${Number(amount).toLocaleString('tr-TR')} ${symbol}`;
}

function inferType(transfer: any): Transfer['type'] {
  if (['airport', 'hotel', 'venue', 'custom'].includes(transfer.type)) return transfer.type;
  const blob = `${transfer.name || ''} ${transfer.fromLocation || ''} ${transfer.toLocation || ''}`.toLowerCase();
  if (blob.includes('hava') || blob.includes('airport')) return 'airport';
  if (blob.includes('otel') || blob.includes('hotel')) return 'hotel';
  if (blob.includes('mekan') || blob.includes('venue')) return 'venue';
  return 'custom';
}

function deriveStatus(transfer: any): Transfer['status'] {
  if (transfer.status && ['available', 'full', 'cancelled', 'completed'].includes(transfer.status)) {
    return transfer.status;
  }
  if (transfer.isActive === false) return 'cancelled';
  if (Number(transfer.currentBookings) >= Number(transfer.capacity || 0) && Number(transfer.capacity) > 0) {
    return 'full';
  }
  return 'available';
}

export default function TransfersScreen() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [myBookings, setMyBookings] = useState<TransferBooking[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookedOk, setBookedOk] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

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
    loadMyBookings();
  }, []);

  useEffect(() => {
    if (selectedEvent) loadTransfers();
  }, [selectedEvent]);

  const loadSelectedEvent = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      if (eventData) setSelectedEvent(JSON.parse(eventData));
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const transfersData = await apiService.getTransfers(selectedEvent?.id);
      const transfersList = Array.isArray(transfersData) ? transfersData : [];

      const formattedTransfers: Transfer[] = transfersList.map((transfer: any) => {
        const fromLocation = transfer.fromLocation || transfer.departureLocation || '';
        const toLocation = transfer.toLocation || transfer.arrivalLocation || '';
        const mapped = {
          id: transfer.id?.toString() || String(transfer.id),
          name: transfer.name || 'Transfer',
          description: transfer.description || '',
          fromLocation,
          toLocation,
          departureTime: transfer.departureTime || '',
          arrivalTime: transfer.arrivalTime || '',
          capacity: transfer.capacity || 0,
          currentBookings: transfer.currentBookings || 0,
          price: Number(transfer.price) || 0,
          currency: transfer.currency || 'TRY',
          vehicleType: transfer.vehicleType || 'car',
          driverName: transfer.driverName || '',
          driverPhone: transfer.driverPhone || '',
          vehicleNumber: transfer.vehicleNumber || '',
          isActive: transfer.isActive !== undefined ? transfer.isActive : true,
          notes: transfer.notes || '',
        };
        return {
          ...mapped,
          type: inferType({ ...transfer, ...mapped }),
          status: deriveStatus(transfer),
        };
      });

      const activeTransfers = formattedTransfers.filter((transfer) => transfer.isActive);
      setTransfers(activeTransfers);
    } catch (error) {
      console.error('Error loading transfers:', error);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransfers();
    setRefreshing(false);
  };

  const loadMyBookings = async () => {
    try {
      const bookings = await AsyncStorage.getItem('transferBookings');
      if (bookings) setMyBookings(JSON.parse(bookings));
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q
        || transfer.name.toLowerCase().includes(q)
        || transfer.fromLocation.toLowerCase().includes(q)
        || transfer.toLocation.toLowerCase().includes(q)
        || transfer.description.toLowerCase().includes(q);
      const matchesType = !selectedType || transfer.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [transfers, searchQuery, selectedType]);

  const getTypeText = (type: string) => {
    switch (type) {
      case 'airport': return 'Havaalanı';
      case 'hotel': return 'Otel';
      case 'venue': return 'Mekan';
      default: return 'Özel';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return successColor;
      case 'full': return errorColor;
      case 'cancelled': return textSecondary;
      case 'completed': return primaryColor;
      default: return textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Müsait';
      case 'full': return 'Dolu';
      case 'cancelled': return 'İptal';
      case 'completed': return 'Tamamlandı';
      default: return status;
    }
  };

  const getVehicleTypeText = (type: string) => {
    switch (type) {
      case 'bus': return 'Otobüs';
      case 'minibus': return 'Minibüs';
      case 'car': return 'Araç';
      case 'van': return 'Van';
      case 'shuttle': return 'Shuttle';
      default: return type;
    }
  };

  const getVehicleIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'bus':
      case 'minibus':
        return 'bus-outline';
      case 'van':
        return 'car-sport-outline';
      default:
        return 'car-outline';
    }
  };

  const isTransferBooked = (transferId: string) =>
    myBookings.some((booking) => booking.transferId === transferId && booking.status === 'confirmed');

  const openTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setPassengerCount(1);
    setSpecialRequests('');
    setBookedOk(false);
    setConfirmCancel(false);
    setShowBookingModal(true);
  };

  const closeModal = () => {
    setShowBookingModal(false);
    setSelectedTransfer(null);
    setBookedOk(false);
    setConfirmCancel(false);
  };

  const confirmBooking = async () => {
    if (!selectedTransfer) return;
    const remaining = Math.max(0, selectedTransfer.capacity - selectedTransfer.currentBookings);
    if (selectedTransfer.status !== 'available' || remaining < 1) return;

    const newBooking: TransferBooking = {
      id: Date.now().toString(),
      transferId: selectedTransfer.id,
      passengers: passengerCount,
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'confirmed',
      specialRequests: specialRequests || undefined,
    };

    try {
      const updatedBookings = [...myBookings, newBooking];
      await AsyncStorage.setItem('transferBookings', JSON.stringify(updatedBookings));
      setMyBookings(updatedBookings);
      setTransfers((prev) =>
        prev.map((transfer) =>
          transfer.id === selectedTransfer.id
            ? { ...transfer, currentBookings: transfer.currentBookings + passengerCount }
            : transfer
        )
      );
      setBookedOk(true);
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const cancelBooking = async () => {
    if (!selectedTransfer) return;
    const booking = myBookings.find((item) => item.transferId === selectedTransfer.id && item.status === 'confirmed');
    if (!booking) return;
    try {
      const updatedBookings = myBookings.map((item) =>
        item.id === booking.id ? { ...item, status: 'cancelled' as const } : item
      );
      await AsyncStorage.setItem('transferBookings', JSON.stringify(updatedBookings));
      setMyBookings(updatedBookings);
      setConfirmCancel(false);
      closeModal();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const filters = [
    { id: '', label: 'Tümü' },
    { id: 'airport', label: 'Havaalanı' },
    { id: 'hotel', label: 'Otel' },
    { id: 'venue', label: 'Mekan' },
    { id: 'custom', label: 'Özel' },
  ];

  const renderTicket = (transfer: Transfer) => {
    const statusColor = getStatusColor(transfer.status);
    const price = money(transfer.price, transfer.currency);
    const booked = isTransferBooked(transfer.id);

    return (
      <View style={[styles.ticket, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.ticketTop}>
          <View style={styles.titleRow}>
            <View style={[styles.mark, { backgroundColor: `${primaryColor}18` }]}>
              <Ionicons name={getVehicleIcon(transfer.vehicleType)} size={16} color={primaryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.transferName, { color: textColor }]} numberOfLines={1}>
                {transfer.name}
              </Text>
              <Text style={[styles.typeLine, { color: primaryColor }]}>{getTypeText(transfer.type)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: `${statusColor}55` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {booked ? 'Rezerve' : getStatusText(transfer.status)}
            </Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.placeCol}>
            <Text style={[styles.placeLabel, { color: textSecondary }]}>Kalkış</Text>
            <Text style={[styles.placeName, { color: textColor }]} numberOfLines={2}>
              {transfer.fromLocation || '—'}
            </Text>
            <Text style={[styles.clock, { color: textColor }]}>{formatTime(transfer.departureTime)}</Text>
            <Text style={[styles.day, { color: textSecondary }]}>{formatDate(transfer.departureTime)}</Text>
          </View>

          <View style={styles.pathCol}>
            <View style={[styles.pathLine, { backgroundColor: `${primaryColor}44` }]} />
            <View style={[styles.pathIcon, { backgroundColor: `${primaryColor}18` }]}>
              <Ionicons name={getVehicleIcon(transfer.vehicleType)} size={14} color={primaryColor} />
            </View>
            <Text style={[styles.duration, { color: textSecondary }]}>
              {getVehicleTypeText(transfer.vehicleType)}
            </Text>
          </View>

          <View style={[styles.placeCol, styles.placeRight]}>
            <Text style={[styles.placeLabel, { color: textSecondary }]}>Varış</Text>
            <Text style={[styles.placeName, { color: textColor }]} numberOfLines={2}>
              {transfer.toLocation || '—'}
            </Text>
            <Text style={[styles.clock, { color: textColor }]}>{formatTime(transfer.arrivalTime)}</Text>
            <Text style={[styles.day, { color: textSecondary }]}>{formatDate(transfer.arrivalTime)}</Text>
          </View>
        </View>

        <View style={styles.perforation}>
          <View style={[styles.notch, styles.notchLeft, { backgroundColor }]} />
          <View style={[styles.dashLine, { borderColor }]} />
          <View style={[styles.notch, styles.notchRight, { backgroundColor }]} />
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: `${primaryColor}12` }]}>
            <Text style={[styles.metaKey, { color: textSecondary }]}>Kapasite</Text>
            <Text style={[styles.metaVal, { color: textColor }]}>
              {transfer.currentBookings}/{transfer.capacity}
            </Text>
          </View>
          {transfer.driverName ? (
            <View style={[styles.metaChip, { backgroundColor: `${primaryColor}12` }]}>
              <Text style={[styles.metaKey, { color: textSecondary }]}>Şoför</Text>
              <Text style={[styles.metaVal, { color: textColor }]} numberOfLines={1}>
                {transfer.driverName}
              </Text>
            </View>
          ) : null}
          {price ? (
            <View style={[styles.metaChip, styles.priceChip, { backgroundColor: `${primaryColor}18` }]}>
              <Text style={[styles.metaVal, { color: primaryColor }]}>{price}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen style={[styles.container, { backgroundColor }]}>
        <Header title="Transfer" subtitle={selectedEvent?.name} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Transferler yükleniyor...</Text>
        </View>
      </Screen>
    );
  }

  const remaining = selectedTransfer
    ? Math.max(0, selectedTransfer.capacity - selectedTransfer.currentBookings)
    : 0;
  const alreadyBooked = selectedTransfer ? isTransferBooked(selectedTransfer.id) : false;

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Transfer" subtitle={selectedEvent?.name} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} tintColor={primaryColor} />
        }
      >
        <View style={[styles.searchInputContainer, { backgroundColor: cardBackground, borderColor }]}>
          <Ionicons name="search-outline" size={18} color={textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Güzergah veya araç ara..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter) => {
            const active = selectedType === filter.id;
            return (
              <TouchableOpacity
                key={filter.id || 'all'}
                style={[
                  styles.filterButton,
                  { backgroundColor: active ? `${primaryColor}18` : cardBackground, borderColor: active ? primaryColor : borderColor },
                ]}
                onPress={() => setSelectedType(filter.id)}
              >
                <Text style={[styles.filterText, { color: active ? primaryColor : textSecondary }]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {filteredTransfers.map((transfer) => (
            <TouchableOpacity key={transfer.id} activeOpacity={0.82} onPress={() => openTransfer(transfer)}>
              {renderTicket(transfer)}
            </TouchableOpacity>
          ))}
        </View>

        {filteredTransfers.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${primaryColor}16` }]}>
              <Ionicons name="car-outline" size={36} color={primaryColor} />
            </View>
            <Text style={[styles.emptyText, { color: textColor }]}>Transfer bulunamadı</Text>
            <Text style={[styles.emptySubtext, { color: textSecondary }]}>
              {selectedEvent ? 'Bu etkinlik için henüz transfer eklenmemiş.' : 'Lütfen önce bir etkinlik seçin.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showBookingModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPressIn={closeModal} accessibilityLabel="Kapat" />
          {selectedTransfer ? (
            <View style={[styles.modalSheet, { borderColor }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.summary}>
                  <Text style={[styles.summaryTitle, { color: textColor }]}>{selectedTransfer.name}</Text>
                  <Text style={[styles.summaryRoute, { color: textSecondary }]}>
                    {selectedTransfer.fromLocation} → {selectedTransfer.toLocation}
                  </Text>
                  <Text style={[styles.summaryMeta, { color: textSecondary }]}>
                    {formatTime(selectedTransfer.departureTime)} · {getVehicleTypeText(selectedTransfer.vehicleType)}
                    {money(selectedTransfer.price, selectedTransfer.currency)
                      ? ` · ${money(selectedTransfer.price, selectedTransfer.currency)}`
                      : ''}
                  </Text>
                </View>

                {selectedTransfer.description ? (
                  <Text style={[styles.notes, { color: textSecondary }]}>{selectedTransfer.description}</Text>
                ) : null}

                <View style={styles.detailBlock}>
                  {selectedTransfer.vehicleNumber ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetag-outline" size={18} color={primaryColor} />
                      <Text style={[styles.detailLabel, { color: textSecondary }]}>Plaka</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{selectedTransfer.vehicleNumber}</Text>
                    </View>
                  ) : null}
                  {selectedTransfer.driverPhone ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={18} color={primaryColor} />
                      <Text style={[styles.detailLabel, { color: textSecondary }]}>Telefon</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{selectedTransfer.driverPhone}</Text>
                    </View>
                  ) : null}
                  {selectedTransfer.notes ? (
                    <Text style={[styles.notes, { color: textSecondary }]}>{selectedTransfer.notes}</Text>
                  ) : null}
                </View>

                {alreadyBooked || bookedOk ? (
                  <View style={[styles.successBox, { backgroundColor: `${successColor}18` }]}>
                    <Ionicons name="checkmark-circle" size={22} color={successColor} />
                    <Text style={[styles.successText, { color: successColor }]}>
                      Transfer rezervasyonunuz onaylandı.
                    </Text>
                  </View>
                ) : confirmCancel ? null : selectedTransfer.status === 'available' && remaining > 0 ? (
                  <View style={styles.bookingForm}>
                    <Text style={[styles.formLabel, { color: textColor }]}>Yolcu sayısı</Text>
                    <View style={[styles.passengerSelector, { backgroundColor: `${primaryColor}12` }]}>
                      <TouchableOpacity
                        style={[styles.passengerButton, { backgroundColor: cardBackground, borderColor }]}
                        onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                      >
                        <Ionicons name="remove" size={18} color={primaryColor} />
                      </TouchableOpacity>
                      <Text style={[styles.passengerCount, { color: textColor }]}>{passengerCount}</Text>
                      <TouchableOpacity
                        style={[styles.passengerButton, { backgroundColor: cardBackground, borderColor }]}
                        onPress={() => setPassengerCount(Math.min(remaining, passengerCount + 1))}
                      >
                        <Ionicons name="add" size={18} color={primaryColor} />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[styles.textArea, { backgroundColor, borderColor, color: textColor }]}
                      placeholder="Özel istek (opsiyonel)"
                      placeholderTextColor={textSecondary}
                      value={specialRequests}
                      onChangeText={setSpecialRequests}
                      multiline
                    />
                    {money(selectedTransfer.price * passengerCount, selectedTransfer.currency) ? (
                      <Text style={[styles.totalAmount, { color: primaryColor }]}>
                        Toplam {money(selectedTransfer.price * passengerCount, selectedTransfer.currency)}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={[styles.notes, { color: textSecondary }]}>
                    Bu transfer şu anda rezervasyona kapalı.
                  </Text>
                )}

                {confirmCancel ? (
                  <Text style={[styles.notes, { color: textSecondary }]}>
                    Bu rezervasyonu iptal etmek istiyor musunuz?
                  </Text>
                ) : null}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.ghostBtn, { borderColor }]}
                  onPress={closeModal}
                  accessibilityRole="button"
                  accessibilityLabel="Kapat"
                >
                  <Text style={[styles.ghostBtnText, { color: textColor }]}>Kapat</Text>
                </TouchableOpacity>
                {alreadyBooked && !bookedOk ? (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: confirmCancel ? errorColor : `${errorColor}18` }]}
                    onPress={() => (confirmCancel ? cancelBooking() : setConfirmCancel(true))}
                    accessibilityRole="button"
                    accessibilityLabel="Rezervasyonu iptal et"
                  >
                    <Text style={[styles.primaryBtnText, { color: confirmCancel ? '#fff' : errorColor }]}>
                      {confirmCancel ? 'İptal et' : 'İptal'}
                    </Text>
                  </TouchableOpacity>
                ) : selectedTransfer.status === 'available' && remaining > 0 && !bookedOk ? (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: primaryColor }]}
                    onPress={confirmBooking}
                    accessibilityRole="button"
                    accessibilityLabel="Rezerve et"
                  >
                    <Text style={styles.primaryBtnText}>Rezerve et</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: Fonts.regular },
  filters: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: Fonts.medium, fontWeight: '500' },
  list: { padding: 16, paddingBottom: 32 },
  ticket: { borderRadius: 20, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10, gap: 10 },
  mark: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  transferName: { fontSize: 14, fontFamily: Fonts.semiBold, fontWeight: '600' },
  typeLine: { fontSize: 12, fontFamily: Fonts.medium },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: Fonts.semiBold, fontWeight: '600' },
  routeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  placeCol: { flex: 1 },
  placeRight: { alignItems: 'flex-end' },
  placeLabel: { fontSize: 11, marginBottom: 4 },
  placeName: { fontSize: 15, fontFamily: Fonts.semiBold, fontWeight: '600', marginBottom: 8, lineHeight: 20 },
  clock: { fontSize: 16, fontFamily: Fonts.semiBold, fontWeight: '600' },
  day: { fontSize: 12, marginTop: 2 },
  pathCol: { width: 78, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  pathLine: { position: 'absolute', top: 18, left: 8, right: 8, height: 1 },
  pathIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  duration: { fontSize: 11, marginTop: 6, textAlign: 'center' },
  perforation: { marginTop: 8, height: 20, justifyContent: 'center' },
  dashLine: { borderStyle: 'dashed', borderWidth: 1, marginHorizontal: 18 },
  notch: { position: 'absolute', width: 18, height: 18, borderRadius: 9, top: 1 },
  notchLeft: { left: -9 },
  notchRight: { right: -9 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
  metaChip: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  priceChip: { marginLeft: 'auto' },
  metaKey: { fontSize: 10, marginBottom: 1 },
  metaVal: { fontSize: 13, fontFamily: Fonts.semiBold, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 18, fontFamily: Fonts.semiBold, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  modalRoot: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 12, 22, 0.72)', zIndex: 1 },
  modalSheet: {
    position: 'relative',
    zIndex: 5,
    elevation: 12,
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: 22,
    borderWidth: 1,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: '#102536',
  },
  detailBlock: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 13, width: 64 },
  detailValue: { flex: 1, fontSize: 14, fontFamily: Fonts.medium },
  notes: { marginHorizontal: 16, marginBottom: 8, fontSize: 13, lineHeight: 19 },
  summary: { paddingHorizontal: 16, paddingBottom: 8, gap: 4 },
  summaryTitle: { fontSize: 16, fontFamily: Fonts.semiBold, fontWeight: '600' },
  summaryRoute: { fontSize: 13, lineHeight: 18 },
  summaryMeta: { fontSize: 12 },
  bookingForm: { paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  formLabel: { fontSize: 14, fontFamily: Fonts.semiBold, fontWeight: '600' },
  passengerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 10,
  },
  passengerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerCount: { fontSize: 22, fontFamily: Fonts.bold, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 72, textAlignVertical: 'top' },
  totalAmount: { fontSize: 15, fontFamily: Fonts.semiBold, fontWeight: '600', textAlign: 'right' },
  successBox: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: { flex: 1, fontSize: 13, fontFamily: Fonts.medium },
  modalActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  ghostBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { fontFamily: Fonts.semiBold, fontWeight: '600' },
  primaryBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: '#042033', fontFamily: Fonts.semiBold, fontWeight: '700' },
});
