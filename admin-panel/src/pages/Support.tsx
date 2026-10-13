import React, { useEffect, useState } from 'react';
import { MessageSquare, Paperclip, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventsApi, supportApi } from '../services/api.ts';

interface EventItem {
  id: number | string;
  name: string;
}

interface SupportAttachment {
  url: string;
  fileName: string;
  fileType?: string;
  category?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'closed';
  createdAt?: string;
  lastMessageAt?: string;
  messageCount?: number;
  user?: { firstName?: string; lastName?: string };
  event?: { name?: string };
  lastMessage?: { body?: string };
}

interface SupportMessage {
  id: string;
  body?: string;
  senderId: string;
  createdAt?: string;
  attachments?: SupportAttachment[];
  sender?: { firstName?: string; lastName?: string; role?: string };
}

const getFileHref = (url?: string) => {
  if (!url) return '';
  const uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex !== -1) return `http://localhost:3000${url.slice(uploadsIndex)}`;
  return url.startsWith('http') ? url.replace('localhost:3001', 'localhost:3000') : `http://localhost:3000/${url.replace(/^\//, '')}`;
};

const personName = (user?: { firstName?: string; lastName?: string }) =>
  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Kullanıcı';

const Support: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filterEvent, setFilterEvent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    eventsApi.getEvents().then((data) => setEvents((data.events || data) || [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filterEvent, filterStatus]);

  const loadTickets = async () => {
    try {
      const data = await supportApi.getTickets(filterEvent || undefined, filterStatus || undefined);
      setTickets(data.tickets || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Talepler yüklenemedi');
    }
  };

  const openTicket = async (id: string) => {
    setSelectedId(id);
    try {
      const data = await supportApi.getTicket(id);
      setSelected(data.ticket);
      setMessages(data.messages || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Talep yüklenemedi');
    }
  };

  const uploadFile = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('http://localhost:3000/api/upload/support', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Yükleme başarısız');
      setAttachments((prev) => [...prev, result.data]);
    } catch (error: any) {
      toast.error(error.message || 'Dosya yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      setSending(true);
      const created = await supportApi.reply(selectedId, { body: reply, attachments });
      setMessages((prev) => [...prev, created]);
      setReply('');
      setAttachments([]);
      loadTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    if (!selected) return;
    const status = selected.status === 'open' ? 'closed' : 'open';
    try {
      const updated = await supportApi.updateStatus(selected.id, status);
      setSelected({ ...selected, status: updated.status });
      loadTickets();
      toast.success(status === 'closed' ? 'Talep kapatıldı' : 'Talep yeniden açıldı');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Durum güncellenemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Destek</h1>
        <p className="mt-1 text-sm text-gray-500">Katılımcı taleplerini yanıtlayın, ekleri görün, kapatın.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-3">
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="px-3 py-2 border rounded-md md:w-72">
          <option value="">Tüm Etkinlikler</option>
          {events.map((event) => (
            <option key={event.id} value={String(event.id)}>{event.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-md md:w-48">
          <option value="">Tüm durumlar</option>
          <option value="open">Açık</option>
          <option value="closed">Kapalı</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow divide-y max-h-[70vh] overflow-y-auto">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => openTicket(ticket.id)}
              className={`w-full text-left p-4 hover:bg-gray-50 ${selectedId === ticket.id ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between gap-2">
                <p className="font-semibold text-gray-900">{ticket.subject}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {ticket.status === 'open' ? 'Açık' : 'Kapalı'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{personName(ticket.user)} · {ticket.event?.name || ''}</p>
              <p className="text-sm text-gray-400 truncate">{ticket.lastMessage?.body || 'Ek gönderildi'}</p>
            </button>
          ))}
          {tickets.length === 0 && (
            <div className="p-8 text-center text-gray-500">Talep yok.</div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow min-h-[70vh] flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <MessageSquare className="mr-2" /> Bir talep seçin
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg">{selected.subject}</h2>
                  <p className="text-sm text-gray-500">{personName(selected.user)}</p>
                </div>
                <button onClick={toggleStatus} className="px-3 py-1.5 border rounded-md text-sm">
                  {selected.status === 'open' ? 'Kapat' : 'Yeniden aç'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => {
                  const staff = message.sender?.role === 'admin' || message.sender?.role === 'organizer';
                  return (
                    <div key={message.id} className={`max-w-[80%] rounded-lg p-3 ${staff ? 'ml-auto bg-blue-50' : 'bg-gray-100'}`}>
                      <p className="text-xs text-gray-500 mb-1">{personName(message.sender)} {staff ? '(Admin)' : ''}</p>
                      {!!message.body && <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.body}</p>}
                      {message.attachments?.map((file) => (
                        <a key={file.url} href={getFileHref(file.url)} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                          {file.category === 'image' ? (
                            <img src={getFileHref(file.url)} alt="" className="max-h-40 rounded" />
                          ) : (
                            <><Paperclip size={14} /> {file.fileName}</>
                          )}
                        </a>
                      ))}
                    </div>
                  );
                })}
              </div>
              {selected.status === 'open' ? (
                <form onSubmit={sendReply} className="p-4 border-t space-y-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Yanıt yazın"
                    className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm text-blue-600 cursor-pointer">
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => uploadFile(e.target.files?.[0])} />
                      Ek ekle
                    </label>
                    <button type="submit" disabled={sending || uploading} className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50">
                      <Send size={16} /> Gönder
                    </button>
                  </div>
                  {attachments.length > 0 && (
                    <p className="text-xs text-gray-500">{attachments.map((file) => file.fileName).join(', ')}</p>
                  )}
                </form>
              ) : (
                <div className="p-4 border-t text-sm text-gray-500">Bu talep kapalı.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
