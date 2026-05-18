const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WikiPage = sequelize.define('WikiPage', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT('long'), allowNull: true },
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
  last_edited_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'wiki_pages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = WikiPage;
