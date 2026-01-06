import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { formatCurrency, formatBB } from '../utils/calculations';

// Profit Over Time Line Chart
export function ProfitChart({ data, showBB = false }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data to display
      </div>
    );
  }

  const formattedData = data.map(d => ({
    ...d,
    dateFormatted: format(new Date(d.date), 'MMM d'),
    profit: showBB ? d.profitBB : d.profitDollars
  }));

  const minProfit = Math.min(...formattedData.map(d => d.profit));
  const maxProfit = Math.max(...formattedData.map(d => d.profit));
  const yDomain = [
    Math.floor(minProfit * 1.1),
    Math.ceil(maxProfit * 1.1)
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
        <XAxis
          dataKey="dateFormatted"
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          domain={yDomain}
          tickFormatter={(value) => showBB ? `${value}` : `$${value}`}
        />
        <Tooltip
          formatter={(value) => [
            showBB ? formatBB(value) : formatCurrency(value),
            'Cumulative Profit'
          ]}
          labelFormatter={(label) => `Date: ${label}`}
          contentStyle={{
            backgroundColor: '#374151',
            border: '1px solid #4b5563',
            borderRadius: '8px',
            color: '#e5e7eb'
          }}
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Stakes Breakdown Bar Chart
export function StakesChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
        <XAxis
          dataKey="stakes"
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'totalDollars') return [formatCurrency(value), 'Profit'];
            if (name === 'bbPer100') return [`${value.toFixed(2)} BB/100`, 'Win Rate'];
            return [value, name];
          }}
          contentStyle={{
            backgroundColor: '#374151',
            border: '1px solid #4b5563',
            borderRadius: '8px',
            color: '#e5e7eb'
          }}
        />
        <Bar dataKey="totalDollars" name="Profit">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.totalDollars >= 0 ? '#22c55e' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// BB/100 by Stakes Chart
export function BBPer100Chart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
        <XAxis
          dataKey="stakes"
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          formatter={(value) => [`${value.toFixed(2)} BB/100`, 'Win Rate']}
          contentStyle={{
            backgroundColor: '#374151',
            border: '1px solid #4b5563',
            borderRadius: '8px',
            color: '#e5e7eb'
          }}
        />
        <Bar dataKey="bbPer100" name="BB/100">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.bbPer100 >= 0 ? '#22c55e' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
