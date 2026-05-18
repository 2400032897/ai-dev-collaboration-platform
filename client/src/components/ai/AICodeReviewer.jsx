import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Spinner from '../shared/Spinner';
import Badge from '../shared/Badge';
import { useToast } from '../shared/Toast';
import api from '../../api';

export default function AICodeReviewer() {
  const { addToast } = useToast();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [openSections, setOpenSections] = useState({ bugs: true, performance: false, readability: false, security: false });

  const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'html', 'css', 'sql', 'bash'];

  const review = async () => {
    if (!code.trim()) return addToast('Please paste some code first', 'warning');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/ai/review-code', { code, language });
      setResult(res.data.result);
    } catch (err) {
      addToast(err.response?.data?.error || 'Review failed. Check your API key.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result ? (result.score >= 8 ? 'text-green-400' : result.score >= 5 ? 'text-amber-400' : 'text-red-400') : '';
  const scoreBg = result ? (result.score >= 8 ? 'bg-green-500/10 border-green-500/30' : result.score >= 5 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30') : '';

  const toggle = (k) => setOpenSections(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">🔍 AI Code Reviewer</h2>
        <p className="text-gray-500 text-sm">Get instant feedback on your code from Claude AI</p>
      </div>

      {/* Code input */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-300">Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="input w-auto text-sm">
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          className="input resize-none font-mono text-sm h-64 w-full"
          placeholder="// Paste your code here..."
          id="code-review-input"
          spellCheck={false}
        />
        <button
          onClick={review}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
          id="review-code-btn"
        >
          {loading ? <Spinner size="sm" /> : '🔍'}
          {loading ? 'Reviewing...' : 'Review Code'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Score + Summary */}
          <div className={`flex items-center gap-6 p-5 rounded-xl border ${scoreBg}`}>
            <div className="text-center">
              <div className={`text-5xl font-black ${scoreColor}`}>{result.score}</div>
              <div className="text-xs text-gray-500 mt-1">/ 10</div>
            </div>
            <div>
              <p className="text-white font-medium mb-1">Overall Assessment</p>
              <p className="text-gray-400 text-sm">{result.summary}</p>
            </div>
          </div>

          {/* Collapsible sections */}
          {[
            { key: 'bugs', label: '🐛 Bugs', color: 'text-red-400' },
            { key: 'performance', label: '⚡ Performance', color: 'text-amber-400' },
            { key: 'readability', label: '📖 Readability', color: 'text-blue-400' },
            { key: 'security', label: '🔒 Security', color: 'text-purple-400' },
          ].map(({ key, label, color }) => (
            <div key={key} className="card">
              <button
                className={`flex items-center justify-between w-full text-left ${color} font-medium`}
                onClick={() => toggle(key)}
              >
                <span>{label} ({result[key]?.length || 0})</span>
                <svg className={`w-4 h-4 transition-transform ${openSections[key] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {openSections[key] && (
                <ul className="mt-3 space-y-1.5">
                  {result[key]?.length ? result[key].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="text-gray-600 flex-shrink-0">•</span> {item}
                    </li>
                  )) : <li className="text-sm text-gray-600 italic">No issues found ✓</li>}
                </ul>
              )}
            </div>
          ))}

          {/* Improved snippet */}
          {result.improved_snippet && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">✨ Improved Snippet</h3>
              <pre className="code-block text-sm overflow-x-auto">
                <code>{result.improved_snippet}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
