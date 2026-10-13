import React, { useEffect, useState } from 'react';
import { Plus, Play, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { quizApi, eventsApi } from '../services/api.ts';

interface EventItem {
  id: string;
  name: string;
}

interface QuizRow {
  id: string;
  title: string;
  status: string;
  eventId: string;
  questionCount: number;
  playerCount: number;
  event?: { id: string; name: string };
}

interface QuestionDraft {
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

const emptyQuestion = (): QuestionDraft => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  timeLimit: 20,
});

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const OPTION_BLUES = ['#2BB6E8', '#1A9ED4', '#0E90C8', '#0A6F9C'];

const statusLabel: Record<string, string> = {
  draft: 'Taslak',
  lobby: 'Lobi',
  question: 'Soru',
  reveal: 'Sonuç',
  leaderboard: 'Sıralama',
  ended: 'Bitti',
};

const Quizzes: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [filterEvent, setFilterEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      const list = Array.isArray(data) ? data : data.events || [];
      setEvents(list);
      if (!eventId && list[0]) setEventId(String(list[0].id));
    } catch (error) {
      console.error(error);
    }
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await quizApi.getQuizzes(filterEvent || undefined);
      setQuizzes(data);
    } catch (error) {
      toast.error('Quizler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [filterEvent]);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setEventId(filterEvent || (events[0] ? String(events[0].id) : ''));
    setQuestions([emptyQuestion()]);
    setShowModal(true);
  };

  const openEdit = async (row: QuizRow) => {
    if (row.status !== 'draft') {
      toast.error('Yalnızca taslak düzenlenir. Sahneyi açabilirsiniz.');
      navigate(`/quiz/${row.id}/host`);
      return;
    }
    try {
      const state = await quizApi.getState(row.id, true);
      setEditingId(row.id);
      setTitle(state.quiz.title);
      setEventId(state.quiz.eventId);
      setQuestions(
        (state.questions || []).map((q: any) => ({
          text: q.text,
          options: [...q.options, '', '', '', ''].slice(0, 4),
          correctIndex: q.correctIndex,
          timeLimit: q.timeLimit || 20,
        }))
      );
      setShowModal(true);
    } catch {
      toast.error('Quiz açılamadı');
    }
  };

  const saveQuiz = async () => {
    const cleaned = questions
      .map((q, index) => {
        const raw = q.options.map((o) => o.trim());
        const marked = raw[q.correctIndex] || '';
        const options = raw.filter(Boolean);
        const correctIndex = Math.max(0, options.indexOf(marked));
        return {
          ...q,
          text: q.text.trim(),
          options,
          correctIndex,
          _emptyCorrect: Boolean(q.text.trim()) && !marked,
          _index: index,
        };
      })
      .filter((q) => q.text);
    if (!title.trim() || !eventId) {
      toast.error('Başlık ve etkinlik zorunlu');
      return;
    }
    if (!cleaned.length) {
      toast.error('En az bir soru ekleyin');
      return;
    }
    const missingCorrect = cleaned.find((q) => q._emptyCorrect);
    if (missingCorrect) {
      toast.error(`Soru ${missingCorrect._index + 1}: dolu bir doğru şık seçin`);
      return;
    }
    setSaving(true);
    try {
      const payload = cleaned.map(({ text, options, correctIndex, timeLimit }) => ({
        text,
        options,
        correctIndex,
        timeLimit,
      }));
      if (editingId) {
        await quizApi.updateQuiz(editingId, { title, questions: payload });
      } else {
        await quizApi.createQuiz({ eventId, title, questions: payload });
      }
      toast.success('Quiz kaydedildi');
      setShowModal(false);
      loadQuizzes();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const removeQuiz = async (row: QuizRow) => {
    if (!window.confirm(`“${row.title}” silinsin mi?`)) return;
    try {
      await quizApi.deleteQuiz(row.id);
      toast.success('Silindi');
      loadQuizzes();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Silinemedi');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canlı Quiz</h1>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" /> Yeni quiz
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tüm etkinlikler</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>{event.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
        ) : quizzes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Henüz quiz yok.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Quiz</th>
                <th className="px-4 py-3">Etkinlik</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Soru</th>
                <th className="px-4 py-3">Oyuncu</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3 text-gray-500">{row.event?.name || '-'}</td>
                  <td className="px-4 py-3">{statusLabel[row.status] || row.status}</td>
                  <td className="px-4 py-3">{row.questionCount}</td>
                  <td className="px-4 py-3">{row.playerCount}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEdit(row)}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="h-4 w-4" /> Düzenle
                    </button>
                    <button
                      onClick={() => navigate(`/quiz/${row.id}/host`)}
                      className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900"
                    >
                      <Play className="h-4 w-4" /> Sahne
                    </button>
                    <button
                      onClick={() => removeQuiz(row)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" /> Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Quiz düzenle' : 'Yeni quiz'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Quiz başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <select className="border rounded-lg px-3 py-2" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Soru {qIndex + 1}</span>
                    {questions.length > 1 && (
                      <button className="text-red-600 text-sm" onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}>
                        Kaldır
                      </button>
                    )}
                  </div>
                  <input
                    className="border rounded-lg px-3 py-2 w-full mb-3"
                    placeholder="Soru metni"
                    value={question.text}
                    onChange={(e) => {
                      const next = [...questions];
                      next[qIndex] = { ...question, text: e.target.value };
                      setQuestions(next);
                    }}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {question.options.map((opt, oIndex) => {
                      const isCorrect = question.correctIndex === oIndex;
                      const letter = OPTION_LETTERS[oIndex];
                      const blue = OPTION_BLUES[oIndex];
                      return (
                        <div
                          key={oIndex}
                          className={`flex items-center gap-2 rounded-xl px-2 py-2 border-2 ${
                            isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: isCorrect ? undefined : `${blue}14` }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...questions];
                              next[qIndex] = { ...question, correctIndex: oIndex };
                              setQuestions(next);
                            }}
                            className="w-10 h-10 rounded-lg text-white font-bold shrink-0"
                            style={{ backgroundColor: blue }}
                            title={`${letter} şıkkını doğru yap`}
                          >
                            {letter}
                          </button>
                          <input
                            className="flex-1 outline-none bg-transparent min-w-0"
                            placeholder={`${letter} şıkkı`}
                            value={opt}
                            onChange={(e) => {
                              const next = [...questions];
                              const options = [...question.options];
                              options[oIndex] = e.target.value;
                              next[qIndex] = { ...question, options };
                              setQuestions(next);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...questions];
                              next[qIndex] = { ...question, correctIndex: oIndex };
                              setQuestions(next);
                            }}
                            className={`text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-lg ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-white'
                            }`}
                          >
                            {isCorrect ? '✓ Doğru şık' : 'Doğru yap'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    A–D harfine veya “Doğru yap”a basarak doğru cevabı işaretleyin. Oyuncu süre bitene kadar şık değiştirebilir.
                  </p>
                  <select
                    className="border rounded-lg px-3 py-1 text-sm"
                    value={question.timeLimit}
                    onChange={(e) => {
                      const next = [...questions];
                      next[qIndex] = { ...question, timeLimit: Number(e.target.value) };
                      setQuestions(next);
                    }}
                  >
                    <option value={10}>10 sn</option>
                    <option value={20}>20 sn</option>
                    <option value={30}>30 sn</option>
                    <option value={45}>45 sn</option>
                  </select>
                </div>
              ))}
            </div>

            <button
              className="mt-4 text-sky-700 font-medium"
              onClick={() => setQuestions([...questions, emptyQuestion()])}
            >
              + Soru ekle
            </button>

            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 rounded-lg border" onClick={() => setShowModal(false)}>Vazgeç</button>
              <button
                className="px-4 py-2 rounded-lg bg-sky-600 text-white disabled:opacity-50"
                disabled={saving}
                onClick={saveQuiz}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quizzes;
