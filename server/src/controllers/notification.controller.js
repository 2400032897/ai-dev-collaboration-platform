const { Notification, User } = require('../models');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipient_id: req.user.id },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    const unreadCount = notifications.filter(n => !n.is_read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.update({ is_read: 1 }, { where: { id: req.params.id, recipient_id: req.user.id } });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.update({ is_read: 1 }, { where: { recipient_id: req.user.id, is_read: 0 } });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
