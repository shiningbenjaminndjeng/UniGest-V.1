// src/pages/Etudiants.jsx — Liste des étudiants et délégués
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Users, Search, Award, User } from 'lucide-react';

export default function Etudiants() {
  const { user } = useAuth();
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('tous');

  useEffect(() => {
    if (user?.filiere_id && user?.niveau_id) {
      api.get(`/etudiants/filiere/${user.filiere_id}/niveau/${user.niveau_id}`)
        .then(r => setEtudiants(r.data.etudiants || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filtered = etudiants.filter(e => {
    const matchSearch = `${e.nom} ${e.prenom} ${e.matricule || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchFiltre = filtre === 'tous' || e.rang === filtre;
    return matchSearch && matchFiltre;
  });

  const nbEtudiants = etudiants.filter(e => e.rang === 'etudiant').length;
  const nbDelegues = etudiants.filter(e => e.rang === 'delegue').length;

  const RANG_STYLE = {
    etudiant: { badge: 'badge-etudiant', icon: '🎒' },
    delegue: { badge: 'badge-delegue', icon: '🏛️' }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>Étudiants</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
          {user?.filiere_nom} · {user?.niveau_code}
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: etudiants.length, color: 'var(--c-text)', icon: Users },
          { label: 'Étudiants', value: nbEtudiants, color: 'var(--c-primary)', icon: User },
          { label: 'Délégués', value: nbDelegues, color: 'var(--c-delegue)', icon: Award },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}20` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres + Recherche */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Rechercher par nom, prénom ou matricule..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['tous', 'etudiant', 'delegue'].map(f => (
            <button key={f} onClick={() => setFiltre(f)} className={`tab ${filtre === f ? 'active' : ''}`}>
              {f === 'tous' ? 'Tous' : f === 'etudiant' ? 'Étudiants' : 'Délégués'}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--c-text-muted)' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucun étudiant trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((e, i) => (
            <div key={e.id} className="card-hover" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: e.rang === 'delegue' ? 'rgba(167,139,250,0.15)' : 'rgba(91,115,255,0.15)',
                    color: e.rang === 'delegue' ? 'var(--c-delegue)' : 'var(--c-primary)',
                    fontFamily: 'Syne, sans-serif'
                  }}>
                  {e.prenom?.[0]}{e.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate" style={{ color: 'var(--c-text)' }}>
                      {e.prenom} {e.nom}
                    </span>
                    {e.rang === 'delegue' && (
                      <span className="text-xs">🏛️</span>
                    )}
                  </div>
                  {e.matricule && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {e.matricule}
                    </p>
                  )}
                  {e.email && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-text-muted)' }}>{e.email}</p>
                  )}
                </div>
                <span className={`badge ${RANG_STYLE[e.rang]?.badge} flex-shrink-0`}>
                  {e.rang}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}