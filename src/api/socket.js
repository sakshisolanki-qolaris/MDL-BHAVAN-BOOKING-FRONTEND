import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const socket = io(SOCKET_URL, {
  // CRITICAL: Required to send the HTTP-only JWT cookie to authenticate the websocket
  withCredentials: true, 
  
  // Do not connect automatically when the file loads. 
  // We will connect manually only after the user logs in.
  autoConnect: false,
  
  // Optional but recommended: handle connection retries
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

export default socket;