import React, { useState, useEffect } from 'react';
import { fetchOverrides, setSpecialOverride, deleteSpecialOverride } from '../api/client';
import { Calendar, Plus, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const MEALS: ('breakfast' | 'lunch' | 'snacks' | 'dinner')[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

export const SpecialOverrideEditor: React.FC = () => {
  const getTodayStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [date, setDate] = useState(getTodayStr());
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'snacks' | 'dinner'>('lunch');
  const [items, setItems] = useState<string[]>(['Chole Bhature', 'Special Sweets', 'Jeera Rice']);
  const [itemInput, setItemInput] = useState('');
  
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadOverridesList = async () => {
    try {
      setLoading(true);
      const data = await fetchOverrides();
      setOverrides(data || []);
    } catch (err: any) {
      setToast({ type: 'error', message: 'Failed to load special date overrides.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverridesList();
  }, []);

  const handleAddItem = () => {
    if (!itemInput.trim()) return;
    setItems(prev => [...prev, itemInput.trim()]);
    setItemInput('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    setToast(null);

    try {
      const payload = {
        [selectedMeal]: { items }
      };

      await setSpecialOverride(date, payload);
      setToast({ type: 'success', message: `Special override for ${date} (${selectedMeal.toUpperCase()}) saved!` });
      await loadOverridesList();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to save override.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (overrideDate: string) => {
    if (!window.confirm(`Are you sure you want to remove the special menu override for ${overrideDate}?`)) return;
    try {
      await deleteSpecialOverride(overrideDate);
      setToast({ type: 'success', message: `Override for ${overrideDate} removed.` });
      await loadOverridesList();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to delete override' });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Special Date Override Editor</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Override meal menus for specific holiday/festival calendar dates without altering recurring weekly menus
        </p>
      </div>

      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Create / Edit Override Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Add Special Override</h3>
            <Calendar size={20} color="var(--accent-forest)" />
          </div>

          <form onSubmit={handleSaveOverride} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Calendar Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                className="input-field"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Select Meal to Override
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {MEALS.map(meal => (
                  <button
                    type="button"
                    key={meal}
                    onClick={() => setSelectedMeal(meal)}
                    className="btn-secondary"
                    style={{
                      padding: '0.5rem 0.25rem',
                      textTransform: 'capitalize',
                      fontSize: '0.8rem',
                      fontWeight: selectedMeal === meal ? 600 : 400,
                      backgroundColor: selectedMeal === meal ? 'var(--accent-forest)' : 'var(--surface-card)',
                      color: selectedMeal === meal ? '#ffffff' : 'var(--text-ink)',
                      borderColor: selectedMeal === meal ? 'var(--accent-forest)' : 'var(--border-color)',
                    }}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Override Food Items
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Special Paneer Tikka..."
                  value={itemInput}
                  onChange={e => setItemInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddItem}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {/* Food Items Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '40px' }}>
                {items.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: 'var(--accent-tint)',
                      color: 'var(--accent-forest)',
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'none', color: 'var(--accent-forest)', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving || items.length === 0}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.65rem' }}
            >
              <Save size={18} />
              {saving ? 'Publishing Override...' : 'Publish Special Date Override'}
            </button>
          </form>
        </div>

        {/* Existing Overrides List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Active Special Overrides</h3>
            <span className="badge badge-neutral">{overrides.length} dates</span>
          </div>

          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading overrides...</div>
          ) : overrides.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              No special date overrides scheduled.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {overrides.map((ov: any) => (
                <div
                  key={ov.date}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--bg-paper)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-forest)' }}>
                      📅 {ov.date}
                    </span>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteOverride(ov.date)}
                    >
                      Delete
                    </button>
                  </div>

                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    {MEALS.map(meal => {
                      const mealItems = ov[meal]?.items;
                      if (!mealItems || mealItems.length === 0) return null;
                      return (
                        <div key={meal} style={{ marginTop: '0.2rem' }}>
                          <strong style={{ textTransform: 'capitalize', color: 'var(--text-ink)' }}>{meal}:</strong> {mealItems.join(', ')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
