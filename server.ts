import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';
import { BARRIOS_CAPILLA, OnlineUser, getFormattedUserName } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
  transports: ['polling', 'websocket'],
});

app.use(express.json({ limit: '5mb' }));

// Mapeo en memoria de sockets conectados para presencia en tiempo real
// socketId -> { userId, roomId }
const activeSockets = new Map<string, { userId: string; roomId: string }>();

function getOnlineUsersList(): OnlineUser[] {
  const onlineUserIds = new Set(Array.from(activeSockets.values()).map(s => s.userId));
  const allUsers = db.getAllUsers();
  
  return allUsers
    .filter(u => onlineUserIds.has(u.id))
    .map(u => {
      // Obtener la sala actual donde se encuentra el socket más reciente del usuario
      const userSockets = Array.from(activeSockets.values()).filter(s => s.userId === u.id);
      const currentRoomId = userSockets[userSockets.length - 1]?.roomId || 'todos-juntos';
      const barrioObj = BARRIOS_CAPILLA.find(b => b.id === u.neighborhoodId);

      return {
        id: u.id,
        displayName: u.displayName,
        formattedName: getFormattedUserName(u),
        neighborhoodId: u.neighborhoodId,
        neighborhoodName: barrioObj ? barrioObj.name : u.neighborhoodId,
        avatarEmoji: u.avatarEmoji,
        phone: u.phoneVisible ? u.phone : undefined,
        phoneVisible: u.phoneVisible,
        bio: u.bio,
        role: u.role,
        currentRoomId,
        isOnline: true,
        lastSeen: new Date().toISOString()
      };
    });
}

function broadcastPresence() {
  const onlineList = getOnlineUsersList();
  io.emit('presence:update', {
    totalOnline: onlineList.length,
    users: onlineList,
  });
}

// ==========================================
// Socket.IO - Gestión en tiempo real
// ==========================================
io.on('connection', (socket: Socket) => {
  // 1. Unirse como usuario identificado
  socket.on('user:identify', ({ userId, roomId }: { userId: string; roomId?: string }) => {
    const user = db.getUserById(userId);
    if (!user) return;

    const assignedRoom = roomId || 'todos-juntos';
    activeSockets.set(socket.id, { userId, roomId: assignedRoom });
    socket.join(assignedRoom);

    // Notificar a todos la actualización de presencia
    broadcastPresence();
  });

  // 2. Cambiar de sala de chat (ej: cambiar entre "Todos juntos" y "Balumba")
  socket.on('room:join', ({ roomId, userId }: { roomId: string; userId: string }) => {
    const prev = activeSockets.get(socket.id);
    if (prev) {
      socket.leave(prev.roomId);
      activeSockets.set(socket.id, { userId: prev.userId, roomId });
    } else {
      activeSockets.set(socket.id, { userId, roomId });
    }
    socket.join(roomId);
    broadcastPresence();
  });

  // 3. Indicador de "Escribiendo..."
  socket.on('chat:typing', ({ roomId, userId, isTyping }: { roomId: string; userId: string; isTyping: boolean }) => {
    const user = db.getUserById(userId);
    if (!user) return;
    socket.to(roomId).emit('chat:user_typing', {
      roomId,
      userId: user.id,
      userName: getFormattedUserName(user),
      userAvatar: user.avatarEmoji,
      isTyping
    });
  });

  // 4. Enviar mensaje de chat
  socket.on('chat:send_message', ({ roomId, userId, text }: { roomId: string; userId: string; text: string }) => {
    try {
      const message = db.addMessage({ roomId, userId, text });
      io.to(roomId).emit('chat:new_message', message);
    } catch (err: any) {
      socket.emit('chat:error', { message: err.message || 'Error al enviar mensaje' });
    }
  });

  // 5. Reacción a mensaje (👍, ❤️, 🧉, 👏, 😂)
  socket.on('chat:react', ({ messageId, userId, emoji, roomId }: { messageId: string; userId: string; emoji: string; roomId: string }) => {
    try {
      const updatedMessage = db.toggleMessageReaction(messageId, userId, emoji);
      if (updatedMessage) {
        io.to(roomId).emit('chat:reaction_updated', {
          messageId,
          reactions: updatedMessage.reactions
        });
      }
    } catch (err: any) {
      socket.emit('chat:error', { message: err.message });
    }
  });

  // 6. Desconexión
  socket.on('disconnect', () => {
    activeSockets.delete(socket.id);
    broadcastPresence();
  });
});

