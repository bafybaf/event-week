import React, { useEffect, useState } from 'react';
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
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '../hooks/use-theme-color';
import { apiService } from '../src/services/apiService';
import { fixImageUrl } from '../src/config/apiConfig';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { Fonts } from '../constants/fonts';

interface Accommodation {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  roomType: string;
  totalRooms: number;
  availableRooms: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  amenities: string;
  facilities: string;
  policies: string;
  cancellationPolicy: string;
  images: string;
  rating: number;
  isActive: boolean;
  notes?: string;
}

function formatDate(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function formatTime(timeString?: string) {
  if (!timeString) return '';
  const match = String(timeString).match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  const date = new Date(timeString);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return String(timeString).slice(0, 5);
}

function money(amount?: number, currency = 'TRY') {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  const symbol = currency === 'TRY' || currency === 'TL' ? '₺' : currency;
  return `${Number(amount).toLocaleString('tr-TR')} ${symbol}`;
}

function firstImage(images?: string) {
  if (!images) return null;
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed[0]) return fixImageUrl(String(parsed[0]));
    if (typeof parsed === 'string') return fixImageUrl(parsed);
  } catch {
    const first = images.split(',')[0]?.trim();
    if (first) return fixImageUrl(first);
  }
  return null;
}

function splitList(value?: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  return value.split(/[,;•|]/).map((item) => item.trim()).filter(Boolean);
}

