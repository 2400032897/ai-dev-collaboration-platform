const { Op } = require('sequelize');
const { Snippet, User, sequelize } = require('../models');

// GET /api/snippets?projectId=&search=&tag=
exports.getSnippets = async (req, res) => {
  try {
    const { projectId, search, tag } = req.query;
    const where = {};
    if (projectId) where.project_id = projectId;

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (tag) {
      where[Op.and] = sequelize.literal(`JSON_CONTAINS(tags, '"${tag}"')`);
    }

    const snippets = await Snippet.findAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] }],
      order: [['created_at', 'DESC']],
    });
    res.json({ snippets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/snippets
exports.createSnippet = async (req, res) => {
  try {
    const { title, language, code, description, tags, projectId } = req.body;
    if (!title || !language || !code || !projectId) {
      return res.status(400).json({ error: 'title, language, code, projectId required' });
    }
    const snippet = await Snippet.create({
      title, language, code, description,
      tags: tags || [],
      project_id: projectId,
      created_by: req.user.id,
    });
    const full = await Snippet.findByPk(snippet.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] }],
    });
    res.status(201).json({ snippet: full });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/snippets/:id
exports.updateSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findByPk(req.params.id);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
    await snippet.update(req.body);
    res.json({ snippet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/snippets/:id
exports.deleteSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findByPk(req.params.id);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
    await snippet.destroy();
    res.json({ message: 'Snippet deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
