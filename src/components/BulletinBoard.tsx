import React, { useState, useEffect } from 'react';
import {
  User,
  BulletinPost,
  PostComment,
  PostCategory,
  PostStatus,
  BARRIOS_CAPILLA,
  getFormattedUserName
} from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { CreatePostModal } from './CreatePostModal';
import {
  Plus,
  Search,
  Filter,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  Edit2,
  Trash2,
  Phone,
  Check,
  AlertCircle,
  Tag,
  ChevronDown,
  Calendar,
  Send,
  ExternalLink
} from 'lucide-react';

interface BulletinBoardProps {
  currentUser: User;
  onSelectUser: (userSummary: { id: string; name: string; avatar: string; neighborhood: string }) => void;
  presetBarrioFilter?: string;
}

export const BulletinBoard: React.FC<BulletinBoardProps> = ({
  currentUser,
  onSelectUser,
  presetBarrioFilter,
}) => {
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedBarrio, setSelectedBarrio] = useState<string>(presetBarrioFilter || 'todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeExpired, setIncludeExpired] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BulletinPost | null>(null);
  const [now, setNow] = useState(new Date());

  // Hilos de comentarios expandidos: postId -> boolean
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);

  // Timer para actualizar cuenta regresiva cada 10 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const loadPosts = () => {
    setLoading(true);
    api.getPosts({
      category: selectedCategory,
      neighborhoodId: selectedBarrio,
      search: searchQuery,
      includeExpired,
    })
      .then(res => {
        setPosts(res.posts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, [selectedCategory, selectedBarrio, searchQuery, includeExpired]);

  // Escuchar eventos en tiempo real de nuevos posts o comentarios
  useEffect(() => {
    const socket = getSocket();

    const handleNewPost = (newPost: BulletinPost) => {
      setPosts(prev => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
    };

    const handlePostUpdated = (updatedPost: BulletinPost) => {
      setPosts(prev => prev.map(p => (p.id === updatedPost.id ? updatedPost : p)));
    };

    const handlePostDeleted = ({ postId }: { postId: string }) => {
      setPosts(prev => prev.filter(p => p.id !== postId));
    };

    const handlePostLiked = ({ postId, likesCount }: { postId: string; likesCount: number }) => {
      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            return { ...p, likes: p.likes };
          }
          return p;
        })
      );
    };

    const handleNewComment = (comment: PostComment) => {
      setCommentsMap(prev => ({
        ...prev,
        [comment.postId]: [...(prev[comment.postId] || []), comment],
      }));
      setPosts(prev =>
        prev.map(p => (p.id === comment.postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
      );
    };

    socket.on('tablon:new_post', handleNewPost);
    socket.on('tablon:post_updated', handlePostUpdated);
    socket.on('tablon:post_deleted', handlePostDeleted);
    socket.on('tablon:post_liked', handlePostLiked);
    socket.on('tablon:new_comment', handleNewComment);

    return () => {
      socket.off('tablon:new_post', handleNewPost);
      socket.off('tablon:post_updated', handlePostUpdated);
      socket.off('tablon:post_deleted', handlePostDeleted);
      socket.off('tablon:post_liked', handlePostLiked);
      socket.off('tablon:new_comment', handleNewComment);
    };
  }, []);

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await api.togglePostLike(postId, currentUser.id);
      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            const hasUser = p.likes.includes(currentUser.id);
            const newLikes = hasUser
              ? p.likes.filter(id => id !== currentUser.id)
              : [...p.likes, currentUser.id];
            return { ...p, likes: newLikes };
          }
          return p;
        })
      );
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    const isExpanded = Boolean(expandedComments[postId]);
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsMap[postId]) {
      try {
        const res = await api.getComments(postId);
        setCommentsMap(prev => ({ ...prev, [postId]: res.comments }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    try {
      const res = await api.addComment(postId, currentUser.id, text);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment],
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      setToastMessage(err.message || 'Error al enviar comentario');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.deletePost(postId, currentUser.id);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setDeleteConfirmPostId(null);
      setToastMessage('Publicación retirada del tablón');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setToastMessage(err.message || 'Error al borrar anuncio');
      setTimeout(() => setToastMessage(null), 3000);
      setDeleteConfirmPostId(null);
    }
  };

  const handleQuickStatusChange = async (postId: string, newStatus: PostStatus) => {
    try {
      const res = await api.updatePost(postId, currentUser.id, { status: newStatus });
      setPosts(prev => prev.map(p => (p.id === postId ? res.post : p)));
      setToastMessage(`Estado actualizado a: ${newStatus.toUpperCase()}`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      setToastMessage(err.message || 'Error al actualizar estado');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleShare = (post: BulletinPost) => {
    const url = `${window.location.origin}/?tab=tablon&post=${post.id}`;
    const text = `Cartel en Capilla Conecta: "${post.title}" por ${post.authorName} - ${url}`;

    if (navigator.share) {
      navigator.share({ title: post.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2500);
    }
  };

  // Funciones de cálculo de tiempo
  const formatTimeLeft = (expiresAtStr: string) => {
    const diffMs = new Date(expiresAtStr).getTime() - now.getTime();
    if (diffMs <= 0) return 'Expirado';
    const hours = Math.floor(diffMs / (3600 * 1000));
    const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    return `${hours}h ${mins}m restantes`;
  };

  const getEditCountdown = (canEditUntilStr: string) => {
    const diffMs = new Date(canEditUntilStr).getTime() - now.getTime();
    if (diffMs <= 0) return null;
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-4 space-y-6">
      
      {/* Barra de Controles y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        
        <div className="flex items-center justify-between gap-3">
          {/* Título de Sección */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>📋</span>
              Tablón Vecinal
            </h2>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Ventas, regalos, búsquedas y oficios en Capilla del Monte (vigencia 24 hs)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800/50">
              {posts.length} {posts.length === 1 ? 'anuncio' : 'anuncios'}
            </span>
          </div>
        </div>

        {/* Filtros Interactivos */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Buscador */}
          <div className="sm:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar en el tablón..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Selector de Categoría */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
            >
              <option value="todos">🏷️ Todas las Categorías</option>
              <option value="vende">🛒 Vende</option>
              <option value="regala">🎁 Regala</option>
              <option value="busca">🔍 Busca</option>
              <option value="servicio">🛠️ Oficios & Servicios</option>
            </select>
          </div>

          {/* Selector de Barrio */}
          <div className="sm:col-span-3">
            <select
              value={selectedBarrio}
              onChange={e => setSelectedBarrio(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
            >
              <option value="todos">📍 Todos los Barrios</option>
              {BARRIOS_CAPILLA.map(b => (
                <option key={b.id} value={b.id}>
                  {b.icon} {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Switch de "Solo Activos" vs "Histórico / Expirados" */}
          <div className="sm:col-span-2 flex items-center justify-end">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExpired}
                onChange={e => setIncludeExpired(e.target.checked)}
                className="w-3.5 h-3.5 text-teal-600 rounded-sm border-slate-300"
              />
              <span>Ver expirados</span>
            </label>
          </div>

        </div>

      </div>

      {/* Lista de Publicaciones */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Actualizando carteles vecinales...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="text-4xl mb-3">🧺</div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron publicaciones con estos filtros
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            ¿Tenés algo para vender, regalar o estás buscando algún servicio en Capilla del Monte?
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition cursor-pointer"
          >
            Publicar el primer cartel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map(post => {
            const isAuthor = post.userId === currentUser.id;
            const isStaff = currentUser.role === 'admin' || currentUser.role === 'moderator';
            const editCountdown = isAuthor ? getEditCountdown(post.canEditUntil) : null;
            const canEdit = Boolean(editCountdown) || isStaff;
            const isLiked = post.likes.includes(currentUser.id);
            const isExpired = new Date(post.expiresAt) <= now;
            const timeLeftText = formatTimeLeft(post.expiresAt);

            // Colores distintivos según estado
            const getStatusRibbon = () => {
              if (post.status === 'vendido' || post.status === 'agotado') {
                return { label: 'VENDIDO', bg: 'bg-rose-600' };
              }
              if (post.status === 'regalado') {
                return { label: 'REGALADO', bg: 'bg-emerald-600' };
              }
              if (post.status === 'reservado') {
                return { label: 'RESERVADO', bg: 'bg-amber-600' };
              }
              if (isExpired) {
                return { label: 'EXPIRADO', bg: 'bg-slate-500' };
              }
              return null;
            };

            const ribbon = getStatusRibbon();

            return (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                {/* Cinta en la esquina superior derecha si está marcado como vendido/regalado/etc */}
                {ribbon && (
                  <div className={`absolute top-0 right-0 ${ribbon.bg} text-white font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-bl-xl shadow-xs z-10`}>
                    {ribbon.label}
                  </div>
                )}

                {/* Encabezado del Post */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2 pr-16">
                    {/* Badge de Categoría */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider text-[11px]">
                        {post.category === 'vende' && '🛒 Venta'}
                        {post.category === 'regala' && '🎁 Regalo'}
                        {post.category === 'busca' && '🔍 Búsqueda'}
                        {post.category === 'servicio' && '🛠️ Oficio & Servicio'}
                      </span>
                      <span>·</span>
                      <span>{post.authorNeighborhood}</span>
                    </div>
                  </div>

                  {/* Título */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {post.title}
                  </h3>

                  {/* Precio si existe */}
                  {post.price && (
                    <div className="mt-1 text-sm font-bold text-teal-700 dark:text-teal-400">
                      {post.price}
                    </div>
                  )}

                  {/* Datos del Autor: Avatar Nombre (Barrio) */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => onSelectUser({
                        id: post.userId,
                        name: post.authorName,
                        avatar: post.authorAvatar,
                        neighborhood: post.authorNeighborhood,
                      })}
                      className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                    >
                      <span className="text-lg">{post.authorAvatar}</span>
                      <span>{post.authorName}</span>
                    </button>
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  {/* Contenido Enriquecido */}
                  <div
                    className="mt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none break-words line-clamp-6"
                    dangerouslySetInnerHTML={{ __html: post.richContent }}
                  />

                  {/* Imagen si existe */}
                  {post.imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Metadatos de edición e información de expiración */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    
                    {/* Contador de expiración de 24 hs */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span className={isExpired ? 'text-red-500 font-bold' : ''}>
                        {timeLeftText}
                      </span>
                    </div>

                    {/* Notificación de Editado */}
                    {post.editedAt && (
                      <span className="italic text-slate-400">
                        Editado el {new Date(post.editedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} a las {new Date(post.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}

                    {/* Contador de 10 min de edición interactivo exclusivo para el autor */}
                    {isAuthor && editCountdown && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPost(post);
                          setShowCreateModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700 shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                        title="Toca aquí para editar tu anuncio"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                        <span>✏️ Tocar para editar ({editCountdown} min)</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Barra de Acciones del Post */}
                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  
                  {/* Me Gusta, Comentarios y Compartir */}
                  <div className="flex items-center gap-1.5">
                    {/* Me Gusta */}
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isLiked
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes.length}</span>
                    </button>

                    {/* Comentarios */}
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.commentsCount || 0}</span>
                    </button>

                    {/* Compartir */}
                    <button
                      onClick={() => handleShare(post)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Compartir publicación"
                    >
                      {copiedPostId === post.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Acciones del Autor / Contacto Directo */}
                  <div className="flex items-center gap-1.5">
                    
                    {/* Botón WhatsApp si el autor autorizó visibilidad */}
                    {post.authorPhoneVisible && post.authorPhone && !isAuthor && (
                      <a
                        href={`https://wa.me/${post.authorPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${post.authorName}, te contacto desde Capilla Conecta por tu anuncio: "${post.title}".`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition"
                      >
                        <Phone className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {/* Acciones exclusivas del Autor */}
                    {isAuthor && (
                      <div className="flex items-center gap-1">
                        {/* Editar: visible durante los primeros 10 min o para staff */}
                        {canEdit && (
                          <button
                            onClick={() => { setEditingPost(post); setShowCreateModal(true); }}
                            className="px-2.5 py-1 text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                            title="Editar texto del cartel"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        )}

                        {/* Menú de Marcar como Vendido/Agotado/Regalado */}
                        <select
                          value={post.status}
                          onChange={e => handleQuickStatusChange(post.id, e.target.value as PostStatus)}
                          className="text-[11px] py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold cursor-pointer"
                        >
                          <option value="activo">Estado: Activo</option>
                          <option value="vendido">Marcar Vendido</option>
                          <option value="agotado">Marcar Agotado</option>
                          <option value="regalado">Marcar Regalado</option>
                          <option value="reservado">Marcar Reservado</option>
                        </select>

                        {/* Borrar */}
                        <button
                          onClick={() => setDeleteConfirmPostId(post.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                          title="Borrar publicación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                  </div>

                </div>

                {/* Hilo de Comentarios Desplegable */}
                {expandedComments[post.id] && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Preguntas y Comentarios ({commentsMap[post.id]?.length || 0})
                    </h4>

                    {/* Lista de comentarios */}
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {(commentsMap[post.id] || []).length === 0 ? (
                        <div className="text-xs text-slate-400 italic">
                          Aún no hay comentarios. Puedes preguntarle al autor.
                        </div>
                      ) : (
                        (commentsMap[post.id] || []).map(comment => (
                          <div
                            key={comment.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{comment.authorAvatar}</span>
                                <span>{comment.authorName}</span>
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Formulario para agregar comentario */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="Escribe una pregunta o respuesta..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="p-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold transition cursor-pointer"
                        title="Enviar comentario"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear o Editar Anuncio */}
      {showCreateModal && (
        <CreatePostModal
          currentUser={currentUser}
          editingPost={editingPost}
          onClose={() => { setShowCreateModal(false); setEditingPost(null); }}
          onPostCreated={post => {
            setPosts(prev => [post, ...prev.filter(p => p.id !== post.id)]);
          }}
        />
      )}

      {/* Modal de Confirmación para retirar anuncio */}
      {deleteConfirmPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              ¿Retirar publicación?
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              El cartel dejará de ser visible para los vecinos en el tablón comunitario.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteConfirmPostId(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(deleteConfirmPostId)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                Sí, retirar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Flotante con un Más (+) para Publicar Anuncio en el Tablón */}
      <button
        type="button"
        onClick={() => {
          setEditingPost(null);
          setShowCreateModal(true);
        }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-teal-700 hover:bg-teal-800 active:scale-95 text-white shadow-2xl flex items-center justify-center border-2 border-white/20 transition-all cursor-pointer group hover:scale-105"
        title="Publicar nuevo anuncio en el tablón (+)"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Toast no intrusivo */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-teal-800 text-white text-xs font-semibold shadow-xl border border-teal-600 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

    </div>
  );
};
