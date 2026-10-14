import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Settings as SettingsIcon, Save, RefreshCw, Bell, Globe, Shield, Database, Image as ImageIcon, Film } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ORIGIN, fileUrl } from '../config.ts';

interface Setting {
  id: number;
  key: string;
  value: string;
  description: string;
  type: string;
  eventId: number | null;
  event?: {
    id: number;
    name: string;
  };
}

interface Event {
  id: number;
  name: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [appLogo, setAppLogo] = useState('');
  const [uploadingAppLogo, setUploadingAppLogo] = useState(false);
  const [appIcon, setAppIcon] = useState('');
  const [uploadingAppIcon, setUploadingAppIcon] = useState(false);
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [introVideoFileName, setIntroVideoFileName] = useState('');
  const [uploadingIntroVideo, setUploadingIntroVideo] = useState(false);

  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    description: '',
    type: 'string',
    eventId: '',
    notes: ''
  });

  const settingTypes = [
    { value: 'string', label: 'Metin', icon: '📝' },
    { value: 'number', label: 'Sayı', icon: '🔢' },
    { value: 'boolean', label: 'Doğru/Yanlış', icon: '✅' },
    { value: 'json', label: 'JSON', icon: '📋' },
    { value: 'url', label: 'URL', icon: '🔗' },
    { value: 'email', label: 'E-posta', icon: '📧' },
    { value: 'password', label: 'Şifre', icon: '🔒' },
    { value: 'color', label: 'Renk', icon: '🎨' },
    { value: 'date', label: 'Tarih', icon: '📅' },
    { value: 'time', label: 'Saat', icon: '⏰' }
  ];

  const settingCategories = [
    { value: 'general', label: 'Genel', icon: '⚙️' },
    { value: 'notification', label: 'Bildirimler', icon: '🔔' },
    { value: 'security', label: 'Güvenlik', icon: '🔐' },
    { value: 'appearance', label: 'Görünüm', icon: '🎨' },
    { value: 'integration', label: 'Entegrasyonlar', icon: '🔗' },
    { value: 'backup', label: 'Yedekleme', icon: '💾' },
    { value: 'performance', label: 'Performans', icon: '⚡' },
    { value: 'api', label: 'API', icon: '🔌' }
  ];

  useEffect(() => {
    fetchEvents();
    fetchAppLogo();
    fetchAppIcon();
    fetchIntroVideo();
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [filterEvent]);

  const getLogoHref = fileUrl;

  const fetchAppLogo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ORIGIN}/api/settings/app-logo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      setAppLogo(data.appLogo || '');
    } catch (error) {
      console.error('Error fetching app logo:', error);
    }
  };

  const saveAppLogo = async (url: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_ORIGIN}/api/settings/app-logo`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ appLogo: url })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Uygulama logosu kaydedilemedi');
    }
    setAppLogo(result.appLogo || url);
  };

  const handleAppLogoUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece görsel yükleyebilirsiniz (PNG, JPG, SVG, WEBP)');
      return;
    }

    try {
      setUploadingAppLogo(true);
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const uploadResponse = await fetch(`${API_ORIGIN}/api/upload/event-logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || 'Logo yüklenemedi');
      }
      await saveAppLogo(uploadResult.data.url);
      toast.success('Uygulama logosu kaydedildi');
    } catch (error: any) {
      toast.error(error.message || 'Logo yüklenirken hata oluştu');
    } finally {
      setUploadingAppLogo(false);
    }
  };

  const fetchAppIcon = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ORIGIN}/api/settings/app-icon`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      setAppIcon(data.appIcon || '');
    } catch (error) {
      console.error('Error fetching app icon:', error);
    }
  };

  const saveAppIcon = async (url: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_ORIGIN}/api/settings/app-icon`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ appIcon: url })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Ana ekran ikonu kaydedilemedi');
    }
    setAppIcon(result.appIcon || url);
  };

  const handleAppIconUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece görsel yükleyebilirsiniz (PNG veya JPG, 1024x1024 önerilir)');
      return;
    }

    try {
      setUploadingAppIcon(true);
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const uploadResponse = await fetch(`${API_ORIGIN}/api/upload/event-logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || 'İkon yüklenemedi');
      }
      await saveAppIcon(uploadResult.data.url);
      toast.success('Ana ekran ikonu kaydedildi. Yeni APK derlemesinde uygulanır.');
    } catch (error: any) {
      toast.error(error.message || 'İkon yüklenirken hata oluştu');
    } finally {
      setUploadingAppIcon(false);
    }
  };

  const handleRemoveAppIcon = async () => {
    try {
      setUploadingAppIcon(true);
      await saveAppIcon('');
      toast.success('Ana ekran ikonu kaldırıldı');
    } catch (error: any) {
      toast.error(error.message || 'İkon kaldırılırken hata oluştu');
    } finally {
      setUploadingAppIcon(false);
    }
  };

  const handleRemoveAppLogo = async () => {
    try {
      setUploadingAppLogo(true);
      await saveAppLogo('');
      toast.success('Uygulama logosu kaldırıldı');
    } catch (error: any) {
      toast.error(error.message || 'Logo kaldırılırken hata oluştu');
    } finally {
      setUploadingAppLogo(false);
    }
  };

  const fetchIntroVideo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ORIGIN}/api/settings/app-intro-video`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      setIntroVideoUrl(data.introVideoUrl || '');
      setIntroVideoFileName(data.introVideoFileName || '');
    } catch (error) {
      console.error('Error fetching intro video:', error);
    }
  };

  const saveIntroVideo = async (url: string, fileName: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_ORIGIN}/api/settings/app-intro-video`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ introVideoUrl: url, introVideoFileName: fileName })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Giriş videosu kaydedilemedi');
    }
    setIntroVideoUrl(result.introVideoUrl || url);
    setIntroVideoFileName(result.introVideoFileName || fileName);
  };

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
      const uploadResponse = await fetch(`${API_ORIGIN}/api/upload/intro-video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || 'Video yüklenemedi');
      }
      await saveIntroVideo(uploadResult.data.url, uploadResult.data.fileName || file.name);
      toast.success('Giriş videosu kaydedildi');
    } catch (error: any) {
      toast.error(error.message || 'Video yüklenirken hata oluştu');
    } finally {
      setUploadingIntroVideo(false);
    }
  };

  const handleRemoveIntroVideo = async () => {
    try {
      setUploadingIntroVideo(true);
      await saveIntroVideo('', '');
      toast.success('Giriş videosu kaldırıldı');
    } catch (error: any) {
      toast.error(error.message || 'Video kaldırılırken hata oluştu');
    } finally {
      setUploadingIntroVideo(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filterEvent 
        ? `${API_ORIGIN}/api/settings?eventId=${filterEvent}`
        : `${API_ORIGIN}/api/settings`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      } else {
        toast.error('Ayarlar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Ayarlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ORIGIN}/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleAddSetting = async () => {
    // Form validasyonu
    if (!newSetting.key.trim()) {
      toast.error('Anahtar zorunludur');
      return;
    }
    if (!newSetting.value.trim()) {
      toast.error('Değer zorunludur');
      return;
    }
    if (!newSetting.type) {
      toast.error('Tür zorunludur');
      return;
    }
    if (!newSetting.category) {
      toast.error('Kategori zorunludur');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ORIGIN}/api/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newSetting,
          eventId: newSetting.eventId ? parseInt(newSetting.eventId) : null
        })
      });

      if (response.ok) {
        toast.success('Ayar başarıyla eklendi');
        setShowModal(false);
        resetForm();
        fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ayar eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding setting:', error);
      toast.error('Ayar eklenirken hata oluştu');
    }
  };

  const handleUpdateSetting = async () => {
    if (!selectedSetting) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ORIGIN}/api/settings/${selectedSetting.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newSetting,
          eventId: newSetting.eventId ? parseInt(newSetting.eventId) : null
        })
      });

      if (response.ok) {
        toast.success('Ayar başarıyla güncellendi');
        setShowModal(false);
        setSelectedSetting(null);
        fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ayar güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Ayar güncellenirken hata oluştu');
    }
  };

  const handleDeleteSetting = async () => {
    if (!selectedSetting) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ORIGIN}/api/settings/${selectedSetting.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Ayar başarıyla silindi');
        setShowDeleteModal(false);
        setSelectedSetting(null);
        fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ayar silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast.error('Ayar silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setNewSetting({
      key: '',
      value: '',
      description: '',
      type: 'string',
      eventId: '',
      notes: ''
    });
  };

  const openEditModal = (setting: Setting) => {
    setSelectedSetting(setting);
    setNewSetting({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      type: setting.type,
      eventId: setting.eventId ? setting.eventId.toString() : '',
      notes: ''
    });
    setShowModal(true);
  };

  const openViewModal = (setting: Setting) => {
    setSelectedSetting(setting);
    setShowViewModal(true);
  };

  const openDeleteModal = (setting: Setting) => {
    setSelectedSetting(setting);
    setShowDeleteModal(true);
  };

  const getTypeIcon = (type: string) => {
    return settingTypes.find(t => t.value === type)?.icon || '📝';
  };

  const getTypeText = (type: string) => {
    return settingTypes.find(t => t.value === type)?.label || type;
  };

  const getEventName = (eventId: number | null) => {
    if (!eventId) return 'Genel Ayar';
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Bilinmeyen Etkinlik';
  };

  const getCategoryIcon = (key: string) => {
    if (key.includes('notification') || key.includes('email') || key.includes('sms')) {
      return <Bell className="w-4 h-4 text-blue-600" />;
    } else if (key.includes('security') || key.includes('password') || key.includes('auth')) {
      return <Shield className="w-4 h-4 text-red-600" />;
    } else if (key.includes('url') || key.includes('api') || key.includes('endpoint')) {
      return <Globe className="w-4 h-4 text-green-600" />;
    } else if (key.includes('database') || key.includes('db') || key.includes('backup')) {
      return <Database className="w-4 h-4 text-purple-600" />;
    } else {
      return <SettingsIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatValue = (value: string, type: string) => {
    switch (type) {
      case 'boolean':
        return value === 'true' ? 'Evet' : 'Hayır';
      case 'json':
        try {
          return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
          return value;
        }
      case 'password':
        return '••••••••';
      default:
        return value;
    }
  };

  const filteredSettings = settings.filter(setting => {
    if (
      setting.key === 'app_logo' ||
      setting.key === 'app_launcher_icon' ||
      setting.key === 'app_intro_video' ||
      setting.key === 'app_intro_video_file_name'
    ) return false;
    const matchesSearch = setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || setting.type === filterType;
    const matchesEvent = !filterEvent || 
                        (filterEvent === 'general' && !setting.eventId) ||
                        setting.eventId?.toString() === filterEvent;
    
    return matchesSearch && matchesType && matchesEvent;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              fetchSettings();
              fetchAppLogo();
              fetchAppIcon();
              fetchIntroVideo();
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Yenile
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Yeni Ayar
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Ana ekran ikonu</h2>
        <p className="text-sm text-gray-500 mb-4">
          Telefondaki uygulama listesinde görünen ikon. PNG/JPG, kare, 1024×1024 önerilir.
          Anında değişmez; kaydettikten sonra yeni APK derlemeniz gerekir.
        </p>
        {appIcon ? (
          <div className="flex items-center gap-3 rounded-md border bg-gray-50 p-3">
            <img
              src={getLogoHref(appIcon)}
              alt="Ana ekran ikonu"
              className="h-16 w-16 object-contain rounded-2xl bg-white border"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                {uploadingAppIcon ? 'Yükleniyor...' : 'Değiştir'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingAppIcon}
                  onChange={(e) => handleAppIconUpload(e.target.files?.[0])}
                />
              </label>
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-800 text-left disabled:opacity-50"
                disabled={uploadingAppIcon}
                onClick={handleRemoveAppIcon}
              >
                Kaldır
              </button>
            </div>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 cursor-pointer text-sm text-gray-600 hover:bg-gray-50">
            <ImageIcon className="h-4 w-4" />
            {uploadingAppIcon ? 'Yükleniyor...' : 'İkon seçin (PNG, JPG, 1024×1024)'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploadingAppIcon}
              onChange={(e) => handleAppIconUpload(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Uygulama logosu</h2>
        <p className="text-sm text-gray-500 mb-4">Numara henüz eşleşmeden telefon giriş ekranında görünür. Numara girilince etkinliğin kendi logosu kullanılır.</p>
        {appLogo ? (
          <div className="flex items-center gap-3 rounded-md border bg-gray-50 p-3">
            <img
              src={getLogoHref(appLogo)}
              alt="Uygulama logosu"
              className="h-16 w-16 object-contain rounded-md bg-white border"
            />
            <button
              type="button"
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              disabled={uploadingAppLogo}
              onClick={handleRemoveAppLogo}
            >
              Kaldır
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 cursor-pointer text-sm text-gray-600 hover:bg-gray-50">
            <ImageIcon className="h-4 w-4" />
            {uploadingAppLogo ? 'Yükleniyor...' : 'Logo seçin (PNG, JPG, SVG, WEBP)'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              className="hidden"
              disabled={uploadingAppLogo}
              onChange={(e) => handleAppLogoUpload(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Giriş videosu</h2>
        <p className="text-sm text-gray-500 mb-4">Filli Boya etkinliği için yedek hoş geldiniz videosu. Diğer etkinliklerin videosu Etkinlikler sayfasından yüklenir; yoksa Matrix açılış gösterilir.</p>
        {introVideoUrl ? (
          <div className="space-y-2">
            <video src={getLogoHref(introVideoUrl)} controls className="w-full max-h-48 rounded-md bg-black" />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="truncate pr-3">{introVideoFileName || 'video'}</span>
              <button
                type="button"
                className="text-red-600 hover:text-red-800 shrink-0 disabled:opacity-50"
                disabled={uploadingIntroVideo}
                onClick={handleRemoveIntroVideo}
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Ayar ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Tipler</option>
            {settingTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Ayarlar</option>
            <option value="general">Genel Ayarlar</option>
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
            Temizle
          </button>
        </div>
      </div>

      {/* Settings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ayar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Değer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kapsam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSettings.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          {getCategoryIcon(setting.key)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{setting.key}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {getTypeIcon(setting.type)} {getTypeText(setting.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {setting.type === 'json' ? (
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {formatValue(setting.value, setting.type)}
                        </pre>
                      ) : (
                        formatValue(setting.value, setting.type)
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getEventName(setting.eventId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">
                      {setting.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(setting)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(setting)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(setting)}
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
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedSetting ? 'Ayar Düzenle' : 'Yeni Ayar Ekle'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anahtar *</label>
                <input
                  type="text"
                  value={newSetting.key}
                  onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
                  placeholder="app.name, database.host, notification.email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Değer *</label>
                {newSetting.type === 'boolean' ? (
                  <select
                    value={newSetting.value}
                    onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Evet</option>
                    <option value="false">Hayır</option>
                  </select>
                ) : newSetting.type === 'json' ? (
                  <textarea
                    value={newSetting.value}
                    onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                    rows={4}
                    placeholder='{"key": "value", "array": [1, 2, 3]}'
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                ) : (
                  <input
                    type={newSetting.type === 'password' ? 'password' : newSetting.type === 'number' ? 'number' : 'text'}
                    value={newSetting.value}
                    onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip *</label>
                  <select
                    value={newSetting.type}
                    onChange={(e) => setNewSetting({...newSetting, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {settingTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapsam</label>
                  <select
                    value={newSetting.eventId}
                    onChange={(e) => setNewSetting({...newSetting, eventId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Genel Ayar</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSetting(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={selectedSetting ? handleUpdateSetting : handleAddSetting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {selectedSetting ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSetting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Ayar Detayları</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Anahtar</label>
                <p className="text-lg font-semibold">{selectedSetting.key}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tip</label>
                  <p className="text-gray-900">{getTypeText(selectedSetting.type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kapsam</label>
                  <p className="text-gray-900">{getEventName(selectedSetting.eventId)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Değer</label>
                {selectedSetting.type === 'json' ? (
                  <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">
                      {formatValue(selectedSetting.value, selectedSetting.type)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded">
                    {formatValue(selectedSetting.value, selectedSetting.type)}
                  </p>
                )}
              </div>
              
              {selectedSetting.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <p className="text-gray-900">{selectedSetting.description}</p>
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
      {showDeleteModal && selectedSetting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ayar Sil</h2>
            <p className="text-gray-600 mb-6">
              "{selectedSetting.key}" ayarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteSetting}
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

export default Settings;