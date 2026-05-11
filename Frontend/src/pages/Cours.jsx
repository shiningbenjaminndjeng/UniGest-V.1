// src/pages/Cours.jsx — Cours + Documents de cours pour tous
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, BookOpen, CheckCircle, XCircle,
  Users, Upload, FileText, File, Image, Download,
  ChevronDown, ChevronUp, X
} from 'lucide-react';

const SEMESTRES = [1, 2];

const FILE_ICON = (type) => {
  if (!type) return <File size={14} />;
  if (type.includes('image')) return <Image size={14} />;
  if (type.includes('pdf')) return <FileText size={14} />;
  return <File size={14} />;
};

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

function DocumentsSection({ ue, user, canDelete }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ titre: '' });
  const [fichier, setFichier] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = async () => {
    try {
      const r = await api.get(`/cours-documents/ue/${ue.id}`);
      setDocs(r.data.documents || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, [ue.id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fichier || !form.titre) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('titre', form.titre);
      fd.append('ue_id', ue.id);
      fd.append('fichier', fichier);
      await api.post('/cours-documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document partagé !');
      setShowUpload(false);
      setForm({ titre: '' });
      setFichier(null);
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur upload');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/cours-documents/${id}`);
      toast.success('Supprimé');
      fetchDocs();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--c-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-muted)' }}>
          📁 Documents ({docs.length})
        </span>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
          style={{ background: 'rgba(79,142,247,0.12)', color: 'var(--c-primary)' }}
        >
          <Upload size={12} /> Partager
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="mb-3 p-3 rounded-xl border fade-in"
          style={{ background: 'var(--c-surface2)', borderColor: 'var(--c-border)' }}>
          <div className="flex gap-2 mb-2">
            <input className="input text-xs flex-1" placeholder="Titre du document *"
              value={form.titre} onChange={e => setForm({ titre: e.target.value })} required />
            <button type="button" onClick={() => setShowUpload(false)} className="p-2 rounded-lg"
              style={{ color: 'var(--c-text-muted)' }}><X size={14} /></button>
          </div>
          <input type="file" className="input text-xs mb-2"
            onChange={e => setFichier(e.target.files[0])} required />
          <button type="submit" disabled={uploading || !fichier || !form.titre}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
            {uploading
              ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              : <Upload size={12} />}
            {uploading ? 'Upload...' : 'Partager'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="shimmer h-12 rounded-xl" />
      ) : docs.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: 'var(--c-text-dim)' }}>
          Aucun document partagé — Soyez le premier !
        </p>
      ) : (
        <div className="space-y-1.5">
          {docs.map(doc => (
            <div key={doc.id}
              className="flex items-center gap-3 p-2.5 rounded-xl group transition-all"
              style={{ background: 'var(--c-surface2)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--c-primary)' }}>
                {FILE_ICON(doc.fichier_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--c-text)' }}>{doc.titre}</p>
                <p className="text-xs truncate" style={{ color: 'var(--c-text-muted)' }}>
                  {doc.auteur_prenom} {doc.auteur_nom}
                  {doc.taille ? ` · ${formatBytes(doc.taille)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={doc.fichier_url} target="_blank" rel="noopener noreferrer" download
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--c-primary)', background: 'rgba(79,142,247,0.1)' }}>
                  <Download size={13} />
                </a>
                {(doc.created_by === user.id || canDelete) && (
                  <button onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: 'var(--c-danger)', background: 'var(--c-danger-glow)' }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Cours() {
  const { user, isDelegue, isProf } = useAuth();
  const [ues, setUes] = useState({ semestre1: [], semestre2: [] });
  const [loading, setLoading] = useState(true);
  const [semestre, setSemestre] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [expandedUes, setExpandedUes] = useState({});
  const [form, setForm] = useState({ code: '', nom: '', description: '', credits: 3, semestre: 1 });

  const fetchUes = async () => {
    try {
      const r = await api.get(`/ues/filiere/${user.filiere_id}/niveau/${user.niveau_id}`);
      setUes({ semestre1: r.data.semestre1 || [], semestre2: r.data.semestre2 || [] });
    } catch { toast.error('Erreur chargement UE'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchUes(); }, [user]);

  const toggleExpand = (id) => setExpandedUes(p => ({ ...p, [id]: !p[id] }));

  const handleInscrire = async (ueId, estInscrit) => {
    try {
      if (estInscrit) {
        await api.delete(`/ues/${ueId}/desinscrire`);
        toast.success('Désinscription réussie');
      } else {
        await api.post(`/ues/${ueId}/inscrire`);
        toast.success('Inscrit !');
      }
      fetchUes();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleAssignerProf = async (ueId) => {
    try {
      await api.post(`/ues/${ueId}/assigner-prof`);
      toast.success('Assigné à cette UE !');
      fetchUes();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette UE et tous ses documents ?')) return;
    try {
      await api.delete(`/ues/${id}`);
      toast.success('UE supprimée');
      fetchUes();
    } catch { toast.error('Erreur'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ues', { ...form, filiere_id: user.filiere_id, niveau_id: user.niveau_id });
      toast.success('UE créée !');
      setShowForm(false);
      setForm({ code: '', nom: '', description: '', credits: 3, semestre: 1 });
      fetchUes();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const currentUes = semestre === 1 ? ues.semestre1 : ues.semestre2;
  const canDelete = isDelegue() || isProf();

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl gradient-text">Cours & UE</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            {(ues.semestre1.length + ues.semestre2.length)} unités · Partagez des documents avec votre promo
          </p>
        </div>
        {isDelegue() && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Ajouter UE
          </button>
        )}
      </div>

      {/* Formulaire création UE */}
      {showForm && isDelegue() && (
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Nouvelle Unité d'Enseignement</h3>
            <button onClick={() => setShowForm(false)}><X size={18} style={{ color: 'var(--c-text-muted)' }} /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--c-text-muted)' }}>Code UE *</label>
                <input className="input" placeholder="INF301" value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--c-text-muted)' }}>Semestre *</label>
                <select className="select" value={form.semestre}
                  onChange={e => setForm(f => ({ ...f, semestre: parseInt(e.target.value) }))}>
                  <option value={1}>Semestre 1</option>
                  <option value={2}>Semestre 2</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--c-text-muted)' }}>Nom de l'UE *</label>
              <input className="input" placeholder="Algorithmique avancée" value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--c-text-muted)' }}>Description</label>
                <input className="input" placeholder="Description..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--c-text-muted)' }}>Crédits</label>
                <input className="input" type="number" min={1} max={10} value={form.credits}
                  onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Créer l'UE</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Onglets semestres */}
      <div className="flex gap-2 items-center">
        {SEMESTRES.map(s => (
          <button key={s} onClick={() => setSemestre(s)} className={`tab ${semestre === s ? 'active' : ''}`}>
            Semestre {s}
            <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-xs"
              style={{ background: 'var(--c-surface2)' }}>
              {s === 1 ? ues.semestre1.length : ues.semestre2.length}
            </span>
          </button>
        ))}
      </div>

      {/* Liste des UE */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}
        </div>
      ) : currentUes.length === 0 ? (
        <div className="text-center py-16 card">
          <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--c-text-dim)' }} />
          <p className="font-semibold" style={{ color: 'var(--c-text-muted)' }}>Aucune UE pour le semestre {semestre}</p>
          {isDelegue() && <p className="text-sm mt-2" style={{ color: 'var(--c-text-dim)' }}>Ajoutez les UE de votre promotion</p>}
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {currentUes.map(ue => (
            <div key={ue.id} className="card-hover" style={{ padding: '1.25rem' }}>
              <div className="flex items-start gap-4">
                {/* Code badge */}
                <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-xs font-bold leading-tight text-center"
                  style={{ background: 'rgba(79,142,247,0.12)', color: 'var(--c-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {ue.code}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold" style={{ color: 'var(--c-text)' }}>{ue.nom}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                      style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
                      {ue.credits} cr.
                    </span>
                    {ue.est_inscrit && (
                      <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                        style={{ background: 'var(--c-success-glow)', color: 'var(--c-success)' }}>
                        ✓ Inscrit
                      </span>
                    )}
                  </div>
                  {ue.description && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{ue.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1.5 text-xs" style={{ color: 'var(--c-text-muted)' }}>
                    <span className="flex items-center gap-1"><Users size={11} /> {ue.nb_inscrits} inscrit(s)</span>
                    {ue.professeurs?.length > 0 && (
                      <span>👨‍🏫 {ue.professeurs.map(p => `${p.prenom} ${p.nom}`).join(', ')}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleExpand(ue.id)}
                    className="p-2 rounded-xl transition-all"
                    style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
                    {expandedUes[ue.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {!isProf() && (
                    <button onClick={() => handleInscrire(ue.id, ue.est_inscrit)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: ue.est_inscrit ? 'var(--c-success-glow)' : 'rgba(79,142,247,0.12)',
                        color: ue.est_inscrit ? 'var(--c-success)' : 'var(--c-primary)'
                      }}>
                      {ue.est_inscrit ? <><CheckCircle size={13} /> Inscrit</> : <><XCircle size={13} /> S'inscrire</>}
                    </button>
                  )}

                  {isProf() && (
                    <button onClick={() => handleAssignerProf(ue.id)} className="btn-outline text-xs flex items-center gap-1.5 py-2">
                      <BookOpen size={13} /> Enseigner
                    </button>
                  )}

                  {isDelegue() && (
                    <button onClick={() => handleDelete(ue.id)}
                      className="p-2 rounded-xl transition-all"
                      style={{ color: 'var(--c-danger)', background: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--c-danger-glow)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Section Documents (expansible) */}
              {expandedUes[ue.id] && (
                <DocumentsSection ue={ue} user={user} canDelete={canDelete} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}