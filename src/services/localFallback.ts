import {
  User,
  BulletinPost,
  ChatMessage,
  PostComment,
  Report,
  AppNotification,
  BARRIOS_CAPILLA,
  getFormattedUserName,
  AvatarEmoji
} from '../types';

const STORAGE_KEY = 'capilla_local_db_v1';

interface LocalDatabase {
  users: User[];
  posts: BulletinPost[];
  chatMessages: ChatMessage[];
  comments: PostComment[];
  notifications: AppNotification[];
}

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin',
    email: 'admin@capilladelmonte.gov.ar',
    displayName: 'Coordinación Vecinal',
    neighborhoodId: 'centro',
    avatarEmoji: '⛰️',
    phone: '+54 3548 481234',
    phoneVisible: true,
    bio: 'Canal oficial de coordinación vecinal y moderación comunitaria de Capilla del Monte.',
    role: 'admin',
    emailVerified: true,
    rulesAccepted: true,
    lastNeighborhoodChange: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    isBanned: false,
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'usr_maria',
    email: 'maria.balumba@gmail.com',
    displayName: 'María Serrana',
    neighborhoodId: 'balumba',
    avatarEmoji: '🌻',
    phone: '+54 3548 554321',
    phoneVisible: true,
    bio: 'Vecina de Balumba. Hago pan casero y mermeladas de higo y zarzamora.',
    role: 'user',
    emailVerified: true,
    rulesAccepted: true,
    lastNeighborhoodChange: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(),
    isBanned: false,
    createdAt: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'usr_carlos',
    email: 'carlos.carpintero@hotmail.com',
    displayName: 'Carlos Tallador',
    neighborhoodId: 'el-zapato',
    avatarEmoji: '🌲',
    phone: '+54 3548 612890',
    phoneVisible: true,
    bio: 'Carpintería rústica y arreglos en madera. Vivo en El Zapato hace 15 años.',
    role: 'user',
    emailVerified: true,
    rulesAccepted: true,
    lastNeighborhoodChange: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
    isBanned: false,
    createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'usr_luna',
    email: 'luna.uritorco@yahoo.com.ar',
    displayName: 'Luna Sendas',
    neighborhoodId: 'faldas-del-uritorco',
    avatarEmoji: '⭐',
    phone: '+54 3548 778899',
    phoneVisible: false,
    bio: 'Amante de las sierras, plantas medicinales y caminatas conscientes.',
    role: 'user',
    emailVerified: true,
    rulesAccepted: true,
    lastNeighborhoodChange: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
    isBanned: false,
    createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
  }
];

