import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/Toast';
import Navbar from '../components/shared/Navbar';
import Modal from '../components/shared/Modal';
import Avatar from '../components/shared/Avatar';
import Spinner from '../components/shared/Spinner';
import EmptyState from '../components/shared/EmptyState';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get('/workspaces');
      setWorkspaces(res.data.workspaces);
    } catch (err) {
      addToast('Failed to load workspaces', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/workspaces', createForm);
      setWorkspaces(prev => [{ ...res.data.workspace, myRole: 'Owner' }, ...prev]);
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      addToast('Workspace created!', 'success');
      navigate(`/workspace/${res.data.workspace.slug}`);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create workspace', 'error');
    } finally {
      setCreating(false);
    }
  };

  const ACCENT_COLORS = ['from-purple-600', 'from-blue-600', 'from-teal-600', 'from-rose-600', 'from-amber-600'];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here are your workspaces</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            id="create-workspace-btn"
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Workspace
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : workspaces.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="No workspaces yet"
            description="Create your first workspace to start collaborating with your team."
            action={() => setShowCreate(true)}
            actionLabel="Create Workspace"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws, idx) => (
              <Link
                key={ws.id}
                to={`/workspace/${ws.slug}`}
                id={`workspace-card-${ws.id}`}
                className="card-hover group block"
              >
                {/* Color bar */}
                <div className={`h-1.5 rounded-full bg-gradient-to-r ${ACCENT_COLORS[idx % ACCENT_COLORS.length]} to-transparent mb-4`} />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-primary-300
                      transition-colors duration-200 text-lg">
                      {ws.name}
                    </h3>
                    {ws.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{ws.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${ws.plan === 'pro'
                    ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-500'}`}>
                    {ws.plan}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {/* Members */}
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {ws.members?.slice(0, 4).map(m => (
                        <Avatar key={m.id} name={m.name} src={m.avatar} size="xs" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {ws.members?.length || 0} members
                    </span>
                  </div>

                  {/* Project count */}
                  <span className="text-xs text-gray-500">
                    {ws.projects?.length || 0} projects
                  </span>
                </div>

                {/* Role badge */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-primary-400 font-medium">{ws.myRole}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Workspace Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Workspace">
        <form onSubmit={createWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Workspace Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="workspace-name-input"
              value={createForm.name}
              onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
              className="input"
              placeholder="e.g. DevCollab Demo"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={createForm.description}
              onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
              className="input resize-none"
              rows={3}
              placeholder="What's this workspace for?"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={creating}>
              {creating && <Spinner size="sm" />}
              {creating ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
