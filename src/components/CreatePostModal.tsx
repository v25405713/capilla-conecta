import React, { useState } from 'react';
import {
  User,
  BulletinPost,
  BARRIOS_CAPILLA,
  PostCategory,
  PostStatus
} from '../types';
import { api } from '../services/api';
import {
  X,
  Bold,
  Italic,
  Underline,
  List,
  Smile,
  Image as ImageIcon,
  Tag,
  MapPin,
  DollarSign,
  AlertCircle,
  Clock
} from 'lucide-react';

interface CreatePostModalProps {
  currentUser: User;
  onClose: () => void;
  onPostCreated: (post: BulletinPost) => void;
  editingPost?: BulletinPost | null;
}

const EMOJI_INSERTS = ['🧺', '🔧', '📦', '🚲', '🌱', '🍯', '🏡', '🎸', '🐶', '🚗', '📚', '⚡', '✨'];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentUser,
  onClose,
  onPostCreated,
  editingPost,
}) => {
  const [title, setTitle] = useState(editingPost?.title || '');
  const [category, setCategory] = useState<PostCategory>(editingPost?.category || 'vende');
  const [neighborhoodId, setNeighborhoodId] = useState(editingPost?.neighborhoodId || currentUser.neighborhoodId);
  const [price, setPrice] = useState(editingPost?.price || '');
  const [imageUrl, setImageUrl] = useState(editingPost?.imageUrl || '');
  const [status, setStatus] = useState<PostStatus>(editingPost?.status || 'activo');
  const [contentHtml, setContentHtml] = useState(editingPost?.richContent || '');
  const [fontSize, setFontSize] = useState('medium');
  const [textColor, setTextColor] = useState('#1e293b');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const isEditing = Boolean(editingPost);

  // Funciones de formato enriquecido ejecutadas en el textarea / contentEditable o markup
  const applyFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  const handleInsertEmoji = (emoji: string) => {
    document.execCommand('insertText', false, emoji);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const editorEl = document.getElementById('rich-editor');
    const finalHtml = editorEl ? editorEl.innerHTML : contentHtml;

    if (!title.trim()) {
      setError('Por favor indica un título claro para tu cartel.');
      return;
    }

    if (!finalHtml.trim() || finalHtml === '<br>') {
      setError('Por favor ingresa los detalles del anuncio.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && editingPost) {
        const res = await api.updatePost(editingPost.id, currentUser.id, {
          title: title.trim(),
          richContent: finalHtml,
          price: price.trim(),
          imageUrl: imageUrl.trim(),
          status,
        });
        onPostCreated(res.post);
      } else {
        const res = await api.createPost({
          userId: currentUser.id,
          title: title.trim(),
          category,
          neighborhoodId,
          richContent: finalHtml,
          price: price.trim(),
          imageUrl: imageUrl.trim(),
        });
        onPostCreated(res.post);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el anuncio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-teal-600" />
              {isEditing ? 'Editar Anuncio en el Tablón' : 'Publicar Anuncio Comunitario'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visible por 24 horas para todos los vecinos de Capilla del Monte
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificaciones y Avisos de Regla */}
        <div className="p-4 bg-teal-50/60 dark:bg-teal-950/20 border-b border-teal-100 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300 flex items-start gap-2">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span><b>Regla del Tablón:</b> Cada anuncio tiene una duración activa de <b>24 horas</b>. Podrás editar el contenido únicamente durante los <b>primeros 10 minutos</b> desde su publicación.</span>
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título del anuncio *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Vendo garrafa de 10 kg llena o Busco flete a La Cumbre"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Categoría y Barrio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Anuncio *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as PostCategory)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
              >
                <option value="vende">🛒 Vende (Venta de artículos)</option>
                <option value="regala">🎁 Regala (Donación sin costo)</option>
                <option value="busca">🔍 Busca (Necesito / Compro)</option>
                <option value="servicio">🛠️ Servicio (Oficios & Profesiones)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Barrio de Referencia *
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

          {/* Precio y Estado (si está editando) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Precio o Condición <span className="text-slate-400 font-normal">(ej: $15.000 o A convenir)</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Ej: $25.000 o Sin costo"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {isEditing && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marcar Estado del Cartel
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as PostStatus)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                >
                  <option value="activo">🟢 Activo / Disponible</option>
                  <option value="vendido">🔴 Vendido / Agotado</option>
                  <option value="regalado">🎁 Regalado</option>
                  <option value="reservado">🟡 Reservado</option>
                </select>
              </div>
            )}
          </div>

          {/* Barra de Formato Enriquecido */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descripción detallada (Editor enriquecido) *
            </label>
            
            <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
              
              {/* Toolbar */}
              <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => applyFormat('bold')}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                  title="Negrita"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('italic')}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                  title="Itálica"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('underline')}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                  title="Subrayado"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('insertUnorderedList')}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                  title="Lista con viñetas"
                >
                  <List className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

                {/* Tamaño de letra */}
                <select
                  value={fontSize}
                  onChange={e => {
                    setFontSize(e.target.value);
                    applyFormat('fontSize', e.target.value === 'small' ? '2' : e.target.value === 'large' ? '5' : '3');
                  }}
                  className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer"
                >
                  <option value="small">Tamaño Chico</option>
                  <option value="medium">Tamaño Normal</option>
                  <option value="large">Tamaño Grande</option>
                </select>

                {/* Color de texto */}
                <select
                  value={textColor}
                  onChange={e => {
                    setTextColor(e.target.value);
                    applyFormat('foreColor', e.target.value);
                  }}
                  className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer"
                >
                  <option value="#0f172a">Texto Oscuro</option>
                  <option value="#0f766e">Verde Serrano</option>
                  <option value="#b45309">Ocre / Ámbar</option>
                  <option value="#b91c1c">Rojo Alerta</option>
                  <option value="#2563eb">Azul Valle</option>
                </select>

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

                {/* Insertar Imagen */}
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Añadir URL de imagen"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                  <span>Imagen</span>
                </button>

                {/* Emojis Rápidos */}
                <div className="flex items-center gap-1 ml-auto">
                  {EMOJI_INSERTS.slice(0, 6).map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => handleInsertEmoji(em)}
                      className="p-1 hover:scale-125 transition-transform text-xs cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input opcional de URL de Imagen */}
              {showImageInput && (
                <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="URL de la foto (opcional)"
                    className="flex-1 px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImageInput(false)}
                    className="text-xs px-2.5 py-1 rounded bg-teal-600 text-white cursor-pointer"
                  >
                    Listo
                  </button>
                </div>
              )}

              {/* Editable Area */}
              <div
                id="rich-editor"
                contentEditable
                dangerouslySetInnerHTML={{ __html: contentHtml }}
                className="p-3.5 min-h-[140px] max-h-[220px] overflow-y-auto text-sm text-slate-900 dark:text-white focus:outline-hidden prose prose-sm dark:prose-invert max-w-none"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isEditing ? 'Guardar Cambios' : 'Publicar Anuncio'}</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
