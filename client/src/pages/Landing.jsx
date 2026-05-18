import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-600/10
          rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10
          rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]
          bg-primary-500/5 rounded-full filter blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl
            flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30">
            DC
          </div>
          <span className="text-xl font-bold text-white">DevCollab</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-24 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
          bg-primary-500/10 border border-primary-500/30 text-primary-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
          DevFusion Hackathon 2.0 — Problem Statement 6
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 leading-tight">
          Build Together,{' '}
          <span className="gradient-text">Ship Faster</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The real-time collaboration platform built for developers. Kanban boards,
          code snippets, wikis, and AI-powered tools — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register"
            className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 glow-primary">
            Start Collaborating
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link to="/login" className="btn-secondary text-lg px-8 py-4">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-4">Everything you need</h2>
        <p className="text-center text-gray-500 mb-12">Powerful features for modern development teams</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="card-hover group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600/20 to-primary-800/20
                border border-primary-500/30 flex items-center justify-center text-2xl mb-4
                group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto glass rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to collaborate?</h2>
          <p className="text-gray-400 mb-8">Join your team on DevCollab today. Free forever for small teams.</p>
          <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-block">
            Create Your Workspace →
          </Link>
        </div>
      </section>
    </div>
  );
}

const FEATURES = [
  { icon: '📋', title: 'Real-time Kanban', description: 'Drag-and-drop board synced live across all team members via Socket.IO.' },
  { icon: '✂️', title: 'Code Snippets', description: 'Save, search, and share code snippets with syntax highlighting in 10+ languages.' },
  { icon: '📖', title: 'Wiki & Docs', description: 'Rich text wiki with TipTap editor, auto-save, and full version history.' },
  { icon: '🤖', title: 'AI Assistant', description: 'Code reviewer, standup generator, task breakdown, and project summary — powered by Claude.' },
  { icon: '🔔', title: 'Notifications', description: '@mention teammates in comments. Real-time notifications via Socket.IO.' },
  { icon: '🔒', title: 'Role-based Access', description: 'Owner, Admin, Member, Viewer roles. Invite via secure token links.' },
];

const STATS = [
  { value: '4', label: 'AI Features' },
  { value: '∞', label: 'Collaborators' },
  { value: 'Live', label: 'Real-time Sync' },
  { value: 'Free', label: 'To Start' },
];