// ==========================================
// Rutas REST API
// ==========================================

// Autenticación & Usuarios
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, displayName, neighborhoodId, avatarEmoji, phone, phoneVisible, bio } = req.body;
    if (!email || !neighborhoodId || !avatarEmoji) {
      return res.status(400).json({ error: 'Email, Barrio y Avatar son obligatorios.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico.' });
    }

    const newUser = db.createUser({
      email,
      password: password || '123456',
      displayName: displayName || email.split('@')[0],
      neighborhoodId,
      avatarEmoji,
      phone: phone || '',
      phoneVisible: Boolean(phoneVisible),
      bio: bio || '',
    });

    res.json({ user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error en el registro.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido.' });

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'No se encontró un usuario con ese email. Por favor regístrate.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Esta cuenta ha sido suspendida por incumplimiento de las normas de convivencia.' });
    }

    if (password && !db.validatePassword(user.id, password)) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Demo switch: login directo para pruebas de vecinos
app.get('/api/auth/demo-users', (_req: Request, res: Response) => {
  const users = db.getAllUsers().map(u => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    formattedName: getFormattedUserName(u),
    neighborhoodId: u.neighborhoodId,
    avatarEmoji: u.avatarEmoji,
    role: u.role,
    phoneVisible: u.phoneVisible,
  }));
  res.json({ users });
});

app.post('/api/auth/switch-demo', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user });
});

// Obtener o actualizar perfil
app.get('/api/auth/profile/:id', (req: Request, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user });
});

app.put('/api/auth/profile/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Descarga de archivo APK y Proyecto Android
app.get('/downloads/CapillaConecta.apk', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'public', 'downloads', 'CapillaConecta.apk');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="CapillaConecta.apk"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo APK no encontrado');
  }
});

app.get('/downloads/CapillaConecta-Android-Project.zip', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'public', 'downloads', 'CapillaConecta-Android-Project.zip');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="CapillaConecta-Android-Project.zip"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo de proyecto no encontrado');
  }
});

// Salas y Mensajes de Chat
app.get('/api/chat/rooms', (_req: Request, res: Response) => {
  const generalRoom = {
    id: 'todos-juntos',
    name: 'Todos juntos',
    type: 'general',
    description: 'Sala comunitaria en tiempo real para todos los vecinos y barrios de Capilla del Monte.',
    icon: '⛰️'
  };

  const barrioRooms = BARRIOS_CAPILLA.map(b => ({
    id: b.id,
    name: b.name,
    type: 'barrio',
    description: b.description,
    icon: b.icon,
    neighborhoodId: b.id
  }));

  res.json({ rooms: [generalRoom, ...barrioRooms] });
});

app.get('/api/chat/messages/:roomId', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const messages = db.getMessages(req.params.roomId, limit);
  res.json({ messages });
});

app.post('/api/chat/messages', (req: Request, res: Response) => {
  try {
    const { roomId, userId, text } = req.body;
    const msg = db.addMessage({ roomId, userId, text });
    io.to(roomId).emit('chat:new_message', msg);
    res.json({ message: msg });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/chat/messages/:id', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const ok = db.deleteMessage(req.params.id, userId);
    if (ok) {
      io.emit('chat:message_deleted', { messageId: req.params.id });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Mensaje no encontrado' });
    }
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/chat/report', (req: Request, res: Response) => {
  const { messageId, reporterId, reason } = req.body;
  const ok = db.reportMessage(messageId, reporterId, reason);
  res.json({ success: ok });
});

// Tablón de Anuncios
app.get('/api/posts', (req: Request, res: Response) => {
  const { category, neighborhoodId, search, includeExpired } = req.query;
  const posts = db.getPosts({
    category: category as string,
    neighborhoodId: neighborhoodId as string,
    search: search as string,
    includeExpired: includeExpired === 'true'
  });
  res.json({ posts });
});

app.get('/api/posts/:id', (req: Request, res: Response) => {
  const post = db.getPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });
  const comments = db.getCommentsForPost(post.id);
  res.json({ post, comments });
});

