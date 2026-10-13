import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  CalendarDays, 
  Mic, 
  Vote, 
  Zap,
  Gift,
  CalendarCheck, 
  Car, 
  Activity, 
  Plane, 
  Bed, 
  Image, 
  FileText, 
  StickyNote, 
  BarChart3, 
  Megaphone,
  Rss,
  MessageSquare,
  BarChart, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Etkinlikler', href: '/events', icon: Calendar },
    { name: 'Kullanıcılar', href: '/users', icon: Users },
    { name: 'Program', href: '/programs', icon: CalendarDays },
    { name: 'Konuşmacılar', href: '/speakers', icon: Mic },
    { name: 'Canlı Quiz', href: '/quizzes', icon: Zap },
    { name: 'Çekiliş', href: '/raffle', icon: Gift },
    { name: 'Oylama', href: '/voting', icon: Vote },
    { name: 'Randevular', href: '/appointments', icon: CalendarCheck },
    { name: 'Transferler', href: '/transfers', icon: Car },
    { name: 'Aktiviteler', href: '/activities', icon: Activity },
    { name: 'Uçuşlar', href: '/flights', icon: Plane },
    { name: 'Konaklama', href: '/accommodations', icon: Bed },
    { name: 'Galeri', href: '/gallery', icon: Image },
    { name: 'Feed', href: '/feed', icon: Rss },
    { name: 'Destek', href: '/support', icon: MessageSquare },
    { name: 'Dokümanlar', href: '/documents', icon: FileText },
    { name: 'Notlar', href: '/notes', icon: StickyNote },
    { name: 'Anketler', href: '/surveys', icon: BarChart3 },
    { name: 'Duyurular', href: '/announcements', icon: Megaphone },
    { name: 'Raporlar', href: '/reports', icon: BarChart },
    { name: 'Profilim', href: '/profile', icon: User },
    { name: 'Ayarlar', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white h-full">
          <div className="flex h-16 items-center justify-between px-4 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">Event Week Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto min-h-0">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 h-full">
          <div className="flex h-16 items-center px-4 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">Event Week Admin</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto min-h-0">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* User menu */}
              <div className="flex items-center gap-x-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-x-2 hover:opacity-80 transition-opacity"
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
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
                    className={`h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center ${user?.profileImage ? 'hidden' : ''}`}
                    style={{ display: user?.profileImage ? 'none' : 'flex' }}
                  >
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-gray-600"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
