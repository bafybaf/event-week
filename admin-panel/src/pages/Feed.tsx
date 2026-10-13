import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Plus, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventsApi, feedApi } from '../services/api.ts';
import { API_ORIGIN, fileUrl } from '../config.ts';

interface Event {
  id: number | string;
  name: string;
}

interface FeedItem {
  id: string;
  eventId: string;
  kind: 'post' | 'story';
  caption?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likeCount?: number;
  commentCount?: number;
  createdAt?: string;
  author?: {
    firstName?: string;
    lastName?: string;
  };
  event?: {
    name?: string;
  };
}

const getMediaHref = fileUrl;

const Feed: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filterEvent, setFilterEvent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FeedItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    eventId: '',
    kind: 'post' as 'post' | 'story',
    caption: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
    thumbnailUrl: '',
    fileName: '',
    fileSize: 0
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    loadFeed();
  }, [filterEvent]);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents((data.events || data) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const loadFeed = async () => {
    try {
      const data = await feedApi.getFeed(filterEvent || undefined);
      const list = [
        ...(data.stories || []),
        ...(data.posts || [])
      ];
      setItems(list);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Feed yüklenemedi');
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({
      eventId: filterEvent,
      kind: 'post',
      caption: '',
      mediaUrl: '',
      mediaType: 'image',
      thumbnailUrl: '',
      fileName: '',
      fileSize: 0
    });
    setShowModal(true);
  };

  const openEditModal = (item: FeedItem) => {
    setEditing(item);
    setForm({
      eventId: item.eventId,
      kind: item.kind,
      caption: item.caption || '',
      mediaUrl: item.mediaUrl || '',
      mediaType: item.mediaType || 'image',
      thumbnailUrl: '',
      fileName: '',
      fileSize: 0
    });
    setShowModal(true);
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const body = new FormData();
      body.append('media', file);
      const response = await fetch(`${API_ORIGIN}/api/upload/feed`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Yükleme başarısız');
      }
      const mediaType = String(result.data.mimetype || '').startsWith('video/') ? 'video' : 'image';
      setForm((prev) => ({
        ...prev,
        mediaUrl: result.data.url,
        thumbnailUrl: result.data.thumbnail || '',
        mediaType,
        fileName: result.data.fileName || file.name,
        fileSize: result.data.size || file.size
      }));
      toast.success('Medya yüklendi');
    } catch (error: any) {
      toast.error(error.message || 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        await feedApi.updateItem(editing.id, { caption: form.caption });
        toast.success('Paylaşım güncellendi');
      } else {
        if (!form.eventId) {
          toast.error('Etkinlik seçin');
          return;
        }
        if (!form.mediaUrl) {
          toast.error('Görsel veya video yükleyin');
          return;
        }
        await feedApi.createItem(form);
        toast.success('Paylaşım yayınlandı');
      }
      setShowModal(false);
      loadFeed();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu paylaşımı silmek istiyor musunuz?')) return;
    try {
      await feedApi.deleteItem(id);
      toast.success('Paylaşım silindi');
      loadFeed();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Silinemedi');
    }
  };

  const authorName = (item: FeedItem) => {
    if (!item.author) return 'Kullanıcı';
    return `${item.author.firstName || ''} ${item.author.lastName || ''}`.trim() || 'Kullanıcı';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
          <p className="mt-1 text-sm text-gray-500">
            Etkinliğe özel story ve post paylaşımlarını görün, düzenleyin veya silin.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Paylaş
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tüm Etkinlikler</option>
          {events.map((event) => (
            <option key={event.id} value={String(event.id)}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-slate-900 min-h-[240px] flex items-center justify-center">
              {item.mediaType === 'video' ? (
                <video src={getMediaHref(item.mediaUrl)} controls className="w-full max-h-80 object-contain" />
              ) : (
                <a href={getMediaHref(item.mediaUrl)} target="_blank" rel="noreferrer">
                  <img src={getMediaHref(item.mediaUrl)} alt="" className="w-full max-h-80 object-contain" />
                </a>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600">
                    {item.kind === 'story' ? 'Story' : 'Post'}
                  </p>
                  <h3 className="font-semibold text-gray-900">{authorName(item)}</h3>
                  <p className="text-sm text-gray-500">{item.event?.name || ''}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(item)} className="p-1 text-gray-500 hover:text-blue-600" title="Düzenle">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-500 hover:text-red-600" title="Sil">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {item.caption && <p className="mt-2 text-sm text-gray-700">{item.caption}</p>}
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Heart size={14} /> {item.likeCount || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle size={14} /> {item.commentCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          Bu filtre için paylaşım yok.
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Paylaşımı düzenle' : 'Yeni paylaşım'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              {!editing && (
                <>
                  <select
                    value={form.eventId}
                    onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Etkinlik seçin</option>
                    {events.map((event) => (
                      <option key={event.id} value={String(event.id)}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.kind}
                    onChange={(e) => setForm({ ...form, kind: e.target.value as 'post' | 'story' })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="post">Post</option>
                    <option value="story">Story</option>
                  </select>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                    className="w-full text-sm"
                  />
                  {uploading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
                  {form.mediaUrl && <p className="text-xs text-green-600">Medya hazır</p>}
                </>
              )}
              <textarea
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                placeholder="Açıklama"
                className="w-full px-3 py-2 border rounded-md min-h-[90px]"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
