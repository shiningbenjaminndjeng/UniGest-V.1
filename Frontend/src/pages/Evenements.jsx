// src/pages/Evenements.jsx — Gestion des événements
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Plus, Trash2, Image, Video, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPES = [
  { value: 'evaluation', label: 'Évaluation', emoji: '📝', color: '#f59e0b' },
  { value: 'conference', label: 'Conférence', emoji: '🎙️', color: '#3b82f6' },
  { value: 'fete', label: 'Fête', emoji: '🎉', color: '#ec4899' },
  { value: 'autre', label: 'Autre', emoji: '📌', color: '#8b5cf6' },
];

export default function Evenements() {
  const { user, isDelegue } = useAuth();
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filtreType, setFiltreType] = useState('tous');
  const [form, setForm] = useState({ titre: '', description: '', type: 'autre', date_evenement: '' });
  const [media, setMedia] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetch = async () => {
    try {
      const r = await api.get(`/evenements/filiere/${user.filiere_id}/niveau/${user.niveau_id}`);
      setEvenements(r.data.evenements || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetch(); }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries({ ...form, filiere_id: user.filiere_id, niveau_id: user.niveau_id }).forEach(
        ([k, v]) => fd.append(k, v)
      );
      if (media) fd.append('media', media);

      await api.post('/evenements', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Événement créé !');
      setShowForm(false);
      setForm({ titre: '', description: '', type: 'autre', date_evenement: '' });
      setMedia(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await api.delete(`/evenements/${id}`);
      toast.success('Supprimé');
      fetch();
    } catch { toast.error('Erreur'); }
  };

  const filtered = filtreType === 'tous' ? evenements : evenements.filter(e => e.type === filtreType);

  const getTypeInfo = (type) => TYPES.find(t => t.value === type) || TYPES[3];

  const MediaPreview = ({ ev }) => {
    if (!ev.media_url) return null;
    const url = ev.media_url;
    if (ev.media_type === 'image') return (
      <img src={url} alt={ev.titre} className="w-full h-40 object-cover rounded-xl mt-3" />
    );
    if (ev.media_type === 'video') return (
      <video src={url} controls className="w-full rounded-xl mt-3" />
    );
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 mt-3 text-sm px-3 py-2 rounded-xl"
        style={{ background: 'var(--c-surface2)', color: 'var(--c-primary)' }}>
        <FileText size={14} /> Voir le document
      </a>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>Événements</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            {evenements.length} événement(s) · {user?.filiere_nom} {user?.niveau_code}
          </p>
        </div>
        {isDelegue() && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Ajouter
          </button>
        )}
      </div>

      {/* Formulaire (délégué) */}
      {showForm && isDelegue() && (
        <div className="card fade-in">
          <h3 className="font-semibold mb-4">Nouvel Événement</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Titre *</label>
              <input className="input" placeholder="Titre de l'événement" value={form.titre}
                onChange={e => setForm(f => ({...f, titre: e.target.value}))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Type *</label>
                <select className="select" value={form.type}
                  onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Date</label>
                <input className="input" type="datetime-local" value={form.date_evenement}
                  onChange={e => setForm(f => ({...f, date_evenement: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Description</label>
              <textarea className="input resize-none" rows={3} placeholder="Détails de l'événement..."
                value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
                Fichier joint (image, vidéo, document)
              </label>
              <input type="file" className="input text-sm" accept="image/*,video/*,.pdf"
                onChange={e => setMedia(e.target.files[0])} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {submitting ? 'Création...' : 'Créer l\'événement'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres par type */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltreType('tous')} className={`tab ${filtreType === 'tous' ? 'active' : ''}`}>
          Tous ({evenements.length})
        </button>
        {TYPES.map(t => {
          const nb = evenements.filter(e => e.type === t.value).length;
          return nb > 0 ? (
            <button key={t.value} onClick={() => setFiltreType(t.value)}
              className={`tab ${filtreType === t.value ? 'active' : ''}`}>
              {t.emoji} {t.label} ({nb})
            </button>
          ) : null;
        })}
      </div>

      {/* Liste des événements */}
      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--c-text-muted)' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <Calendar size={48} className="mx-auto mb-4 opacity-20" />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucun événement</p>
          {isDelegue() && <p className="text-sm mt-2" style={{ color: 'var(--c-text-muted)' }}>
            Créez le premier événement de votre promotion !
          </p>}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(ev => {
            const typeInfo = getTypeInfo(ev.type);
            return (
              <div key={ev.id} className="card-hover">
                <div className="flex items-start gap-4">
                  {/* Icône type */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${typeInfo.color}20` }}>
                    {typeInfo.emoji}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold" style={{ color: 'var(--c-text)' }}>{ev.titre}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: 'var(--c-text-muted)' }}>
                          <span>Par {ev.auteur_prenom} {ev.auteur_nom}</span>
                          <span>·</span>
                          <span>{new Date(ev.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          {ev.date_evenement && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1" style={{ color: typeInfo.color }}>
                                <Clock size={11} />
                                {new Date(ev.date_evenement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                {' '}
                                {new Date(ev.date_evenement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {isDelegue() && ev.created_by === user.id && (
                        <button onClick={() => handleDelete(ev.id)}
                          className="p-2 rounded-xl hover:bg-red-500/20 transition-colors flex-shrink-0"
                          style={{ color: 'var(--c-danger)' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {ev.description && (
                      <p className="text-sm mt-2" style={{ color: 'var(--c-text-muted)' }}>{ev.description}</p>
                    )}

                    <MediaPreview ev={ev} />
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