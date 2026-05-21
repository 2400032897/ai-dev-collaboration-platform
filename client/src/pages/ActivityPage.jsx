import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useToast } from '../components/shared/Toast';
import Avatar from '../components/shared/Avatar';
import Spinner from '../components/shared/Spinner';
import api from '../api';
import { formatDistanceToNow } from 'date-fns';

const ACTION_LABELS = {
  task_created: 'created task',
  task_moved: 'moved task',
  task_updated: 'updated task',
  comment_added: 'commented on',
  snippet_created: 'added snippet',
  wiki_updated: 'updated wiki',
  member_joined: 'joined the workspace',
};

export default function ActivityPage() {
  const { projectId } = useParams();
  const { addToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [workspaceId, setWorkspaceId] = useState(null);

  useEffect(() => {
    // Get workspaceId from project
    api.get(`/projects/${projectId}`)
      .then(res => {
        setWorkspaceId(res.data.project.workspace_id);
        return res.data.project.workspace_id;
      })
      .then(wsId => fetchActivity(wsId, 1))
      .catch(() => setLoading(false));
  }, [projectId]);

  const fetchActivity = async (wsId, pageNum) => {
    try {
      const res = await api.get(`/activity?workspaceId=${wsId}&projectId=${projectId}&page=${pageNum}`);
      setActivities(prev => pageNum === 1 ? res.data.activities : [...prev, ...res.data.activities]);
    } catch {
      addToast('Failed to load activity', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchActivity(workspaceId, next);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        {activities.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No activity yet</div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />

            <div className="space-y-6">
              {activities.map(a => (
                <div key={a.id} className="flex items-start gap-4 relative">
                  <div className="flex-shrink-0 z-10">
                    <Avatar name={a.actor?.name} src={a.actor?.avatar} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-dark-800 border border-white/10 rounded-xl p-4
                      hover:border-white/20 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-300">
                          <span className="font-semibold text-white">{a.actor?.name}</span>
                          {' '}
                          <span className="text-gray-500">{ACTION_LABELS[a.action] || a.action}</span>
                          {a.meta?.taskTitle && (
                            <span className="text-primary-400"> "{a.meta.taskTitle}"</span>
                          )}
                          {a.meta?.from && a.meta?.to && (
                            <span className="text-gray-500">
                              {' from '}<span className="text-gray-400">{a.meta.from}</span>
                              {' to '}<span className="text-gray-400">{a.meta.to}</span>
                            </span>
                          )}
                        </p>
                        <span className="text-xs text-gray-600 flex-shrink-0">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {a.Project && (
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: a.Project.color || '#7C3AED' }}
                          />
                          <span className="text-xs text-gray-600">{a.Project.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {activities.length >= 20 && (
              <button onClick={loadMore} className="btn-secondary w-full mt-6">
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
