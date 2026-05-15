// src/pages/Etudiants.jsx — Liste des étudiants responsive mobile
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
  const nbDelegues  = etudiants.filter(e => e.rang === 'delegue').length;

  const RANG_STYLE = {
    etudiant: { badge: 'badge-etudiant' },
    delegue:  { badge: 'badge-delegue'  },
  };

  return (
    <div className="space-y-4 md:space-y-6 fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl" style={{ fontFamily: 'Outfit, sans-serif' }}>Étudiants</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
          {user?.filiere_nom} · {user?.niveau_code}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',      value: etudiants.length, color: 'var(--c-text)',    icon: Users },
          { label: 'Étudiants', value: nbEtudiants,       color: 'var(--c-primary)', icon: User  },
          { label: 'Délégués',  value: nbDelegues,        color: 'var(--c-delegue)', icon: Award },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-3" style={{ padding: '0.75rem 1rem' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold leading-none"
                style={{ fontFamily: 'Outfit, sans-serif', color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Nom, prénom ou matricule..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Tabs filtre scrollables */}
        <div className="tabs-scroll">
          {['tous', 'etudiant', 'delegue'].map(f => (
            <button key={f} onClick={() => setFiltre(f)} className={`tab flex-shrink-0 ${filtre === f ? 'active' : ''}`}>
              {f === 'tous' ? `Tous (${etudiants.length})` : f === 'etudiant' ? `Étudiants (${nbEtudiants})` : `Délégués (${nbDelegues})`}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="shimmer h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 card">
          <Users size={40} className="mx-auto mb-3 opacity-20" />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucun étudiant trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((e, i) => (
            <div key={e.id} className="card-hover" style={{ padding: '1rem', animationDelay: `${i * 20}ms` }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: e.rang === 'delegue' ? 'rgba(167,139,250,0.15)' : 'rgba(91,115,255,0.15)',
                    color:      e.rang === 'delegue' ? 'var(--c-delegue)'        : 'var(--c-primary)',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                  {e.prenom?.[0]}{e.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm truncate" style={{ color: 'var(--c-text)' }}>
                      {e.prenom} {e.nom}
                    </span>
                    {e.rang === 'delegue' && <span className="text-sm">🏛️</span>}
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
                <span className={`badge ${RANG_STYLE[e.rang]?.badge} flex-shrink-0`}>{e.rang}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}