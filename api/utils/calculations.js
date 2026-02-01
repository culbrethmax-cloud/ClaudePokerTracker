/**
 * Poker statistics calculations.
 * Ported from src/utils/calculations.js with additions for
 * duration buckets, day-of-week analysis, game type breakdown,
 * and rolling trend averages.
 */

// --- Core math (ported from frontend) ---

function getbbValueFromStakes(stakes) {
  if (!stakes) return 1;
  const match = stakes.match(/NL(\d+)/i);
  if (match) return parseInt(match[1]) / 100;
  const ploMatch = stakes.match(/PLO(\d+)/i);
  if (ploMatch) return parseInt(ploMatch[1]) / 100;
  return 1;
}

function calculateBBPer100(totalBB, totalHands) {
  if (totalHands === 0) return 0;
  return (totalBB / totalHands) * 100;
}

function calculateHourlyRate(totalProfit, totalMinutes) {
  if (totalMinutes === 0) return 0;
  return (totalProfit / totalMinutes) * 60;
}

function calculateROI(totalBuyIns, totalCashOuts) {
  if (totalBuyIns === 0) return 0;
  return ((totalCashOuts - totalBuyIns) / totalBuyIns) * 100;
}

// --- Helpers ---

function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function getSessionProfitDollars(session) {
  if (session.type === 'cash') return session.profitDollars || 0;
  return (session.cashOut || 0) - (session.buyIn || 0);
}

function getSessionProfitBB(session) {
  if (session.type === 'cash') return session.profitBB || 0;
  return 0;
}

function calculateWinRate(sessions) {
  if (sessions.length === 0) return 0;
  const winning = sessions.filter(s => {
    if (s.type === 'cash') return (s.profitBB || 0) > 0;
    return ((s.cashOut || 0) - (s.buyIn || 0)) > 0;
  }).length;
  return (winning / sessions.length) * 100;
}

// --- Aggregate stats ---

function calculateSummaryStats(sessions) {
  const cashSessions = sessions.filter(s => s.type === 'cash');
  const tournamentSessions = sessions.filter(s => s.type === 'tournament');

  // Cash stats
  const totalProfitBB = cashSessions.reduce((sum, s) => sum + (s.profitBB || 0), 0);
  const totalProfitDollars = cashSessions.reduce((sum, s) => sum + (s.profitDollars || 0), 0);
  const totalHands = cashSessions.reduce((sum, s) => sum + (s.hands || 0), 0);
  const totalMinutesCash = cashSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Tournament stats
  const totalBuyIns = tournamentSessions.reduce((sum, s) => sum + (s.buyIn || 0), 0);
  const totalCashOuts = tournamentSessions.reduce((sum, s) => sum + (s.cashOut || 0), 0);
  const tournamentProfit = totalCashOuts - totalBuyIns;
  const totalMinutesTournament = tournamentSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Combined
  const totalMinutes = totalMinutesCash + totalMinutesTournament;
  const totalProfitDollarsCombined = totalProfitDollars + tournamentProfit;

  return {
    totalSessions: sessions.length,
    cashSessions: cashSessions.length,
    tournamentSessions: tournamentSessions.length,
    cash: {
      totalProfitBB: round(totalProfitBB, 1),
      totalProfitDollars: round(totalProfitDollars, 2),
      totalHands,
      totalMinutes: totalMinutesCash,
      totalHours: round(totalMinutesCash / 60, 1),
      bbPer100: round(calculateBBPer100(totalProfitBB, totalHands), 2),
      hourlyRateDollars: round(calculateHourlyRate(totalProfitDollars, totalMinutesCash), 2),
      hourlyRateBB: round(calculateHourlyRate(totalProfitBB, totalMinutesCash), 1),
      winRate: round(calculateWinRate(cashSessions), 1)
    },
    tournament: {
      totalProfit: round(tournamentProfit, 2),
      totalBuyIns: round(totalBuyIns, 2),
      totalCashOuts: round(totalCashOuts, 2),
      totalMinutes: totalMinutesTournament,
      totalHours: round(totalMinutesTournament / 60, 1),
      tournamentsPlayed: tournamentSessions.length,
      roi: round(calculateROI(totalBuyIns, totalCashOuts), 1),
      itmPercent: round(
        tournamentSessions.length > 0
          ? (tournamentSessions.filter(s => (s.cashOut || 0) > 0).length / tournamentSessions.length) * 100
          : 0,
        1
      ),
      avgBuyIn: round(
        tournamentSessions.length > 0 ? totalBuyIns / tournamentSessions.length : 0,
        2
      ),
      winRate: round(calculateWinRate(tournamentSessions), 1)
    },
    combined: {
      totalProfitDollars: round(totalProfitDollarsCombined, 2),
      totalMinutes,
      totalHours: round(totalMinutes / 60, 1),
      hourlyRateDollars: round(calculateHourlyRate(totalProfitDollarsCombined, totalMinutes), 2),
      winRate: round(calculateWinRate(sessions), 1)
    }
  };
}

// --- Duration bucket analysis ---

