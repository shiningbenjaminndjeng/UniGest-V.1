// src/pages/Competences.jsx — Fiche de compétences personnelle
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Star, Plus, Trash2, Upload, Link, Phone,
  Github, Linkedin, Globe, CheckCircle, X,
  Edit3, Save, Eye, EyeOff, Award, Zap, BookOpen, Code
} from 'lucide-react';

const SKILL_TYPES = [
  { value: 'technique', label: 'Technique', icon: Code, color: 'var(--c-primary)', bg: 'rgba(79,142,247,0.1)', tag: 'skill-tag-tech' },
  { value: 'pratique', label: 'Pratique', icon: Zap, color: 'var(--c-prof)', bg: 'rgba(6,214,160,0.1)', tag: 'skill-tag-pratique' },
  { value: 'specialisation', label: 'Spécialisation', icon: Star, color: 'var(--c-delegue)', bg: 'rgba(168,85,247,0.1)', tag: 'skill-tag-spec' },
  { value: 'certification', label: 'Certification', icon: Award, color: 'var(--c-warning)', bg: 'rgba(251,191,36,0.1)', tag: 'skill-tag-cert' },
  { value: 'etudes', label: 'Études', icon: BookOpen, color: 'var(--c-accent)', bg: 'rgba(249,115,22,0.1)', tag: 'skill-tag-etudes' },
];

const NIVEAUX_MAITRISE = ['debutant', 'intermediaire', 'avance', 'expert'];

const StarRating = ({ value = 0, max = 5, onChange = null, size = 20 }) => (
  <div className="flex gap-1">
    {Array.from({ length: max }, (_, i) => i + 1).map(i => (
      <span key={i} className={`star ${i <= value ? 'filled' : ''}`}
        style={{ fontSize: size }}
        onClick={() => onChange?.(i)}>★</span>
    ))}
  </div>
);

