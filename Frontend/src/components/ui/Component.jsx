// src/components/ui/Spinner.jsx — Indicateur de chargement
export const Spinner = ({ size = 'md', text = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sizes[size]} border-2 border-t-transparent rounded-full animate-spin`}
        style={{ borderColor: 'var(--c-border)', borderTopColor: 'var(--c-primary)' }} />
      {text && <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>{text}</p>}
    </div>
  );
};

// src/components/ui/Empty.jsx — État vide
export const Empty = ({ icon: Icon, title, subtitle, action }) => (
  <div className="text-center py-16 card">
    {Icon && <Icon size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--c-text-muted)' }} />}
    <p className="font-semibold" style={{ color: 'var(--c-text)' }}>{title}</p>
    {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// src/components/ui/Modal.jsx — Boîte de dialogue modale
export const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-lg fade-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--c-surface2)', color: 'var(--c-text-muted)' }}>
            ✕
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-4 pt-4 border-t flex gap-3 justify-end"
          style={{ borderColor: 'var(--c-border)' }}>{footer}</div>}
      </div>
    </div>
  );
};

// src/components/ui/Alert.jsx — Alertes
export const Alert = ({ type = 'info', children }) => {
  const styles = {
    info:    { bg: 'rgba(91,115,255,0.1)',  border: 'rgba(91,115,255,0.3)',  color: 'var(--c-primary)',  icon: 'ℹ️' },
    success: { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: 'var(--c-success)',  icon: '✅' },
    warning: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: 'var(--c-warning)',  icon: '⚠️' },
    danger:  { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: 'var(--c-danger)',   icon: '❌' },
  };
  const s = styles[type];
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border text-sm"
      style={{ background: s.bg, borderColor: s.border, color: s.color }}>
      <span className="flex-shrink-0">{s.icon}</span>
      <div>{children}</div>
    </div>
  );
};

// src/components/ui/Avatar.jsx — Avatar initiales
export const Avatar = ({ nom, prenom, rang, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  const colors = {
    etudiant:   { bg: 'rgba(91,115,255,0.15)',  color: 'var(--c-primary)' },
    delegue:    { bg: 'rgba(167,139,250,0.15)', color: 'var(--c-delegue)' },
    professeur: { bg: 'rgba(52,211,153,0.15)',  color: 'var(--c-prof)'    },
  };
  const c = colors[rang] || colors.etudiant;
  return (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: c.bg, color: c.color, fontFamily: 'Syne, sans-serif' }}>
      {prenom?.[0]}{nom?.[0]}
    </div>
  );
};