import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Spinner from './components/shared/Spinner';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspacePage from './pages/WorkspacePage';
import ProjectPage from './pages/ProjectPage';
import KanbanPage from './pages/KanbanPage';
import SnippetsPage from './pages/SnippetsPage';
import WikiPage from './pages/WikiPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import JoinWorkspacePage from './pages/JoinWorkspacePage';
import { AIReviewPage, AIStandupPage, AIBreakdownPage, AISummaryPage } from './pages/AIPages';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/join/:token" element={<JoinWorkspacePage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/workspace/:slug" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />

      {/* Project nested routes */}
      <Route
        path="/workspace/:slug/project/:projectId"
        element={<ProtectedRoute><ProjectPage /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="board" replace />} />
        <Route path="board" element={<KanbanPage />} />
        <Route path="snippets" element={<SnippetsPage />} />
        <Route path="wiki" element={<WikiPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="ai/review" element={<AIReviewPage />} />
        <Route path="ai/standup" element={<AIStandupPage />} />
        <Route path="ai/breakdown" element={<AIBreakdownPage />} />
        <Route path="ai/summary" element={<AISummaryPage />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
