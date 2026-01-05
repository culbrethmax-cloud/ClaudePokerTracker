import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessions } from '../hooks/useSessions';
import SessionForm from '../components/SessionForm';
import { format } from 'date-fns';
import { formatCurrency, formatBB, formatDuration } from '../utils/calculations';

export default function Sessions() {
  const { sessions, loading, deleteSession, updateSession } = useSessions();
  const [editingSession, setEditingSession] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'cash', 'tournament'
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    return s.type === filter;
  });

  const handleDelete = async (sessionId) => {
    try {
      await deleteSession(sessionId);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Failed to delete session');
    }
  };

  const handleUpdate = async (sessionData) => {
    try {
      await updateSession(editingSession.id, sessionData);
      setEditingSession(null);
    } catch (err) {
      console.error('Error updating session:', err);
      alert('Failed to update session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Edit Modal
  if (editingSession) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Session</h2>
          <button
            onClick={() => setEditingSession(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        <div className="card">
          <SessionForm
            onSubmit={handleUpdate}
            initialData={editingSession}
            isEditing={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Sessions</h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-500">{filteredSessions.length} sessions</span>
          <Link to="/import" className="text-primary-600 text-sm hover:underline">
            Import
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'cash', 'tournament'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {f === 'all' ? 'All' : f === 'cash' ? 'Cash Games' : 'Tournaments'}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">No sessions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(session => (
            <div key={session.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      session.type === 'cash'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {session.type === 'cash' ? 'Cash' : 'MTT'}
                    </span>
                    <span className="font-semibold">
                      {session.type === 'cash' ? session.stakes : `$${session.buyIn} Buy-in`}
                    </span>
                    <span className="text-gray-400 text-sm">{session.gameType}</span>
                  </div>

                  <p className="text-sm text-gray-500">
                    {format(new Date(session.date), 'EEEE, MMM d, yyyy')}
                    {session.location && ` • ${session.location}`}
                  </p>

                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    {session.duration > 0 && (
                      <span>{formatDuration(session.duration)}</span>
                    )}
                    {session.type === 'cash' && session.hands > 0 && (
                      <span>{session.hands.toLocaleString()} hands</span>
                    )}
                  </div>

                  {session.notes && (
                    <p className="text-sm text-gray-400 mt-2 italic">
                      "{session.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right ml-4">
                  {session.type === 'cash' ? (
                    <>
                      <p className={`text-xl font-bold ${
                        session.profitDollars >= 0 ? 'profit-text' : 'loss-text'
                      }`}>
                        {formatCurrency(session.profitDollars)}
                      </p>
                      <p className={`text-sm ${
                        session.profitBB >= 0 ? 'profit-text' : 'loss-text'
                      }`}>
                        {formatBB(session.profitBB)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`text-xl font-bold ${
                        (session.cashOut - session.buyIn) >= 0 ? 'profit-text' : 'loss-text'
                      }`}>
                        {formatCurrency(session.cashOut - session.buyIn)}
                      </p>
                      <p className="text-sm text-gray-400">
                        ${session.buyIn} → ${session.cashOut}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setEditingSession(session)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(session.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>

              {/* Delete Confirmation */}
              {confirmDelete === session.id && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 mb-2">
                    Are you sure you want to delete this session?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="btn-danger text-sm py-1"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="btn-secondary text-sm py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
