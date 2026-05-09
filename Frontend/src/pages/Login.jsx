// src/pages/Login.jsx — Page de connexion
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap, Lock, Mail } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const reason = params.get('reason');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--c-bg)' }}>
      {/* Background décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'var(--c-primary)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'var(--c-accent)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-md fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, var(--c-primary), var(--c-delegue))' }}>
            <GraduationCap size={32} color="white" />
          </div>
          <h1 className="text-3xl" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--c-text)' }}>
            UniGest
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            Plateforme de gestion universitaire
          </p>
        </div>

        {/* Alerte année terminée */}
        {reason === 'annee_terminee' && (
          <div className="mb-4 p-4 rounded-xl border text-sm" style={{
            background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5'
          }}>
            ⚠️ Votre année scolaire est terminée. Veuillez vous réenregistrer pour la nouvelle année.
          </div>
        )}

        {/* Card de connexion */}
        <div className="card">
          <h2 className="text-xl mb-6" style={{ color: 'var(--c-text)' }}>Connexion</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--c-text-muted)' }}>
                Adresse email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="email@exemple.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--c-text-muted)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--c-text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--c-text-muted)' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--c-primary)' }}>
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}