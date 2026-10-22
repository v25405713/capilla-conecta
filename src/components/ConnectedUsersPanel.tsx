import React, { useState, useEffect } from 'react';
import { OnlineUser, BARRIOS_CAPILLA } from '../types';
import { getSocket } from '../services/socket';
import { Users, MapPin, ChevronRight, MessageCircle } from 'lucide-react';

interface ConnectedUsersPanelProps {
  currentRoomId: string;
  onSelectUser: (user: OnlineUser) => void;
}

export const ConnectedUsersPanel: React.FC<ConnectedUsersPanelProps> = ({
  currentRoomId,
  onSelectUser,
}) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [activeTab, setActiveTab] = useState<'room' | 'all'>('room');

  useEffect(() => {
    const socket = getSocket();

    const handlePresence = (data: { totalOnline: number; users: OnlineUser[] }) => {
      setOnlineUsers(data.users || []);
    };

    socket.on('presence:update', handlePresence);
    return () => {
      socket.off('presence:update', handlePresence);
    };
  }, []);

  // Usuarios en la sala actual
  const usersInCurrentRoom = onlineUsers.filter(u => u.currentRoomId === currentRoomId);

  // Usuarios agrupados por barrio en toda la app
  const usersByBarrio = BARRIOS_CAPILLA.map(barrio => {
    const members = onlineUsers.filter(u => u.neighborhoodId === barrio.id);
    return {
      barrio,
      members,
    };
  }).filter(group => group.members.length > 0);

  return (
    <div className="w-full lg:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Header del Panel */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Vecinos Online ({onlineUsers.length})
          </span>
        </div>
      </div>

      {/* Selector de Pestaña: En esta sala vs Todos por barrio */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('room')}
          className={`flex-1 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'room'
              ? 'border-teal-600 text-teal-800 dark:text-teal-300 bg-teal-50/40 dark:bg-teal-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          En esta sala ({usersInCurrentRoom.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'border-teal-600 text-teal-800 dark:text-teal-300 bg-teal-50/40 dark:bg-teal-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Por Barrio
        </button>
      </div>

      {/* Contenido de la lista */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'room' ? (
          usersInCurrentRoom.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No hay otros vecinos en esta sala en este momento
            </div>
          ) : (
            usersInCurrentRoom.map(u => (
              <button
                key={u.id}
                onClick={() => onSelectUser(u)}
                className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg border border-slate-200 dark:border-slate-700">
                      {u.avatarEmoji}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                      {u.formattedName}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-teal-600" />
                      <span>{u.neighborhoodName}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </button>
            ))
          )
        ) : (
          usersByBarrio.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No hay vecinos conectados actualmente
            </div>
          ) : (
            usersByBarrio.map(({ barrio, members }) => (
              <div key={barrio.id} className="pt-1.5 pb-2">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>{barrio.icon} {barrio.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                    {members.length}
                  </span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {members.map(u => (
                    <button
                      key={u.id}
                      onClick={() => onSelectUser(u)}
                      className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{u.avatarEmoji}</span>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          {u.displayName || u.formattedName}
                        </span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Footer del panel */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] text-slate-500 text-center">
        Toca cualquier vecino para ver su contacto
      </div>

    </div>
  );
};
