// src/pages/Explorer.jsx — Exploration des autres filières (lecture seule)
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Compass, ChevronRight, Users, BookOpen, Lock, ArrowLeft } from 'lucide-react';

const FACULTE_COLORS = {
  'FLASH': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', emoji: '📚' },
  'FS':    { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', emoji: '🔬' },
  'FMSB':  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', emoji: '🏥' },
  'FSE':   { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', emoji: '🎓' },
};

export default function Explorer() {
  const { user } = useAuth();
  const [facultes, setFacultes] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaculte, setSelectedFaculte] = useState(null);
  const [selectedFiliere, setSelectedFiliere] = useState(null);
  const [selectedNiveau, setSelectedNiveau] = useState(null);
  const [niveaux, setNiveaux] = useState([]);
  const [view, setView] = useState('facultes'); // facultes | filieres | niveaux | detail

  useEffect(() => {
    api.get('/facultes').then(r => setFacultes(r.data.facultes || []))
      .finally(() => setLoading(false));
  }, []);

  const openFaculte = async (faculte) => {
    setSelectedFaculte(faculte);
    const r = await api.get(`/facultes/${faculte.id}/filieres`);
    setFilieres(r.data.filieres || []);
    setView('filieres');
  };

  const openFiliere = async (filiere) => {
    setSelectedFiliere(filiere);
    const r = await api.get(`/filieres/${filiere.id}/niveaux`, { params: { filiere_id: filiere.id } });
    setNiveaux(r.data.niveaux || []);
    setView('niveaux');
  };

  const openNiveau = async (niveau) => {
    setSelectedNiveau(niveau);
    try {
      const r = await api.get(`/etudiants/filiere/${selectedFiliere.id}/niveau/${niveau.id}`);
      setEtudiants(r.data.etudiants || []);
    } catch {}
    setView('detail');
  };

  const isMyFiliere = selectedFiliere?.id === user?.filiere_id;

  const NIVEAUX_ORDER = ['L1', 'L2', 'L3', 'M1', 'M2', 'DOCTORAT'];

  // Trier niveaux
  const sortedNiveaux = [...niveaux].sort((a, b) =>
    NIVEAUX_ORDER.indexOf(a.code) - NIVEAUX_ORDER.indexOf(b.code)
  );

  return (
    <div className="space-y-6 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--c-text-muted)' }}>
        <button onClick={() => { setView('facultes'); setSelectedFaculte(null); setSelectedFiliere(null); }}
          className="hover:underline" style={{ color: view !== 'facultes' ? 'var(--c-primary)' : 'var(--c-text)' }}>
          Facultés
        </button>
        {selectedFaculte && (
          <>
            <ChevronRight size={14} />
            <button onClick={() => { setView('filieres'); setSelectedFiliere(null); }}
              style={{ color: view === 'filieres' ? 'var(--c-text)' : 'var(--c-primary)' }}
              className="hover:underline">
              {selectedFaculte.code}
            </button>
          </>
        )}
        {selectedFiliere && (
          <>
            <ChevronRight size={14} />
            <button onClick={() => setView('niveaux')}
              style={{ color: view === 'niveaux' ? 'var(--c-text)' : 'var(--c-primary)' }}
              className="hover:underline">
              {selectedFiliere.nom}
            </button>
          </>
        )}
        {selectedNiveau && view === 'detail' && (
          <>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--c-text)' }}>{selectedNiveau.code}</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        {view !== 'facultes' && (
          <button onClick={() => {
            if (view === 'detail') setView('niveaux');
            else if (view === 'niveaux') setView('filieres');
            else setView('facultes');
          }} className="p-2 rounded-xl transition-colors" style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>Explorer</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            Parcourez les autres filières de l'université (lecture seule)
          </p>
        </div>
      </div>

      {/* Vue: Facultés */}
      {view === 'facultes' && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facultes.map(fac => {
            const style = FACULTE_COLORS[fac.code] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', emoji: '🏛️' };
            return (
              <button key={fac.id} onClick={() => openFaculte(fac)}
                className="card-hover text-left">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: style.bg }}>
                    {style.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base" style={{ color: style.color, fontFamily: 'Syne, sans-serif' }}>
                      {fac.code}
                    </div>
                    <div className="text-sm mt-0.5" style={{ color: 'var(--c-text)' }}>{fac.nom}</div>
                    {fac.description && (
                      <div className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>{fac.description}</div>
                    )}
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--c-text-muted)' }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Vue: Filières */}
      {view === 'filieres' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>
            {filieres.length} filière(s) dans {selectedFaculte?.nom}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filieres.map(f => {
              const isOwn = f.id === user?.filiere_id;
              return (
                <button key={f.id} onClick={() => openFiliere(f)}
                  className="card-hover text-left relative"
                  style={{ borderColor: isOwn ? 'var(--c-primary)' : undefined }}>
                  {isOwn && (
                    <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(91,115,255,0.2)', color: 'var(--c-primary)' }}>
                      Ma filière
                    </span>
                  )}
                  <div className="font-semibold" style={{ color: isOwn ? 'var(--c-primary)' : 'var(--c-text)' }}>
                    {f.nom}
                  </div>
                  {f.code && (
                    <div className="text-xs mt-1" style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      Code: {f.code}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--c-text-muted)' }}>
                    <Users size={11} /> {f.nb_etudiants || 0} étudiant(s)
                  </div>
                  <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Vue: Niveaux */}
      {view === 'niveaux' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Niveaux — {selectedFiliere?.nom}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sortedNiveaux.map(n => {
              const isOwnNiveau = isMyFiliere && n.id === user?.niveau_id;
              return (
                <button key={n.id} onClick={() => openNiveau(n)}
                  className="card-hover text-left"
                  style={{ borderColor: isOwnNiveau ? 'var(--c-primary)' : undefined }}>
                  <div className="text-xl font-bold mb-1" style={{
                    fontFamily: 'Syne, sans-serif',
                    color: isOwnNiveau ? 'var(--c-primary)' : 'var(--c-text)'
                  }}>
                    {n.code}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{n.libelle}</div>
                  {n.nb_etudiants > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--c-text-muted)' }}>
                      <Users size={10} /> {n.nb_etudiants}
                    </div>
                  )}
                  {isOwnNiveau && <div className="text-xs mt-1" style={{ color: 'var(--c-primary)' }}>Mon niveau</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Vue: Détail (lecture seule si autre filière) */}
      {view === 'detail' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border flex items-center gap-3" style={{
            background: isMyFiliere ? 'rgba(91,115,255,0.08)' : 'rgba(245,158,11,0.08)',
            borderColor: isMyFiliere ? 'rgba(91,115,255,0.3)' : 'rgba(245,158,11,0.3)'
          }}>
            {!isMyFiliere && <Lock size={16} style={{ color: 'var(--c-warning)' }} />}
            <p className="text-sm" style={{ color: isMyFiliere ? 'var(--c-primary)' : 'var(--c-warning)' }}>
              {isMyFiliere ? '✅ Votre filière' : '👁️ Lecture seule — vous ne pouvez qu\'observer'}
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">
              {selectedFiliere?.nom} · {selectedNiveau?.code}
              <span className="ml-3 text-sm font-normal" style={{ color: 'var(--c-text-muted)' }}>
                {etudiants.length} membre(s)
              </span>
            </h3>

            {etudiants.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--c-text-muted)' }}>Aucun étudiant inscrit</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {etudiants.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--c-surface2)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{
                        background: e.rang === 'delegue' ? 'rgba(167,139,250,0.15)' : 'rgba(91,115,255,0.15)',
                        color: e.rang === 'delegue' ? 'var(--c-delegue)' : 'var(--c-primary)'
                      }}>
                      {e.prenom?.[0]}{e.nom?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                        {e.prenom} {e.nom}
                      </p>
                      {e.matricule && (
                        <p className="text-xs" style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {e.matricule}
                        </p>
                      )}
                    </div>
                    <span className={`badge ml-auto ${e.rang === 'delegue' ? 'badge-delegue' : 'badge-etudiant'}`}>
                      {e.rang}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}