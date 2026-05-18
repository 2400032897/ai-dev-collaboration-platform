const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WikiVersion = sequelize.define('WikiVersion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  wiki_page_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT('long'), allowNull: false },
  edited_by: { type: DataTypes.INTEGER, allowNull: false },
  edited_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'wiki_versions',
  timestamps: false,
});

module.exports = WikiVersion;
