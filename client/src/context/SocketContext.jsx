import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const socket = io('/', {
      auth: { userId: user.id },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('notification:new', (notif) => {
      setUnreadCount(prev => prev + 1);
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('DevCollab', { body: notif.message });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const getSocket = () => socketRef.current;

  return (
    <SocketContext.Provider value={{ getSocket, connected, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be inside SocketProvider');
  return ctx;
};
