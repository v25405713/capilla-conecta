import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  ChatMessage,
  BARRIOS_CAPILLA,
  getFormattedUserName,
  AvatarEmoji
} from '../types';
import { api } from '../services/api';
import {
  getSocket,
  switchRoomOnSocket,
  emitChatMessage,
  emitTyping,
  emitReaction
} from '../services/socket';
import {
  Send,
  Smile,
  Trash2,
  Flag,
  Lock,
  Users,
  Search,
  AlertTriangle,
  AtSign,
  Info,
  ChevronDown,
  X
} from 'lucide-react';
import { ConnectedUsersPanel } from './ConnectedUsersPanel';

interface ChatViewProps {
  currentUser: User | null;
  onSelectUser: (userSummary: { id: string; name: string; avatar: string; neighborhood: string }) => void;
  initialRoomId?: string;
  onRequireAuth?: () => void;
}

const QUICK_EMOJIS = ['🧉', '⛰️', '🌲', '👍', '❤️', '👏', '🌞', '🦊', '🏠'];
const REACTION_EMOJIS = ['👍', '❤️', '🧉', '👏', '😂'];

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  onSelectUser,
  initialRoomId = 'todos-juntos',
  onRequireAuth,
}) => {
  const [currentRoomId, setCurrentRoomId] = useState(initialRoomId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, { userName: string; userAvatar: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reportModalMessage, setReportModalMessage] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState('ofensivo');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [deleteConfirmMessageId, setDeleteConfirmMessageId] = useState<string | null>(null);
  const [showConnectedPanel, setShowConnectedPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Scroll aislado únicamente dentro del contenedor interno de mensajes (evita mover la pantalla o ventana)
  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      if (smooth) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' });
    }
  };

  // Determinar si el usuario puede escribir en esta sala
  const currentBarrioObj = BARRIOS_CAPILLA.find(b => b.id === currentRoomId);
  const isGeneralRoom = currentRoomId === 'todos-juntos';
  const isUserResidentOfRoom = currentUser ? currentUser.neighborhoodId === currentRoomId : false;
  const isStaff = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'moderator') : false;
  // Regla barrial estricta: en la sala general todos pueden escribir; en las salas de barrio solo los vecinos residentes de ese barrio (o staff)
  const canPostInRoom = Boolean(currentUser) && (isGeneralRoom || isUserResidentOfRoom || isStaff);

  // Cargar mensajes al cambiar de sala
  useEffect(() => {
    setLoading(true);
    setErrorBanner('');
    api.getMessages(currentRoomId, 100)
      .then(res => {
        setMessages(res.messages);
        setLoading(false);
        // Scroll interno a los últimos mensajes
        setTimeout(() => {
          scrollToBottom(false);
        }, 80);
      })
      .catch(err => {
        setErrorBanner(err.message || 'Error cargando mensajes');
        setLoading(false);
      });

    // Cambiar de sala en Socket.io
    if (currentUser) {
      switchRoomOnSocket(currentRoomId, currentUser.id);
    }
  }, [currentRoomId, currentUser?.id]);

  // Escuchar eventos de Socket.io
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.roomId === currentRoomId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => {
          scrollToBottom(true);
        }, 60);
      }
    };

    const handleReactionUpdated = ({ messageId, reactions }: { messageId: string; reactions: Record<string, string[]> }) => {
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const handleUserTyping = ({ roomId, userId, userName, userAvatar, isTyping }: any) => {
      if (roomId === currentRoomId && (!currentUser || userId !== currentUser.id)) {
        setTypingUsers(prev => {
          const next = { ...prev };
          if (isTyping) {
            next[userId] = { userName, userAvatar };
          } else {
            delete next[userId];
          }
          return next;
        });
      }
    };

    const handleChatError = ({ message }: { message: string }) => {
      setErrorBanner(message);
      setTimeout(() => setErrorBanner(''), 4000);
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:reaction_updated', handleReactionUpdated);
    socket.on('chat:message_deleted', handleMessageDeleted);
    socket.on('chat:user_typing', handleUserTyping);
    socket.on('chat:error', handleChatError);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:reaction_updated', handleReactionUpdated);
      socket.off('chat:message_deleted', handleMessageDeleted);
      socket.off('chat:user_typing', handleUserTyping);
      socket.off('chat:error', handleChatError);
    };
  }, [currentRoomId, currentUser?.id]);

  // Manejo de tipeo
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Menciones @
    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }

    if (currentUser) {
      emitTyping(currentRoomId, currentUser.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(currentRoomId, currentUser.id, false);
      }, 1500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    const textToSend = inputText.trim();
    if (!textToSend) return;

    if (!canPostInRoom) {
      setErrorBanner(`Solo los vecinos residentes de ${currentBarrioObj?.name} pueden enviar mensajes en esta sala.`);
      return;
    }

    // Crear mensaje optimista inmediato para que aparezca al instante
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const optimisticMsg: ChatMessage = {
      id: tempId,
      roomId: currentRoomId,
      userId: currentUser.id,
      userName: getFormattedUserName(currentUser),
      userAvatar: currentUser.avatarEmoji,
      userNeighborhood: currentUser.neighborhoodId,
      userRole: currentUser.role,
      text: textToSend,
      mentions: [],
      reactions: {},
      isReported: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };

    // Actualizar pantalla inmediatamente
    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');
    setShowEmojiPicker(false);
    setShowMentionSuggestions(false);

    // Scroll inmediato hacia abajo
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);

    // Guardar en la base de datos o localStorage
    try {
      const res = await api.sendMessage(currentRoomId, currentUser.id, textToSend);
      if (res && res.message) {
        setMessages(prev => prev.map(m => (m.id === tempId ? res.message : m)));
      }
    } catch (err: any) {
      console.warn('Fallback al guardar mensaje:', err);
    }

    // Emitir por WebSocket si está conectado
    try {
      emitChatMessage(currentRoomId, currentUser.id, textToSend);
      emitTyping(currentRoomId, currentUser.id, false);
    } catch {
      // Ignorar si el socket está desconectado
    }
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    emitReaction(messageId, currentUser.id, emoji, currentRoomId);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser) return;
    try {
      await api.deleteMessage(messageId, currentUser.id);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setDeleteConfirmMessageId(null);
      setFeedbackToast('Mensaje eliminado');
      setTimeout(() => setFeedbackToast(null), 2500);
    } catch (err: any) {
      setErrorBanner(err.message || 'No tienes permiso para borrar este mensaje.');
      setDeleteConfirmMessageId(null);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportModalMessage || !currentUser) return;
    try {
      await api.reportMessage(reportModalMessage.id, currentUser.id, reportReason);
      setReportModalMessage(null);
      setFeedbackToast('Reporte enviado a los moderadores comunitarios. Gracias por cuidar Capilla Conecta.');
      setTimeout(() => setFeedbackToast(null), 3500);
    } catch (err: any) {
      setErrorBanner('Error enviando reporte: ' + err.message);
    }
  };

  // Filtrado de búsqueda
  const filteredMessages = messages.filter(m => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return m.text.toLowerCase().includes(q) || m.userName.toLowerCase().includes(q);
  });

  const typingList = Object.values(typingUsers);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 border-y md:border md:rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      
      {/* Barra Superior del Chat: Selector de Salas, Búsqueda y Vecinos */}
      <div className="p-2.5 sm:p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        
        {/* Selector de Salas */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={currentRoomId}
              onChange={e => setCurrentRoomId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
            >
              <option value="todos-juntos">⛰️ Sala General "Todos juntos"</option>
              <optgroup label="Salas por Barrio de Capilla del Monte">
                {BARRIOS_CAPILLA.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.icon} Barrio {b.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Badge informativo de sala */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {isGeneralRoom ? (
              <span>Todos los vecinos de Capilla</span>
            ) : (
              <span>Barrio {currentBarrioObj?.name}</span>
            )}
          </div>
        </div>

        {/* Acciones: Buscador de mensajes y Botón de Vecinos */}
        <div className="flex items-center gap-2">
          <div className="relative w-32 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar en el chat..."
              className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowConnectedPanel(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              showConnectedPanel
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="Ver vecinos conectados"
          >
            <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Vecinos</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>

      </div>

      {/* Banner de regla de sala de barrio (si solo residentes pueden escribir) */}
      {!isGeneralRoom && (
        <div className={`px-4 py-2 text-xs flex items-center justify-between border-b shrink-0 ${
          canPostInRoom
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {canPostInRoom ? (
              <span className="font-semibold">¡Sos vecino residente de Barrio {currentBarrioObj?.name}! Podés participar y escribir libremente.</span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                Solo los vecinos residentes de <b>{currentBarrioObj?.name}</b> pueden escribir aquí. Puedes leer todos los mensajes.
              </span>
            )}
          </div>
        </div>
      )}

      {errorBanner && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Contenedor Principal Flexible (100% ancho) */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        
        {/* Columna de Chat Principal */}
        <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
          
          {/* Lista de Mensajes con scroll estrictamente interno */}
          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain chat-messages-container p-3 sm:p-4 space-y-3"
          >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Cargando mensajes en tiempo real...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center px-4">
            <div className="text-3xl mb-2">⛰️</div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No hay mensajes aún en esta sala
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Sé el primer vecino en saludar, compartir una novedad o coordinar con la comunidad.
            </p>
          </div>
        ) : (
          filteredMessages.map(msg => {
            const isMe = currentUser ? msg.userId === currentUser.id : false;
            const canDelete = isMe || isStaff;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 group animate-in fade-in ${
                  isMe ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar Emoticon clickable */}
                <button
                  onClick={() => onSelectUser({
                    id: msg.userId,
                    name: msg.userName,
                    avatar: msg.userAvatar,
                    neighborhood: msg.userNeighborhood
                  })}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 hover:scale-105 transition-transform shadow-2xs border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Ver perfil del vecino"
                >
                  {msg.userAvatar}
                </button>

                {/* Burbuja del Mensaje */}
                <div className={`max-w-[85%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {/* Encabezado: Nombre (Barrio) */}
                  <div className={`flex items-center gap-2 mb-0.5 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                    <button
                      onClick={() => onSelectUser({
                        id: msg.userId,
                        name: msg.userName,
                        avatar: msg.userAvatar,
                        neighborhood: msg.userNeighborhood
                      })}
                      className="font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                    >
                      {msg.userName}
                    </button>
                    {msg.userRole === 'admin' && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Coordinador
                      </span>
                    )}
                    <span className="text-slate-400 text-[10px]">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Cuerpo del Mensaje */}
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm shadow-xs ${
                      isMe
                        ? 'bg-teal-700 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>

                  {/* Reacciones y Acciones */}
                  <div className={`flex flex-wrap items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : ''}`}>
                    {/* Botones de Reacción existentes */}
                    {Object.entries(msg.reactions || {}).map(([emoji, userIds]) => {
                      const hasReacted = currentUser ? userIds.includes(currentUser.id) : false;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors cursor-pointer ${
                            hasReacted
                              ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-400 text-teal-800 dark:text-teal-200 font-bold'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px]">{userIds.length}</span>
                        </button>
                      );
                    })}

                    {/* Selector de Reacciones rápidas */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      {REACTION_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="hover:scale-125 transition-transform p-0.5 text-xs cursor-pointer"
                          title={`Reaccionar con ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}

                      {/* Botón Borrar si es autor o mod */}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteConfirmMessageId(msg.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                          title="Borrar mensaje"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Botón Reportar */}
                      {!isMe && (
                        <button
                          onClick={() => setReportModalMessage(msg)}
                          className="p-1 text-slate-400 hover:text-amber-500 rounded transition cursor-pointer"
                          title="Reportar mensaje a moderación"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Indicador de "Escribiendo..." */}
      {typingList.length > 0 && (
        <div className="px-4 py-1 text-xs text-teal-700 dark:text-teal-400 italic flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
          <div className="flex -space-x-1">
            {typingList.slice(0, 3).map((t, idx) => (
              <span key={idx} className="text-sm">{t.userAvatar}</span>
            ))}
          </div>
          <span>
            {typingList.map(t => t.userName).join(', ')} {typingList.length === 1 ? 'está escribiendo...' : 'están escribiendo...'}
          </span>
        </div>
      )}

      {/* Input de Mensaje */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 relative">
        
        {/* Sugerencias de mención @ */}
        {showMentionSuggestions && (
          <div className="absolute bottom-full left-4 mb-2 w-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-2 z-20">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Mencionar a un vecino
            </div>
            <div className="space-y-1">
              {['María Serrana', 'Carlos Tallador', 'Luna Sendas', 'Coordinación Vecinal'].map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    const words = inputText.split(' ');
                    words.pop();
                    setInputText([...words, `@${name} `].join(' '));
                    setShowMentionSuggestions(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 font-medium cursor-pointer"
                >
                  @{name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Barra de Emojis Rápidos */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 text-sm">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Yuyos & Serranía:</span>
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => setInputText(prev => prev + emoji)}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 transition-transform cursor-pointer shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Form or Guest Banner */}
        {!currentUser ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900/60 text-xs">
            <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
              <span className="text-base">👋</span>
              <span>Estás explorando el chat en modo visitante. Para participar y enviar mensajes:</span>
            </div>
            <button
              type="button"
              onClick={onRequireAuth}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
            >
              Ingresar / Registrarse
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              disabled={!canPostInRoom}
              placeholder={
                canPostInRoom
                  ? `Escribe en ${isGeneralRoom ? 'Todos juntos' : 'Barrio ' + currentBarrioObj?.name}... (usa @ para mencionar)`
                  : `Solo los vecinos residentes de ${currentBarrioObj?.name} pueden escribir aquí.`
              }
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 disabled:cursor-not-allowed"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || !canPostInRoom}
              className="p-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs disabled:opacity-40 transition-colors cursor-pointer shrink-0 disabled:cursor-not-allowed"
              title={canPostInRoom ? "Enviar mensaje" : `Solo residentes de ${currentBarrioObj?.name}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>

    {/* Panel lateral deslizable de Vecinos Conectados */}
    {showConnectedPanel && (
      <div className="absolute inset-y-0 right-0 z-30 w-72 sm:w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            Vecinos en Capilla
          </span>
          <button
            type="button"
            onClick={() => setShowConnectedPanel(false)}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConnectedUsersPanel
            currentRoomId={currentRoomId}
            onSelectUser={(u: any) => onSelectUser({
              id: u.id,
              name: u.displayName || u.name,
              avatar: u.avatarEmoji || u.avatar,
              neighborhood: u.neighborhoodId
            })}
          />
        </div>
      </div>
    )}
  </div>

      {/* Modal de Reporte */}
      {reportModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-500" />
              Reportar mensaje a moderación
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mensaje de <b>{reportModalMessage.userName}</b>: "{reportModalMessage.text.substring(0, 50)}..."
            </p>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Motivo del reporte:
              </label>
              <select
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ofensivo">Contenido agresivo o insulto</option>
                <option value="spam">Spam comercial no deseado</option>
                <option value="estafa">Posible estafa o engaño</option>
                <option value="ilegal">Contenido peligroso o ilegal</option>
                <option value="otro">Otro incumplimiento de convivencia</option>
              </select>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setReportModalMessage(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                Enviar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado */}
      {deleteConfirmMessageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              ¿Borrar este mensaje?
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Esta acción eliminará el mensaje para todos los vecinos en esta sala de Capilla Conecta.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteConfirmMessageId(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMessage(deleteConfirmMessageId)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast no intrusivo */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-teal-800 text-white text-xs font-semibold shadow-xl border border-teal-600 animate-in fade-in slide-in-from-bottom-2">
          {feedbackToast}
        </div>
      )}

    </div>
  );
};
