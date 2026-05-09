// src/pages/Cours.jsx — Gestion des Unités d'Enseignement
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, BookOpen, CheckCircle, XCircle, Users } from 'lucide-react';

const SEMESTRES = [1, 2];

export default function Cours() {
  const { user, isDelegue, isProf, isEtudiant } = useAuth();
  const [ues, setUes] = useState({ semestre1: [], semestre2: [] });
  const [loading, setLoading] = useState(true);
  const [semestre, setSemestre] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', nom: '', description: '', credits: 3, semestre: 1 });

  const fetchUes = async () => {
    try {
      const r = await api.get(`/ues/filiere/${user.filiere_id}/niveau/${user.niveau_id}`);
      setUes({ semestre1: r.data.semestre1 || [], semestre2: r.data.semestre2 || [] });
    } catch { toast.error('Erreur chargement des UE'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchUes(); }, [user]);

  const handleInscrire = async (ueId, estInscrit) => {
    try {
      if (estInscrit) {
        await api.delete(`/ues/${ueId}/desinscrire`);
        toast.success('Désinscription réussie');
      } else {
        await api.post(`/ues/${ueId}/inscrire`);
        toast.success('Inscrit avec succès !');
      }
      fetchUes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleAssignerProf = async (ueId) => {
    try {
      await api.post(`/ues/${ueId}/assigner-prof`);
      toast.success('Vous êtes assigné à cette UE !');
      fetchUes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette UE ?')) return;
    try {
      await api.delete(`/ues/${id}`);
      toast.success('UE supprimée');
      fetchUes();
    } catch { toast.error('Erreur suppression'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ues', { ...form, filiere_id: user.filiere_id, niveau_id: user.niveau_id });
      toast.success('UE créée !');
      setShowForm(false);
      setForm({ code: '', nom: '', description: '', credits: 3, semestre: 1 });
      fetchUes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const currentUes = semestre === 1 ? ues.semestre1 : ues.semestre2;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>Cours & UE</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            {ues.semestre1.length + ues.semestre2.length} unités d'enseignement
          </p>
        </div>
        {isDelegue() && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Ajouter une UE
          </button>
        )}
      </div>

      {/* Formulaire création UE (délégué) */}
      {showForm && isDelegue() && (
        <div className="card fade-in">
          <h3 className="font-semibold mb-4">Nouvelle Unité d'Enseignement</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Code UE *</label>
                <input className="input" placeholder="INF301" value={form.code}
                  onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} required />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Semestre *</label>
                <select className="select" value={form.semestre}
                  onChange={e => setForm(f => ({...f, semestre: parseInt(e.target.value)}))}>
                  <option value={1}>Semestre 1</option>
                  <option value={2}>Semestre 2</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Nom de l'UE *</label>
              <input className="input" placeholder="Programmation orientée objet" value={form.nom}
                onChange={e => setForm(f => ({...f, nom: e.target.value}))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Description</label>
                <input className="input" placeholder="Description..." value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Crédits</label>
                <input className="input" type="number" min={1} max={10} value={form.credits}
                  onChange={e => setForm(f => ({...f, credits: parseInt(e.target.value)}))} />
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
      <div className="flex gap-2">
        {SEMESTRES.map(s => (
          <button key={s} onClick={() => setSemestre(s)} className={`tab ${semestre === s ? 'active' : ''}`}>
            Semestre {s} ({s === 1 ? ues.semestre1.length : ues.semestre2.length})
          </button>
        ))}
      </div>

      {/* Liste des UE */}
      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--c-text-muted)' }}>Chargement...</div>
      ) : currentUes.length === 0 ? (
        <div className="text-center py-16 card">
          <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucune UE pour le semestre {semestre}</p>
          {isDelegue() && <p className="text-sm mt-2" style={{ color: 'var(--c-text-muted)' }}>Cliquez sur "Ajouter une UE" pour commencer</p>}
        </div>
      ) : (
        <div className="grid gap-4">
          {currentUes.map(ue => (
            <div key={ue.id} className="card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  {/* Code UE */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(91,115,255,0.15)', color: 'var(--c-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {ue.code}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold" style={{ color: 'var(--c-text)' }}>{ue.nom}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
                        {ue.credits} crédits
                      </span>
                    </div>
                    {ue.description && (
                      <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>{ue.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--c-text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {ue.nb_inscrits} inscrit(s)
                      </span>
                      {ue.professeurs && ue.professeurs.length > 0 && (
                        <span>👨‍🏫 {ue.professeurs.map(p => `${p.prenom} ${p.nom}`).join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {/* Étudiant/délégué: s'inscrire */}
                  {!isProf() && (
                    <button onClick={() => handleInscrire(ue.id, ue.est_inscrit)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200`}
                      style={{
                        background: ue.est_inscrit ? 'rgba(34,197,94,0.15)' : 'rgba(91,115,255,0.15)',
                        color: ue.est_inscrit ? 'var(--c-success)' : 'var(--c-primary)'
                      }}>
                      {ue.est_inscrit ? <><CheckCircle size={14} /> Inscrit</> : <><XCircle size={14} /> S'inscrire</>}
                    </button>
                  )}

                  {/* Professeur: s'assigner */}
                  {isProf() && (
                    <button onClick={() => handleAssignerProf(ue.id)}
                      className="btn-outline text-sm flex items-center gap-2">
                      <BookOpen size={14} /> Enseigner
                    </button>
                  )}

                  {/* Délégué: supprimer */}
                  {isDelegue() && (
                    <button onClick={() => handleDelete(ue.id)}
                      className="p-2 rounded-xl transition-colors hover:bg-red-500/20"
                      style={{ color: 'var(--c-danger)' }}>
                      <Trash2 size={16} />
                    </button>
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