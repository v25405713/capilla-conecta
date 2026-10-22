import React, { useState } from 'react';
import {
  BARRIOS_CAPILLA,
  AVATAR_OPTIONS,
  AvatarEmoji,
  User,
  getFormattedUserName
} from '../types';
import { api } from '../services/api';
import { Lock, Mail, UserCheck, Sparkles, Check, AlertCircle, ShieldCheck, X, Smartphone, Download } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User) => void;
  onClose?: () => void;
  onOpenInstallModal?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose, onOpenInstallModal }) => {
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('centro');
  const [avatarEmoji, setAvatarEmoji] = useState<AvatarEmoji>('⛰️');
  const [phone, setPhone] = useState('');
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [acceptRules, setAcceptRules] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [showDemoList, setShowDemoList] = useState(false);

  // Load demo users for rapid testing
  React.useEffect(() => {
    api.getDemoUsers()
      .then(res => setDemoUsers(res.users))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (isRegister) {
      if (!neighborhoodId) {
        setError('El barrio es obligatorio. Selecciona el tuyo.');
        return;
      }
      if (!avatarEmoji) {
        setError('Debes elegir tu emoticón de avatar.');
        return;
      }
      if (!acceptRules) {
        setError('Debes aceptar las normas de convivencia vecinal.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await api.register({
          email: email.trim().toLowerCase(),
          password: password || '123456',
          displayName: displayName.trim(),
          neighborhoodId,
          avatarEmoji,
          phone: phone.trim(),
          phoneVisible,
        });
        onSuccess(res.user);
      } else {
        const res = await api.login(email.trim().toLowerCase(), password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.switchDemo(userId);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Error al acceder como demo');
    } finally {
      setLoading(false);
    }
  };

  // Live preview of formatted name: Nombre (Barrio)
  const previewFormattedName = getFormattedUserName({
    displayName: displayName || (email ? email.split('@')[0] : 'Tu Nombre'),
    email,
    neighborhoodId,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header con identidad de Capilla del Monte */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 p-6 text-white text-center relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Explorar la web como invitado"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md mb-2 border border-white/20 text-3xl shadow-inner">
            ⛰️
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Capilla Conecta</h2>
          <p className="text-xs text-teal-100 max-w-md mx-auto mt-1">
            Chat y tablón comunitario exclusivo para vecinos de Capilla del Monte, Córdoba
          </p>
        </div>

        {/* Formulario */}
        <div className="p-6">
          {/* Banner de acceso web e instalación móvil / APK */}
          {onOpenInstallModal && (
            <div className="mb-4 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-teal-900 dark:text-teal-200">
                    Capilla Conecta en tu Celular
                  </div>
                  <div className="text-[11px] text-teal-700 dark:text-teal-400">
                    Instalar en navegador o descargar archivo .APK
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar / APK</span>
              </button>
            </div>
          )}

          {/* Selector de Modo */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                isRegister
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Nuevo Vecino (Registrarse)
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                !isRegister
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Ya tengo cuenta (Iniciar sesión)
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email y Contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vecino@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña {isRegister && <span className="font-normal text-slate-400">(mín. 4 car.)</span>}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {isRegister && (
              <>
                {/* Nombre visible y Barrio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre o Nick <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Ej: Marcelo o Don Pepe"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tu Barrio en Capilla *
                    </label>
                    <select
                      value={neighborhoodId}
                      onChange={e => setNeighborhoodId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                    >
                      {BARRIOS_CAPILLA.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.icon} {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Regla clave: Vista previa obligatoria Nombre (Barrio) */}
                <div className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Así te verán los vecinos:</span>
                  <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
                    <span className="text-base">{avatarEmoji}</span>
                    <span>{previewFormattedName}</span>
                  </div>
                </div>

                {/* Selección de avatar: 20 emoticones (sin fotos) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Elige tu avatar (20 emoticones serranos):
                    </label>
                    <span className="text-[11px] text-slate-500">Sin fotos para privacidad</span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    {AVATAR_OPTIONS.map(opt => (
                      <button
                        key={opt.emoji}
                        type="button"
                        onClick={() => setAvatarEmoji(opt.emoji)}
                        title={opt.label}
                        className={`h-10 sm:h-9 rounded-lg flex items-center justify-center text-xl transition-all cursor-pointer ${
                          avatarEmoji === opt.emoji
                            ? 'bg-teal-600 text-white scale-105 shadow-md ring-2 ring-teal-500'
                            : 'hover:bg-white dark:hover:bg-slate-700 hover:scale-105 bg-white/60 dark:bg-slate-850'
                        }`}
                      >
                        {opt.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WhatsApp y switch de visibilidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono / WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+54 3548..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={phoneVisible}
                        onChange={e => setPhoneVisible(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
                      />
                      <span>Mostrar número a otros vecinos</span>
                    </label>
                  </div>
                </div>

                {/* Normas de convivencia */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptRules}
                      onChange={e => setAcceptRules(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500 mt-0.5 shrink-0"
                    />
                    <span>
                      Acepto las <b>Reglas de Convivencia de Capilla del Monte</b>: respeto mutuo, no insultos ni agravios, no spam comercial repetitivo y cuidado comunitario.
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* Botón principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRegister ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Ingresar a Capilla Conecta</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Accesos rápidos de prueba (Demo vecinos de Capilla) */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Vecinos de prueba en 1 clic
              </span>
              <button
                type="button"
                onClick={() => setShowDemoList(!showDemoList)}
                className="text-xs text-teal-600 hover:underline cursor-pointer"
              >
                {showDemoList ? 'Ocultar' : 'Ver vecinos'}
              </button>
            </div>

            {showDemoList && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {demoUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickDemo(u.id)}
                    className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-xl shrink-0">{u.avatarEmoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {u.formattedName}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {u.role === 'admin' ? 'Coordinador' : 'Vecino'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {onClose && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer"
              >
                Continuar explorando la web como vecino invitado →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
