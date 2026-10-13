import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { raffleApi } from '../services/api.ts';

interface Participant {
  id: string;
  name: string;
  company?: string;
  title?: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const RaffleStage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const spinRef = useRef(false);

  const load = async () => {
    if (!eventId) return;
    try {
      const state = await raffleApi.getState(eventId);
      setEventName(state.event?.name || '');
      setParticipants(state.participants || []);
      if (state.lastDraw?.winner && !spinRef.current) {
        const last = state.lastDraw.winner;
        const idx = (state.participants || []).findIndex((p: Participant) => p.id === last.id);
        if (idx >= 0) setDisplayIndex(idx);
        setWinner(last);
        setRevealed(true);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Sahne açılamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const current = participants[displayIndex] || participants[0];

  const slotNames = useMemo(() => {
    if (!participants.length) return [];
    const prev = participants[(displayIndex - 1 + participants.length) % participants.length];
    const next = participants[(displayIndex + 1) % participants.length];
    return [prev, current, next];
  }, [participants, displayIndex, current]);

  const animateTo = (targetIndex: number) =>
    new Promise<void>((resolve) => {
      const start = performance.now();
      const duration = 5600;
      const cycles = 6;
      const totalTicks = cycles * Math.max(1, participants.length) + targetIndex;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const step = Math.floor(eased * totalTicks);
        setDisplayIndex(participants.length ? step % participants.length : 0);
        if (t < 1) requestAnimationFrame(tick);
        else {
          setDisplayIndex(targetIndex);
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });

  const startDraw = async () => {
    if (!eventId || spinning || !participants.length) return;
    spinRef.current = true;
    setSpinning(true);
    setRevealed(false);
    setWinner(null);
    try {
      const state = await raffleApi.draw(eventId);
      const nextWinner = state.winner as Participant;
      const idx = Math.max(0, participants.findIndex((p) => p.id === nextWinner.id));
      await animateTo(idx);
      await wait(180);
      setWinner(nextWinner);
      setParticipants(state.participants || participants);
      setRevealed(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Çekiliş yapılamadı');
    } finally {
      setSpinning(false);
      spinRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071422] text-white flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="raffle-stage min-h-screen text-white flex flex-col overflow-hidden">
      <style>{`
        .raffle-stage {
          background:
            radial-gradient(900px 500px at 15% 10%, rgba(43,182,232,0.18), transparent 55%),
            radial-gradient(700px 420px at 90% 80%, rgba(43,182,232,0.12), transparent 50%),
            #071422;
        }
        .stage-btn { background:#2BB6E8; color:#042033; font-weight:700; border-radius:14px; padding:12px 22px; }
        .stage-btn-ghost { border:1px solid #1A3A50; color:#7DD9F8; border-radius:14px; padding:12px 22px; }
        .name-reel { height: 280px; overflow: hidden; position: relative; }
        .name-reel::before, .name-reel::after {
          content: '';
          position: absolute; left: 0; right: 0; height: 72px; z-index: 2; pointer-events: none;
        }
        .name-reel::before { top: 0; background: linear-gradient(#071422, transparent); }
        .name-reel::after { bottom: 0; background: linear-gradient(transparent, #071422); }
        .reel-row { height: 93px; display: flex; align-items: center; justify-content: center; }
        .spinning .current-name { filter: blur(1px); letter-spacing: 0.04em; }
        .winner-card { animation: winnerPop 0.7s cubic-bezier(.2,1.4,.3,1) both; }
        @keyframes winnerPop {
          0% { transform: scale(0.72); opacity: 0; }
          60% { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        .confetti { position: absolute; width: 10px; height: 16px; top: -20px; animation: fall 2.8s linear forwards; }
        @keyframes fall {
          to { transform: translateY(110vh) rotate(540deg); opacity: 0.2; }
        }
        .pulse-ring {
          box-shadow: 0 0 0 0 rgba(43,182,232,0.45);
          animation: pulse 1.4s infinite;
        }
        @keyframes pulse {
          70% { box-shadow: 0 0 0 22px rgba(43,182,232,0); }
          100% { box-shadow: 0 0 0 0 rgba(43,182,232,0); }
        }
      `}</style>

      {revealed && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className="confetti"
              style={{
                left: `${(i * 7.3) % 100}%`,
                background: ['#2BB6E8', '#7DD9F8', '#FBBF24', '#F472B6', '#34D399'][i % 5],
                animationDelay: `${(i % 12) * 0.08}s`,
                transform: `rotate(${i * 18}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1A3A50] relative z-10">
        <button className="text-[#7DD9F8]" onClick={() => navigate('/raffle')}>← Çekiliş</button>
        <div className="text-center">
          <div className="text-lg font-bold">{eventName || 'Çekiliş'}</div>
          <div className="text-sm text-[#7aa3b8]">{participants.length} katılımcı</div>
        </div>
        <div className="text-sm text-[#7aa3b8]">{spinning ? 'Çekiliyor...' : revealed ? 'Kazanan' : 'Hazır'}</div>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center gap-8 relative z-10">
        {!revealed ? (
          <>
            <div className="text-sm uppercase tracking-[0.35em] text-[#7DD9F8]">Şanslı isim</div>
            <div className={`name-reel w-full max-w-4xl ${spinning ? 'spinning' : ''}`}>
              {slotNames.map((p, i) => (
                <div
                  key={`${p?.id || i}-${i}`}
                  className="reel-row"
                  style={{ opacity: i === 1 ? 1 : 0.28 }}
                >
                  <div className={`current-name text-center font-bold ${i === 1 ? 'text-6xl md:text-7xl' : 'text-3xl text-[#7aa3b8]'}`}>
                    {p?.name || '—'}
                  </div>
                </div>
              ))}
            </div>
            {current?.company ? (
              <div className="text-[#7aa3b8] text-xl">{current.company}</div>
            ) : null}
          </>
        ) : winner ? (
          <div className="winner-card text-center max-w-3xl">
            <div className="text-sm uppercase tracking-[0.35em] text-[#7DD9F8] mb-4">Kazanan</div>
            <div className="pulse-ring mx-auto mb-6 w-28 h-28 rounded-full bg-[#0D2130] border-4 border-[#2BB6E8] flex items-center justify-center text-4xl font-bold text-[#2BB6E8]">
              {winner.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <div className="text-5xl md:text-7xl font-bold leading-tight">{winner.name}</div>
            {winner.title || winner.company ? (
              <div className="mt-4 text-2xl text-[#7DD9F8]">
                {[winner.title, winner.company].filter(Boolean).join(' · ')}
              </div>
            ) : null}
          </div>
        ) : null}

        {!participants.length ? (
          <p className="text-[#7aa3b8]">Bu etkinlikte çekilişe katılacak katılımcı yok.</p>
        ) : null}
      </main>

      <footer className="p-5 border-t border-[#1A3A50] flex justify-center gap-3 relative z-10">
        <button
          className="stage-btn"
          disabled={spinning || !participants.length}
          onClick={startDraw}
        >
          {revealed ? 'Tekrar çek' : spinning ? 'Çekiliyor...' : 'Çekiliş yap'}
        </button>
        <button className="stage-btn-ghost" onClick={() => navigate('/raffle')}>
          Listeye dön
        </button>
      </footer>
    </div>
  );
};

export default RaffleStage;
