// src/pages/Login.jsx — Page de connexion redesignée
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, Lock, Mail, ArrowRight } from 'lucide-react';

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
      toast.error(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dots"
      style={{ background: 'var(--c-bg)' }}>
      {/* Blobs décoratifs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full"
          style={{ background: 'var(--c-primary)', filter: 'blur(120px)', opacity: 0.06, top: '10%', left: '10%' }} />
        <div className="absolute w-80 h-80 rounded-full"
          style={{ background: 'var(--c-delegue)', filter: 'blur(100px)', opacity: 0.05, bottom: '20%', right: '15%' }} />
        <div className="absolute w-60 h-60 rounded-full"
          style={{ background: 'var(--c-prof)', filter: 'blur(80px)', opacity: 0.04, top: '60%', left: '60%' }} />
      </div>

      <div className="relative w-full max-w-sm scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 pulse-glow"
            style={{ background: 'var(--g-primary)' }}>
            <Zap size={30} color="white" />
          </div>
          <h1 className="text-4xl font-black gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
            UniGest
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
            Plateforme universitaire intelligente
          </p>
        </div>

        {/* Alerte année terminée */}
        {reason === 'annee_terminee' && (
          <div className="mb-4 p-4 rounded-xl border text-sm"
            style={{ background: 'var(--c-danger-glow)', borderColor: 'rgba(240,82,82,0.3)', color: '#fca5a5' }}>
            ⚠️ Votre année scolaire est terminée. Réenregistrez-vous pour la nouvelle année.
          </div>
        )}

        {/* Card login */}
        <div className="card-glass">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--c-text)', fontFamily: 'Outfit, sans-serif' }}>
            Connexion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--c-text-muted)' }}>
                Adresse email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
                <input type="email" className="input pl-10" placeholder="email@exemple.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--c-text-muted)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-10"
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--c-text-muted)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Se connecter</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="divider my-5" />

          <p className="text-center text-sm" style={{ color: 'var(--c-text-muted)' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-bold transition-colors hover:opacity-80"
              style={{ color: 'var(--c-primary)' }}>
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Features preview */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { emoji: '⚡', label: 'Temps réel' },
            { emoji: '🎯', label: 'Compétences' },
            { emoji: '💬', label: 'Messagerie' },
          ].map(f => (
            <div key={f.label} className="p-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--c-text-muted)', border: '1px solid var(--c-border)' }}>
              <div className="text-lg mb-0.5">{f.emoji}</div>
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}