require('dotenv').config();
const sequelize = require('../config/db');

const User = require('./User');
const Workspace = require('./Workspace');
const WorkspaceMember = require('./WorkspaceMember');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');
const Comment = require('./Comment');
const Snippet = require('./Snippet');
const WikiPage = require('./WikiPage');
const WikiVersion = require('./WikiVersion');
const Notification = require('./Notification');
const Activity = require('./Activity');

// ── User associations ──────────────────────────────────────────────────────
User.hasMany(Workspace, { foreignKey: 'owner_id', as: 'ownedWorkspaces' });
User.belongsToMany(Workspace, { through: WorkspaceMember, foreignKey: 'user_id', as: 'workspaces' });
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'user_id', as: 'projects' });
User.hasMany(Task, { foreignKey: 'assignee_id', as: 'assignedTasks' });
User.hasMany(Comment, { foreignKey: 'author_id', as: 'comments' });
User.hasMany(Notification, { foreignKey: 'recipient_id', as: 'notifications' });

// ── Workspace associations ─────────────────────────────────────────────────
Workspace.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Workspace.belongsToMany(User, { through: WorkspaceMember, foreignKey: 'workspace_id', as: 'members' });
Workspace.hasMany(Project, { foreignKey: 'workspace_id', as: 'projects' });
Workspace.hasMany(WorkspaceMember, { foreignKey: 'workspace_id', as: 'workspaceMembers' });

// ── Project associations ───────────────────────────────────────────────────
Project.belongsTo(Workspace, { foreignKey: 'workspace_id' });
Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'project_id', as: 'members' });
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Project.hasMany(Snippet, { foreignKey: 'project_id', as: 'snippets' });
Project.hasMany(WikiPage, { foreignKey: 'project_id', as: 'wikiPages' });

// ── Task associations ──────────────────────────────────────────────────────
Task.belongsTo(Project, { foreignKey: 'project_id' });
Task.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Task.hasMany(Comment, { foreignKey: 'task_id', as: 'comments' });

// ── Comment associations ───────────────────────────────────────────────────
Comment.belongsTo(Task, { foreignKey: 'task_id' });
Comment.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// ── WikiPage associations ──────────────────────────────────────────────────
WikiPage.belongsTo(Project, { foreignKey: 'project_id' });
WikiPage.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
WikiPage.belongsTo(User, { foreignKey: 'last_edited_by', as: 'lastEditor' });
WikiPage.hasMany(WikiVersion, { foreignKey: 'wiki_page_id', as: 'versions' });

// ── WikiVersion associations ───────────────────────────────────────────────
WikiVersion.belongsTo(WikiPage, { foreignKey: 'wiki_page_id' });
WikiVersion.belongsTo(User, { foreignKey: 'edited_by', as: 'editor' });

// ── Snippet associations ───────────────────────────────────────────────────
Snippet.belongsTo(Project, { foreignKey: 'project_id' });
Snippet.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Notification associations ──────────────────────────────────────────────
Notification.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// ── Activity associations ──────────────────────────────────────────────────
Activity.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });
Activity.belongsTo(Project, { foreignKey: 'project_id' });
Activity.belongsTo(Workspace, { foreignKey: 'workspace_id' });

// ── WorkspaceMember associations ───────────────────────────────────────────
WorkspaceMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
WorkspaceMember.belongsTo(Workspace, { foreignKey: 'workspace_id' });

// ── Sync DB ────────────────────────────────────────────────────────────────
const syncDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized');
    }
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  syncDB,
  User,
  Workspace,
  WorkspaceMember,
  Project,
  ProjectMember,
  Task,
  Comment,
  Snippet,
  WikiPage,
  WikiVersion,
  Notification,
  Activity,
};
