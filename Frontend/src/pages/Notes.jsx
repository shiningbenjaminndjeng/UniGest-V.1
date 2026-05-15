// src/pages/Notes.jsx — responsive mobile
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FileText, Plus, Trash2, Table, Image, Upload, X } from 'lucide-react';

const TYPE_ICONS = { document: Upload, table: Table, image: Image };

const TableEditor = ({ onChange }) => {
  const [headers, setHeaders] = useState(['Matricule', 'Nom', 'Note']);
  const [rows, setRows] = useState([['', '', '']]);

  const updateHeader = (i, v) => { const h = [...headers]; h[i] = v; setHeaders(h); emitChange(h, rows); };
  const updateCell   = (r, c, v) => { const nr = rows.map((row,ri) => ri===r ? row.map((cell,ci) => ci===c ? v : cell) : row); setRows(nr); emitChange(headers, nr); };
  const addRow  = () => { const nr = [...rows, new Array(headers.length).fill('')]; setRows(nr); emitChange(headers, nr); };
  const addCol  = () => { const nh = [...headers, `Col ${headers.length+1}`]; const nr = rows.map(r => [...r,'']); setHeaders(nh); setRows(nr); emitChange(nh,nr); };
  const removeRow = (i) => { const nr = rows.filter((_,ri) => ri!==i); setRows(nr); emitChange(headers,nr); };
  const emitChange = (h, r) => onChange(JSON.stringify({ headers: h, rows: r }));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--c-border)' }}>
        <table className="w-full text-xs" style={{ minWidth: '280px' }}>
          <thead>
            <tr style={{ background: 'var(--c-surface2)' }}>
              {headers.map((h, i) => (
                <th key={i} className="p-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
                  <input value={h} onChange={e => updateHeader(i, e.target.value)}
                    className="bg-transparent text-center font-semibold outline-none w-full"
                    style={{ color: 'var(--c-primary)', minWidth: '60px' }} />
                </th>
              ))}
              <th className="p-2 border-b" style={{ borderColor: 'var(--c-border)', width: '32px' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b" style={{ borderColor: 'var(--c-border)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} className="p-1">
                    <input value={cell} onChange={e => updateCell(ri, ci, e.target.value)}
                      className="w-full bg-transparent px-2 py-1 rounded outline-none text-center"
                      style={{ color: 'var(--c-text)', minWidth: '60px' }} placeholder="—" />
                  </td>
                ))}
                <td className="p-1 text-center">
                  <button type="button" onClick={() => removeRow(ri)}
                    className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--c-danger)' }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={addRow} className="btn-outline text-xs py-1.5 px-3">+ Ligne</button>
        <button type="button" onClick={addCol} className="btn-outline text-xs py-1.5 px-3">+ Colonne</button>
      </div>
    </div>
  );
};

