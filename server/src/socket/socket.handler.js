const presence = new Map(); // projectId → Set of { userId, userName, socketId }

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    console.log(`🔌 Socket connected: ${socket.id} (user: ${userId})`);

    // Join user's private room for notifications
    if (userId) socket.join(`user:${userId}`);

    socket.on('join_workspace', ({ workspaceId }) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`👥 User ${userId} joined workspace:${workspaceId}`);
    });

    socket.on('join_project', ({ projectId, userName }) => {
      socket.join(`project:${projectId}`);
      socket.data.projectId = projectId;
      socket.data.userName = userName;
      socket.data.userId = userId;
      console.log(`📋 User ${userId} joined project:${projectId}`);
    });

    socket.on('leave_project', ({ projectId }) => {
      socket.leave(`project:${projectId}`);
      removePresence(projectId, userId, io);
    });

    socket.on('board_presence', ({ projectId, userName }) => {
      if (!presence.has(projectId)) presence.set(projectId, new Set());
      // Remove old entry for this user if exists
      const users = presence.get(projectId);
      for (const u of users) {
        if (u.userId == userId) { users.delete(u); break; }
      }
      users.add({ userId, userName, socketId: socket.id });
      io.to(`project:${projectId}`).emit('board:presence_update',
        Array.from(users)
      );
    });

    socket.on('wiki_editing', ({ pageId }) => {
      socket.to(`project:${socket.data.projectId}`).emit('wiki:someone_editing', {
        pageId,
        userId,
        userName: socket.data.userName,
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id} (user: ${userId})`);
      presence.forEach((users, projectId) => {
        removePresence(projectId, userId, io);
      });
    });
  });
};

function removePresence(projectId, userId, io) {
  const users = presence.get(projectId);
  if (!users) return;
  for (const u of users) {
    if (u.userId == userId) { users.delete(u); break; }
  }
  io.to(`project:${projectId}`).emit('board:presence_update', Array.from(users));
}
