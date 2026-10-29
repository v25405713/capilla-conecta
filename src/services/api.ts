import {
  User,
  BulletinPost,
  ChatMessage,
  PostComment,
  Report,
  AppNotification,
  Neighborhood,
  BARRIOS_CAPILLA
} from '../types';

export function isStaticEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const hasCustomServer = Boolean(
    (import.meta as any).env?.VITE_API_URL || localStorage.getItem('capilla_server_url')
  );
  return window.location.hostname.includes('github.io') && !hasCustomServer;
}

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');

    const saved = localStorage.getItem('capilla_server_url');
    if (saved) return saved.replace(/\/$/, '');

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return '';
    }
  }
  return '';
}

import { localFallback } from './localFallback';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (isStaticEnvironment()) {
    throw new Error('Static host - fallback to local');
  }
  const url = endpoint.startsWith('http') ? endpoint : `${getBaseUrl()}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ocurrió un error en el servidor');
  }
  return data;
}

export const api = {
  // Auth
  login: async (email: string, password?: string) => {
    try {
      return await request<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch {
      return localFallback.login(email);
    }
  },

  register: async (payload: {
    email: string;
    password?: string;
    displayName: string;
    neighborhoodId: string;
    avatarEmoji: string;
    phone?: string;
    phoneVisible?: boolean;
    bio?: string;
  }) => {
    try {
      return await request<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return localFallback.register(payload);
    }
  },

  getDemoUsers: async () => {
    try {
      return await request<{ users: any[] }>('/api/auth/demo-users');
    } catch {
      return localFallback.getDemoUsers();
    }
  },

  switchDemo: async (userId: string) => {
    try {
      return await request<{ user: User }>('/api/auth/switch-demo', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return localFallback.switchDemo(userId);
    }
  },

  updateProfile: async (userId: string, data: Partial<User>) => {
    try {
      return await request<{ user: User }>(`/api/auth/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return localFallback.updateProfile(userId, data);
    }
  },

  // Chat
  getRooms: async () => {
    try {
      return await request<{ rooms: any[] }>('/api/chat/rooms');
    } catch {
      return {
        rooms: [
          { id: 'todos-juntos', name: 'Todos juntos', type: 'general', description: 'Sala comunitaria en tiempo real', icon: '⛰️' },
          ...BARRIOS_CAPILLA.map(b => ({ id: b.id, name: b.name, type: 'barrio', description: b.description, icon: b.icon, neighborhoodId: b.id }))
        ]
      };
    }
  },

  getMessages: async (roomId: string, limit = 100) => {
    try {
      return await request<{ messages: ChatMessage[] }>(`/api/chat/messages/${roomId}?limit=${limit}`);
    } catch {
      return localFallback.getMessages(roomId);
    }
  },

  sendMessage: async (roomId: string, userId: string, text: string) => {
    try {
      return await request<{ message: ChatMessage }>('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ roomId, userId, text }),
      });
    } catch {
      return localFallback.sendMessage(roomId, userId, text);
    }
  },

  deleteMessage: async (messageId: string, userId: string) => {
    try {
      return await request<{ success: boolean }>(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return localFallback.deleteMessage(messageId, userId);
    }
  },

  reportMessage: async (messageId: string, reporterId: string, reason: string) => {
    try {
      return await request<{ success: boolean }>('/api/chat/report', {
        method: 'POST',
        body: JSON.stringify({ messageId, reporterId, reason }),
      });
    } catch {
      return localFallback.reportMessage(messageId, reporterId, reason);
    }
  },

  // Tablón
  getPosts: async (params?: { category?: string; neighborhoodId?: string; search?: string; includeExpired?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.neighborhoodId) q.set('neighborhoodId', params.neighborhoodId);
    if (params?.search) q.set('search', params.search);
    if (params?.includeExpired) q.set('includeExpired', 'true');
    try {
      return await request<{ posts: BulletinPost[] }>(`/api/posts?${q.toString()}`);
    } catch {
      return localFallback.getPosts(params);
    }
  },

  getPost: async (id: string) => {
    try {
      return await request<{ post: BulletinPost; comments: PostComment[] }>(`/api/posts/${id}`);
    } catch {
      return localFallback.getPost(id);
    }
  },

  createPost: async (payload: {
    userId: string;
    title: string;
    category: string;
    neighborhoodId: string;
    richContent: string;
    price?: string;
    imageUrl?: string;
  }) => {
    try {
      return await request<{ post: BulletinPost }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return localFallback.createPost(payload);
    }
  },

  updatePost: async (id: string, userId: string, data: Partial<BulletinPost>) => {
    try {
      return await request<{ post: BulletinPost }>(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ userId, ...data }),
      });
    } catch {
      return localFallback.updatePost(id, userId, data);
    }
  },

  deletePost: async (id: string, userId: string) => {
    try {
      return await request<{ success: boolean }>(`/api/posts/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return localFallback.deletePost(id, userId);
    }
  },

  togglePostLike: async (postId: string, userId: string) => {
    try {
      return await request<{ likesCount: number; isLiked: boolean }>(`/api/posts/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return localFallback.togglePostLike(postId, userId);
    }
  },

  // Comentarios
  getComments: async (postId: string) => {
    try {
      return await request<{ comments: PostComment[] }>(`/api/posts/${postId}/comments`);
    } catch {
      return localFallback.getComments(postId);
    }
  },

  addComment: async (postId: string, userId: string, text: string) => {
    try {
      return await request<{ comment: PostComment }>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ userId, text }),
      });
    } catch {
      return localFallback.addComment(postId, userId, text);
    }
  },

  // Barrios y Estadísticas
  getBarrios: async () => {
    try {
      return await request<{ barrios: (Neighborhood & { userCount: number; postCount: number })[] }>('/api/barrios');
    } catch {
      return localFallback.getBarrios();
    }
  },

  getStats: async () => {
    try {
      return await request<{
        totalOnline: number;
        usersCount: number;
        postsCount: number;
        activePostsCount: number;
        messagesCount: number;
        barrios: any[];
      }>('/api/stats');
    } catch {
      return {
        totalOnline: 3,
        usersCount: 4,
        postsCount: 3,
        activePostsCount: 3,
        messagesCount: 3,
        barrios: localFallback.getBarrios().barrios
      };
    }
  },

  // Notificaciones
  getNotifications: async (userId: string) => {
    try {
      return await request<{ notifications: AppNotification[] }>(`/api/notifications/${userId}`);
    } catch {
      return localFallback.getNotifications(userId);
    }
  },

  markNotificationsRead: async (userId: string) => {
    try {
      return await request<{ success: boolean }>(`/api/notifications/${userId}/read`, {
        method: 'POST',
      });
    } catch {
      return { success: true };
    }
  },

  // Moderación & Admin
  getReports: () =>
    request<{ reports: Report[] }>('/api/admin/reports'),

  resolveReport: (reportId: string, action: 'dismiss' | 'delete_item' | 'ban_author', moderatorId: string) =>
    request<{ success: boolean }>(`/api/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, moderatorId }),
    }),

  getDatabaseSchema: () =>
    request<{ schemaSql: string; stats: any }>('/api/admin/schema'),
};
