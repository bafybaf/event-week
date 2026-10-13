import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Mail, Phone, Building, Star, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { speakersApi, eventsApi } from '../services/api.ts';

interface Speaker {
  id: string;
  eventId?: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  bio: string;
  expertise: string[];
  profileImage?: string;
  isFeatured: boolean;
  socialMedia: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  status: 'active' | 'inactive' | 'pending';
}

interface Event {
  id: number;
  name: string;
}

const Speakers: React.FC = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterEvent, setFilterEvent] = useState<string>('');

  const [newSpeaker, setNewSpeaker] = useState<Partial<Speaker>>({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    bio: '',
    expertise: [],
    isFeatured: false,
    socialMedia: {},
    status: 'active'
  });

  const [expertiseInput, setExpertiseInput] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    loadSpeakers();
  }, [filterEvent]);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents((data.events || data) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const loadSpeakers = async () => {
    try {
      const eventId = filterEvent || undefined;
      const apiSpeakers = await speakersApi.getSpeakers(eventId);
      const mapped: Speaker[] = (apiSpeakers || []).map((s: any) => ({
        id: s.id,
        eventId: s.eventId ? String(s.eventId) : '',
        firstName: s.firstName,
        lastName: s.lastName,
        title: s.title || '',
        company: s.company || '',
        email: s.email || '',
        phone: s.phone || '',
        bio: s.bio || '',
        expertise: s.expertise || [],
        profileImage: s.profileImage,
        isFeatured: s.isKeynote || false,
        socialMedia: {
          linkedin: s.linkedin || '',
          twitter: s.twitter || '',
          website: s.website || ''
        },
        status: s.isAvailable ? 'active' : 'inactive'
      }));
      setSpeakers(mapped);
    } catch (error: any) {
      console.error('Konuşmacılar yüklenirken hata:', error);
      toast.error(error.message || 'Konuşmacılar yüklenemedi');
    }
  };

  const filteredSpeakers = speakers.filter(speaker => {
    const matchesSearch = `${speaker.firstName} ${speaker.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         speaker.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         speaker.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || speaker.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'pending': return 'Beklemede';
      default: return 'Bilinmiyor';
    }
  };

  const getEventName = (eventId?: string) => {
    const event = events.find((item) => String(item.id) === String(eventId));
    return event?.name || '';
  };

  const cleanPhoneNumber = (phone: any): string => {
    if (!phone && phone !== 0) return '';
    let phoneStr = String(phone).trim().replace(/\.0+$/, '');
    if (phoneStr.includes('.') && !phoneStr.includes('+')) {
      phoneStr = phoneStr.split('.')[0];
    }
    return phoneStr;
  };

  const exportSpeakers = () => {
    const rows = (filteredSpeakers.length ? filteredSpeakers : []).map((speaker, index) => ({
      'Sıra': index + 1,
      'Ad': speaker.firstName,
      'Soyad': speaker.lastName,
      'Email': speaker.email || '',
      'Telefon': speaker.phone || '',
      'Ünvan': speaker.title || '',
      'Şirket': speaker.company || '',
      'Bio': speaker.bio || '',
      'Uzmanlık': (speaker.expertise || []).join(', '),
      'LinkedIn': speaker.socialMedia?.linkedin || '',
      'Twitter': speaker.socialMedia?.twitter || '',
      'Website': speaker.socialMedia?.website || '',
      'Ana Konuşmacı': speaker.isFeatured ? 'Evet' : 'Hayır',
      'Durum': getStatusText(speaker.status),
      'Etkinlik ID': speaker.eventId || filterEvent || '',
      'Etkinlik': getEventName(speaker.eventId || filterEvent),
    }));

    const ws = rows.length
      ? XLSX.utils.json_to_sheet(rows)
      : XLSX.utils.aoa_to_sheet([[
        'Ad', 'Soyad', 'Email', 'Telefon', 'Ünvan', 'Şirket', 'Bio', 'Uzmanlık',
        'LinkedIn', 'Twitter', 'Website', 'Ana Konuşmacı', 'Durum', 'Etkinlik ID'
      ]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Konusmacilar');
    ws['!cols'] = [
      { wch: 6 }, { wch: 16 }, { wch: 16 }, { wch: 26 }, { wch: 16 },
      { wch: 18 }, { wch: 22 }, { wch: 30 }, { wch: 24 }, { wch: 22 },
      { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 28 }
    ];

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', compression: true });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Konusmacilar_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success(rows.length
      ? `${rows.length} konuşmacı Excel dosyasına aktarıldı`
      : 'Boş şablon indirildi');
  };

  const handleImportSpeakers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        toast.error('Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
          if (!jsonData.length) {
            toast.error('Excel dosyası boş');
            return;
          }

          const speakersData = jsonData.map((row: any) => ({
            firstName: row['Ad'] || row['First Name'] || row['firstName'] || '',
            lastName: row['Soyad'] || row['Last Name'] || row['lastName'] || '',
            email: row['Email'] || row['email'] || '',
            phone: cleanPhoneNumber(row['Telefon'] || row['Phone'] || row['phone'] || ''),
            title: row['Ünvan'] || row['Title'] || row['title'] || '',
            company: row['Şirket'] || row['Company'] || row['company'] || '',
            bio: row['Bio'] || row['Biyografi'] || row['bio'] || '',
            expertise: row['Uzmanlık'] || row['Expertise'] || row['expertise'] || '',
            linkedin: row['LinkedIn'] || row['linkedin'] || '',
            twitter: row['Twitter'] || row['twitter'] || '',
            website: row['Website'] || row['website'] || '',
            isKeynote: row['Ana Konuşmacı'] || row['isKeynote'] || '',
            status: row['Durum'] || row['Status'] || row['status'] || '',
            eventId: row['Etkinlik ID'] || row['Event ID'] || row['eventId'] || filterEvent || '',
          })).filter((s: any) => s.firstName && s.lastName);

          if (!speakersData.length) {
            toast.error('Geçerli konuşmacı verisi bulunamadı');
            return;
          }
          if (!filterEvent && speakersData.some((s: any) => !s.eventId)) {
            toast.error('Etkinlik seçin veya Excel’de Etkinlik ID kolonunu doldurun');
            return;
          }

          const result = await speakersApi.importSpeakers(speakersData, filterEvent || undefined);
          toast.success(result.message || 'Konuşmacılar içe aktarıldı');
          if (result.results?.errors?.length) {
            toast.error(`${result.results.errors.length} satır aktarılamadı`);
          }
          await loadSpeakers();
          event.target.value = '';
        } catch (error: any) {
          toast.error(error.response?.data?.error || error.message || 'Excel işlenemedi');
        }
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      toast.error(error.message || 'Dosya okunamadı');
    }
  };

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && !newSpeaker.expertise?.includes(expertiseInput.trim())) {
      setNewSpeaker({
        ...newSpeaker,
        expertise: [...(newSpeaker.expertise || []), expertiseInput.trim()]
      });
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (expertise: string) => {
    setNewSpeaker({
      ...newSpeaker,
      expertise: newSpeaker.expertise?.filter(e => e !== expertise) || []
    });
  };

  const handleAddSpeaker = async () => {
    if (!newSpeaker.firstName || !newSpeaker.lastName || !newSpeaker.email) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }
    if (!filterEvent) {
      toast.error('Lütfen bir etkinlik seçin');
      return;
    }

    try {
      const payload = {
        firstName: newSpeaker.firstName,
        lastName: newSpeaker.lastName,
        title: newSpeaker.title || '',
        company: newSpeaker.company || '',
        email: newSpeaker.email,
        phone: newSpeaker.phone || '',
        bio: newSpeaker.bio || '',
        expertise: newSpeaker.expertise || [],
        linkedin: newSpeaker.socialMedia?.linkedin || '',
        twitter: newSpeaker.socialMedia?.twitter || '',
        website: newSpeaker.socialMedia?.website || '',
        isKeynote: newSpeaker.isFeatured || false,
        isAvailable: newSpeaker.status === 'active',
        eventId: filterEvent
      };
      const created = await speakersApi.createSpeaker(payload);
      const mapped: Speaker = {
        id: created.id,
        firstName: created.firstName,
        lastName: created.lastName,
        title: created.title || '',
        company: created.company || '',
        email: created.email || '',
        phone: created.phone || '',
        bio: created.bio || '',
        expertise: created.expertise || [],
        profileImage: created.profileImage,
        isFeatured: created.isKeynote || false,
        socialMedia: {
          linkedin: created.linkedin || '',
          twitter: created.twitter || '',
          website: created.website || ''
        },
        status: created.isAvailable ? 'active' : 'inactive'
      };
      setSpeakers([...speakers, mapped]);
      setNewSpeaker({
        firstName: '',
        lastName: '',
        title: '',
        company: '',
        email: '',
        phone: '',
        bio: '',
        expertise: [],
        isFeatured: false,
        socialMedia: {},
        status: 'active'
      });
      setShowAddModal(false);
      toast.success('Konuşmacı başarıyla eklendi');
    } catch (error: any) {
      toast.error(error.message || 'Konuşmacı eklenemedi');
    }
  };

  const handleEditSpeaker = (speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    setNewSpeaker(speaker);
    setShowEditModal(true);
  };

  const handleUpdateSpeaker = async () => {
    if (!selectedSpeaker || !newSpeaker.firstName || !newSpeaker.lastName || !newSpeaker.email) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }
    if (!filterEvent) {
      toast.error('Lütfen bir etkinlik seçin');
      return;
    }

    try {
      const payload = {
        firstName: newSpeaker.firstName,
        lastName: newSpeaker.lastName,
        title: newSpeaker.title || '',
        company: newSpeaker.company || '',
        email: newSpeaker.email,
        phone: newSpeaker.phone || '',
        bio: newSpeaker.bio || '',
        expertise: newSpeaker.expertise || [],
        linkedin: newSpeaker.socialMedia?.linkedin || '',
        twitter: newSpeaker.socialMedia?.twitter || '',
        website: newSpeaker.socialMedia?.website || '',
        isKeynote: newSpeaker.isFeatured || false,
        isAvailable: newSpeaker.status === 'active',
        eventId: filterEvent
      };
      const updated = await speakersApi.updateSpeaker(selectedSpeaker.id, payload);
      const mapped: Speaker = {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        title: updated.title || '',
        company: updated.company || '',
        email: updated.email || '',
        phone: updated.phone || '',
        bio: updated.bio || '',
        expertise: updated.expertise || [],
        profileImage: updated.profileImage,
        isFeatured: updated.isKeynote || false,
        socialMedia: {
          linkedin: updated.linkedin || '',
          twitter: updated.twitter || '',
          website: updated.website || ''
        },
        status: updated.isAvailable ? 'active' : 'inactive'
      };
      setSpeakers(speakers.map(s => s.id === selectedSpeaker.id ? mapped : s));
      setShowEditModal(false);
      setSelectedSpeaker(null);
      toast.success('Konuşmacı başarıyla güncellendi');
    } catch (error: any) {
      toast.error(error.message || 'Konuşmacı güncellenemedi');
    }
  };

  const handleDeleteSpeaker = async (speakerId: string) => {
    if (!window.confirm('Bu konuşmacıyı silmek istediğinizden emin misiniz?')) return;
    try {
      await speakersApi.deleteSpeaker(speakerId);
      setSpeakers(speakers.filter(speaker => speaker.id !== speakerId));
      toast.success('Konuşmacı başarıyla silindi');
    } catch (error: any) {
      toast.error(error.message || 'Konuşmacı silinemedi');
    }
  };

  const handleToggleFeatured = async (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId);
    if (!speaker) return;
    try {
      await speakersApi.updateSpeaker(speakerId, { isKeynote: !speaker.isFeatured });
      setSpeakers(speakers.map(s => 
        s.id === speakerId 
          ? { ...s, isFeatured: !s.isFeatured }
          : s
      ));
    } catch (error: any) {
      toast.error(error.message || 'Konuşmacı güncellenemedi');
    }
  };

  return (
    <div className="space-y-6 [&>*:first-child]:mt-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konuşmacı Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Konuşmacıları görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportSpeakers}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Download size={18} />
            Dışa Aktar
          </button>
          <label className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
            <Upload size={18} />
            İçe Aktar
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportSpeakers}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Yeni Konuşmacı
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Konuşmacı ara..."
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
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
            <option value="pending">Beklemede</option>
          </select>
        </div>
      </div>

      {/* Konuşmacı Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpeakers.map((speaker) => (
          <div key={speaker.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {speaker.firstName[0]}{speaker.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {speaker.firstName} {speaker.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{speaker.title}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {speaker.isFeatured && (
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  )}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(speaker.status)}`}>
                    {getStatusText(speaker.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  {speaker.company}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {speaker.email}
                </div>
                {speaker.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {speaker.phone}
                  </div>
                )}
              </div>

              {speaker.bio && (
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">{speaker.bio}</p>
              )}

              {speaker.expertise.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {speaker.expertise.slice(0, 3).map((skill, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {skill}
                      </span>
                    ))}
                    {speaker.expertise.length > 3 && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        +{speaker.expertise.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditSpeaker(speaker)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteSpeaker(speaker.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <button
                  onClick={() => handleToggleFeatured(speaker.id)}
                  className={`p-1 rounded ${
                    speaker.isFeatured 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-gray-400 hover:text-yellow-500'
                  }`}
                >
                  <Star size={16} className={speaker.isFeatured ? 'fill-current' : ''} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Konuşmacı Ekleme Modal */}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Konuşmacı Ekle</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Etkinlik *</label>
                  <select
                    value={filterEvent}
                    onChange={(e) => setFilterEvent(e.target.value)}
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
                  <label className="block text-sm font-medium text-gray-700">Ad *</label>
                  <input
                    type="text"
                    value={newSpeaker.firstName}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, firstName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Soyad *</label>
                  <input
                    type="text"
                    value={newSpeaker.lastName}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, lastName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unvan</label>
                  <input
                    type="text"
                    value={newSpeaker.title}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Şirket</label>
                  <input
                    type="text"
                    value={newSpeaker.company}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, company: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-posta *</label>
                  <input
                    type="email"
                    value={newSpeaker.email}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="tel"
                    value={newSpeaker.phone}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, phone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Biyografi</label>
                <textarea
                  value={newSpeaker.bio}
                  onChange={(e) => setNewSpeaker({ ...newSpeaker, bio: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Uzmanlık Alanları</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddExpertise()}
                    placeholder="Uzmanlık alanı ekle..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddExpertise}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Ekle
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newSpeaker.expertise?.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveExpertise(skill)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newSpeaker.isFeatured}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, isFeatured: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Öne çıkan konuşmacı</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddSpeaker}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Konuşmacı Düzenleme Modal */}
      {showEditModal && selectedSpeaker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Konuşmacı Düzenle</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Etkinlik *</label>
                  <select
                    value={filterEvent}
                    onChange={(e) => setFilterEvent(e.target.value)}
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
                  <label className="block text-sm font-medium text-gray-700">Ad *</label>
                  <input
                    type="text"
                    value={newSpeaker.firstName}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, firstName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Soyad *</label>
                  <input
                    type="text"
                    value={newSpeaker.lastName}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, lastName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unvan</label>
                  <input
                    type="text"
                    value={newSpeaker.title}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Şirket</label>
                  <input
                    type="text"
                    value={newSpeaker.company}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, company: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-posta *</label>
                  <input
                    type="email"
                    value={newSpeaker.email}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="tel"
                    value={newSpeaker.phone}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, phone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Biyografi</label>
                <textarea
                  value={newSpeaker.bio}
                  onChange={(e) => setNewSpeaker({ ...newSpeaker, bio: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Uzmanlık Alanları</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddExpertise()}
                    placeholder="Uzmanlık alanı ekle..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddExpertise}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Ekle
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newSpeaker.expertise?.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveExpertise(skill)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Durum</label>
                  <select
                    value={newSpeaker.status}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, status: e.target.value as any })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                    <option value="pending">Beklemede</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newSpeaker.isFeatured}
                      onChange={(e) => setNewSpeaker({ ...newSpeaker, isFeatured: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Öne çıkan konuşmacı</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateSpeaker}
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

export default Speakers;