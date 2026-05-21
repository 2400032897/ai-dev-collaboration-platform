const { Op } = require('sequelize');
const claude = require('../config/claude');
const { Task, User, Project } = require('../models');
const {
  reviewCodeFallback,
  generateStandupFallback,
  breakdownFeatureFallback,
  projectSummaryFallback
} = require('../utils/aiFallback');

// POST /api/ai/review-code
exports.reviewCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    let result;
    const isDummy = !process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY.includes('YOUR_KEY_HERE');

    if (isDummy) {
      console.log('Dummy Claude API key detected, using local code review fallback...');
      result = reviewCodeFallback(code, language);
    } else {
      try {
        const message = await claude.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 1500,
          system: `You are a senior software engineer conducting a code review. Analyze the provided code snippet and respond with a JSON object only — no markdown fences, no explanation outside the JSON. Use exactly this format:
{
  "score": <number 1-10>,
  "summary": "<one sentence overall assessment>",
  "bugs": ["<issue 1>", "<issue 2>"],
  "performance": ["<suggestion>"],
  "readability": ["<suggestion>"],
  "security": ["<concern>"],
  "improved_snippet": "<rewrite if the function is short>"
}
Keep each item under 15 words. Empty array if no issues in a category.`,
          messages: [{ role: 'user', content: `Language: ${language || 'javascript'}\n\nCode:\n${code}` }],
        });

        try {
          result = JSON.parse(message.content[0].text);
        } catch {
          result = { raw: message.content[0].text };
        }
      } catch (sdkErr) {
        console.warn('Anthropic SDK call failed, using local code review fallback:', sdkErr.message);
        result = reviewCodeFallback(code, language);
      }
    }

    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/standup
exports.generateStandup = async (req, res) => {
  try {
    const { projectId } = req.body;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tasks = await Task.findAll({
      where: { project_id: projectId, updated_at: { [Op.gte]: since } },
      include: [{ model: User, as: 'assignee', attributes: ['name'] }],
    });

    if (!tasks.length) {
      return res.json({ standup: 'No task updates in the last 24 hours.' });
    }

    const taskList = tasks.map(t =>
      `[${t.status.toUpperCase()}] ${t.title}${t.assignee ? ` (assigned to: ${t.assignee.name})` : ''}`
    ).join('\n');

    let standup;
    const isDummy = !process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY.includes('YOUR_KEY_HERE');

    if (isDummy) {
      console.log('Dummy Claude API key detected, using local standup generator fallback...');
      standup = generateStandupFallback(taskList);
    } else {
      try {
        const message = await claude.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 800,
          system: `You are a scrum master assistant. Given these task changes from the last 24 hours, write a concise daily standup report in this format:

DONE
- <task>

IN PROGRESS
- <task> (assigned to: <name>)

IN REVIEW / BLOCKERS
- <task>

TODO NEXT
- <task>

Be brief and professional. No preamble.`,
          messages: [{ role: 'user', content: taskList }],
        });

        standup = message.content[0].text;
      } catch (sdkErr) {
        console.warn('Anthropic SDK call failed, using local standup generator fallback:', sdkErr.message);
        standup = generateStandupFallback(taskList);
      }
    }

    res.json({ standup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/breakdown
exports.breakdownFeature = async (req, res) => {
  try {
    const { featureDescription, projectId } = req.body;
    if (!featureDescription || !projectId) {
      return res.status(400).json({ error: 'featureDescription and projectId required' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let parsed;
    const isDummy = !process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY.includes('YOUR_KEY_HERE');

    if (isDummy) {
      console.log('Dummy Claude API key detected, using local feature breakdown fallback...');
      parsed = breakdownFeatureFallback(featureDescription);
    } else {
      try {
        const message = await claude.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 2000,
          system: `You are a senior developer breaking down a feature into implementation tasks. Given the feature description, respond with a JSON array only — no markdown, no text outside the array:
[
  {
    "title": "<short task title>",
    "description": "<1-2 sentences of what to implement>",
    "priority": "P0" | "P1" | "P2",
    "estimatedHours": <number>
  }
]
Generate 4-8 tasks. Order by logical implementation sequence. P0 = critical/blocking, P1 = important, P2 = nice-to-have.`,
          messages: [{ role: 'user', content: featureDescription }],
        });

        try {
          let text = message.content[0].text.trim();
          if (text.startsWith('```')) {
            text = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
          }
          parsed = JSON.parse(text);
        } catch {
          return res.status(500).json({ error: 'Failed to parse AI response', raw: message.content[0].text });
        }
      } catch (sdkErr) {
        console.warn('Anthropic SDK call failed, using local feature breakdown fallback:', sdkErr.message);
        parsed = breakdownFeatureFallback(featureDescription);
      }
    }

    // Bulk-create tasks
    const tasksToCreate = parsed.map((t, i) => ({
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: 'todo',
      order_index: i,
      project_id: projectId,
      workspace_id: project.workspace_id,
      created_by: req.user.id,
    }));

    const created = await Task.bulkCreate(tasksToCreate);

    // Fetch with associations
    const { setIO } = require('./task.controller');
    const _io = req.app.get('io');
    if (_io) _io.to(`project:${projectId}`).emit('tasks:bulk_created', created);

    res.json({ tasks: created, breakdown: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/summary
exports.projectSummary = async (req, res) => {
  try {
    const { projectId } = req.body;
    const tasks = await Task.findAll({
      where: { project_id: projectId },
      include: [{ model: User, as: 'assignee', attributes: ['name'] }],
    });

    const counts = { todo: 0, inprogress: 0, inreview: 0, done: 0 };
    tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

    const stuckThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const stuck = tasks.filter(t => t.status === 'inprogress' && t.updated_at < stuckThreshold);

    const taskData = `
Total: ${tasks.length} tasks
Done: ${counts.done}, In Progress: ${counts.inprogress}, In Review: ${counts.inreview}, Todo: ${counts.todo}
Potentially stuck (>48h in progress): ${stuck.map(t => t.title).join(', ') || 'None'}
Recent tasks: ${tasks.slice(0, 10).map(t => `${t.title} [${t.status}]`).join(', ')}
`;

    let summary;
    const isDummy = !process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY.includes('YOUR_KEY_HERE');

    if (isDummy) {
      console.log('Dummy Claude API key detected, using local project health summary fallback...');
      summary = projectSummaryFallback(taskData);
    } else {
      try {
        const message = await claude.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 500,
          system: `You are a project manager assistant. Given the following project task data, write a concise project health summary covering:
1. Overall progress
2. What is going well
3. Potential blockers
4. Recommended next actions

Under 150 words. Plain text, no markdown.`,
          messages: [{ role: 'user', content: `Task data:\n${taskData}` }],
        });

        summary = message.content[0].text;
      } catch (sdkErr) {
        console.warn('Anthropic SDK call failed, using local project health summary fallback:', sdkErr.message);
        summary = projectSummaryFallback(taskData);
      }
    }

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