app.post('/api/posts', (req: Request, res: Response) => {
  try {
    const { userId, title, category, neighborhoodId, richContent, price, imageUrl } = req.body;
    if (!title || !category || !richContent) {
      return res.status(400).json({ error: 'Título, categoría y contenido son requeridos.' });
    }

    const post = db.createPost({
      userId,
      title,
      category,
      neighborhoodId,
      richContent,
      price,
      imageUrl
    });

    // Notificar por WebSocket que hay nuevo post en el tablón
    io.emit('tablon:new_post', post);

    res.json({ post });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/posts/:id', (req: Request, res: Response) => {
  try {
    const { userId, title, richContent, price, imageUrl, status } = req.body;
    const updated = db.updatePost(req.params.id, userId, {
      title,
      richContent,
      price,
      imageUrl,
      status
    });

    io.emit('tablon:post_updated', updated);
    res.json({ post: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const ok = db.deletePost(req.params.id, userId);
    if (ok) {
      io.emit('tablon:post_deleted', { postId: req.params.id });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Post no encontrado' });
    }
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const result = db.togglePostLike(req.params.id, userId);
    io.emit('tablon:post_liked', { postId: req.params.id, likesCount: result.likesCount });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Comentarios en Anuncios
app.get('/api/posts/:id/comments', (req: Request, res: Response) => {
  const comments = db.getCommentsForPost(req.params.id);
  res.json({ comments });
});

app.post('/api/posts/:id/comments', (req: Request, res: Response) => {
  try {
    const { userId, text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Texto requerido' });
    const comment = db.addComment(req.params.id, userId, text);
    io.emit('tablon:new_comment', comment);
    res.json({ comment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Notificaciones
app.get('/api/notifications/:userId', (req: Request, res: Response) => {
  const notifs = db.getNotificationsForUser(req.params.userId);
  res.json({ notifications: notifs });
});

app.post('/api/notifications/:userId/read', (req: Request, res: Response) => {
  db.markNotificationsAsRead(req.params.userId);
  res.json({ success: true });
});

// Barrios y Estadísticas
app.get('/api/barrios', (_req: Request, res: Response) => {
  const stats = db.getStats();
  res.json({ barrios: stats.barrios });
});

app.get('/api/stats', (_req: Request, res: Response) => {
  const stats = db.getStats();
  const onlineCount = getOnlineUsersList().length;
  res.json({ ...stats, totalOnline: onlineCount });
});

// Moderación y Panel de Administración
app.get('/api/admin/reports', (_req: Request, res: Response) => {
  const reports = db.getReports();
  res.json({ reports });
});

app.post('/api/admin/reports/:id/resolve', (req: Request, res: Response) => {
  const { action, moderatorId } = req.body;
  const ok = db.resolveReport(req.params.id, action, moderatorId);
  res.json({ success: ok });
});

app.get('/api/admin/schema', (_req: Request, res: Response) => {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'server', 'schema.sql'), 'utf-8');
    const stats = db.getStats();
    res.json({ schemaSql, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoints de descarga directa de APK y proyecto Android
app.get('/downloads/CapillaConecta.apk', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'public', 'downloads', 'CapillaConecta.apk');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="CapillaConecta.apk"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo APK no encontrado');
  }
});

app.get('/downloads/CapillaConecta-Android-Project.zip', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'public', 'downloads', 'CapillaConecta-Android-Project.zip');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="CapillaConecta-Android-Project.zip"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo ZIP no encontrado');
  }
});

// ==========================================
// Integración con Vite / Producción
// ==========================================
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Capilla Conecta] Servidor activo en http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Error al iniciar el servidor:', err);
});
