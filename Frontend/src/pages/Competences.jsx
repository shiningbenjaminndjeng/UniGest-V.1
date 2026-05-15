// src/pages/Competences.jsx — responsive mobile
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Star, Plus, Trash2, Upload, Link, ExternalLink,
  Globe, CheckCircle, X, Edit3, Save, EyeOff,
  Award, Zap, BookOpen, Code, Phone,
} from 'lucide-react';

const SKILL_TYPES = [
  { value: 'technique',      label: 'Technique',      icon: Code,     color: 'var(--c-primary)',  bg: 'rgba(79,142,247,0.1)',  tag: 'skill-tag-tech'     },
  { value: 'pratique',       label: 'Pratique',        icon: Zap,      color: 'var(--c-prof)',     bg: 'rgba(6,214,160,0.1)',   tag: 'skill-tag-pratique' },
  { value: 'specialisation', label: 'Spécialisation',  icon: Star,     color: 'var(--c-delegue)', bg: 'rgba(168,85,247,0.1)', tag: 'skill-tag-spec'     },
  { value: 'certification',  label: 'Certification',   icon: Award,    color: 'var(--c-warning)',  bg: 'rgba(251,191,36,0.1)', tag: 'skill-tag-cert'     },
  { value: 'etudes',         label: 'Études',          icon: BookOpen, color: 'var(--c-accent)',   bg: 'rgba(249,115,22,0.1)', tag: 'skill-tag-etudes'   },
];
const NIVEAUX_MAITRISE = ['debutant', 'intermediaire', 'avance', 'expert'];

const StarRating = ({ value = 0, max = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }, (_, i) => i + 1).map(i => (
      <span key={i} style={{ color: i <= value ? '#fbbf24' : 'var(--c-border2)', fontSize: 16 }}>★</span>
    ))}
  </div>
);

