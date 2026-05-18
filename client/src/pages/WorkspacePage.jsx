import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/shared/Toast';
import Navbar from '../components/shared/Navbar';
import Modal from '../components/shared/Modal';
import Avatar from '../components/shared/Avatar';
import Spinner from '../components/shared/Spinner';
import api from '../api';

export default function WorkspacePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { getSocket } = useSocket();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', color: '#7C3AED' });
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchWorkspace();
  }, [slug]);

  useEffect(() => {
    if (!workspace) return;
    const socket = getSocket();
    if (socket) socket.emit('join_workspace', { workspaceId: workspace.id });
  }, [workspace]);

  const fetchWorkspace = async () => {
    try {
      const res = await api.get(`/workspaces/${slug}`);
      setWorkspace(res.data.workspace);
      setMyRole(res.data.myRole);
    } catch (err) {
      addToast('Failed to load workspace', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/projects', { ...projectForm, workspaceId: workspace.id });
      setWorkspace(prev => ({
        ...prev,
        projects: [...(prev.projects || []), res.data.project],
      }));
      setShowCreateProject(false);
      setProjectForm({ name: '', description: '', color: '#7C3AED' });
      addToast('Project created!', 'success');
      navigate(`/workspace/${slug}/project/${res.data.project.id}/board`);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${workspace.invite_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('Invite link copied!', 'success');
  };

  const regenerateToken = async () => {
    try {
      await api.post(`/workspaces/${workspace.id}/invite`);
      fetchWorkspace();
      addToast('Invite link regenerated', 'info');
    } catch {
      addToast('Failed to regenerate link', 'error');
    }
  };

  const PROJECT_COLORS = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar workspaceName={workspace?.name} />
      <main className="flex-1 flex">
        {/* Left sidebar */}
        <aside className="w-64 glass border-r border-white/10 flex flex-col p-4 gap-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Projects</h2>
            <button
              onClick={() => setShowCreateProject(true)}
              className="btn-ghost p-1.5 text-primary-400 hover:text-primary-300"
              title="New Project"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {workspace?.projects?.map(p => (
            <Link
              key={p.id}
              to={`/workspace/${slug}/project/${p.id}/board`}
              className="sidebar-link group"
            >
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: p.color || '#7C3AED' }}
              />
              <span className="truncate">{p.name}</span>
            </Link>
          ))}

          {(!workspace?.projects || workspace.projects.length === 0) && (
            <p className="text-xs text-gray-600 px-3 py-2">No projects yet</p>
          )}

          <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
            <button
              onClick={() => setShowInvite(true)}
              className="sidebar-link w-full"
            >
              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite Members
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 p-8">
          {/* Workspace header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{workspace?.name}</h1>
                {workspace?.description && (
                  <p className="text-gray-500 mt-2 max-w-xl">{workspace.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${workspace?.plan === 'pro'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                    {workspace?.plan === 'pro' ? '⭐ Pro Plan' : 'Free Plan'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {workspace?.members?.length} members
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateProject(true)}
                id="new-project-btn"
                className="btn-primary"
              >
                + New Project
              </button>
            </div>
          </div>

          {/* Projects grid */}
          <h2 className="text-lg font-semibold text-white mb-4">Projects</h2>
          {workspace?.projects?.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">📋</p>
              <p>No projects yet. Create your first one!</p>
              <button onClick={() => setShowCreateProject(true)} className="btn-primary mt-4">
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspace?.projects?.map(p => (
                <Link
                  key={p.id}
                  to={`/workspace/${slug}/project/${p.id}/board`}
                  className="card-hover group"
                >
                  <div
                    className="h-2 rounded-full mb-4"
                    style={{ background: `linear-gradient(to right, ${p.color || '#7C3AED'}, transparent)` }}
                  />
                  <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs text-gray-500">Open →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Members section */}
          <h2 className="text-lg font-semibold text-white mt-10 mb-4">Team Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workspace?.members?.map(m => (
              <div key={m.id} className="card flex items-center gap-3">
                <Avatar name={m.name} src={m.avatar} size="md" />
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm truncate">{m.name}</p>
                  <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  <p className="text-xs text-primary-400 font-medium mt-0.5">
                    {m.WorkspaceMember?.role || 'Member'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      <Modal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="Create Project">
        <form onSubmit={createProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name *</label>
            <input
              type="text"
              id="project-name-input"
              value={projectForm.name}
              onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))}
              className="input"
              placeholder="e.g. Frontend Redesign"
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={projectForm.description}
              onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))}
              className="input resize-none"
              rows={2}
              placeholder="What is this project about?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setProjectForm(p => ({ ...p, color: c }))}
                  className={`w-8 h-8 rounded-lg transition-all ${projectForm.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {workspace?.plan === 'free' && (workspace?.projects?.length || 0) >= 3 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-400 text-sm">⚠️ Free plan allows max 3 projects.</p>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowCreateProject(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={creating}>
              {creating && <Spinner size="sm" />}
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Members">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Share this link to invite people to your workspace:</p>
          <div className="bg-dark-700 rounded-lg p-3 flex items-center gap-3 border border-white/10">
            <code className="text-primary-300 text-xs flex-1 truncate font-mono">
              {window.location.origin}/join/{workspace?.invite_token}
            </code>
            <button
              onClick={copyInviteLink}
              id="copy-invite-btn"
              className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${copied
                ? 'bg-green-500/20 text-green-400' : 'btn-primary'}`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={regenerateToken}
            className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1"
          >
            🔄 Regenerate link
          </button>
        </div>
      </Modal>
    </div>
  );
}
