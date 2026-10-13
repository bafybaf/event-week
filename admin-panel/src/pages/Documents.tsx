import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Download, Calendar, Filter, Search, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi, eventsApi } from '../services/api.ts';

interface Document {
  id: number;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  category: string;
  tags: string;
  isPublic: boolean;
  downloadCount: number;
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

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterType, setFilterType] = useState('');

  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileName: '', // fileName ekle
    fileType: 'pdf',
    fileSize: 0, // fileSize ekle
    category: 'general',
    tags: '',
    isPublic: true,
    eventId: '',
    notes: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const categories = [
    { value: 'general', label: 'Genel' },
    { value: 'agenda', label: 'Gündem' },
    { value: 'presentation', label: 'Sunum' },
    { value: 'handout', label: 'El Kitabı' },
    { value: 'brochure', label: 'Broşür' },
    { value: 'manual', label: 'Kılavuz' },
    { value: 'report', label: 'Rapor' },
    { value: 'certificate', label: 'Sertifika' },
    { value: 'form', label: 'Form' },
    { value: 'policy', label: 'Politika' },
    { value: 'contract', label: 'Sözleşme' },
    { value: 'invoice', label: 'Fatura' }
  ];

  const fileTypes = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'doc', label: 'Word', icon: '📝' },
    { value: 'docx', label: 'Word', icon: '📝' },
    { value: 'xls', label: 'Excel', icon: '📊' },
    { value: 'xlsx', label: 'Excel', icon: '📊' },
    { value: 'ppt', label: 'PowerPoint', icon: '📽️' },
    { value: 'pptx', label: 'PowerPoint', icon: '📽️' },
    { value: 'txt', label: 'Metin', icon: '📄' },
    { value: 'zip', label: 'ZIP', icon: '🗜️' },
    { value: 'rar', label: 'RAR', icon: '🗜️' },
    { value: 'image', label: 'Resim', icon: '🖼️' },
    { value: 'other', label: 'Diğer', icon: '📁' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [filterEvent]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const eventId = filterEvent || undefined;
      const data = await documentsApi.getDocuments(eventId);
      const documentsList = Array.isArray(data) ? data : [];
      
      // Tarih alanlarını normalize et (created_at, createdAt, uploadDate)
      const normalizedDocuments = documentsList.map((doc: any) => ({
        ...doc,
        uploadDate: doc.uploadDate || doc.created_at || doc.createdAt || doc.upload_date || null,
      }));
      
      setDocuments(normalizedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Dokümanlar yüklenirken hata oluştu');
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
      formData.append('document', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/upload/document', {
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
        // Dosya adını URL'den çıkar
        const url = result.data.url;
        const fileName = file.name || url.split('/').pop() || 'document';
        
        setNewDocument({ 
          ...newDocument, 
          fileUrl: url,
          fileName: fileName, // fileName ekle
          fileType: result.data.mimetype?.includes('pdf') ? 'pdf' : 
                   result.data.mimetype?.includes('excel') || result.data.mimetype?.includes('spreadsheet') ? 'xlsx' :
                   result.data.category === 'document' ? 'pdf' : result.data.category,
          fileSize: result.data.size || file.size
        });
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

  const handleAddDocument = async () => {
    // Form validasyonu
    if (!newDocument.title.trim()) {
      toast.error('Başlık zorunludur');
      return;
    }
    if (!newDocument.fileUrl.trim()) {
      toast.error('Dosya URL zorunludur');
      return;
    }
    if (!newDocument.fileType) {
      toast.error('Dosya türü zorunludur');
      return;
    }
    if (!newDocument.category) {
      toast.error('Kategori zorunludur');
      return;
    }
    if (!newDocument.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }

    try {
      await documentsApi.createDocument({
          title: newDocument.title,
          description: newDocument.description,
          fileUrl: newDocument.fileUrl,
          fileName: newDocument.fileName || newDocument.fileUrl.split('/').pop() || 'document', // fileName zorunlu
          fileType: newDocument.fileType,
          fileSize: newDocument.fileSize || 0,
          category: newDocument.category,
          tags: newDocument.tags,
          isPublic: newDocument.isPublic,
          eventId: String(newDocument.eventId),
          notes: newDocument.notes
      });
        toast.success('Doküman başarıyla eklendi');
        setShowModal(false);
        resetForm();
        fetchDocuments();
    } catch (error: any) {
      console.error('Error adding document:', error);
      toast.error(error.message || 'Doküman eklenirken hata oluştu');
    }
  };

  const handleUpdateDocument = async () => {
    if (!selectedDocument) return;

    try {
      await documentsApi.updateDocument(String(selectedDocument.id), {
          title: newDocument.title,
          description: newDocument.description,
          fileUrl: newDocument.fileUrl,
          fileName: newDocument.fileName || newDocument.fileUrl.split('/').pop() || 'document',
          fileType: newDocument.fileType,
          fileSize: newDocument.fileSize || 0,
          category: newDocument.category,
          tags: newDocument.tags,
          isPublic: newDocument.isPublic,
          eventId: String(newDocument.eventId),
          notes: newDocument.notes
      });
        toast.success('Doküman başarıyla güncellendi');
        setShowModal(false);
        setSelectedDocument(null);
        fetchDocuments();
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast.error(error.message || 'Doküman güncellenirken hata oluştu');
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;

    try {
      await documentsApi.deleteDocument(String(selectedDocument.id));
        toast.success('Doküman başarıyla silindi');
        setShowDeleteModal(false);
        setSelectedDocument(null);
        fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(error.message || 'Doküman silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setNewDocument({
      title: '',
      description: '',
      fileUrl: '',
      fileName: '',
      fileType: 'pdf',
      fileSize: 0,
      category: 'general',
      tags: '',
      isPublic: true,
      eventId: '',
      notes: ''
    });
  };

  const openEditModal = (document: Document) => {
    setSelectedDocument(document);
    setNewDocument({
      title: document.title,
      description: document.description,
      fileUrl: document.fileUrl,
      fileName: (document as any).fileName || document.fileUrl.split('/').pop() || 'document',
      fileType: document.fileType,
      fileSize: document.fileSize || 0,
      category: document.category,
      tags: document.tags,
      isPublic: document.isPublic,
      eventId: document.eventId.toString(),
      notes: ''
    });
    setShowModal(true);
  };

  const openViewModal = (document: Document) => {
    setSelectedDocument(document);
    setShowViewModal(true);
  };

  const openDeleteModal = (document: Document) => {
    setSelectedDocument(document);
    setShowDeleteModal(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'agenda': return 'bg-blue-100 text-blue-800';
      case 'presentation': return 'bg-green-100 text-green-800';
      case 'handout': return 'bg-purple-100 text-purple-800';
      case 'brochure': return 'bg-orange-100 text-orange-800';
      case 'manual': return 'bg-pink-100 text-pink-800';
      case 'report': return 'bg-yellow-100 text-yellow-800';
      case 'certificate': return 'bg-indigo-100 text-indigo-800';
      case 'form': return 'bg-red-100 text-red-800';
      case 'policy': return 'bg-gray-100 text-gray-800';
      case 'contract': return 'bg-teal-100 text-teal-800';
      case 'invoice': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryText = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Tarih yok';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Geçersiz tarih';
      }
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    return fileTypes.find(f => f.value === fileType)?.icon || '📁';
  };

  const getFileTypeText = (fileType: string) => {
    return fileTypes.find(f => f.value === fileType)?.label || fileType.toUpperCase();
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    // Null, undefined veya geçersiz değer kontrolü
    if (!bytes || bytes === 0 || isNaN(bytes) || !isFinite(bytes)) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tags.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || document.category === filterCategory;
    const matchesEvent = !filterEvent || document.eventId.toString() === filterEvent;
    const matchesType = !filterType || document.fileType === filterType;
    
    return matchesSearch && matchesCategory && matchesEvent && matchesType;
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
        <h1 className="text-3xl font-bold text-gray-900">Dokümanlar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Doküman
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Doküman ara..."
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
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Dosya Tipleri</option>
            {fileTypes.map(type => (
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
              setFilterCategory('');
              setFilterEvent('');
              setFilterType('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Temizle
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doküman
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boyut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yüklenme Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İndirme
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
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-lg">{getFileTypeIcon(document.fileType)}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{document.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{document.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {getFileTypeText(document.fileType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(document.category)}`}>
                      {getCategoryText(document.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {document.fileSize ? formatFileSize(document.fileSize) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(document.uploadDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4 text-gray-400" />
                      {document.downloadCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${document.isPublic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {document.isPublic ? 'Herkese Açık' : 'Özel'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(document)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(document)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(document)}
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
              {selectedDocument ? 'Doküman Düzenle' : 'Yeni Doküman Ekle'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosya Yükle veya URL Gir *</label>
                <div className="space-y-2">
                  <div>
                    <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="w-5 h-5 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {uploading ? 'Yükleniyor...' : 'Dosya Seç (PDF, Excel, Word)'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
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
                  value={newDocument.fileUrl}
                  onChange={(e) => setNewDocument({...newDocument, fileUrl: e.target.value})}
                  placeholder="https://example.com/document.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosya Tipi</label>
                  <select
                    value={newDocument.fileType}
                    onChange={(e) => setNewDocument({...newDocument, fileType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {fileTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={newDocument.category}
                    onChange={(e) => setNewDocument({...newDocument, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiketler</label>
                <input
                  type="text"
                  value={newDocument.tags}
                  onChange={(e) => setNewDocument({...newDocument, tags: e.target.value})}
                  placeholder="etiket1, etiket2, etiket3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik *</label>
                <select
                  value={newDocument.eventId}
                  onChange={(e) => setNewDocument({...newDocument, eventId: e.target.value})}
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
                  checked={newDocument.isPublic}
                  onChange={(e) => setNewDocument({...newDocument, isPublic: e.target.checked})}
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
                  setSelectedDocument(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={selectedDocument ? handleUpdateDocument : handleAddDocument}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedDocument ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDocument && (
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
            <h2 className="text-2xl font-bold mb-4">Doküman Detayları</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl">{getFileTypeIcon(selectedDocument.fileType)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedDocument.title}</h3>
                  <p className="text-sm text-gray-600">{getFileTypeText(selectedDocument.fileType)}</p>
                </div>
              </div>
              
              {selectedDocument.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <p className="text-gray-900">{selectedDocument.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(selectedDocument.category)}`}>
                    {getCategoryText(selectedDocument.category)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Durum</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedDocument.isPublic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {selectedDocument.isPublic ? 'Herkese Açık' : 'Özel'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dosya Boyutu</label>
                  <p className="text-gray-900">{selectedDocument.fileSize ? formatFileSize(selectedDocument.fileSize) : 'Bilinmiyor'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">İndirme Sayısı</label>
                  <p className="text-gray-900">{selectedDocument.downloadCount || 0}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Yüklenme Tarihi</label>
                <p className="text-gray-900">{formatDate(selectedDocument.uploadDate)}</p>
              </div>
              
              {selectedDocument.tags && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etiketler</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDocument.tags.split(',').map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Dosya URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedDocument.fileUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    İndir
                  </button>
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
      {showDeleteModal && selectedDocument && (
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
            <h2 className="text-xl font-bold mb-4">Doküman Sil</h2>
            <p className="text-gray-600 mb-6">
              "{selectedDocument.title}" dokümanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteDocument}
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

export default Documents;