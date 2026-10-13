import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, BarChart3, Calendar, Filter, Search, Users, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { surveysApi, eventsApi } from '../services/api.ts';

interface Survey {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  questions: string;
  responseCount: number;
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

const Surveys: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    questions: '',
    eventId: '',
    notes: '',
    maxResponses: '',
    type: 'feedback'
  });

  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  const surveyStatuses = [
    { value: 'draft', label: 'Taslak', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800' },
    { value: 'paused', label: 'Duraklatıldı', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Tamamlandı', color: 'bg-blue-100 text-blue-800' },
    { value: 'cancelled', label: 'İptal Edildi', color: 'bg-red-100 text-red-800' }
  ];

  // QuestionForm Component
  const QuestionForm: React.FC<{ question: any; onSave: (q: any) => void; onCancel: () => void }> = ({ question, onSave, onCancel }) => {
    const [formData, setFormData] = useState<any>(question || { type: 'text', question: '', required: false, options: [] });
    const [newOption, setNewOption] = useState('');

    const handleSave = () => {
      if (!formData.question.trim()) {
        toast.error('Soru metni zorunludur');
        return;
      }
      if (formData.type === 'multiple_choice' && (!formData.options || formData.options.length < 2)) {
        toast.error('Çoktan seçmeli sorular için en az 2 seçenek gerekir');
        return;
      }
      onSave(formData);
    };

    const addOption = () => {
      if (newOption.trim()) {
        setFormData({
          ...formData,
          options: [...(formData.options || []), newOption.trim()]
        });
        setNewOption('');
      }
    };

    const removeOption = (index: number) => {
      setFormData({
        ...formData,
        options: formData.options.filter((_: any, i: number) => i !== index)
      });
    };

    return (
      <div className="border border-blue-300 rounded-lg p-4 bg-blue-50 mb-3">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soru Metni *</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({...formData, question: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Soruyu buraya yazın..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soru Tipi</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value, options: e.target.value === 'multiple_choice' ? (formData.options || []) : []})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Metin</option>
              <option value="multiple_choice">Çoktan Seçmeli</option>
              <option value="rating">Değerlendirme (1-5)</option>
            </select>
          </div>

          {formData.type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seçenekler</label>
              <div className="space-y-2 mb-2">
                {(formData.options || []).map((opt: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addOption()}
                  placeholder="Yeni seçenek ekle..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.required || false}
              onChange={(e) => setFormData({...formData, required: e.target.checked})}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Zorunlu soru</label>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kaydet
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [filterEvent]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const eventId = filterEvent || undefined;
      const data = await surveysApi.getSurveys(eventId);
      const surveysList = Array.isArray(data) ? data : [];
      
      // Map backend fields to frontend format
      const mappedSurveys = surveysList.map((survey: any) => ({
        ...survey,
        responseCount: survey.currentResponses || survey.responseCount || 0
      }));
      
      setSurveys(mappedSurveys);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Anketler yüklenirken hata oluştu');
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

  const handleAddSurvey = async () => {
    // Form validasyonu
    if (!newSurvey.title.trim()) {
      toast.error('Başlık zorunludur');
      return;
    }
    if (!newSurvey.startDate) {
      toast.error('Başlangıç tarihi zorunludur');
      return;
    }
    if (!newSurvey.endDate) {
      toast.error('Bitiş tarihi zorunludur');
      return;
    }
    if (!newSurvey.eventId) {
      toast.error('Etkinlik seçimi zorunludur');
      return;
    }
    if (questionsList.length === 0 && !newSurvey.questions) {
      toast.error('En az bir soru eklemelisiniz');
      return;
    }

    // Use questionsList if available, otherwise parse from JSON
    let questionsToSend = questionsList;
    if (questionsList.length === 0 && newSurvey.questions) {
      try {
        questionsToSend = JSON.parse(newSurvey.questions);
      } catch (e) {
        toast.error('Sorular geçersiz JSON formatında');
        return;
      }
    }

    try {
      await surveysApi.createSurvey({
          title: newSurvey.title,
          description: newSurvey.description,
          startDate: newSurvey.startDate,
          endDate: newSurvey.endDate,
          status: newSurvey.status,
          type: newSurvey.type,
          questions: questionsToSend,
          eventId: parseInt(newSurvey.eventId),
          maxResponses: newSurvey.maxResponses ? parseInt(newSurvey.maxResponses) : null,
          notes: newSurvey.notes
      });
        toast.success('Anket başarıyla eklendi');
        setShowModal(false);
        resetForm();
        fetchSurveys();
    } catch (error: any) {
      console.error('Error adding survey:', error);
      toast.error(error.message || 'Anket eklenirken hata oluştu');
    }
  };

  const handleUpdateSurvey = async () => {
    if (!selectedSurvey) return;

    // Use questionsList if available, otherwise parse from JSON
    let questionsToSend = questionsList;
    if (questionsList.length === 0 && newSurvey.questions) {
      try {
        questionsToSend = JSON.parse(newSurvey.questions);
      } catch (e) {
        toast.error('Sorular geçersiz JSON formatında');
        return;
      }
    }

    try {
      await surveysApi.updateSurvey(String(selectedSurvey.id), {
          title: newSurvey.title,
          description: newSurvey.description,
          startDate: newSurvey.startDate,
          endDate: newSurvey.endDate,
          status: newSurvey.status,
          type: newSurvey.type,
          questions: questionsToSend,
          eventId: parseInt(newSurvey.eventId),
          maxResponses: newSurvey.maxResponses ? parseInt(newSurvey.maxResponses) : null,
          notes: newSurvey.notes
      });
        toast.success('Anket başarıyla güncellendi');
        setShowModal(false);
        setSelectedSurvey(null);
        resetForm();
        fetchSurveys();
    } catch (error: any) {
      console.error('Error updating survey:', error);
      toast.error(error.message || 'Anket güncellenirken hata oluştu');
    }
  };

  const handleDeleteSurvey = async () => {
    if (!selectedSurvey) return;

    try {
      await surveysApi.deleteSurvey(String(selectedSurvey.id));
        toast.success('Anket başarıyla silindi');
        setShowDeleteModal(false);
        setSelectedSurvey(null);
        fetchSurveys();
    } catch (error: any) {
      console.error('Error deleting survey:', error);
      toast.error(error.message || 'Anket silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setNewSurvey({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'draft',
      questions: '',
      eventId: '',
      notes: '',
      maxResponses: '',
      type: 'feedback'
    });
    setQuestionsList([]);
    setEditingQuestionIndex(null);
  };

  const openEditModal = (survey: Survey) => {
    setSelectedSurvey(survey);
    const eventId = survey.event?.id || survey.eventId;
    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(survey.questions);
    } catch (e) {
      parsedQuestions = [];
    }
    setQuestionsList(parsedQuestions);
    setNewSurvey({
      title: survey.title,
      description: survey.description,
      startDate: survey.startDate.split('T')[0],
      endDate: survey.endDate.split('T')[0],
      status: survey.status,
      questions: survey.questions,
      eventId: eventId ? eventId.toString() : '',
      notes: '',
      maxResponses: '',
      type: 'feedback'
    });
    setShowModal(true);
  };

  const openViewModal = (survey: Survey) => {
    setSelectedSurvey(survey);
    setShowViewModal(true);
  };

  const openDeleteModal = (survey: Survey) => {
    setSelectedSurvey(survey);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status: string) => {
    const statusObj = surveyStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusObj = surveyStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getEventName = (survey: Survey) => {
    if (survey.event?.name) {
      return survey.event.name;
    }
    const eventId = survey.eventId;
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Bilinmeyen Etkinlik';
  };

  const isSurveyActive = (survey: Survey) => {
    const now = new Date();
    const startDate = new Date(survey.startDate);
    const endDate = new Date(survey.endDate);
    return survey.status === 'active' && now >= startDate && now <= endDate;
  };

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || survey.status === filterStatus;
    const matchesEvent = !filterEvent || survey.eventId.toString() === filterEvent;
    
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
        <h1 className="text-3xl font-bold text-gray-900">Anketler</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Anket
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Anket ara..."
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
            {surveyStatuses.map(status => (
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

      {/* Surveys Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etkinlik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih Aralığı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yanıt Sayısı
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
              {filteredSurveys.map((survey) => (
                <tr key={survey.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{survey.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{survey.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getEventName(survey)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(survey.startDate).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-gray-500">
                        {new Date(survey.endDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {survey.responseCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(survey.status)}`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(survey.status)}
                        {getStatusText(survey.status)}
                      </span>
                    </span>
                    {isSurveyActive(survey) && (
                      <div className="mt-1">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Şu anda aktif
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(survey)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(survey)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(survey)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedSurvey ? 'Anket Düzenle' : 'Yeni Anket Ekle'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={newSurvey.title}
                  onChange={(e) => setNewSurvey({...newSurvey, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey({...newSurvey, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    value={newSurvey.startDate}
                    onChange={(e) => setNewSurvey({...newSurvey, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    value={newSurvey.endDate}
                    onChange={(e) => setNewSurvey({...newSurvey, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anket Tipi</label>
                  <select
                    value={newSurvey.type}
                    onChange={(e) => setNewSurvey({...newSurvey, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="feedback">Geri Bildirim</option>
                    <option value="evaluation">Değerlendirme</option>
                    <option value="satisfaction">Memnuniyet</option>
                    <option value="quiz">Quiz</option>
                    <option value="poll">Anket</option>
                    <option value="registration">Kayıt</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    value={newSurvey.status}
                    onChange={(e) => setNewSurvey({...newSurvey, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {surveyStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Yanıt Sayısı</label>
                <input
                  type="number"
                  value={newSurvey.maxResponses}
                  onChange={(e) => setNewSurvey({...newSurvey, maxResponses: e.target.value})}
                  placeholder="Sınırsız için boş bırakın"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sorular</label>
                
                {/* Questions List */}
                <div className="space-y-3 mb-3">
                  {questionsList.map((q, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Soru {index + 1}: {q.question || 'Yeni Soru'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Tip: {q.type === 'text' ? 'Metin' : q.type === 'multiple_choice' ? 'Çoktan Seçmeli' : q.type === 'rating' ? 'Değerlendirme' : q.type}
                            {q.required && ' • Zorunlu'}
                          </div>
                          {q.type === 'multiple_choice' && q.options && (
                            <div className="text-xs text-gray-500 mt-1">
                              Seçenekler: {q.options.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newList = [...questionsList];
                              newList[index] = { ...q };
                              setEditingQuestionIndex(index);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => {
                              const newList = questionsList.filter((_, i) => i !== index);
                              setQuestionsList(newList);
                              setNewSurvey({...newSurvey, questions: JSON.stringify(newList)});
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add/Edit Question Form */}
                {editingQuestionIndex !== null ? (
                  <QuestionForm
                    question={questionsList[editingQuestionIndex]}
                    onSave={(question) => {
                      const newList = [...questionsList];
                      newList[editingQuestionIndex] = question;
                      setQuestionsList(newList);
                      setNewSurvey({...newSurvey, questions: JSON.stringify(newList)});
                      setEditingQuestionIndex(null);
                    }}
                    onCancel={() => setEditingQuestionIndex(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestionIndex(questionsList.length);
                      setQuestionsList([...questionsList, { type: 'text', question: '', required: false }]);
                    }}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    + Soru Ekle
                  </button>
                )}

                {/* JSON Editor (Advanced) */}
                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    Gelişmiş: JSON Düzenleyici
                  </summary>
                  <textarea
                    value={newSurvey.questions}
                    onChange={(e) => {
                      setNewSurvey({...newSurvey, questions: e.target.value});
                      try {
                        const parsed = JSON.parse(e.target.value);
                        if (Array.isArray(parsed)) {
                          setQuestionsList(parsed);
                        }
                      } catch (e) {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={6}
                    placeholder='[{"type": "text", "question": "Adınız nedir?", "required": true}, {"type": "multiple_choice", "question": "En sevdiğiniz renk?", "options": ["Kırmızı", "Mavi", "Yeşil"], "required": false}]'
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </details>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik *</label>
                <select
                  value={newSurvey.eventId}
                  onChange={(e) => setNewSurvey({...newSurvey, eventId: e.target.value})}
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
                  setSelectedSurvey(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={selectedSurvey ? handleUpdateSurvey : handleAddSurvey}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedSurvey ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Anket Detayları</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Başlık</label>
                <p className="text-lg font-semibold">{selectedSurvey.title}</p>
              </div>
              
              {selectedSurvey.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <p className="text-gray-900">{selectedSurvey.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedSurvey.startDate).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                  <p className="text-gray-900">{new Date(selectedSurvey.endDate).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Durum</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedSurvey.status)}`}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(selectedSurvey.status)}
                      {getStatusText(selectedSurvey.status)}
                    </span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Yanıt Sayısı</label>
                  <p className="text-gray-900">{selectedSurvey.responseCount || 0}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Etkinlik</label>
                <p className="text-gray-900">{getEventName(selectedSurvey)}</p>
              </div>
              
              {selectedSurvey.questions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sorular</label>
                  <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedSurvey.questions), null, 2)}
                    </pre>
                  </div>
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
      {showDeleteModal && selectedSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Anket Sil</h2>
            <p className="text-gray-600 mb-6">
              "{selectedSurvey.title}" anketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteSurvey}
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

export default Surveys;