export default function Competences() {
  const { user } = useAuth();
  const [comp, setComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('profil');
  const [form, setForm] = useState({
    titre: '', bio: '', telephone: '', email_contact: '',
    linkedin: '', github: '', portfolio: '', disponible: true
  });
  const [banniere, setBanniere] = useState(null);
  const [newSkill, setNewSkill] = useState({ type: 'technique', libelle: '', niveau_maitrise: 'intermediaire' });
  const [newFichier, setNewFichier] = useState({ titre: '', file: null });
  const [saving, setSaving] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [addingFile, setAddingFile] = useState(false);

  const fetchComp = async () => {
    try {
      const r = await api.get('/competences/me');
      if (r.data.competence) {
        setComp(r.data.competence);
        setForm({
          titre: r.data.competence.titre || '',
          bio: r.data.competence.bio || '',
          telephone: r.data.competence.telephone || '',
          email_contact: r.data.competence.email_contact || '',
          linkedin: r.data.competence.linkedin || '',
          github: r.data.competence.github || '',
          portfolio: r.data.competence.portfolio || '',
          disponible: r.data.competence.disponible ?? true,
        });
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComp(); }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (banniere) fd.append('banniere', banniere);
      await api.post('/competences', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Profil mis à jour !');
      setEditing(false);
      fetchComp();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.libelle.trim()) return;
    setAddingSkill(true);
    try {
      await api.post('/competences/items', newSkill);
      toast.success('Compétence ajoutée !');
      setNewSkill({ type: 'technique', libelle: '', niveau_maitrise: 'intermediaire' });
      fetchComp();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setAddingSkill(false); }
  };

  const handleDeleteSkill = async (id) => {
    try {
      await api.delete(`/competences/items/${id}`);
      fetchComp();
    } catch { toast.error('Erreur'); }
  };

  const handleAddFichier = async (e) => {
    e.preventDefault();
    if (!newFichier.file) return;
    setAddingFile(true);
    try {
      const fd = new FormData();
      fd.append('titre', newFichier.titre || newFichier.file.name);
      fd.append('fichier', newFichier.file);
      await api.post('/competences/fichiers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Fichier ajouté !');
      setNewFichier({ titre: '', file: null });
      fetchComp();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setAddingFile(false); }
  };

  const handleDeleteFichier = async (id) => {
    try {
      await api.delete(`/competences/fichiers/${id}`);
      fetchComp();
    } catch { toast.error('Erreur'); }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="shimmer h-40 rounded-2xl" />
      <div className="shimmer h-20 rounded-2xl" />
    </div>
  );

  const itemsByType = (type) => comp?.items?.filter(i => i.type === type) || [];

  return (
    <div className="space-y-5 fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl gradient-text">Mes Compétences</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            Votre vitrine de compétences visible par vos camarades
          </p>
        </div>
        {comp && !editing && (
          <button onClick={() => setEditing(true)} className="btn-outline flex items-center gap-2">
            <Edit3 size={15} /> Modifier
          </button>
        )}
      </div>

      {/* Si pas de fiche encore */}
      {!comp && !editing && (
        <div className="card text-center py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center float"
            style={{ background: 'var(--g-primary)' }}>
            <Star size={36} color="white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Créez votre fiche de compétences</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--c-text-muted)' }}>
            Showcasez vos talents, spécialisations et partagez vos contacts
          </p>
          <button onClick={() => setEditing(true)} className="btn-primary mx-auto">
            Créer ma fiche
          </button>
        </div>
      )}

      {/* Formulaire profil */}
      {editing && (
        <form onSubmit={handleSaveProfile} className="card fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">
              {comp ? 'Modifier mon profil' : 'Créer mon profil'}
            </h3>
            <button type="button" onClick={() => setEditing(false)}>
              <X size={18} style={{ color: 'var(--c-text-muted)' }} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--c-text-muted)' }}>Titre / Domaine</label>
              <input className="input" placeholder="Ex: Développeur Full-Stack · Informatique L3" value={form.titre}
                onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--c-text-muted)' }}>Bio</label>
              <textarea className="input resize-none" rows={4}
                placeholder="Présentez-vous, vos aspirations, vos projets..."
                value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--c-text-muted)' }}>
                Bannière de profil (image)
              </label>
              <input type="file" accept="image/*" className="input text-sm"
                onChange={e => setBanniere(e.target.files[0])} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--c-text-muted)' }}>Téléphone</label>
                <input className="input" placeholder="+237 6XX XXX XXX" value={form.telephone}
                  onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--c-text-muted)' }}>Email de contact</label>
                <input className="input" type="email" placeholder="votre@email.com" value={form.email_contact}
                  onChange={e => setForm(f => ({ ...f, email_contact: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--c-text-muted)' }}>LinkedIn</label>
                <input className="input" placeholder="linkedin.com/in/..." value={form.linkedin}
                  onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--c-text-muted)' }}>GitHub</label>
                <input className="input" placeholder="github.com/..." value={form.github}
                  onChange={e => setForm(f => ({ ...f, github: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--c-text-muted)' }}>Portfolio / Site</label>
                <input className="input" placeholder="monsite.com" value={form.portfolio}
                  onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, disponible: !f.disponible }))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: form.disponible ? 'var(--c-success-glow)' : 'var(--c-surface2)',
                    color: form.disponible ? 'var(--c-success)' : 'var(--c-text-muted)',
                    border: `1px solid ${form.disponible ? 'rgba(16,217,123,0.3)' : 'var(--c-border)'}`
                  }}>
                  {form.disponible ? <CheckCircle size={15} /> : <EyeOff size={15} />}
                  {form.disponible ? 'Disponible' : 'Non dispo.'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <Save size={15} /> Enregistrer
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-outline">Annuler</button>
            </div>
          </div>
        </form>
      )}

      {/* Profil affiché */}
      {comp && !editing && (
        <>
          {/* Bannière + Avatar */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Bannière */}
            <div className="profile-banner" style={{
              background: comp.banniere_url ? `url(${comp.banniere_url}) center/cover` : 'var(--g-primary)'
            }}>
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
              {comp.disponible && (
                <span className="absolute top-3 right-3 flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(16,217,123,0.9)', color: 'white' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Disponible
                </span>
              )}
            </div>

            {/* Info principale */}
            <div className="p-6 pt-0">
              <div className="flex items-end gap-4 -mt-8 mb-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black border-4 relative z-10"
                  style={{
                    background: 'var(--g-primary)', color: 'white',
                    borderColor: 'var(--c-surface)', fontFamily: 'Outfit, sans-serif'
                  }}>
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div className="flex-1 pb-1">
                  <h2 className="text-xl font-black" style={{ color: 'var(--c-text)', fontFamily: 'Outfit, sans-serif' }}>
                    {user?.prenom} {user?.nom}
                  </h2>
                  {comp.titre && (
                    <p className="text-sm font-medium" style={{ color: 'var(--c-text-muted)' }}>{comp.titre}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 pb-1">
                  <StarRating value={Math.round(comp.note_moyenne || 0)} />
                  <span className="text-sm font-bold ml-1" style={{ color: 'var(--c-warning)' }}>
                    {Number(comp.note_moyenne || 0).toFixed(1)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>({comp.nb_votes} votes)</span>
                </div>
              </div>

              {comp.bio && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--c-text-muted)' }}>{comp.bio}</p>
              )}

              {/* Contacts */}
              <div className="flex flex-wrap gap-2">
                {comp.telephone && (
                  <a href={`tel:${comp.telephone}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}>
                    <Phone size={12} style={{ color: 'var(--c-primary)' }} /> {comp.telephone}
                  </a>
                )}
                {comp.email_contact && (
                  <a href={`mailto:${comp.email_contact}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}>
                    <Link size={12} style={{ color: 'var(--c-primary)' }} /> {comp.email_contact}
                  </a>
                )}
                {comp.linkedin && (
                  <a href={comp.linkedin.startsWith('http') ? comp.linkedin : `https://${comp.linkedin}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(10,102,194,0.15)', color: '#0a66c2' }}>
                    <Linkedin size={12} /> LinkedIn
                  </a>
                )}
                {comp.github && (
                  <a href={comp.github.startsWith('http') ? comp.github : `https://${comp.github}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}>
                    <Github size={12} /> GitHub
                  </a>
                )}
                {comp.portfolio && (
                  <a href={comp.portfolio.startsWith('http') ? comp.portfolio : `https://${comp.portfolio}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}>
                    <Globe size={12} /> Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {['profil', 'competences', 'fichiers'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`tab capitalize ${tab === t ? 'active' : ''}`}>
                {t === 'profil' ? '👤 Profil' : t === 'competences' ? '⚡ Compétences' : '📁 Fichiers'}
              </button>
            ))}
          </div>

          {/* Tab: Compétences */}
          {tab === 'competences' && (
            <div className="space-y-4 fade-in">
              {/* Form ajout skill */}
              <div className="card">
                <h4 className="font-bold mb-3 text-sm">Ajouter une compétence</h4>
                <form onSubmit={handleAddSkill} className="flex gap-2 flex-wrap">
                  <select className="select text-sm flex-shrink-0" style={{ width: '160px' }}
                    value={newSkill.type} onChange={e => setNewSkill(s => ({ ...s, type: e.target.value }))}>
                    {SKILL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input className="input text-sm flex-1" placeholder="Nom de la compétence..."
                    value={newSkill.libelle} onChange={e => setNewSkill(s => ({ ...s, libelle: e.target.value }))} required />
                  <select className="select text-sm flex-shrink-0" style={{ width: '150px' }}
                    value={newSkill.niveau_maitrise} onChange={e => setNewSkill(s => ({ ...s, niveau_maitrise: e.target.value }))}>
                    {NIVEAUX_MAITRISE.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
                  </select>
                  <button type="submit" disabled={addingSkill} className="btn-primary flex items-center gap-1.5 text-sm">
                    {addingSkill ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
                    Ajouter
                  </button>
                </form>
              </div>

              {/* Compétences par type */}
              {SKILL_TYPES.map(type => {
                const items = itemsByType(type.value);
                if (items.length === 0) return null;
                const TypeIcon = type.icon;
                return (
                  <div key={type.value} className="card">
                    <h4 className="font-bold mb-3 flex items-center gap-2 text-sm">
                      <TypeIcon size={15} style={{ color: type.color }} />
                      {type.label}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map(item => (
                        <div key={item.id}
                          className={`skill-tag ${type.tag} flex items-center gap-2`}
                          style={{ background: type.bg, color: type.color, borderColor: `${type.color}30` }}>
                          <span>{item.libelle}</span>
                          {item.niveau_maitrise && (
                            <span className="opacity-60 capitalize text-xs">{item.niveau_maitrise}</span>
                          )}
                          <button onClick={() => handleDeleteSkill(item.id)}
                            className="opacity-60 hover:opacity-100 transition-opacity ml-1">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {comp.items?.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--c-text-muted)' }}>
                  Ajoutez vos premières compétences ci-dessus
                </p>
              )}
            </div>
          )}

          {/* Tab: Fichiers */}
          {tab === 'fichiers' && (
            <div className="space-y-4 fade-in">
              <div className="card">
                <h4 className="font-bold mb-3 text-sm">Ajouter un fichier (CV, portfolio, certif...)</h4>
                <form onSubmit={handleAddFichier} className="space-y-3">
                  <input className="input text-sm" placeholder="Titre du fichier"
                    value={newFichier.titre} onChange={e => setNewFichier(f => ({ ...f, titre: e.target.value }))} />
                  <input type="file" className="input text-sm"
                    onChange={e => setNewFichier(f => ({ ...f, file: e.target.files[0] }))} required />
                  <button type="submit" disabled={addingFile || !newFichier.file}
                    className="btn-primary flex items-center gap-2 text-sm">
                    {addingFile ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={14} />}
                    Uploader
                  </button>
                </form>
              </div>

              {comp.fichiers?.length > 0 && (
                <div className="space-y-2">
                  {comp.fichiers.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--c-surface2)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(79,142,247,0.1)' }}>
                        <Upload size={16} style={{ color: 'var(--c-primary)' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{f.titre || f.fichier_nom}</p>
                        <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{f.fichier_nom}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={f.fichier_url} target="_blank" rel="noopener noreferrer" download
                          className="btn-outline text-xs py-1.5 px-3">Télécharger</a>
                        <button onClick={() => handleDeleteFichier(f.id)}
                          className="p-2 rounded-lg" style={{ color: 'var(--c-danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}