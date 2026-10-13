import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, Mic, TrendingUp, FileText,
  BarChart3, Clock, CalendarCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, eventsApi } from '../services/api.ts';

interface Statistics {
  overall: {
    events: number;
    users: number;
    programs: number;
    speakers: number;
    appointments: number;
    votings: number;
    usersByRole?: Record<string, number>;
  };
  eventsList?: Array<{
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    isActive: boolean;
  }>;
  usersList?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    company: string;
    isActive: boolean;
    createdAt: string;
  }>;
  event: {
    event: {
      id: string;
      name: string;
      description: string;
      startDate: string;
      endDate: string;
      location: string;
      isActive: boolean;
    };
    programs: {
      total: number;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
      attendance: {
        total: number;
        capacity: number;
        rate: number;
      };
      recent: Array<{
        id: string;
        title: string;
        startTime: string;
        endTime: string;
        status: string;
        attendance: string;
      }>;
    };
    speakers: {
      total: number;
      keynote: number;
      available: number;
    };
    appointments: {
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      recent: Array<{
        id: string;
        title: string;
        appointmentDate: string;
        status: string;
        duration: number;
      }>;
    };
    voting: {
      total: number;
    };
    users: {
      total: number;
    };
  } | null;
}

interface Event {
  id: number;
  name: string;
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      // İlk etkinliği otomatik seç
      setSelectedEventId(String(events[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]); // Events değiştiğinde ilk etkinliği seç

  useEffect(() => {
    if (selectedEventId) {
      fetchStatistics(selectedEventId);
      } else {
      fetchStatistics();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      const eventsList = data.events || data || [];
      setEvents(Array.isArray(eventsList) ? eventsList : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Etkinlikler yüklenirken hata oluştu');
    }
  };

  const fetchStatistics = async (eventId?: string) => {
    try {
      setLoading(true);
      const response = await adminApi.getStats(eventId);
      console.log('Stats response:', response);
      // API response formatını kontrol et
      if (response && (response.overall || response.event)) {
        setStats(response);
      } else if (response && response.data) {
        setStats(response.data);
      } else {
        // Veri yoksa boş bir stats objesi oluştur
        setStats({
          overall: {
            events: 0,
            users: 0,
            programs: 0,
            speakers: 0,
            appointments: 0,
            votings: 0
          },
          event: null
        });
      }
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'İstatistikler yüklenirken hata oluştu');
      // Hata durumunda da boş stats göster
      setStats({
        overall: {
          events: 0,
          users: 0,
          programs: 0,
          speakers: 0,
          appointments: 0,
          votings: 0
        },
        event: null
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      upcoming: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      scheduled: 'Planlandı',
      ongoing: 'Devam Ediyor',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
      pending: 'Beklemede',
      accepted: 'Kabul Edildi',
      rejected: 'Reddedildi',
      upcoming: 'Yaklaşan'
    };
    return texts[status] || status;
  };

  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      session: 'Oturum',
      break: 'Ara',
      meal: 'Yemek',
      activity: 'Aktivite',
      presentation: 'Sunum',
      workshop: 'Atölye',
      networking: 'Networking',
      one_on_one: 'Bire Bir',
      group: 'Grup',
      mentoring: 'Mentorluk',
      business: 'İş Görüşmesi'
    };
    return texts[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overall = stats?.overall;
  const eventStats = stats?.event || null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Raporlar ve İstatistikler</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Etkinlikler</option>
            {events.map(event => (
              <option key={event.id} value={String(event.id)}>{event.name}</option>
            ))}
          </select>
          <button
            onClick={() => fetchStatistics(selectedEventId || undefined)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <BarChart3 className="w-5 h-5" />
            Yenile
          </button>
        </div>
      </div>

      {/* Event Info Card */}
      {eventStats && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-2">{eventStats.event.name}</h2>
          <p className="text-blue-100 mb-4">{eventStats.event.description || 'Açıklama bulunmamaktadır'}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-sm text-blue-100">Başlangıç</p>
              <p className="font-semibold">
                {eventStats.event.startDate ? new Date(eventStats.event.startDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
              </p>
                        </div>
            <div>
              <p className="text-sm text-blue-100">Bitiş</p>
              <p className="font-semibold">
                {eventStats.event.endDate ? new Date(eventStats.event.endDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
              </p>
                      </div>
            <div>
              <p className="text-sm text-blue-100">Konum</p>
              <p className="font-semibold">{eventStats.event.location || 'Belirtilmemiş'}</p>
                      </div>
            <div>
              <p className="text-sm text-blue-100">Durum</p>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                eventStats.event.isActive ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {eventStats.event.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                    </div>
                    </div>
        </div>
      )}

      {/* Overall Statistics Cards */}
      {overall && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Etkinlikler</p>
                <p className="text-3xl font-bold text-gray-900">{overall.events}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
              </div>
              
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Kullanıcılar</p>
                <p className="text-3xl font-bold text-gray-900">{overall.users}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
              </div>
              
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Programlar</p>
                <p className="text-3xl font-bold text-gray-900">{overall.programs}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </div>
              </div>
              
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Konuşmacılar</p>
                <p className="text-3xl font-bold text-gray-900">{overall.speakers}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Mic className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
              </div>
              
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Randevular</p>
                <p className="text-3xl font-bold text-gray-900">{overall.appointments}</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-lg">
                <CalendarCheck className="w-8 h-8 text-pink-600" />
              </div>
              </div>
            </div>
            
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Oylamalar</p>
                <p className="text-3xl font-bold text-gray-900">{overall.votings}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event-Specific Statistics */}
      {eventStats && (
        <>
          {/* Program Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Program İstatistikleri
              </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Toplam Program</span>
                  <span className="text-2xl font-bold text-gray-900">{eventStats.programs.total}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Katılım Oranı</p>
                    <p className="text-xl font-bold text-blue-600">{eventStats.programs.attendance.rate}%</p>
                    <p className="text-xs text-gray-500">
                      {eventStats.programs.attendance.total} / {eventStats.programs.attendance.capacity}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Mevcut Kapasite</p>
                    <p className="text-xl font-bold text-green-600">{eventStats.programs.attendance.capacity}</p>
                    <p className="text-xs text-gray-500">Toplam kapasite</p>
              </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Program Türlerine Göre</p>
                  <div className="space-y-2">
                    {Object.entries(eventStats.programs.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-gray-600">{getTypeText(type)}</span>
                        <span className="font-semibold text-gray-900">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Durumlara Göre</p>
                  <div className="space-y-2">
                    {Object.entries(eventStats.programs.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                  </span>
                        <span className="font-semibold text-gray-900">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
              
            {/* Speaker Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mic className="w-6 h-6 text-yellow-600" />
                Konuşmacı İstatistikleri
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Toplam Konuşmacı</span>
                  <span className="text-2xl font-bold text-gray-900">{eventStats.speakers.total}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Ana Konuşmacı</p>
                    <p className="text-xl font-bold text-yellow-600">{eventStats.speakers.keynote}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Müsait Konuşmacı</p>
                    <p className="text-xl font-bold text-green-600">{eventStats.speakers.available}</p>
                  </div>
                </div>
              </div>
            </div>
              </div>
              
          {/* Appointments Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-pink-600" />
                Randevu İstatistikleri
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Toplam Randevu</span>
                  <span className="text-2xl font-bold text-gray-900">{eventStats.appointments.total}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Durumlara Göre</p>
                  <div className="space-y-2">
                    {Object.entries(eventStats.appointments.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                        <span className="font-semibold text-gray-900">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Türlere Göre</p>
                  <div className="space-y-2">
                    {Object.entries(eventStats.appointments.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-gray-600">{getTypeText(type)}</span>
                        <span className="font-semibold text-gray-900">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Voting Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                Oylama İstatistikleri
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Toplam Oylama</span>
                  <span className="text-2xl font-bold text-gray-900">{eventStats.voting.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Programs */}
          {eventStats.programs.recent.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                Son Eklenen Programlar
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlangıç</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bitiş</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Katılım</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eventStats.programs.recent.map((program) => (
                      <tr key={program.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{program.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(program.startTime).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(program.endTime).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(program.status)}`}>
                            {getStatusText(program.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{program.attendance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Appointments */}
          {eventStats.appointments.recent.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-pink-600" />
                Son Randevular
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Süre (dk)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eventStats.appointments.recent.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{appointment.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(appointment.appointmentDate).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{appointment.duration}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Users by Role */}
      {overall && overall.usersByRole && Object.keys(overall.usersByRole).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            Kullanıcılar Rol Dağılımı
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(overall.usersByRole).map(([role, count]) => (
              <div key={role} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  {role === 'admin' ? 'Yönetici' : 
                   role === 'organizer' ? 'Organizatör' : 
                   role === 'speaker' ? 'Konuşmacı' : 
                   role === 'participant' ? 'Katılımcı' : role}
                </p>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events List */}
      {stats?.eventsList && stats.eventsList.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Etkinlikler
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etkinlik Adı</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlangıç</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bitiş</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.eventsList.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {event.startDate ? new Date(event.startDate).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {event.endDate ? new Date(event.endDate).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{event.location || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users List */}
      {stats?.usersList && stats.usersList.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            Katılımcılar ve Kullanıcılar
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-posta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Şirket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.usersList.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.phoneNumber || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {user.role === 'admin' ? 'Yönetici' : 
                         user.role === 'organizer' ? 'Organizatör' : 
                         user.role === 'speaker' ? 'Konuşmacı' : 
                         user.role === 'participant' ? 'Katılımcı' : user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.company || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {overall && overall.events === 0 && overall.users === 0 && overall.programs === 0 && overall.speakers === 0 && overall.appointments === 0 && overall.votings === 0 && !eventStats && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Henüz istatistik verisi bulunmamaktadır.</p>
          <p className="text-sm text-gray-500 mt-2">Bir etkinlik seçin veya veri ekleyin.</p>
        </div>
      )}

      {!stats && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">İstatistikler yüklenemedi.</p>
          <p className="text-sm text-gray-500 mt-2">Lütfen sayfayı yenileyin veya bir etkinlik seçin.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
