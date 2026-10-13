import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Calendar, Filter, Search, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { notesApi, eventsApi, usersApi } from '../services/api.ts';

interface Note {
  id: number;
  title: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  eventId: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  event?: {
    id: number;
    name: string;
  };
}

interface Event {
  id: number;
  name: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
}

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterPrivacy, setFilterPrivacy] = useState('');

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    isPrivate: false,
    userId: '',
    eventId: '',
    notes: '',
    createdAt: '',
    updatedAt: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [filterEvent]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const eventId = filterEvent || undefined;
      const data = await notesApi.getNotes(eventId);
      // Backend formatını frontend formatına çevir (isPublic -> isPrivate)
      const formattedNotes = (data.notes || []).map((note: any) => ({
        ...note,
        isPrivate: !note.isPublic // isPublic -> isPrivate (ters mantık)
      }));
      setNotes(formattedNotes);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast.error(error.response?.data?.error || error.message || 'Notlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents(data.events || data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await usersApi.getUsers();
      setUsers(data.users || data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddNote = async () => {
    // Form validasyonu
    if (!newNote.title.trim()) {
      toast.error('Başlık zorunludur');
      return;
    }
    if (!newNote.content.trim()) {
      toast.error('İçerik zorunludur');
      return;
    }
    if (!newNote.userId) {
      toast.error('Kullanıcı seçimi zorunludur');
      return;
    }
    if (!newNote.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }

    try {
      const payload: any = {
        title: newNote.title,
        content: newNote.content,
        isPublic: !newNote.isPrivate, // isPrivate -> isPublic (ters mantık)
        userId: newNote.userId, // String olarak gönder (UUID)
        eventId: newNote.eventId, // String olarak gönder (UUID)
      };

      // Tarihleri sadece boş değilse ve geçerliyse ekle
      if (newNote.createdAt && newNote.createdAt.trim() !== '') {
        // datetime-local formatını ISO formatına çevir
        const createdAtDate = new Date(newNote.createdAt);
        if (!isNaN(createdAtDate.getTime())) {
          payload.createdAt = createdAtDate.toISOString();
        }
      }

      if (newNote.updatedAt && newNote.updatedAt.trim() !== '') {
        // datetime-local formatını ISO formatına çevir
        const updatedAtDate = new Date(newNote.updatedAt);
        if (!isNaN(updatedAtDate.getTime())) {
          payload.updatedAt = updatedAtDate.toISOString();
        }
      }

      await notesApi.createNote(payload);
      toast.success('Not başarıyla eklendi');
      setShowModal(false);
      resetForm();
      fetchNotes();
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error(error.response?.data?.error || error.message || 'Not eklenirken hata oluştu');
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;

    try {
      const payload: any = {
        title: newNote.title,
        content: newNote.content,
        isPublic: !newNote.isPrivate, // isPrivate -> isPublic (ters mantık)
        userId: newNote.userId, // String olarak gönder (UUID)
        eventId: newNote.eventId, // String olarak gönder (UUID)
      };

      // Tarihleri sadece boş değilse ve geçerliyse ekle
      if (newNote.createdAt && newNote.createdAt.trim() !== '') {
        // datetime-local formatını ISO formatına çevir
        const createdAtDate = new Date(newNote.createdAt);
        if (!isNaN(createdAtDate.getTime())) {
          payload.createdAt = createdAtDate.toISOString();
        }
      }

      if (newNote.updatedAt && newNote.updatedAt.trim() !== '') {
        // datetime-local formatını ISO formatına çevir
        const updatedAtDate = new Date(newNote.updatedAt);
        if (!isNaN(updatedAtDate.getTime())) {
          payload.updatedAt = updatedAtDate.toISOString();
        }
      }

      await notesApi.updateNote(selectedNote.id, payload);
      toast.success('Not başarıyla güncellendi');
      setShowModal(false);
      setSelectedNote(null);
      resetForm();
      fetchNotes();
    } catch (error: any) {
      console.error('Error updating note:', error);
      toast.error(error.response?.data?.error || error.message || 'Not güncellenirken hata oluştu');
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    try {
      await notesApi.deleteNote(selectedNote.id);
      toast.success('Not başarıyla silindi');
      setShowDeleteModal(false);
      setSelectedNote(null);
      fetchNotes();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast.error(error.response?.data?.error || error.message || 'Not silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setNewNote({
      title: '',
      content: '',
      isPrivate: false,
      userId: '',
      eventId: '',
      notes: '',
      createdAt: '',
      updatedAt: ''
    });
  };

  const openEditModal = (note: Note) => {
    setSelectedNote(note);
    const createdAtDate = note.createdAt ? new Date(note.createdAt).toISOString().slice(0, 16) : '';
    const updatedAtDate = note.updatedAt ? new Date(note.updatedAt).toISOString().slice(0, 16) : '';
    
    // Backend'den gelen isPublic değerini frontend'deki isPrivate'e çevir
    const isPrivate = note.isPrivate !== undefined ? note.isPrivate : !(note as any).isPublic;
    
    setNewNote({
      title: note.title,
      content: note.content,
      isPrivate: isPrivate,
      userId: note.userId.toString(),
      eventId: note.eventId.toString(),
      notes: '',
      createdAt: createdAtDate,
      updatedAt: updatedAtDate
    });
    setShowModal(true);
  };

  const openViewModal = (note: Note) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  const openDeleteModal = (note: Note) => {
    setSelectedNote(note);
    setShowDeleteModal(true);
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Bilinmeyen Kullanıcı';
  };

  const getEventName = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Bilinmeyen Etkinlik';
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = !filterEvent || note.eventId.toString() === filterEvent;
    const matchesUser = !filterUser || note.userId.toString() === filterUser;
    const matchesPrivacy = !filterPrivacy || 
                          (filterPrivacy === 'private' && note.isPrivate) ||
                          (filterPrivacy === 'public' && !note.isPrivate);
    
    return matchesSearch && matchesEvent && matchesUser && matchesPrivacy;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notlar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Not
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Not ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Etkinlikler</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Kullanıcılar</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
            ))}
          </select>
          <select
            value={filterPrivacy}
            onChange={(e) => setFilterPrivacy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Notlar</option>
            <option value="public">Herkese Açık</option>
            <option value="private">Özel</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterEvent('');
              setFilterUser('');
              setFilterPrivacy('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Temizle
          </button>
        </div>
      </div>

      {/* Notes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Not
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etkinlik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oluşturma Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Güncelleme Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotes.map((note) => (
                <tr key={note.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{note.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{note.content.substring(0, 100)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getUserName(note.userId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getEventName(note.eventId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(note.updatedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${note.isPrivate ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {note.isPrivate ? (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Özel
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Unlock className="w-3 h-3" />
                          Herkese Açık
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(note)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(note)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(note)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div 
          className="fixed bg-black bg-opacity-50 flex items-center justify-center z-50" 
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedNote ? 'Not Düzenle' : 'Yeni Not Ekle'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İçerik *</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı *</label>
                  <select
                    value={newNote.userId}
                    onChange={(e) => setNewNote({...newNote, userId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Kullanıcı Seçin</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik *</label>
                  <select
                    value={newNote.eventId}
                    onChange={(e) => setNewNote({...newNote, eventId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Etkinlik Seçin</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newNote.isPrivate}
                  onChange={(e) => setNewNote({...newNote, isPrivate: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
                  Özel not (sadece yazarı görebilir)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Oluşturma Tarihi</label>
                  <input
                    type="datetime-local"
                    value={newNote.createdAt}
                    onChange={(e) => setNewNote({...newNote, createdAt: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Güncelleme Tarihi</label>
                  <input
                    type="datetime-local"
                    value={newNote.updatedAt}
                    onChange={(e) => setNewNote({...newNote, updatedAt: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedNote(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={selectedNote ? handleUpdateNote : handleAddNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedNote ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Not Detayları</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Başlık</label>
                <p className="text-lg font-semibold">{selectedNote.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">İçerik</label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedNote.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Yazar</label>
                  <p className="text-gray-900">{getUserName(selectedNote.userId)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik</label>
                  <p className="text-gray-900">{getEventName(selectedNote.eventId)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Oluşturma Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedNote.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Güncelleme Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedNote.updatedAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Durum</label>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedNote.isPrivate ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {selectedNote.isPrivate ? (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Özel
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Unlock className="w-3 h-3" />
                      Herkese Açık
                    </span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Not Sil</h2>
            <p className="text-gray-600 mb-6">
              "{selectedNote.title}" notunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteNote}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;