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
      className={`bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors ${
        activeTab === 'chat'
          ? 'fixed inset-0 h-full w-full overflow-hidden'
          : 'min-h-screen'
      }`}
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
          {/* Header Superior */}
          <Header
            user={currentUser}
            activeTab={activeTab}
            setActiveTab={tab => {
              if (tab === 'mibarrio') {
                // Ir a la vista de su propio barrio
                setChatRoomId(currentUser.neighborhoodId);
                setTablonBarrioFilter(currentUser.neighborhoodId);
              }
              setActiveTab(tab);
            }}
            onlineCount={onlineCount}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenAuth={() => {}}
            onOpenInstallModal={() => setShowInstallModal(true)}
            notifications={notifications}
            onMarkNotificationsRead={handleMarkNotificationsRead}
          />

          {/* Contenido Principal con comportamiento responsive óptimo (sin hueco ni borde negro abajo) */}
          <main
            className={`flex-1 min-h-0 flex flex-col w-full ${
              activeTab === 'chat'
                ? 'p-0 m-0 pb-0 overflow-hidden md:pb-6 md:px-6 md:pt-4 md:max-w-7xl md:mx-auto'
                : 'max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-3 sm:pt-5 pb-16 md:pb-8'
            }`}
          >
            
            {/* PESTAÑA: CHAT COMUNITARIO (Scroll aislado exclusivamente dentro del mensaje) */}
            {activeTab === 'chat' && (
              <div className="flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden">
                <ChatView
                  currentUser={currentUser}
                  initialRoomId={chatRoomId}
                  onSelectUser={u => setSelectedPublicUserId(u.id)}
                />
              </div>
            )}

            {/* PESTAÑA: TABLÓN DE ANUNCIOS */}
            {activeTab === 'tablon' && (
              <BulletinBoard
                currentUser={currentUser}
                presetBarrioFilter={tablonBarrioFilter}
                onSelectUser={u => setSelectedPublicUserId(u.id)}
              />
            )}

            {/* PESTAÑA: MI BARRIO (Acceso rápido a chat y anuncios de tu barrio) */}
            {activeTab === 'mibarrio' && (
              <div className="flex-1 flex flex-col w-full space-y-3 sm:space-y-4">
                <div className="bg-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-md flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-wider text-teal-200">
                      Espacio Vecinal Exclusivo
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-0.5">
                      Mi Barrio: {currentUser.neighborhoodId.replace(/-/g, ' ').toUpperCase()}
                    </h2>
                    <p className="text-xs text-teal-100 mt-0.5">
                      Conectate directamente con los vecinos de tu calle y tu sector en Capilla del Monte.
                    </p>
                  </div>
                  <div className="text-3xl sm:text-4xl">⛰️</div>
                </div>

                <div className="flex-1 flex flex-col w-full h-[calc(100dvh-17rem)] md:h-[calc(100dvh-12rem)] min-h-[380px]">
                  <ChatView
                    currentUser={currentUser}
                    initialRoomId={currentUser.neighborhoodId}
                    onSelectUser={u => setSelectedPublicUserId(u.id)}
                  />
                </div>
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
