const { Project, ProjectMember, Workspace, User, WorkspaceMember } = require('../models');

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { name, description, workspaceId, color } = req.body;
    if (!name || !workspaceId) return res.status(400).json({ error: 'Name and workspaceId required' });

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    // Free plan limit
    const count = await Project.count({ where: { workspace_id: workspaceId } });
    if (workspace.plan === 'free' && count >= 3) {
      return res.status(403).json({ error: 'Free plan allows max 3 projects. Upgrade to Pro.' });
    }

    const project = await Project.create({
      name,
      description,
      workspace_id: workspaceId,
      color: color || '#7C3AED',
      created_by: req.user.id,
    });

    await ProjectMember.create({ project_id: project.id, user_id: req.user.id });

    const full = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'avatar'], through: { attributes: [] } },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
    });
    res.status(201).json({ project: full });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/projects?workspaceId=
exports.getProjects = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const where = workspaceId ? { workspace_id: workspaceId } : {};

    const projects = await Project.findAll({
      where,
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'avatar'], through: { attributes: [] } },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'avatar', 'email'], through: { attributes: [] } },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: Workspace, attributes: ['id', 'name', 'slug', 'plan'] },
      ],
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.update(req.body);
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/projects/:id/members
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    await ProjectMember.findOrCreate({ where: { project_id: req.params.id, user_id: userId } });
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
