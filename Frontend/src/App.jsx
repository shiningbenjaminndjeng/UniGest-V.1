// src/App.jsx — Routeur principal mis à jour
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Pages existantes
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Etudiants from './pages/Etudiants';
import Cours from './pages/Cours';
import Professeurs from './pages/Professeurs';
import Evenements from './pages/Evenements';
import Notes from './pages/Notes';
import Discussion from './pages/Discussion';
import Explorer from './pages/Explorer';
import Profil from './pages/Profils';

// Nouveaux modules
import Competences from './pages/Competences';
import Talent from './pages/Talent';
import Messagerie from './pages/Messagerie';

// Layout
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/"         element={<Navigate to="/login" replace />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="etudiants"   element={<Etudiants />} />
        <Route path="cours"       element={<Cours />} />
        <Route path="professeurs" element={<Professeurs />} />
        <Route path="evenements"  element={<Evenements />} />
        <Route path="notes"       element={<Notes />} />
        <Route path="discussion"  element={<Discussion />} />
        <Route path="competences" element={<Competences />} />
        <Route path="talent"      element={<Talent />} />
        <Route path="messagerie"  element={<Messagerie />} />
        <Route path="explorer"    element={<Explorer />} />
        <Route path="profil"      element={<Profil />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--c-surface)',
                color: 'var(--c-text)',
                border: '1px solid var(--c-border)',
                borderRadius: '14px',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
              success: {
                iconTheme: { primary: 'var(--c-success)', secondary: 'white' }
              },
              error: {
                iconTheme: { primary: 'var(--c-danger)', secondary: 'white' }
              }
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}