const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WorkspaceMember = sequelize.define('WorkspaceMember', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  workspace_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.ENUM('Owner', 'Admin', 'Member', 'Viewer'), defaultValue: 'Member' },
  joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'workspace_members',
  timestamps: false,
  indexes: [{ unique: true, fields: ['workspace_id', 'user_id'] }],
});

module.exports = WorkspaceMember;
