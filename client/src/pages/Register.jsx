import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/Toast';
import Spinner from '../components/shared/Spinner';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return addToast('Password must be at least 6 characters', 'error');
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      addToast('Account created! Welcome to DevCollab', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.error || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full filter blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <img src="/devcollab-logo.svg" alt="DevCollab" className="w-14 h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Free forever for small teams</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                id="register-name"
                value={form.name}
                onChange={set('name')}
                className="input"
                placeholder="Ankush Kumar"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                id="register-email"
                value={form.email}
                onChange={set('email')}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                id="register-password"
                value={form.password}
                onChange={set('password')}
                className="input"
                placeholder="Min. 6 characters"
                required
              />
            </div>

            <button
              type="submit"
              id="register-submit"
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && <Spinner size="sm" />}
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
