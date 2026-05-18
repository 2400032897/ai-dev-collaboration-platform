import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/shared/Toast';
import Avatar from '../components/shared/Avatar';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import Spinner from '../components/shared/Spinner';
import TaskDetailModal from '../components/kanban/TaskDetailModal';
import CreateTaskModal from '../components/kanban/CreateTaskModal';
import StandupModal from '../components/ai/StandupModal';
import api from '../api';
import { formatDistanceToNow, isPast } from 'date-fns';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'text-gray-400', dot: 'bg-gray-500' },
  { id: 'inprogress', label: 'In Progress', color: 'text-blue-400', dot: 'bg-blue-500' },
  { id: 'inreview', label: 'In Review', color: 'text-amber-400', dot: 'bg-amber-500' },
  { id: 'done', label: 'Done', color: 'text-green-400', dot: 'bg-green-500' },
];

export default function KanbanPage() {
  const { projectId, slug } = useParams();
  const { user } = useAuth();
  const { getSocket } = useSocket();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState({ todo: [], inprogress: [], inreview: [], done: [] });
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createStatus, setCreateStatus] = useState('todo');
  const [presence, setPresence] = useState([]);
  const [showStandup, setShowStandup] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !projectId) return;

    socket.emit('join_project', { projectId, userName: user?.name });
    socket.emit('board_presence', { projectId, userName: user?.name });

    socket.on('task:created', (task) => {
      setTasks(prev => ({
        ...prev,
        [task.status]: [...(prev[task.status] || []), task],
      }));
    });

    socket.on('task:updated', (task) => {
      setTasks(prev => {
        const updated = { ...prev };
        for (const col of Object.keys(updated)) {
          updated[col] = updated[col].map(t => t.id === task.id ? task : t);
        }
        return updated;
      });
    });

    socket.on('task:moved', ({ taskId, newStatus, oldStatus }) => {
      setTasks(prev => {
        const updated = { ...prev };
        let movedTask = null;
        for (const col of Object.keys(updated)) {
          const idx = updated[col].findIndex(t => t.id === taskId);
          if (idx !== -1) {
            movedTask = updated[col][idx];
            updated[col] = updated[col].filter(t => t.id !== taskId);
            break;
          }
        }
        if (movedTask) {
          updated[newStatus] = [...(updated[newStatus] || []), { ...movedTask, status: newStatus }];
        }
        return updated;
      });
    });

    socket.on('task:deleted', ({ taskId }) => {
      setTasks(prev => {
        const updated = { ...prev };
        for (const col of Object.keys(updated)) {
          updated[col] = updated[col].filter(t => t.id !== taskId);
        }
        return updated;
      });
    });

    socket.on('task:comment_added', ({ taskId }) => {
      setTasks(prev => {
        const updated = { ...prev };
        for (const col of Object.keys(updated)) {
          updated[col] = updated[col].map(t =>
            t.id === taskId ? { ...t, commentCount: (t.commentCount || 0) + 1 } : t
          );
        }
        return updated;
      });
    });

    socket.on('tasks:bulk_created', (newTasks) => {
      setTasks(prev => ({
        ...prev,
        todo: [...(prev.todo || []), ...newTasks],
      }));
      addToast(`${newTasks.length} tasks added from AI breakdown!`, 'success');
    });

    socket.on('board:presence_update', (users) => {
      setPresence(users.filter(u => u.userId !== user?.id));
    });

    return () => {
      socket.emit('leave_project', { projectId });
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('task:comment_added');
      socket.off('tasks:bulk_created');
      socket.off('board:presence_update');
    };
  }, [projectId, user]);

  const fetchData = async () => {
    try {
      const [tasksRes, projRes] = await Promise.all([
        api.get(`/tasks?projectId=${projectId}`),
        api.get(`/projects/${projectId}`),
      ]);
      setTasks(tasksRes.data.tasks);
      setProject(projRes.data.project);
    } catch (err) {
      addToast('Failed to load board', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    let found = null;
    for (const col of Object.values(tasks)) {
      found = col.find(t => t.id === active.id);
      if (found) break;
    }
    setActiveTask(found);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    // Determine target column
    const overId = over.id;
    let targetStatus = COLUMNS.find(c => c.id === overId)?.id;
    if (!targetStatus) {
      for (const [col, colTasks] of Object.entries(tasks)) {
        if (colTasks.find(t => t.id === overId)) { targetStatus = col; break; }
      }
    }
    if (!targetStatus) return;

    let sourceStatus = null;
    let task = null;
    for (const [col, colTasks] of Object.entries(tasks)) {
      const found = colTasks.find(t => t.id === active.id);
      if (found) { sourceStatus = col; task = found; break; }
    }
    if (!task || sourceStatus === targetStatus) return;

    const newOrderIndex = tasks[targetStatus].length;

    // Optimistic update
    setTasks(prev => ({
      ...prev,
      [sourceStatus]: prev[sourceStatus].filter(t => t.id !== task.id),
      [targetStatus]: [...prev[targetStatus], { ...task, status: targetStatus }],
    }));

    try {
      await api.patch(`/tasks/${task.id}/move`, {
        newStatus: targetStatus,
        newOrderIndex,
        projectId,
      });
    } catch (err) {
      addToast('Failed to move task', 'error');
      fetchData();
    }
  };

  const handleTaskCreated = (task) => {
    setTasks(prev => ({
      ...prev,
      [task.status || 'todo']: [...(prev[task.status || 'todo'] || []), task],
    }));
    setShowCreateTask(false);
  };

  const handleTaskUpdated = (task) => {
    setTasks(prev => {
      const updated = { ...prev };
      for (const col of Object.keys(updated)) {
        updated[col] = updated[col].map(t => t.id === task.id ? task : t);
      }
      return updated;
    });
    setSelectedTask(null);
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(prev => {
      const updated = { ...prev };
      for (const col of Object.keys(updated)) {
        updated[col] = updated[col].filter(t => t.id !== taskId);
      }
      return updated;
    });
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Kanban Board</h2>
          <div className="text-sm text-gray-500">
            {Object.values(tasks).flat().length} tasks
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Presence avatars */}
          {presence.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">
                {presence.map(p => p.userName).join(', ')} viewing
              </span>
              <div className="flex -space-x-1">
                {presence.slice(0, 3).map(p => (
                  <Avatar key={p.userId} name={p.userName} size="xs" />
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowStandup(true)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            🤖 Standup
          </button>
          <button
            onClick={() => { setCreateStatus('todo'); setShowCreateTask(true); }}
            id="create-task-btn"
            className="btn-primary text-sm"
          >
            + Task
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasks[col.id] || []}
                onTaskClick={setSelectedTask}
                onAddTask={() => { setCreateStatus(col.id); setShowCreateTask(true); }}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          project={project}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={projectId}
        workspaceId={project?.workspace_id}
        defaultStatus={createStatus}
        members={project?.members || []}
        onCreated={handleTaskCreated}
      />

      {/* Standup Modal */}
      <StandupModal
        isOpen={showStandup}
        onClose={() => setShowStandup(false)}
        projectId={projectId}
      />
    </div>
  );
}

function KanbanColumn({ column, tasks, onTaskClick, onAddTask }) {
  return (
    <SortableContext
      id={column.id}
      items={tasks.map(t => t.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="kanban-column" data-column-id={column.id}>
        {/* Column header */}
        <div className="flex items-center justify-between px-1 mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${column.dot}`} />
            <span className={`text-sm font-semibold ${column.color}`}>{column.label}</span>
            <span className="text-xs text-gray-600 bg-dark-700 rounded-full px-2 py-0.5">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={onAddTask}
            className="text-gray-600 hover:text-white hover:bg-white/10 rounded-lg p-1
              transition-colors text-lg leading-none"
          >
            +
          </button>
        </div>

        {/* Tasks */}
        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          {tasks.map(task => (
            <SortableTask key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </div>
    </SortableContext>
  );
}

function SortableTask({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

function TaskCard({ task, onClick, isDragging }) {
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done';

  return (
    <div
      className={`task-card ${isDragging ? 'opacity-50 rotate-1 scale-105' : ''}`}
      onClick={onClick}
      id={`task-card-${task.id}`}
    >
      {/* Priority + Labels row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <Badge variant={task.priority}>{task.priority}</Badge>
        {task.labels?.slice(0, 2).map(l => (
          <Badge key={l} variant="primary" className="text-xs">{l}</Badge>
        ))}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-white leading-snug mb-3 line-clamp-2">{task.title}</p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Assignee */}
          {task.assignee && (
            <Avatar name={task.assignee.name} src={task.assignee.avatar} size="xs" />
          )}
          {/* Due date */}
          {task.due_date && (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'} flex items-center gap-1`}>
              {isOverdue ? '⚠️' : '📅'}
              {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
            </span>
          )}
        </div>
        {/* Comment count */}
        {task.commentCount > 0 && (
          <div className="flex items-center gap-1 text-gray-600 text-xs">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {task.commentCount}
          </div>
        )}
      </div>
    </div>
  );
}
