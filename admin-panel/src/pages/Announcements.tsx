import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Send, Calendar, User, Bell, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { announcementsApi, eventsApi } from '../services/api.ts';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'archived';
  targetAudience: 'all' | 'speakers' | 'participants' | 'organizers';
  scheduledDate?: string;
  publishedDate?: string;
  authorId: string;
  authorName: string;
  readCount: number;
  isPinned: boolean;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: number;
  name: string;
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEventForCreate, setSelectedEventForCreate] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterEvent, setFilterEvent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    type: 'info',
    priority: 'medium',
    status: 'draft',
    targetAudience: 'all',
    scheduledDate: '',
    isPinned: false,
    attachments: []
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [filterEvent]);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents((data.events || data) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      // filterEvent boş string ise undefined gönder (tüm duyurular)
      const eventId = filterEvent && filterEvent !== '' ? filterEvent : undefined;
      console.log('Fetching announcements with eventId:', eventId);
      const data = await announcementsApi.getAnnouncements(eventId);
      console.log('Announcements data received:', data);
      const announcementsList = Array.isArray(data) ? data : [];
      setAnnouncements(announcementsList);
      console.log('Announcements set:', announcementsList.length);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      toast.error(error.message || 'Duyurular yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || announcement.status === filterStatus;
    const matchesType = !filterType || announcement.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'info': return 'Bilgi';
      case 'warning': return 'Uyarı';
      case 'success': return 'Başarı';
      case 'error': return 'Hata';
      default: return 'Bilinmiyor';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Düşük';
      case 'medium': return 'Orta';
      case 'high': return 'Yüksek';
      case 'urgent': return 'Acil';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Taslak';
      case 'published': return 'Yayında';
      case 'archived': return 'Arşivlendi';
      default: return 'Bilinmiyor';
    }
  };

  const getTargetAudienceText = (audience: string) => {
    switch (audience) {
      case 'all': return 'Herkes';
      case 'speakers': return 'Konuşmacılar';
      case 'participants': return 'Katılımcılar';
      case 'organizers': return 'Organizatörler';
      default: return 'Bilinmiyor';
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }
    const selectedEventId = selectedEventForCreate || filterEvent || (events.length > 0 ? String(events[0].id) : '');
    
    if (!selectedEventId) {
      toast.error('Lütfen bir etkinlik seçin');
      return;
    }

    try {
      const announcementData = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type || 'info',
        priority: newAnnouncement.priority || 'medium',
        status: newAnnouncement.status || 'draft',
        targetAudience: newAnnouncement.targetAudience || 'all',
        scheduledDate: newAnnouncement.scheduledDate,
      isPinned: newAnnouncement.isPinned || false,
        eventId: selectedEventId // String olarak gönder
    };

      console.log('Creating announcement with data:', announcementData);
      const result = await announcementsApi.createAnnouncement(announcementData);
      console.log('Announcement created:', result);
    setNewAnnouncement({
      title: '',
      content: '',
      type: 'info',
      priority: 'medium',
      status: 'draft',
      targetAudience: 'all',
      scheduledDate: '',
      isPinned: false,
      attachments: []
    });
      setSelectedEventForCreate('');
    setShowAddModal(false);
    toast.success('Duyuru başarıyla eklendi');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error adding announcement:', error);
      toast.error(error.message || 'Duyuru eklenirken hata oluştu');
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setNewAnnouncement(announcement);
    setShowEditModal(true);
  };

  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement || !newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    try {
      await announcementsApi.updateAnnouncement(selectedAnnouncement.id, {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type || 'info',
        priority: newAnnouncement.priority || 'medium',
        status: newAnnouncement.status || 'draft',
        targetAudience: newAnnouncement.targetAudience || 'all',
        scheduledDate: newAnnouncement.scheduledDate,
        isPinned: newAnnouncement.isPinned || false
      });
    setShowEditModal(false);
    setSelectedAnnouncement(null);
    toast.success('Duyuru başarıyla güncellendi');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      toast.error(error.message || 'Duyuru güncellenirken hata oluştu');
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!window.confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await announcementsApi.deleteAnnouncement(announcementId);
      toast.success('Duyuru başarıyla silindi');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error(error.message || 'Duyuru silinirken hata oluştu');
    }
  };

  const handleViewDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailsModal(true);
  };

  const handlePublishAnnouncement = (announcementId: string) => {
    setAnnouncements(announcements.map(announcement => 
      announcement.id === announcementId 
        ? { 
            ...announcement, 
            status: 'published' as any, 
            publishedDate: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          }
        : announcement
    ));
    toast.success('Duyuru yayınlandı');
  };

  const handleTogglePin = (announcementId: string) => {
    setAnnouncements(announcements.map(announcement => 
      announcement.id === announcementId 
        ? { ...announcement, isPinned: !announcement.isPinned, updatedAt: new Date().toISOString().split('T')[0] }
        : announcement
    ));
    toast.success('Duyuru durumu güncellendi');
  };

  return (
    <div className="space-y-6 [&>*:first-child]:mt-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyuru Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Duyuruları görüntüleyin ve yönetin
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Yeni Duyuru
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Duyuru ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Etkinlikler</option>
            {events.map((event) => (
              <option key={event.id} value={String(event.id)}>
                {event.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="draft">Taslak</option>
            <option value="published">Yayında</option>
            <option value="archived">Arşivlendi</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Tipler</option>
            <option value="info">Bilgi</option>
            <option value="warning">Uyarı</option>
            <option value="success">Başarı</option>
            <option value="error">Hata</option>
          </select>
        </div>
      </div>

      {/* Duyuru Listesi */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Duyurular yükleniyor...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Duyuru Bulunamadı</p>
            <p className="text-gray-600 mb-4">
              {filterEvent || searchQuery || filterStatus || filterType
                ? 'Seçtiğiniz filtrelere uygun duyuru bulunmamaktadır.'
                : 'Henüz duyuru eklenmemiş. Yeni duyuru eklemek için yukarıdaki butona tıklayın.'}
            </p>
            {(filterEvent || searchQuery || filterStatus || filterType) && (
              <button
                onClick={() => {
                  setFilterEvent('');
                  setSearchQuery('');
                  setFilterStatus('');
                  setFilterType('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <>
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement.id} className={`bg-white rounded-lg shadow-md overflow-hidden ${announcement.isPinned ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.isPinned && (
                      <Bell className="w-4 h-4 text-blue-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{announcement.content}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(announcement.type)}`}>
                    {getTypeText(announcement.type)}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(announcement.priority)}`}>
                    {getPriorityText(announcement.priority)}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(announcement.status)}`}>
                    {getStatusText(announcement.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {announcement.authorName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {announcement.publishedDate || announcement.createdAt}
                  </div>
                  <div>
                    {announcement.readCount} okunma
                  </div>
                  <div>
                    {getTargetAudienceText(announcement.targetAudience)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(announcement)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Detayları Görüntüle"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleEditAnnouncement(announcement)}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Düzenle"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTogglePin(announcement.id)}
                    className={`p-1 rounded ${
                      announcement.isPinned 
                        ? 'text-blue-500 hover:text-blue-600' 
                        : 'text-gray-400 hover:text-blue-500'
                    }`}
                    title={announcement.isPinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                  >
                    <Bell size={16} className={announcement.isPinned ? 'fill-current' : ''} />
                  </button>
                  
                  {announcement.status === 'draft' && (
                    <button
                      onClick={() => handlePublishAnnouncement(announcement.id)}
                      className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 flex items-center gap-1"
                    >
                      <Send size={12} />
                      Yayınla
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </>
        )}
      </div>

      {/* Duyuru Ekleme Modal */}
      {showAddModal && (
        <div 
          className="fixed bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4" 
          style={{ 
            margin: 0, 
            padding: '1rem',
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            overflow: 'auto'
          }}
        >
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Duyuru Oluştur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik *</label>
                  <select
                    value={selectedEventForCreate || filterEvent}
                    onChange={(e) => setSelectedEventForCreate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Etkinlik Seçin</option>
                    {events.map((event) => (
                      <option key={event.id} value={String(event.id)}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Başlık *</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">İçerik *</label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    rows={6}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tip</label>
                    <select
                      value={newAnnouncement.type}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="info">Bilgi</option>
                      <option value="warning">Uyarı</option>
                      <option value="success">Başarı</option>
                      <option value="error">Hata</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Öncelik</label>
                    <select
                      value={newAnnouncement.priority}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                      <option value="urgent">Acil</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hedef Kitle</label>
                    <select
                      value={newAnnouncement.targetAudience}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetAudience: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Herkes</option>
                      <option value="speakers">Konuşmacılar</option>
                      <option value="participants">Katılımcılar</option>
                      <option value="organizers">Organizatörler</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <select
                      value={newAnnouncement.status}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, status: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Taslak</option>
                      <option value="published">Yayında</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Planlanan Tarih (Opsiyonel)</label>
                  <input
                    type="datetime-local"
                    value={newAnnouncement.scheduledDate}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, scheduledDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAnnouncement.isPinned}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Duyuruyu sabitle (öne çıkar)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddAnnouncement}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duyuru Düzenleme Modal */}
      {showEditModal && selectedAnnouncement && (
        <div 
          className="fixed bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4" 
          style={{ 
            margin: 0, 
            padding: '1rem',
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            overflow: 'auto'
          }}
        >
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Duyuru Düzenle</h3>
              
              <div className="space-y-4 [&>*:first-child]:mt-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Başlık *</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">İçerik *</label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    rows={6}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tip</label>
                    <select
                      value={newAnnouncement.type}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="info">Bilgi</option>
                      <option value="warning">Uyarı</option>
                      <option value="success">Başarı</option>
                      <option value="error">Hata</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Öncelik</label>
                    <select
                      value={newAnnouncement.priority}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                      <option value="urgent">Acil</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hedef Kitle</label>
                    <select
                      value={newAnnouncement.targetAudience}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetAudience: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Herkes</option>
                      <option value="speakers">Konuşmacılar</option>
                      <option value="participants">Katılımcılar</option>
                      <option value="organizers">Organizatörler</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <select
                      value={newAnnouncement.status}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, status: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Taslak</option>
                      <option value="published">Yayında</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Planlanan Tarih (Opsiyonel)</label>
                  <input
                    type="datetime-local"
                    value={newAnnouncement.scheduledDate}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, scheduledDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAnnouncement.isPinned}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Duyuruyu sabitle (öne çıkar)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAnnouncement(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateAnnouncement}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duyuru Detayları Modal */}
      {showDetailsModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Duyuru Detayları</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  {selectedAnnouncement.isPinned && (
                    <Bell className="w-4 h-4 text-blue-500" />
                  )}
                  <h4 className="text-xl font-semibold text-gray-900">{selectedAnnouncement.title}</h4>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedAnnouncement.type)}`}>
                    {getTypeText(selectedAnnouncement.type)}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedAnnouncement.priority)}`}>
                    {getPriorityText(selectedAnnouncement.priority)}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAnnouncement.status)}`}>
                    {getStatusText(selectedAnnouncement.status)}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Yazar:</span> {selectedAnnouncement.authorName}
                  </div>
                  <div>
                    <span className="font-medium">Hedef Kitle:</span> {getTargetAudienceText(selectedAnnouncement.targetAudience)}
                  </div>
                  <div>
                    <span className="font-medium">Okunma:</span> {selectedAnnouncement.readCount}
                  </div>
                  <div>
                    <span className="font-medium">Yayın Tarihi:</span> {selectedAnnouncement.publishedDate || 'Henüz yayınlanmadı'}
                  </div>
                  <div>
                    <span className="font-medium">Oluşturulma:</span> {selectedAnnouncement.createdAt}
                  </div>
                  <div>
                    <span className="font-medium">Güncellenme:</span> {selectedAnnouncement.updatedAt}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;