const TableViewer = ({ data }) => {
  try {
    const { headers, rows } = JSON.parse(data);
    return (
      <div className="overflow-x-auto rounded-xl border mt-2" style={{ borderColor: 'var(--c-border)' }}>
        <table className="w-full text-xs" style={{ minWidth: '200px' }}>
          <thead>
            <tr style={{ background: 'var(--c-surface2)' }}>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--c-primary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t" style={{ borderColor: 'var(--c-border)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2" style={{ color: 'var(--c-text)' }}>{cell || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch { return <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Table invalide</p>; }
};

export default function Notes() {
  const { user, isDelegue, isProf } = useAuth();
  const [notes, setNotes]       = useState([]);
  const [ues, setUes]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [typeForm, setTypeForm] = useState('document');
  const [form, setForm]         = useState({ titre: '', description: '', ue_id: '' });
  const [fichier, setFichier]   = useState(null);
  const [tableData, setTableData] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canAdd = isDelegue() || isProf();

  const fetchAll = async () => {
    try {
      const [notesRes, uesRes] = await Promise.all([
        api.get(`/notes/filiere/${user.filiere_id}/niveau/${user.niveau_id}`),
        api.get(`/ues/filiere/${user.filiere_id}/niveau/${user.niveau_id}`),
      ]);
      setNotes(notesRes.data.notes || []);
      setUes([...(uesRes.data.semestre1 || []), ...(uesRes.data.semestre2 || [])]);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('titre', form.titre);
      fd.append('description', form.description || '');
      fd.append('type', typeForm);
      fd.append('filiere_id', user.filiere_id);
      fd.append('niveau_id',  user.niveau_id);
      if (form.ue_id) fd.append('ue_id', form.ue_id);
      if (typeForm === 'table') fd.append('contenu', tableData);
      else if (fichier)         fd.append('fichier', fichier);
      await api.post('/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Note publiée !');
      setShowForm(false);
      setForm({ titre: '', description: '', ue_id: '' });
      setFichier(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette note ?')) return;
    try { await api.delete(`/notes/${id}`); toast.success('Supprimée'); fetchAll(); }
    catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-4 md:space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl" style={{ fontFamily: 'Outfit, sans-serif' }}>Notes & Résultats</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            {notes.length} document(s) publié(s)
          </p>
        </div>
        {canAdd && (
          <button onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
            <Plus size={15} /> <span className="hidden sm:inline">Publier</span>
          </button>
        )}
      </div>

      {/* Formulaire */}
      {showForm && canAdd && (
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm md:text-base">Publier des notes</h3>
            <button onClick={() => setShowForm(false)}><X size={18} style={{ color: 'var(--c-text-muted)' }} /></button>
          </div>

          {/* Type selector scrollable */}
          <div className="tabs-scroll mb-4">
            {[
              { v: 'document', icon: Upload, label: 'Fichier' },
              { v: 'table',    icon: Table,  label: 'Tableau' },
              { v: 'image',    icon: Image,  label: 'Image'   },
            ].map(({ v, icon: Icon, label }) => (
              <button key={v} type="button" onClick={() => setTypeForm(v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-medium flex-shrink-0 transition-all"
                style={{
                  borderColor: typeForm === v ? 'var(--c-primary)' : 'var(--c-border)',
                  background:  typeForm === v ? 'rgba(79,142,247,0.1)' : 'transparent',
                  color:       typeForm === v ? 'var(--c-primary)' : 'var(--c-text-muted)',
                }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>Titre *</label>
                <input className="input text-sm" placeholder="Résultats examen S1" value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>UE concernée</label>
                <select className="select text-sm" value={form.ue_id}
                  onChange={e => setForm(f => ({ ...f, ue_id: e.target.value }))}>
                  <option value="">— Toutes les UE —</option>
                  {ues.map(ue => <option key={ue.id} value={ue.id}>{ue.code} — {ue.nom}</option>)}
                </select>
              </div>
            </div>

            {typeForm === 'table' && <TableEditor onChange={setTableData} />}

            {(typeForm === 'document' || typeForm === 'image') && (
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>
                  {typeForm === 'image' ? 'Image (JPG, PNG)' : 'Document (PDF, Word, Excel)'}
                </label>
                <input type="file" className="input text-sm"
                  accept={typeForm === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx'}
                  onChange={e => setFichier(e.target.files[0])} />
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={submitting}
                className="btn-primary text-sm flex-1 justify-center flex items-center gap-2">
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Publier
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 card">
          <FileText size={40} className="mx-auto mb-3 opacity-20" />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucune note publiée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => {
            const TypeIcon = TYPE_ICONS[note.type] || FileText;
            return (
              <div key={note.id} className="card-hover" style={{ padding: '1rem' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(79,142,247,0.15)' }}>
                    <TypeIcon size={16} style={{ color: 'var(--c-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--c-text)' }}>{note.titre}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs flex-wrap" style={{ color: 'var(--c-text-muted)' }}>
                          <span className={`badge ${note.auteur_rang === 'professeur' ? 'badge-prof' : 'badge-delegue'}`} style={{ fontSize: 10 }}>
                            {note.auteur_rang}
                          </span>
                          <span>{note.auteur_prenom} {note.auteur_nom}</span>
                          {note.ue_nom && <span className="hidden sm:inline">· {note.ue_nom}</span>}
                          <span>· {new Date(note.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      {canAdd && note.created_by === user.id && (
                        <button onClick={() => handleDelete(note.id)}
                          className="p-1.5 rounded-xl flex-shrink-0" style={{ color: 'var(--c-danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {note.type === 'table'    && note.contenu && <TableViewer data={note.contenu} />}
                    {note.type === 'image'    && note.contenu && (
                      <img src={note.contenu} alt={note.titre}
                        className="mt-2 rounded-xl w-full object-contain" style={{ maxHeight: '200px' }} />
                    )}
                    {note.type === 'document' && note.contenu && (
                      <a href={note.contenu} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl text-xs"
                        style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--c-primary)' }}>
                        <Upload size={12} /> Télécharger
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}