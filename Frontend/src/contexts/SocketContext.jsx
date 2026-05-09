// src/contexts/SocketContext.jsx — Notifications temps réel
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const s = io('http://localhost:5000', { withCredentials: true });
    setSocket(s);

    // Rejoindre la room de sa filière+niveau
    if (user.filiere_id && user.niveau_id) {
      s.emit('join_room', { filiere_id: user.filiere_id, niveau_id: user.niveau_id });
    }

    // Écouter les événements
    s.on('nouvel_evenement', (data) => {
      toast('📅 ' + data.message, { duration: 5000 });
      setNotifications(prev => [{ ...data, type: 'evenement', lu: false, id: Date.now() }, ...prev]);
    });

    s.on('nouvelle_discussion', (data) => {
      toast('💬 ' + data.message, { duration: 5000 });
      setNotifications(prev => [{ ...data, type: 'discussion', lu: false, id: Date.now() }, ...prev]);
    });

    return () => s.disconnect();
  }, [user]);

  const marquerLu = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  const nbNonLu = notifications.filter(n => !n.lu).length;

  return (
    <SocketContext.Provider value={{ socket, notifications, marquerLu, nbNonLu }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);