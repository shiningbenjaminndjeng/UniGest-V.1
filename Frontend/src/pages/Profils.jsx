// src/pages/Profil.jsx — Profil et paramètres de l'utilisateur
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';

export default function Profil() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('infos');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwd, setPwd] = useState({ ancien: '', nouveau: '', confirmation: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwd.nouveau !== pwd.confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (pwd.nouveau.length < 8) {
      toast.error('Le nouveau mot de passe doit faire au moins 8 caractères');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        ancien_password: pwd.ancien,
        nouveau_password: pwd.nouveau
      });
      toast.success('Mot de passe modifié ! Reconnectez-vous.');
      setTimeout(() => logout(), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const RANG_COLORS = {
    etudiant:   { badge: 'badge-etudiant',  label: 'Étudiant',   icon: '🎒' },
    delegue:    { badge: 'badge-delegue',   label: 'Délégué',    icon: '🏛️' },
    professeur: { badge: 'badge-prof',      label: 'Professeur', icon: '📖' },
  };
  const rangInfo = RANG_COLORS[user?.rang] || {};

  return (
    <div className="space-y-6 fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>Mon Profil</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
          Vos informations et paramètres
        </p>
      </div>

      {/* Card profil résumé */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{
              background: user?.rang === 'delegue' ? 'rgba(167,139,250,0.15)' :
                          user?.rang === 'professeur' ? 'rgba(52,211,153,0.15)' : 'rgba(91,115,255,0.15)',
              color: user?.rang === 'delegue' ? 'var(--c-delegue)' :
                     user?.rang === 'professeur' ? 'var(--c-prof)' : 'var(--c-primary)',
              fontFamily: 'Syne, sans-serif'
            }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--c-text)' }}>
              {user?.prenom} {user?.nom}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${rangInfo.badge}`}>
                {rangInfo.icon} {rangInfo.label}
              </span>
              {user?.matricule && (
                <span className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {user.matricule}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2">
        {[
          { id: 'infos', label: 'Informations', icon: User },
          { id: 'securite', label: 'Sécurité', icon: Lock },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`tab flex items-center gap-2 ${tab === id ? 'active' : ''}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Onglet Informations */}
      {tab === 'infos' && (
        <div className="card fade-in space-y-0">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--c-text)' }}>Informations personnelles</h3>
          {[
            { label: 'Prénom',          value: user?.prenom },
            { label: 'Nom',             value: user?.nom },
            { label: 'Email',           value: user?.email },
            { label: 'Date naissance',  value: user?.date_naissance ? new Date(user.date_naissance).toLocaleDateString('fr-FR') : null },
            { label: 'Lieu naissance',  value: user?.lieu_naissance },
            { label: 'Rang',            value: rangInfo.label },
            { label: 'Matricule',       value: user?.matricule || '— (non applicable)' },
            { label: 'Filière',         value: user?.filiere_nom },
            { label: 'Faculté',         value: user?.faculte_nom },
            { label: 'Niveau',          value: user?.niveau_libelle || '— (non applicable)' },
            { label: 'Année scolaire',  value: user?.annee_libelle },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-3 border-b"
              style={{ borderColor: 'var(--c-border)' }}>
              <span className="text-sm" style={{ color: 'var(--c-text-muted)' }}>{label}</span>
              <span className="text-sm font-medium text-right" style={{ color: 'var(--c-text)', maxWidth: '60%' }}>
                {value || '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Onglet Sécurité */}
      {tab === 'securite' && (
        <div className="card fade-in">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--c-text)' }}>Changer le mot de passe</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
                Mot de passe actuel *
              </label>
              <div className="relative">
                <input className="input pr-10" type={showOld ? 'text' : 'password'}
                  placeholder="••••••••" value={pwd.ancien}
                  onChange={e => setPwd(p => ({...p, ancien: e.target.value}))} required />
                <button type="button" onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--c-text-muted)' }}>
                  {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
                Nouveau mot de passe * (min. 8 caractères)
              </label>
              <div className="relative">
                <input className="input pr-10" type={showNew ? 'text' : 'password'}
                  placeholder="••••••••" value={pwd.nouveau}
                  onChange={e => setPwd(p => ({...p, nouveau: e.target.value}))} required minLength={8} />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--c-text-muted)' }}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Indicateur de force */}
              {pwd.nouveau && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{
                      background: pwd.nouveau.length >= i * 3
                        ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#22c55e'
                        : 'var(--c-border)'
                    }} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
                Confirmer le nouveau mot de passe *
              </label>
              <input className="input" type="password" placeholder="••••••••"
                value={pwd.confirmation}
                onChange={e => setPwd(p => ({...p, confirmation: e.target.value}))} required />
              {pwd.confirmation && pwd.nouveau !== pwd.confirmation && (
                <p className="text-xs mt-1" style={{ color: 'var(--c-danger)' }}>
                  ✕ Les mots de passe ne correspondent pas
                </p>
              )}
              {pwd.confirmation && pwd.nouveau === pwd.confirmation && pwd.confirmation.length > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--c-success)' }}>
                  ✓ Les mots de passe correspondent
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--c-warning)' }}>
              ⚠️ Après le changement, vous serez déconnecté et devrez vous reconnecter.
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary flex items-center gap-2"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Save size={15} /> Enregistrer le nouveau mot de passe
            </button>
          </form>
        </div>
      )}
    </div>
  );
}