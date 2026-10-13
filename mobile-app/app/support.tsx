import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { Header } from '../components/Header';
import { useThemeColor } from '../hooks/use-theme-color';
import apiService from '../src/services/apiService';

export default function SupportListScreen() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const load = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      const event = eventData ? JSON.parse(eventData) : null;
      const list = await apiService.getSupportTickets(event?.id);
      setTickets(list);
    } catch (error) {
      console.error('Support list error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <Header
        title="Destek"
        rightComponent={
          <TouchableOpacity onPress={() => router.push('/support-new')}>
            <Ionicons name="add-circle-outline" size={26} color={primaryColor} />
          </TouchableOpacity>
        }
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={primaryColor} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          contentContainerStyle={tickets.length === 0 ? styles.empty : { padding: 16 }}
          ListEmptyComponent={<Text style={{ color: textSecondary, textAlign: 'center' }}>Henüz talebin yok. + ile konu aç.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => router.push({ pathname: '/support-detail', params: { id: item.id } })}
            >
              <View style={styles.row}>
                <Text style={[styles.subject, { color: textColor }]}>{item.subject}</Text>
                <Text style={[styles.badge, { color: item.status === 'open' ? primaryColor : textSecondary }]}>
                  {item.status === 'open' ? 'Açık' : 'Kapalı'}
                </Text>
              </View>
              <Text style={{ color: textSecondary }} numberOfLines={2}>
                {item.lastMessage?.body || 'Ek gönderildi'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subject: { fontWeight: '700', flex: 1, marginRight: 8 },
  badge: { fontSize: 12, fontWeight: '600' },
});
