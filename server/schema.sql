-- ==========================================================
-- Capilla Conecta - Esquema Relacional de Base de Datos
-- Compatible con PostgreSQL y SQLite
-- ==========================================================

-- 1. Tabla de Barrios Oficiales de Capilla del Monte
CREATE TABLE IF NOT EXISTS barrios (
    id VARCHAR(50) PRIMARY KEY,                  -- ej: 'centro', 'balumba', 'el-zapato'
    nombre VARCHAR(100) NOT NULL,               -- ej: 'Centro', 'Balumba'
    descripcion TEXT,                           -- Breve descripción geográfica o serrana
    icono VARCHAR(10) DEFAULT '⛰️',              -- Emoticón representativo
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),                 -- Hash seguro de contraseña
    nombre_visible VARCHAR(100),                -- Nombre de pila o Nick opcional
    barrio_id VARCHAR(50) NOT NULL REFERENCES barrios(id),
    avatar_emoticon VARCHAR(10) NOT NULL,       -- Uno de los 20 emoticones oficiales
    telefono VARCHAR(50),                       -- Teléfono / WhatsApp opcional
    telefono_visible BOOLEAN DEFAULT FALSE,     -- Si autoriza mostrarlo públicamente
    bio TEXT,                                   -- Biografía corta
    rol VARCHAR(20) DEFAULT 'vecino',           -- 'vecino', 'moderador', 'admin'
    email_verificado BOOLEAN DEFAULT TRUE,
    reglas_aceptadas BOOLEAN DEFAULT TRUE,
    ultimo_cambio_barrio TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Regla de 30 días
    esta_baneado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Salas de Chat
CREATE TABLE IF NOT EXISTS salas_chat (
    id VARCHAR(50) PRIMARY KEY,                  -- 'todos-juntos' o el ID de cada barrio
    nombre VARCHAR(100) NOT NULL,               -- 'Todos juntos' o nombre del barrio
    tipo VARCHAR(20) NOT NULL DEFAULT 'barrio', -- 'general' o 'barrio'
    barrio_id VARCHAR(50) REFERENCES barrios(id),
    descripcion TEXT,
    solo_vecinos_escriben BOOLEAN DEFAULT TRUE,  -- Configurable: solo vecinos pueden escribir
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Mensajes de Chat
CREATE TABLE IF NOT EXISTS mensajes_chat (
    id VARCHAR(64) PRIMARY KEY,
    sala_id VARCHAR(50) NOT NULL REFERENCES salas_chat(id) ON DELETE CASCADE,
    usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    menciones JSON DEFAULT '[]',                 -- IDs de usuarios mencionados
    es_reportado BOOLEAN DEFAULT FALSE,
    esta_borrado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Reacciones a Mensajes de Chat
CREATE TABLE IF NOT EXISTS reacciones_mensajes (
    id VARCHAR(64) PRIMARY KEY,
    mensaje_id VARCHAR(64) NOT NULL REFERENCES mensajes_chat(id) ON DELETE CASCADE,
    usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,                  -- 👍, ❤️, 🧉, 👏, 😂
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mensaje_id, usuario_id, emoji)
);

-- 6. Tabla de Anuncios del Tablón Comunitario
CREATE TABLE IF NOT EXISTS posts_tablon (
    id VARCHAR(64) PRIMARY KEY,
    usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    barrio_id VARCHAR(50) NOT NULL REFERENCES barrios(id),
    titulo VARCHAR(150) NOT NULL,
    categoria VARCHAR(20) NOT NULL,              -- 'vende', 'regala', 'busca', 'servicio'
    contenido_rico TEXT NOT NULL,                -- HTML/Texto enriquecido formateado
    precio VARCHAR(50),                          -- Opcional (ej: $15.000 o A convenir)
    imagen_url TEXT,                             -- Opcional (URL de foto o foto serrana)
    estado VARCHAR(20) DEFAULT 'activo',         -- 'activo', 'vendido', 'agotado', 'regalado', 'reservado', 'expirado'
    expira_en TIMESTAMP NOT NULL,                -- Exactamente 24 horas después de creado
    puede_editar_hasta TIMESTAMP NOT NULL,       -- Exactamente 10 minutos después de creado
    editado_en TIMESTAMP,                        -- Timestamp de última edición
    es_reportado BOOLEAN DEFAULT FALSE,
    esta_borrado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Me Gusta en Posts del Tablón
CREATE TABLE IF NOT EXISTS likes_post (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) NOT NULL REFERENCES posts_tablon(id) ON DELETE CASCADE,
    usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, usuario_id)
);

-- 8. Tabla de Comentarios en Posts del Tablón
CREATE TABLE IF NOT EXISTS comentarios_post (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) NOT NULL REFERENCES posts_tablon(id) ON DELETE CASCADE,
    usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    esta_borrado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla de Reportes de Moderación
CREATE TABLE IF NOT EXISTS reportes (
    id VARCHAR(64) PRIMARY KEY,
    reportante_id VARCHAR(64) NOT NULL REFERENCES usuarios(id),
    tipo_elemento VARCHAR(20) NOT NULL,         -- 'chat_message', 'post', 'usuario'
    elemento_id VARCHAR(64) NOT NULL,
    motivo VARCHAR(50) NOT NULL,                 -- 'spam', 'ofensivo', 'ilegal', 'estafa', 'otro'
    detalles TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',     -- 'pendiente', 'resuelto', 'descartado'
    moderador_id VARCHAR(64) REFERENCES usuarios(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id VARCHAR(64) PRIMARY KEY,
    usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL,                  -- 'mencion', 'like', 'comentario', 'nuevo_post_barrio'
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    enlace TEXT,
    leida BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados para alta concurrencia
CREATE INDEX IF NOT EXISTS idx_mensajes_sala ON mensajes_chat(sala_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_posts_barrio ON posts_tablon(barrio_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_posts_expira ON posts_tablon(expira_en);
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones(usuario_id, leida);
