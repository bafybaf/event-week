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
  const [phase, setPhase] = useState<'roster' | 'draw'>('roster');
  const [loading, setLoading] = useState(true);
  const spinRef = useRef(false);

  const load = async () => {
    if (!eventId) return;
    try {
      const state = await raffleApi.getState(eventId);
      setEventName(state.event?.name || '');
      setParticipants(state.participants || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Sahne açılamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  useEffect(() => {
    return () => {
      if (eventId) {
        raffleApi.closeLive(eventId).catch(() => {});
      }
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId || loading || spinning) return;
    const livePhase = revealed && winner ? 'revealed' : phase;
    raffleApi.publishLive({
      eventId,
      phase: livePhase,
      participantCount: participants.length,
      eventName,
      highlightName: '',
      winner: revealed && winner
        ? { name: winner.name, company: winner.company, title: winner.title }
        : null
    }).catch(() => {});
  }, [eventId, loading, phase, revealed, winner, participants.length, spinning, eventName]);

  useEffect(() => {
    if (!eventId || !spinning || phase !== 'draw') return;
    const person = participants[displayIndex];
    const timer = window.setTimeout(() => {
      raffleApi.publishLive({
        eventId,
        phase: 'spinning',
        highlightName: person?.name || '',
        highlightCompany: person?.company || '',
        participantCount: participants.length,
        eventName
      }).catch(() => {});
    }, 140);
    return () => window.clearTimeout(timer);
  }, [displayIndex, spinning, phase, eventId, participants, eventName]);

  const goToRoster = () => {
    if (spinning) return;
    setPhase('roster');
    setRevealed(false);
    setWinner(null);
    setDisplayIndex(0);
  };

  const goToDraw = () => {
    if (!participants.length) return;
    setPhase('draw');
    setRevealed(false);
    setWinner(null);
    setDisplayIndex(0);
  };

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
        .name-reel { height: 280px; overflow: hidden; position: relative; background: transparent; }
        .reel-row { height: 93px; display: flex; align-items: center; justify-content: center; background: transparent; }
        .current-name {
          background: none;
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
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
        <button className="text-[#7DD9F8]" onClick={() => (phase === 'draw' ? goToRoster() : navigate('/raffle'))}>
          {phase === 'draw' ? '← Liste' : '← Çekiliş'}
        </button>
        <div className="text-center">
          <div className="text-lg font-bold">{eventName || 'Çekiliş'}</div>
          <div className="text-sm text-[#7aa3b8]">{participants.length} katılımcı</div>
        </div>
        <div className="text-sm text-[#7aa3b8]">
          {spinning ? 'Çekiliyor...' : revealed ? 'Kazanan' : phase === 'roster' ? 'Liste' : 'Hazır'}
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center gap-8 relative z-10">
        {phase === 'roster' ? (
          <div className="w-full max-w-5xl">
            <div className="text-sm uppercase tracking-[0.35em] text-[#7DD9F8] text-center mb-6">
              Çekilişe katılanlar
            </div>
            {!participants.length ? (
              <p className="text-[#7aa3b8] text-center">Bu etkinlikte çekilişe katılacak katılımcı yok.</p>
            ) : (
              <div className="max-h-[62vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {participants.map((p) => (
                    <div key={p.id} className="rounded-xl border border-[#1A3A50] bg-[#0D2130] px-4 py-3">
                      <div className="font-semibold text-lg leading-tight">{p.name}</div>
                      {p.title || p.company ? (
                        <div className="mt-1 text-sm text-[#7aa3b8]">
                          {[p.title, p.company].filter(Boolean).join(' · ')}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : !revealed ? (
          spinning ? (
          <>
            <div className="text-sm uppercase tracking-[0.35em] text-[#7DD9F8]">Şanslı isim</div>
            <div className="name-reel w-full max-w-4xl spinning">
              {slotNames.map((p, i) => (
                <div
                  key={`${p?.id || i}-${i}`}
                  className="reel-row"
                  style={{ opacity: i === 1 ? 1 : 0.28 }}
                >
                  <div className={`current-name text-center font-semibold ${i === 1 ? 'text-6xl md:text-7xl text-white' : 'text-3xl text-[#7aa3b8]'}`}>
                    {p?.name || '—'}
                  </div>
                </div>
              ))}
            </div>
            {current?.company ? (
              <div className="text-[#7aa3b8] text-xl">{current.company}</div>
            ) : null}
          </>
          ) : (
            <div className="text-center">
              <div className="text-sm uppercase tracking-[0.35em] text-[#7DD9F8] mb-6">Şanslı isim</div>
              <div className="text-7xl md:text-8xl font-bold text-[#2BB6E8]">?</div>
              <div className="mt-6 text-xl text-[#7aa3b8]">{participants.length} kişi arasından çekilecek</div>
            </div>
          )
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

        {phase === 'draw' && !participants.length ? (
          <p className="text-[#7aa3b8]">Bu etkinlikte çekilişe katılacak katılımcı yok.</p>
        ) : null}
      </main>

      <footer className="p-5 border-t border-[#1A3A50] flex justify-center gap-3 relative z-10">
        {phase === 'roster' ? (
          <button className="stage-btn" disabled={!participants.length} onClick={goToDraw}>
            Çekilişe başla
          </button>
        ) : (
          <>
            <button
              className="stage-btn"
              disabled={spinning || !participants.length}
              onClick={startDraw}
            >
              {revealed ? 'Tekrar çek' : spinning ? 'Çekiliyor...' : 'Çekiliş yap'}
            </button>
            <button className="stage-btn-ghost" disabled={spinning} onClick={goToRoster}>
              Listeye dön
            </button>
          </>
        )}
      </footer>
    </div>
  );
};

export default RaffleStage;
