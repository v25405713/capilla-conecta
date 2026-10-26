import React, { useState } from 'react';
import { User, AppNotification, getFormattedUserName } from '../types';
import {
  MessageSquare,
  LayoutGrid,
  MapPin,
  Compass,
  Bell,
  Sun,
  Moon,
  Share2,
  Shield,
  Users,
  Check,
  Smartphone,
  LogIn
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  activeTab: 'chat' | 'tablon' | 'mibarrio' | 'barrios' | 'admin';
  setActiveTab: (tab: 'chat' | 'tablon' | 'mibarrio' | 'barrios' | 'admin') => void;
  onlineCount: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenInstallModal: () => void;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onlineCount,
  isDarkMode,
  toggleDarkMode,
  onOpenProfile,
  onOpenAuth,
  onOpenInstallModal,
  notifications,
  onMarkNotificationsRead,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [invitedCopied, setInvitedCopied] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleShareInvite = () => {
    const shareUrl = window.location.origin;
    const text = `¡Hola vecino! Sumate a Capilla Conecta, la página web comunitaria y tablón vecinal de Capilla del Monte: ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Capilla Conecta',
        text,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setInvitedCopied(true);
      setTimeout(() => setInvitedCopied(false), 2500);
    }
  };

  const formattedName = user ? getFormattedUserName(user) : 'Vecino Invitado';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-16 flex items-center justify-between gap-3">
        
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('tablon')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
              ⛰️
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                Capilla Conecta
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold uppercase tracking-wider block">
                Capilla del Monte
              </span>
            </div>
          </button>

          {/* Live Online Users Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 ml-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{onlineCount} {onlineCount === 1 ? 'vecino online' : 'vecinos online'}</span>
          </div>
        </div>

        {/* Center Navigation Links (Visible on Tablets & Desktops) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          <button
            onClick={() => setActiveTab('tablon')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'tablon'
                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>Tablón</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'chat'
                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('barrios')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'barrios'
                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>20 Barrios</span>
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('mibarrio')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'mibarrio'
                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Mi Barrio</span>
            </button>
          )}

          {/* Admin / Moderación */}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{user.role === 'admin' ? 'Admin' : 'Moderación'}</span>
            </button>
          )}
        </nav>

        {/* Right Zone: Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Botón Destacado: Instalar Móvil / Tablet */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition-colors cursor-pointer shadow-xs shrink-0"
            title="Instalar en celular o tablet"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">Instalar App</span>
            <span className="sm:hidden">Instalar</span>
          </button>

          {/* Invitar Vecino WhatsApp */}
          <button
            onClick={handleShareInvite}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0"
            title="Compartir enlace de Capilla Conecta"
          >
            {invitedCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{invitedCopied ? '¡Copiado!' : 'Invitar'}</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown (si está logueado) */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  if (!showNotifs && unreadCount > 0) {
                    onMarkNotificationsRead();
                  }
                }}
                className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
                title="Notificaciones in-app"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="fixed sm:absolute right-2 sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-teal-600" />
                      Notificaciones vecinales
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={onMarkNotificationsRead}
                        className="text-[11px] text-teal-600 hover:underline cursor-pointer"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No tienes notificaciones pendientes
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl text-xs transition-colors ${
                            n.read
                              ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                              : 'bg-teal-50 dark:bg-teal-950/40 text-slate-800 dark:text-slate-200 font-medium'
                          }`}
                        >
                          <div className="font-semibold text-slate-900 dark:text-white">{n.title}</div>
                          <div className="text-[11px] mt-0.5">{n.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Pill or Ingresar Button */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group shrink-0"
              title="Ver y editar tu perfil"
            >
              <span className="text-base sm:text-lg leading-none shrink-0">{user.avatarEmoji}</span>
              <div className="text-left hidden sm:block max-w-[110px] md:max-w-[130px] truncate">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                  {formattedName}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-600/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 font-bold text-xs transition-colors cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar</span>
            </button>
          )}

        </div>
      </div>

      {/* Modern Bottom Navigation Bar on Mobile Phones (Safe Area Aware) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-1 px-2 flex justify-around items-center shadow-lg pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setActiveTab('tablon')}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'tablon'
              ? 'text-teal-700 dark:text-teal-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutGrid className="w-4 h-4 mb-0.5" />
          <span>Tablón</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'chat'
              ? 'text-teal-700 dark:text-teal-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4 mb-0.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('barrios')}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'barrios'
              ? 'text-teal-700 dark:text-teal-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Compass className="w-4 h-4 mb-0.5" />
          <span>Barrios</span>
        </button>

        {user && (
          <button
            onClick={() => setActiveTab('mibarrio')}
            className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'mibarrio'
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <MapPin className="w-4 h-4 mb-0.5" />
            <span>Mi Barrio</span>
          </button>
        )}

        <button
          onClick={onOpenInstallModal}
          className="flex flex-col items-center py-1 px-3 text-[10px] font-bold text-teal-700 dark:text-teal-400 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 mb-0.5 text-amber-500" />
          <span>Instalar</span>
        </button>
      </nav>
    </header>
  );
};
