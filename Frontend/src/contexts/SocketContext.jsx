// src/contexts/SocketContext.jsx — Notifications temps réel + sync compétences
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [messagesNonLus, setMessagesNonLus] = useState(0);
  const competenceListenersRef = useRef(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const s = io('http://localhost:5000', { withCredentials: true });
    socketRef.current = s;
    setSocket(s);

    if (user.filiere_id && user.niveau_id) {
      s.emit('join_room', { filiere_id: user.filiere_id, niveau_id: user.niveau_id });
    }
    s.emit('join_user_room', { user_id: user.id });

    s.on('nouvel_evenement', (data) => {
      toast('📅 ' + data.message, { duration: 5000, icon: '📅' });
      addNotif({ ...data, type: 'evenement', source: 'evenements', time: Date.now() });
    });

    s.on('nouvelle_discussion', (data) => {
      toast('💬 ' + data.message, { duration: 4000 });
      addNotif({ ...data, type: 'discussion', source: 'discussion', time: Date.now() });
    });

    s.on('nouveau_document', (data) => {
      toast('📄 ' + data.message, { duration: 4000 });
      addNotif({ ...data, type: 'document', source: 'cours', time: Date.now() });
    });

    s.on('permission_changed', (data) => {
      toast(data.message, { duration: 5000 });
      addNotif({ ...data, type: 'permission', source: 'discussion', time: Date.now() });
    });

    s.on('nouveau_message_prive', (data) => {
      toast(`💌 ${data.message}`, { duration: 5000 });
      setMessagesNonLus(prev => prev + 1);
      addNotif({ ...data, type: 'message_prive', source: 'messagerie', time: Date.now() });
    });

    // ── NOUVEAU: sync temps réel compétences ──
    s.on('competence_updated', (data) => {
      competenceListenersRef.current.forEach(cb => cb(data));
    });

    fetch('/api/messagerie/non-lus/count', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setMessagesNonLus(d.total); })
      .catch(() => {});

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const addNotif = (notif) => {
    setNotifications(prev => [
      { ...notif, lu: false, id: Date.now() + Math.random() },
      ...prev
    ]);
  };

  // Abonnement aux mises à jour de compétences
  const subscribeToCompetences = useCallback((callback) => {
    competenceListenersRef.current.add(callback);
    return () => competenceListenersRef.current.delete(callback);
  }, []);

  const marquerLu = (id) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));

  const marquerTousLus = () =>
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));

  const resetMessagesNonLus = () => setMessagesNonLus(0);

  const nbNonLu = notifications.filter(n => !n.lu).length;

  return (
    <SocketContext.Provider value={{
      socket,
      notifications,
      marquerLu,
      marquerTousLus,
      nbNonLu,
      messagesNonLus,
      resetMessagesNonLus,
      subscribeToCompetences,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);