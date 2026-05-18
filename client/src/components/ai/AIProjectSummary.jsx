import { useState } from 'react';
import Spinner from '../shared/Spinner';
import { useToast } from '../shared/Toast';
import api from '../../api';

export default function AIProjectSummary({ projectId }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const generate = async () => {
    setLoading(true);
    setSummary('');
    try {
      const res = await api.post('/ai/summary', { projectId });
      setSummary(res.data.summary);
    } catch (err) {
      addToast('Failed to generate summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">📊 AI Project Summary</h2>
        <p className="text-gray-500 text-sm">Get a health report of your project powered by Claude AI</p>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="btn-primary flex items-center gap-2"
        id="project-summary-btn"
      >
        {loading ? <Spinner size="sm" /> : '📊'}
        {loading ? 'Analyzing...' : 'Summarize Project'}
      </button>

      {summary && (
        <div className="bg-dark-700 border border-primary-500/20 rounded-xl p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-primary-500 rounded-full" />
            <span className="text-sm font-semibold text-primary-400">Project Health Report</span>
          </div>
          <p className="text-gray-300 leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  );
}
