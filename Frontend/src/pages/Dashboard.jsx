// src/pages/Dashboard.jsx — Tableau de bord principal
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Users, BookOpen, Calendar, FileText, GraduationCap, Award } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card-hover">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm mb-1" style={{ color: 'var(--c-text-muted)' }}>{label}</p>
        <p className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color }}>{value}</p>
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: `${color}20` }}>
        <Icon size={22} style={{ color }} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, isProf } = useAuth();
  const [stats, setStats] = useState(null);
  const [evenements, setEvenements] = useState([]);

  useEffect(() => {
    if (user?.filiere_id && user?.niveau_id) {
      api.get(`/filieres/${user.filiere_id}/niveau/${user.niveau_id}/stats`)
        .then(r => setStats(r.data.stats)).catch(() => {});

      api.get(`/evenements/filiere/${user.filiere_id}/niveau/${user.niveau_id}`)
        .then(r => setEvenements(r.data.evenements?.slice(0, 5))).catch(() => {});
    }
  }, [user]);

  const RANG_LABELS = {
    etudiant: { label: 'Étudiant', color: 'var(--c-primary)', badge: 'badge-etudiant' },
    delegue: { label: 'Délégué', color: 'var(--c-delegue)', badge: 'badge-delegue' },
    professeur: { label: 'Professeur', color: 'var(--c-prof)', badge: 'badge-prof' }
  };
  const rangInfo = RANG_LABELS[user?.rang] || {};

  return (
    <div className="space-y-6 fade-in">
      {/* Header de bienvenue */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            Bonjour, {user?.prenom} 👋
          </h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '15px' }}>
            {user?.filiere_nom} · {user?.niveau_code || 'Toutes filières'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${rangInfo.badge}`}>{rangInfo.label}</span>
          {user?.matricule && (
            <span className="text-xs px-3 py-1 rounded-lg" style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              {user.matricule}
            </span>
          )}
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Étudiants" value={stats.nb_etudiants} color="var(--c-primary)" />
          <StatCard icon={Award} label="Délégués" value={stats.nb_delegues} color="var(--c-delegue)" />
          <StatCard icon={GraduationCap} label="Professeurs" value={stats.nb_professeurs} color="var(--c-prof)" />
          <StatCard icon={BookOpen} label="UE / Cours" value={stats.nb_ues} color="var(--c-accent)" />
        </div>
      )}

      {/* Grille info + événements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carte profil */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Mon profil</h2>
          <div className="space-y-3">
            {[
              { label: 'Nom complet', value: `${user?.prenom} ${user?.nom}` },
              { label: 'Email', value: user?.email },
              { label: 'Rang', value: rangInfo.label },
              { label: 'Filière', value: user?.filiere_nom },
              { label: 'Faculté', value: user?.faculte_nom },
              { label: 'Niveau', value: user?.niveau_libelle || '—' },
              { label: 'Matricule', value: user?.matricule || '—' },
              { label: 'Année scolaire', value: user?.annee_libelle },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b"
                style={{ borderColor: 'var(--c-border)' }}>
                <span className="text-sm" style={{ color: 'var(--c-text-muted)' }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--c-text)', maxWidth: '60%', textAlign: 'right' }}>
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers événements */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Derniers événements</h2>
          {evenements.length === 0 ? (
            <div className="text-center py-10" style={{ color: 'var(--c-text-muted)' }}>
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun événement pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {evenements.map(ev => (
                <div key={ev.id} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--c-surface2)' }}>
                  <span className="text-xl">
                    {ev.type === 'evaluation' ? '📝' : ev.type === 'conference' ? '🎙️' : ev.type === 'fete' ? '🎉' : '📌'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{ev.titre}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                      Par {ev.auteur_prenom} {ev.auteur_nom} · {new Date(ev.created_at).toLocaleDateString('fr-FR')}
                    </p>
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