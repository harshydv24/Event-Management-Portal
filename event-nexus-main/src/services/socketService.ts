import { io, Socket } from 'socket.io-client';
import { auth } from '@/config/firebase';
import { Event, Notification, Club } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;

  /**
   * Connect to the Socket.IO server.
   */
  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting && this.socket) {
      return this.socket;
    }

    this.isConnecting = true;

    // Get current Firebase Auth token if signed in
    const token = await auth.currentUser?.getIdToken();

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to real-time WebSocket server');
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error (falling back to polling):', error.message);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnecting = false;
    });

    return this.socket;
  }

  /**
   * Re-authenticate the socket connection after login or token refresh.
   */
  async authenticate(): Promise<void> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;

    if (!this.socket || !this.socket.connected) {
      await this.connect();
    } else {
      this.socket.emit('authenticate', token);
    }
  }

  /**
   * Disconnect the socket.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  /**
   * Listen for new events.
   */
  onEventCreated(callback: (event: Event) => void): () => void {
    this.ensureConnection();
    this.socket?.on('event:created', callback);
    return () => this.socket?.off('event:created', callback);
  }

  /**
   * Listen for event updates (status changes, venue assignments, registrations).
   */
  onEventUpdated(callback: (event: Event) => void): () => void {
    this.ensureConnection();
    this.socket?.on('event:updated', callback);
    return () => this.socket?.off('event:updated', callback);
  }

  /**
   * Listen for event deletions.
   */
  onEventDeleted(callback: (data: { id: string; clubId?: string }) => void): () => void {
    this.ensureConnection();
    this.socket?.on('event:deleted', callback);
    return () => this.socket?.off('event:deleted', callback);
  }

  /**
   * Listen for club profile updates.
   */
  onClubUpdated(callback: (club: Club) => void): () => void {
    this.ensureConnection();
    this.socket?.on('club:updated', callback);
    return () => this.socket?.off('club:updated', callback);
  }

  /**
   * Listen for incoming notifications directed to the user, their role, or their club.
   */
  onNotification(callback: (notification: Notification) => void): () => void {
    this.ensureConnection();
    this.socket?.on('notification:new', callback);
    return () => this.socket?.off('notification:new', callback);
  }

  /**
   * Listen for global club announcements.
   */
  onAnnouncement(callback: (announcement: unknown) => void): () => void {
    this.ensureConnection();
    this.socket?.on('announcement:created', callback);
    return () => this.socket?.off('announcement:created', callback);
  }

  private ensureConnection() {
    if (!this.socket) {
      this.connect();
    }
  }
}

export const socketService = new SocketService();
export default socketService;

