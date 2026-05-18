const { WorkspaceMember } = require('../models');

const requireRole = (...roles) => async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;
    if (!workspaceId) return next();

    const member = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: req.user.id },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a workspace member' });
    }

    if (roles.length && !roles.includes(member.role)) {
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
    }

    req.memberRole = member.role;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = requireRole;
