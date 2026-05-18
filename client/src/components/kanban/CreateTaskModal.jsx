import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import api from '../../api';

export default function CreateTaskModal({ isOpen, onClose, projectId, workspaceId, defaultStatus, members, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', status: defaultStatus || 'todo',
    priority: 'P1', assigneeId: '', labels: '', dueDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(prev => ({ ...prev, status: defaultStatus || 'todo' }));
  }, [defaultStatus]);

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        projectId,
        workspaceId,
        status: form.status,
        priority: form.priority,
        assigneeId: form.assigneeId || null,
        labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || null,
      };
      const res = await api.post('/tasks', payload);
      onCreated(res.data.task);
      setForm({ title: '', description: '', status: defaultStatus || 'todo', priority: 'P1', assigneeId: '', labels: '', dueDate: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
          <input type="text" id="task-title-input" value={form.title} onChange={set('title')}
            className="input" placeholder="Task title..." required autoFocus />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')}
            className="input resize-none" rows={3} placeholder="Optional description..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
            <select value={form.status} onChange={set('status')} className="input">
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="inreview">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
            <select value={form.priority} onChange={set('priority')} className="input">
              <option value="P0">P0 — Critical</option>
              <option value="P1">P1 — Important</option>
              <option value="P2">P2 — Nice-to-have</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Assignee</label>
            <select value={form.assigneeId} onChange={set('assigneeId')} className="input">
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Due Date</label>
            <input type="date" value={form.dueDate} onChange={set('dueDate')} className="input" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Labels (comma-separated)</label>
          <input type="text" value={form.labels} onChange={set('labels')}
            className="input" placeholder="frontend, bug, ui" />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            {loading && <Spinner size="sm" />}
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
