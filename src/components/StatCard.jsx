export default function StatCard({ label, value, subValue = null, colorClass = '' }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${colorClass}`}>{value}</span>
      {subValue && (
        <span className="text-xs text-gray-400 mt-1">{subValue}</span>
      )}
    </div>
  );
}
