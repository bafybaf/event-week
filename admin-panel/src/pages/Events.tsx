import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  MapPin,
  Clock,
  Users,
  Image as ImageIcon,
  Film
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { eventsApi } from '../services/api.ts';
import { API_ORIGIN, fileUrl } from '../config.ts';

interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'draft' | 'published' | 'active' | 'archived' | 'cancelled';
  maxParticipants?: number;
  currentParticipants: number;
  registrationDeadline?: string;
  isRegistrationOpen: boolean;
  organizerId: string;
  coverImage?: string;
  logo?: string;
  introVideoUrl?: string;
  introVideoFileName?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  company?: string;
  isActive: boolean;
  createdAt: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Event['status'] | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    address: '',
    city: '',
    country: '',
    status: 'draft',
    maxParticipants: undefined,
    registrationDeadline: '',
      isRegistrationOpen: true,
    website: '',
    contactEmail: '',
    contactPhone: '',
    logo: '',
    introVideoUrl: '',
    introVideoFileName: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingIntroVideo, setUploadingIntroVideo] = useState(false);


  const getVideoHref = fileUrl;

  const emptyEventForm = (): Partial<Event> => ({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    address: '',
    city: '',
    country: '',
    status: 'draft',
    maxParticipants: undefined,
    registrationDeadline: '',
    isRegistrationOpen: true,
    website: '',
    contactEmail: '',
    contactPhone: '',
    logo: '',
    introVideoUrl: '',
    introVideoFileName: '',
  });

  const handleLogoUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece görsel yükleyebilirsiniz (PNG, JPG, SVG, WEBP)');
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ORIGIN}/api/upload/event-logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Logo yüklenemedi');
      }
      setNewEvent((prev) => ({
        ...prev,
        logo: result.data.url
      }));
      toast.success('Logo yüklendi');
    } catch (error: any) {
      toast.error(error.message || 'Logo yüklenirken hata oluştu');
    } finally {
      setUploadingLogo(false);
    }
  };

  const renderLogoUploadField = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik logosu</label>
      <p className="text-xs text-gray-500 mb-2">Açılış videosunda ve ana sayfa başlığında görünür.</p>
      {newEvent.logo ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-md border bg-gray-50 p-3">
            <img
              src={getVideoHref(newEvent.logo)}
              alt="Etkinlik logosu"
              className="h-16 w-16 object-contain rounded-md bg-white border"
            />
            <button
              type="button"
              className="text-sm text-red-600 hover:text-red-800"
              onClick={() => setNewEvent({ ...newEvent, logo: '' })}
            >
              Kaldır
            </button>
          </div>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 cursor-pointer text-sm text-gray-600 hover:bg-gray-50">
          <ImageIcon className="h-4 w-4" />
          {uploadingLogo ? 'Yükleniyor...' : 'Logo seçin (PNG, JPG, SVG, WEBP)'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
            className="hidden"
            disabled={uploadingLogo}
            onChange={(e) => handleLogoUpload(e.target.files?.[0])}
          />
        </label>
      )}
    </div>
  );

  const handleIntroVideoUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Sadece video yükleyebilirsiniz (MP4, WebM, MOV)');
      return;
    }

    try {
      setUploadingIntroVideo(true);
      const formData = new FormData();
      formData.append('video', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ORIGIN}/api/upload/intro-video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Video yüklenemedi');
      }
      setNewEvent((prev) => ({
        ...prev,
        introVideoUrl: result.data.url,
        introVideoFileName: result.data.fileName || file.name
      }));
      toast.success('Hoş geldiniz videosu yüklendi');
    } catch (error: any) {
      toast.error(error.message || 'Video yüklenirken hata oluştu');
    } finally {
      setUploadingIntroVideo(false);
    }
  };

  const renderIntroVideoField = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Hoş geldiniz videosu</label>
      <p className="text-xs text-gray-500 mb-2">Katılımcı girdikten sonra bu etkinliğe özel oynatılır. Boşsa Matrix açılış gösterilir.</p>
      {newEvent.introVideoUrl ? (
        <div className="space-y-2">
          <video src={getVideoHref(newEvent.introVideoUrl)} controls className="w-full max-h-48 rounded-md bg-black" />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="truncate pr-3">{newEvent.introVideoFileName || 'video'}</span>
            <button
              type="button"
              className="text-red-600 hover:text-red-800 shrink-0"
              onClick={() => setNewEvent({ ...newEvent, introVideoUrl: '', introVideoFileName: '' })}
            >
              Kaldır
            </button>
          </div>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 cursor-pointer text-sm text-gray-600 hover:bg-gray-50">
          <Film className="h-4 w-4" />
          {uploadingIntroVideo ? 'Yükleniyor...' : 'Video seçin (MP4, WebM, MOV)'}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            disabled={uploadingIntroVideo}
            onChange={(e) => handleIntroVideoUpload(e.target.files?.[0])}
          />
        </label>
      )}
    </div>
  );

  useEffect(() => {
    fetchEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await eventsApi.getEvents();
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error(error.message || 'Etkinlikler yüklenemedi');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event): event is Event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Yayında';
      case 'draft': return 'Taslak';
      case 'archived': return 'Arşivlendi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;
    
    try {
      await eventsApi.deleteEvent(eventId);
      setEvents(events.filter(event => event.id !== eventId));
      toast.success('Etkinlik başarıyla silindi');
    } catch (error: any) {
      toast.error(error.message || 'Etkinlik silinemedi');
    }
  };

  const handleToggleStatus = async (eventId: string, newStatus: string) => {
    try {
      await eventsApi.updateEvent(eventId, { status: newStatus });
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, status: newStatus as any } : event
    ));
    toast.success('Etkinlik durumu güncellendi');
    } catch (error: any) {
      toast.error(error.message || 'Etkinlik durumu güncellenemedi');
    }
  };

  const handleToggleActive = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // Aktif/Pasif durumunu status ile yönetiyoruz: published/active = aktif
    const isCurrentlyActive = event.status === 'published' || event.status === 'active';
    const newStatus = isCurrentlyActive 
      ? ('draft' as Event['status'])
      : ('published' as Event['status']);
    
    try {
      await eventsApi.updateEvent(eventId, { status: newStatus });
      setEvents(events.map(e => 
        e.id === eventId 
          ? { ...e, status: newStatus } 
          : e
      ));
      const isActive = newStatus === 'published' || newStatus === 'active';
      toast.success(isActive ? 'Etkinlik aktif hale getirildi' : 'Etkinlik pasif hale getirildi');
    } catch (error: any) {
      toast.error(error.message || 'Etkinlik durumu güncellenemedi');
    }
  };

  const handleViewEvent = async (event: Event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
    await fetchParticipants(event.id);
  };

  const fetchParticipants = async (eventId: string) => {
    try {
      setLoadingParticipants(true);
      const response = await eventsApi.getEventParticipants(eventId);
      // Sıralamaya göre sırala (createdAt'e göre)
      const sortedParticipants = (response.participants || []).sort((a: Participant, b: Participant) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB; // Eski tarih önce
      });
      setParticipants(sortedParticipants);
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      toast.error(error.message || 'Katılımcılar yüklenemedi');
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleExportParticipants = async (eventId: string) => {
    try {
      if (participants.length === 0) {
        toast.error('Dışa aktarılacak katılımcı bulunmuyor');
        return;
      }

      // Excel verisi oluştur
      const excelData = participants.map((participant, index) => ({
        'Sıra': index + 1,
        'Ad': participant.firstName,
        'Soyad': participant.lastName,
        'Email': participant.email,
        'Telefon': participant.phoneNumber || '',
        'Rol': participant.role,
        'Şirket': participant.company || '',
        'Durum': participant.isActive ? 'Aktif' : 'Pasif',
        'Kayıt Tarihi': participant.createdAt ? new Date(participant.createdAt).toLocaleDateString('tr-TR') : ''
      }));

      // Workbook oluştur - Türkçe karakter desteği için
      const ws = XLSX.utils.json_to_sheet(excelData, {
        cellDates: true,
        dateNF: 'yyyy-mm-dd',
        skipHeader: false
      });
      
      // Hücre verilerini UTF-8 olarak kodla
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          const cell = ws[cellAddress];
          if (cell.t === 's' && typeof cell.v === 'string') {
            // String değerleri UTF-8 olarak koru
            cell.v = cell.v;
          }
        }
      }
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Katılımcılar');

      // Kolon genişliklerini ayarla
      const colWidths = [
        { wch: 6 },  // Sıra
        { wch: 15 }, // Ad
        { wch: 15 }, // Soyad
        { wch: 25 }, // Email
        { wch: 15 }, // Telefon
        { wch: 12 }, // Rol
        { wch: 20 }, // Şirket
        { wch: 10 }, // Durum
        { wch: 15 }  // Kayıt Tarihi
      ];
      ws['!cols'] = colWidths;

      // Dosyayı indir - UTF-8 encoding ile
      const eventName = selectedEvent?.name || 'Etkinlik';
      // Dosya adında Türkçe karakterleri güvenli karakterlere çevir
      const safeEventName = eventName
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const fileName = `${safeEventName}_Katilimcilar_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Türkçe karakter desteği için XLSX yazma işlemi
      // XLSX kütüphanesi zaten UTF-8 kullanır, ama workbook'u doğru şekilde oluşturuyoruz
      const excelBuffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true,
        compression: true
      });
      
      // Blob oluştur ve indir (UTF-8 encoding garantisi)
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${participants.length} katılımcı Excel dosyasına aktarıldı`);
    } catch (error: any) {
      console.error('Error exporting participants:', error);
      toast.error('Excel dosyası oluşturulurken bir hata oluştu');
    }
  };

  const handleImportParticipants = async (eventId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      // Dosya uzantısını kontrol et
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        toast.error('Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)');
        return;
      }

          // Dosyayı oku
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { 
            type: 'binary',
            cellDates: false,
            cellNF: false,
            cellText: false
          });
          
          // İlk sayfayı al
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // JSON'a çevir - raw modu kullanarak sayıları string olarak al
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            defval: ''
          });
          
          if (jsonData.length === 0) {
            toast.error('Excel dosyası boş');
            return;
          }

          // Verileri dönüştür
          const participantsData = jsonData.map((row: any) => {
            // Telefon numarasını temizle - Excel'de sayı olarak saklanırsa .0 eklenmiş olabilir
            const cleanPhoneNumber = (phone: any): string => {
              if (!phone && phone !== 0) return '';
              // String'e çevir ve .0 kısmını temizle
              let phoneStr = String(phone).trim();
              // .0 ile bitiyorsa kaldır
              phoneStr = phoneStr.replace(/\.0+$/, '');
              // Ondalık kısım varsa kaldır (örn: 5551234567.0 -> 5551234567)
              if (phoneStr.includes('.') && !phoneStr.includes('+')) {
                phoneStr = phoneStr.split('.')[0];
              }
              return phoneStr;
            };

            // Türkçe ve İngilizce kolon isimlerini destekle
            const rawPhone = row['Telefon'] || row['Phone'] || row['phoneNumber'] || row['phone'] || '';
            
            return {
              firstName: row['Ad'] || row['First Name'] || row['firstName'] || row['Ad'] || '',
              lastName: row['Soyad'] || row['Last Name'] || row['lastName'] || row['Soyad'] || '',
              email: row['Email'] || row['email'] || '',
              phoneNumber: cleanPhoneNumber(rawPhone),
              role: row['Rol'] || row['Role'] || row['role'] || 'participant',
              company: row['Şirket'] || row['Company'] || row['company'] || '',
              isActive: row['Durum'] === 'Aktif' || row['Status'] === 'Active' || row['isActive'] === true || row['isActive'] === 'true' || row['Durum'] === 'Active'
            };
          }).filter((p: any) => p.email && p.firstName && p.lastName); // Boş satırları filtrele

          if (participantsData.length === 0) {
            toast.error('Geçerli katılımcı verisi bulunamadı');
            return;
          }

          // Backend'e gönder
          const response = await eventsApi.importEventParticipants(eventId, participantsData);
          
          toast.success(response.message || 'Katılımcılar başarıyla içe aktarıldı');
          
          // Katılımcıları yeniden yükle
          await fetchParticipants(eventId);
          
          // Input'u temizle
          event.target.value = '';
        } catch (error: any) {
          console.error('Error importing participants:', error);
          toast.error(error.message || 'Excel dosyası işlenirken bir hata oluştu');
        }
      };

      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error('Error reading file:', error);
      toast.error('Dosya okunurken bir hata oluştu');
    }
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setNewEvent({
      name: event.name,
      description: event.description,
      startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
      location: event.location,
      address: event.address,
      city: event.city,
      country: event.country,
      status: event.status,
      maxParticipants: event.maxParticipants,
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : '',
      isRegistrationOpen: event.isRegistrationOpen,
      website: event.website,
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      logo: event.logo || '',
      introVideoUrl: event.introVideoUrl || (event as any).intro_video_url || '',
      introVideoFileName: event.introVideoFileName || (event as any).intro_video_file_name || '',
    });
    setShowEditModal(true);
  };

  const handleAddEvent = async () => {
    if (!newEvent.name || !newEvent.startDate || !newEvent.endDate) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      const payload = {
        name: newEvent.name,
        description: newEvent.description || '',
        startDate: new Date(newEvent.startDate!).toISOString(),
        endDate: new Date(newEvent.endDate!).toISOString(),
        location: newEvent.location || '',
        address: newEvent.address || '',
        city: newEvent.city || '',
        country: newEvent.country || '',
        status: newEvent.status || 'draft',
        maxParticipants: newEvent.maxParticipants ? parseInt(String(newEvent.maxParticipants)) : undefined,
        registrationDeadline: newEvent.registrationDeadline ? new Date(newEvent.registrationDeadline!).toISOString() : undefined,
        isRegistrationOpen: newEvent.isRegistrationOpen ?? true,
        website: newEvent.website || '',
        contactEmail: newEvent.contactEmail || '',
        contactPhone: newEvent.contactPhone || '',
        logo: newEvent.logo || '',
        introVideoUrl: newEvent.introVideoUrl || '',
        introVideoFileName: newEvent.introVideoFileName || '',
      };
      const created = await eventsApi.createEvent(payload);
      setEvents([...events, created]);
      setShowAddModal(false);
      setNewEvent(emptyEventForm());
      toast.success('Etkinlik başarıyla oluşturuldu');
    } catch (error: any) {
      toast.error(error.message || 'Etkinlik oluşturulamadı');
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !newEvent.name || !newEvent.startDate || !newEvent.endDate) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      const payload = {
        name: newEvent.name,
        description: newEvent.description || '',
        startDate: new Date(newEvent.startDate!).toISOString(),
        endDate: new Date(newEvent.endDate!).toISOString(),
        location: newEvent.location || '',
        address: newEvent.address || '',
        city: newEvent.city || '',
        country: newEvent.country || '',
        status: newEvent.status || 'draft',
        maxParticipants: newEvent.maxParticipants ? parseInt(String(newEvent.maxParticipants)) : undefined,
        registrationDeadline: newEvent.registrationDeadline ? new Date(newEvent.registrationDeadline!).toISOString() : undefined,
        isRegistrationOpen: newEvent.isRegistrationOpen ?? true,
        website: newEvent.website || '',
        contactEmail: newEvent.contactEmail || '',
        contactPhone: newEvent.contactPhone || '',
        logo: newEvent.logo || '',
        introVideoUrl: newEvent.introVideoUrl || '',
        introVideoFileName: newEvent.introVideoFileName || '',
      };
      const updated = await eventsApi.updateEvent(selectedEvent.id, payload);
      setEvents(events.map(e => e.id === selectedEvent.id ? updated : e));
      setShowEditModal(false);
      setSelectedEvent(null);
      toast.success('Etkinlik başarıyla güncellendi');
    } catch (error: any) {
      toast.error(error.message || 'Etkinlik güncellenemedi');
    }
  };

  const exportEvents = () => {
    const csvContent = [
      ['Etkinlik Adı', 'Açıklama', 'Başlangıç', 'Bitiş', 'Konum', 'Durum', 'Katılımcı Sayısı'],
      ...filteredEvents.map(event => [
        event.name,
        event.description,
        formatDate(event.startDate),
        formatDate(event.endDate),
        event.location,
        getStatusText(event.status),
        `${event.currentParticipants}/${event.maxParticipants || '∞'}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'events.csv';
    link.click();
    toast.success('Etkinlik listesi dışa aktarıldı');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-8 w-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 [&>*:first-child]:mt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etkinlik Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tüm etkinlikleri görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportEvents}
            className="btn btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </button>
          <button
            onClick={() => {
              setNewEvent(emptyEventForm());
              setShowAddModal(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Etkinlik
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Toplam Etkinlik
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {events.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">Y</span>
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Yayında
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {events.filter(e => e.status === 'published').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">T</span>
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Taslak
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {events.filter(e => e.status === 'draft').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Toplam Katılımcı
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {events.reduce((sum, event) => sum + event.currentParticipants, 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arama
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Etkinlik adı, açıklama veya konum ara..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durum
            </label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Event['status'] | 'all')}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
              <option value="archived">Arşivlendi</option>
              <option value="cancelled">İptal Edildi</option>
              <option value="active">Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Etkinlik Listesi ({filteredEvents.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Etkinlik</th>
                <th>Tarih</th>
                <th>Konum</th>
                <th>Katılımcılar</th>
                <th>Aktif</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {event.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.description}
                        </div>
                        {event.website && (
                          <div className="text-xs text-blue-600">
                            {event.website}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(event.startDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Bitiş: {formatDate(event.endDate)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.city}, {event.country}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">
                      {event.currentParticipants}
                      {event.maxParticipants && ` / ${event.maxParticipants}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.isRegistrationOpen ? 'Kayıt Açık' : 'Kayıt Kapalı'}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(event.id)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                        event.status === 'published' || event.status === 'active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      title={(event.status === 'published' || event.status === 'active') ? 'Pasif yap' : 'Aktif yap'}
                    >
                      {(event.status === 'published' || event.status === 'active') ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewEvent(event)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <select
                        value={event.status}
                        onChange={(e) => handleToggleStatus(event.id, e.target.value)}
                        className="text-xs border rounded px-1 py-1"
                      >
                        <option value="draft">Taslak</option>
                        <option value="published">Yayında</option>
                        <option value="archived">Arşivle</option>
                        <option value="cancelled">İptal Et</option>
                      </select>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Event Modal */}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Etkinlik</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Adı *</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Etkinlik adını girin"
                    value={newEvent.name || ''}
                    onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea 
                    className="input" 
                    rows={3} 
                    placeholder="Etkinlik açıklaması"
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi *</label>
                    <input 
                      type="datetime-local" 
                      className="input"
                      value={newEvent.startDate || ''}
                      onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi *</label>
                    <input 
                      type="datetime-local" 
                      className="input"
                      value={newEvent.endDate || ''}
                      onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Konum"
                      value={newEvent.location || ''}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Şehir"
                      value={newEvent.city || ''}
                      onChange={(e) => setNewEvent({...newEvent, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Ülke"
                      value={newEvent.country || ''}
                      onChange={(e) => setNewEvent({...newEvent, country: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea 
                    className="input" 
                    rows={2} 
                    placeholder="Tam adres"
                    value={newEvent.address || ''}
                    onChange={(e) => setNewEvent({...newEvent, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                    <select
                      className="input"
                      value={newEvent.status || 'draft'}
                      onChange={(e) => setNewEvent({...newEvent, status: e.target.value as any})}
                    >
                      <option value="draft">Taslak</option>
                      <option value="published">Yayında</option>
                      <option value="archived">Arşivlendi</option>
                      <option value="cancelled">İptal Edildi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Katılımcı</label>
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="Maksimum katılımcı sayısı"
                      value={newEvent.maxParticipants || ''}
                      onChange={(e) => setNewEvent({...newEvent, maxParticipants: e.target.value ? parseInt(e.target.value) : undefined})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kayıt Son Tarihi</label>
                    <input 
                      type="datetime-local" 
                      className="input"
                      value={newEvent.registrationDeadline || ''}
                      onChange={(e) => setNewEvent({...newEvent, registrationDeadline: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2"
                        checked={newEvent.isRegistrationOpen ?? true}
                        onChange={(e) => setNewEvent({...newEvent, isRegistrationOpen: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Kayıt Açık</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İletişim Email</label>
                    <input 
                      type="email" 
                      className="input" 
                      placeholder="info@event.com"
                      value={newEvent.contactEmail || ''}
                      onChange={(e) => setNewEvent({...newEvent, contactEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İletişim Telefon</label>
                    <input 
                      type="tel" 
                      className="input" 
                      placeholder="+90 555 123 4567"
                      value={newEvent.contactPhone || ''}
                      onChange={(e) => setNewEvent({...newEvent, contactPhone: e.target.value})}
                    />
                  </div>
                </div>
                {renderLogoUploadField()}
                {renderIntroVideoField()}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input 
                    type="url" 
                    className="input" 
                    placeholder="https://event.com"
                    value={newEvent.website || ''}
                    onChange={(e) => setNewEvent({...newEvent, website: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEvent(emptyEventForm());
                  }}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddEvent}
                  className="btn btn-primary"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Etkinlik Düzenle</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Adı *</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Etkinlik adını girin"
                    value={newEvent.name || ''}
                    onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea 
                    className="input" 
                    rows={3} 
                    placeholder="Etkinlik açıklaması"
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi *</label>
                    <input 
                      type="datetime-local" 
                      className="input"
                      value={newEvent.startDate || ''}
                      onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi *</label>
                    <input 
                      type="datetime-local" 
                      className="input"
                      value={newEvent.endDate || ''}
                      onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Konum"
                      value={newEvent.location || ''}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Şehir"
                      value={newEvent.city || ''}
                      onChange={(e) => setNewEvent({...newEvent, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Ülke"
                      value={newEvent.country || ''}
                      onChange={(e) => setNewEvent({...newEvent, country: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea 
                    className="input" 
                    rows={2} 
                    placeholder="Tam adres"
                    value={newEvent.address || ''}
                    onChange={(e) => setNewEvent({...newEvent, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                    <select
                      className="input"
                      value={newEvent.status || 'draft'}
                      onChange={(e) => setNewEvent({...newEvent, status: e.target.value as any})}
                    >
                      <option value="draft">Taslak</option>
                      <option value="published">Yayında</option>
                      <option value="archived">Arşivlendi</option>
                      <option value="cancelled">İptal Edildi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Katılımcı</label>
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="Maksimum katılımcı sayısı"
                      value={newEvent.maxParticipants || ''}
                      onChange={(e) => setNewEvent({...newEvent, maxParticipants: e.target.value ? parseInt(e.target.value) : undefined})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kayıt Son Tarihi</label>
                    <input 
                      type="datetime-local" 
                      className="input"
                      value={newEvent.registrationDeadline || ''}
                      onChange={(e) => setNewEvent({...newEvent, registrationDeadline: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2"
                        checked={newEvent.isRegistrationOpen ?? true}
                        onChange={(e) => setNewEvent({...newEvent, isRegistrationOpen: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Kayıt Açık</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İletişim Email</label>
                    <input 
                      type="email" 
                      className="input" 
                      placeholder="info@event.com"
                      value={newEvent.contactEmail || ''}
                      onChange={(e) => setNewEvent({...newEvent, contactEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İletişim Telefon</label>
                    <input 
                      type="tel" 
                      className="input" 
                      placeholder="+90 555 123 4567"
                      value={newEvent.contactPhone || ''}
                      onChange={(e) => setNewEvent({...newEvent, contactPhone: e.target.value})}
                    />
                  </div>
                </div>
                {renderLogoUploadField()}
                {renderIntroVideoField()}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input 
                    type="url" 
                    className="input" 
                    placeholder="https://event.com"
                    value={newEvent.website || ''}
                    onChange={(e) => setNewEvent({...newEvent, website: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    setNewEvent(emptyEventForm());
                  }}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateEvent}
                  className="btn btn-primary"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
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
          <div className="bg-white rounded-md shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Etkinlik Detayları</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEvent(null);
                    setParticipants([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Event Info */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">{selectedEvent.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Açıklama:</span>
                      <p className="text-gray-900 mt-1">{selectedEvent.description || 'Açıklama yok'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Durum:</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedEvent.status)}`}>
                        {getStatusText(selectedEvent.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Başlangıç:</span>
                      <p className="text-gray-900 mt-1">{formatDate(selectedEvent.startDate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Bitiş:</span>
                      <p className="text-gray-900 mt-1">{formatDate(selectedEvent.endDate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Konum:</span>
                      <p className="text-gray-900 mt-1">{selectedEvent.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Katılımcılar:</span>
                      <p className="text-gray-900 mt-1">
                        {selectedEvent.currentParticipants}
                        {selectedEvent.maxParticipants && ` / ${selectedEvent.maxParticipants}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-gray-900">Katılımcılar ({participants.length})</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportParticipants(selectedEvent.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        title="Excel'e Dışa Aktar"
                      >
                        <Download size={16} />
                        Dışa Aktar
                      </button>
                      <label className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 cursor-pointer" title="Excel'den İçe Aktar">
                        <Upload size={16} />
                        İçe Aktar
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => handleImportParticipants(selectedEvent.id, e)}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => fetchParticipants(selectedEvent.id)}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Yenile
                      </button>
                    </div>
                  </div>

                  {loadingParticipants ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="loading-spinner h-6 w-6"></div>
                      <span className="ml-2 text-gray-500">Katılımcılar yükleniyor...</span>
                    </div>
                  ) : participants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Bu etkinliğe kayıtlı katılımcı bulunmamaktadır.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sıra</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şirket</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {participants.map((participant, index) => (
                            <tr key={participant.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {participant.firstName} {participant.lastName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {participant.email}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {participant.phoneNumber || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {participant.role}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {participant.company || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  participant.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {participant.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEvent(null);
                    setParticipants([]);
                  }}
                  className="btn btn-secondary"
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

export default Events;