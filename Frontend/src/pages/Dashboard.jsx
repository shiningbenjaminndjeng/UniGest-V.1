// src/pages/Dashboard.jsx — Tableau de bord responsive mobile
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Users, BookOpen, Calendar, GraduationCap, Award, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color, bg, delay = 0 }) => (
  <div className="stat-card fade-in" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between mb-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-2xl font-black leading-none" style={{ fontFamily: 'Outfit, sans-serif', color }}>
        {value ?? '—'}
      </p>
    </div>
    <p className="text-xs font-medium" style={{ color: 'var(--c-text-muted)' }}>{label}</p>
    <div className="progress-bar mt-2">
      <div className="progress-fill" style={{ width: `${Math.min((value / 50) * 100, 100)}%`, background: color }} />
    </div>
  </div>
);

const EventType = {
  evaluation: { emoji: '📝', color: '#fbbf24' },
  conference: { emoji: '🎙️', color: '#3b82f6' },
  fete:       { emoji: '🎉', color: '#ec4899' },
  autre:      { emoji: '📌', color: '#8b5cf6' },
};

export default function Dashboard() {
  const { user, isProf, isDelegue } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [evenements, setEvenements] = useState([]);
  const [topTalents, setTopTalents] = useState([]);

  useEffect(() => {
    if (user?.filiere_id && user?.niveau_id) {
      api.get(`/filieres/${user.filiere_id}/niveau/${user.niveau_id}/stats`)
        .then(r => setStats(r.data.stats)).catch(() => {});
      api.get(`/evenements/filiere/${user.filiere_id}/niveau/${user.niveau_id}`)
        .then(r => setEvenements(r.data.evenements?.slice(0, 4))).catch(() => {});
      api.get(`/competences/filiere/${user.filiere_id}`)
        .then(r => setTopTalents(
          (r.data.competences || [])
            .sort((a, b) => (b.note_moyenne || 0) - (a.note_moyenne || 0))
            .slice(0, 3)
        )).catch(() => {});
    }
  }, [user]);

  const RANG_INFO = {
    etudiant:   { label: 'Étudiant',   badge: 'badge-etudiant', color: 'var(--c-primary)', greeting: '📚' },
    delegue:    { label: 'Délégué',    badge: 'badge-delegue',  color: 'var(--c-delegue)', greeting: '🏛️' },
    professeur: { label: 'Professeur', badge: 'badge-prof',     color: 'var(--c-prof)',    greeting: '👨‍🏫' },
  };
  const ri = RANG_INFO[user?.rang] || RANG_INFO.etudiant;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-4 md:space-y-6 fade-in">

      {/* Hero welcome */}
      <div className="card relative overflow-hidden" style={{ padding: '1.25rem' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'var(--g-primary)', filter: 'blur(50px)', transform: 'translate(30%, -30%)' }} />
        </div>
        <div className="relative z-10">
          <p className="text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>{greeting} {ri.greeting}</p>
          <h1 className="text-2xl md:text-4xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {user?.prenom}{' '}
            <span className="gradient-text">{user?.nom}</span>
          </h1>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`badge ${ri.badge}`}>{ri.label}</span>
            {user?.matricule && (
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {user.matricule}
              </span>
            )}
            <span className="text-xs px-2 py-1 rounded-lg truncate max-w-[160px] md:max-w-none"
              style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
              {user?.filiere_nom} · {user?.niveau_code || '—'}
            </span>
          </div>
          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            {isDelegue() && (
              <button onClick={() => navigate('/evenements')}
                className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
                style={{ minHeight: '36px' }}>
                <Calendar size={13} /> Créer un événement
              </button>
            )}
            <button onClick={() => navigate('/competences')}
              className="btn-outline text-xs px-3 py-2 flex items-center gap-1.5"
              style={{ minHeight: '36px' }}>
              <Star size={13} /> Mes compétences
            </button>
          </div>
        </div>
      </div>

      {/* Stats — grille 2x2 sur mobile, 4 colonnes sur desktop */}
      {stats && (
        <div className="grid-responsive-4">
          <StatCard icon={Users} label="Étudiants" value={stats.nb_etudiants}
            color="var(--c-primary)" bg="rgba(79,142,247,0.12)" delay={0} />
          <StatCard icon={Award} label="Délégués" value={stats.nb_delegues}
            color="var(--c-delegue)" bg="rgba(168,85,247,0.12)" delay={50} />
          <StatCard icon={GraduationCap} label="Professeurs" value={stats.nb_professeurs}
            color="var(--c-prof)" bg="rgba(6,214,160,0.12)" delay={100} />
          <StatCard icon={BookOpen} label="UE / Cours" value={stats.nb_ues}
            color="var(--c-accent)" bg="rgba(249,115,22,0.12)" delay={150} />
        </div>
      )}

      {/* Grille infos: empilée sur mobile, 3 colonnes sur desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Profil */}
        <div className="card">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Zap size={15} style={{ color: 'var(--c-primary)' }} /> Mon profil
          </h2>
          <div className="space-y-0">
            {[
              { label: 'Email',    value: user?.email },
              { label: 'Filière',  value: user?.filiere_nom },
              { label: 'Faculté',  value: user?.faculte_nom },
              { label: 'Niveau',   value: user?.niveau_libelle || '—' },
              { label: 'Année',    value: user?.annee_libelle },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b"
                style={{ borderColor: 'var(--c-border)' }}>
                <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{label}</span>
                <span className="text-xs font-semibold text-right ml-2 truncate max-w-[55%]"
                  style={{ color: 'var(--c-text)' }}>
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Événements */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Calendar size={15} style={{ color: 'var(--c-delegue)' }} /> Événements
            </h2>
            <button onClick={() => navigate('/evenements')}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: 'var(--c-primary)', background: 'rgba(79,142,247,0.08)' }}>
              Voir tout →
            </button>
          </div>
          {evenements?.length === 0 ? (
            <div className="text-center py-6">
              <Calendar size={28} className="mx-auto mb-2" style={{ color: 'var(--c-text-dim)' }} />
              <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Aucun événement</p>
            </div>
          ) : (
            <div className="space-y-2">
              {evenements?.map(ev => {
                const et = EventType[ev.type] || EventType.autre;
                return (
                  <div key={ev.id} className="flex gap-3 p-2.5 rounded-xl"
                    style={{ background: 'var(--c-surface2)' }}>
                    <span className="text-base flex-shrink-0">{et.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--c-text)' }}>{ev.titre}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                        {new Date(ev.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Talents */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Star size={15} style={{ color: 'var(--c-warning)' }} /> Top Talents
            </h2>
            <button onClick={() => navigate('/talent')}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: 'var(--c-primary)', background: 'rgba(79,142,247,0.08)' }}>
              Explorer →
            </button>
          </div>
          {topTalents.length === 0 ? (
            <div className="text-center py-6">
              <Star size={28} className="mx-auto mb-2" style={{ color: 'var(--c-text-dim)' }} />
              <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Pas encore de fiches</p>
              <button onClick={() => navigate('/competences')}
                className="text-xs mt-2 px-3 py-1.5 rounded-lg"
                style={{ color: 'var(--c-primary)', background: 'rgba(79,142,247,0.08)' }}>
                Créer ma fiche
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {topTalents.map((t, idx) => (
                <div key={t.user_id} className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ background: 'var(--c-surface2)' }}>
                  <span className="text-base">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--g-primary)', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                    {t.prenom?.[0]}{t.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--c-text)' }}>
                      {t.prenom} {t.nom}
                    </p>
                    {t.titre && <p className="text-xs truncate" style={{ color: 'var(--c-text-muted)' }}>{t.titre}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <span style={{ color: '#fbbf24', fontSize: 12 }}>★</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--c-warning)' }}>
                      {Number(t.note_moyenne || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}