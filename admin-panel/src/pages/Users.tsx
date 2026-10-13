import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  Phone,
  Lock,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { usersApi, eventsApi } from '../services/api.ts';
import { API_ORIGIN } from '../config';

interface User {
  id: string;
  eventId: string;
  email?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phone?: string; // Legacy support
  password?: string; // For admin panel
  role: 'admin' | 'organizer' | 'speaker' | 'participant';
  company?: string;
  department?: string;
  title?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  qrCode?: string;
  profileImage?: string | null;
}

interface Event {
  id: string;
  name: string;
  isActive: boolean;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    eventId: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    phone: '', // Legacy support
    password: '', // For admin panel
    role: 'participant' as 'admin' | 'organizer' | 'speaker' | 'participant',
    company: '',
    department: '',
    title: ''
  });
  const [editUser, setEditUser] = useState({
    eventId: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    phone: '', // Legacy support
    password: '', // For admin panel
    role: 'participant' as 'admin' | 'organizer' | 'speaker' | 'participant',
    company: '',
    department: '',
    title: ''
  });

  // Mock data for demonstration
  const mockEvents: Event[] = [
    { id: '1', name: 'Event Week 2024', isActive: true },
    { id: '2', name: 'React Native Workshop', isActive: true },
    { id: '3', name: 'Product Management Summit', isActive: true }
  ];

  const mockUsers: User[] = [
    {
      id: '1',
      eventId: '1',
      email: 'admin@eventweek.com',
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '5550000001',
      role: 'admin',
      company: 'Event Week',
      department: 'IT',
      title: 'System Administrator',
      isActive: true,
      lastLogin: '2025-10-13T08:00:00Z',
      createdAt: '2025-10-01T00:00:00Z',
      qrCode: 'EW-ADMIN001'
    },
    {
      id: '2',
      eventId: '1',
      email: 'organizer@eventweek.com',
      firstName: 'Organizer',
      lastName: 'User',
      phoneNumber: '5550000002',
      role: 'organizer',
      company: 'Event Week',
      department: 'Events',
      title: 'Event Organizer',
      isActive: true,
      lastLogin: '2025-10-13T07:30:00Z',
      createdAt: '2025-10-01T00:00:00Z',
      qrCode: 'EW-ORG001'
    },
    {
      id: '3',
      eventId: '1',
      email: 'participant@eventweek.com',
      firstName: 'Participant',
      lastName: 'User',
      phoneNumber: '5550000003',
      role: 'participant',
      company: 'Test Company',
      department: 'Marketing',
      title: 'Marketing Manager',
      isActive: true,
      lastLogin: '2025-10-13T07:00:00Z',
      createdAt: '2025-10-01T00:00:00Z',
      qrCode: 'EW-PART001'
    },
    {
      id: '5',
      eventId: '2',
      email: 'ahmet.yilmaz@email.com',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      phoneNumber: '5551234567',
      role: 'participant',
      isActive: true,
      lastLogin: '2025-10-13T06:30:00Z',
      createdAt: '2025-10-03T00:00:00Z',
      qrCode: 'EW-PART002'
    }
  ];

  useEffect(() => {
    fetchUsers();
    fetchEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ORIGIN}/api/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        // Fallback to mock data if API fails
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to mock data
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_ORIGIN}/api/events`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        console.error('Failed to fetch events');
        // Fallback to mock data if API fails
        setEvents(mockEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      // Fallback to mock data if API fails
      setEvents(mockEvents);
    }
  };

  const listedUsers = users.filter((user) => user.role !== 'speaker');

  const filteredUsers = listedUsers.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    const matchesEvent = eventFilter === 'all' || user.eventId === eventFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesEvent;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'organizer': return 'bg-blue-100 text-blue-800';
      case 'speaker': return 'bg-purple-100 text-purple-800';
      case 'participant': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'organizer': return 'Organizatör';
      case 'speaker': return 'Konuşmacı';
      case 'participant': return 'Katılımcı';
      default: return role;
    }
  };

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Bilinmiyor';
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      eventId: user.eventId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || '',
      phoneNumber: user.phoneNumber,
      phone: user.phone || '',
      password: user.password || '',
      role: user.role,
      company: user.company || '',
      department: user.department || '',
      title: user.title || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`${API_ORIGIN}/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userToDelete.id));
        toast.success('Kullanıcı başarıyla silindi');
        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Kullanıcı silinemedi');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const response = await fetch(`${API_ORIGIN}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, isActive: !user.isActive } : user
        ));
        toast.success('Kullanıcı durumu güncellendi');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kullanıcı durumu güncellenemedi');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Kullanıcı durumu güncellenemedi');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // Client-side validation
    if (!editUser.eventId) {
      toast.error('Lütfen bir etkinlik seçin');
      return;
    }
    if (!editUser.firstName.trim()) {
      toast.error('Ad alanı zorunludur');
      return;
    }
    if (!editUser.lastName.trim()) {
      toast.error('Soyad alanı zorunludur');
      return;
    }
    if (!editUser.phoneNumber.trim()) {
      toast.error('Telefon numarası alanı zorunludur');
      return;
    }
    // Şifre validasyonu
    if (editUser.password && editUser.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      // Şifre boşsa gönderme
      const updateData = { ...editUser };
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }

      const response = await fetch(`${API_ORIGIN}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Update response:', data); // Debug log
        setUsers(users.map(user => 
          user.id === selectedUser.id ? data.user : user
        ));
        
        toast.success('Kullanıcı başarıyla güncellendi');
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        console.error('Update error:', errorData); // Debug log
        toast.error(errorData.error || 'Kullanıcı güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Kullanıcı güncellenemedi');
    }
  };

  const exportUsers = () => {
    // Excel verisi oluştur
    const excelData = filteredUsers.map((user, index) => ({
      'Sıra': index + 1,
      'Ad': user.firstName,
      'Soyad': user.lastName,
      'Email': user.email || '',
      'Telefon': user.phoneNumber || user.phone || '',
      'Rol': getRoleText(user.role), // Türkçe rol adı
      'Etkinlik': getEventName(user.eventId), // Etkinlik adı
      'Şirket': user.company || '',
      'Departman': user.department || '',
      'Ünvan': user.title || '',
      'Durum': user.isActive ? 'Aktif' : 'Pasif',
      'Son Giriş': user.lastLogin ? formatDate(user.lastLogin) : 'Hiç giriş yapmamış',
      'Kayıt Tarihi': user.createdAt ? formatDate(user.createdAt) : ''
    }));

    // Workbook oluştur
    const ws = XLSX.utils.json_to_sheet(excelData, {
      cellDates: true,
      dateNF: 'yyyy-mm-dd',
      skipHeader: false
    });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kullanıcılar');

    // Kolon genişliklerini ayarla
    const colWidths = [
      { wch: 6 },  // Sıra
      { wch: 15 }, // Ad
      { wch: 15 }, // Soyad
      { wch: 25 }, // Email
      { wch: 15 }, // Telefon
      { wch: 12 }, // Rol
      { wch: 20 }, // Etkinlik ID
      { wch: 20 }, // Şirket
      { wch: 15 }, // Departman
      { wch: 15 }, // Ünvan
      { wch: 10 }, // Durum
      { wch: 15 }, // Son Giriş
      { wch: 15 }  // Kayıt Tarihi
    ];
    ws['!cols'] = colWidths;

    // Dosyayı indir - UTF-8 encoding ile
    const fileName = `Kullanicilar_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Türkçe karakter desteği için XLSX yazma işlemi
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

    toast.success(`${filteredUsers.length} kullanıcı Excel dosyasına aktarıldı`);
  };

  const handleImportUsers = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
          const usersData = jsonData.map((row: any) => {
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
              eventId: row['Etkinlik ID'] || row['Event ID'] || row['eventId'] || row['Etkinlik ID'] || '',
              company: row['Şirket'] || row['Company'] || row['company'] || '',
              department: row['Departman'] || row['Department'] || row['department'] || '',
              title: row['Ünvan'] || row['Title'] || row['title'] || '',
              isActive: (() => {
                const raw = row['Durum'] ?? row['Status'] ?? row['isActive'];
                if (raw === undefined || raw === null || String(raw).trim() === '') return true;
                const value = String(raw).trim().toLowerCase();
                return ['aktif', 'active', 'true', '1', 'evet'].includes(value);
              })()
            };
          }).filter((u: any) => {
            if (!u.email || !u.firstName || !u.lastName) return false;
            const role = String(u.role || '').toLowerCase();
            return role !== 'speaker' && role !== 'konuşmacı' && role !== 'konusmaci';
          });

          if (usersData.length === 0) {
            toast.error('Geçerli kullanıcı verisi bulunamadı');
            return;
          }

          // Backend'e gönder
          const result = await usersApi.importUsers(usersData);
          
          toast.success(result.message || 'Kullanıcılar başarıyla içe aktarıldı');
          
          // Kullanıcıları yeniden yükle
          await fetchUsers();
          
          // Input'u temizle
          event.target.value = '';
        } catch (error: any) {
          console.error('Error importing users:', error);
          toast.error(error.message || 'Excel dosyası işlenirken bir hata oluştu');
        }
      };

      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error('Error reading file:', error);
      toast.error('Dosya okunurken bir hata oluştu');
    }
  };

  const handleAddUser = async () => {
    // Client-side validation
    if (!newUser.eventId) {
      toast.error('Lütfen bir etkinlik seçin');
      return;
    }
    if (!newUser.firstName.trim()) {
      toast.error('Ad alanı zorunludur');
      return;
    }
    if (!newUser.lastName.trim()) {
      toast.error('Soyad alanı zorunludur');
      return;
    }
    if (!newUser.email.trim()) {
      toast.error('E-posta alanı zorunludur');
      return;
    }
    if (!newUser.phoneNumber.trim()) {
      toast.error('Telefon numarası alanı zorunludur');
      return;
    }

    try {
      const response = await fetch(`${API_ORIGIN}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const data = await response.json();
        setUsers([data.user, ...users]);
        setShowAddModal(false);
        setNewUser({
          eventId: '',
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          phone: '',
          password: '',
          role: 'participant',
          company: '',
          department: '',
          title: ''
        });
        toast.success('Kullanıcı başarıyla oluşturuldu');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kullanıcı oluşturulamadı');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Kullanıcı oluşturulamadı');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tüm kullanıcıları görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportUsers}
            className="btn btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </button>
          <label className="btn btn-secondary flex items-center cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            İçe Aktar
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportUsers}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kullanıcı
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Toplam Kullanıcı
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {listedUsers.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">A</span>
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Aktif Kullanıcı
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {listedUsers.filter(u => u.isActive).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold">A</span>
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Admin
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">O</span>
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Organizatör
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role === 'organizer').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arama
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ad, soyad, e-posta, şirket veya telefon ara..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etkinlik
            </label>
            <select
              className="input"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">Tüm Etkinlikler</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              className="input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tüm Roller</option>
              <option value="admin">Admin</option>
              <option value="organizer">Organizatör</option>
              <option value="participant">Katılımcı</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durum
            </label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Kullanıcı Listesi ({filteredUsers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>Etkinlik</th>
                <th>Şirket</th>
                <th>İletişim</th>
                <th>Durum</th>
                <th>Son Giriş</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            // Hata durumunda placeholder göster
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center ${user.profileImage ? 'hidden' : ''}`}
                        style={{ display: user.profileImage ? 'none' : 'flex' }}
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {user.qrCode && (
                          <div className="text-xs text-gray-400">
                            QR: {user.qrCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">
                      {getEventName(user.eventId)}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">
                      {user.company || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.department || '-'}
                    </div>
                    {user.title && (
                      <div className="text-xs text-gray-400">
                        {user.title}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-1" />
                      {user.phoneNumber || '-'}
                    </div>
                    {user.email && (
                      <div className="text-xs text-gray-400">
                        {user.email}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.isActive)}`}>
                      {user.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Hiç giriş yapmamış'}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                      >
                        {user.isActive ? 'Deaktif' : 'Aktif'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
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

      {/* Add User Modal */}
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
          <div className="bg-white rounded-md shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Kullanıcı</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik</label>
                  <select
                    className="input"
                    value={newUser.eventId}
                    onChange={(e) => setNewUser({...newUser, eventId: e.target.value})}
                  >
                    <option value="">Etkinlik seçin</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ad</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                      placeholder="Ad" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Soyad</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                      placeholder="Soyad" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon Numarası</label>
                  <input 
                    type="tel" 
                    className="input" 
                    value={newUser.phoneNumber}
                    onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})}
                    placeholder="0555 123 45 67" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-posta</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="E-posta adresi" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Şifre</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Şifre" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select 
                    className="input"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                  >
                    <option value="participant">Katılımcı</option>
                    <option value="organizer">Organizatör</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Şirket</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={newUser.company}
                    onChange={(e) => setNewUser({...newUser, company: e.target.value})}
                    placeholder="Şirket adı" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departman</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      placeholder="Departman" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ünvan</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={newUser.title}
                      onChange={(e) => setNewUser({...newUser, title: e.target.value})}
                      placeholder="Ünvan" 
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddUser}
                  className="btn btn-primary"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
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
          <div className="bg-white rounded-md shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Kullanıcı Detayları</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {selectedUser.profileImage ? (
                    <img
                      src={selectedUser.profileImage}
                      alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        // Hata durumunda placeholder göster
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center ${selectedUser.profileImage ? 'hidden' : ''}`}
                    style={{ display: selectedUser.profileImage ? 'none' : 'flex' }}
                  >
                    <span className="text-xl font-medium text-gray-700">
                      {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                      {getRoleText(selectedUser.role)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedUser.isActive)}`}>
                      {selectedUser.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik</label>
                  <p className="text-sm text-gray-900">{getEventName(selectedUser.eventId)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <p className="text-sm text-gray-900">{selectedUser.phoneNumber}</p>
                </div>

                {selectedUser.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Şirket</label>
                    <p className="text-sm text-gray-900">{selectedUser.company}</p>
                  </div>
                )}

                {selectedUser.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departman</label>
                    <p className="text-sm text-gray-900">{selectedUser.department}</p>
                  </div>
                )}

                {selectedUser.title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ünvan</label>
                    <p className="text-sm text-gray-900">{selectedUser.title}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Son Giriş</label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Hiç giriş yapmamış'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Kayıt Tarihi</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn btn-secondary"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditUser(selectedUser);
                  }}
                  className="btn btn-primary"
                >
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
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
          <div className="bg-white rounded-md shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Kullanıcı Düzenle</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etkinlik</label>
                  <select
                    className="input"
                    value={editUser.eventId}
                    onChange={(e) => setEditUser({...editUser, eventId: e.target.value})}
                  >
                    <option value="">Etkinlik seçin</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ad</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={editUser.firstName}
                      onChange={(e) => setEditUser({...editUser, firstName: e.target.value})}
                      placeholder="Ad" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Soyad</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={editUser.lastName}
                      onChange={(e) => setEditUser({...editUser, lastName: e.target.value})}
                      placeholder="Soyad" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon Numarası</label>
                  <input 
                    type="tel" 
                    className="input" 
                    value={editUser.phoneNumber}
                    onChange={(e) => setEditUser({...editUser, phoneNumber: e.target.value})}
                    placeholder="0555 123 45 67" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-posta (Opsiyonel)</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={editUser.email}
                    onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                    placeholder="E-posta" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select 
                    className="input"
                    value={editUser.role}
                    onChange={(e) => setEditUser({...editUser, role: e.target.value as any})}
                  >
                    <option value="participant">Katılımcı</option>
                    <option value="organizer">Organizatör</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Şifre (Opsiyonel - Değiştirmek için doldurun)
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      value={editUser.password}
                      onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                      placeholder="Yeni şifre (boş bırakılırsa değişmez)"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Şifreyi değiştirmek istemiyorsanız boş bırakın. Minimum 6 karakter.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Şirket</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={editUser.company}
                    onChange={(e) => setEditUser({...editUser, company: e.target.value})}
                    placeholder="Şirket adı" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departman</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={editUser.department}
                      onChange={(e) => setEditUser({...editUser, department: e.target.value})}
                      placeholder="Departman" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ünvan</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={editUser.title}
                      onChange={(e) => setEditUser({...editUser, title: e.target.value})}
                      placeholder="Ünvan" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="btn btn-primary"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
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
          <div className="bg-white rounded-md shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Kullanıcıyı Sil
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                <strong>{userToDelete.firstName} {userToDelete.lastName}</strong> kullanıcısını silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz.
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="btn btn-danger"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;