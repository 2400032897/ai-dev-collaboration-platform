import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../components/shared/Toast';
import Spinner from '../components/shared/Spinner';
import Modal from '../components/shared/Modal';
import Badge from '../components/shared/Badge';
import EmptyState from '../components/shared/EmptyState';
import api from '../api';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'html', 'css', 'sql', 'bash'];
const LANG_COLORS = {
  javascript: 'bg-yellow-500/20 text-yellow-400',
  typescript: 'bg-blue-500/20 text-blue-400',
  python: 'bg-green-500/20 text-green-400',
  java: 'bg-orange-500/20 text-orange-400',
  cpp: 'bg-purple-500/20 text-purple-400',
  go: 'bg-cyan-500/20 text-cyan-400',
  rust: 'bg-orange-600/20 text-orange-500',
  html: 'bg-red-500/20 text-red-400',
  css: 'bg-blue-400/20 text-blue-300',
  sql: 'bg-teal-500/20 text-teal-400',
  bash: 'bg-gray-500/20 text-gray-400',
};

export default function SnippetsPage() {
  const { projectId } = useParams();
  const { addToast } = useToast();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ title: '', language: 'javascript', code: '', description: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchSnippets();
  }, [projectId]);

  const fetchSnippets = async (q = '', tag = '') => {
    try {
      const params = new URLSearchParams({ projectId });
      if (q) params.set('search', q);
      if (tag) params.set('tag', tag);
      const res = await api.get(`/snippets?${params}`);
      setSnippets(res.data.snippets);
      if (res.data.snippets.length > 0 && !selected) setSelected(res.data.snippets[0]);
    } catch {
      addToast('Failed to load snippets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchSnippets(val, tagFilter), 400);
  };

  const handleTagFilter = (tag) => {
    const newTag = tagFilter === tag ? '' : tag;
    setTagFilter(newTag);
    fetchSnippets(search, newTag);
  };

  const createSnippet = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/snippets', {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        projectId,
      });
      setSnippets(prev => [res.data.snippet, ...prev]);
      setSelected(res.data.snippet);
      setShowCreate(false);
      setForm({ title: '', language: 'javascript', code: '', description: '', tags: '' });
      addToast('Snippet created!', 'success');
    } catch {
      addToast('Failed to create snippet', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteSnippet = async (id) => {
    try {
      await api.delete(`/snippets/${id}`);
      setSnippets(prev => prev.filter(s => s.id !== id));
      if (selected?.id === id) setSelected(snippets.find(s => s.id !== id) || null);
      addToast('Snippet deleted', 'success');
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const copyCode = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get all unique tags
  const allTags = [...new Set(snippets.flatMap(s => s.tags || []))];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">✂️ Code Snippets</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm" id="new-snippet-btn">
          + New Snippet
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: List */}
        <div className="w-72 border-r border-white/10 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="input text-sm"
              placeholder="Search snippets..."
              id="snippet-search"
            />
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-white/10">
              {allTags.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={`text-xs px-2 py-1 rounded-full transition-all ${tagFilter === tag
                    ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400 hover:text-white'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Snippet list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : snippets.length === 0 ? (
              <EmptyState icon="✂️" title="No snippets" description="Create your first snippet" />
            ) : (
              snippets.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5
                    ${selected?.id === s.id ? 'bg-primary-600/10 border-l-2 border-l-primary-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-white text-sm line-clamp-1">{s.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${LANG_COLORS[s.language] || 'bg-gray-500/20 text-gray-400'}`}>
                      {s.language}
                    </span>
                  </div>
                  {s.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{s.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.tags?.slice(0, 3).map(t => (
                      <span key={t} className="text-xs text-gray-600">{t}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel: Code view */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Code header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-white">{selected.title}</h3>
                  {selected.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{selected.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${LANG_COLORS[selected.language] || 'bg-gray-500/20 text-gray-400'}`}>
                    {selected.language}
                  </span>
                  <button
                    onClick={copyCode}
                    className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all
                      ${copied ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-gray-400 hover:text-white border border-white/10'}`}
                    id="copy-snippet-btn"
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => deleteSnippet(selected.id)}
                    className="btn-ghost text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Code block */}
              <div className="flex-1 overflow-auto p-6">
                <pre className="bg-dark-900 border border-white/10 rounded-xl p-6
                  font-mono text-sm text-gray-300 overflow-x-auto leading-relaxed">
                  <code>{selected.code}</code>
                </pre>

                {/* Tags */}
                {selected.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selected.tags.map(t => (
                      <Badge key={t} variant="primary">{t}</Badge>
                    ))}
                  </div>
                )}

                {/* Creator */}
                {selected.creator && (
                  <p className="text-xs text-gray-600 mt-3">
                    Created by {selected.creator.name}
                  </p>
                )}
              </div>
            </>
          ) : (
            <EmptyState icon="👈" title="Select a snippet" description="Click a snippet from the list to view it" />
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Snippet" size="lg">
        <form onSubmit={createSnippet} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="input" placeholder="useLocalStorage hook" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Language *</label>
              <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className="input">
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Code *</label>
            <textarea value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
              className="input resize-none font-mono text-sm h-48" placeholder="// Paste your code..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input" placeholder="Brief description of what this snippet does" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              className="input" placeholder="react, hooks, localStorage" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />}
              {saving ? 'Saving...' : 'Save Snippet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
