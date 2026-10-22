import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Share2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Tablet,
  Check
} from 'lucide-react';

interface MobileInstallModalProps {
  onClose: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'direct' | 'why_apk_failed' | 'ios' | 'developer'>(
    isIOS ? 'ios' : 'direct'
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://capillaconecta.app';
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentOrigin)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl my-4 sm:my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[92dvh] flex flex-col">
        
        {/* Header con gradiente serrano */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl border border-white/20 shadow-inner shrink-0">
              📱
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight">
                Instalar Capilla Conecta
              </h3>
              <p className="text-[11px] sm:text-xs text-teal-100">
                Compatible con celulares, tablets Android e iPads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación Responsivas */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] sm:text-xs overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 min-w-[130px] py-2.5 sm:py-3 px-2 font-bold border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'direct'
                ? 'border-teal-600 text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Instalar (Oficial)</span>
          </button>

          <button
            onClick={() => setActiveTab('why_apk_failed')}
            className={`flex-1 min-w-[140px] py-2.5 sm:py-3 px-2 font-bold border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'why_apk_failed'
                ? 'border-teal-600 text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>¿Por qué falló el APK?</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'ios'
                ? 'border-teal-600 text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>iPhone / iPad</span>
          </button>

          <button
            onClick={() => setActiveTab('developer')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'developer'
                ? 'border-teal-600 text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>Play Store / APK</span>
          </button>
        </div>

        {/* Contenido scrolleable de la pestaña */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300">
          
          {/* PESTAÑA 1: INSTALACIÓN DIRECTA EN NAVEGADOR (PWA / WebAPK Oficial) */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Método oficial recomendado por Google para Android y Tablets:</span>
                  <p className="mt-1 leading-relaxed text-emerald-800 dark:text-emerald-300">
                    No necesitas descargar archivos .apk externos ni activar orígenes desconocidos. Tu navegador (Google Chrome o Samsung Internet) genera e instala automáticamente la aplicación nativa en tu dispositivo.
                  </p>
                </div>
              </div>

              {/* Botón de 1-Clic si el navegador soporta el trigger */}
              {isInstallable ? (
                <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800 text-center space-y-2">
                  <button
                    onClick={async () => {
                      const success = await install();
                      if (success) onClose();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Instalar Aplicación en este Dispositivo</span>
                  </button>
                  <p className="text-[11px] text-teal-800 dark:text-teal-300">
                    Toca aquí y presiona "Instalar" en la ventana que aparece.
                  </p>
                </div>
              ) : isInstalled ? (
                <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-center text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                  ✅ ¡Capilla Conecta ya está instalada en tu dispositivo! Puedes abrirla desde tu pantalla de inicio o cajón de aplicaciones.
                </div>
              ) : null}

              {/* Paso a paso visual para cualquier Android & Tablet */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                  Cómo instalar desde Google Chrome (en 3 pasos simples):
                </h4>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Abre el enlace en Google Chrome o Samsung Internet</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">En tu celular o tablet Android.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Toca los 3 puntitos (⋮) arriba a la derecha</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Es el menú principal del navegador.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Selecciona "Instalar aplicación" o "Agregar a la pantalla principal"</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">¡Listo! Se creará el ícono en tu pantalla de inicio y funcionará a pantalla completa sin barra de navegación.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón para compartir enlace al celular */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  {currentOrigin}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar enlace'}</span>
                </button>
              </div>

            </div>
          )}

          {/* PESTAÑA 2: ¿POR QUÉ FALLÓ EL APK Y CÓMO SE RESUELVE? */}
          {activeTab === 'why_apk_failed' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>¿Por qué te salió "Error al analizar el paquete"?</span>
                </div>
                <p className="leading-relaxed">
                  En las versiones modernas de Android (Android 11, 12, 13, 14 y 15), Google cambió las reglas de seguridad:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Bloquea archivos <code>.apk</code> descargados de internet que no fueron compilados con el SDK exacto de tu arquitectura de procesador (ARM64 vs x86).</li>
                  <li>Exige que el paquete esté firmado con certificados de Google Play o empaquetado a través del sistema WebAPK.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-950 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>La Solución Definitiva (100% Funcional sin errores):</span>
                </div>
                <p className="leading-relaxed text-emerald-800 dark:text-emerald-300">
                  No necesitas descargar ningún archivo de instalación manual. La tecnología moderna de esta aplicación permite instalarla directamente desde el navegador de tu celular como <b>WebAPK nativo</b>.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('direct')}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ir a la Pestaña "Instalar (Oficial)" →</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-2">
                <h5 className="font-bold text-slate-800 dark:text-slate-200">
                  Ventajas del instalador web oficial sobre un APK tradicional:
                </h5>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><b>Cero errores de paquete:</b> Tu propio teléfono construye el instalador.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><b>Actualizaciones automáticas:</b> Cada mejora se actualiza sola al instante sin reinstalar.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><b>Liviana:</b> Ocupa menos de 2 MB de memoria en lugar de 50 MB.</span>
                  </li>
                </ul>
              </div>

            </div>
          )}

          {/* PESTAÑA 3: IPHONE / IPAD */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Tablet className="w-3.5 h-3.5 text-teal-600" />
                  Instalación en iPhone / iPad (Navegador Safari):
                </h4>
                <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <span>Abre este enlace en el navegador <b>Safari</b> de tu iPhone o iPad.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <span>Toca el botón <b>Compartir</b> (el icono cuadrado con la flecha hacia arriba en la barra inferior).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <span>Desplázate hacia abajo y selecciona <b>"Agregar a inicio"</b> (Add to Home Screen).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                    <span>Toca <b>"Agregar"</b> arriba a la derecha. ¡Listo! Quedará como app nativa.</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* PESTAÑA 4: PLAY STORE / GENERAR APK CERTIFICADO CON PWABUILDER */}
          {activeTab === 'developer' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  ¿Quieres publicar Capilla Conecta en Google Play Store o compilar un APK firmado?
                </span>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  Microsoft PWABuilder toma la URL pública de la aplicación y genera un paquete <code>.apk</code> y <code>.aab</code> (Android App Bundle) listo para firmar con tu clave o subir directamente a la Play Store.
                </p>
              </div>

              <div className="space-y-2">
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir Generador de APK en PWABuilder (Gratis)</span>
                </a>
                <span className="text-[11px] text-slate-400 text-center block">
                  Herramienta oficial respaldada por Google y Microsoft
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px] truncate">
            Capilla Conecta · Comunidad de Capilla del Monte
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

