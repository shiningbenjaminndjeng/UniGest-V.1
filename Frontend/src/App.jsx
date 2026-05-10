// src/App.jsx — Routeur principal
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Pages
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
import Profil from './pages/Profils';   // ← votre fichier s'appelle Profils.jsx

// Layout
import Layout from './components/Layout';

// Route protégée
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Route publique (redirect si connecté)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/"         element={<Navigate to="/login" replace />} />

      {/* Routes protégées avec layout */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="etudiants"  element={<Etudiants />} />
        <Route path="cours"      element={<Cours />} />
        <Route path="professeurs" element={<Professeurs />} />
        <Route path="evenements" element={<Evenements />} />
        <Route path="notes"      element={<Notes />} />
        <Route path="discussion" element={<Discussion />} />
        <Route path="explorer"   element={<Explorer />} />
        <Route path="profil"     element={<Profil />} />
      </Route>

      {/* 404 */}
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
              style: {
                background: '#1a1d27',
                color: '#e8eaf0',
                border: '1px solid #2e3145',
                borderRadius: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px'
              }
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
