import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../hooks/useSessions';

export default function ImportSessions() {
  const navigate = useNavigate();
  const { addSession } = useSessions();
  const [csvText, setCsvText] = useState('');
  const [parsedSessions, setParsedSessions] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1 = paste, 2 = preview, 3 = done

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Must have a header row and at least one data row');
    }

    // Detect delimiter: tab (from Google Sheets copy) or comma (from CSV file)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    // Parse header
    const header = firstLine.split(delimiter).map(h => h.trim().toLowerCase());

    // Find column indexes
    const dateIdx = header.findIndex(h => h.includes('date'));
    const gameTypeIdx = header.findIndex(h => h.includes('gametype') || h.includes('game type') || h.includes('game'));
    const hoursIdx = header.findIndex(h => h.includes('hour') || h.includes('length'));
    const handsIdx = header.findIndex(h => h.includes('hand'));
    const stakesIdx = header.findIndex(h => h.includes('stake'));
    const resultBBIdx = header.findIndex(h => h.includes('resultbb') || h.includes('result bb') || h === 'bb');
    const resultCashIdx = header.findIndex(h => h.includes('resultcash') || h.includes('result cash') || h.includes('cash') || h === '$');

    if (dateIdx === -1) throw new Error('Could not find Date column');
    if (stakesIdx === -1) throw new Error('Could not find Stakes column');
    if (resultBBIdx === -1) throw new Error('Could not find ResultBB column');

    // Parse data rows
    const sessions = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by detected delimiter
      const values = line.split(delimiter).map(v => v.trim());

      const date = values[dateIdx];
      const gameType = gameTypeIdx !== -1 ? values[gameTypeIdx] : 'NLHE';
      const hours = hoursIdx !== -1 ? parseFloat(values[hoursIdx]) || 0 : 0;
      const hands = handsIdx !== -1 ? parseInt(values[handsIdx]) || 0 : 0;
      const stakes = values[stakesIdx];
      const resultBB = parseFloat(values[resultBBIdx]) || 0;
      const resultCash = resultCashIdx !== -1 ? parseFloat(values[resultCashIdx]) || 0 : null;

      // Validate date format
      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.warn(`Skipping row ${i + 1}: invalid date format "${date}"`);
        continue;
      }

      // Check if this is a tournament (MTT)
      const isTournament = gameType.toUpperCase().includes('MTT');

      if (isTournament) {
        // Tournament session
        const profit = resultCash !== null ? resultCash : 0;
        sessions.push({
          type: 'tournament',
          date: date,
          gameType: 'MTT',
          duration: Math.round(hours * 60),
          buyIn: 0, // Unknown - can be edited later
          cashOut: profit, // Store profit as cashOut since buyIn is 0
          location: '',
          notes: 'Imported - buy-in not recorded'
        });
      } else {
        // Cash game session
        sessions.push({
          type: 'cash',
          date: date,
          gameType: gameType,
          duration: Math.round(hours * 60),
          hands: hands,
          stakes: stakes,
          profitBB: resultBB,
          profitDollars: resultCash !== null ? resultCash : calculateDollars(resultBB, stakes),
          location: '',
          notes: ''
        });
      }
    }

    return sessions;
  };

  // Calculate dollars from BB if not provided
  const calculateDollars = (bb, stakes) => {
    const match = stakes.match(/NL(\d+)/i);
    if (match) {
      const bbValue = parseInt(match[1]) / 100;
      return bb * bbValue;
    }
    return bb; // Default to 1:1 if can't parse
  };

  const handleParse = () => {
    setError(null);
    try {
      const sessions = parseCSV(csvText);
      if (sessions.length === 0) {
        throw new Error('No valid sessions found in CSV');
      }
      setParsedSessions(sessions);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setImportProgress(0);

    try {
      for (let i = 0; i < parsedSessions.length; i++) {
        await addSession(parsedSessions[i]);
        setImportProgress(Math.round(((i + 1) / parsedSessions.length) * 100));
      }
      setStep(3);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const formatDollars = (amount) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${amount.toFixed(2)}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Import Sessions</h2>

      {/* Step 1: Paste CSV */}
      {step === 1 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Step 1: Paste Your Data</h3>

          <div className="bg-blue-900/50 text-blue-300 p-4 rounded-lg mb-4 text-sm">
            <p className="font-medium mb-2">How to export from Google Sheets:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your Google Sheet</li>
              <li>Select all your data (Cmd+A on Mac)</li>
              <li>Copy it (Cmd+C on Mac)</li>
              <li>Paste it in the box below</li>
            </ol>
          </div>

          <p className="text-sm text-gray-400 mb-2">
            Expected columns: Date, GameType, LengthHours, Hands, Stakes, ResultBB, ResultCash
          </p>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste your data here..."
            className="input font-mono text-sm"
            rows={12}
          />

          {error && (
            <div className="bg-red-900/50 text-red-400 p-3 rounded-lg mt-4">
              {error}
            </div>
          )}

          <button
            onClick={handleParse}
            disabled={!csvText.trim()}
            className="btn-primary w-full mt-4"
          >
            Preview Import
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Step 2: Preview & Confirm</h3>

          <div className="bg-green-900/50 text-green-300 p-4 rounded-lg mb-4">
            Found <strong>{parsedSessions.length}</strong> sessions to import
            <span className="text-green-400 text-sm ml-2">
              ({parsedSessions.filter(s => s.type === 'cash').length} cash, {parsedSessions.filter(s => s.type === 'tournament').length} tournaments)
            </span>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-600">
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Stakes/Game</th>
                  <th className="pb-2">Result ($)</th>
                </tr>
              </thead>
              <tbody>
                {parsedSessions.slice(0, 10).map((session, idx) => {
                  const profit = session.type === 'cash'
                    ? session.profitDollars
                    : session.cashOut; // cashOut holds profit for imported tournaments
                  return (
                    <tr key={idx} className="border-b border-gray-700">
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          session.type === 'cash'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {session.type === 'cash' ? 'Cash' : 'MTT'}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{session.date}</td>
                      <td className="py-2 pr-4">
                        {session.type === 'cash' ? session.stakes : 'Tournament'}
                      </td>
                      <td className={`py-2 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatDollars(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {parsedSessions.length > 10 && (
              <p className="text-sm text-gray-400 mt-2">
                ... and {parsedSessions.length - 10} more sessions
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-900/50 text-red-400 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {importing && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Importing...</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              disabled={importing}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary flex-1"
            >
              {importing ? 'Importing...' : `Import ${parsedSessions.length} Sessions`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div className="card text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
          <p className="text-gray-400 mb-6">
            Successfully imported {parsedSessions.length} sessions
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
