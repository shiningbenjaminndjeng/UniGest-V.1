// src/pages/Messagerie.jsx — Messagerie privée responsive mobile
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Search, Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

function formatTime(d) {
  const date = new Date(d);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 86400) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const RANG_COLOR = {
  etudiant:   { bg: 'rgba(79,142,247,0.15)',  color: 'var(--c-primary)' },
  delegue:    { bg: 'rgba(168,85,247,0.15)', color: 'var(--c-delegue)' },
  professeur: { bg: 'rgba(6,214,160,0.15)',  color: 'var(--c-prof)' },
};

export default function Messagerie() {
  const { user } = useAuth();
  const { socket, resetMessagesNonLus } = useSocket();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  // Vue mobile: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);

  const fetchConversations = async () => {
    try {
      const r = await api.get('/messagerie/conversations');
      setConversations(r.data.conversations || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchConversations();
    resetMessagesNonLus?.();
  }, []);

  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId && !selectedUser) {
      api.get(`/messagerie/${userId}`).then(r => {
        if (r.data.interlocuteur) openConversation(r.data.interlocuteur);
      }).catch(() => {});
    }
  }, [searchParams]);

  const openConversation = async (otherUser) => {
    setSelectedUser(otherUser);
    setMobileView('chat');
    setLoadingMsgs(true);
    try {
      const r = await api.get(`/messagerie/${otherUser.id}`);
      setMessages(r.data.messages || []);
      fetchConversations();
    } catch {}
    finally { setLoadingMsgs(false); }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setMobileView('list');
  };

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (selectedUser?.id === data.from?.id) {
        setMessages(prev => [...prev, data.msg]);
      }
      fetchConversations();
    };
    const typingHandler = (data) => {
      setTypingUser(data.from_name);
      setIsTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(false), 2000);
    };
    socket.on('nouveau_message_prive', handler);
    socket.on('user_typing', typingHandler);
    return () => {
      socket.off('nouveau_message_prive', handler);
      socket.off('user_typing', typingHandler);
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!searchUser.trim() || searchUser.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/messagerie/users/search?q=${searchUser}`);
        setSearchResults(r.data.users || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedUser) return;
    setSending(true);
    try {
      const r = await api.post(`/messagerie/${selectedUser.id}`, { contenu: newMsg.trim() });
      setMessages(prev => [...prev, r.data.message]);
      setNewMsg('');
      fetchConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSending(false); }
  };

  const handleTyping = () => {
    if (socket && selectedUser) {
      socket.emit('typing', { to_user_id: selectedUser.id, from_name: `${user.prenom} ${user.nom}` });
    }
  };

  const getRc = (rang) => RANG_COLOR[rang] || RANG_COLOR.etudiant;

  const ConversationList = () => (
    <div className="flex flex-col h-full">
      {/* Header + search */}
      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--c-border)' }}>
        <h2 className="font-black text-lg gradient-text mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Messages
        </h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Chercher un utilisateur..."
            value={searchUser} onChange={e => setSearchUser(e.target.value)} />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--c-border)' }}>
            {searchResults.map(u => {
              const rc = getRc(u.rang);
              return (
                <button key={u.id}
                  onClick={() => { openConversation(u); setSearchUser(''); setSearchResults([]); }}
                  className="flex items-center gap-2 w-full p-3 text-left transition-all"
                  style={{ background: 'var(--c-surface2)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: rc.bg, color: rc.color }}>
                    {u.prenom?.[0]}{u.nom?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{u.prenom} {u.nom}</p>
                    <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{u.rang} · {u.niveau_code || 'Prof'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center p-8">
            <MessageSquare size={40} className="mx-auto mb-3" style={{ color: 'var(--c-text-dim)' }} />
            <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Aucune conversation</p>
            <p className="text-xs mt-1" style={{ color: 'var(--c-text-dim)' }}>Cherchez un utilisateur ci-dessus</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map(conv => {
              const rc = getRc(conv.rang);
              const isSelected = selectedUser?.id === conv.other_user_id;
              return (
                <button key={conv.other_user_id}
                  onClick={() => openConversation({ id: conv.other_user_id, nom: conv.nom, prenom: conv.prenom, rang: conv.rang, niveau_code: conv.niveau_code })}
                  className={`conv-item w-full text-left ${isSelected ? 'active' : ''}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: rc.bg, color: rc.color }}>
                      {conv.prenom?.[0]}{conv.nom?.[0]}
                    </div>
                    {conv.nb_non_lus > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-bold"
                        style={{ background: 'var(--c-danger)', fontSize: 9 }}>
                        {conv.nb_non_lus}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
                        {conv.prenom} {conv.nom}
                      </p>
                      <p className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--c-text-muted)' }}>
                        {formatTime(conv.derniere_activite)}
                      </p>
                    </div>
                    <p className="text-xs truncate" style={{
                      color: conv.nb_non_lus > 0 ? 'var(--c-text)' : 'var(--c-text-muted)',
                      fontWeight: conv.nb_non_lus > 0 ? 600 : 400
                    }}>
                      {conv.expediteur_id === user.id ? 'Vous: ' : ''}{conv.dernier_message}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const ChatView = () => (
    <>
      {/* Header chat */}
      <div className="flex items-center gap-3 p-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}>
        <button onClick={handleBack}
          className="p-2 rounded-xl flex-shrink-0"
          style={{ color: 'var(--c-text-muted)', background: 'var(--c-surface2)' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: getRc(selectedUser.rang).bg, color: getRc(selectedUser.rang).color }}>
          {selectedUser.prenom?.[0]}{selectedUser.nom?.[0]}
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>
            {selectedUser.prenom} {selectedUser.nom}
          </p>
          <p className="text-xs capitalize" style={{ color: 'var(--c-text-muted)' }}>
            {selectedUser.rang}{selectedUser.niveau_code ? ` · ${selectedUser.niveau_code}` : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ overscrollBehavior: 'contain' }}>
        {loadingMsgs ? (
          <div className="flex items-center justify-center py-10">
            <span className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--c-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.expediteur_id === user.id;
            const showTime = idx === 0 ||
              (new Date(msg.created_at) - new Date(messages[idx - 1].created_at)) > 300000;
            return (
              <div key={msg.id}>
                {showTime && (
                  <div className="text-center my-2">
                    <span className="text-xs px-3 py-1 rounded-full"
                      style={{ background: 'var(--c-surface)', color: 'var(--c-text-muted)' }}>
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2 self-end"
                      style={{ background: getRc(selectedUser.rang).bg, color: getRc(selectedUser.rang).color }}>
                      {selectedUser.prenom?.[0]}
                    </div>
                  )}
                  <div className={isMe ? 'msg-mine' : 'msg-other'}>
                    <p className="leading-relaxed text-sm">{msg.contenu}</p>
                    {isMe && (
                      <p className="text-xs mt-1 text-right opacity-60">{msg.lu ? '✓✓' : '✓'}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: getRc(selectedUser.rang).bg, color: getRc(selectedUser.rang).color }}>
              {selectedUser.prenom?.[0]}
            </div>
            <div className="msg-other py-2.5 px-4">
              <div className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'var(--c-text-muted)', animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input message */}
      <div className="p-3 border-t flex-shrink-0"
        style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}>
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            className="input resize-none flex-1 text-sm"
            placeholder="Message..."
            rows={1}
            style={{ maxHeight: '100px', overflowY: 'auto', minHeight: '44px' }}
            value={newMsg}
            onChange={e => {
              setNewMsg(e.target.value);
              handleTyping();
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="submit" disabled={sending || !newMsg.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: newMsg.trim() ? 'var(--g-primary)' : 'var(--c-surface2)',
              color: newMsg.trim() ? 'white' : 'var(--c-text-muted)',
              boxShadow: newMsg.trim() ? '0 4px 15px var(--c-primary-glow)' : 'none'
            }}>
            {sending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={16} />}
          </button>
        </form>
        <p className="text-xs mt-1.5 hidden md:block" style={{ color: 'var(--c-text-dim)' }}>
          Entrée pour envoyer · Shift+Entrée pour sauter une ligne
        </p>
      </div>
    </>
  );

  return (
    <div className="fade-in">
      {/* Layout MOBILE: plein écran, une vue à la fois */}
      <div className="md:hidden" style={{ height: 'calc(100dvh - 128px)' }}>
        <div className="flex flex-col h-full rounded-2xl overflow-hidden border"
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}>
          {mobileView === 'list' || !selectedUser ? (
            ConversationList()
          ) : (
            ChatView()
          )}
        </div>
      </div>

      {/* Layout DESKTOP: deux colonnes */}
      <div className="hidden md:flex" style={{ height: 'calc(100vh - 100px)' }}>
        <div className="flex h-full rounded-2xl overflow-hidden border w-full"
          style={{ borderColor: 'var(--c-border)' }}>
          {/* Sidebar conversations */}
          <div className="flex flex-col border-r flex-shrink-0"
            style={{ width: '300px', background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
            {ConversationList()}
          </div>

          {/* Zone chat */}
          <div className="flex-1 flex flex-col" style={{ background: 'var(--c-bg2)' }}>
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 float"
                  style={{ background: 'rgba(79,142,247,0.1)' }}>
                  <MessageSquare size={32} style={{ color: 'var(--c-primary)' }} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--c-text)' }}>Messagerie privée</h3>
                <p className="text-sm text-center max-w-xs" style={{ color: 'var(--c-text-muted)' }}>
                  Sélectionnez une conversation ou cherchez un utilisateur
                </p>
              </div>
            ) : (
              ChatView()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}