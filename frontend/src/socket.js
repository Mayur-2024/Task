import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Global Socket.io instance
 * autoConnect is false by default so it connects cleanly once the user is authenticated
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});
