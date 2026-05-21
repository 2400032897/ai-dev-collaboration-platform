import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/Toast';
import Navbar from '../components/shared/Navbar';
import Avatar from '../components/shared/Avatar';
import Spinner from '../components/shared/Spinner';
import api from '../api';
import confetti from 'canvas-confetti';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    github_url: user?.github_url || '',
    skills: user?.skills?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('form'); // form | processing | success
  const [cardForm, setCardForm] = useState({ number: '4111 1111 1111 1111', expiry: '12/26', cvv: '123' });

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/auth/profile', {
        ...profileForm,
        skills: profileForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      updateUser(res.data.user);
      addToast('Profile updated!', 'success');
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    setPaymentStep('processing');
    await new Promise(r => setTimeout(r, 1500));
    setPaymentStep('success');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-dark-800 rounded-xl p-1 w-fit border border-white/10">
          {['profile', 'billing'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all
                ${tab === t ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="max-w-lg">
            <div className="card mb-6 flex items-center gap-4">
              <Avatar name={user?.name} src={user?.avatar} size="xl" />
              <div>
                <p className="font-semibold text-white">{user?.name}</p>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <input value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
                <textarea value={profileForm.bio}
                  onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                  className="input resize-none" rows={3} placeholder="Tell us about yourself..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">GitHub URL</label>
                <input value={profileForm.github_url}
                  onChange={e => setProfileForm(p => ({ ...p, github_url: e.target.value }))}
                  className="input" placeholder="https://github.com/username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Skills (comma-separated)</label>
                <input value={profileForm.skills}
                  onChange={e => setProfileForm(p => ({ ...p, skills: e.target.value }))}
                  className="input" placeholder="React, Node.js, Python" />
              </div>
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
                {saving && <Spinner size="sm" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Billing Tab */}
        {tab === 'billing' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            {/* Free plan */}
            <div className="card border-2 border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Free</h3>
                  <p className="text-3xl font-black text-white mt-1">₹0</p>
                </div>
                <span className="bg-gray-500/20 text-gray-400 text-xs px-3 py-1 rounded-full">Current</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                {['1 Workspace', '3 Projects', '5 Members', 'Kanban Board', 'Snippets & Wiki', 'AI Features'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span>{f.startsWith('AI Features') ? '' : '✓'}</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro plan */}
            <div className="card border-2 border-primary-500/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white
                text-xs font-bold px-4 py-1 rounded-full">
                RECOMMENDED
              </div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Pro</h3>
                  <p className="text-3xl font-black gradient-text mt-1">₹499<span className="text-base text-gray-400">/mo</span></p>
                </div>
                <span className="bg-primary-500/20 text-primary-400 text-xs px-3 py-1 rounded-full">Pro</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-400 mb-5">
                {['Unlimited Workspaces', 'Unlimited Projects', 'Unlimited Members', 'Kanban Board', 'Snippets & Wiki', 'All AI Features'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-400">{f.startsWith('All AI Features') ? '' : '✓'}</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary w-full glow-primary"
                id="upgrade-btn"
              >
                Upgrade to Pro →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-8 w-full max-w-sm animate-slide-up">
            {paymentStep === 'form' && (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Complete Payment</h2>
                <p className="text-gray-500 text-sm mb-6">DevCollab Pro — ₹499/month</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Card Number</label>
                    <input value={cardForm.number} onChange={e => setCardForm(p => ({ ...p, number: e.target.value }))}
                      className="input font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Expiry</label>
                      <input value={cardForm.expiry} onChange={e => setCardForm(p => ({ ...p, expiry: e.target.value }))}
                        className="input font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">CVV</label>
                      <input value={cardForm.cvv} onChange={e => setCardForm(p => ({ ...p, cvv: e.target.value }))}
                        className="input font-mono" type="password" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowPaymentModal(false)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={handlePayment} className="btn-primary flex-1" id="pay-btn">
                      Pay ₹499
                    </button>
                  </div>
                </div>
              </>
            )}
            {paymentStep === 'processing' && (
              <div className="text-center py-6">
                <Spinner size="xl" className="mx-auto mb-4" />
                <p className="text-white font-medium">Processing payment...</p>
              </div>
            )}
            {paymentStep === 'success' && (
              <div className="text-center py-6">
                <p className="text-5xl mb-4"></p>
                <h3 className="text-xl font-bold text-white mb-2">Welcome to Pro!</h3>
                <p className="text-gray-400 text-sm mb-6">You now have access to all AI features</p>
                <button
                  onClick={() => { setShowPaymentModal(false); setPaymentStep('form'); }}
                  className="btn-primary w-full"
                >
                  Start Using Pro →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
