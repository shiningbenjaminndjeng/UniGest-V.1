// ============================================================
// src/pages/Evenements.jsx — responsive mobile
// ============================================================
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Plus, Trash2, FileText, Clock, X } from 'lucide-react';

const TYPES = [
  { value: 'evaluation', label: 'Évaluation', emoji: '📝', color: '#f59e0b' },
  { value: 'conference', label: 'Conférence', emoji: '🎙️', color: '#3b82f6' },
  { value: 'fete',       label: 'Fête',       emoji: '🎉', color: '#ec4899' },
  { value: 'autre',      label: 'Autre',      emoji: '📌', color: '#8b5cf6' },
];

export function Evenements() {
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
      Object.entries({ ...form, filiere_id: user.filiere_id, niveau_id: user.niveau_id })
        .forEach(([k, v]) => fd.append(k, v));
      if (media) fd.append('media', media);
      await api.post('/evenements', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Événement créé !');
      setShowForm(false);
      setForm({ titre: '', description: '', type: 'autre', date_evenement: '' });
      setMedia(null);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet événement ?')) return;
    try { await api.delete(`/evenements/${id}`); toast.success('Supprimé'); fetch(); }
    catch { toast.error('Erreur'); }
  };

  const filtered = filtreType === 'tous' ? evenements : evenements.filter(e => e.type === filtreType);
  const getTypeInfo = (type) => TYPES.find(t => t.value === type) || TYPES[3];

  return (
    <div className="space-y-4 md:space-y-6 fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl" style={{ fontFamily: 'Outfit, sans-serif' }}>Événements</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            {evenements.length} événement(s)
          </p>
        </div>
        {isDelegue() && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
            <Plus size={15} /> <span className="hidden sm:inline">Ajouter</span>
          </button>
        )}
      </div>

      {showForm && isDelegue() && (
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Nouvel Événement</h3>
            <button onClick={() => setShowForm(false)}><X size={18} style={{ color: 'var(--c-text-muted)' }} /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input className="input text-sm" placeholder="Titre *" value={form.titre}
              onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required />
            <div className="grid grid-cols-2 gap-3">
              <select className="select text-sm" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
              <input className="input text-sm" type="datetime-local" value={form.date_evenement}
                onChange={e => setForm(f => ({ ...f, date_evenement: e.target.value }))} />
            </div>
            <textarea className="input resize-none text-sm" rows={2} placeholder="Description..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <input type="file" className="input text-sm" accept="image/*,video/*,.pdf"
              onChange={e => setMedia(e.target.files[0])} />
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary text-sm flex-1 justify-center flex items-center gap-2">
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Créer
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres scrollables */}
      <div className="tabs-scroll">
        <button onClick={() => setFiltreType('tous')} className={`tab flex-shrink-0 ${filtreType === 'tous' ? 'active' : ''}`}>
          Tous ({evenements.length})
        </button>
        {TYPES.map(t => {
          const nb = evenements.filter(e => e.type === t.value).length;
          return nb > 0 ? (
            <button key={t.value} onClick={() => setFiltreType(t.value)}
              className={`tab flex-shrink-0 ${filtreType === t.value ? 'active' : ''}`}>
              {t.emoji} {t.label} ({nb})
            </button>
          ) : null;
        })}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 card">
          <Calendar size={40} className="mx-auto mb-3 opacity-20" />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucun événement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ev => {
            const ti = getTypeInfo(ev.type);
            return (
              <div key={ev.id} className="card-hover" style={{ padding: '1rem' }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${ti.color}20` }}>
                    {ti.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--c-text)' }}>{ev.titre}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs flex-wrap" style={{ color: 'var(--c-text-muted)' }}>
                          <span>{ev.auteur_prenom} {ev.auteur_nom}</span>
                          {ev.date_evenement && (
                            <span className="flex items-center gap-1" style={{ color: ti.color }}>
                              <Clock size={10} />
                              {new Date(ev.date_evenement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                      {isDelegue() && ev.created_by === user.id && (
                        <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg flex-shrink-0"
                          style={{ color: 'var(--c-danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--c-text-muted)' }}>{ev.description}</p>
                    )}
                    {ev.media_url && ev.media_type === 'image' && (
                      <img src={ev.media_url} alt={ev.titre} className="w-full h-32 object-cover rounded-xl mt-2" />
                    )}
                    {ev.media_url && ev.media_type === 'document' && (
                      <a href={ev.media_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 mt-2 text-xs px-3 py-1.5 rounded-xl inline-flex"
                        style={{ background: 'var(--c-surface2)', color: 'var(--c-primary)' }}>
                        <FileText size={12} /> Voir le document
                      </a>
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

export default Evenements;