const DEFAULT_POSTS: BulletinPost[] = [
  {
    id: 'post_1',
    userId: 'usr_maria',
    authorName: 'María Serrana (Balumba)',
    authorAvatar: '🌻',
    authorNeighborhood: 'Balumba',
    authorPhone: '+54 3548 554321',
    authorPhoneVisible: true,
    title: 'Frascos de mermelada casera de higo y zarzamora orgánica',
    category: 'vende',
    neighborhoodId: 'balumba',
    richContent: '<p>Cosecha propia de esta temporada en <b>Balumba</b>. Sin conservantes artificiales ni aditivos químicos. ¡Pura fruta de la sierra y azúcar mascabo!</p><p>Disponibles frascos de 450 gr. Se retira por calle Las Gemelas o coordinamos entrega en el centro.</p>',
    price: '$4.500 c/u (o 3 x $12.000)',
    imageUrl: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80',
    status: 'activo',
    likes: ['usr_admin', 'usr_carlos'],
    commentsCount: 1,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 21 * 3600 * 1000).toISOString(),
    canEditUntil: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isReported: false,
    isDeleted: false,
  },
  {
    id: 'post_2',
    userId: 'usr_carlos',
    authorName: 'Carlos Tallador (El Zapato)',
    authorAvatar: '🌲',
    authorNeighborhood: 'El Zapato',
    authorPhone: '+54 3548 612890',
    authorPhoneVisible: true,
    title: 'Regalo leña seca de poda de paraíso y álamo',
    category: 'regala',
    neighborhoodId: 'el-zapato',
    richContent: '<p>Vecinos, tengo ramas gruesas cortadas y secas de la poda de invierno listas para estufa o salamandra.</p><p>Es <b>sin costo</b>, solo tienen que venir a retirarla con camioneta o carro por El Zapato antes del fin de semana.</p>',
    price: 'Gratis / Regalo',
    imageUrl: '',
    status: 'activo',
    likes: ['usr_maria', 'usr_luna'],
    commentsCount: 0,
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
    canEditUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    isReported: false,
    isDeleted: false,
  },
  {
    id: 'post_3',
    userId: 'usr_luna',
    authorName: 'Luna Sendas (Faldas del Uritorco)',
    authorAvatar: '⭐',
    authorNeighborhood: 'Faldas del Uritorco',
    authorPhone: '',
    authorPhoneVisible: false,
    title: 'Busco flete chico para mover mesa y 4 sillas desde el Centro',
    category: 'busca',
    neighborhoodId: 'faldas-del-uritorco',
    richContent: '<p>Buenas tardes comunidad. Necesito trasladar una mesa de algarrobo y cuatro sillas desde cercanías de la estación de tren hasta la zona alta de Faldas del Uritorco. ¿Alguien con flete o camioneta disponible esta semana?</p>',
    price: 'A convenir',
    imageUrl: '',
    status: 'activo',
    likes: [],
    commentsCount: 0,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 19 * 3600 * 1000).toISOString(),
    canEditUntil: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    isReported: false,
    isDeleted: false,
  }
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    roomId: 'todos-juntos',
    userId: 'usr_admin',
    userName: 'Coordinación Vecinal (Centro)',
    userAvatar: '⛰️',
    userNeighborhood: 'Centro',
    userRole: 'admin',
    text: '¡Bienvenidos a Capilla Conecta! Este es el canal general para todos los vecinos de Capilla del Monte. Cuidemos la convivencia y el respeto.',
    mentions: [],
    reactions: { '🧉': ['usr_maria', 'usr_carlos'], '👏': ['usr_luna'] },
    isReported: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'msg_2',
    roomId: 'todos-juntos',
    userId: 'usr_maria',
    userName: 'María Serrana (Balumba)',
    userAvatar: '🌻',
    userNeighborhood: 'Balumba',
    text: '¡Buen día a todos los vecinos! Hermosa mañana fresca en las sierras con el Uritorco despejado 🌞🧉',
    mentions: [],
    reactions: { '❤️': ['usr_admin', 'usr_luna'] },
    isReported: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'msg_3',
    roomId: 'balumba',
    userId: 'usr_maria',
    userName: 'María Serrana (Balumba)',
    userAvatar: '🌻',
    userNeighborhood: 'Balumba',
    text: 'Vecinos de Balumba, recuerden que mañana pasa el camión recolector temprano por la calle principal.',
    mentions: [],
    reactions: { '👍': ['usr_admin'] },
    isReported: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  }
];

