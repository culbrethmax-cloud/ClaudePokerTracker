import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { calculateDollarProfit } from '../utils/calculations';

export function useSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const sessionsRef = collection(db, 'users', user.uid, 'sessions');
    const q = query(sessionsRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSessions(sessionsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching sessions:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const addSession = async (sessionData) => {
    if (!user) throw new Error('Must be logged in to add session');

    const sessionsRef = collection(db, 'users', user.uid, 'sessions');

    // Calculate dollar profit for cash games
    if (sessionData.type === 'cash') {
      sessionData.profitDollars = calculateDollarProfit(
        sessionData.profitBB,
        sessionData.stakes
      );
    }

    // Add timestamp
    sessionData.createdAt = new Date().toISOString();

    const docRef = await addDoc(sessionsRef, sessionData);
    return docRef.id;
  };

  const updateSession = async (sessionId, sessionData) => {
    if (!user) throw new Error('Must be logged in to update session');

    const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);

    // Recalculate dollar profit for cash games
    if (sessionData.type === 'cash') {
      sessionData.profitDollars = calculateDollarProfit(
        sessionData.profitBB,
        sessionData.stakes
      );
    }

    sessionData.updatedAt = new Date().toISOString();

    await updateDoc(sessionRef, sessionData);
  };

  const deleteSession = async (sessionId) => {
    if (!user) throw new Error('Must be logged in to delete session');

    const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);
    await deleteDoc(sessionRef);
  };

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession
  };
}
