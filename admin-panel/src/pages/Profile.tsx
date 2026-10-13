import React, { useState, useEffect } from 'react';
import { User, Save, Upload, X, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usersApi } from '../services/api.ts';

const Profile: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [user, setUser] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
    department: '',
    title: '',
    profileImage: null as string | null,
  });

  useEffect(() => {
    // Sadece ilk yüklemede API'den güncel veriyi çek
    let isMounted = true;
    
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok && isMounted) {
            const data = await response.json();
            const userData = data.user || data;
            setUser({
              id: userData.id || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              phoneNumber: userData.phoneNumber || userData.phone || '',
              company: userData.company || '',
              department: userData.department || '',
              title: userData.title || '',
              profileImage: userData.profileImage || null,
            });
            console.log('✅ Profile data loaded from API:', {
              id: userData.id,
              name: `${userData.firstName} ${userData.lastName}`,
              profileImage: userData.profileImage,
            });
          }
        } else if (isMounted && currentUser) {
          // Fallback to currentUser from context
          setUser({
            id: currentUser.id || '',
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
            email: currentUser.email || '',
            phoneNumber: currentUser.phoneNumber || currentUser.phone || '',
            company: currentUser.company || '',
            department: currentUser.department || '',
            title: currentUser.title || '',
            profileImage: currentUser.profileImage || null,
          });
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        // Fallback to currentUser from context
        if (isMounted && currentUser) {
          setUser({
            id: currentUser.id || '',
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
            email: currentUser.email || '',
            phoneNumber: currentUser.phoneNumber || currentUser.phone || '',
            company: currentUser.company || '',
            department: currentUser.department || '',
            title: currentUser.title || '',
            profileImage: currentUser.profileImage || null,
          });
        }
      }
    };
    
    fetchCurrentUser();
    
    return () => {
      isMounted = false;
    };
  }, []); // Sadece ilk yüklemede çalış

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    try {
      setChangingPassword(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Şifre başarıyla değiştirildi');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordSection(false);
      } else {
        toast.error(data.error || 'Şifre değiştirilirken hata oluştu');
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      toast.error('Şifre değiştirilirken hata oluştu');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resim boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/upload/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = data.data.original;
        setUser(prev => ({ ...prev, profileImage: imageUrl }));
        
        // Automatically save profile image URL to user data
        try {
          await usersApi.updateUser(user.id, { profileImage: imageUrl });
          
          // Auth context'i güncellemek için sayfayı yenile
          // Veya API'den güncel veriyi çek
          const token = localStorage.getItem('token');
          if (token) {
            const response = await fetch('http://localhost:3000/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              const updatedUser = data.user || data;
              setUser(prev => ({
                ...prev,
                profileImage: updatedUser.profileImage || imageUrl,
              }));
              console.log('✅ Profile image updated in state:', updatedUser.profileImage);
            }
          }
          
          toast.success('Profil resmi başarıyla yüklendi ve kaydedildi');
        } catch (error: any) {
          console.error('Error saving profile image URL:', error);
          toast.error('Resim yüklendi ancak kaydedilirken hata oluştu');
        }
      } else {
        toast.error(data.error || 'Resim yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Resim yüklenirken hata oluştu');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user.firstName || !user.lastName) {
      toast.error('Ad ve soyad alanları zorunludur');
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || undefined,
        phoneNumber: user.phoneNumber,
        company: user.company || undefined,
        department: user.department || undefined,
        title: user.title || undefined,
        profileImage: user.profileImage || undefined,
      };

      const response = await usersApi.updateUser(user.id, updateData);
      
      if (response.success || response.user) {
        // API'den güncel veriyi çek (tüm platformlarda senkronizasyon için)
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const refreshResponse = await fetch('http://localhost:3000/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              const refreshedUser = refreshData.user || refreshData;
              setUser({
                id: refreshedUser.id || '',
                firstName: refreshedUser.firstName || '',
                lastName: refreshedUser.lastName || '',
                email: refreshedUser.email || '',
                phoneNumber: refreshedUser.phoneNumber || refreshedUser.phone || '',
                company: refreshedUser.company || '',
                department: refreshedUser.department || '',
                title: refreshedUser.title || '',
                profileImage: refreshedUser.profileImage || null,
              });
              console.log('✅ Profile updated and synced from API');
            }
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
        
        toast.success('Profil başarıyla güncellendi');
      } else {
        toast.error('Profil güncellenirken hata oluştu');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.error || 'Profil güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil Düzenle</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-200">
            <div className="relative">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <label
                className={`absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors ${
                  uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
            {uploadingImage && (
              <p className="mt-2 text-sm text-gray-500">Resim yükleniyor...</p>
            )}
            <p className="mt-4 text-sm text-gray-500 text-center">
              Profil resminizi güncellemek için yukarıdaki ikona tıklayın
            </p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={user.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Adınız"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={user.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Soyadınız"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ornek@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={user.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0555 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şirket
                </label>
                <input
                  type="text"
                  name="company"
                  value={user.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Şirket adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departman
                </label>
                <input
                  type="text"
                  name="department"
                  value={user.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Departman"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ünvan
                </label>
                <input
                  type="text"
                  name="title"
                  value={user.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ünvanınız"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Save className="w-5 h-5" />
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>

          {/* Şifre Değiştirme Bölümü - Sadece Admin */}
          {currentUser?.role === 'admin' && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Şifre Değiştir</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(!showPasswordSection);
                    if (showPasswordSection) {
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showPasswordSection ? 'Gizle' : 'Göster'}
                </button>
              </div>

              {showPasswordSection && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mevcut Şifre <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="Mevcut şifrenizi girin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Şifre <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="Yeni şifrenizi girin (min. 6 karakter)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Şifre Tekrar <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="Yeni şifrenizi tekrar girin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                        changingPassword ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Lock className="w-5 h-5" />
                      {changingPassword ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

