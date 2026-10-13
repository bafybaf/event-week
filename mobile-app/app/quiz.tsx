import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { useThemeColor } from '../hooks/use-theme-color';
import { apiService } from '../src/services/apiService';
import { Fonts } from '../constants/fonts';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const OPTION_BLUES = ['#2BB6E8', '#1A9ED4', '#0E90C8', '#0A6F9C'];

export default function QuizScreen() {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState('');
  const joinedFor = useRef<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const poll = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      const event = eventData ? JSON.parse(eventData) : null;
      const data = await apiService.getLiveQuiz(event?.id);
      const next = data.state || null;
      setState(next);
      setError('');
      if (next?.quiz?.id && joinedFor.current !== next.quiz.id) {
        joinedFor.current = next.quiz.id;
        setJoining(true);
        try {
          const joined = await apiService.joinQuiz(next.quiz.id);
          setState(joined);
        } catch {
          /* lobby join may fail if ended between polls */
        } finally {
          setJoining(false);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Quiz yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    poll();
    const timer = setInterval(poll, 1000);
    return () => clearInterval(timer);
  }, []);

  const answer = async (index: number) => {
    if (!state?.quiz?.id || answering) return;
    if (state.quiz.status !== 'question') return;
    if (state.me?.selectedIndex === index) return;
    setAnswering(true);
    try {
      const next = await apiService.answerQuiz(state.quiz.id, index);
      setState(next);
    } catch (err: any) {
      setError(err?.message || 'Cevap gönderilemedi');
    } finally {
      setAnswering(false);
    }
  };

  const quiz = state?.quiz;
  const question = state?.question;
  const seconds = Math.ceil((quiz?.timeRemainingMs || 0) / 1000);

  return (
    <Screen style={[styles.container, { backgroundColor }]}>
      <Header title="Canlı Quiz" subtitle={quiz?.title} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={primaryColor} size="large" />
        </View>
      ) : !quiz ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIcon, { backgroundColor: `${primaryColor}16` }]}>
            <Ionicons name="flash-outline" size={36} color={primaryColor} />
          </View>
          <Text style={[styles.emptyTitle, { color: textColor }]}>Şu an canlı quiz yok</Text>
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            Organizatör oturumu açınca burada görünür.
          </Text>
        </View>
      ) : (
        <View style={styles.body}>
          {joining ? <Text style={[styles.meta, { color: textSecondary }]}>Katılıyor...</Text> : null}

          {quiz.status === 'lobby' && (
            <View style={styles.centered}>
              <Text style={[styles.hero, { color: textColor }]}>Hazır ol</Text>
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                {quiz.playerCount} kişi lobide. Soru başlamak üzere.
              </Text>
            </View>
          )}

          {(quiz.status === 'question' || quiz.status === 'reveal') && question ? (
            <>
              <View style={styles.topRow}>
                <Text style={[styles.meta, { color: textSecondary }]}>
                  {question.index + 1}/{question.total}
                </Text>
                <View style={[styles.timer, { borderColor: primaryColor }]}>
                  <Text style={[styles.timerText, { color: primaryColor }]}>
                    {quiz.status === 'question' ? seconds : '✓'}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: textSecondary }]}>{state.me?.score || 0} p</Text>
              </View>
              <Text style={[styles.question, { color: textColor }]}>{question.text}</Text>
              <View style={styles.grid}>
                {question.options.map((opt: any) => {
                  const selected = state.me?.selectedIndex === opt.index;
                  const revealed = quiz.status === 'reveal';
                  const isCorrect = revealed && opt.correct;
                  const isWrongPick = revealed && selected && !opt.correct;
                  const dim = revealed && !opt.correct && !selected;
                  let backgroundColor = OPTION_BLUES[opt.index % OPTION_BLUES.length];
                  if (isCorrect) backgroundColor = '#059669';
                  if (isWrongPick) backgroundColor = '#DC2626';
                  return (
                    <TouchableOpacity
                      key={opt.index}
                      accessibilityRole="button"
                      accessibilityLabel={`${OPTION_LETTERS[opt.index] || ''} ${opt.text}`}
                      activeOpacity={0.85}
                      disabled={quiz.status !== 'question' || answering}
                      onPress={() => answer(opt.index)}
                      style={[
                        styles.choice,
                        {
                          backgroundColor,
                          opacity: dim ? 0.38 : 1,
                          borderWidth: selected || isCorrect ? 3 : 0,
                          borderColor: isCorrect ? '#6EE7B7' : '#fff',
                        },
                      ]}
                    >
                      <View style={styles.choiceHead}>
                        <Text style={styles.letter}>{OPTION_LETTERS[opt.index % OPTION_LETTERS.length]}</Text>
                        {isCorrect ? <Text style={styles.badge}>✓ Doğru</Text> : null}
                        {isWrongPick ? <Text style={styles.badge}>✗ Yanlış</Text> : null}
                        {!revealed && selected ? <Text style={styles.badge}>Seçildi</Text> : null}
                      </View>
                      <Text style={styles.choiceText}>{opt.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {quiz.status === 'question' ? (
                <Text style={[styles.hint, { color: textSecondary }]}>
                  Süre bitene kadar şık değiştirebilirsiniz
                </Text>
              ) : null}
              {quiz.status === 'reveal' ? (
                <Text style={[styles.result, { color: state.me?.isCorrect ? '#10b981' : '#ef4444' }]}>
                  {state.me?.selectedIndex == null
                    ? 'Cevap vermediniz'
                    : state.me.isCorrect
                      ? `Doğru · +${state.me.points}`
                      : 'Yanlış cevap'}
                </Text>
              ) : null}
            </>
          ) : null}

          {(quiz.status === 'leaderboard' || quiz.status === 'ended') && (
            <View style={{ flex: 1 }}>
              <Text style={[styles.hero, { color: textColor }]}>Sıralama</Text>
              {(state.leaderboard || []).map((row: any) => (
                <View key={row.userId} style={[styles.rankRow, { backgroundColor: cardBackground, borderColor }]}>
                  <Text style={[styles.rank, { color: primaryColor }]}>{row.rank}</Text>
                  <Text style={[styles.rankName, { color: textColor }]}>{row.name}</Text>
                  <Text style={[styles.rankScore, { color: textSecondary }]}>{row.score}</Text>
                </View>
              ))}
              {state.me?.rank ? (
                <Text style={[styles.meta, { color: textSecondary, marginTop: 12 }]}>
                  Senin sıran: {state.me.rank} · {state.me.score} puan
                </Text>
              ) : null}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: Fonts.semiBold, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  hero: { fontSize: 32, fontFamily: Fonts.bold, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  meta: { fontSize: 13, fontFamily: Fonts.medium, textAlign: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  timer: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 20, fontFamily: Fonts.bold, fontWeight: '700' },
  question: { fontSize: 22, fontFamily: Fonts.semiBold, fontWeight: '600', textAlign: 'center', marginBottom: 16, lineHeight: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: { width: '48%', minHeight: 110, borderRadius: 18, padding: 14, justifyContent: 'center' },
  choiceHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  letter: { color: '#fff', fontSize: 20, fontFamily: Fonts.bold, fontWeight: '700' },
  badge: { color: '#fff', fontSize: 12, fontFamily: Fonts.bold, fontWeight: '700' },
  choiceText: { color: '#fff', fontSize: 16, fontFamily: Fonts.semiBold, fontWeight: '600' },
  hint: { marginTop: 12, textAlign: 'center', fontSize: 13, fontFamily: Fonts.medium },
  result: { marginTop: 16, textAlign: 'center', fontSize: 18, fontFamily: Fonts.bold, fontWeight: '700' },
  rankRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8 },
  rank: { width: 28, fontFamily: Fonts.bold, fontWeight: '700' },
  rankName: { flex: 1, fontFamily: Fonts.semiBold },
  rankScore: { fontFamily: Fonts.medium },
  error: { color: '#ef4444', textAlign: 'center', marginTop: 12 },
});
