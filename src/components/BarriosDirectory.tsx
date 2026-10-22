import React, { useState, useEffect } from 'react';
import { User, BARRIOS_CAPILLA, Neighborhood } from '../types';
import { api } from '../services/api';
import { MapPin, MessageSquare, LayoutGrid, Users, Compass, ChevronRight, Check } from 'lucide-react';

interface BarriosDirectoryProps {
  currentUser: User;
  onSelectBarrioChat: (barrioId: string) => void;
  onSelectBarrioTablon: (barrioId: string) => void;
}

export const BarriosDirectory: React.FC<BarriosDirectoryProps> = ({
  currentUser,
  onSelectBarrioChat,
  onSelectBarrioTablon,
}) => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBarrios()
      .then(res => {
        setStats(res.barrios);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-100 text-xs font-semibold backdrop-blur-md mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Guía Vecinal de Capilla del Monte</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Los 20 Barrios de Nuestro Pueblo
          </h2>
          <p className="text-xs text-teal-100 mt-1">
            Desde la Falda del Uritorco hasta el Dique El Cajón y Balumba. Cada sector tiene su propia sala de chat vecinal y carteles de tablón.
          </p>
        </div>
      </div>

      {/* Grid de los 20 Barrios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BARRIOS_CAPILLA.map(barrio => {
          const isMyBarrio = currentUser.neighborhoodId === barrio.id;
          const barrioStat = stats.find(s => s.id === barrio.id);
          const membersCount = barrioStat?.userCount || 1;
          const postsCount = barrioStat?.postCount || 0;

          return (
            <div
              key={barrio.id}
              className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                isMyBarrio
                  ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-500 shadow-sm ring-1 ring-teal-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
              }`}
            >
              <div>
                {/* Encabezado del Barrio */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{barrio.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {barrio.name}
                      </h3>
                      {isMyBarrio && (
                        <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Tu Barrio
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {barrio.description}
                </p>
              </div>

              {/* Estadísticas & Acciones */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-teal-600" />
                    <span>{membersCount} {membersCount === 1 ? 'vecino registrado' : 'vecinos registrados'}</span>
                  </span>
                  <span>{postsCount} anuncios</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectBarrioChat(barrio.id)}
                    className="py-1.5 px-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Entrar al Chat</span>
                  </button>

                  <button
                    onClick={() => onSelectBarrioTablon(barrio.id)}
                    className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Ver Anuncios</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
