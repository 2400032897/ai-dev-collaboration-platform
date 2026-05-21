import { useState } from 'react';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import api from '../../api';

export default function StandupModal({ isOpen, onClose, projectId }) {
  const [loading, setLoading] = useState(false);
  const [standup, setStandup] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setStandup('');
    try {
      const res = await api.post('/ai/standup', { projectId });
      setStandup(res.data.standup);
    } catch (err) {
      setStandup('Failed to generate standup. Please check your AI API key.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(standup);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Daily Standup Generator" size="md">
      <div className="space-y-4">
        <p className="text-gray-400 text-sm">
          Generate a standup report based on task activity from the last 24 hours.
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
          id="generate-standup-btn"
        >
          {loading ? <Spinner size="sm" /> : '✨'}
          {loading ? 'Generating...' : 'Generate Standup'}
        </button>

        {standup && (
          <div className="relative">
            <pre className="bg-dark-900 border border-white/10 rounded-xl p-5 text-sm text-gray-300
              whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
              {standup}
            </pre>
            <button
              onClick={copy}
              className={`absolute top-3 right-3 text-xs px-3 py-1.5 rounded-lg font-medium
                transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-gray-400 hover:text-white'}`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