function calculateDurationBuckets(sessions, boundaries) {
  if (!boundaries || boundaries.length === 0) {
    boundaries = [0, 30, 60, 120, 180, 240];
  }
  boundaries = [...boundaries].sort((a, b) => a - b);

  const buckets = boundaries.map((min, i) => {
    const max = i < boundaries.length - 1 ? boundaries[i + 1] : null;
    return {
      range: max ? `${min}-${max}min` : `${min}min+`,
      minMinutes: min,
      maxMinutes: max,
      sessions: []
    };
  });

  sessions.forEach(session => {
    const duration = session.duration || 0;
    // Find the last bucket whose minMinutes <= duration
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (duration >= buckets[i].minMinutes) {
        buckets[i].sessions.push(session);
        break;
      }
    }
  });

  return buckets.map(bucket => {
    const cashSessions = bucket.sessions.filter(s => s.type === 'cash');
    const totalProfitBB = cashSessions.reduce((sum, s) => sum + (s.profitBB || 0), 0);
    const totalProfitDollars = bucket.sessions.reduce((sum, s) => sum + getSessionProfitDollars(s), 0);
    const totalHands = cashSessions.reduce((sum, s) => sum + (s.hands || 0), 0);
    const totalMinutes = bucket.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    return {
      range: bucket.range,
      minMinutes: bucket.minMinutes,
      maxMinutes: bucket.maxMinutes,
      sessions: bucket.sessions.length,
      cashSessions: cashSessions.length,
      totalProfitBB: round(totalProfitBB, 1),
      totalProfitDollars: round(totalProfitDollars, 2),
      avgProfitBB: round(cashSessions.length > 0 ? totalProfitBB / cashSessions.length : 0, 1),
      avgProfitDollars: round(bucket.sessions.length > 0 ? totalProfitDollars / bucket.sessions.length : 0, 2),
      totalHands,
      bbPer100: round(calculateBBPer100(totalProfitBB, totalHands), 2),
      totalHours: round(totalMinutes / 60, 1),
      avgDurationMinutes: round(bucket.sessions.length > 0 ? totalMinutes / bucket.sessions.length : 0, 0),
      winRate: round(calculateWinRate(bucket.sessions), 1)
    };
  });
}

// --- Day of week analysis ---

function calculateByDayOfWeek(sessions) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dayBuckets = dayNames.map((name, index) => ({
    day: name,
    dayIndex: index,
    sessions: []
  }));

  sessions.forEach(session => {
    // Use noon UTC to avoid timezone-related day shifts
    const dayIndex = new Date(session.date + 'T12:00:00Z').getUTCDay();
    dayBuckets[dayIndex].sessions.push(session);
  });

  return dayBuckets.map(bucket => {
    const cashSessions = bucket.sessions.filter(s => s.type === 'cash');
    const totalProfitBB = cashSessions.reduce((sum, s) => sum + (s.profitBB || 0), 0);
    const totalProfitDollars = bucket.sessions.reduce((sum, s) => sum + getSessionProfitDollars(s), 0);
    const totalHands = cashSessions.reduce((sum, s) => sum + (s.hands || 0), 0);
    const totalMinutes = bucket.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Time-of-day analysis (only for sessions with startTime)
    const sessionsWithTime = bucket.sessions.filter(s => s.startTime);
    let timeOfDay = null;
    if (sessionsWithTime.length > 0) {
      const hours = sessionsWithTime.map(s => {
        const [h] = s.startTime.split(':').map(Number);
        return h;
      });
      timeOfDay = {
        sampleSize: sessionsWithTime.length,
        avgStartHour: round(hours.reduce((a, b) => a + b, 0) / hours.length, 1)
      };
    }

    return {
      day: bucket.day,
      dayIndex: bucket.dayIndex,
      sessions: bucket.sessions.length,
      cashSessions: cashSessions.length,
      totalProfitBB: round(totalProfitBB, 1),
      totalProfitDollars: round(totalProfitDollars, 2),
      avgProfitBB: round(cashSessions.length > 0 ? totalProfitBB / cashSessions.length : 0, 1),
      avgProfitDollars: round(bucket.sessions.length > 0 ? totalProfitDollars / bucket.sessions.length : 0, 2),
      totalHands,
      bbPer100: round(calculateBBPer100(totalProfitBB, totalHands), 2),
      totalHours: round(totalMinutes / 60, 1),
      avgDurationMinutes: round(bucket.sessions.length > 0 ? totalMinutes / bucket.sessions.length : 0, 0),
      winRate: round(calculateWinRate(bucket.sessions), 1),
      timeOfDay
    };
  });
}

// --- Game type / stakes breakdown ---

