export interface Neighborhood {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  userCount?: number;
  postCount?: number;
}

export type AvatarEmoji =
  | '😀' | '😎' | '🐱' | '🐶' | '🌲'
  | '⛰️' | '🌞' | '🌙' | '⭐' | '🔥'
  | '🦊' | '🦉' | '🌻' | '🍀' | '🎸'
  | '🚴' | '🧉' | '🏠' | '🎨' | '🚀';

export const AVATAR_OPTIONS: { emoji: AvatarEmoji; label: string }[] = [
  { emoji: '😀', label: 'Sonriente' },
  { emoji: '😎', label: 'Onda serrana' },
  { emoji: '🐱', label: 'Michi' },
  { emoji: '🐶', label: 'Perrito' },
  { emoji: '🌲', label: 'Pinar serrano' },
  { emoji: '⛰️', label: 'Cerro Uritorco' },
  { emoji: '🌞', label: 'Sol de Capilla' },
  { emoji: '🌙', label: 'Noche estrellada' },
  { emoji: '⭐', label: 'Estrella' },
  { emoji: '🔥', label: 'Fogón de amigos' },
  { emoji: '🦊', label: 'Zorro autóctono' },
  { emoji: '🦉', label: 'Lechuza / Búho' },
  { emoji: '🌻', label: 'Girasol' },
  { emoji: '🍀', label: 'Buena suerte' },
  { emoji: '🎸', label: 'Guitarra peñera' },
  { emoji: '🚴', label: 'Bici de montaña' },
  { emoji: '🧉', label: 'Mate con yuyos' },
  { emoji: '🏠', label: 'Casita de pueblo' },
  { emoji: '🎨', label: 'Arte & Cultura' },
  { emoji: '🚀', label: 'Misterio Uritorco' },
];

export const BARRIOS_CAPILLA: { id: string; name: string; description: string; icon: string }[] = [
  { id: 'centro', name: 'Centro', description: 'Casco histórico, calle techada y comercio local', icon: '🏛️' },
  { id: 'aguas-azules', name: 'Aguas Azules', description: 'Zona residencial serena camino al balneario', icon: '💧' },
  { id: 'balumba', name: 'Balumba', description: 'Tranquilidad serrana, vegetación y vistas al cerro', icon: '🌲' },
  { id: 'el-zapato', name: 'El Zapato', description: 'Mirador icónico y geoforma natural de Capilla', icon: '🪨' },
  { id: 'el-zapato-norte', name: 'El Zapato Norte', description: 'Sector norte lindante a los senderos serranos', icon: '🧭' },
  { id: 'faldas-del-uritorco', name: 'Faldas del Uritorco', description: 'Al pie del mítico cerro, naturaleza pura', icon: '⛰️' },
  { id: 'la-atalaya', name: 'La Atalaya', description: 'Miradores altos con vistas panorámicas al valle', icon: '🔭' },
  { id: 'la-banda', name: 'La Banda', description: 'Cercano a las márgenes del río y arboledas', icon: '🌊' },
  { id: 'la-toma', name: 'La Toma', description: 'Balneario natural de ollas de agua cristalina', icon: '🏞️' },
  { id: 'las-flores', name: 'Las Flores', description: 'Barrio floral y apacible de familias del pueblo', icon: '🌸' },
  { id: 'las-gemelas', name: 'Las Gemelas', description: 'Sector cercano a los cerros Las Gemelas', icon: '🌄' },
  { id: 'san-martin', name: 'San Martín', description: 'Barrio tradicional, vecinal y cercano al centro', icon: '🏡' },
  { id: 'valenti', name: 'Valenti', description: 'Cercano al Dique El Cajón y vertientes naturales', icon: '🌿' },
  { id: 'arpentino', name: 'Arpentino', description: 'Zona tranquila, calles arboladas y espíritu de pueblo', icon: '🍃' },
  { id: 'villa-cielo', name: 'Villa Cielo', description: 'Altos de Capilla con aire puro y vista al Uritorco', icon: '☁️' },
  { id: 'dolores', name: 'Dolores', description: 'Entrada sur histórica a la localidad', icon: '🛤️' },
  { id: 'los-alazanes', name: 'Los Alazanes', description: 'Paso y cuenca hacia el dique Los Alazanes', icon: '🐎' },
  { id: 'parque-cinco-estrellas', name: 'Parque Cinco Estrellas', description: 'Sector residencial abierto y cielo diáfano', icon: '⭐' },
  { id: 'el-cajon', name: 'El Cajón', description: 'Lindero al lago y paredón del Dique El Cajón', icon: '⛵' },
  { id: 'san-esteban', name: 'San Esteban', description: 'Portal vecino de casonas y tranquilidad serrana', icon: '🏘️' },
];

export interface User {
  id: string;
  email: string;
  displayName: string; // Nombre de pila o nick
  neighborhoodId: string; // Barrio obligatorio
  avatarEmoji: AvatarEmoji; // 1 de los 20 emojis
  phone?: string;
  phoneVisible: boolean;
  bio?: string;
  role: 'user' | 'moderator' | 'admin';
  emailVerified: boolean;
  rulesAccepted: boolean;
  lastNeighborhoodChange: string; // ISO date (para regla de 30 días)
  isBanned: boolean;
  createdAt: string;
}

// Retorna siempre el formato: Nombre (Barrio)
export function getFormattedUserName(user: { displayName?: string; email?: string; neighborhoodId: string }): string {
  const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Vecino';
  const barrioObj = BARRIOS_CAPILLA.find(b => b.id === user.neighborhoodId);
  const barrioName = barrioObj ? barrioObj.name : user.neighborhoodId;
  return `${name} (${barrioName})`;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string; // Formato "Nombre (Barrio)"
  userAvatar: AvatarEmoji;
  userNeighborhood: string;
  userRole?: 'user' | 'moderator' | 'admin';
  text: string;
  mentions: string[];
  reactions: Record<string, string[]>; // { '👍': ['userId1', 'userId2'], ... }
  isReported: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export type PostCategory = 'vende' | 'regala' | 'busca' | 'servicio';

export type PostStatus = 'activo' | 'vendido' | 'agotado' | 'regalado' | 'reservado' | 'expirado';

export interface BulletinPost {
  id: string;
  userId: string;
  authorName: string; // Formato "Nombre (Barrio)"
  authorAvatar: AvatarEmoji;
  authorNeighborhood: string;
  authorPhone?: string;
  authorPhoneVisible: boolean;
  title: string;
  category: PostCategory;
  neighborhoodId: string;
  richContent: string;
  price?: string;
  imageUrl?: string;
  status: PostStatus;
  likes: string[]; // userIds
  commentsCount: number;
  createdAt: string;
  expiresAt: string; // Exactamente 24 horas después
  canEditUntil: string; // Exactamente 10 minutos después
  editedAt?: string;
  isReported: boolean;
  isDeleted: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string; // Formato "Nombre (Barrio)"
  authorAvatar: AvatarEmoji;
  authorNeighborhood: string;
  text: string;
  createdAt: string;
  isDeleted?: boolean;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  itemType: 'chat_message' | 'post' | 'user';
  itemId: string;
  itemContentPreview?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'mention' | 'like' | 'comment' | 'neighborhood_post' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface OnlineUser {
  id: string;
  displayName: string;
  formattedName: string;
  neighborhoodId: string;
  neighborhoodName: string;
  avatarEmoji: AvatarEmoji;
  phone?: string;
  phoneVisible: boolean;
  bio?: string;
  role: 'user' | 'moderator' | 'admin';
  currentRoomId?: string;
  isOnline: boolean;
  lastSeen: string;
}
