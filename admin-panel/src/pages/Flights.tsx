import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, MapPin, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { flightsApi, eventsApi } from '../services/api.ts';

interface Flight {
  id: number;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft: string;
  terminal: string;
  gate: string;
  seatClass: string;
  price: number;
  status: string;
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

const Flights: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  const [newFlight, setNewFlight] = useState({
    flightNumber: '',
    airline: '',
    departureAirport: '',
    arrivalAirport: '',
    departureDate: '',
    arrivalDate: '',
    departureTime: '',
    arrivalTime: '',
    duration: '',
    aircraft: '',
    terminal: '',
    gate: '',
    seatClass: 'economy',
    price: '',
    status: 'scheduled',
    eventId: '',
    notes: ''
  });

  const flightStatuses = [
    { value: 'scheduled', label: 'Planlandı' },
    { value: 'boarding', label: 'Biniş' },
    { value: 'departed', label: 'Kalktı' },
    { value: 'arrived', label: 'İndi' },
    { value: 'delayed', label: 'Gecikmeli' },
    { value: 'cancelled', label: 'İptal' }
  ];

  const seatClasses = [
    { value: 'economy', label: 'Ekonomi' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First Class' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchFlights();
  }, [filterEvent]);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const eventId = filterEvent || undefined;
      const data = await flightsApi.getFlights(eventId);
      setFlights(data || []);
    } catch (error: any) {
      console.error('Error fetching flights:', error);
      toast.error(error.message || 'Uçuşlar yüklenirken hata oluştu');
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

  const handleAddFlight = async () => {
    // Form validasyonu
    if (!newFlight.flightNumber.trim()) {
      toast.error('Uçuş numarası zorunludur');
      return;
    }
    if (!newFlight.airline.trim()) {
      toast.error('Havayolu zorunludur');
      return;
    }
    if (!newFlight.departureAirport.trim()) {
      toast.error('Kalkış havaalanı zorunludur');
      return;
    }
    if (!newFlight.arrivalAirport.trim()) {
      toast.error('Varış havaalanı zorunludur');
      return;
    }
    if (!newFlight.departureDate) {
      toast.error('Kalkış tarihi zorunludur');
      return;
    }
    if (!newFlight.arrivalDate) {
      toast.error('Varış tarihi zorunludur');
      return;
    }
    if (!newFlight.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }

    try {
      await flightsApi.createFlight({
        ...newFlight,
        price: parseFloat(newFlight.price) || 0,
        eventId: String(newFlight.eventId)
      });
      toast.success('Uçuş başarıyla eklendi');
      setShowModal(false);
      setNewFlight({
        flightNumber: '',
        airline: '',
        departureAirport: '',
        arrivalAirport: '',
        departureDate: '',
        arrivalDate: '',
        departureTime: '',
        arrivalTime: '',
        duration: '',
        aircraft: '',
        terminal: '',
        gate: '',
        seatClass: 'economy',
        price: '',
        status: 'scheduled',
        eventId: '',
        notes: ''
      });
      fetchFlights();
    } catch (error: any) {
      console.error('Error adding flight:', error);
      toast.error(error.message || 'Uçuş eklenirken hata oluştu');
    }
  };

  const handleUpdateFlight = async () => {
    if (!selectedFlight) return;

    try {
      await flightsApi.updateFlight(String(selectedFlight.id), {
        ...newFlight,
        price: parseFloat(newFlight.price) || 0,
        eventId: String(newFlight.eventId)
      });
      toast.success('Uçuş başarıyla güncellendi');
      setShowModal(false);
      setSelectedFlight(null);
      fetchFlights();
    } catch (error: any) {
      console.error('Error updating flight:', error);
      toast.error(error.message || 'Uçuş güncellenirken hata oluştu');
    }
  };

  const handleDeleteFlight = async () => {
    if (!selectedFlight) return;

    try {
      await flightsApi.deleteFlight(String(selectedFlight.id));
      toast.success('Uçuş başarıyla silindi');
      setShowDeleteModal(false);
      setSelectedFlight(null);
      fetchFlights();
    } catch (error: any) {
      console.error('Error deleting flight:', error);
      toast.error(error.message || 'Uçuş silinirken hata oluştu');
    }
  };

  const openEditModal = (flight: Flight) => {
    setSelectedFlight(flight);
    setNewFlight({
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      departureDate: flight.departureDate.split('T')[0],
      arrivalDate: flight.arrivalDate.split('T')[0],
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      aircraft: flight.aircraft,
      terminal: flight.terminal,
      gate: flight.gate,
      seatClass: flight.seatClass,
      price: flight.price.toString(),
      status: flight.status,
      eventId: flight.eventId.toString(),
      notes: ''
    });
    setShowModal(true);
  };

  const openViewModal = (flight: Flight) => {
    setSelectedFlight(flight);
    setShowViewModal(true);
  };

  const openDeleteModal = (flight: Flight) => {
    setSelectedFlight(flight);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'boarding': return 'bg-yellow-100 text-yellow-800';
      case 'departed': return 'bg-green-100 text-green-800';
      case 'arrived': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return flightStatuses.find(s => s.value === status)?.label || status;
  };

  const filteredFlights = flights.filter(flight => {
    const matchesSearch = flight.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flight.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flight.departureAirport.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flight.arrivalAirport.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || flight.status === filterStatus;
    const matchesEvent = !filterEvent || flight.eventId.toString() === filterEvent;
    
    return matchesSearch && matchesStatus && matchesEvent;
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
        <h1 className="text-3xl font-bold text-gray-900">Uçuşlar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Uçuş
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Uçuş ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Durumlar</option>
            {flightStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
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
              setFilterStatus('');
              setFilterEvent('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Temizle
          </button>
        </div>
      </div>

      {/* Flights Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uçuş
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih & Saat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uçak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sınıf
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
              {filteredFlights.map((flight) => (
                <tr key={flight.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{flight.airline}</div>
                      <div className="text-sm text-gray-500">{flight.flightNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{flight.departureAirport}</div>
                        <div className="text-sm text-gray-500">→ {flight.arrivalAirport}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(flight.departureDate).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {flight.departureTime} - {flight.arrivalTime}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{flight.aircraft}</div>
                      {flight.terminal && (
                        <div className="text-sm text-gray-500">T{flight.terminal}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {seatClasses.find(s => s.value === flight.seatClass)?.label || flight.seatClass}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flight.price} ₺
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(flight.status)}`}>
                      {getStatusText(flight.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(flight)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(flight)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(flight)}
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
              {selectedFlight ? 'Uçuş Düzenle' : 'Yeni Uçuş Ekle'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uçuş Numarası *</label>
                <input
                  type="text"
                  value={newFlight.flightNumber}
                  onChange={(e) => setNewFlight({...newFlight, flightNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Havayolu *</label>
                <input
                  type="text"
                  value={newFlight.airline}
                  onChange={(e) => setNewFlight({...newFlight, airline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kalkış Havaalanı *</label>
                <input
                  type="text"
                  value={newFlight.departureAirport}
                  onChange={(e) => setNewFlight({...newFlight, departureAirport: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Varış Havaalanı *</label>
                <input
                  type="text"
                  value={newFlight.arrivalAirport}
                  onChange={(e) => setNewFlight({...newFlight, arrivalAirport: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kalkış Tarihi *</label>
                <input
                  type="date"
                  value={newFlight.departureDate}
                  onChange={(e) => setNewFlight({...newFlight, departureDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Varış Tarihi *</label>
                <input
                  type="date"
                  value={newFlight.arrivalDate}
                  onChange={(e) => setNewFlight({...newFlight, arrivalDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kalkış Saati *</label>
                <input
                  type="time"
                  value={newFlight.departureTime}
                  onChange={(e) => setNewFlight({...newFlight, departureTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Varış Saati *</label>
                <input
                  type="time"
                  value={newFlight.arrivalTime}
                  onChange={(e) => setNewFlight({...newFlight, arrivalTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Süre</label>
                <input
                  type="text"
                  value={newFlight.duration}
                  onChange={(e) => setNewFlight({...newFlight, duration: e.target.value})}
                  placeholder="2h 30m"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uçak</label>
                <input
                  type="text"
                  value={newFlight.aircraft}
                  onChange={(e) => setNewFlight({...newFlight, aircraft: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terminal</label>
                <input
                  type="text"
                  value={newFlight.terminal}
                  onChange={(e) => setNewFlight({...newFlight, terminal: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapı</label>
                <input
                  type="text"
                  value={newFlight.gate}
                  onChange={(e) => setNewFlight({...newFlight, gate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Koltuk Sınıfı</label>
                <select
                  value={newFlight.seatClass}
                  onChange={(e) => setNewFlight({...newFlight, seatClass: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {seatClasses.map(seat => (
                    <option key={seat.value} value={seat.value}>{seat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newFlight.price}
                  onChange={(e) => setNewFlight({...newFlight, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select
                  value={newFlight.status}
                  onChange={(e) => setNewFlight({...newFlight, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {flightStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik *</label>
                <select
                  value={newFlight.eventId}
                  onChange={(e) => setNewFlight({...newFlight, eventId: e.target.value})}
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
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFlight(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={selectedFlight ? handleUpdateFlight : handleAddFlight}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedFlight ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedFlight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Uçuş Detayları</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Havayolu</label>
                  <p className="text-lg font-semibold">{selectedFlight.airline}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Uçuş Numarası</label>
                  <p className="text-lg font-semibold">{selectedFlight.flightNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kalkış</label>
                  <p className="text-gray-900">{selectedFlight.departureAirport}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Varış</label>
                  <p className="text-gray-900">{selectedFlight.arrivalAirport}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kalkış Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedFlight.departureDate).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Varış Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedFlight.arrivalDate).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kalkış Saati</label>
                  <p className="text-gray-900">{selectedFlight.departureTime}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Varış Saati</label>
                  <p className="text-gray-900">{selectedFlight.arrivalTime}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Uçak</label>
                  <p className="text-gray-900">{selectedFlight.aircraft}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Koltuk Sınıfı</label>
                  <p className="text-gray-900">{seatClasses.find(s => s.value === selectedFlight.seatClass)?.label}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Terminal</label>
                  <p className="text-gray-900">{selectedFlight.terminal || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kapı</label>
                  <p className="text-gray-900">{selectedFlight.gate || 'Belirtilmemiş'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fiyat</label>
                  <p className="text-gray-900">{selectedFlight.price} ₺</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Durum</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedFlight.status)}`}>
                    {getStatusText(selectedFlight.status)}
                  </span>
                </div>
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
      {showDeleteModal && selectedFlight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Uçuş Sil</h2>
            <p className="text-gray-600 mb-6">
              "{selectedFlight.airline} {selectedFlight.flightNumber}" uçuşunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteFlight}
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

export default Flights;