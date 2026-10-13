import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Image, Calendar, Filter, Search, Upload, ChevronDown, ChevronUp, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { galleryApi, eventsApi } from '../services/api.ts';

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  uploadDate?: string;
  createdAt?: string;
  created_at?: string;
  fileSize: number;
  dimensions: string;
  tags: string;
  isPublic: boolean;
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

const Gallery: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'category'>('category');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: 'general',
    tags: '',
    isPublic: true,
    eventId: '',
    notes: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadCategory, setBulkUploadCategory] = useState('general');
  const [bulkUploadEventId, setBulkUploadEventId] = useState('');

  const categories = [
    { value: 'general', label: 'Genel', icon: '📁', color: 'bg-gray-100 text-gray-800' },
    { value: 'speakers', label: 'Konuşmacılar', icon: '🎤', color: 'bg-blue-100 text-blue-800' },
    { value: 'activities', label: 'Aktiviteler', icon: '🎯', color: 'bg-green-100 text-green-800' },
    { value: 'venue', label: 'Mekan', icon: '🏢', color: 'bg-purple-100 text-purple-800' },
    { value: 'food', label: 'Yemek', icon: '🍽️', color: 'bg-orange-100 text-orange-800' },
    { value: 'networking', label: 'Networking', icon: '🤝', color: 'bg-pink-100 text-pink-800' },
    { value: 'awards', label: 'Ödüller', icon: '🏆', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'sponsors', label: 'Sponsorlar', icon: '💼', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'team', label: 'Ekip', icon: '👥', color: 'bg-red-100 text-red-800' },
    { value: 'behind_scenes', label: 'Sahne Arkası', icon: '🎬', color: 'bg-gray-100 text-gray-800' },
    { value: 'opening', label: 'Açılış', icon: '🎉', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'closing', label: 'Kapanış', icon: '🎊', color: 'bg-teal-100 text-teal-800' },
    { value: 'workshop', label: 'Atölye', icon: '🔧', color: 'bg-amber-100 text-amber-800' },
    { value: 'panel', label: 'Panel', icon: '💬', color: 'bg-violet-100 text-violet-800' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchGalleryItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterEvent]);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const eventId = filterEvent || undefined;
      const data = await galleryApi.getGalleryItems(eventId);
      setGalleryItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      toast.error('Galeri yüklenirken hata oluştu');
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

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('media', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/upload/gallery', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Yükleme başarısız');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setNewItem({ ...newItem, imageUrl: result.data.url || result.data.thumbnail || result.data.medium });
        toast.success('Dosya başarıyla yüklendi');
      } else {
        throw new Error('Yükleme yanıtı geçersiz');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Dosya yüklenirken hata oluştu');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Maksimum 10 dosya
    const limitedFiles = files.slice(0, 10);
    setSelectedFiles(limitedFiles);
    if (limitedFiles.length < files.length) {
      toast.error('Maksimum 10 dosya seçebilirsiniz. İlk 10 dosya seçildi.');
    }
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Lütfen en az bir dosya seçin');
      return;
    }
    if (!bulkUploadEventId) {
      toast.error('Lütfen bir etkinlik seçin');
      return;
    }

    // Dosya boyutu kontrolü (her dosya için maksimum 100MB - video dosyaları için)
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    const oversizedFiles = selectedFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} dosya çok büyük (maksimum 100MB)`);
      return;
    }

    // Toplam dosya boyutu kontrolü (maksimum 500MB)
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 500 * 1024 * 1024; // 500MB
    if (totalSize > maxTotalSize) {
      toast.error(`Toplam dosya boyutu çok büyük (maksimum 500MB)`);
      return;
    }

    try {
      setBulkUploading(true);
      setBulkUploadProgress(0);

      const token = localStorage.getItem('token');
      const uploadedFiles: any[] = [];
      const errors: any[] = [];

      // Dosyaları tek tek yükle (daha güvenilir)
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          setBulkUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 50)); // İlk %50 yükleme için

          const formData = new FormData();
          formData.append('media', file);

          const controller = new AbortController();
          // Büyük video dosyaları için timeout süresini artır (5 dakika)
          const timeoutDuration = file.size > 50 * 1024 * 1024 ? 300000 : 120000; // 50MB'dan büyükse 5 dk, değilse 2 dk
          const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

          try {
            const response = await fetch('http://localhost:3000/api/upload/gallery', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData,
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              let errorMessage = 'Yükleme başarısız';
              try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
              } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
              }
              throw new Error(errorMessage);
            }

            const result = await response.json();
            if (result.success && result.data) {
              // Video dosyaları için URL'yi doğru al
              const fileUrl = result.data.url || result.data.thumbnail || result.data.medium;
              const fileCategory = getFileType(fileUrl || file.name);
              
              uploadedFiles.push({
                filename: file.name,
                url: fileUrl,
                size: file.size,
                mimetype: file.type || result.data.mimetype,
                category: result.data.category || (fileCategory === 'video' ? 'video' : 'image')
              });
            } else {
              throw new Error('Yükleme yanıtı geçersiz');
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
              errors.push({ filename: file.name, error: 'Zaman aşımı' });
            } else {
              errors.push({ filename: file.name, error: fetchError.message || 'Yükleme hatası' });
            }
          }
        } catch (fileError: any) {
          errors.push({ filename: file.name, error: fileError.message || 'Bilinmeyen hata' });
        }
      }

      // Yüklenen dosyalar için galeri öğeleri oluştur
      let successCount = 0;
      setBulkUploadProgress(75);

      for (const file of uploadedFiles) {
        try {
          await galleryApi.createGalleryItem({
            title: file.filename.replace(/\.[^/.]+$/, ''),
            description: '',
            imageUrl: file.url,
            category: bulkUploadCategory,
            tags: '',
            isPublic: true,
            eventId: parseInt(bulkUploadEventId),
            notes: ''
          });
          successCount++;
        } catch (error) {
          console.error('Error creating gallery item:', error);
          errors.push({ filename: file.filename, error: 'Galeri öğesi oluşturulamadı' });
        }
      }

      setBulkUploadProgress(100);

      toast.success(
        `${uploadedFiles.length} dosya yüklendi, ${successCount} galeri öğesi oluşturuldu. ${errors.length > 0 ? `${errors.length} hata oluştu.` : ''}`
      );
      
      if (errors.length > 0) {
        console.warn('Upload errors:', errors);
      }
      
      setShowBulkUploadModal(false);
      setSelectedFiles([]);
      setBulkUploadCategory('general');
      setBulkUploadEventId('');
      fetchGalleryItems();
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      let errorMessage = 'Toplu yükleme sırasında hata oluştu';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin veya dosya boyutlarını küçültün.';
      }
      
      toast.error(errorMessage);
    } finally {
      setBulkUploading(false);
      setBulkUploadProgress(0);
    }
  };

  const handleAddItem = async () => {
    // Form validasyonu
    if (!newItem.title.trim()) {
      toast.error('Başlık zorunludur');
      return;
    }
    if (!newItem.imageUrl.trim()) {
      toast.error('Resim URL zorunludur');
      return;
    }
    if (!newItem.category) {
      toast.error('Kategori zorunludur');
      return;
    }
    if (!newItem.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }

    try {
      await galleryApi.createGalleryItem({
          ...newItem,
          eventId: parseInt(newItem.eventId)
      });
        toast.success('Galeri öğesi başarıyla eklendi');
        setShowModal(false);
        resetForm();
        fetchGalleryItems();
    } catch (error: any) {
      console.error('Error adding gallery item:', error);
      toast.error(error.message || 'Galeri öğesi eklenirken hata oluştu');
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;

    try {
      await galleryApi.updateGalleryItem(String(selectedItem.id), {
          ...newItem,
          eventId: parseInt(newItem.eventId)
      });
        toast.success('Galeri öğesi başarıyla güncellendi');
        setShowModal(false);
        setSelectedItem(null);
        fetchGalleryItems();
    } catch (error: any) {
      console.error('Error updating gallery item:', error);
      toast.error(error.message || 'Galeri öğesi güncellenirken hata oluştu');
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      await galleryApi.deleteGalleryItem(String(selectedItem.id));
        toast.success('Galeri öğesi başarıyla silindi');
        setShowDeleteModal(false);
        setSelectedItem(null);
        fetchGalleryItems();
    } catch (error: any) {
      console.error('Error deleting gallery item:', error);
      toast.error(error.message || 'Galeri öğesi silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setNewItem({
      title: '',
      description: '',
      imageUrl: '',
      category: 'general',
      tags: '',
      isPublic: true,
      eventId: '',
      notes: ''
    });
  };

  const openEditModal = (item: GalleryItem) => {
    setSelectedItem(item);
    setNewItem({
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      category: item.category,
      tags: item.tags,
      isPublic: item.isPublic,
      eventId: item.eventId.toString(),
      notes: ''
    });
    setShowModal(true);
  };

  const openViewModal = (item: GalleryItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const openDeleteModal = (item: GalleryItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const getCategoryColor = (category: string) => {
    const categoryObj = categories.find(c => c.value === category);
    return categoryObj?.color || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const categoryObj = categories.find(c => c.value === category);
    return categoryObj?.icon || '📁';
  };

  const getCategoryText = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tarih yok';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Geçersiz tarih';
      return date.toLocaleDateString('tr-TR');
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };

  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesEvent = !filterEvent || item.eventId.toString() === filterEvent;
    
    return matchesSearch && matchesCategory && matchesEvent;
  });

  // Kategorilere göre grupla
  const groupedByCategory = categories.reduce((acc, category) => {
    const items = filteredItems.filter(item => item.category === category.value);
    if (items.length > 0) {
      acc[category.value] = {
        category,
        items
      };
    }
    return acc;
  }, {} as Record<string, { category: typeof categories[0], items: GalleryItem[] }>);

  const toggleCategory = (categoryValue: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryValue)) {
      newExpanded.delete(categoryValue);
    } else {
      newExpanded.add(categoryValue);
    }
    setExpandedCategories(newExpanded);
  };

  const isVideoFile = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const getFileType = (url: string) => {
    if (!url) return 'image';
    if (isVideoFile(url)) return 'video';
    return 'image';
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Galeri</h1>
        <div className="flex gap-3">
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Liste
            </button>
          </div>
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Toplu Yükle
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Yeni Resim
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Galeri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>{category.icon} {category.label}</option>
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
              setFilterCategory('');
              setFilterEvent('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Temizle
          </button>
        </div>
      </div>

      {/* Gallery Content */}
      {viewMode === 'category' ? (
        <div className="space-y-4">
          {Object.values(groupedByCategory).map(({ category, items }) => (
            <div key={category.value} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleCategory(category.value)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.label}</h3>
                    <p className="text-sm text-gray-500">{items.length} öğe</p>
                  </div>
                </div>
                {expandedCategories.has(category.value) ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {expandedCategories.has(category.value) && (
                <div className="border-t border-gray-200 p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {items.map((item) => {
                      const fileType = getFileType(item.imageUrl);
                      return (
                        <div key={item.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
                            {fileType === 'video' ? (
                              <div className="relative w-full h-48 bg-black">
                                <video
                                  src={item.imageUrl}
                                  className="w-full h-full object-cover"
                                  controls={false}
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                  <Play className="w-12 h-12 text-white" fill="white" />
                                </div>
                                <button
                                  onClick={() => openViewModal(item)}
                                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                                >
                                  <Eye className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ) : (
                              <>
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-48 object-cover cursor-pointer"
                                    onClick={() => openViewModal(item)}
                                    onError={(e) => {
                                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                    <Image className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                                <button
                                  onClick={() => openViewModal(item)}
                                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                                >
                                  <Eye className="w-4 h-4 text-white" />
                                </button>
                              </>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">{item.title}</h4>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{formatFileSize(item.fileSize || 0)}</span>
                              <span>{formatDate(item.uploadDate || item.createdAt || item.created_at || new Date().toISOString())}</span>
                            </div>
                            <div className="flex justify-end space-x-2 mt-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="text-red-600 hover:text-red-900 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          {Object.keys(groupedByCategory).length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Kategori bulunamadı</p>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                    {getCategoryIcon(item.category)} {getCategoryText(item.category)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.isPublic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.isPublic ? 'Herkese Açık' : 'Özel'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.uploadDate || item.createdAt || item.created_at || new Date().toISOString())}
                  </div>
                  {item.fileSize && (
                    <span>{formatFileSize(item.fileSize)}</span>
                  )}
                </div>
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => openViewModal(item)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(item)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Başlık
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yüklenme Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boyut
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
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                        {getCategoryIcon(item.category)} {getCategoryText(item.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(item.uploadDate || item.createdAt || item.created_at || new Date().toISOString())}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.fileSize ? formatFileSize(item.fileSize) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isPublic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.isPublic ? 'Herkese Açık' : 'Özel'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openViewModal(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(item)}
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
      )}

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
              {selectedItem ? 'Galeri Öğesi Düzenle' : 'Yeni Galeri Öğesi Ekle'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resim Yükle veya URL Gir *</label>
                <div className="space-y-2">
                  <div>
                    <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="w-5 h-5 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {uploading ? 'Yükleniyor...' : 'Dosya Seç'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff,image/x-icon,image/heic,image/heif,image/avif,video/mp4,video/webm,video/ogg,video/quicktime"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                  <div className="text-sm text-gray-500 text-center">veya</div>
                <input
                  type="url"
                    value={newItem.imageUrl || ''}
                  onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {newItem.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={newItem.imageUrl}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.icon} {category.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiketler</label>
                <input
                  type="text"
                  value={newItem.tags || ''}
                  onChange={(e) => setNewItem({...newItem, tags: e.target.value})}
                  placeholder="etiket1, etiket2, etiket3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik *</label>
                <select
                  value={newItem.eventId || ''}
                  onChange={(e) => setNewItem({...newItem, eventId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Etkinlik Seçin</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newItem.isPublic}
                  onChange={(e) => setNewItem({...newItem, isPublic: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                  Herkese açık
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={selectedItem ? handleUpdateItem : handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedItem ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Galeri Öğesi Detayları</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                {selectedItem.imageUrl ? (
                  getFileType(selectedItem.imageUrl) === 'video' ? (
                    <div className="w-full rounded-lg overflow-hidden bg-black">
                      <video
                        src={selectedItem.imageUrl}
                        controls
                        className="w-full h-auto max-h-96"
                        preload="metadata"
                      >
                        Tarayıcınız video oynatmayı desteklemiyor.
                      </video>
                    </div>
                  ) : (
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Image className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Başlık</label>
                  <p className="text-lg font-semibold">{selectedItem.title}</p>
                </div>
                
                {selectedItem.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                    <p className="text-gray-900">{selectedItem.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kategori</label>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(selectedItem.category)}`}>
                      {getCategoryIcon(selectedItem.category)} {getCategoryText(selectedItem.category)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedItem.isPublic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedItem.isPublic ? 'Herkese Açık' : 'Özel'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Yüklenme Tarihi</label>
                  <p className="text-gray-900">{formatDate(selectedItem.uploadDate || selectedItem.createdAt || selectedItem.created_at || new Date().toISOString())}</p>
                </div>
                
                {selectedItem.fileSize && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dosya Boyutu</label>
                    <p className="text-gray-900">{formatFileSize(selectedItem.fileSize)}</p>
                  </div>
                )}
                
                {selectedItem.dimensions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Boyutlar</label>
                    <p className="text-gray-900">{selectedItem.dimensions}</p>
                  </div>
                )}
                
                {selectedItem.tags && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Etiketler</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedItem.tags.split(',').map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
      {showDeleteModal && selectedItem && (
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Galeri Öğesi Sil</h2>
            <p className="text-gray-600 mb-6">
              "{selectedItem.title}" galeri öğesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
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
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Toplu Fotoğraf Yükle</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosyalar Seç (Maksimum 10) *
                </label>
                <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="w-8 h-8 mr-2 text-gray-500" />
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-600">
                      {selectedFiles.length > 0 
                        ? `${selectedFiles.length} dosya seçildi` 
                        : 'Dosya Seç veya Sürükle-Bırak'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF, MP4, WebM, OGG, QuickTime
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff,image/x-icon,image/heic,image/heif,image/avif,video/mp4,video/webm,video/ogg,video/quicktime"
                    className="hidden"
                    onChange={handleBulkFileSelect}
                    disabled={bulkUploading}
                  />
                </label>
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          onClick={() => {
                            setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                          }}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                <select
                  value={bulkUploadCategory}
                  onChange={(e) => setBulkUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik *</label>
                <select
                  value={bulkUploadEventId}
                  onChange={(e) => setBulkUploadEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Etkinlik Seçin</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>

              {bulkUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${bulkUploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setSelectedFiles([]);
                  setBulkUploadCategory('general');
                  setBulkUploadEventId('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={bulkUploading}
              >
                İptal
              </button>
              <button
                onClick={handleBulkUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                disabled={bulkUploading || selectedFiles.length === 0 || !bulkUploadEventId}
              >
                {bulkUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Yükle ({selectedFiles.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;