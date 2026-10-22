import React, { useState } from 'react';
import {
  User,
  BARRIOS_CAPILLA,
  AVATAR_OPTIONS,
  AvatarEmoji,
  getFormattedUserName
} from '../types';
import { api } from '../services/api';
import {
  X,
  User as UserIcon,
  MapPin,
  Phone,
  Shield,
  Calendar,
  Lock,
  LogOut,
  AlertCircle,
  Check,
  Clock
} from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  onClose,
  onUpdateUser,
  onLogout,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [avatarEmoji, setAvatarEmoji] = useState<AvatarEmoji>(user.avatarEmoji);
  const [neighborhoodId, setNeighborhoodId] = useState(user.neighborhoodId);
  const [phone, setPhone] = useState(user.phone || '');
  const [phoneVisible, setPhoneVisible] = useState(user.phoneVisible);
  const [bio, setBio] = useState(user.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Regla de los 30 días para cambio de barrio
  const lastChangeDate = new Date(user.lastNeighborhoodChange || user.createdAt).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const timeSince = Date.now() - lastChangeDate;
  const canChangeNeighborhood = timeSince >= thirtyDaysMs || user.role === 'admin';
  const daysLeftForNeighborhood = Math.max(1, Math.ceil((thirtyDaysMs - timeSince) / (24 * 60 * 60 * 1000)));

  const currentBarrioName = BARRIOS_CAPILLA.find(b => b.id === user.neighborhoodId)?.name || user.neighborhoodId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updates: Partial<User> = {
        displayName: displayName.trim(),
        avatarEmoji,
        phone: phone.trim(),
        phoneVisible,
        bio: bio.trim(),
      };

      if (canChangeNeighborhood && neighborhoodId !== user.neighborhoodId) {
        updates.neighborhoodId = neighborhoodId;
      }

      const res = await api.updateProfile(user.id, updates);
      onUpdateUser(res.user);
      setSuccess('¡Perfil actualizado con éxito!');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{avatarEmoji}</span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mi Perfil Vecinal
              </h3>
              <p className="text-xs text-slate-500">
                {getFormattedUserName({ displayName, email: user.email, neighborhoodId: user.neighborhoodId })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="m-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Nombre visible o Nick */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre Visible o Apodo
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Ej: Marcelo o Don Pedro"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Barrio y Regla de 30 días */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tu Barrio en Capilla del Monte
              </label>
              {!canChangeNeighborhood && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3" />
                  Bloqueado por {daysLeftForNeighborhood} días más
                </span>
              )}
            </div>

            {canChangeNeighborhood ? (
              <select
                value={neighborhoodId}
                onChange={e => setNeighborhoodId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {BARRIOS_CAPILLA.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.icon} {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>📍 Barrio <b>{currentBarrioName}</b></span>
                <span className="text-[11px] text-slate-400">Cambio permitido cada 30 días</span>
              </div>
            )}
          </div>

          {/* Selector de Avatar (20 opciones predefinidas) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cambiar Emoticón de Avatar (20 opciones disponibles)
            </label>
            <div className="grid grid-cols-10 gap-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {AVATAR_OPTIONS.map(opt => (
                <button
                  key={opt.emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(opt.emoji)}
                  title={opt.label}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform cursor-pointer ${
                    avatarEmoji === opt.emoji
                      ? 'bg-teal-600 text-white scale-110 shadow-sm ring-2 ring-teal-500'
                      : 'hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Teléfono y Switch de Visibilidad */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+54 9 3548..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 pt-1">
              <input
                type="checkbox"
                checked={phoneVisible}
                onChange={e => setPhoneVisible(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
              />
              <span>Hacer visible mi WhatsApp a otros vecinos en mis anuncios y perfil</span>
            </label>
          </div>

          {/* Biografía corta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Biografía / Presentación en el pueblo
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Contale a los vecinos a qué te dedicás o qué te gusta de Capilla..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Datos del usuario */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Registrado el {new Date(user.createdAt).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span className="capitalize">{user.role === 'admin' ? 'Coordinador' : 'Vecino'}</span>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
