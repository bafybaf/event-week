import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Event Week yönetim paneline hoş geldiniz
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sistem Durumu</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-800">Backend API</div>
            <div className="text-2xl font-bold text-green-900">Çalışıyor</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-800">Veritabanı</div>
            <div className="text-2xl font-bold text-green-900">Bağlı</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-800">Mobile App</div>
            <div className="text-2xl font-bold text-green-900">Hazır</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-800">Admin Panel</div>
            <div className="text-2xl font-bold text-green-900">Aktif</div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/events')}
            className="btn btn-primary"
          >
            Yeni Etkinlik
          </button>
          <button 
            onClick={() => navigate('/users')}
            className="btn btn-secondary"
          >
            Kullanıcı Ekle
          </button>
          <button 
            onClick={() => navigate('/programs')}
            className="btn btn-secondary"
          >
            Program Oluştur
          </button>
          <button 
            onClick={() => navigate('/announcements')}
            className="btn btn-secondary"
          >
            Duyuru Yayınla
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;