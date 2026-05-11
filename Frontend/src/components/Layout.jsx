// src/components/Layout.jsx — Layout redesigné avec nouveaux modules
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen,
  Library, Calendar, FileText, MessageSquare,
  Compass, LogOut, Bell, UserCircle, Star, Mail,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard,  label: 'Dashboard'       },
  { to: '/etudiants',    icon: Users,             label: 'Étudiants'       },
  { to: '/cours',        icon: BookOpen,          label: 'Cours & UE'      },
  { to: '/professeurs',  icon: Library,           label: 'Professeurs'     },
  { to: '/evenements',   icon: Calendar,          label: 'Événements'      },
  { to: '/notes',        icon: FileText,          label: 'Notes'           },
  { to: '/discussion',   icon: MessageSquare,     label: 'Discussion'      },
  { to: '/competences',  icon: Star,              label: 'Compétences'     },
  { to: '/messagerie',   icon: Mail,              label: 'Messagerie'      },
  { to: '/explorer',     icon: Compass,           label: 'Explorer'        },
  { to: '/profil',       icon: UserCircle,        label: 'Mon Profil'      },
];

const RANG_STYLE = {
  etudiant:   { color: 'var(--c-primary)',  bg: 'rgba(79,142,247,0.15)',  label: 'Étudiant',   badge: 'badge-etudiant' },
  delegue:    { color: 'var(--c-delegue)',  bg: 'rgba(168,85,247,0.15)', label: 'Délégué',    badge: 'badge-delegue'  },
  professeur: { color: 'var(--c-prof)',     bg: 'rgba(6,214,160,0.15)',  label: 'Professeur', badge: 'badge-prof'     },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { nbNonLu, notifications, messagesNonLus } = useSocket();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const rs = RANG_STYLE[user?.rang] || RANG_STYLE.etudiant;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const totalNonLu = nbNonLu + (messagesNonLus || 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      {/* ==================== SIDEBAR ==================== */}
      <aside
        className="flex flex-col border-r flex-shrink-0 relative"
        style={{
          width: sidebarOpen ? '256px' : '68px',
          background: 'var(--c-surface)',
          borderColor: 'var(--c-border)',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3.5 top-20 z-10 w-7 h-7 rounded-full border flex items-center justify-center"
          style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--c-border)', height: '64px' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--g-primary)' }}
          >
            <Zap size={18} color="white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="font-black text-lg leading-none gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                UniGest
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-text-muted)' }}>
                {user?.filiere_nom || 'Université'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isMsgLink = to === '/messagerie';
            const isDiscLink = to === '/discussion';
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title={!sidebarOpen ? label : undefined}
              >
                <div className="relative flex-shrink-0">
                  <Icon size={18} />
                  {isMsgLink && messagesNonLus > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] flex items-center justify-center rounded-full text-white font-bold"
                      style={{ background: 'var(--c-danger)' }}>
                      {messagesNonLus > 9 ? '9+' : messagesNonLus}
                    </span>
                  )}
                  {isDiscLink && nbNonLu > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full"
                      style={{ background: 'var(--c-primary)' }} />
                  )}
                </div>
                {sidebarOpen && <span className="truncate">{label}</span>}
                {sidebarOpen && isMsgLink && messagesNonLus > 0 && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-lg font-bold"
                    style={{ background: 'var(--c-danger)', color: 'white' }}>
                    {messagesNonLus}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Profil utilisateur */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--c-border)' }}>
          {sidebarOpen ? (
            <div className="p-3 rounded-xl" style={{ background: 'var(--c-surface2)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: rs.bg, color: rs.color }}
                >
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
                    {user?.prenom} {user?.nom}
                  </div>
                  <div className="text-xs capitalize" style={{ color: rs.color }}>
                    {rs.label} {user?.niveau_code ? `· ${user.niveau_code}` : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 mt-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ color: 'var(--c-danger)', background: 'rgba(240,82,82,0.08)' }}
              >
                <LogOut size={13} /> Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ background: rs.bg, color: rs.color }}
              >
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <button onClick={handleLogout} className="btn-ghost p-2" title="Déconnexion">
                <LogOut size={15} style={{ color: 'var(--c-danger)' }} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ==================== MAIN ==================== */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 border-b flex-shrink-0"
          style={{
            background: scrolled ? 'rgba(17,24,39,0.95)' : 'var(--c-surface)',
            borderColor: 'var(--c-border)',
            height: '64px',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Breadcrumb info */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold" style={{ color: 'var(--c-text)' }}>{user.filiere_nom}</span>
                {user.niveau_code && (
                  <>
                    <span style={{ color: 'var(--c-text-dim)' }}>·</span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                      style={{ background: rs.bg, color: rs.color }}>
                      {user.niveau_code}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions topbar */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2.5 rounded-xl transition-all"
                style={{
                  background: showNotifs ? 'var(--c-surface2)' : 'transparent',
                  color: 'var(--c-text-muted)'
                }}
              >
                <Bell size={18} />
                {totalNonLu > 0 && (
                  <span className="notif-dot">{totalNonLu > 9 ? '9+' : totalNonLu}</span>
                )}
              </button>

              {showNotifs && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl z-50 scale-in"
                  style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
                >
                  <div className="p-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                    <p className="font-bold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Notifications
                      {totalNonLu > 0 && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded-lg"
                          style={{ background: 'var(--c-danger)', color: 'white' }}>
                          {totalNonLu}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell size={28} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Aucune notification</p>
                      </div>
                    ) : (
                      notifications.slice(0, 12).map(n => (
                        <div
                          key={n.id}
                          className="p-3 border-b flex gap-3 items-start text-sm cursor-pointer transition-all"
                          style={{
                            borderColor: 'var(--c-border)',
                            opacity: n.lu ? 0.5 : 1,
                            background: n.lu ? 'transparent' : 'rgba(79,142,247,0.03)'
                          }}
                        >
                          <span className="text-base flex-shrink-0 mt-0.5">
                            {n.type === 'evenement' ? '📅' : n.type === 'document' ? '📄' : '💬'}
                          </span>
                          <div>
                            <p className="leading-snug" style={{ color: 'var(--c-text)' }}>{n.message}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>
                              {new Date(n.time || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!n.lu && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--c-primary)' }} />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <NavLink to="/profil" className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
              style={{ background: 'var(--c-surface2)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: rs.bg, color: rs.color }}>
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--c-text)' }}>
                {user?.prenom}
              </span>
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}