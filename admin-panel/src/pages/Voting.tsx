import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, BarChart3, Users, Calendar, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { programsApi, eventsApi, votingApi } from '../services/api.ts';

interface VoteOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface Voting {
  id: string;
  title: string;
  description: string;
  type: 'single' | 'multiple';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  options: VoteOption[];
  totalVotes: number;
  participants: number;
  isPublic: boolean;
  allowAnonymous: boolean;
  createdAt: string;
}

interface Event {
  id: number;
  name: string;
}

const Voting: React.FC = () => {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedVoting, setSelectedVoting] = useState<Voting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [newVoting, setNewVoting] = useState<Partial<Voting>>({
    title: '',
    description: '',
    type: 'single',
    status: 'draft',
    startDate: '',
    endDate: '',
    options: [],
    isPublic: true,
    allowAnonymous: false
  });

  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventsApi.getEvents();
        setEvents((data.events || data) || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchEvents();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAddModal || showEditModal || showResultsModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
    };
  }, [showAddModal, showEditModal, showResultsModal]);

  useEffect(() => {
    const loadVotings = async () => {
      try {
        // Programs üzerinden voting enabled olanları getir
        const eventId = filterEvent || undefined;
        const programs = await programsApi.getPrograms(eventId);
        const votingPrograms = programs.filter((p: any) => p.isVotingEnabled && p.votingQuestion);
        
        // Her program için oyları çek ve istatistikleri hesapla
        const mapped: Voting[] = await Promise.all(
          votingPrograms.map(async (p: any) => {
            try {
              // Bu program için oyları al
              const votesData = await votingApi.getVotings(p.id);
              const votesList = Array.isArray(votesData.votes) ? votesData.votes : (Array.isArray(votesData) ? votesData : []);
              
              // Oyları option'lara göre grupla
              const optionsMap: { [key: string]: { id: string; text: string; votes: number } } = {};
              // votingOptions bir array olmayabilir, kontrol et ve array'e çevir
              let votingOptions: string[] = [];
              if (Array.isArray(p.votingOptions)) {
                votingOptions = p.votingOptions.filter(opt => opt != null && opt !== '').map(opt => String(opt).trim());
              } else if (typeof p.votingOptions === 'string') {
                // Eğer string ise, virgülle ayrılmış değerleri parse et
                votingOptions = p.votingOptions.split(',').map((opt: string) => opt.trim()).filter(Boolean);
              } else if (p.votingOptions != null) {
                // Diğer durumlarda, string'e çevirip parse et
                try {
                  const parsed = JSON.parse(String(p.votingOptions));
                  if (Array.isArray(parsed)) {
                    votingOptions = parsed.filter(opt => opt != null && opt !== '').map(opt => String(opt).trim());
                  } else {
                    votingOptions = String(p.votingOptions).split(',').map((opt: string) => opt.trim()).filter(Boolean);
                  }
                } catch {
                  // JSON parse başarısız olursa, direkt string'e çevir
                  votingOptions = String(p.votingOptions).split(',').map((opt: string) => opt.trim()).filter(Boolean);
                }
              }
              
              // votingOptions'ın array olduğundan emin ol
              if (!Array.isArray(votingOptions)) {
                console.error('votingOptions is not an array:', p.votingOptions, typeof p.votingOptions);
                votingOptions = [];
              }
              
              // Önce tüm seçenekleri ekle
              votingOptions.forEach((opt: string, idx: number) => {
                optionsMap[opt] = {
                  id: String(idx + 1),
                  text: opt,
                  votes: 0
                };
              });
              
              // Sonra oyları say
              votesList.forEach((vote: any) => {
                if (vote.selectedOption && optionsMap[vote.selectedOption]) {
                  optionsMap[vote.selectedOption].votes++;
                }
              });
              
              const options = Object.values(optionsMap);
              const totalVotes = votesList.length;
              
              // Benzersiz kullanıcı sayısını hesapla
              const uniqueUsers = new Set(votesList.map((v: any) => v.userId || v.user?.id).filter(Boolean));
              const participants = uniqueUsers.size;
              
              return {
                id: p.id,
                title: p.title,
                description: p.votingQuestion || p.description || '',
                type: 'single',
                status: p.status === 'completed' ? 'completed' : 
                       p.status === 'cancelled' ? 'cancelled' :
                       p.endTime && new Date(p.endTime) < new Date() ? 'completed' :
                       p.status === 'ongoing' ? 'active' : 'draft',
                startDate: p.startTime ? new Date(p.startTime).toISOString().slice(0, 10) : '',
                endDate: p.endTime ? new Date(p.endTime).toISOString().slice(0, 10) : '',
                options: options.map(opt => ({
                  ...opt,
                  percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
                })),
                totalVotes: totalVotes,
                participants: participants,
                isPublic: true,
                allowAnonymous: false,
                createdAt: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : ''
              };
            } catch (error) {
              console.error(`Error loading votes for program ${p.id}:`, error);
              // Hata durumunda boş oylarla devam et
              const votingOptions = p.votingOptions || [];
              return {
                id: p.id,
                title: p.title,
                description: p.votingQuestion || p.description || '',
                type: 'single',
                status: p.status === 'completed' ? 'completed' : 
                       p.status === 'cancelled' ? 'cancelled' :
                       p.status === 'ongoing' ? 'active' : 'draft',
                startDate: p.startTime ? new Date(p.startTime).toISOString().slice(0, 10) : '',
                endDate: p.endTime ? new Date(p.endTime).toISOString().slice(0, 10) : '',
                options: votingOptions.map((opt: string, idx: number) => ({
                  id: String(idx + 1),
                  text: opt,
                  votes: 0,
                  percentage: 0
                })),
                totalVotes: 0,
                participants: 0,
                isPublic: true,
                allowAnonymous: false,
                createdAt: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : ''
              };
            }
          })
        );
        
        setVotings(mapped);
      } catch (error: any) {
        console.error('Oylamalar yüklenirken hata:', error);
        toast.error(error.message || 'Oylamalar yüklenemedi');
      }
    };
    loadVotings();
  }, [filterEvent]);

  const filteredVotings = votings.filter(voting => {
    const matchesSearch = voting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         voting.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || voting.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Taslak';
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      default: return 'Bilinmiyor';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'single': return 'Tek Seçim';
      case 'multiple': return 'Çoklu Seçim';
      default: return 'Bilinmiyor';
    }
  };

  const handleAddOption = () => {
    const trimmedOption = newOption.trim();
    if (!trimmedOption) {
      toast.error('Lütfen seçenek metni giriniz');
      return;
    }
    if (newVoting.options?.some(opt => opt.text === trimmedOption)) {
      toast.error('Bu seçenek zaten eklenmiş');
      return;
    }
    const option: VoteOption = {
      id: Date.now().toString(),
      text: trimmedOption,
      votes: 0,
      percentage: 0
    };
    setNewVoting({
      ...newVoting,
      options: [...(newVoting.options || []), option]
    });
    setNewOption('');
    console.log('Option added, current options:', [...(newVoting.options || []), option]);
  };

  const handleRemoveOption = (optionId: string) => {
    setNewVoting({
      ...newVoting,
      options: newVoting.options?.filter(opt => opt.id !== optionId) || []
    });
  };

  const handleAddVoting = async () => {
    // Debug log
    console.log('handleAddVoting called with:', {
      title: newVoting.title,
      startDate: newVoting.startDate,
      endDate: newVoting.endDate,
      options: newVoting.options,
      optionsLength: newVoting.options?.length,
      filterEvent: filterEvent
    });

    // Detailed validation
    if (!newVoting.title || newVoting.title.trim() === '') {
      toast.error('Lütfen oylama başlığı giriniz');
      return;
    }
    if (!newVoting.startDate || newVoting.startDate.trim() === '') {
      toast.error('Lütfen başlangıç tarihi seçiniz');
      return;
    }
    if (!newVoting.endDate || newVoting.endDate.trim() === '') {
      toast.error('Lütfen bitiş tarihi seçiniz');
      return;
    }
    if (!newVoting.options || newVoting.options.length === 0) {
      toast.error('Lütfen en az bir oylama seçeneği ekleyiniz');
      console.error('Options validation failed:', newVoting.options);
      return;
    }
    // Validate that options have text
    const validOptions = newVoting.options.filter(opt => opt.text && opt.text.trim() !== '');
    if (validOptions.length === 0) {
      toast.error('Lütfen geçerli oylama seçenekleri ekleyiniz (boş seçenekler kabul edilmez)');
      console.error('No valid options found:', newVoting.options);
      return;
    }
    if (!filterEvent || filterEvent.trim() === '') {
      toast.error('Lütfen bir etkinlik seçin');
      return;
    }

    try {
      // Program olarak oluştur ve voting özelliklerini etkinleştir
      // Filter out empty options
      const optionsText = newVoting.options
        ?.filter(opt => opt.text && opt.text.trim() !== '')
        .map(opt => opt.text.trim()) || [];
      
      if (optionsText.length === 0) {
        toast.error('Lütfen geçerli oylama seçenekleri ekleyiniz');
        return;
      }
      // Status'u backend formatına çevir (draft -> scheduled, active -> ongoing)
      let programStatus = 'scheduled'; // default
      if (newVoting.status === 'active') {
        programStatus = 'ongoing';
      } else if (newVoting.status === 'completed') {
        programStatus = 'completed';
      } else if (newVoting.status === 'cancelled') {
        programStatus = 'cancelled';
      } else {
        programStatus = 'scheduled'; // draft -> scheduled
      }

      const payload = {
        eventId: filterEvent,
        title: newVoting.title,
        description: newVoting.description || '',
        date: newVoting.startDate,
        startTime: '09:00',
        endTime: '17:00',
        location: '',
        type: 'presentation',
        status: programStatus,
        isVotingEnabled: true,
        votingQuestion: newVoting.description || newVoting.title,
        votingOptions: optionsText,
        votingType: newVoting.type || 'single' // Çoklu seçim tipi
      };
      
      const created = await programsApi.createProgram(payload);
      const mapped: Voting = {
        id: created.id,
        title: created.title,
        description: created.votingQuestion || created.description || '',
        type: newVoting.type as any || 'single',
        status: 'draft',
        startDate: newVoting.startDate!,
        endDate: newVoting.endDate!,
        options: newVoting.options || [],
        totalVotes: 0,
        participants: 0,
        isPublic: newVoting.isPublic || true,
        allowAnonymous: newVoting.allowAnonymous || false,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      setVotings([...votings, mapped]);
      setNewVoting({
        title: '',
        description: '',
        type: 'single',
        status: 'draft',
        startDate: '',
        endDate: '',
        options: [],
        isPublic: true,
        allowAnonymous: false
      });
      setShowAddModal(false);
      toast.success('Oylama başarıyla eklendi');
    } catch (error: any) {
      toast.error(error.message || 'Oylama eklenemedi');
    }
  };

  const handleEditVoting = (voting: Voting) => {
    setSelectedVoting(voting);
    setNewVoting(voting);
    setShowEditModal(true);
  };

  const handleUpdateVoting = async () => {
    // Debug log
    console.log('handleUpdateVoting called with:', {
      selectedVoting: selectedVoting,
      title: newVoting.title,
      startDate: newVoting.startDate,
      endDate: newVoting.endDate,
      status: newVoting.status,
      type: newVoting.type,
      options: newVoting.options,
      optionsLength: newVoting.options?.length
    });

    if (!selectedVoting) {
      toast.error('Düzenlenecek oylama seçilmedi');
      return;
    }
    if (!newVoting.title || newVoting.title.trim() === '') {
      toast.error('Lütfen oylama başlığı giriniz');
      return;
    }
    if (!newVoting.startDate || newVoting.startDate.trim() === '') {
      toast.error('Lütfen başlangıç tarihi seçiniz');
      return;
    }
    if (!newVoting.endDate || newVoting.endDate.trim() === '') {
      toast.error('Lütfen bitiş tarihi seçiniz');
      return;
    }
    if (!newVoting.options || newVoting.options.length === 0) {
      toast.error('Lütfen en az bir oylama seçeneği ekleyiniz');
      return;
    }
    const validOptions = newVoting.options.filter(opt => opt.text && opt.text.trim() !== '');
    if (validOptions.length === 0) {
      toast.error('Lütfen geçerli oylama seçenekleri ekleyiniz (boş seçenekler kabul edilmez)');
      return;
    }

    try {
      // Filter out empty options
      const optionsText = newVoting.options
        ?.filter(opt => opt.text && opt.text.trim() !== '')
        .map(opt => opt.text.trim()) || [];
      
      if (optionsText.length === 0) {
        toast.error('Lütfen geçerli oylama seçenekleri ekleyiniz');
        return;
      }

      // Mevcut program bilgisini al
      let programData;
      try {
        programData = await programsApi.getProgram(selectedVoting.id);
      } catch (error) {
        console.error('Error fetching program:', error);
        toast.error('Program bilgisi alınamadı');
        return;
      }

      // Tarih formatını düzelt - ISO formatına çevir
      const startDateTime = new Date(`${newVoting.startDate}T09:00:00`);
      const endDateTime = new Date(`${newVoting.endDate}T17:00:00`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast.error('Geçersiz tarih formatı');
        return;
      }

      // Status'u backend formatına çevir (draft -> scheduled, active -> ongoing)
      let programStatus = 'scheduled'; // default
      if (newVoting.status === 'active') {
        programStatus = 'ongoing';
      } else if (newVoting.status === 'completed') {
        programStatus = 'completed';
      } else if (newVoting.status === 'cancelled') {
        programStatus = 'cancelled';
      } else {
        programStatus = 'scheduled'; // draft -> scheduled
      }

      const payload = {
        title: newVoting.title,
        description: newVoting.description || '',
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        status: programStatus,
        isVotingEnabled: true,
        votingQuestion: newVoting.description || newVoting.title,
        votingOptions: optionsText,
        votingType: newVoting.type || 'single', // Çoklu seçim tipi
        eventId: programData?.eventId || filterEvent
      };
      
      await programsApi.updateProgram(selectedVoting.id, payload);
      
      // Reload votings - gerçek verilerle
      const eventId = filterEvent || undefined;
      const programs = await programsApi.getPrograms(eventId);
      const votingPrograms = programs.filter((p: any) => p.isVotingEnabled && p.votingQuestion);
      
      const mapped: Voting[] = await Promise.all(
        votingPrograms.map(async (p: any) => {
          try {
            const votesData = await votingApi.getVotings(p.id);
            const votesList = Array.isArray(votesData.votes) ? votesData.votes : (Array.isArray(votesData) ? votesData : []);
            
            const optionsMap: { [key: string]: { id: string; text: string; votes: number } } = {};
            // votingOptions bir array olmayabilir, kontrol et ve array'e çevir
            let votingOptions: string[] = [];
            if (Array.isArray(p.votingOptions)) {
              votingOptions = p.votingOptions.filter(opt => opt != null && opt !== '').map(opt => String(opt).trim());
            } else if (typeof p.votingOptions === 'string') {
              // Eğer string ise, virgülle ayrılmış değerleri parse et
              votingOptions = p.votingOptions.split(',').map((opt: string) => opt.trim()).filter(Boolean);
            } else if (p.votingOptions != null) {
              // Diğer durumlarda, string'e çevirip parse et
              try {
                const parsed = JSON.parse(String(p.votingOptions));
                if (Array.isArray(parsed)) {
                  votingOptions = parsed.filter(opt => opt != null && opt !== '').map(opt => String(opt).trim());
                } else {
                  votingOptions = String(p.votingOptions).split(',').map((opt: string) => opt.trim()).filter(Boolean);
                }
              } catch {
                // JSON parse başarısız olursa, direkt string'e çevir
                votingOptions = String(p.votingOptions).split(',').map((opt: string) => opt.trim()).filter(Boolean);
              }
            }
            
            // votingOptions'ın array olduğundan emin ol
            if (!Array.isArray(votingOptions)) {
              console.error('votingOptions is not an array:', p.votingOptions, typeof p.votingOptions);
              votingOptions = [];
            }
            
            votingOptions.forEach((opt: string, idx: number) => {
              optionsMap[opt] = {
                id: String(idx + 1),
                text: opt,
                votes: 0
              };
            });
            
            votesList.forEach((vote: any) => {
              if (vote.selectedOption && optionsMap[vote.selectedOption]) {
                optionsMap[vote.selectedOption].votes++;
              }
            });
            
            const options = Object.values(optionsMap);
            const totalVotes = votesList.length;
            const uniqueUsers = new Set(votesList.map((v: any) => v.userId || v.user?.id).filter(Boolean));
            const participants = uniqueUsers.size;
            
            return {
              id: p.id,
              title: p.title,
              description: p.votingQuestion || p.description || '',
              type: 'single' as const,
              status: p.status === 'completed' ? 'completed' as const : 
                     p.status === 'cancelled' ? 'cancelled' as const :
                     p.endTime && new Date(p.endTime) < new Date() ? 'completed' as const :
                     p.status === 'ongoing' ? 'active' as const : 'draft' as const,
              startDate: p.startTime ? new Date(p.startTime).toISOString().slice(0, 10) : '',
              endDate: p.endTime ? new Date(p.endTime).toISOString().slice(0, 10) : '',
              options: options.map(opt => ({
                ...opt,
                percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
              })),
              totalVotes: totalVotes,
              participants: participants,
              isPublic: true,
              allowAnonymous: false,
              createdAt: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : ''
            };
          } catch (error) {
            console.error(`Error loading votes for program ${p.id}:`, error);
            const votingOptions = p.votingOptions || [];
            return {
              id: p.id,
              title: p.title,
              description: p.votingQuestion || p.description || '',
              type: 'single' as const,
              status: 'draft' as const,
              startDate: p.startTime ? new Date(p.startTime).toISOString().slice(0, 10) : '',
              endDate: p.endTime ? new Date(p.endTime).toISOString().slice(0, 10) : '',
              options: votingOptions.map((opt: string, idx: number) => ({
                id: String(idx + 1),
                text: opt,
                votes: 0,
                percentage: 0
              })),
              totalVotes: 0,
              participants: 0,
              isPublic: true,
              allowAnonymous: false,
              createdAt: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : ''
            };
          }
        })
      );
      setVotings(mapped);
      
      setShowEditModal(false);
      setSelectedVoting(null);
      setNewVoting({
        title: '',
        description: '',
        type: 'single',
        status: 'draft',
        startDate: '',
        endDate: '',
        options: []
      });
      toast.success('Oylama başarıyla güncellendi');
    } catch (error: any) {
      toast.error(error.message || 'Oylama güncellenemedi');
    }
  };

  const handleDeleteVoting = async (votingId: string) => {
    if (!window.confirm('Bu oylamayı silmek istediğinizden emin misiniz?')) return;
    try {
      await programsApi.deleteProgram(votingId);
      setVotings(votings.filter(voting => voting.id !== votingId));
      toast.success('Oylama başarıyla silindi');
    } catch (error: any) {
      toast.error(error.message || 'Oylama silinemedi');
    }
  };

  const handleViewResults = async (voting: Voting) => {
    try {
      // Oyları yeniden yükle
      const votesData = await votingApi.getVotings(voting.id);
      const votesList = Array.isArray(votesData.votes) ? votesData.votes : (Array.isArray(votesData) ? votesData : []);
      
      // Oyları option'lara göre grupla
      const optionsMap: { [key: string]: { id: string; text: string; votes: number } } = {};
      
      // Mevcut seçenekleri ekle
      voting.options.forEach((opt) => {
        optionsMap[opt.text] = {
          id: opt.id,
          text: opt.text,
          votes: 0
        };
      });
      
      // Oyları say
      votesList.forEach((vote: any) => {
        if (vote.selectedOption && optionsMap[vote.selectedOption]) {
          optionsMap[vote.selectedOption].votes++;
        }
      });
      
      const totalVotes = votesList.length;
      const uniqueUsers = new Set(votesList.map((v: any) => v.userId || v.user?.id).filter(Boolean));
      const participants = uniqueUsers.size;
      
      // Güncellenmiş voting objesi oluştur
      const updatedVoting: Voting = {
        ...voting,
        options: Object.values(optionsMap).map(opt => ({
          ...opt,
          percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
        })),
        totalVotes: totalVotes,
        participants: participants
      };
      
      setSelectedVoting(updatedVoting);
      setShowResultsModal(true);
    } catch (error: any) {
      console.error('Error loading vote results:', error);
      toast.error(error.message || 'Oylama sonuçları yüklenemedi');
      // Hata durumunda mevcut verilerle göster
      setSelectedVoting(voting);
      setShowResultsModal(true);
    }
  };

  const handleChangeStatus = (votingId: string, newStatus: string) => {
    setVotings(votings.map(voting => 
      voting.id === votingId 
        ? { ...voting, status: newStatus as any }
        : voting
    ));
    toast.success('Oylama durumu güncellendi');
  };

  return (
    <div className="space-y-6 [&>*:first-child]:mt-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oylama Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Oylamaları görüntüleyin ve yönetin
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Yeni Oylama
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Oylama ara..."
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
            <option value="draft">Taslak</option>
            <option value="active">Aktif</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
      </div>

      {/* Oylama Listesi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVotings.map((voting) => (
          <div key={voting.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{voting.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{voting.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(voting.status)}`}>
                    {getStatusText(voting.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {voting.startDate} - {voting.endDate}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Settings className="w-4 h-4 mr-2" />
                  {getTypeText(voting.type)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {voting.participants} katılımcı
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {voting.totalVotes} toplam oy
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewResults(voting)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Sonuçları Görüntüle"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleEditVoting(voting)}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Düzenle"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteVoting(voting.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {voting.status === 'draft' && (
                  <button
                    onClick={() => handleChangeStatus(voting.id, 'active')}
                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    Başlat
                  </button>
                )}
                
                {voting.status === 'active' && (
                  <button
                    onClick={() => handleChangeStatus(voting.id, 'completed')}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Bitir
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Oylama Ekleme Modal */}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Oylama Oluştur</h3>
              
              <div className="space-y-4">
                <div>
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
                  <label className="block text-sm font-medium text-gray-700">Oylama Başlığı *</label>
                  <input
                    type="text"
                    value={newVoting.title}
                    onChange={(e) => setNewVoting({ ...newVoting, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    value={newVoting.description}
                    onChange={(e) => setNewVoting({ ...newVoting, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi *</label>
                    <input
                      type="date"
                      value={newVoting.startDate}
                      onChange={(e) => setNewVoting({ ...newVoting, startDate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi *</label>
                    <input
                      type="date"
                      value={newVoting.endDate}
                      onChange={(e) => setNewVoting({ ...newVoting, endDate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Oylama Tipi</label>
                    <select
                      value={newVoting.type}
                      onChange={(e) => setNewVoting({ ...newVoting, type: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="single">Tek Seçim</option>
                      <option value="multiple">Çoklu Seçim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <select
                      value={newVoting.status}
                      onChange={(e) => setNewVoting({ ...newVoting, status: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Taslak</option>
                      <option value="active">Aktif</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Seçenekler *</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                      placeholder="Seçenek ekle..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {newVoting.options && newVoting.options.length > 0 ? (
                      newVoting.options.map((option) => (
                        <div key={option.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm">{option.text || '(Boş seçenek)'}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(option.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-red-600 italic">Henüz seçenek eklenmedi. Lütfen yukarıdan seçenek ekleyin.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newVoting.isPublic}
                      onChange={(e) => setNewVoting({ ...newVoting, isPublic: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Herkese açık</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newVoting.allowAnonymous}
                      onChange={(e) => setNewVoting({ ...newVoting, allowAnonymous: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Anonim oylamaya izin ver</span>
                  </label>
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
                  onClick={handleAddVoting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Oylama Düzenleme Modal */}
      {showEditModal && selectedVoting && (
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Oylama Düzenle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Oylama Başlığı *</label>
                  <input
                    type="text"
                    value={newVoting.title || ''}
                    onChange={(e) => setNewVoting({ ...newVoting, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    value={newVoting.description || ''}
                    onChange={(e) => setNewVoting({ ...newVoting, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi *</label>
                    <input
                      type="date"
                      value={newVoting.startDate || ''}
                      onChange={(e) => setNewVoting({ ...newVoting, startDate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi *</label>
                    <input
                      type="date"
                      value={newVoting.endDate || ''}
                      onChange={(e) => setNewVoting({ ...newVoting, endDate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Oylama Tipi</label>
                    <select
                      value={newVoting.type || 'single'}
                      onChange={(e) => setNewVoting({ ...newVoting, type: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="single">Tek Seçim</option>
                      <option value="multiple">Çoklu Seçim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <select
                      value={newVoting.status || 'draft'}
                      onChange={(e) => setNewVoting({ ...newVoting, status: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Taslak</option>
                      <option value="active">Aktif</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Seçenekler *</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                      placeholder="Seçenek ekle..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {newVoting.options && newVoting.options.length > 0 ? (
                      newVoting.options.map((option) => (
                        <div key={option.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm">{option.text || '(Boş seçenek)'}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(option.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-red-600 italic">Henüz seçenek eklenmedi. Lütfen yukarıdan seçenek ekleyin.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newVoting.isPublic || false}
                      onChange={(e) => setNewVoting({ ...newVoting, isPublic: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Herkese açık</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newVoting.allowAnonymous || false}
                      onChange={(e) => setNewVoting({ ...newVoting, allowAnonymous: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Anonim oylamaya izin ver</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedVoting(null);
                    setNewVoting({
                      title: '',
                      description: '',
                      type: 'single',
                      status: 'draft',
                      startDate: '',
                      endDate: '',
                      options: []
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateVoting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sonuçları Görüntüleme Modal */}
      {showResultsModal && selectedVoting && (
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Oylama Sonuçları: {selectedVoting.title}</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>Toplam Oy: <span className="font-semibold">{selectedVoting.totalVotes}</span></div>
                  <div>Katılımcı: <span className="font-semibold">{selectedVoting.participants}</span></div>
                </div>

                <div className="space-y-3">
                  {selectedVoting.options.map((option) => (
                    <div key={option.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{option.text}</span>
                        <span className="text-sm text-gray-600">{option.votes} oy ({option.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${option.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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

export default Voting;