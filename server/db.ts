import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
} from '../src/types';

interface DatabaseSchema {
  users: User[];
  posts: BulletinPost[];
  chatMessages: ChatMessage[];
  comments: PostComment[];
  reports: Report[];
  notifications: AppNotification[];
  passwords: Record<string, string>; // userId -> password_hash
}

const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'capilla_conecta.json');

// Palabras ofensivas comunes para filtro de moderación básica
const PROFANITY_LIST = [
  'pelotudo', 'pelotuda', 'forro', 'forra', 'hdp', 'mierda', 'puto', 'puta',
  'concha', 'trolo', 'garca', 'estafador', 'idiota', 'estupido'
];

export function filterProfanity(text: string): { cleanText: string; hasProfanity: boolean } {
  let cleanText = text;
  let hasProfanity = false;
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(cleanText)) {
      hasProfanity = true;
      cleanText = cleanText.replace(regex, '***');
    }
  }
  return { cleanText, hasProfanity };
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_capilla_salt').digest('hex');
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    posts: [],
    chatMessages: [],
    comments: [],
    reports: [],
    notifications: [],
    passwords: {},
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log(`[DB] Base de datos cargada: ${this.data.users.length} usuarios, ${this.data.posts.length} posts.`);
      } catch (err) {
        console.error('[DB] Error leyendo archivo de datos, inicializando con semillas:', err);
        this.seedInitialData();
      }
    } else {
      console.log('[DB] Archivo no encontrado. Inicializando con semillas de Capilla del Monte...');
      this.seedInitialData();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error guardando base de datos:', err);
    }
  }

  private seedInitialData() {
    const now = new Date();
    const isoNow = now.toISOString();

    // 1. Usuarios de prueba de Capilla del Monte
    const adminUser: User = {
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
    };

    const mariaUser: User = {
      id: 'usr_maria',
      email: 'maria.balumba@gmail.com',
      displayName: 'María Serrana',
      neighborhoodId: 'balumba',
      avatarEmoji: '🧉',
      phone: '+54 9 3548 554433',
      phoneVisible: true,
      bio: 'Vecina de Balumba hace 12 años. Amante de la huerta, los yuyos serranos y la vida comunitaria.',
      role: 'user',
      emailVerified: true,
      rulesAccepted: true,
      lastNeighborhoodChange: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
      isBanned: false,
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    };

    const lunaUser: User = {
      id: 'usr_luna',
      email: 'luna.uritorco@yahoo.com.ar',
      displayName: 'Luna Sendas',
      neighborhoodId: 'faldas-del-uritorco',
      avatarEmoji: '🌲',
      phone: '+54 9 3548 667788',
      phoneVisible: true,
      bio: 'Guía de senderismo y avistaje nocturno en las faldas del Cerro Uritorco. Respetemos el monte nativo.',
      role: 'moderador' as any,
      emailVerified: true,
      rulesAccepted: true,
      lastNeighborhoodChange: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(),
      isBanned: false,
      createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    };

    const carlosUser: User = {
      id: 'usr_carlos',
      email: 'carlos.zapato@gmail.com',
      displayName: 'Carlos Tallador',
      neighborhoodId: 'el-zapato',
      avatarEmoji: '🎨',
      phone: '+54 9 3548 112233',
      phoneVisible: false,
      bio: 'Artesano de maderas recuperadas y piedra. Vivo en El Zapato cerca del monolito.',
      role: 'user',
      emailVerified: true,
      rulesAccepted: true,
      lastNeighborhoodChange: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      isBanned: false,
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    };

    this.data.users = [adminUser, mariaUser, lunaUser, carlosUser];
    this.data.passwords = {
      'usr_admin': hashPassword('admin123'),
      'usr_maria': hashPassword('vecino123'),
      'usr_luna': hashPassword('vecino123'),
      'usr_carlos': hashPassword('vecino123'),
    };

    // 2. Mensajes iniciales en la sala "Todos juntos"
    const generalMessages: ChatMessage[] = [
      {
        id: 'msg_01',
        roomId: 'todos-juntos',
        userId: adminUser.id,
        userName: getFormattedUserName(adminUser),
        userAvatar: adminUser.avatarEmoji,
        userNeighborhood: 'Centro',
        userRole: 'admin',
        text: '¡Bienvenidos a Capilla Conecta! Este es nuestro espacio de encuentro vecinal en tiempo real para todos los barrios de Capilla del Monte.',
        mentions: [],
        reactions: { '👏': [mariaUser.id, lunaUser.id], '⛰️': [lunaUser.id] },
        isReported: false,
        isDeleted: false,
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      },
      {
        id: 'msg_02',
        roomId: 'todos-juntos',
        userId: mariaUser.id,
        userName: getFormattedUserName(mariaUser),
        userAvatar: mariaUser.avatarEmoji,
        userNeighborhood: 'Balumba',
        userRole: 'user',
        text: '¡Hermoso día en Balumba! El cerro está despejado hoy y el río tiene buen caudal. ¿Alguien sabe si hoy abre la feria de artesanos?',
        mentions: [],
        reactions: { '🧉': [carlosUser.id, adminUser.id], '🌞': [lunaUser.id] },
        isReported: false,
        isDeleted: false,
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
      {
        id: 'msg_03',
        roomId: 'todos-juntos',
        userId: carlosUser.id,
        userName: getFormattedUserName(carlosUser),
        userAvatar: carlosUser.avatarEmoji,
        userNeighborhood: 'El Zapato',
        userRole: 'user',
        text: 'Hola @María Serrana, sí, la feria abre a partir de las 18:00 hs en la diagonal. ¡Los esperamos!',
        mentions: [mariaUser.id],
        reactions: { '👍': [mariaUser.id] },
        isReported: false,
        isDeleted: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 'msg_04',
        roomId: 'todos-juntos',
        userId: lunaUser.id,
        userName: getFormattedUserName(lunaUser),
        userAvatar: lunaUser.avatarEmoji,
        userNeighborhood: 'Faldas del Uritorco',
        userRole: 'user',
        text: 'Aviso vecinal: en la zona de Faldas del Uritorco recuerden circular a baja velocidad porque andan zorritos y perritos en las calles de tierra.',
        mentions: [],
        reactions: { '🦊': [mariaUser.id, adminUser.id], '❤️': [carlosUser.id] },
        isReported: false,
        isDeleted: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ];

    // Mensajes para sala de barrio Balumba
    const balumbaMessages: ChatMessage[] = [
      {
        id: 'msg_b01',
        roomId: 'balumba',
        userId: mariaUser.id,
        userName: getFormattedUserName(mariaUser),
        userAvatar: mariaUser.avatarEmoji,
        userNeighborhood: 'Balumba',
        userRole: 'user',
        text: 'Vecinos de Balumba: el próximo sábado a las 10 hs nos juntamos a limpiar la bajada al arroyo. Traer guantes y bolsas.',
        mentions: [],
        reactions: { '💪': [adminUser.id] },
        isReported: false,
        isDeleted: false,
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      }
    ];

    this.data.chatMessages = [...generalMessages, ...balumbaMessages];

    // 3. Publicaciones iniciales en el Tablón de Anuncios
    // Regla: expires_at = created_at + 24 hs
    // can_edit_until = created_at + 10 min
    const post1Created = new Date(Date.now() - 3 * 3600 * 1000); // Creado hace 3 horas (activo, expiró tiempo de edición)
    const post2Created = new Date(Date.now() - 8 * 60 * 1000);   // Creado hace 8 minutos (activo, editable por 2 min más)
    const post3Created = new Date(Date.now() - 14 * 3600 * 1000); // Creado hace 14 horas
    const post4Created = new Date(Date.now() - 26 * 3600 * 1000); // Creado hace 26 horas (EXPIRADO automáticamente)

    const initialPosts: BulletinPost[] = [
      {
        id: 'post_01',
        userId: mariaUser.id,
        authorName: getFormattedUserName(mariaUser),
        authorAvatar: mariaUser.avatarEmoji,
        authorNeighborhood: 'Balumba',
        authorPhone: mariaUser.phone,
        authorPhoneVisible: true,
        title: 'Miel pura serrana y plantines de aromáticas',
        category: 'vende',
        neighborhoodId: 'balumba',
        richContent: '<p>Cosecha propia de <b>miel pura de monte</b> (algarrobo, piquillín y chañar). Tarro de 1 kg en frasco de vidrio.</p><ul><li>Tarro 1 kg: $8.500</li><li>Plantines de romero, tomillo y cedrón: $2.000 c/u</li></ul><p>Entrego a domicilio en Balumba y Centro o se retira por casa. ¡Consultas por WhatsApp!</p>',
        price: '$8.500',
        imageUrl: '',
        status: 'activo',
        likes: [lunaUser.id, carlosUser.id],
        commentsCount: 2,
        createdAt: post1Created.toISOString(),
        expiresAt: new Date(post1Created.getTime() + 24 * 3600 * 1000).toISOString(),
        canEditUntil: new Date(post1Created.getTime() + 10 * 60 * 1000).toISOString(),
        isReported: false,
        isDeleted: false,
      },
      {
        id: 'post_02',
        userId: carlosUser.id,
        authorName: getFormattedUserName(carlosUser),
        authorAvatar: carlosUser.avatarEmoji,
        authorNeighborhood: 'El Zapato',
        authorPhone: carlosUser.phone,
        authorPhoneVisible: false,
        title: 'Regalo leña seca de poda de sauce y mora',
        category: 'regala',
        neighborhoodId: 'el-zapato',
        richContent: '<p>Tengo unos <b>5 atados de leña bien seca</b> de poda de árboles de mi terreno. Ideal para salamandra o estufa.</p><p><i>Es gratis, solo pido que la vengan a buscar en vehículo propio por la zona de El Zapato antes del anochecer.</i></p>',
        price: 'Gratis',
        imageUrl: '',
        status: 'activo',
        likes: [mariaUser.id],
        commentsCount: 1,
        createdAt: post2Created.toISOString(),
        expiresAt: new Date(post2Created.getTime() + 24 * 3600 * 1000).toISOString(),
        canEditUntil: new Date(post2Created.getTime() + 10 * 60 * 1000).toISOString(),
        isReported: false,
        isDeleted: false,
      },
      {
        id: 'post_03',
        userId: lunaUser.id,
        authorName: getFormattedUserName(lunaUser),
        authorAvatar: lunaUser.avatarEmoji,
        authorNeighborhood: 'Faldas del Uritorco',
        authorPhone: lunaUser.phone,
        authorPhoneVisible: true,
        title: 'Ofrezco servicio de guiada interpretativa de flora serrana',
        category: 'servicio',
        neighborhoodId: 'faldas-del-uritorco',
        richContent: '<p>Caminatas conscientes de <b>reconocimiento de plantas medicinales y árboles nativos</b> en senderos seguros de Faldas del Uritorco.</p><p>Grupos reducidos de hasta 6 personas para no perturbar el ecosistema serrano. Salidas los martes y sábados por la mañana.</p>',
        price: 'A la gorra consciente',
        imageUrl: '',
        status: 'activo',
        likes: [adminUser.id, mariaUser.id, carlosUser.id],
        commentsCount: 0,
        createdAt: post3Created.toISOString(),
        expiresAt: new Date(post3Created.getTime() + 24 * 3600 * 1000).toISOString(),
        canEditUntil: new Date(post3Created.getTime() + 10 * 60 * 1000).toISOString(),
        isReported: false,
        isDeleted: false,
      },
      {
        id: 'post_04',
        userId: mariaUser.id,
        authorName: getFormattedUserName(mariaUser),
        authorAvatar: mariaUser.avatarEmoji,
        authorNeighborhood: 'Balumba',
        authorPhone: mariaUser.phone,
        authorPhoneVisible: true,
        title: 'Bicicleta de montaña rodado 26 usada',
        category: 'vende',
        neighborhoodId: 'balumba',
        richContent: '<p>Bicicleta de montaña rodado 26 con 21 cambios Shimano. Frenos v-brake recién calibrados.</p>',
        price: '$120.000',
        imageUrl: '',
        status: 'vendido', // Marcado como vendido
        likes: [],
        commentsCount: 0,
        createdAt: post4Created.toISOString(),
        expiresAt: new Date(post4Created.getTime() + 24 * 3600 * 1000).toISOString(),
        canEditUntil: new Date(post4Created.getTime() + 10 * 60 * 1000).toISOString(),
        isReported: false,
        isDeleted: false,
      }
    ];

    this.data.posts = initialPosts;

    // 4. Comentarios de prueba
    this.data.comments = [
      {
        id: 'cmt_01',
        postId: 'post_01',
        userId: lunaUser.id,
        authorName: getFormattedUserName(lunaUser),
        authorAvatar: lunaUser.avatarEmoji,
        authorNeighborhood: 'Faldas del Uritorco',
        text: '¡Hola María! ¿Te quedan plantines de cedrón? Paso el fin de semana a buscar dos.',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 'cmt_02',
        postId: 'post_01',
        userId: mariaUser.id,
        authorName: getFormattedUserName(mariaUser),
        authorAvatar: mariaUser.avatarEmoji,
        authorNeighborhood: 'Balumba',
        text: '¡Hola Luna! Sí, tengo varios listos para trasplantar en maceta o tierra. Te los reservo.',
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
      {
        id: 'cmt_03',
        postId: 'post_02',
        userId: adminUser.id,
        authorName: getFormattedUserName(adminUser),
        authorAvatar: adminUser.avatarEmoji,
        authorNeighborhood: 'Centro',
        text: 'Gran iniciativa vecinal para aprovechar la poda en vez de quemarla.',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      }
    ];

    this.save();
  }

  // Métodos de Usuario
  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(params: {
    email: string;
    password?: string;
    displayName: string;
    neighborhoodId: string;
    avatarEmoji: AvatarEmoji;
    phone?: string;
    phoneVisible?: boolean;
    bio?: string;
  }): User {
    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const nowIso = new Date().toISOString();

    const newUser: User = {
      id,
      email: params.email,
      displayName: params.displayName || params.email.split('@')[0],
      neighborhoodId: params.neighborhoodId || 'centro',
      avatarEmoji: params.avatarEmoji || '⛰️',
      phone: params.phone || '',
      phoneVisible: Boolean(params.phoneVisible),
      bio: params.bio || '',
      role: 'user',
      emailVerified: true,
      rulesAccepted: true,
      lastNeighborhoodChange: nowIso,
      isBanned: false,
      createdAt: nowIso,
    };

    this.data.users.push(newUser);
    if (params.password) {
      this.data.passwords[id] = hashPassword(params.password);
    }
    this.save();
    return newUser;
  }

  validatePassword(userId: string, passwordAttempt: string): boolean {
    const stored = this.data.passwords[userId];
    if (!stored) return false;
    return stored === hashPassword(passwordAttempt);
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.getUserById(id);
    if (!user) return null;

    // Regla de los 30 días para cambio de barrio
    if (updates.neighborhoodId && updates.neighborhoodId !== user.neighborhoodId) {
      const lastChange = new Date(user.lastNeighborhoodChange || user.createdAt).getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const timeSince = Date.now() - lastChange;
      if (timeSince < thirtyDaysMs) {
        const daysLeft = Math.ceil((thirtyDaysMs - timeSince) / (24 * 60 * 60 * 1000));
        throw new Error(`El barrio solo se puede cambiar una vez cada 30 días. Te faltan ${daysLeft} días.`);
      }
      user.lastNeighborhoodChange = new Date().toISOString();
      user.neighborhoodId = updates.neighborhoodId;
    }

    if (updates.displayName !== undefined) user.displayName = updates.displayName;
    if (updates.avatarEmoji !== undefined) user.avatarEmoji = updates.avatarEmoji;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.phoneVisible !== undefined) user.phoneVisible = updates.phoneVisible;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.isBanned !== undefined) user.isBanned = updates.isBanned;

    this.save();
    return user;
  }

  getAllUsers(): User[] {
    return this.data.users;
  }

  // Métodos de Chat
  getMessages(roomId: string, limit = 100): ChatMessage[] {
    return this.data.chatMessages
      .filter(m => m.roomId === roomId && !m.isDeleted)
      .slice(-limit);
  }

  addMessage(params: {
    roomId: string;
    userId: string;
    text: string;
  }): ChatMessage {
    const user = this.getUserById(params.userId);
    if (!user) throw new Error('Usuario no encontrado');
    if (user.isBanned) throw new Error('El usuario se encuentra suspendido');

    // Validación de sala de barrio: solo los vecinos residentes pueden escribir
    if (params.roomId !== 'todos-juntos') {
      if (user.neighborhoodId !== params.roomId && user.role !== 'admin') {
        const targetBarrio = BARRIOS_CAPILLA.find(b => b.id === params.roomId)?.name || params.roomId;
        throw new Error(`Solo los vecinos residentes de ${targetBarrio} pueden escribir en esta sala. Puedes leerla libremente.`);
      }
    }

    // Filtro de moderación de palabras ofensivas
    const { cleanText } = filterProfanity(params.text);

    // Menciones (@usuario)
    const mentionRegex = /@([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ ]+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(cleanText)) !== null) {
      const mentionCandidate = match[1].trim().toLowerCase();
      const mentionedUser = this.data.users.find(u =>
        u.displayName.toLowerCase().includes(mentionCandidate) ||
        u.email.toLowerCase().includes(mentionCandidate)
      );
      if (mentionedUser && !mentions.includes(mentionedUser.id)) {
        mentions.push(mentionedUser.id);
        // Crear notificación in-app para el usuario mencionado
        if (mentionedUser.id !== user.id) {
          this.createNotification({
            userId: mentionedUser.id,
            type: 'mention',
            title: 'Te mencionaron en el chat',
            message: `${getFormattedUserName(user)} te mencionó en la sala: "${cleanText.substring(0, 60)}..."`,
            link: `/chat/${params.roomId}`
          });
        }
      }
    }

    const message: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      roomId: params.roomId,
      userId: user.id,
      userName: getFormattedUserName(user),
      userAvatar: user.avatarEmoji,
      userNeighborhood: BARRIOS_CAPILLA.find(b => b.id === user.neighborhoodId)?.name || user.neighborhoodId,
      userRole: user.role,
      text: cleanText,
      mentions,
      reactions: {},
      isReported: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    this.data.chatMessages.push(message);
    this.save();
    return message;
  }

  toggleMessageReaction(messageId: string, userId: string, emoji: string): ChatMessage | null {
    const msg = this.data.chatMessages.find(m => m.id === messageId);
    if (!msg) return null;

    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [];
    }

    const index = msg.reactions[emoji].indexOf(userId);
    if (index > -1) {
      msg.reactions[emoji].splice(index, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(userId);
    }

    this.save();
    return msg;
  }

  deleteMessage(messageId: string, requestUserId: string): boolean {
    const msg = this.data.chatMessages.find(m => m.id === messageId);
    if (!msg) return false;

    const user = this.getUserById(requestUserId);
    if (!user) return false;

    // Solo el autor o un moderador/admin pueden borrar el mensaje
    if (msg.userId !== requestUserId && user.role !== 'admin' && user.role !== 'moderator') {
      throw new Error('No tienes permisos para borrar este mensaje.');
    }

    msg.isDeleted = true;
    this.save();
    return true;
  }

  reportMessage(messageId: string, reporterId: string, reason: string): boolean {
    const msg = this.data.chatMessages.find(m => m.id === messageId);
    if (!msg) return false;

    const reporter = this.getUserById(reporterId);
    msg.isReported = true;

    this.data.reports.push({
      id: 'rep_' + Date.now(),
      reporterId,
      reporterName: reporter ? getFormattedUserName(reporter) : 'Vecino',
      itemType: 'chat_message',
      itemId: messageId,
      itemContentPreview: msg.text,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    this.save();
    return true;
  }

  // Métodos del Tablón de Anuncios
  getPosts(options: {
    category?: string;
    neighborhoodId?: string;
    search?: string;
    includeExpired?: boolean;
  } = {}): BulletinPost[] {
    const now = new Date();

    return this.data.posts
      .filter(p => !p.isDeleted)
      .map(p => {
        // Chequeo de expiración de 24 horas
        const isPast24h = new Date(p.expiresAt) <= now;
        if (isPast24h && p.status === 'activo') {
          return { ...p, status: 'expirado' as const };
        }
        return p;
      })
      .filter(p => {
        if (!options.includeExpired && p.status === 'expirado') {
          return false;
        }
        if (options.category && options.category !== 'todos' && p.category !== options.category) {
          return false;
        }
        if (options.neighborhoodId && options.neighborhoodId !== 'todos' && p.neighborhoodId !== options.neighborhoodId) {
          return false;
        }
        if (options.search && options.search.trim()) {
          const q = options.search.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchContent = p.richContent.toLowerCase().includes(q);
          const matchAuthor = p.authorName.toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchAuthor) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPostById(id: string): BulletinPost | undefined {
    return this.data.posts.find(p => p.id === id && !p.isDeleted);
  }

  createPost(params: {
    userId: string;
    title: string;
    category: 'vende' | 'regala' | 'busca' | 'servicio';
    neighborhoodId: string;
    richContent: string;
    price?: string;
    imageUrl?: string;
  }): BulletinPost {
    const user = this.getUserById(params.userId);
    if (!user) throw new Error('Usuario no autenticado');
    if (user.isBanned) throw new Error('Tu cuenta se encuentra suspendida');

    // Límite anti-spam: máximo 5 publicaciones por día por usuario
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const postsToday = this.data.posts.filter(p =>
      p.userId === user.id &&
      !p.isDeleted &&
      new Date(p.createdAt) >= today
    ).length;

    if (postsToday >= 5 && user.role === 'user') {
      throw new Error('Límite diario alcanzado: por convivencia, solo se permiten hasta 5 publicaciones diarias por vecino en el tablón.');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas
    const canEditUntil = new Date(now.getTime() + 10 * 60 * 1000).toISOString();   // 10 minutos

    const post: BulletinPost = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      authorName: getFormattedUserName(user),
      authorAvatar: user.avatarEmoji,
      authorNeighborhood: BARRIOS_CAPILLA.find(b => b.id === (params.neighborhoodId || user.neighborhoodId))?.name || user.neighborhoodId,
      authorPhone: user.phone,
      authorPhoneVisible: user.phoneVisible,
      title: params.title.trim(),
      category: params.category,
      neighborhoodId: params.neighborhoodId || user.neighborhoodId,
      richContent: params.richContent,
      price: params.price?.trim(),
      imageUrl: params.imageUrl?.trim(),
      status: 'activo',
      likes: [],
      commentsCount: 0,
      createdAt: now.toISOString(),
      expiresAt,
      canEditUntil,
      isReported: false,
      isDeleted: false,
    };

    this.data.posts.unshift(post);
    this.save();
    return post;
  }

  updatePost(postId: string, userId: string, updates: {
    title?: string;
    richContent?: string;
    price?: string;
    imageUrl?: string;
    status?: 'activo' | 'vendido' | 'agotado' | 'regalado' | 'reservado';
  }): BulletinPost {
    const post = this.getPostById(postId);
    if (!post) throw new Error('Publicación no encontrada');

    const user = this.getUserById(userId);
    if (!user) throw new Error('No autenticado');

    const isAuthor = post.userId === userId;
    const isStaff = user.role === 'admin' || user.role === 'moderator';

    if (!isAuthor && !isStaff) {
      throw new Error('No tienes permiso para editar esta publicación.');
    }

    // Regla de los 10 minutos para editar texto/contenido
    const now = new Date();
    if (updates.title !== undefined || updates.richContent !== undefined || updates.price !== undefined) {
      const editLimit = new Date(post.canEditUntil);
      if (now > editLimit && !isStaff) {
        throw new Error('El período de 10 minutos para editar el contenido de este cartel ha finalizado.');
      }
      if (updates.title) post.title = updates.title;
      if (updates.richContent) post.richContent = updates.richContent;
      if (updates.price !== undefined) post.price = updates.price;
      post.editedAt = now.toISOString();
    }

    // Marcar como vendido, regalado, reservado, etc. (se puede cambiar en cualquier momento por el autor)
    if (updates.status) {
      post.status = updates.status;
    }

    if (updates.imageUrl !== undefined) {
      post.imageUrl = updates.imageUrl;
    }

    this.save();
    return post;
  }

  deletePost(postId: string, userId: string): boolean {
    const post = this.getPostById(postId);
    if (!post) return false;

    const user = this.getUserById(userId);
    if (!user) return false;

    if (post.userId !== userId && user.role !== 'admin' && user.role !== 'moderator') {
      throw new Error('No tienes permisos para borrar esta publicación.');
    }

    post.isDeleted = true;
    this.save();
    return true;
  }

  togglePostLike(postId: string, userId: string): { likesCount: number; isLiked: boolean } {
    const post = this.getPostById(postId);
    if (!post) throw new Error('Post no encontrado');

    const idx = post.likes.indexOf(userId);
    let isLiked = false;
    if (idx > -1) {
      post.likes.splice(idx, 1);
      isLiked = false;
    } else {
      post.likes.push(userId);
      isLiked = true;

      // Notificación al autor si no es él mismo
      if (post.userId !== userId) {
        const liker = this.getUserById(userId);
        this.createNotification({
          userId: post.userId,
          type: 'like',
          title: 'Nuevo "Me gusta" en tu cartel',
          message: `${liker ? getFormattedUserName(liker) : 'Un vecino'} indicó que le gusta tu publicación "${post.title}".`,
          link: `/tablon?post=${postId}`
        });
      }
    }

    this.save();
    return { likesCount: post.likes.length, isLiked };
  }

  // Comentarios
  getCommentsForPost(postId: string): PostComment[] {
    return this.data.comments
      .filter(c => c.postId === postId && !c.isDeleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addComment(postId: string, userId: string, text: string): PostComment {
    const post = this.getPostById(postId);
    if (!post) throw new Error('Publicación no encontrada');

    const user = this.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const { cleanText } = filterProfanity(text);

    const comment: PostComment = {
      id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      postId,
      userId,
      authorName: getFormattedUserName(user),
      authorAvatar: user.avatarEmoji,
      authorNeighborhood: BARRIOS_CAPILLA.find(b => b.id === user.neighborhoodId)?.name || user.neighborhoodId,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    this.data.comments.push(comment);
    post.commentsCount = (post.commentsCount || 0) + 1;

    // Notificar al autor del post
    if (post.userId !== userId) {
      this.createNotification({
        userId: post.userId,
        type: 'comment',
        title: 'Nuevo comentario en tu anuncio',
        message: `${getFormattedUserName(user)} comentó: "${cleanText.substring(0, 50)}..."`,
        link: `/tablon?post=${postId}`
      });
    }

    this.save();
    return comment;
  }

  // Reportes y Moderación
  getReports(): Report[] {
    return this.data.reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  resolveReport(reportId: string, action: 'dismiss' | 'delete_item' | 'ban_author', moderatorId: string): boolean {
    const report = this.data.reports.find(r => r.id === reportId);
    if (!report) return false;

    report.status = action === 'dismiss' ? 'dismissed' : 'resolved';

    if (action === 'delete_item') {
      if (report.itemType === 'chat_message') {
        const msg = this.data.chatMessages.find(m => m.id === report.itemId);
        if (msg) msg.isDeleted = true;
      } else if (report.itemType === 'post') {
        const post = this.data.posts.find(p => p.id === report.itemId);
        if (post) post.isDeleted = true;
      }
    } else if (action === 'ban_author') {
      let targetUserId = '';
      if (report.itemType === 'chat_message') {
        const msg = this.data.chatMessages.find(m => m.id === report.itemId);
        if (msg) {
          msg.isDeleted = true;
          targetUserId = msg.userId;
        }
      } else if (report.itemType === 'post') {
        const post = this.data.posts.find(p => p.id === report.itemId);
        if (post) {
          post.isDeleted = true;
          targetUserId = post.userId;
        }
      }
      if (targetUserId) {
        const targetUser = this.getUserById(targetUserId);
        if (targetUser && targetUser.role !== 'admin') {
          targetUser.isBanned = true;
        }
      }
    }

    this.save();
    return true;
  }

  // Notificaciones
  getNotificationsForUser(userId: string): AppNotification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
  }

  createNotification(params: {
    userId: string;
    type: 'mention' | 'like' | 'comment' | 'neighborhood_post' | 'system';
    title: string;
    message: string;
    link?: string;
  }): AppNotification {
    const notif: AppNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  markNotificationsAsRead(userId: string) {
    this.data.notifications
      .filter(n => n.userId === userId)
      .forEach(n => { n.read = true; });
    this.save();
  }

  // Get raw schema / stats for DB inspector
  getStats() {
    return {
      usersCount: this.data.users.length,
      postsCount: this.data.posts.filter(p => !p.isDeleted).length,
      activePostsCount: this.data.posts.filter(p => !p.isDeleted && p.status === 'activo' && new Date(p.expiresAt) > new Date()).length,
      messagesCount: this.data.chatMessages.filter(m => !m.isDeleted).length,
      commentsCount: this.data.comments.filter(c => !c.isDeleted).length,
      reportsPendingCount: this.data.reports.filter(r => r.status === 'pending').length,
      barrios: BARRIOS_CAPILLA.map(b => ({
        ...b,
        userCount: this.data.users.filter(u => u.neighborhoodId === b.id).length,
        postCount: this.data.posts.filter(p => p.neighborhoodId === b.id && !p.isDeleted).length,
      }))
    };
  }
}

export const db = new Database();
