// src/pages/Cours.jsx — Cours & UE + Documents
import { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, BookOpen, CheckCircle, XCircle,
  Users, Upload, FileText, File, Image, Download,
  ChevronDown, ChevronUp, X, Eye, Mail, Calendar,
  GraduationCap, Award, FolderOpen, Search, Clock,
  ExternalLink,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const FILE_ICON = (type, size = 14) => {
  if (!type) return <File size={size} />;
  if (type.includes('image')) return <Image size={size} />;
  if (type.includes('pdf'))   return <FileText size={size} />;
  return <File size={size} />;
};

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getFileCategory = (type) => {
  if (!type) return 'autre';
  if (type.includes('image')) return 'image';
  if (type.includes('pdf'))   return 'pdf';
  if (type.includes('word') || type.includes('document')) return 'word';
  if (type.includes('sheet') || type.includes('excel')) return 'excel';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'ppt';
  return 'autre';
};

const FILE_COLOR = {
  image: { bg: 'rgba(6,214,160,0.12)',  color: 'var(--c-success)' },
  pdf:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  word:  { bg: 'rgba(79,142,247,0.12)',  color: 'var(--c-primary)' },
  excel: { bg: 'rgba(6,214,160,0.12)',   color: 'var(--c-success)' },
  ppt:   { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c' },
  autre: { bg: 'var(--c-surface2)',      color: 'var(--c-text-muted)' },
};

// ─────────────────────────────────────────────
// Modal: Visionneuse de fichier
// ─────────────────────────────────────────────
function FileViewerModal({ doc, onClose }) {
  const cat = getFileCategory(doc.fichier_type);
  const url = doc.fichier_url;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, []);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', zIndex: 99999 }}>

      {/* Header */}
      <div className="flex items-center gap-3 p-3 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: FILE_COLOR[cat].bg, color: FILE_COLOR[cat].color }}>
          {FILE_ICON(doc.fichier_type, 15)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: '#fff' }}>{doc.titre}</p>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {doc.fichier_nom} {doc.taille ? `· ${formatBytes(doc.taille)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={url} download target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(79,142,247,0.2)', color: 'var(--c-primary)' }}>
            <Download size={13} /> Télécharger
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            <ExternalLink size={14} />
          </a>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-2">
        {cat === 'image' ? (
          <img src={url} alt={doc.titre}
            className="max-w-full max-h-full object-contain rounded-xl"
            style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
        ) : cat === 'pdf' ? (
          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            title={doc.titre}
            className="w-full h-full rounded-xl border-0"
            style={{ maxWidth: '900px', background: '#fff' }}
          />
        ) : (
          <div className="text-center p-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: FILE_COLOR[cat].bg, color: FILE_COLOR[cat].color }}>
              {FILE_ICON(doc.fichier_type, 36)}
            </div>
            <p className="font-semibold mb-1" style={{ color: '#fff' }}>{doc.titre}</p>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Ce type de fichier ne peut pas être prévisualisé directement.
            </p>
            <a href={url} download target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--g-primary)', color: '#fff' }}>
              <Download size={15} /> Télécharger le fichier
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────
// Modal: Upload document (onglet Documents)
// ─────────────────────────────────────────────
function UploadModal({ ues, onClose, onSuccess }) {
  const [form, setForm] = useState({ titre: '', description: '', ue_id: '' });
  const [fichier, setFichier] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const allUes = [...(ues.semestre1 || []), ...(ues.semestre2 || [])];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fichier || !form.titre || !form.ue_id) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('titre', form.titre);
      fd.append('description', form.description);
      fd.append('ue_id', form.ue_id);
      fd.append('fichier', fichier);
      await api.post('/cours-documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document partagé !');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur upload');
    } finally { setUploading(false); }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', zIndex: 99999 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in w-full max-w-md"
        style={{ background: 'var(--c-surface)', borderRadius: '20px', border: '1px solid var(--c-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
        onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--c-primary)' }}>
              <Upload size={15} />
            </div>
            <h3 className="font-black text-base" style={{ color: 'var(--c-text)', fontFamily: 'Outfit, sans-serif' }}>
              Partager un document
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
              UE concernée *
            </label>
            <select className="select text-sm w-full" value={form.ue_id}
              onChange={e => setForm(f => ({ ...f, ue_id: e.target.value }))} required>
              <option value="">Choisir une UE...</option>
              {allUes.map(u => (
                <option key={u.id} value={u.id}>{u.code} — {u.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
              Titre *
            </label>
            <input className="input text-sm w-full" placeholder="Ex: Cours chapitre 3 — Algorithmes de tri"
              value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
              Description (optionnel)
            </label>
            <input className="input text-sm w-full" placeholder="Brève description du contenu..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Zone fichier */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
              Fichier *
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all"
              style={{
                borderColor: fichier ? 'var(--c-primary)' : 'var(--c-border)',
                background: fichier ? 'rgba(79,142,247,0.05)' : 'var(--c-surface2)',
              }}>
              <input type="file" ref={fileRef} className="hidden"
                onChange={e => setFichier(e.target.files[0])} />
              {fichier ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: FILE_COLOR[getFileCategory(fichier.type)].bg, color: FILE_COLOR[getFileCategory(fichier.type)].color }}>
                    {FILE_ICON(fichier.type, 15)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold truncate max-w-[200px]" style={{ color: 'var(--c-text)' }}>{fichier.name}</p>
                    <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{formatBytes(fichier.size)}</p>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setFichier(null); }}
                    className="ml-2 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={20} className="mx-auto mb-2" style={{ color: 'var(--c-text-dim)' }} />
                  <p className="text-xs font-medium" style={{ color: 'var(--c-text-muted)' }}>
                    Cliquer pour choisir un fichier
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-dim)' }}>
                    PDF, images, Word, Excel, PowerPoint...
                  </p>
                </>
              )}
            </div>
          </div>

          <button type="submit" disabled={uploading || !fichier || !form.titre || !form.ue_id}
            className="btn-primary w-full justify-center text-sm py-2.5 flex items-center gap-2">
            {uploading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Upload size={14} />}
            {uploading ? 'Envoi en cours...' : 'Partager le document'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────
// Onglet Documents — Vue globale
// ─────────────────────────────────────────────
function DocumentsTab({ user, ues, canDelete }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('tous');
  const [filterUe, setFilterUe] = useState('tous');
  const [viewerDoc, setViewerDoc] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/cours-documents/filiere/${user.filiere_id}/niveau/${user.niveau_id}`);
      setDocs(r.data.documents || []);
    } catch { toast.error('Erreur chargement des documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchDocs(); }, [user]);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce document ?')) return;
    try { await api.delete(`/cours-documents/${id}`); toast.success('Document supprimé'); fetchDocs(); }
    catch { toast.error('Erreur suppression'); }
  };

  const ueOptions = [...new Map(docs.map(d => [d.ue_id, { id: d.ue_id, nom: d.ue_nom, code: d.ue_code }])).values()];

  const filtered = docs.filter(d => {
    const matchSearch = search.trim() === '' ||
      `${d.titre} ${d.fichier_nom || ''} ${d.auteur_prenom} ${d.auteur_nom} ${d.ue_nom || ''} ${d.ue_code || ''}`
        .toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'tous' || getFileCategory(d.fichier_type) === filterType;
    const matchUe = filterUe === 'tous' || String(d.ue_id) === filterUe;
    return matchSearch && matchType && matchUe;
  });

  // Grouper par UE
  const grouped = filtered.reduce((acc, doc) => {
    const key = doc.ue_code || 'Autres';
    if (!acc[key]) acc[key] = { code: doc.ue_code, nom: doc.ue_nom, docs: [] };
    acc[key].docs.push(doc);
    return acc;
  }, {});

  const typeFilters = [
    { key: 'tous',  label: 'Tous' },
    { key: 'pdf',   label: 'PDF' },
    { key: 'image', label: 'Images' },
    { key: 'word',  label: 'Word' },
    { key: 'excel', label: 'Excel' },
    { key: 'autre', label: 'Autres' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
          <input className="input pl-9 text-sm w-full" placeholder="Rechercher un document, auteur, UE..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select text-sm" value={filterUe} onChange={e => setFilterUe(e.target.value)}
          style={{ minWidth: '140px' }}>
          <option value="tous">Toutes les UE</option>
          {ueOptions.map(u => <option key={u.id} value={String(u.id)}>{u.code}</option>)}
        </select>
        <button onClick={() => setShowUpload(true)}
          className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2 flex-shrink-0">
          <Upload size={14} />
          <span className="hidden sm:inline">Partager un fichier</span>
          <span className="sm:hidden">Partager</span>
        </button>
      </div>

      {/* Filtres type */}
      <div className="tabs-scroll">
        {typeFilters.map(f => (
          <button key={f.key} onClick={() => setFilterType(f.key)}
            className={`tab flex-shrink-0 text-xs ${filterType === f.key ? 'active' : ''}`}>
            {f.label}
            {f.key !== 'tous' && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-md"
                style={{ background: 'var(--c-surface2)', fontSize: 10 }}>
                {docs.filter(d => getFileCategory(d.fichier_type) === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <FolderOpen size={44} className="mx-auto mb-3" style={{ color: 'var(--c-text-dim)' }} />
          <p className="font-semibold" style={{ color: 'var(--c-text-muted)' }}>
            {search || filterType !== 'tous' || filterUe !== 'tous'
              ? 'Aucun document ne correspond à vos filtres'
              : "Aucun document partagé pour l'instant"}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--c-text-dim)' }}>
            Soyez le premier à partager un cours !
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.values(grouped).map(group => (
            <div key={group.code}>
              {/* En-tête groupe UE */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(79,142,247,0.12)', color: 'var(--c-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {group.code}
                </span>
                <span className="text-xs font-semibold truncate" style={{ color: 'var(--c-text-muted)' }}>{group.nom}</span>
                <span className="text-xs ml-auto flex-shrink-0" style={{ color: 'var(--c-text-dim)' }}>
                  {group.docs.length} fichier{group.docs.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Liste documents */}
              <div className="space-y-2">
                {group.docs.map(doc => {
                  const cat = getFileCategory(doc.fichier_type);
                  const fc = FILE_COLOR[cat];
                  const canView = cat === 'pdf' || cat === 'image';
                  return (
                    <div key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                      style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
                      {/* Icône type */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: fc.bg, color: fc.color }}>
                        {FILE_ICON(doc.fichier_type, 18)}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
                          {doc.titre}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
                            {doc.auteur_prenom} {doc.auteur_nom}
                          </span>
                          {doc.taille && (
                            <span className="text-xs" style={{ color: 'var(--c-text-dim)' }}>
                              · {formatBytes(doc.taille)}
                            </span>
                          )}
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--c-text-dim)' }}>
                            <Clock size={10} />
                            {formatDate(doc.created_at)}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-text-dim)' }}>
                            {doc.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {canView && (
                          <button onClick={() => setViewerDoc(doc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                            style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--c-primary)' }}
                            title="Lire dans l'application">
                            <Eye size={13} />
                            <span className="hidden sm:inline">Lire</span>
                          </button>
                        )}
                        <a href={doc.fichier_url} download target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}
                          title="Télécharger">
                          <Download size={14} />
                        </a>
                        {(doc.created_by === user.id || canDelete) && (
                          <button onClick={() => handleDelete(doc.id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ color: 'var(--c-danger)', background: 'var(--c-danger-glow)' }}
                            title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && docs.length > 0 && (
        <p className="text-xs text-center pt-2" style={{ color: 'var(--c-text-dim)' }}>
          {filtered.length} / {docs.length} document{docs.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
        </p>
      )}

      {viewerDoc && <FileViewerModal doc={viewerDoc} onClose={() => setViewerDoc(null)} />}
      {showUpload && <UploadModal ues={ues} onClose={() => setShowUpload(false)} onSuccess={fetchDocs} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal: Étudiants inscrits à une UE
// ─────────────────────────────────────────────
function EtudiantsUEModal({ ue, onClose }) {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    api.get(`/ues/${ue.id}/etudiants`)
      .then(r => setEtudiants(r.data.etudiants || []))
      .catch(() => toast.error('Erreur chargement des inscrits'))
      .finally(() => setLoading(false));
  }, [ue.id]);

  const filtered = etudiants.filter(e =>
    `${e.nom} ${e.prenom} ${e.matricule || ''} ${e.email || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const nbDelegues  = etudiants.filter(e => e.rang === 'delegue').length;
  const nbEtudiants = etudiants.filter(e => e.rang === 'etudiant').length;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', zIndex: 99999 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in flex flex-col w-full max-w-lg"
        style={{ background: 'var(--c-surface)', borderRadius: '20px', border: '1px solid var(--c-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', maxHeight: '90dvh' }}
        onMouseDown={e => e.stopPropagation()}>

        <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-lg font-bold"
                  style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--c-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {ue.code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-lg"
                  style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
                  Sem. {ue.semestre}
                </span>
              </div>
              <h3 className="font-black text-base mt-1"
                style={{ color: 'var(--c-text)', fontFamily: 'Outfit, sans-serif', wordBreak: 'break-word' }}>
                {ue.nom}
              </h3>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total',     value: etudiants.length, color: 'var(--c-primary)', icon: Users        },
              { label: 'Étudiants',value: nbEtudiants,       color: 'var(--c-text)',    icon: GraduationCap },
              { label: 'Délégués', value: nbDelegues,        color: 'var(--c-delegue)', icon: Award        },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="text-center p-2 rounded-xl" style={{ background: 'var(--c-surface2)' }}>
                <Icon size={14} className="mx-auto mb-1" style={{ color }} />
                <p className="text-lg font-black leading-none" style={{ color, fontFamily: 'Outfit, sans-serif' }}>
                  {loading ? '…' : value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {!loading && etudiants.length > 4 && (
            <div className="mt-3">
              <input className="input text-xs" placeholder="Filtrer par nom, matricule, email..."
                value={search} onChange={e => setSearch(e.target.value)} style={{ height: '38px' }} />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Users size={36} className="mx-auto mb-2" style={{ color: 'var(--c-text-dim)' }} />
              <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>
                {search ? 'Aucun résultat' : 'Aucun étudiant inscrit à cette UE'}
              </p>
            </div>
          ) : (
            filtered.map((etudiant, idx) => (
              <div key={etudiant.id} className="p-3 rounded-xl border"
                style={{ background: idx % 2 === 0 ? 'var(--c-surface2)' : 'transparent', borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: etudiant.rang === 'delegue' ? 'rgba(168,85,247,0.15)' : 'rgba(79,142,247,0.15)',
                      color: etudiant.rang === 'delegue' ? 'var(--c-delegue)' : 'var(--c-primary)',
                      fontFamily: 'Outfit, sans-serif',
                    }}>
                    {etudiant.prenom?.[0]}{etudiant.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: 'var(--c-text)', wordBreak: 'break-word' }}>
                        {etudiant.prenom} {etudiant.nom}
                      </span>
                      {etudiant.rang === 'delegue' && <span>🏛️</span>}
                      <span className={`badge text-[9px] flex-shrink-0 ${etudiant.rang === 'delegue' ? 'badge-delegue' : 'badge-etudiant'}`}>
                        {etudiant.rang}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {etudiant.matricule && (
                        <span className="text-xs" style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {etudiant.matricule}
                        </span>
                      )}
                      {etudiant.niveau_code && (
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--c-primary)', fontSize: 10 }}>
                          {etudiant.niveau_code}
                        </span>
                      )}
                    </div>
                    {etudiant.email && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{etudiant.email}</p>
                    )}
                    {etudiant.date_naissance && (
                      <p className="text-xs" style={{ color: 'var(--c-text-dim)' }}>
                        {new Date(etudiant.date_naissance).toLocaleDateString('fr-FR')}
                        {etudiant.lieu_naissance && ` · ${etudiant.lieu_naissance}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {etudiant.email && (
                      <a href={`mailto:${etudiant.email}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--c-primary)' }}>
                        <Mail size={13} />
                      </a>
                    )}
                    {etudiant.date_naissance && (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        title={`Né(e) le ${new Date(etudiant.date_naissance).toLocaleDateString('fr-FR')}`}
                        style={{ background: 'var(--c-surface3)', color: 'var(--c-text-muted)' }}>
                        <Calendar size={13} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: 'var(--c-border)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--c-text-dim)' }}>
            {filtered.length !== etudiants.length
              ? `${filtered.length} / ${etudiants.length} affichés`
              : `${etudiants.length} inscrit(s) au total`}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────
// Section documents inline (accordéon UE)
// ─────────────────────────────────────────────
function DocumentsSection({ ue, user, canDelete }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ titre: '' });
  const [fichier, setFichier] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);

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
      setShowUpload(false); setForm({ titre: '' }); setFichier(null);
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur upload');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/cours-documents/${id}`); fetchDocs(); }
    catch { toast.error('Erreur'); }
  };

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--c-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-muted)' }}>
          📁 Documents ({docs.length})
        </span>
        <button onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium"
          style={{ background: 'rgba(79,142,247,0.12)', color: 'var(--c-primary)' }}>
          <Upload size={11} /> Partager
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload}
          className="mb-2 p-3 rounded-xl border fade-in space-y-2"
          style={{ background: 'var(--c-surface2)', borderColor: 'var(--c-border)' }}>
          <div className="flex gap-2">
            <input className="input text-xs flex-1" placeholder="Titre *"
              value={form.titre} onChange={e => setForm({ titre: e.target.value })} required />
            <button type="button" onClick={() => setShowUpload(false)}
              className="p-2 rounded-lg flex-shrink-0" style={{ color: 'var(--c-text-muted)' }}>
              <X size={14} />
            </button>
          </div>
          <input type="file" className="input text-xs" onChange={e => setFichier(e.target.files[0])} required />
          <button type="submit" disabled={uploading || !fichier || !form.titre}
            className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 w-full justify-center">
            {uploading ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={12} />}
            {uploading ? 'Upload...' : 'Partager'}
          </button>
        </form>
      )}

      {loading ? <div className="shimmer h-10 rounded-xl" />
      : docs.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: 'var(--c-text-dim)' }}>
          Aucun document — Soyez le premier !
        </p>
      ) : (
        <div className="space-y-1.5">
          {docs.map(doc => {
            const cat = getFileCategory(doc.fichier_type);
            const fc = FILE_COLOR[cat];
            const canView = cat === 'pdf' || cat === 'image';
            return (
              <div key={doc.id} className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: 'var(--c-surface2)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: fc.bg, color: fc.color }}>
                  {FILE_ICON(doc.fichier_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--c-text)' }}>{doc.titre}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--c-text-muted)' }}>
                    {doc.auteur_prenom} {doc.auteur_nom}
                    {doc.taille ? ` · ${formatBytes(doc.taille)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canView && (
                    <button onClick={() => setViewerDoc(doc)}
                      className="p-1.5 rounded-lg"
                      style={{ color: 'var(--c-primary)', background: 'rgba(79,142,247,0.1)' }}
                      title="Lire">
                      <Eye size={13} />
                    </button>
                  )}
                  <a href={doc.fichier_url} target="_blank" rel="noopener noreferrer" download
                    className="p-1.5 rounded-lg"
                    style={{ color: 'var(--c-primary)', background: 'rgba(79,142,247,0.1)' }}>
                    <Download size={13} />
                  </a>
                  {(doc.created_by === user.id || canDelete) && (
                    <button onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg"
                      style={{ color: 'var(--c-danger)', background: 'var(--c-danger-glow)' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {viewerDoc && <FileViewerModal doc={viewerDoc} onClose={() => setViewerDoc(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────
export default function Cours() {
  const { user, isDelegue, isProf } = useAuth();
  const [ues, setUes] = useState({ semestre1: [], semestre2: [] });
  const [loading, setLoading] = useState(true);
  const [semestre, setSemestre] = useState(1);
  const [activeTab, setActiveTab] = useState('ue'); // 'ue' | 'documents'
  const [showForm, setShowForm] = useState(false);
  const [expandedUes, setExpandedUes] = useState({});
  const [selectedUeForInscrits, setSelectedUeForInscrits] = useState(null);
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
    try { await api.post(`/ues/${ueId}/assigner-prof`); toast.success('Assigné !'); fetchUes(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette UE et tous ses documents ?')) return;
    try { await api.delete(`/ues/${id}`); toast.success('UE supprimée'); fetchUes(); }
    catch { toast.error('Erreur'); }
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
  const canDelete   = isDelegue() || isProf();

  return (
    <div className="space-y-4 md:space-y-6 fade-in">

      {/* En-tête */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl gradient-text">Cours & UE</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            {ues.semestre1.length + ues.semestre2.length} unités · Partagez des documents
          </p>
        </div>
        {isDelegue() && activeTab === 'ue' && (
          <button onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
            <Plus size={15} />
            <span className="hidden sm:inline">Ajouter UE</span>
            <span className="sm:hidden">UE</span>
          </button>
        )}
      </div>

      {/* Onglets principaux */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--c-surface2)' }}>
        {[
          { key: 'ue',        label: 'Cours & UE',  icon: BookOpen   },
          { key: 'documents', label: 'Documents',   icon: FolderOpen },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeTab === key ? 'var(--c-surface)' : 'transparent',
              color: activeTab === key ? 'var(--c-text)' : 'var(--c-text-muted)',
              boxShadow: activeTab === key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Onglet Documents ── */}
      {activeTab === 'documents' && (
        <DocumentsTab user={user} ues={ues} canDelete={canDelete} />
      )}

      {/* ── Onglet UE ── */}
      {activeTab === 'ue' && (
        <>
          {showForm && isDelegue() && (
            <div className="card fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm md:text-base">Nouvelle UE</h3>
                <button onClick={() => setShowForm(false)}>
                  <X size={18} style={{ color: 'var(--c-text-muted)' }} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Code UE *</label>
                    <input className="input text-sm" placeholder="INF301" value={form.code}
                      onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Semestre *</label>
                    <select className="select text-sm" value={form.semestre}
                      onChange={e => setForm(f => ({ ...f, semestre: parseInt(e.target.value) }))}>
                      <option value={1}>Semestre 1</option>
                      <option value={2}>Semestre 2</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Nom de l'UE *</label>
                  <input className="input text-sm" placeholder="Algorithmique avancée" value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Description</label>
                    <input className="input text-sm" placeholder="Description..."
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Crédits</label>
                    <input className="input text-sm" type="number" min={1} max={10} value={form.credits}
                      onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm flex-1 justify-center">Créer l'UE</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">Annuler</button>
                </div>
              </form>
            </div>
          )}

          <div className="tabs-scroll">
            {[1, 2].map(s => (
              <button key={s} onClick={() => setSemestre(s)}
                className={`tab flex-shrink-0 ${semestre === s ? 'active' : ''}`}>
                Semestre {s}
                <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-xs" style={{ background: 'var(--c-surface2)' }}>
                  {s === 1 ? ues.semestre1.length : ues.semestre2.length}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}
            </div>
          ) : currentUes.length === 0 ? (
            <div className="text-center py-12 card">
              <BookOpen size={40} className="mx-auto mb-3" style={{ color: 'var(--c-text-dim)' }} />
              <p style={{ color: 'var(--c-text-muted)' }}>Aucune UE pour le semestre {semestre}</p>
            </div>
          ) : (
            <div className="space-y-3 stagger">
              {currentUes.map(ue => (
                <div key={ue.id} className="card-hover" style={{ padding: '1rem' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold leading-tight text-center"
                      style={{ background: 'rgba(79,142,247,0.12)', color: 'var(--c-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {ue.code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm truncate" style={{ color: 'var(--c-text)' }}>{ue.nom}</h3>
                            <span className="text-xs px-1.5 py-0.5 rounded-lg flex-shrink-0"
                              style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
                              {ue.credits} cr.
                            </span>
                            {ue.est_inscrit && (
                              <span className="text-xs px-1.5 py-0.5 rounded-lg flex-shrink-0"
                                style={{ background: 'var(--c-success-glow)', color: 'var(--c-success)' }}>✓</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--c-text-muted)' }}>
                            <button onClick={() => setSelectedUeForInscrits(ue)}
                              className="flex items-center gap-1 transition-colors"
                              style={{ color: parseInt(ue.nb_inscrits) > 0 ? 'var(--c-primary)' : 'var(--c-text-muted)' }}
                              title="Voir les étudiants inscrits">
                              <Users size={10} />
                              <span className="font-semibold">{ue.nb_inscrits}</span>
                              <span className="underline underline-offset-2 hidden sm:inline">inscrit(s)</span>
                            </button>
                            {ue.professeurs?.length > 0 && (
                              <span className="truncate">👨‍🏫 {ue.professeurs.map(p => p.prenom).join(', ')}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => setSelectedUeForInscrits(ue)}
                            className="p-2 rounded-xl"
                            style={{ background: 'rgba(79,142,247,0.08)', color: 'var(--c-primary)' }}
                            title="Voir les inscrits">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => toggleExpand(ue.id)}
                            className="p-2 rounded-xl"
                            style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
                            {expandedUes[ue.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {!isProf() && (
                            <button onClick={() => handleInscrire(ue.id, ue.est_inscrit)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                              style={{
                                background: ue.est_inscrit ? 'var(--c-success-glow)' : 'rgba(79,142,247,0.12)',
                                color:      ue.est_inscrit ? 'var(--c-success)'       : 'var(--c-primary)',
                              }}>
                              {ue.est_inscrit ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              <span className="hidden sm:inline">{ue.est_inscrit ? 'Inscrit' : "S'inscrire"}</span>
                            </button>
                          )}
                          {isProf() && (
                            <button onClick={() => handleAssignerProf(ue.id)}
                              className="btn-outline text-xs px-2.5 py-1.5 flex items-center gap-1">
                              <BookOpen size={11} />
                              <span className="hidden sm:inline">Enseigner</span>
                            </button>
                          )}
                          {isDelegue() && (
                            <button onClick={() => handleDelete(ue.id)}
                              className="p-2 rounded-xl" style={{ color: 'var(--c-danger)' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {expandedUes[ue.id] && <DocumentsSection ue={ue} user={user} canDelete={canDelete} />}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedUeForInscrits && (
        <EtudiantsUEModal
          ue={selectedUeForInscrits}
          onClose={() => setSelectedUeForInscrits(null)}
        />
      )}
    </div>
  );
}