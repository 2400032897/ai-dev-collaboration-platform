const { WikiPage, WikiVersion, User } = require('../models');

// GET /api/wiki?projectId=
exports.listPages = async (req, res) => {
  try {
    const { projectId } = req.query;
    const pages = await WikiPage.findAll({
      where: projectId ? { project_id: projectId } : {},
      attributes: ['id', 'title', 'project_id', 'created_at', 'updated_at'],
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'lastEditor', attributes: ['id', 'name'] },
      ],
      order: [['updated_at', 'DESC']],
    });
    res.json({ pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/wiki
exports.createPage = async (req, res) => {
  try {
    const { title, content, projectId } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: 'title and projectId required' });
    const page = await WikiPage.create({ title, content, project_id: projectId, created_by: req.user.id });
    res.status(201).json({ page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/wiki/:id
exports.getPage = async (req, res) => {
  try {
    const page = await WikiPage.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'lastEditor', attributes: ['id', 'name'] },
      ],
    });
    if (!page) return res.status(404).json({ error: 'Wiki page not found' });
    res.json({ page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/wiki/:id
exports.updatePage = async (req, res) => {
  try {
    const page = await WikiPage.findByPk(req.params.id);
    if (!page) return res.status(404).json({ error: 'Wiki page not found' });

    // Save version before overwriting
    if (page.content) {
      await WikiVersion.create({
        wiki_page_id: page.id,
        content: page.content,
        edited_by: req.user.id,
      });
    }

    await page.update({
      title: req.body.title || page.title,
      content: req.body.content,
      last_edited_by: req.user.id,
    });

    res.json({ page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/wiki/:id
exports.deletePage = async (req, res) => {
  try {
    const page = await WikiPage.findByPk(req.params.id);
    if (!page) return res.status(404).json({ error: 'Wiki page not found' });
    await page.destroy();
    res.json({ message: 'Page deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/wiki/:id/versions
exports.getVersions = async (req, res) => {
  try {
    const versions = await WikiVersion.findAll({
      where: { wiki_page_id: req.params.id },
      include: [{ model: User, as: 'editor', attributes: ['id', 'name', 'avatar'] }],
      order: [['edited_at', 'DESC']],
    });
    res.json({ versions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
