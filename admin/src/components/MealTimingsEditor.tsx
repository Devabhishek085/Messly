import React, { useState, useEffect } from 'react';
import { fetchTimings, updateTimings } from '../api/client';
import { Clock, Save, CheckCircle2 } from 'lucide-react';

interface TimingItem {
  startTime: string;
  endTime: string;
}

export const MealTimingsEditor: React.FC = () => {
  const [timings, setTimings] = useState<Record<string, TimingItem>>({
    breakfast: { startTime: '08:00', endTime: '09:30' },
    lunch: { startTime: '12:30', endTime: '14:00' },
    snacks: { startTime: '17:00', endTime: '18:00' },
    dinner: { startTime: '20:00', endTime: '21:30' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadTimings = async () => {
    try {
      setLoading(true);
      const data = await fetchTimings();
      if (data) {
        setTimings(prev => ({
          breakfast: data.breakfast || prev.breakfast,
          lunch: data.lunch || prev.lunch,
          snacks: data.snacks || prev.snacks,
          dinner: data.dinner || prev.dinner,
        }));
      }
    } catch (err: any) {
      setToast({ type: 'error', message: 'Failed to load meal timings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimings();
  }, []);

  const handleChange = (meal: string, field: 'startTime' | 'endTime', value: string) => {
    setTimings(prev => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: value
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      await updateTimings(timings);
      setToast({ type: 'success', message: 'Meal timings saved successfully!' });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to update timings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading meal timings...</div>;
  }

  const meals = [
    { key: 'breakfast', label: 'Breakfast', subtitle: 'Morning meal period' },
    { key: 'lunch', label: 'Lunch', subtitle: 'Midday meal period' },
    { key: 'snacks', label: 'Evening Snacks', subtitle: 'Tea & snacks time' },
    { key: 'dinner', label: 'Dinner', subtitle: 'Night meal period' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Meal Timings Editor</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configure global start and end times for all 4 hostel meals</p>
        </div>
      </div>

      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' && <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid-2">
          {meals.map(m => (
            <div key={m.key} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{m.label}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.subtitle}</p>
                </div>
                <div style={{ padding: '0.4rem', backgroundColor: 'var(--accent-tint)', color: 'var(--accent-forest)', borderRadius: '50%' }}>
                  <Clock size={20} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={timings[m.key]?.startTime || '08:00'}
                    onChange={e => handleChange(m.key, 'startTime', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={timings[m.key]?.endTime || '09:30'}
                    onChange={e => handleChange(m.key, 'endTime', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem' }}
          >
            <Save size={18} />
            {saving ? 'Saving Timings...' : 'Save Global Timings'}
          </button>
        </div>
      </form>
    </div>
  );
};
