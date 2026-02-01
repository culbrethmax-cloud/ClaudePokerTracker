import { useState, useMemo } from 'react';
import { useSessions } from '../hooks/useSessions';
import { ProfitChart, StakesChart, BBPer100Chart } from '../components/Charts';
import {
  calculateCashStats,
  calculateTournamentStats,
  calculateStatsByStakes,
  prepareProfitChartData,
  formatCurrency,
  formatBB,
  formatPercent,
  formatDuration
} from '../utils/calculations';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Stats() {
  const { sessions, loading } = useSessions();
  const [activeTab, setActiveTab] = useState('cash');
  const [chartMode, setChartMode] = useState('dollars');

  // Filter state
  const [selectedStakes, setSelectedStakes] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);

  // Get unique stakes from sessions
  const availableStakes = useMemo(() => {
    const stakes = new Set();
    sessions.filter(s => s.type === 'cash').forEach(s => {
      if (s.stakes) stakes.add(s.stakes);
    });
    return Array.from(stakes).sort((a, b) => {
      const aVal = parseInt(a.match(/\d+/)?.[0] || 0);
      const bVal = parseInt(b.match(/\d+/)?.[0] || 0);
      return aVal - bVal;
    });
  }, [sessions]);

  // Filter sessions based on selected filters
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Stakes filter (only for cash games)
      if (selectedStakes !== 'all' && session.type === 'cash') {
        if (session.stakes !== selectedStakes) return false;
      }

      // Date range filter
      if (startDate) {
        const sessionDate = new Date(session.date + 'T00:00:00');
        const start = new Date(startDate + 'T00:00:00');
        if (sessionDate < start) return false;
      }
      if (endDate) {
        const sessionDate = new Date(session.date + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        end.setHours(23, 59, 59, 999);
        if (sessionDate > end) return false;
      }

      // Day of week filter
      if (selectedDays.length > 0) {
        const sessionDate = new Date(session.date + 'T00:00:00');
        const dayIndex = sessionDate.getDay();
        if (!selectedDays.includes(dayIndex)) return false;
      }

      return true;
    });
  }, [sessions, selectedStakes, startDate, endDate, selectedDays]);

  // Toggle day selection
  const toggleDay = (dayIndex) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedStakes('all');
    setStartDate('');
    setEndDate('');
    setSelectedDays([]);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedStakes !== 'all' || startDate || endDate || selectedDays.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Calculate stats from filtered sessions
  const cashStats = calculateCashStats(filteredSessions);
  const tournamentStats = calculateTournamentStats(filteredSessions);
  const statsByStakes = calculateStatsByStakes(filteredSessions);
  const cashProfitData = prepareProfitChartData(filteredSessions, 'cash');
  const tournamentProfitData = prepareProfitChartData(filteredSessions, 'tournament');
  const allProfitData = prepareProfitChartData(filteredSessions, 'all');

  const tabs = [
    { id: 'cash', label: 'Cash Games' },
    { id: 'tournament', label: 'Tournaments' },
    { id: 'overview', label: 'Overview' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-100">Statistics</h2>

      {/* Filters */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-100">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Stakes Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Stakes</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedStakes('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedStakes === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {availableStakes.map(stakes => (
                <button
                  key={stakes}
                  onClick={() => setSelectedStakes(stakes)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedStakes === stakes
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {stakes}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Date Range</label>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input px-3 py-1.5 text-sm rounded-lg"
                placeholder="Start date"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input px-3 py-1.5 text-sm rounded-lg"
              />
            </div>
          </div>

          {/* Day of Week Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Day of Week</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day, index) => (
                <button
                  key={day}
                  onClick={() => toggleDay(index)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedDays.includes(index)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Showing <span className="text-gray-100 font-medium">{filteredSessions.length}</span> of{' '}
              <span className="text-gray-100 font-medium">{sessions.length}</span> sessions
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cash Games Tab */}
      {activeTab === 'cash' && (
        <div className="space-y-6">
          {cashStats.sessionsPlayed === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No cash game sessions {hasActiveFilters ? 'match your filters' : 'recorded yet'}.</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Cash Game Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-400">Total Profit</p>
                    <p className={`text-2xl font-bold ${cashStats.totalProfitDollars >= 0 ? 'profit-text' : 'loss-text'}`}>
                      {formatCurrency(cashStats.totalProfitDollars)}
                    </p>
                    <p className={`text-sm ${cashStats.totalProfitBB >= 0 ? 'profit-text' : 'loss-text'}`}>
                      {formatBB(cashStats.totalProfitBB)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">BB/100 Hands</p>
                    <p className={`text-2xl font-bold ${cashStats.bbPer100 >= 0 ? 'profit-text' : 'loss-text'}`}>
                      {cashStats.bbPer100.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">
                      across {cashStats.sessionsPlayed} sessions
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Hourly Rate</p>
                    <p className={`text-2xl font-bold ${cashStats.hourlyRateDollars >= 0 ? 'profit-text' : 'loss-text'}`}>
                      {formatCurrency(cashStats.hourlyRateDollars)}/hr
                    </p>
                    <p className={`text-sm ${cashStats.hourlyRateBB >= 0 ? 'profit-text' : 'loss-text'}`}>
                      {cashStats.hourlyRateBB.toFixed(1)} BB/hr
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Hands</p>
                    <p className="text-2xl font-bold">{cashStats.totalHands.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">
                      {formatDuration(cashStats.totalMinutes)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit Over Time Chart */}
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Profit Over Time</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartMode('dollars')}
                      className={`px-3 py-1 text-sm rounded ${
                        chartMode === 'dollars'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      $
                    </button>
                    <button
                      onClick={() => setChartMode('bb')}
                      className={`px-3 py-1 text-sm rounded ${
                        chartMode === 'bb'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      BB
                    </button>
                  </div>
                </div>
                <ProfitChart data={cashProfitData} showBB={chartMode === 'bb'} />
              </div>

              {/* Results by Stakes */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Results by Stakes</h3>
                <StakesChart data={statsByStakes} />

                {/* Stakes Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-600">
                        <th className="pb-2">Stakes</th>
                        <th className="pb-2">Hands</th>
                        <th className="pb-2">Profit ($)</th>
                        <th className="pb-2">Profit (BB)</th>
                        <th className="pb-2">BB/100</th>
                        <th className="pb-2">$/hr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsByStakes.map(stake => (
                        <tr key={stake.stakes} className="border-b border-gray-700">
                          <td className="py-2 font-medium">{stake.stakes}</td>
                          <td className="py-2">{stake.totalHands.toLocaleString()}</td>
                          <td className={`py-2 ${stake.totalDollars >= 0 ? 'profit-text' : 'loss-text'}`}>
                            {formatCurrency(stake.totalDollars)}
                          </td>
                          <td className={`py-2 ${stake.totalBB >= 0 ? 'profit-text' : 'loss-text'}`}>
                            {formatBB(stake.totalBB)}
                          </td>
                          <td className={`py-2 ${stake.bbPer100 >= 0 ? 'profit-text' : 'loss-text'}`}>
                            {stake.bbPer100.toFixed(2)}
                          </td>
                          <td className={`py-2 ${stake.hourlyRateDollars >= 0 ? 'profit-text' : 'loss-text'}`}>
                            {formatCurrency(stake.hourlyRateDollars)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BB/100 by Stakes Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">BB/100 by Stakes</h3>
                <BBPer100Chart data={statsByStakes} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Tournaments Tab */}
      {activeTab === 'tournament' && (
        <div className="space-y-6">
          {tournamentStats.tournamentsPlayed === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No tournament sessions {hasActiveFilters ? 'match your filters' : 'recorded yet'}.</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Tournament Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-400">Total Profit</p>
                    <p className={`text-2xl font-bold ${tournamentStats.totalProfit >= 0 ? 'profit-text' : 'loss-text'}`}>
                      {formatCurrency(tournamentStats.totalProfit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">ROI</p>
                    <p className={`text-2xl font-bold ${tournamentStats.roi >= 0 ? 'profit-text' : 'loss-text'}`}>
                      {formatPercent(tournamentStats.roi)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">ITM %</p>
                    <p className="text-2xl font-bold">
                      {tournamentStats.itmPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tournaments</p>
                    <p className="text-2xl font-bold">{tournamentStats.tournamentsPlayed}</p>
                    <p className="text-sm text-gray-400">
                      Avg ${tournamentStats.avgBuyIn.toFixed(0)} buy-in
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit Over Time */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Tournament Profit Over Time</h3>
                <ProfitChart data={tournamentProfitData} />
              </div>

              {/* Additional Tournament Stats */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Tournament Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-400">Total Buy-ins</p>
                    <p className="text-xl font-bold">${tournamentStats.totalBuyIns.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-400">Total Cash-outs</p>
                    <p className="text-xl font-bold">${tournamentStats.totalCashOuts.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {filteredSessions.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No sessions {hasActiveFilters ? 'match your filters' : 'recorded yet'}.</p>
            </div>
          ) : (
            <>
              {/* Combined Stats */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Overall Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-400">Total Profit</p>
                    <p className={`text-2xl font-bold ${
                      (cashStats.totalProfitDollars + tournamentStats.totalProfit) >= 0
                        ? 'profit-text'
                        : 'loss-text'
                    }`}>
                      {formatCurrency(cashStats.totalProfitDollars + tournamentStats.totalProfit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Sessions</p>
                    <p className="text-2xl font-bold">{filteredSessions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Hands</p>
                    <p className="text-2xl font-bold">{cashStats.totalHands.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">cash games</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Time</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(
                        filteredSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Combined Profit Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Combined Profit Over Time</h3>
                <ProfitChart data={allProfitData} />
              </div>

              {/* Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 text-gray-100">Cash Games</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sessions</span>
                      <span className="font-medium">{cashStats.sessionsPlayed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hands</span>
                      <span className="font-medium">{cashStats.totalHands.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profit</span>
                      <span className={`font-medium ${cashStats.totalProfitDollars >= 0 ? 'profit-text' : 'loss-text'}`}>
                        {formatCurrency(cashStats.totalProfitDollars)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">BB/100</span>
                      <span className={`font-medium ${cashStats.bbPer100 >= 0 ? 'profit-text' : 'loss-text'}`}>
                        {cashStats.bbPer100.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 text-gray-100">Tournaments</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tournaments</span>
                      <span className="font-medium">{tournamentStats.tournamentsPlayed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profit</span>
                      <span className={`font-medium ${tournamentStats.totalProfit >= 0 ? 'profit-text' : 'loss-text'}`}>
                        {formatCurrency(tournamentStats.totalProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ROI</span>
                      <span className={`font-medium ${tournamentStats.roi >= 0 ? 'profit-text' : 'loss-text'}`}>
                        {formatPercent(tournamentStats.roi)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
