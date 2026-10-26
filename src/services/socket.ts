import { io, Socket } from 'socket.io-client';
import { ChatMessage, OnlineUser } from '../types';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    let socketUrl: string | undefined = undefined;

    if (typeof window !== 'undefined') {
      const envUrl = (import.meta as any).env?.VITE_API_URL;
      if (envUrl) {
        socketUrl = envUrl;
      } else if (window.location.hostname.includes('github.io')) {
        socketUrl = 'https://ais-pre-v3yeffnghbqzf3xhauqokz-663102456098.us-east1.run.app';
      } else if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
        socketUrl = localStorage.getItem('capilla_server_url') || 'https://ais-pre-v3yeffnghbqzf3xhauqokz-663102456098.us-east1.run.app';
      }
    }

    socket = socketUrl ? io(socketUrl, {
      autoConnect: true,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    }) : io({
      autoConnect: true,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Conectado en tiempo real al servidor de Capilla Conecta');
    });

    socket.on('connect_error', () => {
      // Manejo silencioso en hostings estáticos como GitHub Pages
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Desconectado temporalmente, reintentando...');
    });
  }
  return socket;
}

export function identifyUserOnSocket(userId: string, roomId = 'todos-juntos') {
  const s = getSocket();
  if (s.connected) {
    s.emit('user:identify', { userId, roomId });
  } else {
    s.once('connect', () => {
      s.emit('user:identify', { userId, roomId });
    });
  }
}

export function switchRoomOnSocket(roomId: string, userId: string) {
  const s = getSocket();
  s.emit('room:join', { roomId, userId });
}

export function emitChatMessage(roomId: string, userId: string, text: string) {
  const s = getSocket();
  s.emit('chat:send_message', { roomId, userId, text });
}

export function emitTyping(roomId: string, userId: string, isTyping: boolean) {
  const s = getSocket();
  s.emit('chat:typing', { roomId, userId, isTyping });
}

export function emitReaction(messageId: string, userId: string, emoji: string, roomId: string) {
  const s = getSocket();
  s.emit('chat:react', { messageId, userId, emoji, roomId });
}
