const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Workspace = sequelize.define('Workspace', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  owner_id: { type: DataTypes.INTEGER, allowNull: false },
  invite_token: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  plan: { type: DataTypes.ENUM('free', 'pro'), defaultValue: 'free' },
}, {
  tableName: 'workspaces',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Workspace;
