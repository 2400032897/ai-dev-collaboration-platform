const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const crypto = require('crypto');
const { Workspace, WorkspaceMember, User, Project, sequelize } = require('../models');

const generateSlug = (name) => {
  const base = slugify(name, { lower: true, strict: true });
  const suffix = uuidv4().slice(0, 6);
  return `${base}-${suffix}`;
};

const generateInviteToken = () => crypto.randomBytes(32).toString('hex');

// POST /api/workspaces
exports.createWorkspace = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Workspace name is required' });

    const workspace = await Workspace.create({
      name,
      description,
      owner_id: req.user.id,
      slug: generateSlug(name),
      invite_token: generateInviteToken(),
    }, { transaction: t });

    await WorkspaceMember.create({
      workspace_id: workspace.id,
      user_id: req.user.id,
      role: 'Owner',
    }, { transaction: t });

    await t.commit();

    const full = await Workspace.findByPk(workspace.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'avatar'], through: { attributes: ['role'] } },
      ],
    });
    res.status(201).json({ workspace: full });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

// GET /api/workspaces
exports.getMyWorkspaces = async (req, res) => {
  try {
    const memberships = await WorkspaceMember.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Workspace,
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'avatar'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'avatar'], through: { attributes: ['role'] } },
          { model: Project, as: 'projects', attributes: ['id', 'name', 'color'] },
        ],
      }],
    });
    const workspaces = memberships.map(m => ({ ...m.Workspace.toJSON(), myRole: m.role }));
    res.json({ workspaces });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/workspaces/:slug
exports.getWorkspaceBySlug = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      where: { slug: req.params.slug },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'avatar', 'email'], through: { attributes: ['role', 'joined_at'] } },
        { model: Project, as: 'projects', attributes: ['id', 'name', 'color', 'description'] },
      ],
    });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const isMember = await WorkspaceMember.findOne({ where: { workspace_id: workspace.id, user_id: req.user.id } });
    if (!isMember) return res.status(403).json({ error: 'Not a member of this workspace' });

    res.json({ workspace, myRole: isMember.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/workspaces/:id/invite
exports.regenerateInvite = async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    if (workspace.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can regenerate invite' });

    await workspace.update({ invite_token: generateInviteToken() });
    res.json({ invite_token: workspace.invite_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/workspaces/join/:token
exports.joinWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({ where: { invite_token: req.params.token } });
    if (!workspace) return res.status(404).json({ error: 'Invalid invite token' });

    const existing = await WorkspaceMember.findOne({ where: { workspace_id: workspace.id, user_id: req.user.id } });
    if (existing) return res.json({ message: 'Already a member', workspace });

    await WorkspaceMember.create({ workspace_id: workspace.id, user_id: req.user.id, role: 'Member' });
    res.json({ message: 'Joined workspace successfully', workspace });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/workspaces/:id/members/:userId/role
exports.changeMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const member = await WorkspaceMember.findOne({
      where: { workspace_id: req.params.id, user_id: req.params.userId },
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    await member.update({ role });
    res.json({ member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/workspaces/:id/members/:userId
exports.removeMember = async (req, res) => {
  try {
    const deleted = await WorkspaceMember.destroy({
      where: { workspace_id: req.params.id, user_id: req.params.userId },
    });
    if (!deleted) return res.status(404).json({ error: 'Member not found' });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/workspaces/:id/upgrade
exports.upgradePlan = async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    await workspace.update({ plan: 'pro' });
    res.json({ message: 'Upgraded to Pro', workspace });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
