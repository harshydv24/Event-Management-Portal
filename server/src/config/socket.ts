import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import admin from './firebaseAdmin.js';
import User from '../models/User.js';

let io: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  clubId?: string;
}

/**
 * Initialize Socket.IO with HTTP server.
 */
export const initSocket = (server: HttpServer, allowedOrigins: string[]): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        // Allow localhost dev servers
        if (origin.startsWith('http://localhost:')) return callback(null, true);
        // Allow ngrok tunnels
        if (origin.endsWith('.ngrok-free.dev')) return callback(null, true);
        // Allow Vercel preview and production deployments
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        // Allow explicitly configured origins
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Reject unknown origins in production, allow in development
        if (process.env.NODE_ENV === 'production') {
          return callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
        return callback(null, true);
      },
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Socket authentication middleware (optional token verification on handshake)
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        // Allow unauthenticated connection to public rooms, but mark as guest
        return next();
      }

      const decoded = await admin.auth().verifyIdToken(token);
      socket.userId = decoded.uid;

      const userProfile = await User.findById(decoded.uid);
      if (userProfile) {
        socket.userRole = userProfile.role;
        socket.clubId = userProfile.clubId;
      }

      next();
    } catch (err) {
      console.warn('Socket connection token verification failed (continuing as guest):', err);
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id} (user: ${socket.userId || 'guest'})`);

    // Always join the global public rooms
    socket.join('events');
    socket.join('announcements');

    // Join user-specific and role-specific rooms if authenticated
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }
    if (socket.clubId) {
      socket.join(`club:${socket.clubId}`);
    }

    // Client can register explicitly with an updated token or room subscription
    socket.on('authenticate', async (token: string) => {
      try {
        if (!token) return;
        const decoded = await admin.auth().verifyIdToken(token);
        socket.userId = decoded.uid;
        socket.join(`user:${decoded.uid}`);

        const userProfile = await User.findById(decoded.uid);
        if (userProfile) {
          socket.userRole = userProfile.role;
          socket.clubId = userProfile.clubId;
          socket.join(`role:${userProfile.role}`);
          if (userProfile.clubId) {
            socket.join(`club:${userProfile.clubId}`);
          }
        }
        socket.emit('authenticated', { userId: socket.userId, role: socket.userRole });
      } catch (e) {
        socket.emit('auth_error', { message: 'Failed to verify token' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected from Socket.IO: ${socket.id} (${reason})`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

/**
 * Access the global Socket.IO instance.
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet.');
  }
  return io;
};

// ─── Event Notification Broadcasters ───────────────────────────────────

export const emitEventCreated = (event: unknown): void => {
  if (!io) return;
  io.to('events').to('role:department').emit('event:created', event);
};

export const emitEventUpdated = (event: { id?: string; clubId?: string }): void => {
  if (!io) return;
  io.to('events').emit('event:updated', event);
  if (event.clubId) {
    io.to(`club:${event.clubId}`).emit('event:updated', event);
  }
};

export const emitEventDeleted = (eventId: string, clubId?: string): void => {
  if (!io) return;
  io.to('events').emit('event:deleted', { id: eventId, clubId });
  if (clubId) {
    io.to(`club:${clubId}`).emit('event:deleted', { id: eventId, clubId });
  }
};

export const emitNotificationForUser = (userId: string, notification: unknown): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
};

export const emitNotificationForRole = (role: string, notification: unknown): void => {
  if (!io) return;
  io.to(`role:${role}`).emit('notification:new', notification);
};

export const emitNotificationForClub = (clubId: string, notification: unknown): void => {
  if (!io) return;
  io.to(`club:${clubId}`).emit('notification:new', notification);
};

export const emitAnnouncementCreated = (announcement: unknown): void => {
  if (!io) return;
  io.to('announcements').emit('announcement:created', announcement);
};

export const emitClubUpdated = (club: { id?: string }): void => {
  if (!io) return;
  io.to('events').emit('club:updated', club);
};

