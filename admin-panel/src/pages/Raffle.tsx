import React, { useEffect, useMemo, useState } from 'react';
import { Gift, MonitorPlay, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { eventsApi, raffleApi } from '../services/api.ts';

interface EventItem {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
  role?: string;
  eventId?: string | null;
  company?: string;
  title?: string;
  phone?: string;
}

const roleLabel: Record<string, string> = {
  participant: 'Katılımcı',
  organizer: 'Organizatör',
  admin: 'Admin',
};

interface DrawRow {
  id: string;
  winnerName: string;
  participantCount: number;
  drawnAt: string;
}

const Raffle: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState('all');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [history, setHistory] = useState<DrawRow[]>([]);
  const [eventName, setEventName] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      const list = Array.isArray(data) ? data : data.events || [];
      setEvents(list);
    } catch {
      toast.error('Etkinlikler yüklenemedi');
    }
  };

  const loadState = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      const state = await raffleApi.getState(id);
      setParticipants(state.participants || []);
      setHistory(state.history || []);
      setEventName(state.event?.name || '');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Katılımcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (eventId) loadState(eventId);
  }, [eventId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) =>
      [p.name, p.company, p.title, p.phone].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [participants, search]);

  const last = history[0];

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Çekiliş</h1>
          <p className="text-gray-500 mt-1">Kullanıcılar listesiyle aynı kişiler. Konuşmacılar hariç.</p>
        </div>
        <button
          disabled={!eventId || !participants.length}
          onClick={() => navigate(`/raffle/${eventId}/stage`)}
          className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 disabled:opacity-50"
        >
          <MonitorPlay className="h-4 w-4" /> Sahneyi aç
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-2">Etkinlik</div>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">Tüm etkinlikler</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Kişi</div>
            <div className="text-2xl font-bold text-gray-900">{participants.length}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Son kazanan</div>
            <div className="text-lg font-semibold text-gray-900">{last?.winnerName || 'Henüz yok'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{eventName || 'Katılımcılar'}</h2>
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ad Soyad</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                {eventId === 'all' ? <th className="px-4 py-3 font-medium">Etkinlik</th> : null}
                <th className="px-4 py-3 font-medium">Ünvan</th>
                <th className="px-4 py-3 font-medium">Şirket</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={eventId === 'all' ? 6 : 5} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={eventId === 'all' ? 6 : 5} className="px-4 py-8 text-center text-gray-400">Kişi bulunamadı</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{roleLabel[p.role || ''] || p.role || '—'}</td>
                  {eventId === 'all' ? (
                    <td className="px-4 py-3 text-gray-600">
                      {events.find((ev) => ev.id === p.eventId)?.name || '—'}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-gray-600">{p.title || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.company || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Önceki çekilişler</div>
          <ul className="divide-y divide-gray-100">
            {history.map((row) => (
              <li key={row.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{row.winnerName}</span>
                <span className="text-gray-500">
                  {row.participantCount} kişi · {new Date(row.drawnAt).toLocaleString('tr-TR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Raffle;