export default function Competences() {
  const { user } = useAuth();
  const [comp, setComp]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tab, setTab]         = useState('profil');
  const [form, setForm]       = useState({ titre: '', bio: '', telephone: '', email_contact: '', linkedin: '', github: '', portfolio: '', disponible: true });
  const [banniere, setBanniere]   = useState(null);
  const [newSkill, setNewSkill]   = useState({ type: 'technique', libelle: '', niveau_maitrise: 'intermediaire' });
  const [newFichier, setNewFichier] = useState({ titre: '', file: null });
  const [saving, setSaving]       = useState(false);
  const [addingSkill, setAddingSkill]   = useState(false);
  const [addingFile, setAddingFile]     = useState(false);

  const fetchComp = async () => {
    try {
      const r = await api.get('/competences/me');
      if (r.data.competence) {
        setComp(r.data.competence);
        setForm({ titre: r.data.competence.titre || '', bio: r.data.competence.bio || '', telephone: r.data.competence.telephone || '', email_contact: r.data.competence.email_contact || '', linkedin: r.data.competence.linkedin || '', github: r.data.competence.github || '', portfolio: r.data.competence.portfolio || '', disponible: r.data.competence.disponible ?? true });
      }
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { fetchComp(); }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (banniere) fd.append('banniere', banniere);
      await api.post('/competences', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Profil mis à jour !'); setEditing(false); fetchComp();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault(); if (!newSkill.libelle.trim()) return; setAddingSkill(true);
    try { await api.post('/competences/items', newSkill); toast.success('Ajouté !'); setNewSkill({ type: 'technique', libelle: '', niveau_maitrise: 'intermediaire' }); fetchComp(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setAddingSkill(false); }
  };

  const handleDeleteSkill = async (id) => { try { await api.delete(`/competences/items/${id}`); fetchComp(); } catch { toast.error('Erreur'); } };

  const handleAddFichier = async (e) => {
    e.preventDefault(); if (!newFichier.file) return; setAddingFile(true);
    try {
      const fd = new FormData();
      fd.append('titre', newFichier.titre || newFichier.file.name);
      fd.append('fichier', newFichier.file);
      await api.post('/competences/fichiers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Fichier ajouté !'); setNewFichier({ titre: '', file: null }); fetchComp();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setAddingFile(false); }
  };

  const handleDeleteFichier = async (id) => { try { await api.delete(`/competences/fichiers/${id}`); fetchComp(); } catch { toast.error('Erreur'); } };

  if (loading) return <div className="space-y-3"><div className="shimmer h-40 rounded-2xl" /><div className="shimmer h-20 rounded-2xl" /></div>;

  const itemsByType = (type) => comp?.items?.filter(i => i.type === type) || [];

  return (
    <div className="space-y-4 md:space-y-5 fade-in max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl gradient-text">Mes Compétences</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>Votre vitrine visible par vos camarades</p>
        </div>
        {comp && !editing && (
          <button onClick={() => setEditing(true)} className="btn-outline flex items-center gap-1.5 text-sm px-4 py-2">
            <Edit3 size={14} /> <span className="hidden sm:inline">Modifier</span>
          </button>
        )}
      </div>

      {/* Pas de fiche */}
      {!comp && !editing && (
        <div className="card text-center py-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center float" style={{ background: 'var(--g-primary)' }}>
            <Star size={28} color="white" />
          </div>
          <h2 className="text-lg font-bold mb-2">Créez votre fiche de compétences</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--c-text-muted)' }}>Showcasez vos talents et partagez vos contacts</p>
          <button onClick={() => setEditing(true)} className="btn-primary mx-auto">Créer ma fiche</button>
        </div>
      )}

      {/* Formulaire édition */}
      {editing && (
        <form onSubmit={handleSaveProfile} className="card fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm md:text-base">{comp ? 'Modifier mon profil' : 'Créer mon profil'}</h3>
            <button type="button" onClick={() => setEditing(false)}><X size={18} style={{ color: 'var(--c-text-muted)' }} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Titre / Domaine</label>
              <input className="input text-sm" placeholder="Développeur Full-Stack · L3 Info" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Bio</label>
              <textarea className="input resize-none text-sm" rows={3} placeholder="Présentez-vous..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Bannière (image)</label>
              <input type="file" accept="image/*" className="input text-sm" onChange={e => setBanniere(e.target.files[0])} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'telephone',     placeholder: '+237 6XX XXX XXX', label: 'Téléphone' },
                { key: 'email_contact', placeholder: 'email@contact.com', label: 'Email contact', type: 'email' },
                { key: 'linkedin',      placeholder: 'linkedin.com/in/...', label: 'LinkedIn' },
                { key: 'github',        placeholder: 'github.com/...', label: 'GitHub' },
                { key: 'portfolio',     placeholder: 'monsite.com', label: 'Portfolio' },
              ].map(({ key, placeholder, label, type }) => (
                <div key={key}>
                  <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>{label}</label>
                  <input className="input text-sm" type={type || 'text'} placeholder={placeholder}
                    value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="flex items-end">
                <button type="button" onClick={() => setForm(f => ({ ...f, disponible: !f.disponible }))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm w-full justify-center"
                  style={{ background: form.disponible ? 'var(--c-success-glow)' : 'var(--c-surface2)', color: form.disponible ? 'var(--c-success)' : 'var(--c-text-muted)', border: `1px solid ${form.disponible ? 'rgba(16,217,123,0.3)' : 'var(--c-border)'}` }}>
                  {form.disponible ? <CheckCircle size={14} /> : <EyeOff size={14} />}
                  {form.disponible ? 'Disponible' : 'Non dispo'}
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm flex-1 justify-center">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <Save size={14} /> Enregistrer
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-outline text-sm">Annuler</button>
            </div>
          </div>
        </form>
      )}

      {/* Profil affiché */}
      {comp && !editing && (
        <>
          {/* Bannière + Avatar */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="profile-banner" style={{ background: comp.banniere_url ? `url(${comp.banniere_url}) center/cover` : 'var(--g-primary)' }}>
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
              {comp.disponible && (
                <span className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,217,123,0.9)', color: 'white' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Disponible
                </span>
              )}
            </div>
            <div className="p-4 pt-0">
              <div className="flex items-end gap-3 -mt-7 mb-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black border-4 relative z-10"
                  style={{ background: 'var(--g-primary)', color: 'white', borderColor: 'var(--c-surface)', fontFamily: 'Outfit, sans-serif' }}>
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div className="flex-1 pb-0.5">
                  <h2 className="text-lg font-black leading-tight" style={{ color: 'var(--c-text)', fontFamily: 'Outfit, sans-serif', wordBreak: 'break-word' }}>{user?.prenom} {user?.nom}</h2>
                  {comp.titre && <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{comp.titre}</p>}
                </div>
                <div className="pb-0.5">
                  <StarRating value={Math.round(comp.note_moyenne || 0)} />
                  <p className="text-xs text-right mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{Number(comp.note_moyenne || 0).toFixed(1)} ({comp.nb_votes})</p>
                </div>
              </div>
              {comp.bio && <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--c-text-muted)' }}>{comp.bio}</p>}
              <div className="flex flex-wrap gap-1.5">
                {comp.telephone    && <a href={`tel:${comp.telephone}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs" style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}><Phone size={11} style={{ color: 'var(--c-primary)' }} /> {comp.telephone}</a>}
                {comp.email_contact&& <a href={`mailto:${comp.email_contact}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs" style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}><Link size={11} style={{ color: 'var(--c-primary)' }} /> Email</a>}
                {comp.linkedin     && <a href={comp.linkedin.startsWith('http') ? comp.linkedin : `https://${comp.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(10,102,194,0.15)', color: '#0a66c2' }}><ExternalLink size={11} /> LinkedIn</a>}
                {comp.github       && <a href={comp.github.startsWith('http') ? comp.github : `https://${comp.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs" style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}><ExternalLink size={11} /> GitHub</a>}
                {comp.portfolio    && <a href={comp.portfolio.startsWith('http') ? comp.portfolio : `https://${comp.portfolio}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs" style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}><Globe size={11} /> Site</a>}
              </div>
            </div>
          </div>

          {/* Tabs scrollables */}
          <div className="tabs-scroll">
            {['profil', 'competences', 'fichiers'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`tab flex-shrink-0 capitalize ${tab === t ? 'active' : ''}`}>
                {t === 'profil' ? '👤 Profil' : t === 'competences' ? '⚡ Compétences' : '📁 Fichiers'}
              </button>
            ))}
          </div>

          {/* Tab: Compétences */}
          {tab === 'competences' && (
            <div className="space-y-3 fade-in">
              <div className="card">
                <h4 className="font-bold mb-3 text-sm">Ajouter une compétence</h4>
                <form onSubmit={handleAddSkill} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select className="select text-sm" value={newSkill.type} onChange={e => setNewSkill(s => ({ ...s, type: e.target.value }))}>
                      {SKILL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <select className="select text-sm" value={newSkill.niveau_maitrise} onChange={e => setNewSkill(s => ({ ...s, niveau_maitrise: e.target.value }))}>
                      {NIVEAUX_MAITRISE.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input className="input text-sm flex-1" placeholder="Nom de la compétence..." value={newSkill.libelle} onChange={e => setNewSkill(s => ({ ...s, libelle: e.target.value }))} required />
                    <button type="submit" disabled={addingSkill} className="btn-primary flex items-center gap-1 text-sm px-3 flex-shrink-0">
                      {addingSkill ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
                    </button>
                  </div>
                </form>
              </div>
              {SKILL_TYPES.map(type => {
                const items = itemsByType(type.value);
                if (items.length === 0) return null;
                const TypeIcon = type.icon;
                return (
                  <div key={type.value} className="card">
                    <h4 className="font-bold mb-2 flex items-center gap-2 text-sm">
                      <TypeIcon size={14} style={{ color: type.color }} /> {type.label}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map(item => (
                        <div key={item.id} className={`skill-tag ${type.tag} flex items-center gap-1.5`}
                          style={{ background: type.bg, color: type.color, borderColor: `${type.color}30` }}>
                          <span>{item.libelle}</span>
                          {item.niveau_maitrise && <span className="opacity-60 text-xs capitalize hidden sm:inline">{item.niveau_maitrise}</span>}
                          <button onClick={() => handleDeleteSkill(item.id)} className="opacity-60 hover:opacity-100 ml-0.5"><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Fichiers */}
          {tab === 'fichiers' && (
            <div className="space-y-3 fade-in">
              <div className="card">
                <h4 className="font-bold mb-3 text-sm">Ajouter un fichier (CV, certif...)</h4>
                <form onSubmit={handleAddFichier} className="space-y-2">
                  <input className="input text-sm" placeholder="Titre du fichier" value={newFichier.titre} onChange={e => setNewFichier(f => ({ ...f, titre: e.target.value }))} />
                  <input type="file" className="input text-sm" onChange={e => setNewFichier(f => ({ ...f, file: e.target.files[0] }))} required />
                  <button type="submit" disabled={addingFile || !newFichier.file} className="btn-primary flex items-center gap-2 text-sm w-full justify-center">
                    {addingFile ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={13} />}
                    Uploader
                  </button>
                </form>
              </div>
              {comp.fichiers?.length > 0 && (
                <div className="space-y-2">
                  {comp.fichiers.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--c-surface2)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(79,142,247,0.1)' }}>
                        <Upload size={14} style={{ color: 'var(--c-primary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>{f.titre || f.fichier_nom}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--c-text-muted)' }}>{f.fichier_nom}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <a href={f.fichier_url} target="_blank" rel="noopener noreferrer" download className="btn-outline text-xs py-1 px-2.5">DL</a>
                        <button onClick={() => handleDeleteFichier(f.id)} className="p-1.5 rounded-lg" style={{ color: 'var(--c-danger)' }}><Trash2 size={13} /></button>
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