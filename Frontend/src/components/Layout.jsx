// src/components/Layout.jsx — Layout principal avec sidebar
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen,
  Library, Calendar, FileText, MessageSquare,
  Compass, LogOut, Bell, ChevronDown, UserCircle
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard,  label: 'Tableau de bord' },
  { to: '/etudiants',    icon: Users,             label: 'Étudiants'       },
  { to: '/cours',        icon: BookOpen,          label: 'Cours / UE'      },
  { to: '/professeurs',  icon: Library,           label: 'Professeurs'     },
  { to: '/evenements',   icon: Calendar,          label: 'Événements'      },
  { to: '/notes',        icon: FileText,          label: 'Notes'           },
  { to: '/discussion',   icon: MessageSquare,     label: 'Discussion'      },
  { to: '/explorer',     icon: Compass,           label: 'Explorer'        },
  { to: '/profil',       icon: UserCircle,        label: 'Mon Profil'      },
];

const RANG_COLOR = {
  etudiant: 'var(--c-primary)',
  delegue: 'var(--c-delegue)',
  professeur: 'var(--c-prof)'
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { nbNonLu, notifications } = useSocket();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      {/* ==================== SIDEBAR ==================== */}
      <aside className="flex flex-col border-r transition-all duration-300"
        style={{
          width: sidebarOpen ? '260px' : '72px',
          background: 'var(--c-surface)',
          borderColor: 'var(--c-border)',
          flexShrink: 0
        }}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--c-primary), var(--c-delegue))' }}>
            <GraduationCap size={20} color="white" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--c-text)' }}>
                UniGest
              </div>
              <div className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
                {user?.filiere_nom || 'Plateforme'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? label : undefined}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Profil utilisateur */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--c-surface2)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
              style={{ background: `${RANG_COLOR[user?.rang]}22`, color: RANG_COLOR[user?.rang] }}>
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--c-text)' }}>
                  {user?.prenom} {user?.nom}
                </div>
                <div className="text-xs capitalize" style={{ color: RANG_COLOR[user?.rang] }}>
                  {user?.rang} · {user?.niveau_code || 'Prof'}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout}
            className="sidebar-link w-full mt-1 hover:text-red-400"
            style={{ color: 'var(--c-text-muted)' }}
            title={!sidebarOpen ? 'Déconnexion' : undefined}>
            <LogOut size={18} />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ==================== MAIN ==================== */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)', height: '60px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--c-text-muted)' }}>
            <div className="space-y-1">
              <div className="w-5 h-0.5 rounded" style={{ background: 'currentColor' }} />
              <div className="w-5 h-0.5 rounded" style={{ background: 'currentColor' }} />
              <div className="w-5 h-0.5 rounded" style={{ background: 'currentColor' }} />
            </div>
          </button>

          {/* Infos filière */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm hidden md:block" style={{ color: 'var(--c-text-muted)' }}>
                <span style={{ color: 'var(--c-text)' }}>{user.filiere_nom}</span>
                {user.niveau_code && <span> · {user.niveau_code}</span>}
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl transition-colors"
                style={{ background: showNotifs ? 'var(--c-surface2)' : 'transparent', color: 'var(--c-text-muted)' }}>
                <Bell size={18} />
                {nbNonLu > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full text-white"
                    style={{ background: 'var(--c-danger)' }}>
                    {nbNonLu}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-xl z-50"
                  style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
                  <div className="p-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
                    <p className="font-semibold text-sm">Notifications</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-center" style={{ color: 'var(--c-text-muted)' }}>Aucune notification</p>
                    ) : notifications.slice(0, 10).map(n => (
                      <div key={n.id} className="p-3 border-b flex gap-3 items-start text-sm"
                        style={{ borderColor: 'var(--c-border)', opacity: n.lu ? 0.5 : 1 }}>
                        <span>{n.type === 'evenement' ? '📅' : '💬'}</span>
                        <div>
                          <p style={{ color: 'var(--c-text)' }}>{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Contenu de la page */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}