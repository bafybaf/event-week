import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, MapPin, DollarSign, Filter, Search, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { accommodationsApi, eventsApi } from '../services/api.ts';

interface Accommodation {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  roomType: string;
  totalRooms: number;
  availableRooms: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  amenities: string;
  facilities: string;
  policies: string;
  cancellationPolicy: string;
  images: string;
  rating: number;
  isActive: boolean;
  eventId: number;
  event?: {
    id: number;
    name: string;
  };
}

interface Event {
  id: number;
  name: string;
}

const Accommodations: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  const [newAccommodation, setNewAccommodation] = useState({
    name: '',
    type: 'hotel',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    checkInDate: '',
    checkOutDate: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    roomType: 'double',
    totalRooms: '1',
    availableRooms: '1',
    pricePerNight: '',
    totalPrice: '',
    currency: 'TRY',
    amenities: '',
    facilities: '',
    policies: '',
    cancellationPolicy: '',
    images: '',
    rating: '',
    eventId: '',
    notes: ''
  });

  const accommodationTypes = [
    { value: 'hotel', label: 'Otel' },
    { value: 'resort', label: 'Resort' },
    { value: 'apartment', label: 'Apartman' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'guesthouse', label: 'Pansiyon' },
    { value: 'villa', label: 'Villa' }
  ];

  const roomTypes = [
    { value: 'single', label: 'Tek Kişilik' },
    { value: 'double', label: 'Çift Kişilik' },
    { value: 'twin', label: 'İki Yataklı' },
    { value: 'triple', label: 'Üç Kişilik' },
    { value: 'quad', label: 'Dört Kişilik' },
    { value: 'suite', label: 'Suit' },
    { value: 'family', label: 'Aile Odası' }
  ];

  const currencies = [
    { value: 'TRY', label: 'Türk Lirası (₺)' },
    { value: 'USD', label: 'Amerikan Doları ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'İngiliz Sterlini (£)' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchAccommodations();
  }, [filterEvent]);

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      const eventId = filterEvent || undefined;
      const data = await accommodationsApi.getAccommodations(eventId);
      setAccommodations(data || []);
    } catch (error: any) {
      console.error('Error fetching accommodations:', error);
      toast.error(error.message || 'Konaklamalar yüklenirken hata oluştu');
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

  const handleAddAccommodation = async () => {
    // Form validasyonu
    if (!newAccommodation.name.trim()) {
      toast.error('Konaklama adı zorunludur');
      return;
    }
    if (!newAccommodation.type) {
      toast.error('Konaklama türü zorunludur');
      return;
    }
    if (!newAccommodation.address.trim()) {
      toast.error('Adres zorunludur');
      return;
    }
    if (!newAccommodation.city.trim()) {
      toast.error('Şehir zorunludur');
      return;
    }
    if (!newAccommodation.checkInDate) {
      toast.error('Giriş tarihi zorunludur');
      return;
    }
    if (!newAccommodation.checkOutDate) {
      toast.error('Çıkış tarihi zorunludur');
      return;
    }
    if (!newAccommodation.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }

    try {
      await accommodationsApi.createAccommodation({
        ...newAccommodation,
        totalRooms: parseInt(newAccommodation.totalRooms),
        availableRooms: parseInt(newAccommodation.availableRooms),
        pricePerNight: parseFloat(newAccommodation.pricePerNight) || 0,
        totalPrice: parseFloat(newAccommodation.totalPrice) || 0,
        rating: parseFloat(newAccommodation.rating) || null,
        eventId: String(newAccommodation.eventId)
      });
      toast.success('Konaklama başarıyla eklendi');
      setShowModal(false);
      resetForm();
      fetchAccommodations();
    } catch (error: any) {
      console.error('Error adding accommodation:', error);
      toast.error(error.message || 'Konaklama eklenirken hata oluştu');
    }
  };

  const handleUpdateAccommodation = async () => {
    if (!selectedAccommodation) return;

    try {
      await accommodationsApi.updateAccommodation(String(selectedAccommodation.id), {
        ...newAccommodation,
        totalRooms: parseInt(newAccommodation.totalRooms),
        availableRooms: parseInt(newAccommodation.availableRooms),
        pricePerNight: parseFloat(newAccommodation.pricePerNight) || 0,
        totalPrice: parseFloat(newAccommodation.totalPrice) || 0,
        rating: parseFloat(newAccommodation.rating) || null,
        eventId: String(newAccommodation.eventId)
      });
      toast.success('Konaklama başarıyla güncellendi');
      setShowModal(false);
      setSelectedAccommodation(null);
      fetchAccommodations();
    } catch (error: any) {
      console.error('Error updating accommodation:', error);
      toast.error(error.message || 'Konaklama güncellenirken hata oluştu');
    }
  };

  const handleDeleteAccommodation = async () => {
    if (!selectedAccommodation) return;

    try {
      await accommodationsApi.deleteAccommodation(String(selectedAccommodation.id));
      toast.success('Konaklama başarıyla silindi');
      setShowDeleteModal(false);
      setSelectedAccommodation(null);
      fetchAccommodations();
    } catch (error: any) {
      console.error('Error deleting accommodation:', error);
      toast.error(error.message || 'Konaklama silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setNewAccommodation({
      name: '',
      type: 'hotel',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      website: '',
      checkInDate: '',
      checkOutDate: '',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      roomType: 'double',
      totalRooms: '1',
      availableRooms: '1',
      pricePerNight: '',
      totalPrice: '',
      currency: 'TRY',
      amenities: '',
      facilities: '',
      policies: '',
      cancellationPolicy: '',
      images: '',
      rating: '',
      eventId: '',
      notes: ''
    });
  };

  const openEditModal = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation);
    setNewAccommodation({
      name: accommodation.name,
      type: accommodation.type,
      address: accommodation.address,
      city: accommodation.city,
      country: accommodation.country,
      phone: accommodation.phone,
      email: accommodation.email,
      website: accommodation.website,
      checkInDate: accommodation.checkInDate.split('T')[0],
      checkOutDate: accommodation.checkOutDate.split('T')[0],
      checkInTime: accommodation.checkInTime,
      checkOutTime: accommodation.checkOutTime,
      roomType: accommodation.roomType,
      totalRooms: accommodation.totalRooms.toString(),
      availableRooms: accommodation.availableRooms.toString(),
      pricePerNight: accommodation.pricePerNight.toString(),
      totalPrice: accommodation.totalPrice.toString(),
      currency: accommodation.currency,
      amenities: accommodation.amenities,
      facilities: accommodation.facilities,
      policies: accommodation.policies,
      cancellationPolicy: accommodation.cancellationPolicy,
      images: accommodation.images,
      rating: accommodation.rating?.toString() || '',
      eventId: accommodation.eventId.toString(),
      notes: ''
    });
    setShowModal(true);
  };

  const openViewModal = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation);
    setShowViewModal(true);
  };

  const openDeleteModal = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation);
    setShowDeleteModal(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return 'bg-blue-100 text-blue-800';
      case 'resort': return 'bg-green-100 text-green-800';
      case 'apartment': return 'bg-purple-100 text-purple-800';
      case 'hostel': return 'bg-yellow-100 text-yellow-800';
      case 'guesthouse': return 'bg-orange-100 text-orange-800';
      case 'villa': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    return accommodationTypes.find(t => t.value === type)?.label || type;
  };

  const getRoomTypeText = (roomType: string) => {
    return roomTypes.find(r => r.value === roomType)?.label || roomType;
  };

  const filteredAccommodations = accommodations.filter(accommodation => {
    const matchesSearch = accommodation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         accommodation.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         accommodation.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || accommodation.type === filterType;
    const matchesEvent = !filterEvent || accommodation.eventId.toString() === filterEvent;
    
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
        <h1 className="text-3xl font-bold text-gray-900">Konaklamalar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Konaklama
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Konaklama ara..."
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
            {accommodationTypes.map(type => (
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

      {/* Accommodations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Konaklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lokasyon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarihler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Değerlendirme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccommodations.map((accommodation) => (
                <tr key={accommodation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{accommodation.name}</div>
                      <div className="text-sm text-gray-500">{accommodation.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(accommodation.type)}`}>
                      {getTypeText(accommodation.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{accommodation.city}</div>
                        <div className="text-sm text-gray-500">{accommodation.country}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(accommodation.checkInDate).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(accommodation.checkOutDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{getRoomTypeText(accommodation.roomType)}</div>
                      <div className="text-sm text-gray-500">{accommodation.availableRooms}/{accommodation.totalRooms} oda</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {accommodation.pricePerNight} {accommodation.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {accommodation.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900">{accommodation.rating}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Değerlendirme yok</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(accommodation)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(accommodation)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(accommodation)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedAccommodation ? 'Konaklama Düzenle' : 'Yeni Konaklama Ekle'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konaklama Adı *</label>
                <input
                  type="text"
                  value={newAccommodation.name}
                  onChange={(e) => setNewAccommodation({...newAccommodation, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip *</label>
                <select
                  value={newAccommodation.type}
                  onChange={(e) => setNewAccommodation({...newAccommodation, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {accommodationTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
                <input
                  type="text"
                  value={newAccommodation.address}
                  onChange={(e) => setNewAccommodation({...newAccommodation, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                <input
                  type="text"
                  value={newAccommodation.city}
                  onChange={(e) => setNewAccommodation({...newAccommodation, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                <input
                  type="text"
                  value={newAccommodation.country}
                  onChange={(e) => setNewAccommodation({...newAccommodation, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="text"
                  value={newAccommodation.phone}
                  onChange={(e) => setNewAccommodation({...newAccommodation, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={newAccommodation.email}
                  onChange={(e) => setNewAccommodation({...newAccommodation, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giriş Tarihi *</label>
                <input
                  type="date"
                  value={newAccommodation.checkInDate}
                  onChange={(e) => setNewAccommodation({...newAccommodation, checkInDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Çıkış Tarihi *</label>
                <input
                  type="date"
                  value={newAccommodation.checkOutDate}
                  onChange={(e) => setNewAccommodation({...newAccommodation, checkOutDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giriş Saati</label>
                <input
                  type="time"
                  value={newAccommodation.checkInTime}
                  onChange={(e) => setNewAccommodation({...newAccommodation, checkInTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Çıkış Saati</label>
                <input
                  type="time"
                  value={newAccommodation.checkOutTime}
                  onChange={(e) => setNewAccommodation({...newAccommodation, checkOutTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oda Tipi</label>
                <select
                  value={newAccommodation.roomType}
                  onChange={(e) => setNewAccommodation({...newAccommodation, roomType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roomTypes.map(room => (
                    <option key={room.value} value={room.value}>{room.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Oda Sayısı</label>
                <input
                  type="number"
                  value={newAccommodation.totalRooms}
                  onChange={(e) => setNewAccommodation({...newAccommodation, totalRooms: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Müsait Oda Sayısı</label>
                <input
                  type="number"
                  value={newAccommodation.availableRooms}
                  onChange={(e) => setNewAccommodation({...newAccommodation, availableRooms: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gece Başına Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccommodation.pricePerNight}
                  onChange={(e) => setNewAccommodation({...newAccommodation, pricePerNight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccommodation.totalPrice}
                  onChange={(e) => setNewAccommodation({...newAccommodation, totalPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                <select
                  value={newAccommodation.currency}
                  onChange={(e) => setNewAccommodation({...newAccommodation, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {currencies.map(currency => (
                    <option key={currency.value} value={currency.value}>{currency.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Değerlendirme (1-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={newAccommodation.rating}
                  onChange={(e) => setNewAccommodation({...newAccommodation, rating: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik *</label>
                <select
                  value={newAccommodation.eventId}
                  onChange={(e) => setNewAccommodation({...newAccommodation, eventId: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Olanaklar</label>
                <textarea
                  value={newAccommodation.amenities}
                  onChange={(e) => setNewAccommodation({...newAccommodation, amenities: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tesisler</label>
                <textarea
                  value={newAccommodation.facilities}
                  onChange={(e) => setNewAccommodation({...newAccommodation, facilities: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Politikalar</label>
                <textarea
                  value={newAccommodation.policies}
                  onChange={(e) => setNewAccommodation({...newAccommodation, policies: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">İptal Politikası</label>
                <textarea
                  value={newAccommodation.cancellationPolicy}
                  onChange={(e) => setNewAccommodation({...newAccommodation, cancellationPolicy: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAccommodation(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={selectedAccommodation ? handleUpdateAccommodation : handleAddAccommodation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedAccommodation ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedAccommodation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Konaklama Detayları</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Konaklama Adı</label>
                <p className="text-lg font-semibold">{selectedAccommodation.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tip</label>
                  <p className="text-gray-900">{getTypeText(selectedAccommodation.type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Oda Tipi</label>
                  <p className="text-gray-900">{getRoomTypeText(selectedAccommodation.roomType)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Adres</label>
                <p className="text-gray-900">{selectedAccommodation.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Şehir</label>
                  <p className="text-gray-900">{selectedAccommodation.city}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ülke</label>
                  <p className="text-gray-900">{selectedAccommodation.country}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giriş Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedAccommodation.checkInDate).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Çıkış Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedAccommodation.checkOutDate).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giriş Saati</label>
                  <p className="text-gray-900">{selectedAccommodation.checkInTime}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Çıkış Saati</label>
                  <p className="text-gray-900">{selectedAccommodation.checkOutTime}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Toplam Oda</label>
                  <p className="text-gray-900">{selectedAccommodation.totalRooms}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Müsait Oda</label>
                  <p className="text-gray-900">{selectedAccommodation.availableRooms}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gece Başına Fiyat</label>
                  <p className="text-gray-900">{selectedAccommodation.pricePerNight} {selectedAccommodation.currency}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Toplam Fiyat</label>
                  <p className="text-gray-900">{selectedAccommodation.totalPrice} {selectedAccommodation.currency}</p>
                </div>
              </div>
              
              {selectedAccommodation.rating && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Değerlendirme</label>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-lg font-semibold">{selectedAccommodation.rating}/5</span>
                  </div>
                </div>
              )}
              
              {selectedAccommodation.amenities && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Olanaklar</label>
                  <p className="text-gray-900">{selectedAccommodation.amenities}</p>
                </div>
              )}
              
              {selectedAccommodation.facilities && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tesisler</label>
                  <p className="text-gray-900">{selectedAccommodation.facilities}</p>
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
      {showDeleteModal && selectedAccommodation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Konaklama Sil</h2>
            <p className="text-gray-600 mb-6">
              "{selectedAccommodation.name}" konaklamasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteAccommodation}
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

export default Accommodations;