import { useState } from 'react';
import Badge from '../shared/Badge';
import Spinner from '../shared/Spinner';
import { useToast } from '../shared/Toast';
import api from '../../api';

export default function AITaskBreakdown({ projectId, workspaceId }) {
  const { addToast } = useToast();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  const breakDown = async () => {
    if (!description.trim()) return addToast('Please describe the feature', 'warning');
    setLoading(true);
    setTasks([]);
    try {
      const res = await api.post('/ai/breakdown', { featureDescription: description, projectId });
      setTasks(res.data.breakdown || []);
      addToast(`${res.data.tasks?.length || 0} tasks added to board!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Breakdown failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">⚡ AI Task Breakdown</h2>
        <p className="text-gray-500 text-sm">Describe a feature — AI breaks it into actionable tasks and adds them to your board</p>
      </div>

      <div className="space-y-3">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="input resize-none w-full h-32"
          placeholder="e.g. Build user authentication with email/password, Google OAuth, and 2FA support"
          id="breakdown-input"
        />
        <button
          onClick={breakDown}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
          id="breakdown-btn"
        >
          {loading ? <Spinner size="sm" /> : '⚡'}
          {loading ? 'Breaking down...' : 'Break it Down → Add to Board'}
        </button>
      </div>

      {tasks.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-400">Generated Tasks ({tasks.length})</h3>
          {tasks.map((t, i) => (
            <div key={i} className="card flex items-start gap-4">
              <div className="flex-shrink-0 w-7 h-7 bg-primary-600/20 rounded-lg
                flex items-center justify-center text-primary-400 text-sm font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-white text-sm">{t.title}</span>
                  <Badge variant={t.priority}>{t.priority}</Badge>
                  {t.estimatedHours && (
                    <span className="text-xs text-gray-500">~{t.estimatedHours}h</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{t.description}</p>
              </div>
            </div>
          ))}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-green-400 text-sm">✅ All tasks have been added to your Kanban board!</p>
          </div>
        </div>
      )}
    </div>
  );
}
