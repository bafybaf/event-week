import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quizApi } from '../services/api.ts';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const OPTION_BLUES = ['#2BB6E8', '#1A9ED4', '#0E90C8', '#0A6F9C'];

const QuizHost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!id) return;
    try {
      const next = await quizApi.getState(id, true);
      setState(next);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Durum alınamadı');
    }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 900);
    return () => clearInterval(timer);
  }, [id]);

  const act = async (fn: () => Promise<any>) => {
    if (!id || busy) return;
    setBusy(true);
    try {
      const next = await fn();
      setState(next);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'İşlem başarısız');
    } finally {
      setBusy(false);
    }
  };

  const quiz = state?.quiz;
  const question = state?.question;
  const seconds = Math.ceil((quiz?.timeRemainingMs || 0) / 1000);
  const lastQuestion = quiz && quiz.currentQuestionIndex >= quiz.questionCount - 1;

  const restart = (
    <button onClick={() => act(() => quizApi.openLobby(id!))} className="host-btn-ghost">
      Yeniden başlat
    </button>
  );

  const controls = (() => {
    if (!quiz) return null;
    if (quiz.status === 'draft') {
      return (
        <button onClick={() => act(() => quizApi.openLobby(id!))} className="host-btn">
          Lobiyi aç
        </button>
      );
    }
    if (quiz.status === 'lobby') {
      return (
        <button onClick={() => act(() => quizApi.ask(id!))} className="host-btn">
          İlk soruyu başlat
        </button>
      );
    }
    if (quiz.status === 'question') {
      return (
        <button onClick={() => act(() => quizApi.reveal(id!))} className="host-btn">
          Cevapları göster
        </button>
      );
    }
    if (quiz.status === 'reveal') {
      return (
        <div className="flex flex-wrap gap-3 justify-center">
          {lastQuestion ? (
            <button onClick={() => act(() => quizApi.leaderboard(id!))} className="host-btn">
              Sıralamayı göster
            </button>
          ) : (
            <button onClick={() => act(() => quizApi.ask(id!))} className="host-btn">
              Sonraki soru
            </button>
          )}
          {restart}
        </div>
      );
    }
    if (quiz.status === 'leaderboard' || quiz.status === 'ended') {
      return (
        <div className="flex flex-wrap gap-3 justify-center">
          {quiz.status !== 'ended' && (
            <button onClick={() => act(() => quizApi.end(id!))} className="host-btn-ghost">
              Oturumu bitir
            </button>
          )}
          {restart}
        </div>
      );
    }
    return null;
  })();

  if (!state) {
    return (
      <div className="min-h-screen bg-[#071422] text-white flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071422] text-white flex flex-col">
      <style>{`
        .host-btn { background:#2BB6E8; color:#042033; font-weight:700; border-radius:14px; padding:12px 22px; }
        .host-btn-ghost { border:1px solid #1A3A50; color:#7DD9F8; border-radius:14px; padding:12px 22px; }
      `}</style>
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1A3A50]">
        <button className="text-[#7DD9F8]" onClick={() => navigate('/quizzes')}>← Quizler</button>
        <div className="text-center">
          <div className="text-lg font-bold">{quiz.title}</div>
          <div className="text-sm text-[#7aa3b8]">{quiz.playerCount} oyuncu</div>
        </div>
        <div className="text-sm text-[#7aa3b8]">
          {question ? `${question.index + 1}/${question.total}` : quiz.status}
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
        {quiz.status === 'lobby' && (
          <div className="text-center">
            <div className="text-5xl font-bold mb-4">Hazır mısınız?</div>
            <p className="text-[#7DD9F8] text-xl">Telefondan Canlı Quiz’e girin</p>
            <p className="text-6xl font-bold mt-8 text-[#2BB6E8]">{quiz.playerCount}</p>
            <p className="text-[#7aa3b8]">katılımcı bekliyor</p>
          </div>
        )}

        {(quiz.status === 'question' || quiz.status === 'reveal') && question && (
          <>
            <div className="w-full max-w-5xl text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-[#2BB6E8] flex items-center justify-center text-3xl font-bold">
                  {quiz.status === 'question' ? seconds : '✓'}
                </div>
              </div>
              <h2 className="text-4xl font-bold leading-tight">{question.text}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
              {question.options.map((opt: any) => {
                const revealed = quiz.status === 'reveal';
                const isCorrect = revealed && opt.correct;
                const isWrong = revealed && !opt.correct;
                return (
                  <div
                    key={opt.index}
                    className="rounded-2xl p-6 min-h-[120px] flex items-center gap-4"
                    style={{
                      background: isCorrect ? '#059669' : isWrong ? '#0A3A52' : OPTION_BLUES[opt.index % OPTION_BLUES.length],
                      outline: isCorrect ? '4px solid #6EE7B7' : isWrong ? '2px solid #7F1D1D' : 'none',
                      opacity: isWrong ? 0.72 : 1,
                    }}
                  >
                    <span className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center text-2xl font-bold">
                      {OPTION_LETTERS[opt.index % OPTION_LETTERS.length]}
                    </span>
                    <span className="text-2xl font-semibold flex-1">{opt.text}</span>
                    {isCorrect ? <span className="text-lg font-bold">✓ Doğru</span> : null}
                    {isWrong ? <span className="text-sm font-semibold text-red-200">Yanlış</span> : null}
                    {opt.count != null && (
                      <span className="text-2xl font-bold">{opt.count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {(quiz.status === 'leaderboard' || quiz.status === 'ended') && (
          <div className="w-full max-w-xl">
            <h2 className="text-4xl font-bold text-center mb-6">Sıralama</h2>
            <div className="space-y-3">
              {(state.leaderboard || []).slice(0, 8).map((row: any) => (
                <div key={row.userId} className="flex items-center bg-[#0D2130] rounded-xl px-4 py-3 border border-[#1A3A50]">
                  <span className="w-10 text-[#2BB6E8] font-bold">{row.rank}</span>
                  <span className="flex-1 font-semibold">{row.name}</span>
                  <span className="text-[#7DD9F8]">{row.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="p-5 border-t border-[#1A3A50] flex justify-center">
        {controls}
      </footer>
    </div>
  );
};

export default QuizHost;