function getLocalData(): LocalDatabase {
  if (typeof window === 'undefined') {
    return {
      users: DEFAULT_USERS,
      posts: DEFAULT_POSTS,
      chatMessages: DEFAULT_MESSAGES,
      comments: [],
      notifications: []
    };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // Fallback below
    }
  }

  const initial: LocalDatabase = {
    users: DEFAULT_USERS,
    posts: DEFAULT_POSTS,
    chatMessages: DEFAULT_MESSAGES,
    comments: [],
    notifications: []
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveLocalData(data: LocalDatabase) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export const localFallback = {
  login(email: string): { user: User } {
    const db = getLocalData();
    let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Si no existe, crearlo dinámicamente como vecino nuevo
      const name = email.split('@')[0];
      user = {
        id: 'usr_' + Date.now(),
        email,
        displayName: name,
        neighborhoodId: 'centro',
        avatarEmoji: '⛰️',
        phoneVisible: false,
        role: 'user',
        emailVerified: true,
        rulesAccepted: true,
        lastNeighborhoodChange: new Date().toISOString(),
        isBanned: false,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      saveLocalData(db);
    }
    return { user };
  },

  register(payload: any): { user: User } {
    const db = getLocalData();
    const newUser: User = {
      id: 'usr_' + Date.now(),
      email: payload.email,
      displayName: payload.displayName || payload.email.split('@')[0],
      neighborhoodId: payload.neighborhoodId,
      avatarEmoji: payload.avatarEmoji || '⛰️',
      phone: payload.phone || '',
      phoneVisible: Boolean(payload.phoneVisible),
      bio: payload.bio || '',
      role: 'user',
      emailVerified: true,
      rulesAccepted: true,
      lastNeighborhoodChange: new Date().toISOString(),
      isBanned: false,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveLocalData(db);
    return { user: newUser };
  },

  getDemoUsers(): { users: any[] } {
    const db = getLocalData();
    return {
      users: db.users.map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        formattedName: getFormattedUserName(u),
        neighborhoodId: u.neighborhoodId,
        avatarEmoji: u.avatarEmoji,
        role: u.role,
        phoneVisible: u.phoneVisible
      }))
    };
  },

  switchDemo(userId: string): { user: User } {
    const db = getLocalData();
    const user = db.users.find(u => u.id === userId) || db.users[0];
    return { user };
  },

  getMessages(roomId: string): { messages: ChatMessage[] } {
    const db = getLocalData();
    const filtered = db.chatMessages.filter(m => m.roomId === roomId && !m.isDeleted);
    return { messages: filtered };
  },

  sendMessage(roomId: string, userId: string, text: string): { message: ChatMessage } {
    const db = getLocalData();
    const user = db.users.find(u => u.id === userId) || db.users[0];
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      roomId,
      userId: user.id,
      userName: getFormattedUserName(user),
      userAvatar: user.avatarEmoji,
      userNeighborhood: user.neighborhoodId,
      userRole: user.role,
      text,
      mentions: [],
      reactions: {},
      isReported: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    db.chatMessages.push(newMsg);
    saveLocalData(db);
    return { message: newMsg };
  },

  getPosts(params?: any): { posts: BulletinPost[] } {
    const db = getLocalData();
    let list = db.posts.filter(p => !p.isDeleted);
    if (params?.category && params.category !== 'todos') {
      list = list.filter(p => p.category === params.category);
    }
    if (params?.neighborhoodId && params.neighborhoodId !== 'todos') {
      list = list.filter(p => p.neighborhoodId === params.neighborhoodId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.richContent.toLowerCase().includes(q));
    }
    return { posts: list };
  },

  createPost(payload: any): { post: BulletinPost } {
    const db = getLocalData();
    const user = db.users.find(u => u.id === payload.userId) || db.users[0];
    const now = Date.now();
    const newPost: BulletinPost = {
      id: 'post_' + now,
      userId: user.id,
      authorName: getFormattedUserName(user),
      authorAvatar: user.avatarEmoji,
      authorNeighborhood: user.neighborhoodId,
      authorPhone: user.phone,
      authorPhoneVisible: user.phoneVisible,
      title: payload.title,
      category: payload.category,
      neighborhoodId: payload.neighborhoodId,
      richContent: payload.richContent,
      price: payload.price || '',
      imageUrl: payload.imageUrl || '',
      status: 'activo',
      likes: [],
      commentsCount: 0,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 24 * 3600 * 1000).toISOString(),
      canEditUntil: new Date(now + 10 * 60 * 1000).toISOString(),
      isReported: false,
      isDeleted: false
    };
    db.posts.unshift(newPost);
    saveLocalData(db);
    return { post: newPost };
  },

  togglePostLike(postId: string, userId: string): { likesCount: number; isLiked: boolean } {
    const db = getLocalData();
    const post = db.posts.find(p => p.id === postId);
    if (!post) return { likesCount: 0, isLiked: false };
    const has = post.likes.includes(userId);
    if (has) {
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      post.likes.push(userId);
    }
    saveLocalData(db);
    return { likesCount: post.likes.length, isLiked: !has };
  },

  getBarrios(): { barrios: any[] } {
    const db = getLocalData();
    const list = BARRIOS_CAPILLA.map(b => {
      const uCount = db.users.filter(u => u.neighborhoodId === b.id).length;
      const pCount = db.posts.filter(p => p.neighborhoodId === b.id).length;
      return {
        ...b,
        userCount: Math.max(1, uCount),
        postCount: pCount
      };
    });
    return { barrios: list };
  },

  getNotifications(userId: string): { notifications: AppNotification[] } {
    const db = getLocalData();
    return { notifications: db.notifications.filter(n => n.userId === userId) };
  }
};
