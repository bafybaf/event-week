import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentsApi, eventsApi, usersApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface Appointment {
  id: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  speakerId: string;
  speakerName: string;
  speakerEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // dakika
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  meetingType: 'in-person' | 'video' | 'phone';
  location?: string;
  meetingLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: number;
  name: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const Appointments: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterEvent, setFilterEvent] = useState<string>('');

  const [newAppointment, setNewAppointment] = useState<Partial<Appointment & { eventId: string; requestedUserId: string; requesterId: string }>>({
    title: '',
    description: '',
    requesterId: currentUser?.id || '',
    requesterName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
    requesterEmail: currentUser?.email || '',
    speakerId: '',
    speakerName: '',
    speakerEmail: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 30,
    status: 'pending',
    meetingType: 'in-person',
    location: '',
    meetingLink: '',
    notes: '',
    eventId: '',
    requestedUserId: ''
  });

  useEffect(() => {
    fetchEvents();
    loadAppointments();
  }, []);

  useEffect(() => {
    if (filterEvent) {
      loadAppointments();
      loadUsers(filterEvent);
    } else if (events.length > 0) {
      // İlk etkinlik için kullanıcıları yükle (modal açıldığında göstermek için)
      loadUsers(String(events[0].id));
    }
  }, [filterEvent, events.length]);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents((data.events || data) || []);
      if (events.length === 0 && (data.events || data).length > 0) {
        const firstEvent = (data.events || data)[0];
        setFilterEvent(String(firstEvent.id));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const loadUsers = async (eventId: string) => {
    try {
      const response = await usersApi.getUsers();
      const usersData = response.users || response || [];
      // Filter users by event if possible, otherwise show all
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const eventId = filterEvent || undefined;
      const appointmentsData = await appointmentsApi.getAppointments(eventId);
      const appointmentsList = Array.isArray(appointmentsData) ? appointmentsData : [];
      
      const formattedAppointments: Appointment[] = appointmentsList.map((apt: any) => ({
        id: apt.id?.toString() || String(apt.id),
        title: apt.title || 'Randevu',
        description: apt.description || '',
        requesterId: apt.requesterId || apt.requester?.id || '',
        requesterName: apt.requester ? `${apt.requester.firstName} ${apt.requester.lastName}` : apt.requesterName || 'Bilinmeyen Kullanıcı',
        requesterEmail: apt.requester?.email || apt.requesterEmail || '',
        speakerId: apt.requestedUserId || apt.requestedUser?.id || '',
        speakerName: apt.requestedUser ? `${apt.requestedUser.firstName} ${apt.requestedUser.lastName}` : apt.speakerName || 'Bilinmeyen Konuşmacı',
        speakerEmail: apt.requestedUser?.email || apt.speakerEmail || '',
        date: apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().split('T')[0] : '',
        startTime: apt.appointmentDate ? new Date(apt.appointmentDate).toTimeString().slice(0, 5) : '',
        endTime: apt.appointmentDate && apt.duration ? 
          new Date(new Date(apt.appointmentDate).getTime() + apt.duration * 60000).toTimeString().slice(0, 5) : '',
        duration: apt.duration || 30,
        status: apt.status === 'accepted' ? 'approved' : (apt.status === 'rejected' ? 'rejected' : (apt.status === 'cancelled' ? 'cancelled' : (apt.status === 'completed' ? 'completed' : 'pending'))),
        meetingType: apt.meetingType || 'in-person',
        location: apt.location || '',
        meetingLink: apt.meetingLink || '',
        notes: apt.notes || '',
        createdAt: apt.createdAt ? new Date(apt.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        updatedAt: apt.updatedAt ? new Date(apt.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
      
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Randevular yüklenirken hata oluştu');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Remove mock data useEffect
  /*
  useEffect(() => {
    // Mock data - gerçek uygulamada API'den gelecek
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        title: 'React Native Hakkında Sohbet',
        description: 'React Native geliştirme konusunda deneyim paylaşımı',
        requesterId: 'user1',
        requesterName: 'Mehmet Kaya',
        requesterEmail: 'mehmet.kaya@email.com',
        speakerId: 'speaker1',
        speakerName: 'Dr. Jane Smith',
        speakerEmail: 'jane.smith@innovationlabs.com',
        date: '2024-01-20',
        startTime: '14:00',
        endTime: '14:30',
        duration: 30,
        status: 'approved',
        meetingType: 'video',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'React Native konusunda deneyimli',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-16'
      },
      {
        id: '2',
        title: 'Product Management Stratejileri',
        description: 'Ürün yönetimi konusunda danışmanlık',
        requesterId: 'user2',
        requesterName: 'Ayşe Demir',
        requesterEmail: 'ayse.demir@email.com',
        speakerId: 'speaker2',
        speakerName: 'Ahmet Yılmaz',
        speakerEmail: 'ahmet.yilmaz@techcorp.com',
        date: '2024-01-22',
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        status: 'pending',
        meetingType: 'in-person',
        location: 'Konferans Salonu A',
        notes: 'Strateji konusunda uzman',
        createdAt: '2024-01-18',
        updatedAt: '2024-01-18'
      },
      {
        id: '3',
        title: 'UX Design Workshop',
        description: 'Kullanıcı deneyimi tasarımı workshopu',
        requesterId: 'user3',
        requesterName: 'Ali Veli',
        requesterEmail: 'ali.veli@email.com',
        speakerId: 'speaker3',
        speakerName: 'Ayşe Demir',
        speakerEmail: 'ayse.demir@designstudio.com',
        date: '2024-01-25',
        startTime: '15:00',
        endTime: '16:30',
        duration: 90,
        status: 'completed',
        meetingType: 'in-person',
        location: 'Workshop Salonu B',
        notes: 'UX konusunda deneyimli',
        createdAt: '2024-01-20',
        updatedAt: '2024-01-25'
      }
    ];
    setAppointments(mockAppointments);
  }, []);
  */

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.speakerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || appointment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getMeetingTypeText = (type: string) => {
    switch (type) {
      case 'in-person': return 'Yüz Yüze';
      case 'video': return 'Video Görüşme';
      case 'phone': return 'Telefon';
      default: return 'Bilinmiyor';
    }
  };

  const handleAddAppointment = async () => {
    if (!newAppointment.title || !newAppointment.date || !newAppointment.startTime || !newAppointment.endTime) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }
    if (!newAppointment.eventId) {
      toast.error('Lütfen bir etkinlik seçin');
      return;
    }
    if (!newAppointment.requestedUserId) {
      toast.error('Lütfen bir kullanıcı seçin');
      return;
    }

    try {
      // Calculate duration from start and end time
      const startDateTime = new Date(`${newAppointment.date}T${newAppointment.startTime}`);
      const endDateTime = new Date(`${newAppointment.date}T${newAppointment.endTime}`);
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

      // Combine date and time for appointmentDate
      const appointmentDate = new Date(`${newAppointment.date}T${newAppointment.startTime}`);

      const payload = {
        eventId: newAppointment.eventId,
        requestedUserId: newAppointment.requestedUserId,
        title: newAppointment.title,
        description: newAppointment.description || '',
        appointmentDate: appointmentDate.toISOString(),
        duration: durationMinutes || 30,
        location: newAppointment.location || '',
        type: 'one_on_one',
        maxParticipants: 2,
        notes: newAppointment.notes || ''
      };

      const created = await appointmentsApi.createAppointment(payload);
      
      // Reload appointments
      await loadAppointments();
      
      setNewAppointment({
        title: '',
        description: '',
        requesterId: currentUser?.id || '',
        requesterName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
        requesterEmail: currentUser?.email || '',
        speakerId: '',
        speakerName: '',
        speakerEmail: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: 30,
        status: 'pending',
        meetingType: 'in-person',
        location: '',
        meetingLink: '',
        notes: '',
        eventId: filterEvent || '',
        requestedUserId: ''
      });
      setShowAddModal(false);
      toast.success('Randevu başarıyla oluşturuldu ve kullanıcıya bildirim gönderildi');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(error.message || 'Randevu oluşturulurken hata oluştu');
    }
  };

  const handleEditAppointment = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    
    // Load appointment details from API to get full data including eventId
    try {
      const fullAppointment = await appointmentsApi.getAppointment(appointment.id);
      const appointmentEventId = fullAppointment.eventId || fullAppointment.appointment?.eventId || fullAppointment.event?.id;
      
      if (appointmentEventId) {
        await loadUsers(String(appointmentEventId));
      } else if (events.length > 0) {
        // Etkinlik yoksa ilk etkinliği yükle
        await loadUsers(String(events[0].id));
      }
      
      setNewAppointment({
        ...appointment,
        eventId: appointmentEventId ? String(appointmentEventId) : (events.length > 0 ? String(events[0].id) : ''),
        requestedUserId: fullAppointment.requestedUserId || fullAppointment.appointment?.requestedUserId || '',
        requesterId: fullAppointment.requesterId || fullAppointment.appointment?.requesterId || appointment.requesterId || currentUser?.id || '',
        requesterName: fullAppointment.requester ? `${fullAppointment.requester.firstName} ${fullAppointment.requester.lastName}` : appointment.requesterName || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''),
        requesterEmail: fullAppointment.requester?.email || appointment.requesterEmail || currentUser?.email || ''
      });
    } catch (error) {
      console.error('Error loading appointment details:', error);
      // Etkinlik yoksa yine de kullanıcıları yükle
      if (events.length > 0) {
        await loadUsers(String(events[0].id));
      }
      setNewAppointment(appointment);
    }
    
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment || !newAppointment.title || !newAppointment.date || !newAppointment.startTime || !newAppointment.endTime) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }
    if (!newAppointment.eventId) {
      toast.error('Lütfen bir etkinlik seçin');
      return;
    }
    if (!newAppointment.requestedUserId) {
      toast.error('Lütfen bir kullanıcı seçin');
      return;
    }

    try {
      // Calculate duration from start and end time
      const startDateTime = new Date(`${newAppointment.date}T${newAppointment.startTime}`);
      const endDateTime = new Date(`${newAppointment.date}T${newAppointment.endTime}`);
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

      // Combine date and time for appointmentDate
      const appointmentDate = new Date(`${newAppointment.date}T${newAppointment.startTime}`);

      const payload = {
        eventId: newAppointment.eventId,
        requesterId: newAppointment.requesterId || currentUser?.id,
        requestedUserId: newAppointment.requestedUserId,
        title: newAppointment.title,
        description: newAppointment.description || '',
        appointmentDate: appointmentDate.toISOString(),
        duration: durationMinutes || 30,
        location: newAppointment.location || '',
        type: 'one_on_one',
        maxParticipants: 2,
        notes: newAppointment.notes || ''
      };

      await appointmentsApi.updateAppointment(selectedAppointment.id, payload);
      
      // Reload appointments
      await loadAppointments();
      
      setShowEditModal(false);
      setSelectedAppointment(null);
      toast.success('Randevu başarıyla güncellendi');
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast.error(error.message || 'Randevu güncellenirken hata oluştu');
    }
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (window.confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
      setAppointments(appointments.filter(appointment => appointment.id !== appointmentId));
      toast.success('Randevu başarıyla silindi');
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleChangeStatus = async (appointmentId: string, newStatus: string) => {
    try {
      // Backend'de status mapping: frontend 'approved' -> backend 'accepted'
      const backendStatus = newStatus === 'approved' ? 'accepted' : 
                           newStatus === 'rejected' ? 'rejected' : 
                           newStatus === 'cancelled' ? 'cancelled' : 
                           newStatus === 'completed' ? 'completed' : 
                           'pending';
      
      // Backend'e status güncellemesi gönder
      await appointmentsApi.updateAppointment(appointmentId, { status: backendStatus });
      
      // Randevuları yeniden yükle
      await loadAppointments();
      
      toast.success('Randevu durumu başarıyla güncellendi');
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      toast.error(error.message || 'Randevu durumu güncellenirken hata oluştu');
    }
  };

  return (
    <div className="space-y-6 [&>*:first-child]:mt-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Randevu Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Randevuları görüntüleyin ve yönetin
          </p>
        </div>
        <button
          onClick={async () => {
            // Modal açılırken kullanıcıları yükle
            if (filterEvent) {
              await loadUsers(filterEvent);
            } else if (events.length > 0) {
              await loadUsers(String(events[0].id));
            }
            setNewAppointment({
              ...newAppointment,
              requesterId: currentUser?.id || '',
              requesterName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
              requesterEmail: currentUser?.email || '',
              eventId: filterEvent || ''
            });
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Yeni Randevu
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Randevu ara..."
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
            <option value="pending">Beklemede</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
      </div>

      {/* Randevu Listesi */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Randevu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Katılımcılar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih & Saat
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
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{appointment.title}</div>
                      <div className="text-sm text-gray-500">{getMeetingTypeText(appointment.meetingType)}</div>
                      {appointment.location && (
                        <div className="text-sm text-gray-500">{appointment.location}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <div className="text-xs font-medium text-gray-500 uppercase">Katılımcı (Talep Eden)</div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Mobil
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{appointment.requesterName || 'Bilinmeyen Kullanıcı'}</div>
                        {appointment.requesterEmail && (
                          <div className="text-xs text-gray-500">{appointment.requesterEmail}</div>
                        )}
                        {appointment.requesterId && (
                          <div className="text-xs text-gray-400 mt-1">ID: {appointment.requesterId}</div>
                        )}
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="text-xs font-medium text-gray-500 uppercase">Konuşmacı</div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{appointment.speakerName || 'Bilinmeyen Konuşmacı'}</div>
                        {appointment.speakerEmail && (
                          <div className="text-xs text-gray-500">{appointment.speakerEmail}</div>
                        )}
                        {appointment.speakerId && (
                          <div className="text-xs text-gray-400 mt-1">ID: {appointment.speakerId}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {appointment.date}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {appointment.startTime} - {appointment.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1">{getStatusText(appointment.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(appointment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Detayları Görüntüle"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditAppointment(appointment)}
                        className="text-green-600 hover:text-green-900"
                        title="Düzenle"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {appointment.status === 'pending' && (
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => handleChangeStatus(appointment.id, 'approved')}
                          className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => handleChangeStatus(appointment.id, 'rejected')}
                          className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                        >
                          Reddet
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Randevu Ekleme Modal */}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Randevu Oluştur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Randevu Başlığı *</label>
                  <input
                    type="text"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    value={newAppointment.description}
                    onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Talep Eden *</label>
                  <select
                    value={newAppointment.requesterId || currentUser?.id || ''}
                    onChange={(e) => {
                      const selectedRequesterId = e.target.value;
                      const selectedRequester = users.find(u => String(u.id) === selectedRequesterId);
                      if (!selectedRequester && currentUser && selectedRequesterId === currentUser.id) {
                        // Current user seçildi
                        setNewAppointment({ 
                          ...newAppointment, 
                          requesterId: currentUser.id,
                          requesterName: `${currentUser.firstName} ${currentUser.lastName}`,
                          requesterEmail: currentUser.email || ''
                        });
                      } else if (selectedRequester) {
                        setNewAppointment({ 
                          ...newAppointment, 
                          requesterId: selectedRequesterId,
                          requesterName: `${selectedRequester.firstName} ${selectedRequester.lastName}`,
                          requesterEmail: selectedRequester.email || ''
                        });
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currentUser && (
                      <option value={currentUser.id}>
                        {currentUser.firstName} {currentUser.lastName} ({currentUser.email}) - [Mevcut Kullanıcı]
                      </option>
                    )}
                    {users.filter(u => !currentUser || String(u.id) !== currentUser.id).map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                    {(!currentUser && users.length === 0) && (
                      <option value="">Önce etkinlik seçin</option>
                    )}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Randevuyu talep eden kullanıcıyı seçin</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik *</label>
                  <select
                    value={newAppointment.eventId}
                    onChange={(e) => {
                      const selectedEventId = e.target.value;
                      setNewAppointment({ ...newAppointment, eventId: selectedEventId });
                      if (selectedEventId) {
                        loadUsers(selectedEventId);
                      }
                    }}
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
                  <label className="block text-sm font-medium text-gray-700">Kullanıcı (Randevu Alacak) *</label>
                  <select
                    value={newAppointment.requestedUserId}
                    onChange={(e) => {
                      const selectedUserId = e.target.value;
                      const selectedUser = users.find(u => String(u.id) === selectedUserId);
                      setNewAppointment({ 
                        ...newAppointment, 
                        requestedUserId: selectedUserId,
                        speakerName: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : '',
                        speakerEmail: selectedUser?.email || ''
                      });
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!newAppointment.eventId || users.length === 0}
                  >
                    <option value="">
                      {!newAppointment.eventId ? 'Önce etkinlik seçin' : users.length === 0 ? 'Kullanıcı bulunamadı' : 'Kullanıcı Seçin'}
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tarih *</label>
                    <input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Başlangıç Saati *</label>
                    <input
                      type="time"
                      value={newAppointment.startTime}
                      onChange={(e) => setNewAppointment({ ...newAppointment, startTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bitiş Saati *</label>
                    <input
                      type="time"
                      value={newAppointment.endTime}
                      onChange={(e) => setNewAppointment({ ...newAppointment, endTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Görüşme Tipi</label>
                    <select
                      value={newAppointment.meetingType}
                      onChange={(e) => setNewAppointment({ ...newAppointment, meetingType: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="in-person">Yüz Yüze</option>
                      <option value="video">Video Görüşme</option>
                      <option value="phone">Telefon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <select
                      value={newAppointment.status}
                      onChange={(e) => setNewAppointment({ ...newAppointment, status: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Beklemede</option>
                      <option value="approved">Onaylandı</option>
                      <option value="rejected">Reddedildi</option>
                    </select>
                  </div>
                </div>

                {newAppointment.meetingType === 'in-person' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Konum</label>
                    <input
                      type="text"
                      value={newAppointment.location}
                      onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {newAppointment.meetingType === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Toplantı Linki</label>
                    <input
                      type="url"
                      value={newAppointment.meetingLink}
                      onChange={(e) => setNewAppointment({ ...newAppointment, meetingLink: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notlar</label>
                  <textarea
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  onClick={handleAddAppointment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Randevu Detayları Modal */}
      {showDetailsModal && selectedAppointment && (
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Randevu Detayları</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Başlık</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                      {getStatusIcon(selectedAppointment.status)}
                      <span className="ml-1">{getStatusText(selectedAppointment.status)}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Katılımcılar</label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs font-medium text-gray-500 uppercase">Katılımcı (Talep Eden)</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Mobil Kullanıcı
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedAppointment.requesterName || 'Bilinmeyen Kullanıcı'}</p>
                      {selectedAppointment.requesterEmail && (
                        <p className="text-xs text-gray-500 mt-1">{selectedAppointment.requesterEmail}</p>
                      )}
                      {selectedAppointment.requesterId && (
                        <p className="text-xs text-gray-400 mt-1">Kullanıcı ID: {selectedAppointment.requesterId}</p>
                      )}
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">Konuşmacı</div>
                      <p className="text-sm font-medium text-gray-900">{selectedAppointment.speakerName || 'Bilinmeyen Konuşmacı'}</p>
                      {selectedAppointment.speakerEmail && (
                        <p className="text-xs text-gray-500 mt-1">{selectedAppointment.speakerEmail}</p>
                      )}
                      {selectedAppointment.speakerId && (
                        <p className="text-xs text-gray-400 mt-1">Kullanıcı ID: {selectedAppointment.speakerId}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tarih</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Başlangıç</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.startTime}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bitiş</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.endTime}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Görüşme Tipi</label>
                    <p className="mt-1 text-sm text-gray-900">{getMeetingTypeText(selectedAppointment.meetingType)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Süre</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.duration} dakika</p>
                  </div>
                </div>

                {selectedAppointment.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Konum</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.location}</p>
                  </div>
                )}

                {selectedAppointment.meetingLink && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Toplantı Linki</label>
                    <a href={selectedAppointment.meetingLink} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-blue-600 hover:text-blue-800">
                      {selectedAppointment.meetingLink}
                    </a>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notlar</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>Oluşturulma: {selectedAppointment.createdAt}</div>
                  <div>Güncellenme: {selectedAppointment.updatedAt}</div>
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

      {/* Randevu Düzenleme Modal */}
      {showEditModal && selectedAppointment && (
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Randevu Düzenle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Randevu Başlığı *</label>
                  <input
                    type="text"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    value={newAppointment.description}
                    onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Talep Eden *</label>
                  <select
                    value={newAppointment.requesterId || currentUser?.id || ''}
                    onChange={(e) => {
                      const selectedRequesterId = e.target.value;
                      const selectedRequester = users.find(u => String(u.id) === selectedRequesterId);
                      if (!selectedRequester && currentUser && selectedRequesterId === currentUser.id) {
                        // Current user seçildi
                        setNewAppointment({ 
                          ...newAppointment, 
                          requesterId: currentUser.id,
                          requesterName: `${currentUser.firstName} ${currentUser.lastName}`,
                          requesterEmail: currentUser.email || ''
                        });
                      } else if (selectedRequester) {
                        setNewAppointment({ 
                          ...newAppointment, 
                          requesterId: selectedRequesterId,
                          requesterName: `${selectedRequester.firstName} ${selectedRequester.lastName}`,
                          requesterEmail: selectedRequester.email || ''
                        });
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currentUser && (
                      <option value={currentUser.id}>
                        {currentUser.firstName} {currentUser.lastName} ({currentUser.email}) - [Mevcut Kullanıcı]
                      </option>
                    )}
                    {users.filter(u => !currentUser || String(u.id) !== currentUser.id).map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                    {(!currentUser && users.length === 0) && (
                      <option value="">Önce etkinlik seçin</option>
                    )}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Randevuyu talep eden kullanıcıyı seçin</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik *</label>
                  <select
                    value={newAppointment.eventId}
                    onChange={(e) => {
                      const selectedEventId = e.target.value;
                      setNewAppointment({ ...newAppointment, eventId: selectedEventId });
                      if (selectedEventId) {
                        loadUsers(selectedEventId);
                      }
                    }}
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
                  <label className="block text-sm font-medium text-gray-700">Kullanıcı (Randevu Alacak) *</label>
                  <select
                    value={newAppointment.requestedUserId}
                    onChange={(e) => {
                      const selectedUserId = e.target.value;
                      const selectedUser = users.find(u => String(u.id) === selectedUserId);
                      setNewAppointment({ 
                        ...newAppointment, 
                        requestedUserId: selectedUserId,
                        speakerName: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : '',
                        speakerEmail: selectedUser?.email || ''
                      });
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!newAppointment.eventId || users.length === 0}
                  >
                    <option value="">
                      {!newAppointment.eventId ? 'Önce etkinlik seçin' : users.length === 0 ? 'Kullanıcı bulunamadı' : 'Kullanıcı Seçin'}
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tarih *</label>
                    <input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Başlangıç Saati *</label>
                    <input
                      type="time"
                      value={newAppointment.startTime}
                      onChange={(e) => setNewAppointment({ ...newAppointment, startTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bitiş Saati *</label>
                    <input
                      type="time"
                      value={newAppointment.endTime}
                      onChange={(e) => setNewAppointment({ ...newAppointment, endTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Görüşme Tipi</label>
                    <select
                      value={newAppointment.meetingType}
                      onChange={(e) => setNewAppointment({ ...newAppointment, meetingType: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="in-person">Yüz Yüze</option>
                      <option value="video">Video Görüşme</option>
                      <option value="phone">Telefon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <select
                      value={newAppointment.status}
                      onChange={(e) => setNewAppointment({ ...newAppointment, status: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Beklemede</option>
                      <option value="approved">Onaylandı</option>
                      <option value="rejected">Reddedildi</option>
                    </select>
                  </div>
                </div>

                {newAppointment.meetingType === 'in-person' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Konum</label>
                    <input
                      type="text"
                      value={newAppointment.location}
                      onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {newAppointment.meetingType === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Toplantı Linki</label>
                    <input
                      type="url"
                      value={newAppointment.meetingLink}
                      onChange={(e) => setNewAppointment({ ...newAppointment, meetingLink: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notlar</label>
                  <textarea
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateAppointment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;