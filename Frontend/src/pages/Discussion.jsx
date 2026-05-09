// src/pages/Discussion.jsx — Consignes et messages du délégué
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Trash2, Mic, MicOff, Send, Volume2 } from 'lucide-react';

export default function Discussion() {
  const { user, isDelegue } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Enregistrement vocal
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const fetch = async () => {
    try {
      const r = await api.get(`/discussions/filiere/${user.filiere_id}/niveau/${user.niveau_id}`);
      setDiscussions(r.data.discussions || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetch(); }, [user]);

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
    } catch { toast.error('Microphone non accessible'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
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
      toast.success('Message envoyé !');
      setMessage(''); setAudioBlob(null); setAudioUrl(null);
      setShowForm(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await api.delete(`/discussions/${id}`);
      toast.success('Supprimé');
      fetch();
    } catch { toast.error('Erreur'); }
  };

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>Discussion</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            Consignes des délégués · {user?.filiere_nom} {user?.niveau_code}
          </p>
        </div>
        {isDelegue() && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau message
          </button>
        )}
      </div>

      {/* Avertissement si pas délégué */}
      {!isDelegue() && (
        <div className="p-4 rounded-xl border text-sm" style={{
          background: 'rgba(91,115,255,0.08)', borderColor: 'rgba(91,115,255,0.2)', color: 'var(--c-text-muted)'
        }}>
          💬 Seuls les délégués peuvent envoyer des messages. Vous pouvez lire les consignes ci-dessous.
        </div>
      )}

      {/* Formulaire (délégué) */}
      {showForm && isDelegue() && (
        <div className="card fade-in">
          <h3 className="font-semibold mb-4">Envoyer une consigne</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Message texte */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
                Message écrit
              </label>
              <textarea className="input resize-none" rows={4}
                placeholder="Écrivez votre consigne ici..."
                value={message} onChange={e => setMessage(e.target.value)}
                disabled={!!audioBlob} />
            </div>

            {/* OU enregistrement vocal */}
            <div className="text-center">
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
                <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>OU MESSAGE VOCAL</span>
                <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
              </div>

              {!audioBlob ? (
                <button type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!!message.trim()}
                  className={`flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold transition-all duration-200`}
                  style={{
                    background: isRecording ? 'rgba(239,68,68,0.2)' : 'rgba(91,115,255,0.15)',
                    color: isRecording ? 'var(--c-danger)' : 'var(--c-primary)',
                    opacity: message.trim() ? 0.4 : 1
                  }}>
                  {isRecording ? (
                    <><MicOff size={16} /> Arrêter l'enregistrement <span className="ml-1 w-2 h-2 rounded-full bg-red-400 animate-pulse" /></>
                  ) : (
                    <><Mic size={16} /> Commencer l'enregistrement</>
                  )}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <audio src={audioUrl} controls className="w-full" />
                  <button type="button" onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
                    className="text-sm" style={{ color: 'var(--c-danger)' }}>
                    ✕ Supprimer et réenregistrer
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting || (!message.trim() && !audioBlob)}
                className="btn-primary flex items-center gap-2"
                style={{ opacity: (submitting || (!message.trim() && !audioBlob)) ? 0.5 : 1 }}>
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <Send size={15} /> Envoyer
              </button>
              <button type="button" onClick={() => { setShowForm(false); setAudioBlob(null); setAudioUrl(null); setMessage(''); }}
                className="btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des messages */}
      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--c-text-muted)' }}>Chargement...</div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-16 card">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucune consigne pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map(disc => (
            <div key={disc.id} className="card-hover">
              <div className="flex items-start gap-4">
                {/* Avatar délégué */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--c-delegue)' }}>
                  {disc.prenom?.[0]}{disc.nom?.[0]}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>
                        {disc.prenom} {disc.nom}
                      </span>
                      <span className="badge badge-delegue">Délégué</span>
                      {disc.type === 'vocal' && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--c-prof)' }}>
                          <Volume2 size={10} /> Vocal
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
                        {formatDate(disc.created_at)}
                      </span>
                      {isDelegue() && disc.created_by === user.id && (
                        <button onClick={() => handleDelete(disc.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                          style={{ color: 'var(--c-danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {disc.type === 'texte' && disc.contenu && (
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ color: 'var(--c-text)', lineHeight: '1.6' }}>
                      {disc.contenu}
                    </p>
                  )}

                  {disc.type === 'vocal' && disc.media_url && (
                    <audio src={disc.media_url} controls className="mt-2 w-full max-w-sm" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}