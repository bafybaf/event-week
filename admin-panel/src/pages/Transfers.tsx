import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Car, MapPin, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { transfersApi, eventsApi } from '../services/api.ts';

interface Transfer {
  id: string;
  eventId: string;
  name: string;
  description: string;
  type: 'airport' | 'hotel' | 'venue' | 'custom';
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  capacity: number;
  currentBookings: number;
  price: number;
  currency: string;
  vehicleType: 'bus' | 'minibus' | 'car' | 'van';
  driverName: string;
  driverPhone: string;
  status: 'available' | 'full' | 'cancelled' | 'completed';
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransferBooking {
  id: string;
  transferId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  bookingDate: string;
  passengers: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: string;
}

interface Event {
  id: number;
  name: string;
}

const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [bookings, setBookings] = useState<TransferBooking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterEvent, setFilterEvent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const emptyTransfer: Partial<Transfer> = {
    eventId: '',
    name: '',
    description: '',
    type: 'airport',
    fromLocation: '',
    toLocation: '',
    departureTime: '',
    arrivalTime: '',
    capacity: 20,
    currentBookings: 0,
    price: 0,
    currency: 'TRY',
    vehicleType: 'bus',
    driverName: '',
    driverPhone: '',
    status: 'available',
    isActive: true,
    notes: ''
  };

