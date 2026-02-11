// Parse stakes string (e.g., "NL50", "NL100") to get BB value in dollars
export function getbbValueFromStakes(stakes) {
  const match = stakes.match(/NL(\d+)/i);
  if (match) {
    // NL50 = $0.50 BB, NL100 = $1.00 BB, NL200 = $2.00 BB
    return parseInt(match[1]) / 100;
  }
  // Try to parse PLO stakes similarly
  const ploMatch = stakes.match(/PLO(\d+)/i);
  if (ploMatch) {
    return parseInt(ploMatch[1]) / 100;
  }
  return 1; // Default to $1 BB if can't parse
}

// Calculate dollar profit from BB profit and stakes
export function calculateDollarProfit(profitBB, stakes) {
  const bbValue = getbbValueFromStakes(stakes);
  return profitBB * bbValue;
}

// Format currency
export function formatCurrency(amount) {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absAmount);

  if (amount < 0) {
    return `-${formatted}`;
  }
  return amount >= 0 ? `+${formatted}` : formatted;
}

// Format BB amount
export function formatBB(amount) {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}${amount.toFixed(1)} BB`;
}

// Calculate BB/100 hands
export function calculateBBPer100(totalBB, totalHands) {
  if (totalHands === 0) return 0;
  return (totalBB / totalHands) * 100;
}

// Calculate hourly rate
export function calculateHourlyRate(totalProfit, totalMinutes) {
  if (totalMinutes === 0) return 0;
  return (totalProfit / totalMinutes) * 60;
}

// Calculate ROI for tournaments
export function calculateROI(totalBuyIns, totalCashOuts) {
  if (totalBuyIns === 0) return 0;
  return ((totalCashOuts - totalBuyIns) / totalBuyIns) * 100;
}

// Format percentage
export function formatPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// Format duration in hours and minutes
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Get common stakes options
export function getStakesOptions() {
  return [
    'NL2', 'NL5', 'NL10', 'NL20', 'NL25', 'NL50', 'NL100', 'NL200', 'NL500', 'NL1000',
    'PLO5', 'PLO10', 'PLO20', 'PLO25', 'PLO50', 'PLO100', 'PLO200', 'PLO500'
  ];
}

// Get game type options
export function getGameTypeOptions() {
  return [
    'NLHE',
    'PLO',
    'PLO5',
    'Mixed',
    'Other'
  ];
}

// Get location options (can be customized)
export function getDefaultLocations() {
  return [
    'ClubGG',
    'Stake.us',
    'PokerStars',
    'GGPoker',
    'PartyPoker',
    'ACR',
    'Ignition',
    'Live Casino',
    'Home Game',
    'Other'
  ];
}

// Calculate cash game stats
export function calculateCashStats(sessions) {
  const cashSessions = sessions.filter(s => s.type === 'cash');

  if (cashSessions.length === 0) {
    return {
      totalProfitBB: 0,
      totalProfitDollars: 0,
      totalHands: 0,
      totalMinutes: 0,
      sessionsPlayed: 0,
      bbPer100: 0,
      hourlyRateBB: 0,
      hourlyRateDollars: 0,
      winningSessionsPercent: 0
    };
  }

  const totalProfitBB = cashSessions.reduce((sum, s) => sum + s.profitBB, 0);
  const totalProfitDollars = cashSessions.reduce((sum, s) => sum + s.profitDollars, 0);
  const totalHands = cashSessions.reduce((sum, s) => sum + (s.hands || 0), 0);
  const totalMinutes = cashSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const winningSessions = cashSessions.filter(s => s.profitBB > 0).length;

  return {
    totalProfitBB,
    totalProfitDollars,
    totalHands,
    totalMinutes,
    sessionsPlayed: cashSessions.length,
    bbPer100: calculateBBPer100(totalProfitBB, totalHands),
    hourlyRateBB: calculateHourlyRate(totalProfitBB, totalMinutes),
    hourlyRateDollars: calculateHourlyRate(totalProfitDollars, totalMinutes),
    winningSessionsPercent: (winningSessions / cashSessions.length) * 100
  };
}

// Calculate tournament stats
export function calculateTournamentStats(sessions) {
  const tournamentSessions = sessions.filter(s => s.type === 'tournament');

  if (tournamentSessions.length === 0) {
    return {
      totalProfit: 0,
      totalBuyIns: 0,
      totalCashOuts: 0,
      tournamentsPlayed: 0,
      roi: 0,
      itmPercent: 0,
      avgBuyIn: 0
    };
  }

  const totalBuyIns = tournamentSessions.reduce((sum, s) => sum + s.buyIn, 0);
  const totalCashOuts = tournamentSessions.reduce((sum, s) => sum + s.cashOut, 0);
  const itmCount = tournamentSessions.filter(s => s.cashOut > 0).length;

  return {
    totalProfit: totalCashOuts - totalBuyIns,
    totalBuyIns,
    totalCashOuts,
    tournamentsPlayed: tournamentSessions.length,
    roi: calculateROI(totalBuyIns, totalCashOuts),
    itmPercent: (itmCount / tournamentSessions.length) * 100,
    avgBuyIn: totalBuyIns / tournamentSessions.length
  };
}

// Calculate stats by stakes
export function calculateStatsByStakes(sessions) {
  const cashSessions = sessions.filter(s => s.type === 'cash');
  const stakeGroups = {};

  cashSessions.forEach(session => {
    const stakes = session.stakes;
    if (!stakeGroups[stakes]) {
      stakeGroups[stakes] = {
        sessions: [],
        totalBB: 0,
        totalDollars: 0,
        totalHands: 0,
        totalMinutes: 0
      };
    }
    stakeGroups[stakes].sessions.push(session);
    stakeGroups[stakes].totalBB += session.profitBB;
    stakeGroups[stakes].totalDollars += session.profitDollars;
    stakeGroups[stakes].totalHands += session.hands || 0;
    stakeGroups[stakes].totalMinutes += session.duration || 0;
  });

  return Object.entries(stakeGroups).map(([stakes, data]) => ({
    stakes,
    sessionsCount: data.sessions.length,
    totalBB: data.totalBB,
    totalDollars: data.totalDollars,
    totalHands: data.totalHands,
    bbPer100: calculateBBPer100(data.totalBB, data.totalHands),
    hourlyRateDollars: calculateHourlyRate(data.totalDollars, data.totalMinutes)
  })).sort((a, b) => getbbValueFromStakes(b.stakes) - getbbValueFromStakes(a.stakes));
}

// Prepare data for profit over time chart
export function prepareProfitChartData(sessions, type = 'all') {
  let filteredSessions = sessions;
  if (type === 'cash') {
    filteredSessions = sessions.filter(s => s.type === 'cash');
  } else if (type === 'tournament') {
    filteredSessions = sessions.filter(s => s.type === 'tournament');
  }

  // Sort by date
  const sorted = [...filteredSessions].sort((a, b) =>
    new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00')
  );

  let cumulativeProfitDollars = 0;
  let cumulativeProfitBB = 0;

  return sorted.map(session => {
    if (session.type === 'cash') {
      cumulativeProfitDollars += session.profitDollars;
      cumulativeProfitBB += session.profitBB;
    } else {
      cumulativeProfitDollars += (session.cashOut - session.buyIn);
    }

    return {
      date: session.date,
      profitDollars: cumulativeProfitDollars,
      profitBB: cumulativeProfitBB,
      sessionProfit: session.type === 'cash' ? session.profitDollars : (session.cashOut - session.buyIn)
    };
  });
}
