import React, { useState, useEffect } from 'react';
import { fetchWeeklyMenu, updateWeeklyMenu } from '../api/client';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, CheckCircle2 } from 'lucide-react';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const MEALS: ('breakfast' | 'lunch' | 'snacks' | 'dinner')[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

export const WeeklyMenuEditor: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState('monday');
  const [menuData, setMenuData] = useState<Record<string, Record<string, string[]>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newItemText, setNewItemText] = useState<Record<string, string>>({
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: '',
  });

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await fetchWeeklyMenu();
      const formatted: Record<string, Record<string, string[]>> = {};

      DAYS.forEach(d => {
        formatted[d.key] = {
          breakfast: [],
          lunch: [],
          snacks: [],
          dinner: []
        };
      });

      if (Array.isArray(data)) {
        data.forEach((dayObj: any) => {
          const dKey = dayObj.dayOfWeek;
          if (formatted[dKey]) {
            formatted[dKey] = {
              breakfast: dayObj.breakfast?.items || [],
              lunch: dayObj.lunch?.items || [],
              snacks: dayObj.snacks?.items || [],
              dinner: dayObj.dinner?.items || [],
            };
          }
        });
      }
      setMenuData(formatted);
    } catch (err: any) {
      setToast({ type: 'error', message: 'Failed to load weekly menu.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleAddItem = (meal: string) => {
    const text = newItemText[meal]?.trim();
    if (!text) return;

    setMenuData(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [meal]: [...(prev[selectedDay]?.[meal] || []), text]
      }
    }));

    setNewItemText(prev => ({ ...prev, [meal]: '' }));
  };

  const handleRemoveItem = (meal: string, index: number) => {
    setMenuData(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [meal]: prev[selectedDay][meal].filter((_, i) => i !== index)
      }
    }));
  };

  const handleMoveItem = (meal: string, index: number, direction: 'up' | 'down') => {
    setMenuData(prev => {
      const currentList = [...(prev[selectedDay]?.[meal] || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentList.length) return prev;

      const temp = currentList[index];
      currentList[index] = currentList[targetIndex];
      currentList[targetIndex] = temp;

      return {
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          [meal]: currentList
        }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const currentDayMenu = menuData[selectedDay];
      const payload = {
        breakfast: { items: currentDayMenu.breakfast },
        lunch: { items: currentDayMenu.lunch },
        snacks: { items: currentDayMenu.snacks },
        dinner: { items: currentDayMenu.dinner },
      };

      await updateWeeklyMenu(selectedDay, payload);
      setToast({ type: 'success', message: `Successfully updated ${selectedDay.toUpperCase()} menu!` });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to save menu' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading weekly menu...</div>;
  }

  const currentDayMeals = menuData[selectedDay] || { breakfast: [], lunch: [], snacks: [], dinner: [] };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Weekly Menu Editor</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Edit baseline menu for each day of the week</p>
        </div>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem' }}
        >
          <Save size={18} />
          {saving ? 'Publishing...' : `Save ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} Menu`}
        </button>
      </div>

      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' && <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* Day Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {DAYS.map(day => (
          <button
            key={day.key}
            onClick={() => setSelectedDay(day.key)}
            className={`btn-secondary ${selectedDay === day.key ? 'active' : ''}`}
            style={{
              padding: '0.6rem 1.25rem',
              fontWeight: selectedDay === day.key ? 600 : 400,
              backgroundColor: selectedDay === day.key ? 'var(--accent-forest)' : 'var(--surface-card)',
              color: selectedDay === day.key ? '#ffffff' : 'var(--text-ink)',
              borderColor: selectedDay === day.key ? 'var(--accent-forest)' : 'var(--border-color)',
            }}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Meals Grid */}
      <div className="grid-2">
        {MEALS.map(meal => {
          const items = currentDayMeals[meal] || [];
          return (
            <div key={meal} className="card">
              <div className="card-header">
                <span className="card-title" style={{ textTransform: 'capitalize' }}>{meal}</span>
                <span className="badge badge-forest">{items.length} items</span>
              </div>

              {/* Add item input */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={`Add food item to ${meal}...`}
                  value={newItemText[meal]}
                  onChange={e => setNewItemText(prev => ({ ...prev, [meal]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddItem(meal); }}
                />
                <button
                  className="btn-secondary"
                  onClick={() => handleAddItem(meal)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  No food items added for {meal} yet.
                </div>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {items.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'var(--bg-paper)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <span>{item}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          onClick={() => handleMoveItem(meal, idx, 'up')}
                          disabled={idx === 0}
                          style={{ background: 'none', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-muted)', padding: '2px' }}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveItem(meal, idx, 'down')}
                          disabled={idx === items.length - 1}
                          style={{ background: 'none', color: idx === items.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)', padding: '2px' }}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(meal, idx)}
                          style={{ background: 'none', color: '#e11d48', padding: '2px', marginLeft: '0.25rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
