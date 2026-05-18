const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  workspace_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('todo', 'inprogress', 'inreview', 'done'), defaultValue: 'todo' },
  priority: { type: DataTypes.ENUM('P0', 'P1', 'P2'), defaultValue: 'P1' },
  assignee_id: { type: DataTypes.INTEGER, allowNull: true },
  labels: { type: DataTypes.JSON, allowNull: true },
  due_date: { type: DataTypes.DATE, allowNull: true },
  order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Task;
