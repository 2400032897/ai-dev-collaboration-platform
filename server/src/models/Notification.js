const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  recipient_id: { type: DataTypes.INTEGER, allowNull: false },
  sender_id: { type: DataTypes.INTEGER, allowNull: true },
  type: {
    type: DataTypes.ENUM('mention', 'task_assigned', 'task_moved', 'comment', 'member_joined'),
    allowNull: false,
  },
  message: { type: DataTypes.STRING(500), allowNull: false },
  link: { type: DataTypes.STRING(500), allowNull: true },
  is_read: { type: DataTypes.TINYINT(1), defaultValue: 0 },
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Notification;
