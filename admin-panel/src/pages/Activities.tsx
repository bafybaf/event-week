import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Users, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { activitiesApi, eventsApi } from '../services/api.ts';

interface Activity {
  id: number;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number | null;
  registeredCount: number;
  price: number;
  isActive: boolean;
  requiresRegistration: boolean;
  eventId: number;
  organizerId: number;
  imageUrl: string;
  requirements: string;
  equipment: string;
  notes: string;
  event?: {
    id: number;
    name: string;
  };
  organizer?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface Event {
  id: number;
  name: string;
}

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    type: 'other',
    startDate: '',
    endDate: '',
    location: '',
    capacity: '',
    price: '',
    requiresRegistration: false,
    eventId: '',
    organizerId: '',
    imageUrl: '',
    requirements: '',
    equipment: '',
    notes: ''
  });

  const activityTypes = [
    { value: 'workshop', label: 'Atölye Çalışması' },
    { value: 'seminar', label: 'Seminer' },
    { value: 'conference', label: 'Konferans' },
    { value: 'panel', label: 'Panel' },
    { value: 'networking', label: 'Networking' },
    { value: 'social', label: 'Sosyal Etkinlik' },
    { value: 'dinner', label: 'Akşam Yemeği' },
    { value: 'lunch', label: 'Öğle Yemeği' },
    { value: 'breakfast', label: 'Kahvaltı' },
    { value: 'coffee', label: 'Kahve Molası' },
    { value: 'sports', label: 'Spor Aktiviteleri' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'cultural', label: 'Kültürel Etkinlik' },
    { value: 'tour', label: 'Gezi' },
    { value: 'museum', label: 'Müze Ziyareti' },
    { value: 'concert', label: 'Konser' },
    { value: 'theater', label: 'Tiyatro' },
    { value: 'exhibition', label: 'Sergi' },
    { value: 'training', label: 'Eğitim' },
    { value: 'team-building', label: 'Takım Çalışması' },
    { value: 'competition', label: 'Yarışma' },
    { value: 'award', label: 'Ödül Töreni' },
    { value: 'opening', label: 'Açılış' },
    { value: 'closing', label: 'Kapanış' },
    { value: 'gala', label: 'Gala' },
    { value: 'cocktail', label: 'Kokteyl' },
    { value: 'entertainment', label: 'Eğlence' },
    { value: 'game', label: 'Oyun' },
    { value: 'quiz', label: 'Bilgi Yarışması' },
    { value: 'photography', label: 'Fotoğrafçılık' },
    { value: 'art', label: 'Sanat' },
    { value: 'music', label: 'Müzik' },
    { value: 'dance', label: 'Dans' },
    { value: 'cooking', label: 'Yemek' },
    { value: 'wine-tasting', label: 'Şarap Tadımı' },
    { value: 'technology', label: 'Teknoloji' },
    { value: 'innovation', label: 'İnovasyon' },
    { value: 'startup', label: 'Girişimcilik' },
    { value: 'investment', label: 'Yatırım' },
    { value: 'business', label: 'İş' },
    { value: 'other', label: 'Diğer' }
  ];

  useEffect(() => {
    fetchActivities();
    fetchEvents();
  }, []);

  const fetchActivities = async () => {
    try {
      const data = await activitiesApi.getActivities();
      setActivities(data || []);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast.error(error.message || 'Aktiviteler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents((data.events || data) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleAddActivity = async () => {
    // Form validasyonu
    if (!newActivity.name.trim()) {
      toast.error('Aktivite adı zorunludur');
      return;
    }
    if (!newActivity.startDate) {
      toast.error('Başlangıç tarihi zorunludur');
      return;
    }
    if (!newActivity.endDate) {
      toast.error('Bitiş tarihi zorunludur');
      return;
    }
    if (!newActivity.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }

    try {
      await activitiesApi.createActivity({
        ...newActivity,
        capacity: newActivity.capacity ? parseInt(newActivity.capacity) : null,
        price: parseFloat(newActivity.price) || 0,
        eventId: String(newActivity.eventId),
        organizerId: newActivity.organizerId ? String(newActivity.organizerId) : undefined
      });
      toast.success('Aktivite başarıyla eklendi');
      setShowModal(false);
      setNewActivity({
        name: '',
        description: '',
        type: 'other',
        startDate: '',
        endDate: '',
        location: '',
        capacity: '',
        price: '',
        requiresRegistration: false,
        eventId: '',
        organizerId: '',
        imageUrl: '',
        requirements: '',
        equipment: '',
        notes: ''
      });
      fetchActivities();
    } catch (error: any) {
      console.error('Error adding activity:', error);
      toast.error(error.message || 'Aktivite eklenirken hata oluştu');
    }
  };

  const handleUpdateActivity = async () => {
    if (!selectedActivity) return;

    try {
      await activitiesApi.updateActivity(String(selectedActivity.id), {
        ...newActivity,
        capacity: newActivity.capacity ? parseInt(newActivity.capacity) : null,
        price: parseFloat(newActivity.price) || 0,
        eventId: String(newActivity.eventId),
        organizerId: newActivity.organizerId ? String(newActivity.organizerId) : undefined
      });
      toast.success('Aktivite başarıyla güncellendi');
      setShowModal(false);
      setSelectedActivity(null);
      fetchActivities();
    } catch (error: any) {
      console.error('Error updating activity:', error);
      toast.error(error.message || 'Aktivite güncellenirken hata oluştu');
    }
  };

  const handleDeleteActivity = async () => {
    if (!selectedActivity) return;

    try {
      await activitiesApi.deleteActivity(String(selectedActivity.id));
      toast.success('Aktivite başarıyla silindi');
      setShowDeleteModal(false);
      setSelectedActivity(null);
      fetchActivities();
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast.error(error.message || 'Aktivite silinirken hata oluştu');
    }
  };

  const openEditModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setNewActivity({
      name: activity.name,
      description: activity.description,
      type: activity.type,
      startDate: activity.startDate.split('T')[0],
      endDate: activity.endDate.split('T')[0],
      location: activity.location,
      capacity: activity.capacity?.toString() || '',
      price: activity.price.toString(),
      requiresRegistration: activity.requiresRegistration,
      eventId: activity.eventId.toString(),
      organizerId: activity.organizerId?.toString() || '',
      imageUrl: activity.imageUrl,
      requirements: activity.requirements,
      equipment: activity.equipment,
      notes: activity.notes
    });
    setShowModal(true);
  };

  const openViewModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowViewModal(true);
  };

  const openDeleteModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDeleteModal(true);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || activity.type === filterType;
    const matchesEvent = !filterEvent || activity.eventId.toString() === filterEvent;
    
    return matchesSearch && matchesType && matchesEvent;
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
        <h1 className="text-3xl font-bold text-gray-900">Aktiviteler</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Aktivite
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Aktivite ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Tipler</option>
            {activityTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
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
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('');
              setFilterEvent('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Temizle
          </button>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktivite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lokasyon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kapasite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiyat
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
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{activity.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {activityTypes.find(t => t.value === activity.type)?.label || activity.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(activity.startDate).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {activity.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {activity.registeredCount}/{activity.capacity || '∞'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.price} ₺
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      activity.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(activity)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(activity)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(activity)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedActivity ? 'Aktivite Düzenle' : 'Yeni Aktivite Ekle'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aktivite Adı *</label>
                <input
                  type="text"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip *</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {activityTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi *</label>
                <input
                  type="date"
                  value={newActivity.startDate}
                  onChange={(e) => setNewActivity({...newActivity, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi *</label>
                <input
                  type="date"
                  value={newActivity.endDate}
                  onChange={(e) => setNewActivity({...newActivity, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon</label>
                <input
                  type="text"
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapasite</label>
                <input
                  type="number"
                  value={newActivity.capacity}
                  onChange={(e) => setNewActivity({...newActivity, capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newActivity.price}
                  onChange={(e) => setNewActivity({...newActivity, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik *</label>
                <select
                  value={newActivity.eventId}
                  onChange={(e) => setNewActivity({...newActivity, eventId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Etkinlik Seçin</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gereksinimler</label>
                <textarea
                  value={newActivity.requirements}
                  onChange={(e) => setNewActivity({...newActivity, requirements: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ekipman</label>
                <textarea
                  value={newActivity.equipment}
                  onChange={(e) => setNewActivity({...newActivity, equipment: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newActivity.requiresRegistration}
                    onChange={(e) => setNewActivity({...newActivity, requiresRegistration: e.target.checked})}
                    className="mr-2"
                  />
                  Kayıt Gerekli
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedActivity(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={selectedActivity ? handleUpdateActivity : handleAddActivity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedActivity ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Aktivite Detayları</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Aktivite Adı</label>
                <p className="text-lg font-semibold">{selectedActivity.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                <p className="text-gray-900">{selectedActivity.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tip</label>
                  <p className="text-gray-900">{activityTypes.find(t => t.value === selectedActivity.type)?.label}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lokasyon</label>
                  <p className="text-gray-900">{selectedActivity.location}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedActivity.startDate).toLocaleDateString('tr-TR')}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedActivity.endDate).toLocaleDateString('tr-TR')}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kapasite</label>
                  <p className="text-gray-900">{selectedActivity.registeredCount}/{selectedActivity.capacity || '∞'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fiyat</label>
                  <p className="text-gray-900">{selectedActivity.price} ₺</p>
                </div>
              </div>
              
              {selectedActivity.requirements && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gereksinimler</label>
                  <p className="text-gray-900">{selectedActivity.requirements}</p>
                </div>
              )}
              
              {selectedActivity.equipment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ekipman</label>
                  <p className="text-gray-900">{selectedActivity.equipment}</p>
                </div>
              )}
              
              {selectedActivity.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notlar</label>
                  <p className="text-gray-900">{selectedActivity.notes}</p>
                </div>
              )}
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
      {showDeleteModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Aktivite Sil</h2>
            <p className="text-gray-600 mb-6">
              "{selectedActivity.name}" aktivitesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteActivity}
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

export default Activities;