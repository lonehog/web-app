import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TrendChart({ data = [] }) {
  return (
    <div className="card" style={{ height: 280 }}>
      <h3 style={{ margin: '0 0 8px 0' }}>Last 7 Days</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.2)" />
          <XAxis dataKey="date" stroke="rgba(229,231,235,.8)" fontSize={12} />
          <YAxis stroke="rgba(229,231,235,.8)" fontSize={12} />
          <Tooltip
            contentStyle={{ background: '#0b1220', border: '1px solid rgba(148,163,184,.2)', borderRadius: 8, color: '#e5e7eb' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
