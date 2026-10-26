import React, { useState, useEffect } from 'react';
import { User, BARRIOS_CAPILLA, getFormattedUserName } from '../types';
import { api } from '../services/api';
import { X, Phone, MapPin, Calendar, Shield, ExternalLink, MessageCircle } from 'lucide-react';

interface PublicProfileModalProps {
  userId: string;
  onClose: () => void;
  onOpenDirectChat?: (barrioId: string) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  userId,
  onClose,
  onOpenDirectChat,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDemoUsers().then(res => {
      // Intentar obtener de perfil o demo
      api.login(userId).catch(() => {});
    });

    fetch(`/api/auth/profile/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 text-center">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs text-slate-400">Cargando perfil del vecino...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vecino no encontrado</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const barrioObj = BARRIOS_CAPILLA.find(b => b.id === user.neighborhoodId);
  const formattedName = getFormattedUserName(user);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-3 sm:p-6 flex justify-center items-start sm:items-center">
      <div className="w-full max-w-sm my-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Banner */}
        <div className="h-20 bg-gradient-to-r from-teal-800 to-emerald-800 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full bg-black/20 text-white hover:bg-black/40 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar circular con emoticón */}
          <div className="-mt-10 mb-3 w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-4xl">
            {user.avatarEmoji}
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {formattedName}
            </h3>
            {user.role === 'admin' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Coordinador
              </span>
            )}
          </div>

          {/* Barrio */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>Barrio {barrioObj?.name || user.neighborhoodId}</span>
            <span>·</span>
            <span>Capilla del Monte</span>
          </div>

          {/* Bio */}
          {user.bio ? (
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
              "{user.bio}"
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-400 italic">
              Vecino sin biografía personalizada
            </p>
          )}

          {/* Contacto WhatsApp solo si el usuario lo autorizó */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {user.phoneVisible && user.phone ? (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contacto autorizado por el vecino:</span>
                </div>
                <a
                  href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola vecino! Te contacto desde Capilla Conecta.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar mensaje por WhatsApp</span>
                </a>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-[11px] text-slate-400">
                🔒 El vecino mantiene su teléfono en privado. Puedes contactarlo mencionándolo con @ en el chat comunitario.
              </div>
            )}
          </div>

          {/* Fecha de Registro */}
          <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Miembro desde {new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
            </span>
            <span className="text-teal-600 font-semibold">Capilla Conecta</span>
          </div>

        </div>

      </div>
    </div>
  );
};
