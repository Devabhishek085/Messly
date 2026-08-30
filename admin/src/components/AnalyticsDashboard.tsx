import React, { useState, useEffect } from 'react';
import { fetchAnalytics } from '../api/client';
import { Users, Eye, Bell, Activity, RefreshCw } from 'lucide-react';

interface AnalyticsData {
  totalUniqueDevices: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  menuViewsToday: number;
  remindersEnabledCount: number;
  mostViewedMeal: string;
  mostViewedDay: string;
  dailyTrend: { date: string; activeUsers: number }[];
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await fetchAnalytics();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Computing real-time analytics...</div>;
  }

  if (error || !data) {
    return (
      <div className="toast-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{error || 'No analytics data available.'}</span>
        <button className="btn-secondary" onClick={loadData}>Retry</button>
      </div>
    );
  }

  // Calculate SVG line chart coordinates
  const trend = data.dailyTrend || [];
  const maxVal = Math.max(...trend.map(t => t.activeUsers), 1);
  const svgWidth = 600;
  const svgHeight = 180;
  const padding = 30;

  const points = trend.map((t, index) => {
    const x = padding + (index / (trend.length - 1 || 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - (t.activeUsers / maxVal) * (svgHeight - padding * 2);
    return { x, y, date: t.date, val: t.activeUsers };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Anonymous Student Telemetry</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Privacy-preserving engagement metrics aggregated from student app usage</p>
        </div>
        <button className="btn-secondary" onClick={loadData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>

      {/* Key Metric Tiles */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unique Devices</span>
            <Users size={18} color="var(--accent-forest)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-ink)' }}>
            {data.totalUniqueDevices}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            All-time installed devices
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Today</span>
            <Activity size={18} color="var(--accent-forest)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--accent-forest)' }}>
            {data.activeToday}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {data.activeThisWeek} this week · {data.activeThisMonth} this month
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Menu Views Today</span>
            <Eye size={18} color="var(--accent-forest)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-ink)' }}>
            {data.menuViewsToday}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Top meal: <strong style={{ textTransform: 'capitalize' }}>{data.mostViewedMeal}</strong>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reminders Active</span>
            <Bell size={18} color="var(--accent-forest)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-ink)' }}>
            {data.remindersEnabledCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Students with scheduled notifications
          </div>
        </div>
      </div>

      {/* 7-Day Trend Chart Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">7-Day Active Devices Trend</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily unique active devices over the past week</p>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', maxHeight: '220px' }}>
            {/* Grid lines */}
            <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="var(--border-color)" strokeWidth="1" />
            <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3,3" />

            {/* Line Path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="var(--accent-forest)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points & Labels */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="var(--accent-forest)" stroke="#ffffff" strokeWidth="2" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill="var(--text-ink)" fontWeight="600">
                  {p.val}
                </text>
                <text x={p.x} y={svgHeight - 10} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                  {p.date.slice(5)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
