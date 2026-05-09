// src/pages/Notes.jsx — Gestion des notes et résultats
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FileText, Plus, Trash2, Table, Image, Upload } from 'lucide-react';

const TYPE_ICONS = { document: Upload, table: Table, image: Image };

// Mini éditeur de table dynamique
const TableEditor = ({ onChange }) => {
  const [headers, setHeaders] = useState(['Matricule', 'Nom', 'Prénom', 'Note']);
  const [rows, setRows] = useState([['', '', '', '']]);

  const updateHeader = (i, v) => {
    const h = [...headers]; h[i] = v; setHeaders(h);
    emitChange(h, rows);
  };

  const updateCell = (r, c, v) => {
    const newRows = rows.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? v : cell) : row);
    setRows(newRows);
    emitChange(headers, newRows);
  };

  const addRow = () => {
    const newRows = [...rows, new Array(headers.length).fill('')];
    setRows(newRows);
    emitChange(headers, newRows);
  };

  const addCol = () => {
    const newHeaders = [...headers, `Colonne ${headers.length + 1}`];
    const newRows = rows.map(r => [...r, '']);
    setHeaders(newHeaders); setRows(newRows);
    emitChange(newHeaders, newRows);
  };

  const removeRow = (i) => {
    const newRows = rows.filter((_, ri) => ri !== i);
    setRows(newRows);
    emitChange(headers, newRows);
  };

  const emitChange = (h, r) => onChange(JSON.stringify({ headers: h, rows: r }));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--c-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--c-surface2)' }}>
              {headers.map((h, i) => (
                <th key={i} className="p-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
                  <input value={h} onChange={e => updateHeader(i, e.target.value)}
                    className="bg-transparent text-center font-semibold outline-none w-full"
                    style={{ color: 'var(--c-primary)' }} />
                </th>
              ))}
              <th className="p-2 border-b" style={{ borderColor: 'var(--c-border)', width: '40px' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b" style={{ borderColor: 'var(--c-border)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} className="p-1">
                    <input value={cell} onChange={e => updateCell(ri, ci, e.target.value)}
                      className="w-full bg-transparent px-2 py-1 rounded outline-none text-center"
                      style={{ color: 'var(--c-text)' }}
                      placeholder="—" />
                  </td>
                ))}
                <td className="p-1 text-center">
                  <button type="button" onClick={() => removeRow(ri)}
                    className="text-xs px-2 py-1 rounded hover:bg-red-500/20"
                    style={{ color: 'var(--c-danger)' }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={addRow} className="btn-outline text-xs flex items-center gap-1">
          + Ligne
        </button>
        <button type="button" onClick={addCol} className="btn-outline text-xs flex items-center gap-1">
          + Colonne
        </button>
      </div>
    </div>
  );
};

