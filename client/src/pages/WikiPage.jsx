import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useToast } from '../components/shared/Toast';
import Spinner from '../components/shared/Spinner';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import Avatar from '../components/shared/Avatar';
import api from '../api';
import { format } from 'date-fns';

export default function WikiPageComponent() {
  const { projectId } = useParams();
  const { addToast } = useToast();
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const autoSaveTimer = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Auto-save with 1500ms debounce
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        if (selectedPage) autoSave(editor.getJSON());
      }, 1500);
    },
  });

  useEffect(() => {
    fetchPages();
  }, [projectId]);

  useEffect(() => {
    if (selectedPage && editor) {
      try {
        const content = typeof selectedPage.content === 'string'
          ? JSON.parse(selectedPage.content)
          : selectedPage.content;
        editor.commands.setContent(content || '');
      } catch {
        editor.commands.setContent(selectedPage.content || '');
      }
    }
  }, [selectedPage?.id, editor]);

  const fetchPages = async () => {
    try {
      const res = await api.get(`/wiki?projectId=${projectId}`);
      setPages(res.data.pages);
      if (res.data.pages.length > 0) loadPage(res.data.pages[0].id);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadPage = async (id) => {
    try {
      const res = await api.get(`/wiki/${id}`);
      setSelectedPage(res.data.page);
    } catch {}
  };

  const autoSave = useCallback(async (content) => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      await api.patch(`/wiki/${selectedPage.id}`, { content: JSON.stringify(content) });
    } catch {} finally {
      setSaving(false);
    }
  }, [selectedPage]);

  const createPage = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/wiki', { title: newTitle, projectId });
      setPages(prev => [res.data.page, ...prev]);
      setSelectedPage(res.data.page);
      setShowCreate(false);
      setNewTitle('');
      addToast('Page created!', 'success');
    } catch {
      addToast('Failed to create page', 'error');
    }
  };

  const loadVersions = async () => {
    try {
      const res = await api.get(`/wiki/${selectedPage.id}/versions`);
      setVersions(res.data.versions);
      setShowVersions(true);
    } catch {}
  };

  const restoreVersion = async (version) => {
    if (!editor) return;
    try {
      const content = typeof version.content === 'string' ? JSON.parse(version.content) : version.content;
      editor.commands.setContent(content || '');
      await autoSave(content);
      addToast('Version restored!', 'success');
      setShowVersions(false);
    } catch {}
  };

  const deletePage = async () => {
    if (!selectedPage) return;
    try {
      await api.delete(`/wiki/${selectedPage.id}`);
      const remaining = pages.filter(p => p.id !== selectedPage.id);
      setPages(remaining);
      setSelectedPage(null);
      if (remaining.length > 0) loadPage(remaining[0].id);
      addToast('Page deleted', 'success');
    } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">📖 Wiki</h2>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-gray-500 flex items-center gap-1"><Spinner size="sm" /> Saving...</span>}
          {selectedPage && (
            <button onClick={loadVersions} className="btn-ghost text-sm">History</button>
          )}
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm" id="new-wiki-page-btn">
            + New Page
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Page list */}
        <div className="w-56 border-r border-white/10 overflow-y-auto">
          <div className="p-3 space-y-1">
            {loading ? (
              <div className="flex justify-center py-4"><Spinner size="sm" /></div>
            ) : pages.length === 0 ? (
              <EmptyState icon="📖" title="No pages" description="Create your first wiki page" />
            ) : (
              pages.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadPage(p.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors
                    ${selectedPage?.id === p.id ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {p.creator?.name}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPage ? (
            <>
              {/* Page title */}
              <div className="px-8 pt-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-white">{selectedPage.title}</h1>
                  <button onClick={deletePage} className="btn-ghost text-red-400 hover:text-red-300 text-sm">
                    Delete
                  </button>
                </div>
                {selectedPage.lastEditor && (
                  <p className="text-xs text-gray-600 mt-1">
                    Last edited by {selectedPage.lastEditor.name}
                  </p>
                )}

                {/* TipTap Toolbar */}
                <div className="flex items-center gap-1 mt-4 flex-wrap">
                  {[
                    { label: 'H1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive('heading', { level: 1 }) },
                    { label: 'H2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive('heading', { level: 2 }) },
                    { label: 'H3', action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive('heading', { level: 3 }) },
                    { label: 'B', action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold'), bold: true },
                    { label: 'I', action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic'), italic: true },
                    { label: '• List', action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive('bulletList') },
                    { label: '1. List', action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive('orderedList') },
                    { label: '</>', action: () => editor?.chain().focus().toggleCodeBlock().run(), active: editor?.isActive('codeBlock') },
                    { label: '— Line', action: () => editor?.chain().focus().setHorizontalRule().run() },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      onClick={btn.action}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors
                        ${btn.active ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400 hover:text-white border border-white/10'}
                        ${btn.bold ? 'font-bold' : ''}
                        ${btn.italic ? 'italic' : ''}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor content */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="tiptap-editor max-w-3xl">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon="📖"
              title="No page selected"
              description="Select a page from the list or create a new one"
              action={() => setShowCreate(true)}
              actionLabel="New Page"
            />
          )}
        </div>
      </div>

      {/* Create Page Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Wiki Page" size="sm">
        <form onSubmit={createPage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Page Title *</label>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="input"
              placeholder="e.g. Getting Started"
              required autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Page</button>
          </div>
        </form>
      </Modal>

      {/* Version History Modal */}
      <Modal isOpen={showVersions} onClose={() => setShowVersions(false)} title="Version History" size="md">
        <div className="space-y-3">
          {versions.length === 0 ? (
            <p className="text-gray-500 text-sm">No previous versions</p>
          ) : (
            versions.map(v => (
              <div key={v.id} className="flex items-center justify-between p-4 glass rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <Avatar name={v.editor?.name} size="xs" />
                    <span className="text-sm font-medium text-white">{v.editor?.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(v.edited_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <button onClick={() => restoreVersion(v)} className="btn-secondary text-xs">
                  Restore
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
