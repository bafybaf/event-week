import React, { useEffect, useState } from 'react';
import { FileText, Plus, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventsApi, programsApi } from '../services/api.ts';

interface Event {
  id: number | string;
  name: string;
}

interface ProgramPdf {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  pdfUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt?: string;
}

const Programs: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [programs, setPrograms] = useState<ProgramPdf[]>([]);
  const [filterEvent, setFilterEvent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    eventId: '',
    title: '',
    pdfUrl: '',
    fileName: '',
    fileSize: 0
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [filterEvent]);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents((data.events || data) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const loadPrograms = async () => {
    try {
      const data = await programsApi.getPrograms(filterEvent || undefined);
      const pdfPrograms = (data || []).filter((p: any) => p.pdfUrl);
      setPrograms(pdfPrograms);
    } catch (error: any) {
      toast.error(error.message || 'Programlar yüklenemedi');
      setPrograms([]);
    }
  };

  const getEventName = (eventId?: string) => {
    const event = events.find((e) => String(e.id) === String(eventId));
    return event ? event.name : '';
  };

  const getPdfHref = (pdfUrl?: string) => {
    if (!pdfUrl) return '';
    const uploadsIndex = pdfUrl.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      return `http://localhost:3000${pdfUrl.slice(uploadsIndex)}`;
    }
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      return pdfUrl.replace('localhost:3001', 'localhost:3000').replace('127.0.0.1:3001', '127.0.0.1:3000');
    }
    return `http://localhost:3000/${pdfUrl.replace(/^\//, '')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const resetForm = () => {
    setForm({
      eventId: filterEvent || '',
      title: '',
      pdfUrl: '',
      fileName: '',
      fileSize: 0
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Sadece PDF yükleyebilirsiniz');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', file);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/document', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Yükleme başarısız');
      }

      const uploadedUrl = String(result.data.url || '');
      const relativeUrl = uploadedUrl.includes('/uploads/')
        ? uploadedUrl.slice(uploadedUrl.indexOf('/uploads/'))
        : uploadedUrl;

      setForm((prev) => ({
        ...prev,
        pdfUrl: relativeUrl,
        fileName: file.name,
        fileSize: result.data.size || file.size,
        title: prev.title || file.name.replace(/\.pdf$/i, '')
      }));
      toast.success('PDF yüklendi');
    } catch (error: any) {
      toast.error(error.message || 'PDF yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }
    if (!form.pdfUrl) {
      toast.error('PDF yüklemeniz zorunludur');
      return;
    }

    try {
      setSaving(true);
      await programsApi.createProgram({
        eventId: String(form.eventId),
        title: form.title.trim() || form.fileName || 'Program',
        pdfUrl: form.pdfUrl,
        fileName: form.fileName,
        fileSize: form.fileSize
      });
      toast.success('Program PDF eklendi');
      setShowModal(false);
      resetForm();
      loadPrograms();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu program PDF\'ini silmek istiyor musunuz?')) return;
    try {
      await programsApi.deleteProgram(id);
      toast.success('Program silindi');
      loadPrograms();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Etkinlik seçip program PDF yükleyin. Katılımcılar uygulamada görüntüleyip yakınlaştırabilir.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          PDF Ekle
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tüm Etkinlikler</option>
          {events.map((event) => (
            <option key={event.id} value={String(event.id)}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((program) => (
          <div key={program.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-red-50 flex items-center justify-center">
                  <FileText className="text-red-600" size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{program.title}</h3>
                  <p className="text-sm text-blue-600">{getEventName(program.eventId)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {program.fileName || 'program.pdf'} • {formatFileSize(program.fileSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(program.id)}
                className="text-red-600 hover:text-red-800 p-1"
                title="Sil"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {program.pdfUrl && (
              <a
                href={getPdfHref(program.pdfUrl)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm text-blue-600 hover:underline"
              >
                PDF'i aç
              </a>
            )}
          </div>
        ))}
      </div>

      {programs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          Bu filtre için program PDF'i yok. Etkinlik seçip PDF ekleyin.
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Program PDF Ekle</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik *</label>
                  <select
                    value={form.eventId}
                    onChange={(e) => setForm({ ...form, eventId: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700">Başlık</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Örn. Event Week Programı"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">PDF *</label>
                  <label className="mt-1 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <Upload className="text-gray-400 mb-2" size={24} />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Yükleniyor...' : form.fileName || 'PDF seçin veya sürükleyin'}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploading || saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Programs;
