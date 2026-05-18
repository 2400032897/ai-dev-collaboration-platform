require('dotenv').config();
const { sequelize, User, Workspace, WorkspaceMember, Project, ProjectMember, Task, Snippet, WikiPage } = require('./models');
const crypto = require('crypto');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

const generateSlug = (name) => `${slugify(name, { lower: true, strict: true })}-${uuidv4().slice(0, 6)}`;
const generateToken = () => crypto.randomBytes(32).toString('hex');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB Connected');

    await sequelize.sync({ force: true });
    console.log('✅ Schema reset');

    // ── Users (passwords hashed by beforeCreate hook) ──────────────────
    const [ankush, riya, dev] = await User.bulkCreate([
      {
        name: 'Ankush Kumar',
        email: 'ankush@dev.com',
        password: 'password123',
        bio: 'Full-stack developer passionate about real-time apps',
        skills: ['React', 'Node.js', 'MySQL', 'Socket.IO'],
        github_url: 'https://github.com/ankush',
      },
      {
        name: 'Riya Sharma',
        email: 'riya@dev.com',
        password: 'password123',
        bio: 'Frontend engineer | Design systems enthusiast',
        skills: ['React', 'TypeScript', 'Figma', 'CSS'],
        github_url: 'https://github.com/riya',
      },
      {
        name: 'Dev Patel',
        email: 'dev@dev.com',
        password: 'password123',
        bio: 'Backend engineer | API architect',
        skills: ['Node.js', 'Python', 'PostgreSQL', 'Docker'],
        github_url: 'https://github.com/devpatel',
      },
    ], { individualHooks: true });
    console.log('✅ Users created');

    // ── Workspace ─────────────────────────────────────────────────────
    const workspace = await Workspace.create({
      name: 'DevCollab Demo',
      slug: generateSlug('DevCollab Demo'),
      description: 'Hackathon demo workspace showcasing all DevCollab features',
      owner_id: ankush.id,
      invite_token: generateToken(),
      plan: 'free',
    });

    await WorkspaceMember.bulkCreate([
      { workspace_id: workspace.id, user_id: ankush.id, role: 'Owner' },
      { workspace_id: workspace.id, user_id: riya.id, role: 'Admin' },
      { workspace_id: workspace.id, user_id: dev.id, role: 'Member' },
    ]);
    console.log('✅ Workspace created with members');

    // ── Projects ──────────────────────────────────────────────────────
    const frontendProject = await Project.create({
      name: 'Frontend Redesign',
      description: 'Complete UI overhaul with new design system',
      workspace_id: workspace.id,
      color: '#7C3AED',
      created_by: ankush.id,
    });

    const apiProject = await Project.create({
      name: 'API Integration',
      description: 'Backend REST API and third-party service integrations',
      workspace_id: workspace.id,
      color: '#0EA5E9',
      created_by: dev.id,
    });

    await ProjectMember.bulkCreate([
      { project_id: frontendProject.id, user_id: ankush.id },
      { project_id: frontendProject.id, user_id: riya.id },
      { project_id: apiProject.id, user_id: ankush.id },
      { project_id: apiProject.id, user_id: dev.id },
    ]);
    console.log('✅ Projects created');

    // ── Tasks ─────────────────────────────────────────────────────────
    await Task.bulkCreate([
      // Frontend Redesign tasks
      {
        title: 'Design new dashboard layout',
        description: 'Create wireframes and mockups for the revamped dashboard with dark mode support',
        project_id: frontendProject.id, workspace_id: workspace.id,
        status: 'done', priority: 'P0',
        assignee_id: riya.id, created_by: ankush.id,
        labels: ['design', 'ui'], order_index: 0,
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Implement component library',
        description: 'Build reusable Avatar, Badge, Modal, Spinner, Toast components',
        project_id: frontendProject.id, workspace_id: workspace.id,
        status: 'inprogress', priority: 'P0',
        assignee_id: riya.id, created_by: ankush.id,
        labels: ['frontend', 'components'], order_index: 0,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Set up Tailwind design tokens',
        description: 'Configure custom colors, typography scale, and spacing in tailwind.config.js',
        project_id: frontendProject.id, workspace_id: workspace.id,
        status: 'done', priority: 'P1',
        assignee_id: ankush.id, created_by: ankush.id,
        labels: ['config'], order_index: 1,
      },
      {
        title: 'Build Kanban drag-and-drop',
        description: 'Integrate dnd-kit for smooth drag and drop with column reordering',
        project_id: frontendProject.id, workspace_id: workspace.id,
        status: 'inreview', priority: 'P1',
        assignee_id: ankush.id, created_by: ankush.id,
        labels: ['frontend', 'dnd'], order_index: 0,
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Responsive mobile layout',
        description: 'Ensure all pages work on mobile devices down to 320px width',
        project_id: frontendProject.id, workspace_id: workspace.id,
        status: 'todo', priority: 'P2',
        assignee_id: riya.id, created_by: ankush.id,
        labels: ['responsive'], order_index: 0,
      },
      // API Integration tasks
      {
        title: 'Design REST API schema',
        description: 'Document all endpoints, request/response shapes, and error codes',
        project_id: apiProject.id, workspace_id: workspace.id,
        status: 'done', priority: 'P0',
        assignee_id: dev.id, created_by: dev.id,
        labels: ['api', 'docs'], order_index: 0,
      },
      {
        title: 'Implement JWT authentication',
        description: 'Register/login/me endpoints with bcrypt and JWT tokens',
        project_id: apiProject.id, workspace_id: workspace.id,
        status: 'done', priority: 'P0',
        assignee_id: dev.id, created_by: dev.id,
        labels: ['auth', 'security'], order_index: 1,
      },
      {
        title: 'Socket.IO real-time sync',
        description: 'Kanban board real-time updates, presence tracking, notifications',
        project_id: apiProject.id, workspace_id: workspace.id,
        status: 'inprogress', priority: 'P0',
        assignee_id: dev.id, created_by: dev.id,
        labels: ['realtime', 'socket'], order_index: 0,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Claude AI integration',
        description: 'Code reviewer, standup generator, task breakdown, project summary',
        project_id: apiProject.id, workspace_id: workspace.id,
        status: 'inreview', priority: 'P1',
        assignee_id: ankush.id, created_by: dev.id,
        labels: ['ai', 'claude'], order_index: 0,
      },
      {
        title: 'Rate limiting and security headers',
        description: 'Add helmet, rate limiter, and input sanitization middleware',
        project_id: apiProject.id, workspace_id: workspace.id,
        status: 'todo', priority: 'P2',
        assignee_id: dev.id, created_by: dev.id,
        labels: ['security'], order_index: 0,
      },
    ]);
    console.log('✅ 10 Tasks created');

    // ── Snippets ──────────────────────────────────────────────────────
    await Snippet.bulkCreate([
      {
        title: 'useLocalStorage React Hook',
        language: 'javascript',
        code: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;`,
        description: 'Persistent state hook that syncs with localStorage, handles JSON serialization and errors gracefully.',
        tags: ['react', 'hooks', 'localStorage', 'state'],
        project_id: frontendProject.id,
        created_by: riya.id,
      },
      {
        title: 'Fibonacci Generator (Python)',
        language: 'python',
        code: `def fibonacci_generator(n):
    """Yield Fibonacci numbers up to n using a generator."""
    a, b = 0, 1
    while a <= n:
        yield a
        a, b = b, a + b

def fibonacci_sequence(count):
    """Return first 'count' Fibonacci numbers as a list."""
    sequence = []
    a, b = 0, 1
    for _ in range(count):
        sequence.append(a)
        a, b = b, a + b
    return sequence

# Usage
for num in fibonacci_generator(100):
    print(num)  # 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89

print(fibonacci_sequence(10))  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]`,
        description: 'Memory-efficient Fibonacci generator using Python generator functions with yield.',
        tags: ['python', 'algorithms', 'generators'],
        project_id: apiProject.id,
        created_by: dev.id,
      },
      {
        title: 'Get Top N Records by Column (SQL)',
        language: 'sql',
        code: `-- Get top N records per group using ROW_NUMBER window function
WITH RankedTasks AS (
  SELECT
    t.*,
    u.name AS assignee_name,
    p.name AS project_name,
    ROW_NUMBER() OVER (
      PARTITION BY t.project_id
      ORDER BY t.created_at DESC
    ) AS rn
  FROM tasks t
  LEFT JOIN users u ON t.assignee_id = u.id
  LEFT JOIN projects p ON t.project_id = p.id
  WHERE t.status != 'done'
)
SELECT *
FROM RankedTasks
WHERE rn <= 5
ORDER BY project_name, rn;

-- Alternative: Top tasks by priority per project
SELECT project_id, title, priority, status
FROM tasks
WHERE (project_id, priority) IN (
  SELECT project_id, MIN(priority)
  FROM tasks
  GROUP BY project_id
)
LIMIT 20;`,
        description: 'SQL patterns for retrieving top N records per group using window functions and subqueries.',
        tags: ['sql', 'mysql', 'window-functions', 'query'],
        project_id: apiProject.id,
        created_by: dev.id,
      },
      {
        title: 'Batch Rename Files (Bash)',
        language: 'bash',
        code: '#!/bin/bash\n# Batch rename files: add prefix, change extension, or replace text\n\nDIRECTORY="${1:-.}"\nPREFIX="${2:-file_}"\nOLD_EXT="${3:-.txt}"\nNEW_EXT="${4:-.md}"\n\necho "Processing files in: $DIRECTORY"\necho "Renaming *$OLD_EXT to $PREFIX*$NEW_EXT"\n\ncount=0\nfor filepath in "$DIRECTORY"/*"$OLD_EXT"; do\n  if [ -f "$filepath" ]; then\n    filename=$(basename "$filepath" "$OLD_EXT")\n    newpath="$DIRECTORY/${PREFIX}${filename}${NEW_EXT}"\n    \n    if mv "$filepath" "$newpath" 2>/dev/null; then\n      echo "  ✓ $filepath → $newpath"\n      ((count++))\n    else\n      echo "  ✗ Failed to rename: $filepath"\n    fi\n  fi\ndone\n\necho "Done! Renamed $count files."\n\n# Usage:\n# chmod +x rename.sh\n# ./rename.sh ./docs "" .txt .md\n# ./rename.sh ./images img_ .JPG .jpg',
        description: 'Flexible bash script for batch renaming files with prefix, suffix, and extension changes.',
        tags: ['bash', 'shell', 'files', 'automation'],
        project_id: apiProject.id,
        created_by: dev.id,
      },
      {
        title: 'API Response TypeScript Interface',
        language: 'typescript',
        code: `// Generic API response wrapper
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Domain interfaces
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  skills: string[];
  github_url: string | null;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'inprogress' | 'inreview' | 'done';
  priority: 'P0' | 'P1' | 'P2';
  assignee: Pick<User, 'id' | 'name' | 'avatar'> | null;
  labels: string[];
  due_date: string | null;
  order_index: number;
  comment_count?: number;
  created_at: string;
  updated_at: string;
}

// Usage
type TaskListResponse = ApiResponse<{ tasks: Record<Task['status'], Task[]> }>;
type CreateTaskResponse = ApiResponse<{ task: Task }>;

// Fetch helper with typing
async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}`,
        description: 'TypeScript interfaces for DevCollab API responses with generics and proper union types.',
        tags: ['typescript', 'api', 'interfaces', 'types'],
        project_id: frontendProject.id,
        created_by: riya.id,
      },
    ]);
    console.log('✅ 5 Snippets created');

    // ── Wiki Pages ─────────────────────────────────────────────────────
    await WikiPage.bulkCreate([
      {
        title: 'Getting Started with DevCollab',
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Getting Started with DevCollab' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Welcome to DevCollab — your all-in-one real-time collaboration platform for development teams.' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quick Start' }] },
            { type: 'bulletList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create a workspace for your organization' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Invite your team using the invite link' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create a project and start adding tasks to the Kanban board' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Use AI features to boost productivity' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Features' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '🚀 Real-time Kanban board with drag-and-drop | ✂️ Code Snippet Manager | 📖 Wiki Documentation | 🤖 AI-powered tools' }] },
          ],
        }),
        project_id: frontendProject.id,
        created_by: ankush.id,
        last_edited_by: ankush.id,
      },
      {
        title: 'API Architecture Overview',
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'API Architecture Overview' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'This document describes the REST API architecture for DevCollab backend.' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tech Stack' }] },
            { type: 'bulletList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Node.js + Express.js — REST API server' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'MySQL + Sequelize ORM — database layer' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Socket.IO — real-time event system' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'JWT + bcrypt — authentication' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Claude API — AI features' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Base URL' }] },
            { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'http://localhost:5000/api' }] },
          ],
        }),
        project_id: apiProject.id,
        created_by: dev.id,
        last_edited_by: dev.id,
      },
    ]);
    console.log('✅ 2 Wiki pages created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Test credentials:');
    console.log('  ankush@dev.com / password123 (Owner)');
    console.log('  riya@dev.com / password123 (Admin)');
    console.log('  dev@dev.com / password123 (Member)');
    console.log('\n🔗 Workspace invite token:', workspace.invite_token);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
