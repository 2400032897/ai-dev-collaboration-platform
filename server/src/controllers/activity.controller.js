const { Activity, User, Project } = require('../models');

// GET /api/activity?workspaceId=&projectId=&page=1&limit=20
exports.getActivity = async (req, res) => {
  try {
    const { workspaceId, projectId, page = 1, limit = 20 } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' });

    const where = { workspace_id: workspaceId };
    if (projectId) where.project_id = projectId;

    const activities = await Activity.findAll({
      where,
      include: [
        { model: User, as: 'actor', attributes: ['id', 'name', 'avatar'] },
        { model: Project, attributes: ['id', 'name', 'color'] },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
