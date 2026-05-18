const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Snippet = sequelize.define('Snippet', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  language: { type: DataTypes.STRING(50), allowNull: false },
  code: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  tags: { type: DataTypes.JSON, allowNull: true },
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'snippets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Snippet;
