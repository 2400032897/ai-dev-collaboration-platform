import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Avatar from './Avatar';

const NAV_ITEMS = [
  {
    id: 'kanban', label: 'Kanban Board', path: 'board',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    id: 'snippets', label: 'Snippets', path: 'snippets',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    id: 'wiki', label: 'Wiki', path: 'wiki',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'activity', label: 'Activity', path: 'activity',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const AI_TOOLS = [
  { id: 'code-review', label: 'Code Review', path: 'ai/review' },
  { id: 'standup', label: 'Standup Gen', path: 'ai/standup' },
  { id: 'breakdown', label: 'Task Breakdown', path: 'ai/breakdown' },
  { id: 'summary', label: 'Project Summary', path: 'ai/summary' },
];

export default function Sidebar({ projectId, workspaceSlug, members = [] }) {
  const [aiExpanded, setAiExpanded] = useState(true);
  const base = `/workspace/${workspaceSlug}/project/${projectId}`;

  return (
    <aside className="w-56 flex-shrink-0 glass border-r border-white/10 flex flex-col
      overflow-y-auto h-full">
      <div className="p-3 flex flex-col gap-1 flex-1">
        {/* Navigation */}
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2">
          Project
        </p>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.id}
            to={`${base}/${item.path}`}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {/* AI Tools */}
        <div className="mt-4">
          <button
            onClick={() => setAiExpanded(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold
              text-gray-600 uppercase tracking-wider hover:text-gray-400 transition-colors"
          >
            <span>🤖 AI Tools</span>
            <svg
              className={`w-3 h-3 transition-transform ${aiExpanded ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {aiExpanded && (
            <div className="flex flex-col gap-0.5 mt-1">
              {AI_TOOLS.map(tool => (
                <NavLink
                  key={tool.id}
                  to={`${base}/${tool.path}`}
                  className={({ isActive }) =>
                    `sidebar-link pl-6 text-xs ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="text-primary-400">✦</span>
                  {tool.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        {members.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2">
              Members ({members.length})
            </p>
            <div className="px-3 space-y-2">
              {members.slice(0, 5).map(member => (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar name={member.name} src={member.avatar} size="xs" />
                  <span className="text-xs text-gray-400 truncate">{member.name}</span>
                </div>
              ))}
              {members.length > 5 && (
                <p className="text-xs text-gray-600">+{members.length - 5} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
