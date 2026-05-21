import { useParams } from 'react-router-dom';
import AICodeReviewer from '../components/ai/AICodeReviewer';
import AITaskBreakdown from '../components/ai/AITaskBreakdown';
import AIProjectSummary from '../components/ai/AIProjectSummary';

// Wrapper pages for each AI tool
export function AIReviewPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
      <AICodeReviewer />
    </div>
  );
}

export function AIStandupPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-gray-400 text-center">
        <p className="text-4xl mb-3"></p>
        <p className="text-lg font-semibold text-white mb-2">Standup Generator</p>
        <p className="text-sm">Use the "Standup" button on the Kanban board to generate a standup report.</p>
      </div>
    </div>
  );
}

export function AIBreakdownPage() {
  const { projectId } = useParams();
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
      <AITaskBreakdown projectId={projectId} />
    </div>
  );
}

export function AISummaryPage() {
  const { projectId } = useParams();
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
      <AIProjectSummary projectId={projectId} />
    </div>
  );
}
