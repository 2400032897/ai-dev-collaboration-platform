import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Avatar from '../shared/Avatar';
import Badge from '../shared/Badge';
import Spinner from '../shared/Spinner';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../shared/Toast';
import api from '../../api';
import { format } from 'date-fns';

export default function TaskDetailModal({ task, projectId, project, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...task });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [task.id]);

  const loadComments = async () => {
    try {
      const res = await api.get(`/tasks/${task.id}/comments`);
      setComments(res.data.comments);
    } catch {} finally {
      setLoadingComments(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/tasks/${task.id}`, {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        assigneeId: form.assignee_id,
        labels: typeof form.labels === 'string' ? form.labels.split(',').map(l => l.trim()) : form.labels,
        dueDate: form.due_date,
      });
      onUpdated(res.data.task);
      addToast('Task updated', 'success');
    } catch (err) {
      addToast('Failed to update task', 'error');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      onDeleted(task.id);
      addToast('Task deleted', 'success');
    } catch {
      addToast('Failed to delete task', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await api.post(`/tasks/${task.id}/comments`, { content: newComment });
      setComments(prev => [...prev, res.data.comment]);
      setNewComment('');
    } catch {
      addToast('Failed to post comment', 'error');
    } finally {
      setPostingComment(false);
    }
  };

  const members = project?.members || [];

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="" size="lg" className="!p-0">
        <div className="flex flex-col gap-0 -m-6">
          {/* Task header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start justify-between gap-3 mb-3">
              {editing ? (
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="input flex-1 text-lg font-semibold"
                />
              ) : (
                <h2 className="text-xl font-semibold text-white flex-1">{task.title}</h2>
              )}
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
                    <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-1.5" disabled={saving}>
                      {saving && <Spinner size="sm" />} Save
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditing(true)} className="btn-ghost text-sm">Edit</button>
                    <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">Delete</button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={task.priority}>{task.priority}</Badge>
              <Badge variant={task.status}>{task.status === 'inprogress' ? 'In Progress' : task.status === 'inreview' ? 'In Review' : task.status}</Badge>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 divide-x divide-white/10">
            {/* Left: Description + Comments */}
            <div className="flex-1 p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                {editing ? (
                  <textarea
                    value={form.description || ''}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="input resize-none w-full"
                    rows={4}
                    placeholder="Add a description..."
                  />
                ) : (
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {task.description || <span className="text-gray-600 italic">No description</span>}
                  </p>
                )}
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Comments ({comments.length})
                </h3>
                {loadingComments ? (
                  <Spinner size="sm" />
                ) : (
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar name={c.author?.name} src={c.author?.avatar} size="sm" className="flex-shrink-0" />
                        <div className="bg-dark-700 rounded-lg p-3 flex-1 border border-white/5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{c.author?.name}</span>
                            <span className="text-xs text-gray-600">
                              {format(new Date(c.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-sm text-gray-600 italic">No comments yet</p>
                    )}
                  </div>
                )}
                {/* Comment input */}
                <div className="flex gap-3">
                  <Avatar name={user?.name} src={user?.avatar} size="sm" className="flex-shrink-0" />
                  <div className="flex-1 flex gap-2">
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }}
                      className="input flex-1 text-sm"
                      placeholder="Comment... (use @name to mention)"
                      id="comment-input"
                    />
                    <button onClick={postComment} className="btn-primary text-sm px-3" disabled={postingComment}>
                      {postingComment ? <Spinner size="sm" /> : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Metadata */}
            <div className="w-full lg:w-64 p-6 space-y-4 flex-shrink-0">
              {/* Status */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                {editing ? (
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="input text-sm"
                  >
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="inreview">In Review</option>
                    <option value="done">Done</option>
                  </select>
                ) : (
                  <Badge variant={task.status}>{task.status}</Badge>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                {editing ? (
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="input text-sm">
                    <option value="P0">P0 — Critical</option>
                    <option value="P1">P1 — Important</option>
                    <option value="P2">P2 — Nice-to-have</option>
                  </select>
                ) : (
                  <Badge variant={task.priority}>{task.priority}</Badge>
                )}
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Assignee</label>
                {editing ? (
                  <select
                    value={form.assignee_id || ''}
                    onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value || null }))}
                    className="input text-sm"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                ) : task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={task.assignee.name} src={task.assignee.avatar} size="sm" />
                    <span className="text-sm text-gray-300">{task.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-600">Unassigned</span>
                )}
              </div>

              {/* Due date */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                {editing ? (
                  <input type="date" value={form.due_date ? form.due_date.slice(0, 10) : ''}
                    onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                    className="input text-sm" />
                ) : task.due_date ? (
                  <span className="text-sm text-gray-300">
                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-600">No due date</span>
                )}
              </div>

              {/* Labels */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Labels</label>
                {editing ? (
                  <input
                    value={Array.isArray(form.labels) ? form.labels.join(', ') : form.labels || ''}
                    onChange={e => setForm(p => ({ ...p, labels: e.target.value }))}
                    className="input text-sm"
                    placeholder="tag1, tag2"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels?.length ? task.labels.map(l => (
                      <Badge key={l} variant="primary" className="text-xs">{l}</Badge>
                    )) : <span className="text-sm text-gray-600">No labels</span>}
                  </div>
                )}
              </div>

              {/* Creator */}
              {task.creator && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Created By</label>
                  <div className="flex items-center gap-2">
                    <Avatar name={task.creator.name} size="xs" />
                    <span className="text-xs text-gray-400">{task.creator.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        loading={deleting}
      />
    </>
  );
}