// Afficheur de table sauvegardée
const TableViewer = ({ data }) => {
  try {
    const { headers, rows } = JSON.parse(data);
    return (
      <div className="overflow-x-auto rounded-xl border mt-3" style={{ borderColor: 'var(--c-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--c-surface2)' }}>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2 text-left font-semibold" style={{ color: 'var(--c-primary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t" style={{ borderColor: 'var(--c-border)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2" style={{ color: 'var(--c-text)' }}>{cell || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch { return <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Table invalide</p>; }
};

export default function Notes() {
  const { user, isDelegue, isProf } = useAuth();
  const [notes, setNotes] = useState([]);
  const [ues, setUes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [typeForm, setTypeForm] = useState('document');
  const [form, setForm] = useState({ titre: '', description: '', ue_id: '' });
  const [fichier, setFichier] = useState(null);
  const [tableData, setTableData] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canAdd = isDelegue() || isProf();

  const fetch = async () => {
    try {
      const [notesRes, uesRes] = await Promise.all([
        api.get(`/notes/filiere/${user.filiere_id}/niveau/${user.niveau_id}`),
        api.get(`/ues/filiere/${user.filiere_id}/niveau/${user.niveau_id}`)
      ]);
      setNotes(notesRes.data.notes || []);
      setUes([...(uesRes.data.semestre1 || []), ...(uesRes.data.semestre2 || [])]);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetch(); }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('titre', form.titre);
      fd.append('description', form.description || '');
      fd.append('type', typeForm);
      fd.append('filiere_id', user.filiere_id);
      fd.append('niveau_id', user.niveau_id);
      if (form.ue_id) fd.append('ue_id', form.ue_id);

      if (typeForm === 'table') fd.append('contenu', tableData);
      else if (fichier) fd.append('fichier', fichier);

      await api.post('/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Note publiée !');
      setShowForm(false);
      setForm({ titre: '', description: '', ue_id: '' });
      setFichier(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette note ?')) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Note supprimée');
      fetch();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>Notes & Résultats</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            {notes.length} document(s) publié(s)
          </p>
        </div>
        {canAdd && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Publier
          </button>
        )}
      </div>

      {/* Formulaire */}
      {showForm && canAdd && (
        <div className="card fade-in">
          <h3 className="font-semibold mb-4">Publier des notes</h3>

          {/* Choix du type */}
          <div className="flex gap-3 mb-5">
            {[
              { v: 'document', icon: Upload, label: 'Fichier' },
              { v: 'table', icon: Table, label: 'Tableau' },
              { v: 'image', icon: Image, label: 'Image' },
            ].map(({ v, icon: Icon, label }) => (
              <button key={v} type="button" onClick={() => setTypeForm(v)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200"
                style={{
                  borderColor: typeForm === v ? 'var(--c-primary)' : 'var(--c-border)',
                  background: typeForm === v ? 'rgba(91,115,255,0.1)' : 'transparent',
                  color: typeForm === v ? 'var(--c-primary)' : 'var(--c-text-muted)'
                }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Titre *</label>
                <input className="input" placeholder="Ex: Résultats examen S1" value={form.titre}
                  onChange={e => setForm(f => ({...f, titre: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>UE concernée</label>
                <select className="select" value={form.ue_id}
                  onChange={e => setForm(f => ({...f, ue_id: e.target.value}))}>
                  <option value="">— Toutes les UE —</option>
                  {ues.map(ue => <option key={ue.id} value={ue.id}>{ue.code} — {ue.nom}</option>)}
                </select>
              </div>
            </div>

            {typeForm === 'table' && <TableEditor onChange={setTableData} />}

            {(typeForm === 'document' || typeForm === 'image') && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>
                  {typeForm === 'image' ? 'Image (JPG, PNG, GIF)' : 'Document (PDF, Word, Excel)'}
                </label>
                <input type="file" className="input text-sm"
                  accept={typeForm === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx'}
                  onChange={e => setFichier(e.target.files[0])} />
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Publier
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des notes */}
      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--c-text-muted)' }}>Chargement...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 card">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p style={{ color: 'var(--c-text-muted)' }}>Aucune note publiée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map(note => {
            const TypeIcon = TYPE_ICONS[note.type] || FileText;
            return (
              <div key={note.id} className="card-hover">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(91,115,255,0.15)' }}>
                    <TypeIcon size={18} style={{ color: 'var(--c-primary)' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold" style={{ color: 'var(--c-text)' }}>{note.titre}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--c-text-muted)' }}>
                          <span className={`badge ${note.auteur_rang === 'professeur' ? 'badge-prof' : 'badge-delegue'}`}>
                            {note.auteur_rang}
                          </span>
                          <span>{note.auteur_prenom} {note.auteur_nom}</span>
                          {note.ue_nom && <span>· {note.ue_nom}</span>}
                          <span>· {new Date(note.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      {canAdd && note.created_by === user.id && (
                        <button onClick={() => handleDelete(note.id)}
                          className="p-2 rounded-xl hover:bg-red-500/20 transition-colors"
                          style={{ color: 'var(--c-danger)' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* Affichage selon le type */}
                    {note.type === 'table' && note.contenu && <TableViewer data={note.contenu} />}

                    {note.type === 'image' && note.contenu && (
                      <img src={note.contenu} alt={note.titre} className="mt-3 rounded-xl max-h-80 object-contain" />
                    )}

                    {note.type === 'document' && note.contenu && (
                      <a href={note.contenu} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-sm"
                        style={{ background: 'rgba(91,115,255,0.15)', color: 'var(--c-primary)' }}>
                        <Upload size={14} /> Télécharger le document
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