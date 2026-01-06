import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionForm from '../components/SessionForm';
import { useSessions } from '../hooks/useSessions';

export default function AddSession() {
  const navigate = useNavigate();
  const { addSession } = useSessions();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (sessionData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await addSession(sessionData);
      navigate('/');
    } catch (err) {
      console.error('Error adding session:', err);
      setError('Failed to add session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Add Session</h2>

      {error && (
        <div className="bg-red-900/50 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="card">
        <SessionForm onSubmit={handleSubmit} />
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 text-gray-100 p-4 rounded-lg">
            Saving...
          </div>
        </div>
      )}
    </div>
  );
}
