import { useState, useEffect } from 'react';
import { useParams, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/shared/Navbar';
import Sidebar from '../components/shared/Sidebar';
import Spinner from '../components/shared/Spinner';
import api from '../api';

export default function ProjectPage() {
  const { projectId, slug } = useParams();
  const { user } = useAuth();
  const { getSocket } = useSocket();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/projects/${projectId}`)
      .then(res => setProject(res.data.project))
      .catch(() => navigate(`/workspace/${slug}`))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    const socket = getSocket();
    if (socket && projectId) {
      socket.emit('join_project', { projectId, userName: user?.name });
    }
    return () => {
      const socket = getSocket();
      if (socket) socket.emit('leave_project', { projectId });
    };
  }, [projectId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar workspaceName={project?.Workspace?.name} />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar workspaceName={project?.Workspace?.name} />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        <Sidebar
          projectId={projectId}
          workspaceSlug={slug}
          members={project?.members || []}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet context={{ project }} />
        </main>
      </div>
    </div>
  );
}
