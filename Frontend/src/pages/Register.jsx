// src/pages/Register.jsx — Inscription en plusieurs étapes
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { GraduationCap, ChevronRight, ChevronLeft, User, BookOpen, School } from 'lucide-react';

const NIVEAUX = [
  { code: 'L1', libelle: 'Licence 1' }, { code: 'L2', libelle: 'Licence 2' },
  { code: 'L3', libelle: 'Licence 3' }, { code: 'M1', libelle: 'Master 1' },
  { code: 'M2', libelle: 'Master 2' }, { code: 'DOCTORAT', libelle: 'Doctorat' }
];

const STEPS = ['Faculté', 'Filière', 'Rang', 'Informations', 'Scolarité'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [facultes, setFacultes] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [anneeActive, setAnneeActive] = useState(null);

  const [form, setForm] = useState({
    faculte_id: '', filiere_id: '', rang: '',
    nom: '', prenom: '', email: '', password: '',
    date_naissance: '', lieu_naissance: '',
    niveau_id: '', matricule: '', annee_scolaire_id: ''
  });

  useEffect(() => {
    api.get('/facultes').then(r => setFacultes(r.data.facultes));
    api.get('/annees/active').then(r => {
      setAnneeActive(r.data.annee);
      setForm(f => ({ ...f, annee_scolaire_id: r.data.annee.id }));
    });
    api.get('/niveaux').then(r => setNiveaux(r.data.niveaux || [])).catch(() => setNiveaux(NIVEAUX));
  }, []);

  const onFaculteChange = async (id) => {
    setForm(f => ({ ...f, faculte_id: id, filiere_id: '' }));
    if (id) {
      const r = await api.get(`/facultes/${id}/filieres`);
      setFilieres(r.data.filieres);
    }
  };

  const canNext = () => {
    if (step === 0) return form.faculte_id;
    if (step === 1) return form.filiere_id;
    if (step === 2) return form.rang;
    if (step === 3) return form.nom && form.prenom && form.email && form.password;
    if (step === 4) return form.rang === 'professeur' || (form.niveau_id && form.matricule);
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register(form);
      toast.success('Inscription réussie !');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
            ${i < step ? 'bg-green-500 text-white' : i === step ? 'text-white' : 'text-gray-500'}`}
            style={{ background: i === step ? 'var(--c-primary)' : i < step ? 'var(--c-success)' : 'var(--c-surface2)' }}>
            {i < step ? '✓' : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-8 h-0.5 rounded" style={{ background: i < step ? 'var(--c-success)' : 'var(--c-border)' }} />
          )}
        </div>
      ))}
    </div>
  );

  const RangCard = ({ value, label, desc, icon, color }) => (
    <button type="button"
      onClick={() => setForm(f => ({ ...f, rang: value }))}
      className="w-full p-4 rounded-xl border-2 text-left transition-all duration-200"
      style={{
        borderColor: form.rang === value ? color : 'var(--c-border)',
        background: form.rang === value ? `${color}15` : 'var(--c-surface2)'
      }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-semibold text-sm" style={{ color: form.rang === value ? color : 'var(--c-text)' }}>{label}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{desc}</div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--c-bg)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-5"
          style={{ background: 'var(--c-delegue)', filter: 'blur(90px)' }} />
      </div>

      <div className="relative w-full max-w-lg fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
            style={{ background: 'linear-gradient(135deg, var(--c-primary), var(--c-delegue))' }}>
            <GraduationCap size={24} color="white" />
          </div>
          <h1 className="text-2xl" style={{ fontFamily: 'Syne, sans-serif' }}>Inscription</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            Étape {step + 1} sur {STEPS.length} — <strong style={{ color: 'var(--c-primary)' }}>{STEPS[step]}</strong>
          </p>
        </div>

        <StepIndicator />

        <div className="card">
          {/* ÉTAPE 0: Choix Faculté */}
          {step === 0 && (
            <div className="space-y-3 fade-in">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <School size={18} style={{ color: 'var(--c-primary)' }} /> Choisissez votre Faculté
              </h3>
              {facultes.map(f => (
                <button key={f.id} type="button"
                  onClick={() => { onFaculteChange(f.id); }}
                  className="w-full p-4 rounded-xl border-2 text-left transition-all duration-200"
                  style={{
                    borderColor: form.faculte_id == f.id ? 'var(--c-primary)' : 'var(--c-border)',
                    background: form.faculte_id == f.id ? 'rgba(91,115,255,0.1)' : 'var(--c-surface2)'
                  }}>
                  <div className="font-semibold text-sm" style={{ color: form.faculte_id == f.id ? 'var(--c-primary)' : 'var(--c-text)' }}>
                    {f.code}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{f.nom}</div>
                </button>
              ))}
            </div>
          )}

          {/* ÉTAPE 1: Choix Filière */}
          {step === 1 && (
            <div className="space-y-2 fade-in">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen size={18} style={{ color: 'var(--c-primary)' }} /> Choisissez votre Filière
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filieres.map(f => (
                  <button key={f.id} type="button"
                    onClick={() => setForm(p => ({ ...p, filiere_id: f.id }))}
                    className="w-full p-3 rounded-xl border-2 text-left transition-all duration-200"
                    style={{
                      borderColor: form.filiere_id == f.id ? 'var(--c-primary)' : 'var(--c-border)',
                      background: form.filiere_id == f.id ? 'rgba(91,115,255,0.1)' : 'var(--c-surface2)'
                    }}>
                    <span className="text-sm font-medium" style={{ color: form.filiere_id == f.id ? 'var(--c-primary)' : 'var(--c-text)' }}>
                      {f.nom}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2: Choix Rang */}
          {step === 2 && (
            <div className="space-y-3 fade-in">
              <h3 className="font-semibold mb-4">Votre statut dans l'application</h3>
              <RangCard value="etudiant" label="Étudiant" icon="🎒" color="#60a5fa"
                desc="Accès en lecture, inscription aux cours" />
              <RangCard value="delegue" label="Délégué" icon="🏛️" color="#a78bfa"
                desc="Gestion des UE, événements et discussions (max 5/niveau)" />
              <RangCard value="professeur" label="Professeur" icon="📖" color="#34d399"
                desc="Accès multi-filières, ajout de notes et cours" />
            </div>
          )}

          {/* ÉTAPE 3: Informations personnelles */}
          {step === 3 && (
            <div className="space-y-4 fade-in">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User size={18} style={{ color: 'var(--c-primary)' }} /> Vos informations
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Nom *</label>
                  <input className="input" placeholder="DUPONT" value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value.toUpperCase() }))} required />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Prénom *</label>
                  <input className="input" placeholder="Jean" value={form.prenom}
                    onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Email *</label>
                <input className="input" type="email" placeholder="jean@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Mot de passe *</label>
                <input className="input" type="password" placeholder="Min. 8 caractères" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Date de naissance</label>
                  <input className="input" type="date" value={form.date_naissance}
                    onChange={e => setForm(f => ({ ...f, date_naissance: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Lieu de naissance</label>
                  <input className="input" placeholder="Yaoundé" value={form.lieu_naissance}
                    onChange={e => setForm(f => ({ ...f, lieu_naissance: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 4: Scolarité */}
          {step === 4 && (
            <div className="space-y-4 fade-in">
              <h3 className="font-semibold mb-4">Informations scolaires</h3>
              {anneeActive && (
                <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(91,115,255,0.1)', color: 'var(--c-primary)' }}>
                  📅 Année scolaire active : <strong>{anneeActive.libelle}</strong>
                </div>
              )}
              {form.rang !== 'professeur' && (
                <>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Niveau scolaire *</label>
                    <select className="select" value={form.niveau_id}
                      onChange={e => setForm(f => ({ ...f, niveau_id: e.target.value }))}>
                      <option value="">-- Choisir le niveau --</option>
                      {NIVEAUX.map((n, i) => (
                        <option key={i} value={i + 1}>{n.libelle}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Matricule *</label>
                    <input className="input" placeholder="Ex: 22D0001" value={form.matricule}
                      onChange={e => setForm(f => ({ ...f, matricule: e.target.value.toUpperCase() }))} required />
                    <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>Le matricule doit être unique</p>
                  </div>
                </>
              )}
              {form.rang === 'professeur' && (
                <div className="p-4 rounded-xl border text-sm" style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)', color: '#6ee7b7' }}>
                  ℹ️ En tant que professeur, vous aurez accès à plusieurs filières et niveaux selon vos cours assignés.
                </div>
              )}
            </div>
          )}

          {/* Boutons navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className="btn-outline flex items-center gap-2">
                <ChevronLeft size={16} /> Retour
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                style={{ opacity: canNext() ? 1 : 0.5, cursor: canNext() ? 'pointer' : 'not-allowed' }}>
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading || !canNext()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                style={{ opacity: (loading || !canNext()) ? 0.7 : 1 }}>
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Inscription...' : '✅ Finaliser l\'inscription'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--c-text-muted)' }}>
          Déjà inscrit ?{' '}
          <Link to="/login" style={{ color: 'var(--c-primary)' }} className="font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}