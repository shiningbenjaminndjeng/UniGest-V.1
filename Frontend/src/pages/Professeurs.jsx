// src/pages/Professeurs.jsx — Liste des professeurs et leurs UE
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { BookOpen, Users, GraduationCap } from 'lucide-react';

export default function Professeurs() {
  const { user } = useAuth();
  const [professeurs, setProfesseurs] = useState([]);
  const [ues, setUes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.filiere_id && user?.niveau_id) {
      Promise.all([
        api.get(`/etudiants/filiere/${user.filiere_id}/niveau/${user.niveau_id}/professeurs`),
        api.get(`/ues/filiere/${user.filiere_id}/niveau/${user.niveau_id}`)
      ]).then(([profRes, ueRes]) => {
        setProfesseurs(profRes.data.professeurs || []);
        setUes([...(ueRes.data.semestre1 || []), ...(ueRes.data.semestre2 || [])]);
      }).catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Associer UE → profs
  const getUesDuProf = (profId) =>
    ues.filter(ue => ue.professeurs?.some(p => p.id === profId));

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>Professeurs</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
          {professeurs.length} professeur(s) dans ce niveau
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--c-text-muted)' }}>Chargement...</div>
      ) : professeurs.length === 0 ? (
        <div className="text-center py-16 card">
          <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucun professeur assigné pour l'instant</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {professeurs.map((prof) => {
            const sesUes = getUesDuProf(prof.id);
            return (
              <div key={prof.id} className="card-hover">
                <div className="flex items-start gap-4">
                  {/* Avatar prof */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
                    style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--c-prof)', fontFamily: 'Syne, sans-serif' }}>
                    {prof.prenom?.[0]}{prof.nom?.[0]}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold" style={{ color: 'var(--c-text)' }}>
                        Prof. {prof.prenom} {prof.nom}
                      </h3>
                      <span className="badge badge-prof">Professeur</span>
                    </div>
                    {prof.email && (
                      <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{prof.email}</p>
                    )}

                    {/* UE enseignées */}
                    {sesUes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--c-text-muted)' }}>
                          Unités enseignées ({sesUes.length}) :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {sesUes.map(ue => (
                            <div key={ue.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                              style={{ background: 'rgba(91,115,255,0.1)', color: 'var(--c-primary)' }}>
                              <BookOpen size={11} />
                              <span className="font-mono font-semibold">{ue.code}</span>
                              <span style={{ color: 'var(--c-text-muted)' }}>·</span>
                              <span>{ue.nom}</span>
                              <span className="flex items-center gap-1 ml-1" style={{ color: 'var(--c-text-muted)' }}>
                                <Users size={10} /> {ue.nb_inscrits}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--c-prof)' }}>
                      {sesUes.length}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>UE</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section UE sans professeur */}
      {ues.filter(ue => !ue.professeurs || ue.professeurs.length === 0).length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-3" style={{ color: 'var(--c-warning)' }}>
            ⚠️ UE sans professeur assigné
          </h3>
          <div className="space-y-2">
            {ues.filter(ue => !ue.professeurs || ue.professeurs.length === 0).map(ue => (
              <div key={ue.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--c-surface2)' }}>
                <span className="text-xs font-mono px-2 py-1 rounded"
                  style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--c-warning)' }}>
                  {ue.code}
                </span>
                <span className="text-sm" style={{ color: 'var(--c-text)' }}>{ue.nom}</span>
                <span className="text-xs ml-auto" style={{ color: 'var(--c-text-muted)' }}>
                  Sem. {ue.semestre}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}