import { useState, useEffect } from 'react';
import { getStakesOptions, getGameTypeOptions, getDefaultLocations, getbbValueFromStakes, formatCurrency } from '../utils/calculations';

const stakesOptions = getStakesOptions();
const gameTypeOptions = getGameTypeOptions();
const defaultLocations = getDefaultLocations();

export default function SessionForm({ onSubmit, initialData = null, isEditing = false }) {
  const [sessionType, setSessionType] = useState(initialData?.type || 'cash');
  const [formData, setFormData] = useState({
    // Common fields
    date: initialData?.date || new Date().toISOString().split('T')[0],
    duration: initialData?.duration || '',
    location: initialData?.location || '',
    gameType: initialData?.gameType || 'NLHE',
    notes: initialData?.notes || '',
    // Cash game fields
    stakes: initialData?.stakes || 'NL50',
    profitBB: initialData?.profitBB || '',
    hands: initialData?.hands || '',
    // Tournament fields
    buyIn: initialData?.buyIn || '',
    cashOut: initialData?.cashOut || ''
  });

  const [customLocation, setCustomLocation] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);

  // Calculate dollar equivalent for display
  const dollarEquivalent = sessionType === 'cash' && formData.profitBB
    ? formData.profitBB * getbbValueFromStakes(formData.stakes)
    : 0;

  useEffect(() => {
    if (initialData) {
      setSessionType(initialData.type);
      // Check if location is custom
      if (initialData.location && !defaultLocations.includes(initialData.location)) {
        setShowCustomLocation(true);
        setCustomLocation(initialData.location);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomLocation(true);
      setFormData(prev => ({ ...prev, location: '' }));
    } else {
      setShowCustomLocation(false);
      setFormData(prev => ({ ...prev, location: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const sessionData = {
      type: sessionType,
      date: formData.date,
      duration: parseInt(formData.duration) || 0,
      location: showCustomLocation ? customLocation : formData.location,
      gameType: formData.gameType,
      notes: formData.notes.trim()
    };

    if (sessionType === 'cash') {
      sessionData.stakes = formData.stakes;
      sessionData.profitBB = parseFloat(formData.profitBB) || 0;
      sessionData.hands = parseInt(formData.hands) || 0;
    } else {
      sessionData.buyIn = parseFloat(formData.buyIn) || 0;
      sessionData.cashOut = parseFloat(formData.cashOut) || 0;
    }

    onSubmit(sessionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session Type Toggle */}
      <div className="flex rounded-lg bg-gray-700 p-1">
        <button
          type="button"
          onClick={() => setSessionType('cash')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            sessionType === 'cash'
              ? 'bg-gray-600 shadow text-primary-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Cash Game
        </button>
        <button
          type="button"
          onClick={() => setSessionType('tournament')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            sessionType === 'tournament'
              ? 'bg-gray-600 shadow text-primary-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Tournament
        </button>
      </div>

      {/* Date */}
      <div>
        <label className="label">Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="input"
          required
        />
      </div>

      {/* Cash Game Specific Fields */}
      {sessionType === 'cash' && (
        <>
          {/* Stakes */}
          <div>
            <label className="label">Stakes</label>
            <select
              name="stakes"
              value={formData.stakes}
              onChange={handleChange}
              className="input"
              required
            >
              {stakesOptions.map(stake => (
                <option key={stake} value={stake}>{stake}</option>
              ))}
            </select>
          </div>

          {/* Profit in BB */}
          <div>
            <label className="label">Profit (in BBs)</label>
            <input
              type="number"
              name="profitBB"
              value={formData.profitBB}
              onChange={handleChange}
              placeholder="e.g., 50 or -30"
              className="input"
              step="0.1"
              required
            />
            {formData.profitBB && (
              <p className={`mt-1 text-sm ${dollarEquivalent >= 0 ? 'text-profit' : 'text-loss'}`}>
                = {formatCurrency(dollarEquivalent)}
              </p>
            )}
          </div>

          {/* Number of Hands */}
          <div>
            <label className="label">Number of Hands</label>
            <input
              type="number"
              name="hands"
              value={formData.hands}
              onChange={handleChange}
              placeholder="e.g., 500"
              className="input"
              min="0"
            />
          </div>
        </>
      )}

      {/* Tournament Specific Fields */}
      {sessionType === 'tournament' && (
        <>
          {/* Buy-in */}
          <div>
            <label className="label">Buy-in ($)</label>
            <input
              type="number"
              name="buyIn"
              value={formData.buyIn}
              onChange={handleChange}
              placeholder="e.g., 50"
              className="input"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Cash Out */}
          <div>
            <label className="label">Cash Out ($)</label>
            <input
              type="number"
              name="cashOut"
              value={formData.cashOut}
              onChange={handleChange}
              placeholder="e.g., 250 (0 if busted)"
              className="input"
              min="0"
              step="0.01"
              required
            />
            {formData.buyIn && formData.cashOut !== '' && (
              <p className={`mt-1 text-sm ${
                (parseFloat(formData.cashOut) - parseFloat(formData.buyIn)) >= 0
                  ? 'text-profit'
                  : 'text-loss'
              }`}>
                Profit: {formatCurrency(parseFloat(formData.cashOut || 0) - parseFloat(formData.buyIn || 0))}
              </p>
            )}
          </div>
        </>
      )}

      {/* Duration */}
      <div>
        <label className="label">Duration (minutes)</label>
        <input
          type="number"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          placeholder="e.g., 120"
          className="input"
          min="0"
        />
      </div>

      {/* Game Type */}
      <div>
        <label className="label">Game Type</label>
        <select
          name="gameType"
          value={formData.gameType}
          onChange={handleChange}
          className="input"
        >
          {gameTypeOptions.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="label">Location</label>
        <select
          value={showCustomLocation ? 'custom' : formData.location}
          onChange={handleLocationChange}
          className="input"
        >
          <option value="">Select location...</option>
          {defaultLocations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
          <option value="custom">Custom...</option>
        </select>
        {showCustomLocation && (
          <input
            type="text"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="Enter custom location"
            className="input mt-2"
          />
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any notes about this session..."
          className="input"
          rows="3"
        />
      </div>

      {/* Submit Button */}
      <button type="submit" className="btn-primary w-full">
        {isEditing ? 'Update Session' : 'Add Session'}
      </button>
    </form>
  );
}
