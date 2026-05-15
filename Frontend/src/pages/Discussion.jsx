// src/pages/Discussion.jsx — Discussion responsive mobile
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Trash2, Mic, MicOff, Send, Volume2, Lock, Unlock, X } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

export default function Discussion() {
  const { user, isDelegue } = useAuth();
  const { socket } = useSocket();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ouvertATous, setOuvertATous] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const canWrite = isDelegue() || ouvertATous;

  const fetch = async () => {
    try {
      const r = await api.get(`/discussions/filiere/${user.filiere_id}/niveau/${user.niveau_id}`);
      setDiscussions(r.data.discussions || []);
      setOuvertATous(r.data.ouvert_a_tous ?? false);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetch(); }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => setDiscussions(prev => [data.discussion, ...prev]);
    const permHandler = (data) => setOuvertATous(data.ouvert_a_tous);
    socket.on('nouvelle_discussion', handler);
    socket.on('permission_changed', permHandler);
    return () => { socket.off('nouvelle_discussion', handler); socket.off('permission_changed', permHandler); };
  }, [socket]);

  const togglePermission = async () => {
    try {
      const newVal = !ouvertATous;
      await api.put('/discussions/permissions', { filiere_id: user.filiere_id, niveau_id: user.niveau_id, ouvert_a_tous: newVal });
      setOuvertATous(newVal);
      toast.success(newVal ? '🔓 Discussion ouverte à tous' : '🔒 Réservée aux délégués');
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch { toast.error('Microphone inaccessible'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !audioBlob) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('filiere_id', user.filiere_id);
      fd.append('niveau_id', user.niveau_id);
      if (audioBlob) {
        fd.append('type', 'vocal');
        fd.append('audio', audioBlob, 'message.webm');
      } else {
        fd.append('type', 'texte');
        fd.append('contenu', message.trim());
      }
      await api.post('/discussions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(''); setAudioBlob(null); setAudioUrl(null); setShowForm(false);
      toast.success('Message envoyé !');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await api.delete(`/discussions/${id}`);
      setDiscussions(prev => prev.filter(d => d.id !== id));
    } catch { toast.error('Erreur'); }
  };

  const formatDate = (d) => {
    const date = new Date(d);
    const now  = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const RANG_COLOR = {
    etudiant:   { bg: 'rgba(79,142,247,0.15)',  color: 'var(--c-primary)' },
    delegue:    { bg: 'rgba(168,85,247,0.15)', color: 'var(--c-delegue)' },
    professeur: { bg: 'rgba(6,214,160,0.15)',  color: 'var(--c-prof)'    },
  };

  return (
    <div className="space-y-4 md:space-y-5 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl gradient-text">Discussion</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            {user?.filiere_nom} · {user?.niveau_code}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDelegue() && (
            <button onClick={togglePermission}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: ouvertATous ? 'var(--c-success-glow)' : 'rgba(240,82,82,0.1)',
                color:      ouvertATous ? 'var(--c-success)'       : 'var(--c-danger)',
                border: `1px solid ${ouvertATous ? 'rgba(16,217,123,0.3)' : 'rgba(240,82,82,0.3)'}`,
              }}>
              {ouvertATous ? <Unlock size={13} /> : <Lock size={13} />}
              <span className="hidden sm:inline">{ouvertATous ? 'Ouvert' : 'Restreint'}</span>
            </button>
          )}
          {canWrite && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
              <Plus size={15} />
              <span className="hidden sm:inline">Message</span>
            </button>
          )}
        </div>
      </div>

      {/* Bannière permissions */}
      <div className="p-3 rounded-xl border flex items-center gap-2 text-xs md:text-sm"
        style={{
          background:   ouvertATous ? 'rgba(16,217,123,0.06)'  : 'rgba(79,142,247,0.06)',
          borderColor:  ouvertATous ? 'rgba(16,217,123,0.2)'   : 'rgba(79,142,247,0.15)',
          color:        ouvertATous ? 'var(--c-success)'        : 'var(--c-primary)',
        }}>
        {ouvertATous ? <Unlock size={13} /> : <Lock size={13} />}
        <span>
          {ouvertATous
            ? 'Tous les membres peuvent écrire'
            : 'Réservé aux délégués — Les étudiants peuvent lire'}
        </span>
      </div>

      {/* Formulaire */}
      {showForm && canWrite && (
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm md:text-base">Nouveau message</h3>
            <button onClick={() => { setShowForm(false); setAudioBlob(null); setAudioUrl(null); setMessage(''); }}>
              <X size={18} style={{ color: 'var(--c-text-muted)' }} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea className="input resize-none" rows={3}
              placeholder="Votre message..." value={message}
              onChange={e => setMessage(e.target.value)} disabled={!!audioBlob} />

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-muted)' }}>OU</span>
              <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
            </div>

            {!audioBlob ? (
              <button type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!!message.trim()}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: isRecording ? 'var(--c-danger-glow)' : 'rgba(79,142,247,0.12)',
                  color:      isRecording ? 'var(--c-danger)'       : 'var(--c-primary)',
                  opacity:    message.trim() ? 0.4 : 1,
                }}>
                {isRecording
                  ? <><MicOff size={15} /> Arrêter <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /></>
                  : <><Mic size={15} /> Enregistrer</>}
              </button>
            ) : (
              <div className="space-y-2">
                <audio src={audioUrl} controls className="w-full" />
                <button type="button" onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
                  className="text-xs" style={{ color: 'var(--c-danger)' }}>✕ Réenregistrer</button>
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={submitting || (!message.trim() && !audioBlob)}
                className="btn-primary flex items-center gap-2 text-sm flex-1 justify-center"
                style={{ opacity: (submitting || (!message.trim() && !audioBlob)) ? 0.5 : 1 }}>
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <Send size={14} /> Envoyer
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setMessage(''); setAudioBlob(null); setAudioUrl(null); }}
                className="btn-outline text-sm">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-2xl" />)}
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-12 card">
          <MessageSquare size={40} className="mx-auto mb-3" style={{ color: 'var(--c-text-dim)' }} />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucun message pour le moment</p>
          {canWrite && <p className="text-sm mt-1" style={{ color: 'var(--c-text-dim)' }}>Soyez le premier à écrire !</p>}
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {discussions.map(disc => {
            const rc = RANG_COLOR[disc.rang] || RANG_COLOR.etudiant;
            const isMe = disc.created_by === user.id;
            return (
              <div key={disc.id} className="card-hover" style={{ padding: '0.875rem 1rem' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: rc.bg, color: rc.color, fontFamily: 'Outfit, sans-serif' }}>
                    {disc.prenom?.[0]}{disc.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="font-semibold text-sm truncate" style={{ color: 'var(--c-text)' }}>
                          {disc.prenom} {disc.nom}
                        </span>
                        <span className={`badge badge-${disc.rang} text-[10px]`}>{disc.rang}</span>
                        {disc.type === 'vocal' && (
                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-lg"
                            style={{ background: 'var(--c-prof-glow)', color: 'var(--c-prof)' }}>
                            <Volume2 size={9} /> Vocal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{formatDate(disc.created_at)}</span>
                        {(isMe || isDelegue()) && (
                          <button onClick={() => handleDelete(disc.id)}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--c-danger)' }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    {disc.type === 'texte' && disc.contenu && (
                      <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap"
                        style={{ color: 'var(--c-text)', lineHeight: 1.5 }}>
                        {disc.contenu}
                      </p>
                    )}
                    {disc.type === 'vocal' && disc.media_url && (
                      <audio src={disc.media_url} controls className="mt-2 w-full max-w-xs" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}