function calculateByGameType(sessions) {
  const groups = {};

  sessions.forEach(session => {
    let key;
    if (session.type === 'cash') {
      key = `cash|${session.gameType || 'Unknown'}|${session.stakes || 'Unknown'}`;
    } else {
      key = `tournament|${session.gameType || 'MTT'}`;
    }

    if (!groups[key]) {
      groups[key] = {
        type: session.type,
        gameType: session.type === 'cash' ? (session.gameType || 'Unknown') : (session.gameType || 'MTT'),
        stakes: session.type === 'cash' ? (session.stakes || 'Unknown') : null,
        sessions: []
      };
    }
    groups[key].sessions.push(session);
  });

  return Object.values(groups).map(group => {
    const s = group.sessions;
    const totalMinutes = s.reduce((sum, sess) => sum + (sess.duration || 0), 0);

    if (group.type === 'cash') {
      const totalProfitBB = s.reduce((sum, sess) => sum + (sess.profitBB || 0), 0);
      const totalProfitDollars = s.reduce((sum, sess) => sum + (sess.profitDollars || 0), 0);
      const totalHands = s.reduce((sum, sess) => sum + (sess.hands || 0), 0);

      return {
        type: 'cash',
        gameType: group.gameType,
        stakes: group.stakes,
        sessions: s.length,
        totalProfitBB: round(totalProfitBB, 1),
        totalProfitDollars: round(totalProfitDollars, 2),
        avgProfitBB: round(totalProfitBB / s.length, 1),
        avgProfitDollars: round(totalProfitDollars / s.length, 2),
        totalHands,
        bbPer100: round(calculateBBPer100(totalProfitBB, totalHands), 2),
        totalHours: round(totalMinutes / 60, 1),
        avgDurationMinutes: round(totalMinutes / s.length, 0),
        hourlyRateDollars: round(calculateHourlyRate(totalProfitDollars, totalMinutes), 2),
        hourlyRateBB: round(calculateHourlyRate(totalProfitBB, totalMinutes), 1),
        winRate: round(calculateWinRate(s), 1)
      };
    } else {
      const totalBuyIns = s.reduce((sum, sess) => sum + (sess.buyIn || 0), 0);
      const totalCashOuts = s.reduce((sum, sess) => sum + (sess.cashOut || 0), 0);

      return {
        type: 'tournament',
        gameType: group.gameType,
        stakes: null,
        sessions: s.length,
        totalProfit: round(totalCashOuts - totalBuyIns, 2),
        totalBuyIns: round(totalBuyIns, 2),
        totalCashOuts: round(totalCashOuts, 2),
        avgBuyIn: round(totalBuyIns / s.length, 2),
        roi: round(calculateROI(totalBuyIns, totalCashOuts), 1),
        itmPercent: round((s.filter(sess => (sess.cashOut || 0) > 0).length / s.length) * 100, 1),
        totalHours: round(totalMinutes / 60, 1),
        avgDurationMinutes: round(s.length > 0 ? totalMinutes / s.length : 0, 0),
        winRate: round(calculateWinRate(s), 1)
      };
    }
  }).sort((a, b) => b.sessions - a.sessions);
}

// --- Rolling trends ---

function calculateTrends(sessions, windowSize) {
  if (!windowSize || windowSize < 1) windowSize = 20;

  // Sort chronologically
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

  let cumulativeDollars = 0;
  let cumulativeBB = 0;
  const dataPoints = [];

  for (let i = 0; i < sorted.length; i++) {
    const session = sorted[i];
    const sessionProfitDollars = getSessionProfitDollars(session);
    const sessionProfitBB = getSessionProfitBB(session);

    cumulativeDollars += sessionProfitDollars;
    cumulativeBB += sessionProfitBB;

    // Rolling window
    const windowStart = Math.max(0, i - windowSize + 1);
    const window = sorted.slice(windowStart, i + 1);
    const cashInWindow = window.filter(s => s.type === 'cash');
    const totalBBInWindow = cashInWindow.reduce((sum, s) => sum + (s.profitBB || 0), 0);
    const totalHandsInWindow = cashInWindow.reduce((sum, s) => sum + (s.hands || 0), 0);
    const totalProfitDollarsInWindow = window.reduce((sum, s) => sum + getSessionProfitDollars(s), 0);

    dataPoints.push({
      sessionIndex: i + 1,
      date: session.date,
      type: session.type,
      sessionProfitDollars: round(sessionProfitDollars, 2),
      sessionProfitBB: round(sessionProfitBB, 1),
      windowSize: window.length,
      rollingBBPer100: round(calculateBBPer100(totalBBInWindow, totalHandsInWindow), 2),
      rollingAvgProfitDollars: round(totalProfitDollarsInWindow / window.length, 2),
      rollingAvgProfitBB: round(cashInWindow.length > 0 ? totalBBInWindow / cashInWindow.length : 0, 1),
      rollingWinRate: round(calculateWinRate(window), 1),
      cumulativeProfitDollars: round(cumulativeDollars, 2),
      cumulativeProfitBB: round(cumulativeBB, 1)
    });
  }

  return dataPoints;
}

// --- Strip internal fields from sessions for API responses ---

function sanitizeSession(session) {
  const { notes, createdAt, updatedAt, ...safe } = session;
  return safe;
}

function sanitizeSessionWithNotes(session) {
  const { createdAt, updatedAt, ...safe } = session;
  return safe;
}

module.exports = {
  calculateSummaryStats,
  calculateDurationBuckets,
  calculateByDayOfWeek,
  calculateByGameType,
  calculateTrends,
  sanitizeSession,
  sanitizeSessionWithNotes,
  round
};
