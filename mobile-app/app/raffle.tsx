import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { useThemeColor } from '../hooks/use-theme-color';
import { apiService } from '../src/services/apiService';
import { Fonts } from '../constants/fonts';

type RaffleWinner = {
  name: string;
  company?: string;
  title?: string;
};

type RaffleLive = {
  phase: 'closed' | 'roster' | 'draw' | 'spinning' | 'revealed';
  highlightName?: string;
  highlightCompany?: string;
  participantCount?: number;
  eventName?: string;
  winner?: RaffleWinner | null;
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function RaffleScreen() {
  const [live, setLive] = useState<RaffleLive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const poll = async () => {
    try {
      const data = await apiService.getRaffleWatch();
      setLive(data.live || { phase: 'closed' });
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Çekiliş yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    poll();
    const timer = setInterval(poll, 800);
    return () => clearInterval(timer);
  }, []);

  const phase = live?.phase || 'closed';
  const count = live?.participantCount || 0;
  const winner = live?.winner;

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Çekiliş" subtitle={live?.eventName || undefined} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={primaryColor} size="large" />
        </View>
      ) : phase === 'closed' ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIcon, { backgroundColor: `${primaryColor}16` }]}>
            <Ionicons name="gift-outline" size={36} color={primaryColor} />
          </View>
          <Text style={[styles.emptyTitle, { color: textColor }]}>Çekiliş kapalı</Text>
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            Organizatör sahneyi açınca çekiliş burada canlı görünür.
          </Text>
          {error ? <Text style={[styles.emptyText, { color: textSecondary }]}>{error}</Text> : null}
        </View>
      ) : phase === 'revealed' && winner?.name ? (
        <View style={styles.centered}>
          <Text style={[styles.kicker, { color: primaryColor }]}>KAZANAN</Text>
          <View style={[styles.badge, { borderColor: primaryColor, backgroundColor: cardBackground }]}>
            <Text style={[styles.badgeText, { color: primaryColor }]}>{initials(winner.name)}</Text>
          </View>
          <Text style={[styles.winnerName, { color: textColor }]}>{winner.name}</Text>
          {winner.title || winner.company ? (
            <Text style={[styles.meta, { color: primaryColor }]}>
              {[winner.title, winner.company].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
      ) : phase === 'spinning' ? (
        <View style={styles.centered}>
          <Text style={[styles.kicker, { color: primaryColor }]}>ŞANSLI İSİM</Text>
          <Text style={[styles.spinName, { color: textColor }]}>{live?.highlightName || '...'}</Text>
          {live?.highlightCompany ? (
            <Text style={[styles.meta, { color: textSecondary }]}>{live.highlightCompany}</Text>
          ) : null}
          <Text style={[styles.emptyText, { color: textSecondary }]}>Çekiliyor...</Text>
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={[styles.kicker, { color: primaryColor }]}>
            {phase === 'draw' ? 'ŞANSLI İSİM' : 'ÇEKİLİŞ AÇIK'}
          </Text>
          <View style={[styles.question, { borderColor, backgroundColor: cardBackground }]}>
            <Text style={[styles.questionMark, { color: primaryColor }]}>?</Text>
          </View>
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            {count > 0
              ? `${count} kişi arasından çekilecek`
              : 'Çekiliş başlamak üzere. Ekranı açık tutun.'}
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  kicker: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    letterSpacing: 3,
    marginBottom: 18,
  },
  question: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  questionMark: {
    fontFamily: Fonts.bold,
    fontSize: 72,
    lineHeight: 80,
  },
  spinName: {
    fontFamily: Fonts.bold,
    fontSize: 40,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 10,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 32,
  },
  winnerName: {
    fontFamily: Fonts.bold,
    fontSize: 36,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 8,
  },
  meta: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    textAlign: 'center',
  },
});