  const [newTransfer, setNewTransfer] = useState<Partial<Transfer>>(emptyTransfer);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [filterEvent]);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents((data.events || data) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const eventId = filterEvent || undefined;
      const data = await transfersApi.getTransfers(eventId);
      const transfersList = Array.isArray(data) ? data : (data.transfers || []);
      
      // Backend formatını frontend formatına çevir
      const formattedTransfers = transfersList.map((t: any) => ({
        id: t.id,
        eventId: String(t.eventId || t.event?.id || ''),
        name: t.name,
        description: t.description || '',
        type: t.type || 'airport', // Backend'de yoksa default
        fromLocation: t.departureLocation || t.fromLocation || '',
        toLocation: t.arrivalLocation || t.toLocation || '',
        departureTime: t.departureTime ? (typeof t.departureTime === 'string' ? t.departureTime.split('T')[1]?.slice(0, 5) : new Date(t.departureTime).toTimeString().slice(0, 5)) : '',
        arrivalTime: t.arrivalTime ? (typeof t.arrivalTime === 'string' ? t.arrivalTime.split('T')[1]?.slice(0, 5) : new Date(t.arrivalTime).toTimeString().slice(0, 5)) : '',
        capacity: t.capacity || 20,
        currentBookings: t.currentBookings || 0,
        price: t.price || 0,
        currency: t.currency || 'TRY',
        vehicleType: t.vehicleType || 'bus',
        driverName: t.driverName || '',
        driverPhone: t.driverPhone || '',
        status: t.status || (t.currentBookings >= t.capacity ? 'full' : 'available'),
        isActive: t.isActive !== undefined ? t.isActive : true,
        notes: t.notes || '',
        createdAt: t.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: t.updatedAt || new Date().toISOString().split('T')[0]
      }));
      
      setTransfers(formattedTransfers);
      // Bookings için ayrı bir endpoint yoksa boş array
      setBookings([]);
    } catch (error: any) {
      console.error('Error fetching transfers:', error);
      toast.error(error.message || 'Transferler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transfer.fromLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transfer.toLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || transfer.status === filterStatus;
    const matchesType = !filterType || transfer.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'airport': return 'bg-blue-100 text-blue-800';
      case 'hotel': return 'bg-green-100 text-green-800';
      case 'venue': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'airport': return 'Havaalanı';
      case 'hotel': return 'Otel';
      case 'venue': return 'Mekan';
      case 'custom': return 'Özel';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'full': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Müsait';
      case 'full': return 'Dolu';
      case 'cancelled': return 'İptal';
      case 'completed': return 'Tamamlandı';
      default: return 'Bilinmiyor';
    }
  };

  const getVehicleTypeText = (type: string) => {
    switch (type) {
      case 'bus': return 'Otobüs';
      case 'minibus': return 'Minibüs';
      case 'car': return 'Araba';
      case 'van': return 'Van';
      default: return 'Bilinmiyor';
    }
  };

  const getEventName = (eventId?: string) => {
    if (!eventId) return '';
    const event = events.find((e) => String(e.id) === String(eventId));
    return event ? event.name : '';
  };

  const openAddModal = () => {
    setNewTransfer({ ...emptyTransfer, eventId: filterEvent || '' });
    setShowAddModal(true);
  };

  const handleAddTransfer = async () => {
    if (!newTransfer.name || !newTransfer.fromLocation || !newTransfer.toLocation || !newTransfer.departureTime) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (!newTransfer.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }

    try {
      // Tarih/saat bilgilerini birleştir
      const today = new Date().toISOString().split('T')[0];
      const departureDateTime = `${today}T${newTransfer.departureTime}:00`;
      const arrivalDateTime = newTransfer.arrivalTime 
        ? `${today}T${newTransfer.arrivalTime}:00`
        : `${today}T${newTransfer.departureTime}:00`; // Eğer arrivalTime yoksa departureTime kullan

      const payload = {
        eventId: String(newTransfer.eventId),
        name: newTransfer.name,
        description: newTransfer.description || '',
        departureLocation: newTransfer.fromLocation,
        arrivalLocation: newTransfer.toLocation,
        departureTime: departureDateTime,
        arrivalTime: arrivalDateTime,
        vehicleType: newTransfer.vehicleType || 'bus',
        capacity: newTransfer.capacity || 20,
        price: newTransfer.price || 0,
        currency: newTransfer.currency || 'TRY',
        driverName: newTransfer.driverName || '',
        driverPhone: newTransfer.driverPhone || '',
        notes: newTransfer.notes || '',
        isActive: newTransfer.isActive !== undefined ? newTransfer.isActive : true
      };

      const created = await transfersApi.createTransfer(payload);
      
      // Backend response'unu formatla
      const formattedTransfer = {
        id: created.id,
        eventId: String(created.eventId || created.event?.id || newTransfer.eventId),
        name: created.name,
        description: created.description || '',
        type: newTransfer.type || 'airport',
        fromLocation: created.departureLocation || created.fromLocation || '',
        toLocation: created.arrivalLocation || created.toLocation || '',
        departureTime: created.departureTime ? (typeof created.departureTime === 'string' ? created.departureTime.split('T')[1]?.slice(0, 5) : new Date(created.departureTime).toTimeString().slice(0, 5)) : newTransfer.departureTime,
        arrivalTime: created.arrivalTime ? (typeof created.arrivalTime === 'string' ? created.arrivalTime.split('T')[1]?.slice(0, 5) : new Date(created.arrivalTime).toTimeString().slice(0, 5)) : newTransfer.arrivalTime,
        capacity: created.capacity || newTransfer.capacity || 20,
        currentBookings: created.currentBookings || 0,
        price: created.price || newTransfer.price || 0,
        currency: created.currency || newTransfer.currency || 'TRY',
        vehicleType: created.vehicleType || newTransfer.vehicleType || 'bus',
        driverName: created.driverName || newTransfer.driverName || '',
        driverPhone: created.driverPhone || newTransfer.driverPhone || '',
        status: 'available',
        isActive: created.isActive !== undefined ? created.isActive : true,
        notes: created.notes || newTransfer.notes || '',
        createdAt: created.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: created.updatedAt || new Date().toISOString().split('T')[0]
      };

      setTransfers([...transfers, formattedTransfer]);
      setNewTransfer(emptyTransfer);
      setShowAddModal(false);
      toast.success('Transfer başarıyla eklendi');
    } catch (error: any) {
      console.error('Error adding transfer:', error);
      toast.error(error.response?.data?.error || error.message || 'Transfer eklenirken hata oluştu');
    }
  };

  const handleEditTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setNewTransfer({ ...transfer, eventId: String(transfer.eventId || '') });
    setShowEditModal(true);
  };

  const handleUpdateTransfer = async () => {
    if (!selectedTransfer || !newTransfer.name || !newTransfer.fromLocation || !newTransfer.toLocation || !newTransfer.departureTime) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (!newTransfer.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }

    try {
      // Tarih/saat bilgilerini birleştir
      const today = new Date().toISOString().split('T')[0];
      const departureDateTime = `${today}T${newTransfer.departureTime}:00`;
      const arrivalDateTime = newTransfer.arrivalTime 
        ? `${today}T${newTransfer.arrivalTime}:00`
        : `${today}T${newTransfer.departureTime}:00`;

      const payload = {
        eventId: String(newTransfer.eventId),
        name: newTransfer.name,
        description: newTransfer.description || '',
        departureLocation: newTransfer.fromLocation,
        arrivalLocation: newTransfer.toLocation,
        departureTime: departureDateTime,
        arrivalTime: arrivalDateTime,
        vehicleType: newTransfer.vehicleType || 'bus',
        capacity: newTransfer.capacity || 20,
        price: newTransfer.price || 0,
        currency: newTransfer.currency || 'TRY',
        driverName: newTransfer.driverName || '',
        driverPhone: newTransfer.driverPhone || '',
        notes: newTransfer.notes || '',
        isActive: newTransfer.isActive !== undefined ? newTransfer.isActive : true
      };

      const updated = await transfersApi.updateTransfer(selectedTransfer.id, payload);
      
      // Backend response'unu formatla
      const formattedTransfer = {
        id: updated.id,
        eventId: String(updated.eventId || updated.event?.id || newTransfer.eventId),
        name: updated.name,
        description: updated.description || '',
        type: newTransfer.type || selectedTransfer.type || 'airport',
        fromLocation: updated.departureLocation || updated.fromLocation || newTransfer.fromLocation,
        toLocation: updated.arrivalLocation || updated.toLocation || newTransfer.toLocation,
        departureTime: updated.departureTime ? (typeof updated.departureTime === 'string' ? updated.departureTime.split('T')[1]?.slice(0, 5) : new Date(updated.departureTime).toTimeString().slice(0, 5)) : newTransfer.departureTime,
        arrivalTime: updated.arrivalTime ? (typeof updated.arrivalTime === 'string' ? updated.arrivalTime.split('T')[1]?.slice(0, 5) : new Date(updated.arrivalTime).toTimeString().slice(0, 5)) : newTransfer.arrivalTime,
        capacity: updated.capacity || newTransfer.capacity || 20,
        currentBookings: updated.currentBookings !== undefined ? updated.currentBookings : selectedTransfer.currentBookings,
        price: updated.price || newTransfer.price || 0,
        currency: updated.currency || newTransfer.currency || 'TRY',
        vehicleType: updated.vehicleType || newTransfer.vehicleType || 'bus',
        driverName: updated.driverName || newTransfer.driverName || '',
        driverPhone: updated.driverPhone || newTransfer.driverPhone || '',
        status: updated.currentBookings >= updated.capacity ? 'full' : 'available',
        isActive: updated.isActive !== undefined ? updated.isActive : true,
        notes: updated.notes || newTransfer.notes || '',
        createdAt: updated.createdAt || selectedTransfer.createdAt,
        updatedAt: updated.updatedAt || new Date().toISOString().split('T')[0]
      };

      setTransfers(transfers.map(transfer => 
        transfer.id === selectedTransfer.id ? formattedTransfer : transfer
      ));
      setShowEditModal(false);
      setSelectedTransfer(null);
      toast.success('Transfer başarıyla güncellendi');
    } catch (error: any) {
      console.error('Error updating transfer:', error);
      toast.error(error.response?.data?.error || error.message || 'Transfer güncellenirken hata oluştu');
    }
  };

  const handleDeleteTransfer = async (transferId: string) => {
    if (!window.confirm('Bu transferi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await transfersApi.deleteTransfer(transferId);
      setTransfers(transfers.filter(transfer => transfer.id !== transferId));
      setBookings(bookings.filter(booking => booking.transferId !== transferId));
      toast.success('Transfer başarıyla silindi');
    } catch (error: any) {
      console.error('Error deleting transfer:', error);
      toast.error(error.response?.data?.error || error.message || 'Transfer silinirken hata oluştu');
    }
  };

  const handleViewDetails = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailsModal(true);
  };

  const handleViewBookings = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setShowBookingsModal(true);
  };

  const handleToggleActive = async (transferId: string) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    try {
      const updated = await transfersApi.updateTransfer(transferId, {
        isActive: !transfer.isActive
      });
      
      setTransfers(transfers.map(t => 
        t.id === transferId 
          ? { ...t, isActive: updated.isActive !== undefined ? updated.isActive : !transfer.isActive }
          : t
      ));
      toast.success('Transfer durumu güncellendi');
    } catch (error: any) {
      console.error('Error toggling transfer active status:', error);
      toast.error(error.response?.data?.error || error.message || 'Transfer durumu güncellenirken hata oluştu');
    }
  };

  const getTransferBookings = (transferId: string) => {
    return bookings.filter(booking => booking.transferId === transferId);
  };

  return (
    <div className="space-y-6 [&>*:first-child]:mt-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Transferleri görüntüleyin ve yönetin
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Yeni Transfer
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Transfer ara..."
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
            <option value="available">Müsait</option>
            <option value="full">Dolu</option>
            <option value="cancelled">İptal</option>
            <option value="completed">Tamamlandı</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Tipler</option>
            <option value="airport">Havaalanı</option>
            <option value="hotel">Otel</option>
            <option value="venue">Mekan</option>
            <option value="custom">Özel</option>
          </select>
        </div>
      </div>

      {/* Transfer Listesi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTransfers.map((transfer) => (
          <div key={transfer.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{transfer.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{transfer.description}</p>
                  {getEventName(transfer.eventId) && (
                    <p className="text-xs text-blue-600 mb-3">{getEventName(transfer.eventId)}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transfer.type)}`}>
                    {getTypeText(transfer.type)}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transfer.status)}`}>
                    {getStatusText(transfer.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {transfer.fromLocation} → {transfer.toLocation}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {transfer.departureTime} - {transfer.arrivalTime}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {transfer.currentBookings}/{transfer.capacity} kişi
                </div>
                <div className="text-sm text-gray-600">
                  {transfer.price} {transfer.currency} • {getVehicleTypeText(transfer.vehicleType)}
                </div>
                <div className="text-sm text-gray-600">
                  Şoför: {transfer.driverName} ({transfer.driverPhone})
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(transfer.currentBookings / transfer.capacity) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(transfer)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Detayları Görüntüle"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleViewBookings(transfer)}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Rezervasyonları Görüntüle"
                  >
                    <Users size={16} />
                  </button>
                  <button
                    onClick={() => handleEditTransfer(transfer)}
                    className="text-yellow-600 hover:text-yellow-900 p-1"
                    title="Düzenle"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTransfer(transfer.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <button
                  onClick={() => handleToggleActive(transfer.id)}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    transfer.isActive 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {transfer.isActive ? 'Aktif' : 'Pasif'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Ekleme Modal */}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Transfer Oluştur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik *</label>
                  <select
                    value={newTransfer.eventId || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, eventId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700">Transfer Adı *</label>
                  <input
                    type="text"
                    value={newTransfer.name}
                    onChange={(e) => setNewTransfer({ ...newTransfer, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    value={newTransfer.description || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transfer Tipi</label>
                    <select
                      value={newTransfer.type}
                      onChange={(e) => setNewTransfer({ ...newTransfer, type: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="airport">Havaalanı</option>
                      <option value="hotel">Otel</option>
                      <option value="venue">Mekan</option>
                      <option value="custom">Özel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Araç Tipi</label>
                    <select
                      value={newTransfer.vehicleType}
                      onChange={(e) => setNewTransfer({ ...newTransfer, vehicleType: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bus">Otobüs</option>
                      <option value="minibus">Minibüs</option>
                      <option value="car">Araba</option>
                      <option value="van">Van</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kalkış Yeri *</label>
                    <input
                      type="text"
                      value={newTransfer.fromLocation}
                      onChange={(e) => setNewTransfer({ ...newTransfer, fromLocation: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Varış Yeri *</label>
                    <input
                      type="text"
                      value={newTransfer.toLocation}
                      onChange={(e) => setNewTransfer({ ...newTransfer, toLocation: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kalkış Saati *</label>
                    <input
                      type="time"
                      value={newTransfer.departureTime}
                      onChange={(e) => setNewTransfer({ ...newTransfer, departureTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Varış Saati</label>
                    <input
                      type="time"
                      value={newTransfer.arrivalTime}
                      onChange={(e) => setNewTransfer({ ...newTransfer, arrivalTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kapasite</label>
                    <input
                      type="number"
                      value={newTransfer.capacity}
                      onChange={(e) => setNewTransfer({ ...newTransfer, capacity: parseInt(e.target.value) || 20 })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fiyat</label>
                    <input
                      type="number"
                      value={newTransfer.price}
                      onChange={(e) => setNewTransfer({ ...newTransfer, price: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Para Birimi</label>
                    <select
                      value={newTransfer.currency}
                      onChange={(e) => setNewTransfer({ ...newTransfer, currency: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Şoför Adı</label>
                    <input
                      type="text"
                      value={newTransfer.driverName}
                      onChange={(e) => setNewTransfer({ ...newTransfer, driverName: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Şoför Telefonu</label>
                    <input
                      type="tel"
                      value={newTransfer.driverPhone}
                      onChange={(e) => setNewTransfer({ ...newTransfer, driverPhone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notlar</label>
                  <textarea
                    value={newTransfer.notes || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newTransfer.isActive}
                      onChange={(e) => setNewTransfer({ ...newTransfer, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Transfer aktif (mobil uygulamada görünür)</span>
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
                  onClick={handleAddTransfer}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Düzenleme Modal */}
      {showEditModal && selectedTransfer && (
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Düzenle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik *</label>
                  <select
                    value={newTransfer.eventId || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, eventId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700">Transfer Adı *</label>
                  <input
                    type="text"
                    value={newTransfer.name}
                    onChange={(e) => setNewTransfer({ ...newTransfer, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    value={newTransfer.description || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transfer Tipi</label>
                    <select
                      value={newTransfer.type}
                      onChange={(e) => setNewTransfer({ ...newTransfer, type: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="airport">Havaalanı</option>
                      <option value="hotel">Otel</option>
                      <option value="venue">Mekan</option>
                      <option value="custom">Özel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Araç Tipi</label>
                    <select
                      value={newTransfer.vehicleType}
                      onChange={(e) => setNewTransfer({ ...newTransfer, vehicleType: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bus">Otobüs</option>
                      <option value="minibus">Minibüs</option>
                      <option value="car">Araba</option>
                      <option value="van">Van</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kalkış Yeri *</label>
                    <input
                      type="text"
                      value={newTransfer.fromLocation}
                      onChange={(e) => setNewTransfer({ ...newTransfer, fromLocation: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Varış Yeri *</label>
                    <input
                      type="text"
                      value={newTransfer.toLocation}
                      onChange={(e) => setNewTransfer({ ...newTransfer, toLocation: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kalkış Saati *</label>
                    <input
                      type="time"
                      value={newTransfer.departureTime}
                      onChange={(e) => setNewTransfer({ ...newTransfer, departureTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Varış Saati</label>
                    <input
                      type="time"
                      value={newTransfer.arrivalTime}
                      onChange={(e) => setNewTransfer({ ...newTransfer, arrivalTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kapasite</label>
                    <input
                      type="number"
                      value={newTransfer.capacity}
                      onChange={(e) => setNewTransfer({ ...newTransfer, capacity: parseInt(e.target.value) || 20 })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fiyat</label>
                    <input
                      type="number"
                      value={newTransfer.price}
                      onChange={(e) => setNewTransfer({ ...newTransfer, price: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Para Birimi</label>
                    <select
                      value={newTransfer.currency}
                      onChange={(e) => setNewTransfer({ ...newTransfer, currency: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Şoför Adı</label>
                    <input
                      type="text"
                      value={newTransfer.driverName}
                      onChange={(e) => setNewTransfer({ ...newTransfer, driverName: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Şoför Telefonu</label>
                    <input
                      type="tel"
                      value={newTransfer.driverPhone}
                      onChange={(e) => setNewTransfer({ ...newTransfer, driverPhone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notlar</label>
                  <textarea
                    value={newTransfer.notes || ''}
                    onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newTransfer.isActive}
                      onChange={(e) => setNewTransfer({ ...newTransfer, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Transfer aktif (mobil uygulamada görünür)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTransfer(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateTransfer}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Detayları Modal */}
      {showDetailsModal && selectedTransfer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Detayları</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Etkinlik</label>
                    <p className="mt-1 text-sm text-gray-900">{getEventName(selectedTransfer.eventId) || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transfer Adı</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransfer.status)}`}>
                      {getStatusText(selectedTransfer.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransfer.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kalkış Yeri</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.fromLocation}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Varış Yeri</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.toLocation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kalkış Saati</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.departureTime}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Varış Saati</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.arrivalTime}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kapasite</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.capacity} kişi</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mevcut Rezervasyonlar</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.currentBookings} kişi</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fiyat</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.price} {selectedTransfer.currency}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Araç Tipi</label>
                    <p className="mt-1 text-sm text-gray-900">{getVehicleTypeText(selectedTransfer.vehicleType)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transfer Tipi</label>
                    <p className="mt-1 text-sm text-gray-900">{getTypeText(selectedTransfer.type)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Şoför Adı</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.driverName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Şoför Telefonu</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.driverPhone}</p>
                  </div>
                </div>

                {selectedTransfer.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notlar</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransfer.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>Oluşturulma: {selectedTransfer.createdAt}</div>
                  <div>Güncellenme: {selectedTransfer.updatedAt}</div>
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

      {/* Rezervasyonlar Modal */}
      {showBookingsModal && selectedTransfer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedTransfer.name} - Rezervasyonlar
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yolcu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İletişim
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yolcu Sayısı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getTransferBookings(selectedTransfer.id).map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{booking.userName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.userEmail}</div>
                          <div className="text-sm text-gray-500">{booking.userPhone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.bookingDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.passengers} kişi
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {booking.status === 'confirmed' ? 'Onaylandı' :
                             booking.status === 'cancelled' ? 'İptal' : 'Tamamlandı'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBookingsModal(false)}
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

export default Transfers;