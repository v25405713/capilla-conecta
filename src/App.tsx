import React, { useState, useEffect } from 'react';
import { User, AppNotification, OnlineUser } from './types';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ChatView } from './components/ChatView';
import { BulletinBoard } from './components/BulletinBoard';
import { BarriosDirectory } from './components/BarriosDirectory';
import { ProfileModal } from './components/ProfileModal';
import { PublicProfileModal } from './components/PublicProfileModal';
import { AdminPanel } from './components/AdminPanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MobileInstallModal } from './components/MobileInstallModal';
import { identifyUserOnSocket, getSocket } from './services/socket';
import { api } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'tablon' | 'mibarrio' | 'barrios' | 'admin'>('chat');
  const [chatRoomId, setChatRoomId] = useState<string>('todos-juntos');
  const [tablonBarrioFilter, setTablonBarrioFilter] = useState<string>('todos');
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [selectedPublicUserId, setSelectedPublicUserId] = useState<string | null>(null);

  // Modo Oscuro / Claro
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('capilla_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('capilla_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('capilla_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Manejo de altura exacta del viewport para teclados virtuales móviles (Brave/Chrome/Safari)
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    };

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    }
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      }
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  // Cargar usuario guardado en sesión local
  useEffect(() => {
    const saved = localStorage.getItem('capilla_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
      } catch (e) {
        localStorage.removeItem('capilla_user');
      }
    }
  }, []);

  // Identificar usuario en Socket.IO y cargar notificaciones
  useEffect(() => {
    if (currentUser) {
      identifyUserOnSocket(currentUser.id, chatRoomId);

      // Cargar notificaciones iniciales
      api.getNotifications(currentUser.id)
        .then(res => setNotifications(res.notifications || []))
        .catch(() => {});

      // Escuchar presencia
      const socket = getSocket();
      const handlePresence = (data: { totalOnline: number }) => {
        setOnlineCount(data.totalOnline || 1);
      };

      socket.on('presence:update', handlePresence);
      return () => {
        socket.off('presence:update', handlePresence);
      };
    }
  }, [currentUser, chatRoomId]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('capilla_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('capilla_user');
    setShowProfileModal(false);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('capilla_user', JSON.stringify(updatedUser));
  };

  const handleMarkNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      await api.markNotificationsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Manejo de cambio de pestaña con reinicio predeterminado a Sala General para el tab 'chat'
  const handleSelectTab = (tab: 'chat' | 'tablon' | 'mibarrio' | 'barrios' | 'admin') => {
    if (tab === 'chat') {
      // La pestaña chat va por defecto a la Sala General "Todos juntos"
      setChatRoomId('todos-juntos');
    } else if (tab === 'mibarrio' && currentUser) {
      // La pestaña Mi Barrio va al chat exclusivo de su barrio
      setChatRoomId(currentUser.neighborhoodId);
      setTablonBarrioFilter(currentUser.neighborhoodId);
    }
    setActiveTab(tab);
  };

  // Navegar a sala de chat de barrio específico
  const handleNavigateToBarrioChat = (barrioId: string) => {
    setChatRoomId(barrioId);
    setActiveTab('chat');
  };

  // Navegar a anuncios de barrio específico
  const handleNavigateToBarrioTablon = (barrioId: string) => {
    setTablonBarrioFilter(barrioId);
    setActiveTab('tablon');
  };

  return (
    <div
      className="fixed inset-0 w-full h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors"
      style={{ height: 'var(--app-height, 100dvh)', maxHeight: 'var(--app-height, 100dvh)' }}
    >
      
      {/* Indicador de conexión offline */}
      <OfflineIndicator />

      {/* Si no está autenticado, mostrar modal obligatorio de Login / Registro de Vecino */}
      {!currentUser ? (
        <AuthModal
          onSuccess={handleLoginSuccess}
          onOpenInstallModal={() => setShowInstallModal(true)}
        />
      ) : (
        <>
          {/* Header Superior (se oculta en móviles dentro del chat y mi barrio para máxima inmersión WhatsApp) */}
          <Header
            user={currentUser}
            activeTab={activeTab}
            setActiveTab={handleSelectTab}
            onlineCount={onlineCount}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenAuth={() => {}}
            onOpenInstallModal={() => setShowInstallModal(true)}
            notifications={notifications}
            onMarkNotificationsRead={handleMarkNotificationsRead}
          />

          {/* Contenido Principal con scroll interno garantizado en Tablón y pantalla completa en chats */}
          <main
            className={`flex-1 min-h-0 flex flex-col w-full ${
              activeTab === 'chat' || activeTab === 'mibarrio'
                ? 'p-0 m-0 pb-0 h-full overflow-hidden md:pb-4 md:px-4 md:pt-2 md:max-w-7xl md:mx-auto'
                : 'overflow-y-auto overscroll-contain max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-3 sm:pt-5 pb-28 md:pb-12 scrollable-main'
            }`}
          >
            
            {/* PESTAÑA: CHAT GENERAL COMUNITARIO "TODOS JUNTOS" (WhatsApp Fullscreen) */}
            {activeTab === 'chat' && (
              <div className="flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden">
                <ChatView
                  currentUser={currentUser}
                  initialRoomId={chatRoomId}
                  onSelectUser={u => setSelectedPublicUserId(u.id)}
                  onBack={() => handleSelectTab('tablon')}
                  onNavigateTab={tab => handleSelectTab(tab as any)}
                  onOpenProfile={() => setShowProfileModal(true)}
                  onOpenInstall={() => setShowInstallModal(true)}
                  isDarkMode={isDarkMode}
                  toggleDarkMode={toggleDarkMode}
                />
              </div>
            )}

            {/* PESTAÑA: TABLÓN DE ANUNCIOS (Con scroll completo fluido) */}
            {activeTab === 'tablon' && (
              <BulletinBoard
                currentUser={currentUser}
                presetBarrioFilter={tablonBarrioFilter}
                onSelectUser={u => setSelectedPublicUserId(u.id)}
              />
            )}

            {/* PESTAÑA: MI BARRIO (100% Pantalla Completa y ancha emulando el chat general) */}
            {activeTab === 'mibarrio' && (
              <div className="flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden">
                <ChatView
                  currentUser={currentUser}
                  initialRoomId={currentUser.neighborhoodId}
                  onSelectUser={u => setSelectedPublicUserId(u.id)}
                  onBack={() => handleSelectTab('tablon')}
                  onNavigateTab={tab => handleSelectTab(tab as any)}
                  onOpenProfile={() => setShowProfileModal(true)}
                  onOpenInstall={() => setShowInstallModal(true)}
                  isDarkMode={isDarkMode}
                  toggleDarkMode={toggleDarkMode}
                />
              </div>
            )}

            {/* PESTAÑA: DIRECTORIO DE LOS 20 BARRIOS */}
            {activeTab === 'barrios' && (
              <BarriosDirectory
                currentUser={currentUser}
                onSelectBarrioChat={handleNavigateToBarrioChat}
                onSelectBarrioTablon={handleNavigateToBarrioTablon}
              />
            )}

            {/* PESTAÑA: PANEL DE CONTROL & MODERACIÓN */}
            {activeTab === 'admin' && (
              <AdminPanel currentUser={currentUser} />
            )}

          </main>

          {/* Modal de Edición de Perfil */}
          {showProfileModal && (
            <ProfileModal
              user={currentUser}
              onClose={() => setShowProfileModal(false)}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
            />
          )}

          {/* Modal de Perfil Público de un Vecino */}
          {selectedPublicUserId && (
            <PublicProfileModal
              userId={selectedPublicUserId}
              onClose={() => setSelectedPublicUserId(null)}
            />
          )}
        </>
      )}

      {/* Modal de Instalación en Celular y Descarga de APK */}
      {showInstallModal && (
        <MobileInstallModal onClose={() => setShowInstallModal(false)} />
      )}

    </div>
  );
}
