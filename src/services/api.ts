import {
  User,
  BulletinPost,
  ChatMessage,
  PostComment,
  Report,
  AppNotification,
  Neighborhood
} from '../types';

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 1. Variable de entorno si se define en build
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');

    // 2. Servidor configurado manualmente por el usuario
    const saved = localStorage.getItem('capilla_server_url');
    if (saved) return saved.replace(/\/$/, '');

    // 3. Si se aloja en GitHub Pages (solo frontend estático), conectar al backend en la nube
    if (window.location.hostname.includes('github.io')) {
      return 'https://ais-pre-v3yeffnghbqzf3xhauqokz-663102456098.us-east1.run.app';
    }

    // 4. Si se corre local o en un servidor con Node/Express integrado
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return '';
    }
  }
  return 'https://ais-pre-v3yeffnghbqzf3xhauqokz-663102456098.us-east1.run.app';
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
  login: (email: string, password?: string) =>
    request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    email: string;
    password?: string;
    displayName: string;
    neighborhoodId: string;
    avatarEmoji: string;
    phone?: string;
    phoneVisible?: boolean;
    bio?: string;
  }) =>
    request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getDemoUsers: () =>
    request<{ users: any[] }>('/api/auth/demo-users'),

  switchDemo: (userId: string) =>
    request<{ user: User }>('/api/auth/switch-demo', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  updateProfile: (userId: string, data: Partial<User>) =>
    request<{ user: User }>(`/api/auth/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Chat
  getRooms: () =>
    request<{ rooms: any[] }>('/api/chat/rooms'),

  getMessages: (roomId: string, limit = 100) =>
    request<{ messages: ChatMessage[] }>(`/api/chat/messages/${roomId}?limit=${limit}`),

  sendMessage: (roomId: string, userId: string, text: string) =>
    request<{ message: ChatMessage }>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ roomId, userId, text }),
    }),

  deleteMessage: (messageId: string, userId: string) =>
    request<{ success: boolean }>(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    }),

  reportMessage: (messageId: string, reporterId: string, reason: string) =>
    request<{ success: boolean }>('/api/chat/report', {
      method: 'POST',
      body: JSON.stringify({ messageId, reporterId, reason }),
    }),

  // Tablón
  getPosts: (params?: { category?: string; neighborhoodId?: string; search?: string; includeExpired?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.neighborhoodId) q.set('neighborhoodId', params.neighborhoodId);
    if (params?.search) q.set('search', params.search);
    if (params?.includeExpired) q.set('includeExpired', 'true');
    return request<{ posts: BulletinPost[] }>(`/api/posts?${q.toString()}`);
  },

  getPost: (id: string) =>
    request<{ post: BulletinPost; comments: PostComment[] }>(`/api/posts/${id}`),

  createPost: (payload: {
    userId: string;
    title: string;
    category: string;
    neighborhoodId: string;
    richContent: string;
    price?: string;
    imageUrl?: string;
  }) =>
    request<{ post: BulletinPost }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePost: (id: string, userId: string, data: Partial<BulletinPost>) =>
    request<{ post: BulletinPost }>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...data }),
    }),

  deletePost: (id: string, userId: string) =>
    request<{ success: boolean }>(`/api/posts/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    }),

  togglePostLike: (postId: string, userId: string) =>
    request<{ likesCount: number; isLiked: boolean }>(`/api/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // Comentarios
  getComments: (postId: string) =>
    request<{ comments: PostComment[] }>(`/api/posts/${postId}/comments`),

  addComment: (postId: string, userId: string, text: string) =>
    request<{ comment: PostComment }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, text }),
    }),

  // Barrios y Estadísticas
  getBarrios: () =>
    request<{ barrios: (Neighborhood & { userCount: number; postCount: number })[] }>('/api/barrios'),

  getStats: () =>
    request<{
      totalOnline: number;
      usersCount: number;
      postsCount: number;
      activePostsCount: number;
      messagesCount: number;
      barrios: any[];
    }>('/api/stats'),

  // Notificaciones
  getNotifications: (userId: string) =>
    request<{ notifications: AppNotification[] }>(`/api/notifications/${userId}`),

  markNotificationsRead: (userId: string) =>
    request<{ success: boolean }>(`/api/notifications/${userId}/read`, {
      method: 'POST',
    }),

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
