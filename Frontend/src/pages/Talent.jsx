// src/pages/Talent.jsx — responsive mobile
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Search, Star, Phone, Mail, ExternalLink, Globe,
  Zap, Award, BookOpen, Code, Users, Trophy, MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SKILL_TYPE_MAP = {
  technique:      { color: 'var(--c-primary)',  tag: 'skill-tag-tech',     icon: Code      },
  pratique:       { color: 'var(--c-prof)',      tag: 'skill-tag-pratique', icon: Zap       },
  specialisation: { color: 'var(--c-delegue)',   tag: 'skill-tag-spec',     icon: Star      },
  certification:  { color: 'var(--c-warning)',   tag: 'skill-tag-cert',     icon: Award     },
  etudes:         { color: 'var(--c-accent)',    tag: 'skill-tag-etudes',   icon: BookOpen  },
};

const StarDisplay = ({ value = 0, nb = 0 }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(value) ? '#fbbf24' : 'var(--c-border2)', fontSize: 13 }}>★</span>
      ))}
    </div>
    <span className="text-xs font-bold" style={{ color: 'var(--c-warning)' }}>{Number(value || 0).toFixed(1)}</span>
    <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>({nb})</span>
  </div>
);

function TalentCard({ comp, onRate, onMessage, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  const [rating, setRating] = useState(false);
  const isMe = comp.user_id === currentUserId;

  const skills     = comp.items || [];
  const techSkills = skills.filter(s => s.type === 'technique').slice(0, 3);
  const otherSkills= skills.filter(s => s.type !== 'technique').slice(0, 3);

  const handleRate = async (note) => {
    if (isMe) return toast.error('Vous ne pouvez pas vous noter');
    setRating(true);
    try { await onRate(comp.user_id, note); setMyRating(note); toast.success(`Note ${note}/5 !`); }
    catch {}
    finally { setRating(false); }
  };

  const bannerBg = comp.banniere_url
    ? `url(${comp.banniere_url}) center/cover`
    : comp.rang === 'delegue' ? 'linear-gradient(135deg,#4f8ef7,#a855f7)' : 'linear-gradient(135deg,#4f8ef7,#06d6a0)';

  return (
    <div className="talent-card">
      <div className="banner" style={{ background: bannerBg }}>
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
        {comp.disponible && (
          <span className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(16,217,123,0.9)', color: 'white' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Dispo
          </span>
        )}
      </div>

      <div className="p-3 pt-0">
        <div className="flex items-end gap-2 -mt-6 mb-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border-2 relative z-10"
            style={{ background: 'var(--g-primary)', color: 'white', border: '2px solid var(--c-surface)', fontFamily: 'Outfit, sans-serif' }}>
            {comp.prenom?.[0]}{comp.nom?.[0]}
          </div>
          <div className="flex-1 pb-0.5 min-w-0">
            <p className="font-black text-sm leading-tight truncate" style={{ color: 'var(--c-text)', fontFamily: 'Outfit, sans-serif' }}>
              {comp.prenom} {comp.nom}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--c-text-muted)' }}>{comp.niveau_code}</p>
          </div>
        </div>

        {comp.titre && (
          <p className="text-xs font-semibold mb-1.5 px-2 py-0.5 rounded-lg inline-block"
            style={{ background: 'var(--c-primary-glow2)', color: 'var(--c-primary)' }}>
            {comp.titre}
          </p>
        )}

        <div className="mb-2"><StarDisplay value={comp.note_moyenne} nb={comp.nb_votes} /></div>

        {techSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {techSkills.map(s => <span key={s.id} className="skill-tag skill-tag-tech" style={{ fontSize: 11 }}>{s.libelle}</span>)}
          </div>
        )}

        {comp.bio && !expanded && (
          <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--c-text-muted)' }}>{comp.bio}</p>
        )}

        {expanded && (
          <div className="space-y-2 fade-in">
            {comp.bio && <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>{comp.bio}</p>}
            {otherSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {otherSkills.map(s => {
                  const st = SKILL_TYPE_MAP[s.type] || SKILL_TYPE_MAP.technique;
                  return <span key={s.id} className={`skill-tag ${st.tag}`} style={{ fontSize: 11 }}>{s.libelle}</span>;
                })}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {comp.telephone && (
                <a href={`tel:${comp.telephone}`} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                  style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}>
                  <Phone size={10} style={{ color: 'var(--c-primary)' }} /> Tel
                </a>
              )}
              {comp.email_contact && (
                <a href={`mailto:${comp.email_contact}`} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                  style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}>
                  <Mail size={10} style={{ color: 'var(--c-primary)' }} /> Email
                </a>
              )}
              {comp.github && (
                <a href={comp.github.startsWith('http') ? comp.github : `https://${comp.github}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                  style={{ background: 'var(--c-surface2)', color: 'var(--c-text)' }}>
                  <ExternalLink size={10} /> GitHub
                </a>
              )}
            </div>
            {!isMe && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Évaluer</p>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="cursor-pointer transition-all"
                      style={{
                        fontSize: 20,
                        color: i <= (hoverRating || myRating || 0) ? '#fbbf24' : 'var(--c-border2)',
                      }}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => handleRate(i)}>★</span>
                  ))}
                  {rating && <span className="text-xs ml-1" style={{ color: 'var(--c-text-muted)' }}>...</span>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 pt-2 border-t" style={{ borderColor: 'var(--c-border)' }}>
          <button onClick={() => setExpanded(!expanded)}
            className="flex-1 text-xs py-1.5 rounded-lg font-medium"
            style={{ background: expanded ? 'var(--c-surface2)' : 'rgba(79,142,247,0.1)', color: expanded ? 'var(--c-text-muted)' : 'var(--c-primary)' }}>
            {expanded ? 'Réduire' : 'Voir plus'}
          </button>
          {!isMe && (
            <button onClick={() => onMessage(comp.user_id)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium"
              style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
              <MessageSquare size={12} /> Msg
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Talent() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [competences, setCompetences] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filtreType, setFiltreType]   = useState('tous');

  const fetchComps = async () => {
    try {
      const r = await api.get(`/competences/filiere/${user.filiere_id}`, { params: { search: search || undefined } });
      setCompetences(r.data.competences || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchComps(); }, [user]);
  useEffect(() => { const t = setTimeout(() => { if (user) fetchComps(); }, 400); return () => clearTimeout(t); }, [search]);

  const handleRate    = async (userId, note) => { const r = await api.post(`/competences/${userId}/rate`, { note }); fetchComps(); return r.data; };
  const handleMessage = (userId) => navigate(`/messagerie?user=${userId}`);

  const filtered = filtreType === 'tous' ? competences : competences.filter(c => c.items?.some(i => i.type === filtreType));
  const topComps = [...competences].sort((a, b) => (b.note_moyenne || 0) - (a.note_moyenne || 0)).slice(0, 3);

  return (
    <div className="space-y-4 md:space-y-6 fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl gradient-text">Compétences & Talents</h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
          {competences.length} profil(s) dans votre filière
        </p>
      </div>

      {/* Top 3 */}
      {topComps.length >= 3 && (
        <div className="card">
          <h3 className="font-bold mb-3 text-sm flex items-center gap-2">
            <Trophy size={16} style={{ color: 'var(--c-warning)' }} /> Top compétences
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {topComps.map((comp, idx) => (
              <div key={comp.user_id} className="text-center p-2.5 rounded-xl" style={{ background: 'var(--c-surface2)' }}>
                <div className="text-xl mb-1">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                <div className="w-9 h-9 rounded-xl mx-auto mb-1 flex items-center justify-center font-bold text-xs"
                  style={{ background: 'var(--g-primary)', color: 'white' }}>
                  {comp.prenom?.[0]}{comp.nom?.[0]}
                </div>
                <p className="text-xs font-bold truncate" style={{ color: 'var(--c-text)' }}>{comp.prenom}</p>
                <div className="flex justify-center mt-0.5">
                  <span style={{ color: '#fbbf24', fontSize: 11 }}>★</span>
                  <span className="text-xs font-bold ml-0.5" style={{ color: 'var(--c-warning)' }}>
                    {Number(comp.note_moyenne || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Chercher un talent ou une compétence..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tabs-scroll">
          <button onClick={() => setFiltreType('tous')} className={`tab flex-shrink-0 text-xs ${filtreType === 'tous' ? 'active' : ''}`}>Tous</button>
          {Object.entries(SKILL_TYPE_MAP).map(([type, st]) => {
            const Icon = st.icon;
            return (
              <button key={type} onClick={() => setFiltreType(type)}
                className={`tab flex-shrink-0 text-xs flex items-center gap-1 ${filtreType === type ? 'active' : ''}`}>
                <Icon size={11} /> {type}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="shimmer h-56 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 card">
          <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--c-text-dim)' }} />
          <p style={{ color: 'var(--c-text-muted)' }}>
            {search ? 'Aucun résultat' : 'Aucun profil de compétences'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger">
          {filtered.map(comp => (
            <TalentCard key={comp.user_id} comp={comp} onRate={handleRate}
              onMessage={handleMessage} currentUserId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}