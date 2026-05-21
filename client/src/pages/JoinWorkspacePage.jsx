import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/shared/Spinner';
import api from '../api';

export default function JoinWorkspacePage() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('joining');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate(`/login?redirect=/join/${token}`);
      return;
    }
    api.get(`/workspaces/join/${token}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.message);
        setTimeout(() => navigate('/dashboard'), 1500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Invalid invite link');
      });
  }, [token, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass rounded-2xl p-10 text-center max-w-sm w-full">
        {status === 'joining' && (
          <>
            <Spinner size="xl" className="mx-auto mb-4" />
            <p className="text-white font-medium">Joining workspace...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <p className="text-4xl mb-4"></p>
            <p className="text-white font-semibold text-xl mb-2">Welcome!</p>
            <p className="text-gray-400">{message}. Redirecting to dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-4xl mb-4"></p>
            <p className="text-red-400 font-medium">{message}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