const AccommodationsScreen: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selected, setSelected] = useState<Accommodation | null>(null);
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

  useEffect(() => {
    loadSelectedEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) fetchAccommodations();
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

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAccommodations(selectedEvent?.id) as any;
      setAccommodations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching accommodations:', error);
      setAccommodations([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAccommodations();
    setRefreshing(false);
  };

  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'resort': return 'umbrella-outline';
      case 'apartment': return 'home-outline';
      case 'hostel': return 'people-outline';
      case 'guesthouse': return 'business-outline';
      case 'villa': return 'leaf-outline';
      default: return 'bed-outline';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'hotel': return 'Otel';
      case 'resort': return 'Resort';
      case 'apartment': return 'Apartman';
      case 'hostel': return 'Hostel';
      case 'guesthouse': return 'Pansiyon';
      case 'villa': return 'Villa';
      default: return type;
    }
  };

  const getRoomTypeText = (roomType: string) => {
    switch (roomType) {
      case 'single': return 'Tek kişilik';
      case 'double': return 'Çift kişilik';
      case 'twin': return 'İki yataklı';
      case 'triple': return 'Üç kişilik';
      case 'quad': return 'Dört kişilik';
      case 'suite': return 'Suit';
      case 'family': return 'Aile odası';
      default: return roomType;
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setConfirming(false);
    setBooked(false);
  };

  const renderTicket = (item: Accommodation, compact = true) => {
    const photo = firstImage(item.images);
    const statusColor = item.isActive ? successColor : warningColor;
    const nightPrice = money(item.pricePerNight, item.currency);
    const total = money(item.totalPrice, item.currency);

    return (
      <View style={[styles.ticket, { backgroundColor: cardBackground, borderColor }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.cover} contentFit="cover" />
        ) : null}

        <View style={styles.ticketTop}>
          <View style={styles.titleRow}>
            <View style={[styles.mark, { backgroundColor: `${primaryColor}18` }]}>
              <Ionicons name={getTypeIcon(item.type)} size={16} color={primaryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hotelName, { color: textColor }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.typeLine, { color: primaryColor }]}>
                {getTypeText(item.type)} · {getRoomTypeText(item.roomType)}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: `${statusColor}55` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.isActive ? 'Aktif' : 'Pasif'}
            </Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.placeCol}>
            <Text style={[styles.placeLabel, { color: textSecondary }]}>Giriş</Text>
            <Text style={[styles.clock, { color: textColor }]}>{formatDate(item.checkInDate)}</Text>
            <Text style={[styles.day, { color: textSecondary }]}>
              {formatTime(item.checkInTime) || '15:00'}
            </Text>
          </View>

          <View style={styles.pathCol}>
            <View style={[styles.pathLine, { backgroundColor: `${primaryColor}44` }]} />
            <View style={[styles.pathIcon, { backgroundColor: `${primaryColor}18` }]}>
              <Ionicons name="bed-outline" size={14} color={primaryColor} />
            </View>
            <Text style={[styles.duration, { color: textSecondary }]}>Konaklama</Text>
          </View>

          <View style={[styles.placeCol, styles.placeRight]}>
            <Text style={[styles.placeLabel, { color: textSecondary }]}>Çıkış</Text>
            <Text style={[styles.clock, { color: textColor }]}>{formatDate(item.checkOutDate)}</Text>
            <Text style={[styles.day, { color: textSecondary }]}>
              {formatTime(item.checkOutTime) || '11:00'}
            </Text>
          </View>
        </View>

        <View style={styles.perforation}>
          <View style={[styles.notch, styles.notchLeft, { backgroundColor }]} />
          <View style={[styles.dashLine, { borderColor }]} />
          <View style={[styles.notch, styles.notchRight, { backgroundColor }]} />
        </View>

        <View style={styles.metaRow}>
          {item.city ? (
            <View style={[styles.metaChip, { backgroundColor: `${primaryColor}12` }]}>
              <Text style={[styles.metaKey, { color: textSecondary }]}>Konum</Text>
              <Text style={[styles.metaVal, { color: textColor }]} numberOfLines={1}>
                {item.city}
              </Text>
            </View>
          ) : null}
          {item.rating ? (
            <View style={[styles.metaChip, { backgroundColor: `${primaryColor}12` }]}>
              <Text style={[styles.metaKey, { color: textSecondary }]}>Puan</Text>
              <Text style={[styles.metaVal, { color: textColor }]}>{Number(item.rating).toFixed(1)}</Text>
            </View>
          ) : null}
          <View style={[styles.metaChip, { backgroundColor: `${primaryColor}12` }]}>
            <Text style={[styles.metaKey, { color: textSecondary }]}>Oda</Text>
            <Text style={[styles.metaVal, { color: textColor }]}>
              {item.availableRooms}/{item.totalRooms}
            </Text>
          </View>
          {nightPrice ? (
            <View style={[styles.metaChip, styles.priceChip, { backgroundColor: `${primaryColor}18` }]}>
              <Text style={[styles.metaVal, { color: primaryColor }]}>{nightPrice}/gece</Text>
            </View>
          ) : null}
        </View>

        {!compact && total ? (
          <Text style={[styles.totalLine, { color: textSecondary }]}>Toplam {total}</Text>
        ) : null}
      </View>
    );
  };

  const amenityChips = selected ? splitList(selected.amenities).slice(0, 8) : [];

  if (loading) {
    return (
      <Screen style={[styles.container, { backgroundColor }]}>
        <Header title="Rezervasyon" subtitle={selectedEvent?.name} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Rezervasyonlar yükleniyor...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Rezervasyon" subtitle={selectedEvent?.name} />

      <FlatList
        data={accommodations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, accommodations.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} tintColor={primaryColor} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => {
              setConfirming(false);
              setBooked(false);
              setSelected(item);
            }}
          >
            {renderTicket(item)}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${primaryColor}16` }]}>
              <Ionicons name="bed-outline" size={36} color={primaryColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>Rezervasyon bulunamadı</Text>
            <Text style={[styles.emptyDescription, { color: textSecondary }]}>
              {selectedEvent
                ? `${selectedEvent.name} için henüz konaklama rezervasyonu eklenmemiş.`
                : 'Lütfen önce bir etkinlik seçin.'}
            </Text>
          </View>
        }
      />

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={closeDetail}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPressIn={closeDetail} accessibilityLabel="Kapat" />
          {selected ? (
            <View style={[styles.modalSheet, { borderColor }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.summary}>
                  <Text style={[styles.summaryTitle, { color: textColor }]}>{selected.name}</Text>
                  <Text style={[styles.summaryRoute, { color: textSecondary }]}>
                    {getTypeText(selected.type)} · {getRoomTypeText(selected.roomType)}
                  </Text>
                  <Text style={[styles.summaryMeta, { color: textSecondary }]}>
                    {formatDate(selected.checkInDate)} – {formatDate(selected.checkOutDate)}
                    {money(selected.pricePerNight, selected.currency)
                      ? ` · ${money(selected.pricePerNight, selected.currency)}/gece`
                      : ''}
                  </Text>
                </View>

                <View style={styles.detailBlock}>
                  {selected.address ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={18} color={primaryColor} />
                      <Text style={[styles.detailValue, { color: textColor }]}>
                        {selected.address}
                      </Text>
                    </View>
                  ) : selected.city ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={18} color={primaryColor} />
                      <Text style={[styles.detailValue, { color: textColor }]}>{selected.city}</Text>
                    </View>
                  ) : null}
                  {selected.phone ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={18} color={primaryColor} />
                      <Text style={[styles.detailValue, { color: textColor }]}>{selected.phone}</Text>
                    </View>
                  ) : null}
                  {selected.email ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="mail-outline" size={18} color={primaryColor} />
                      <Text style={[styles.detailValue, { color: textColor }]}>{selected.email}</Text>
                    </View>
                  ) : null}
                  {amenityChips.length > 0 ? (
                    <View style={styles.amenityWrap}>
                      {amenityChips.map((amenity) => (
                        <View key={amenity} style={[styles.amenity, { borderColor }]}>
                          <Text style={[styles.amenityText, { color: textSecondary }]}>{amenity}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {selected.cancellationPolicy ? (
                    <Text style={[styles.notes, { color: textSecondary }]}>{selected.cancellationPolicy}</Text>
                  ) : null}
                </View>

                {booked ? (
                  <View style={[styles.successBox, { backgroundColor: `${successColor}18` }]}>
                    <Ionicons name="checkmark-circle" size={22} color={successColor} />
                    <Text style={[styles.successText, { color: successColor }]}>
                      Rezervasyon talebiniz alındı.
                    </Text>
                  </View>
                ) : confirming ? (
                  <Text style={[styles.notes, { color: textSecondary }]}>
                    {selected.name} için rezervasyon yapılsın mı?
                  </Text>
                ) : null}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.ghostBtn, { borderColor }]}
                  onPress={closeDetail}
                  accessibilityRole="button"
                  accessibilityLabel="Kapat"
                >
                  <Text style={[styles.ghostBtnText, { color: textColor }]}>Kapat</Text>
                </TouchableOpacity>
                {selected.isActive && selected.availableRooms > 0 && !booked ? (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: primaryColor }]}
                    onPress={() => (confirming ? setBooked(true) : setConfirming(true))}
                    accessibilityRole="button"
                    accessibilityLabel={confirming ? 'Rezervasyonu onayla' : 'Rezervasyon'}
                  >
                    <Text style={styles.primaryBtnText}>{confirming ? 'Onayla' : 'Rezervasyon'}</Text>
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
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  list: { padding: 16, paddingBottom: 32 },
  listEmpty: { flexGrow: 1 },
  ticket: { borderRadius: 20, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  cover: { width: '100%', height: 132, backgroundColor: '#0D2130' },
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
  hotelName: { fontSize: 14, fontFamily: Fonts.semiBold, fontWeight: '600' },
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
  clock: { fontSize: 18, fontFamily: Fonts.bold, fontWeight: '700' },
  day: { fontSize: 12, marginTop: 2 },
  pathCol: { width: 88, alignItems: 'center', justifyContent: 'center' },
  pathLine: { position: 'absolute', top: 16, left: 8, right: 8, height: 1 },
  pathIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  duration: { fontSize: 11, marginTop: 6 },
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
  totalLine: { paddingHorizontal: 16, paddingBottom: 14, fontSize: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72, paddingHorizontal: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: Fonts.semiBold, fontWeight: '600', marginBottom: 8 },
  emptyDescription: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
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
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailValue: { flex: 1, fontSize: 14, fontFamily: Fonts.medium, lineHeight: 20 },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenity: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  amenityText: { fontSize: 11, fontFamily: Fonts.medium },
  notes: { marginHorizontal: 16, marginTop: 4, fontSize: 13, lineHeight: 19 },
  summary: { paddingHorizontal: 16, paddingBottom: 8, gap: 4 },
  summaryTitle: { fontSize: 16, fontFamily: Fonts.semiBold, fontWeight: '600' },
  summaryRoute: { fontSize: 13, lineHeight: 18 },
  summaryMeta: { fontSize: 12 },
  successBox: {
    marginHorizontal: 16,
    marginTop: 8,
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

export default AccommodationsScreen;
