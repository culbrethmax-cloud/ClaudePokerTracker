import { useSessions } from '../hooks/useSessions';
import StatCard from '../components/StatCard';
import { ProfitChart } from '../components/Charts';
import {
  calculateCashStats,
  calculateTournamentStats,
  prepareProfitChartData,
  formatCurrency,
  formatBB,
  formatPercent,
  formatDuration
} from '../utils/calculations';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { sessions, loading } = useSessions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const cashStats = calculateCashStats(sessions);
  const tournamentStats = calculateTournamentStats(sessions);
  const profitData = prepareProfitChartData(sessions, 'all');

  const totalProfit = cashStats.totalProfitDollars + tournamentStats.totalProfit;
  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome / Quick Add */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">Dashboard</h2>
        <Link to="/add" className="btn-primary">
          + Add Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No sessions recorded yet.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/add" className="btn-primary">
              Add Your First Session
            </Link>
            <Link to="/import" className="btn-secondary">
              Import from Spreadsheet
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Profit"
              value={formatCurrency(totalProfit)}
              colorClass={totalProfit >= 0 ? 'profit-text' : 'loss-text'}
            />
            <StatCard
              label="Sessions"
              value={sessions.length}
            />
            <StatCard
              label="Cash Games"
              value={cashStats.sessionsPlayed}
              subValue={cashStats.totalProfitDollars !== 0 ? formatCurrency(cashStats.totalProfitDollars) : null}
            />
            <StatCard
              label="Tournaments"
              value={tournamentStats.tournamentsPlayed}
              subValue={tournamentStats.totalProfit !== 0 ? formatCurrency(tournamentStats.totalProfit) : null}
            />
          </div>

          {/* Cash Game Stats */}
          {cashStats.sessionsPlayed > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 text-gray-100">Cash Game Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Profit</p>
                  <p className={`text-xl font-bold ${cashStats.totalProfitDollars >= 0 ? 'profit-text' : 'loss-text'}`}>
                    {formatCurrency(cashStats.totalProfitDollars)}
                  </p>
                  <p className={`text-sm ${cashStats.totalProfitBB >= 0 ? 'profit-text' : 'loss-text'}`}>
                    {formatBB(cashStats.totalProfitBB)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">BB/100</p>
                  <p className={`text-xl font-bold ${cashStats.bbPer100 >= 0 ? 'profit-text' : 'loss-text'}`}>
                    {cashStats.bbPer100.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">{cashStats.totalHands.toLocaleString()} hands</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Hourly Rate</p>
                  <p className={`text-xl font-bold ${cashStats.hourlyRateDollars >= 0 ? 'profit-text' : 'loss-text'}`}>
                    {formatCurrency(cashStats.hourlyRateDollars)}/hr
                  </p>
                  <p className="text-sm text-gray-500">{formatDuration(cashStats.totalMinutes)} played</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Win Rate</p>
                  <p className="text-xl font-bold text-gray-100">
                    {cashStats.winningSessionsPercent.toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-500">winning sessions</p>
                </div>
              </div>
            </div>
          )}

          {/* Tournament Stats */}
          {tournamentStats.tournamentsPlayed > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 text-gray-100">Tournament Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Profit</p>
                  <p className={`text-xl font-bold ${tournamentStats.totalProfit >= 0 ? 'profit-text' : 'loss-text'}`}>
                    {formatCurrency(tournamentStats.totalProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">ROI</p>
                  <p className={`text-xl font-bold ${tournamentStats.roi >= 0 ? 'profit-text' : 'loss-text'}`}>
                    {formatPercent(tournamentStats.roi)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">ITM %</p>
                  <p className="text-xl font-bold text-gray-100">
                    {tournamentStats.itmPercent.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg Buy-in</p>
                  <p className="text-xl font-bold text-gray-100">
                    ${tournamentStats.avgBuyIn.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profit Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-100">Profit Over Time</h3>
            <ProfitChart data={profitData} />
          </div>

          {/* Recent Sessions */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Recent Sessions</h3>
              <Link to="/sessions" className="text-primary-400 text-sm hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentSessions.map(session => (
                <div
                  key={session.id}
                  className="flex justify-between items-center p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-100">
                      {session.type === 'cash' ? session.stakes : 'Tournament'}
                      <span className="text-gray-400 text-sm ml-2">
                        {session.gameType}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">
                      {format(new Date(session.date), 'MMM d, yyyy')}
                      {session.location && ` • ${session.location}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {session.type === 'cash' ? (
                      <>
                        <p className={`font-bold ${session.profitDollars >= 0 ? 'profit-text' : 'loss-text'}`}>
                          {formatCurrency(session.profitDollars)}
                        </p>
                        <p className={`text-sm ${session.profitBB >= 0 ? 'profit-text' : 'loss-text'}`}>
                          {formatBB(session.profitBB)}
                        </p>
                      </>
                    ) : (
                      <p className={`font-bold ${
                        (session.cashOut - session.buyIn) >= 0 ? 'profit-text' : 'loss-text'
                      }`}>
                        {formatCurrency(session.cashOut - session.buyIn)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
