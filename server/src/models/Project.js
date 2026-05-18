const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  workspace_id: { type: DataTypes.INTEGER, allowNull: false },
  color: { type: DataTypes.STRING(7), defaultValue: '#7C3AED' },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Project;
