const { Op } = require('sequelize');
const { Task, User, Comment, Project, Notification, Activity } = require('../models');

let _io = null;
exports.setIO = (io) => { _io = io; };

const createNotification = async ({ recipientId, senderId, type, message, link }) => {
  const notif = await Notification.create({ recipient_id: recipientId, sender_id: senderId, type, message, link });
  if (_io) _io.to(`user:${recipientId}`).emit('notification:new', notif);
  return notif;
};

const logActivity = async ({ workspaceId, projectId, actorId, action, meta }) => {
  await Activity.create({ workspace_id: workspaceId, project_id: projectId, actor_id: actorId, action, meta });
};

// GET /api/tasks?projectId=
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });

    const tasks = await Task.findAll({
      where: { project_id: projectId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: Comment, as: 'comments', attributes: ['id'] },
      ],
      order: [['status', 'ASC'], ['order_index', 'ASC']],
    });

    const grouped = { todo: [], inprogress: [], inreview: [], done: [] };
    tasks.forEach(t => {
      const taskData = t.toJSON();
      taskData.commentCount = taskData.comments ? taskData.comments.length : 0;
      delete taskData.comments;
      if (grouped[t.status]) grouped[t.status].push(taskData);
    });

    res.json({ tasks: grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, workspaceId, status, priority, assigneeId, labels, dueDate, orderIndex } = req.body;
    if (!title || !projectId || !workspaceId) return res.status(400).json({ error: 'title, projectId, workspaceId required' });

    const task = await Task.create({
      title,
      description,
      project_id: projectId,
      workspace_id: workspaceId,
      status: status || 'todo',
      priority: priority || 'P1',
      assignee_id: assigneeId || null,
      labels: labels || [],
      due_date: dueDate || null,
      order_index: orderIndex || 0,
      created_by: req.user.id,
    });

    const full = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
    });

    if (_io) _io.to(`project:${projectId}`).emit('task:created', full);

    // Notify assignee
    if (assigneeId && assigneeId !== req.user.id) {
      await createNotification({
        recipientId: assigneeId, senderId: req.user.id,
        type: 'task_assigned',
        message: `${req.user.name} assigned you a task: ${title}`,
        link: `/project/${projectId}/board?task=${task.id}`,
      });
    }

    await logActivity({ workspaceId, projectId, actorId: req.user.id, action: 'task_created', meta: { taskTitle: title } });
    res.status(201).json({ task: full });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const prevAssignee = task.assignee_id;
    await task.update({
      title: req.body.title !== undefined ? req.body.title : task.title,
      description: req.body.description !== undefined ? req.body.description : task.description,
      status: req.body.status || task.status,
      priority: req.body.priority || task.priority,
      assignee_id: req.body.assigneeId !== undefined ? req.body.assigneeId : task.assignee_id,
      labels: req.body.labels !== undefined ? req.body.labels : task.labels,
      due_date: req.body.dueDate !== undefined ? req.body.dueDate : task.due_date,
      order_index: req.body.orderIndex !== undefined ? req.body.orderIndex : task.order_index,
    });

    const full = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
    });

    if (_io) _io.to(`project:${task.project_id}`).emit('task:updated', full);

    // Notify new assignee
    if (req.body.assigneeId && req.body.assigneeId !== prevAssignee && req.body.assigneeId !== req.user.id) {
      await createNotification({
        recipientId: req.body.assigneeId, senderId: req.user.id,
        type: 'task_assigned',
        message: `${req.user.name} assigned you a task: ${task.title}`,
        link: `/project/${task.project_id}/board?task=${task.id}`,
      });
    }

    res.json({ task: full });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tasks/:id/move
exports.moveTask = async (req, res) => {
  try {
    const { newStatus, newOrderIndex, projectId } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const oldStatus = task.status;
    await task.update({ status: newStatus, order_index: newOrderIndex });

    // Reorder other tasks in that column
    await Task.increment('order_index', {
      by: 1,
      where: {
        project_id: projectId,
        status: newStatus,
        order_index: { [Op.gte]: newOrderIndex },
        id: { [Op.ne]: task.id },
      },
    });

    if (_io) _io.to(`project:${projectId}`).emit('task:moved', { taskId: task.id, newStatus, newOrderIndex, oldStatus });

    await logActivity({
      workspaceId: task.workspace_id, projectId,
      actorId: req.user.id, action: 'task_moved',
      meta: { taskTitle: task.title, from: oldStatus, to: newStatus },
    });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const projectId = task.project_id;
    await task.destroy();
    if (_io) _io.to(`project:${projectId}`).emit('task:deleted', { taskId: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tasks/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Parse @mentions
    const mentionRegex = /@(\w+)/g;
    const usernames = [...content.matchAll(mentionRegex)].map(m => m[1]);
    const mentionedUsers = usernames.length
      ? await User.findAll({ where: { name: { [Op.in]: usernames } } })
      : [];

    const comment = await Comment.create({
      task_id: task.id,
      author_id: req.user.id,
      content,
      mentions: mentionedUsers.map(u => u.id),
    });

    const full = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }],
    });

    if (_io) _io.to(`project:${task.project_id}`).emit('task:comment_added', { taskId: task.id, comment: full });

    // Send mention notifications
    for (const u of mentionedUsers) {
      if (u.id !== req.user.id) {
        await createNotification({
          recipientId: u.id, senderId: req.user.id,
          type: 'mention',
          message: `${req.user.name} mentioned you in a comment`,
          link: `/project/${task.project_id}/board?task=${task.id}`,
        });
      }
    }

    // Notify task assignee
    if (task.assignee_id && task.assignee_id !== req.user.id) {
      const alreadyMentioned = mentionedUsers.find(u => u.id === task.assignee_id);
      if (!alreadyMentioned) {
        await createNotification({
          recipientId: task.assignee_id, senderId: req.user.id,
          type: 'comment',
          message: `${req.user.name} commented on a task assigned to you`,
          link: `/project/${task.project_id}/board?task=${task.id}`,
        });
      }
    }

    res.status(201).json({ comment: full });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/:id/comments
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { task_id: req.params.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }],
      order: [['created_at', 'ASC']],
    });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
