import React, { useState, useEffect } from 'react';
import { getAuthToken, clearAuthToken } from './api/client';
import { Login } from './pages/Login';
import { WeeklyMenuEditor } from './components/WeeklyMenuEditor';
import { MealTimingsEditor } from './components/MealTimingsEditor';
import { SpecialOverrideEditor } from './components/SpecialOverrideEditor';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LogOut, Calendar, Clock, Sparkles, BarChart3, Utensils } from 'lucide-react';

type Tab = 'weekly' | 'timings' | 'overrides' | 'analytics';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAuthToken());
  const [activeTab, setActiveTab] = useState<Tab>('weekly');

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener('messly_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('messly_unauthorized', handleUnauthorized);
    };
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="admin-app">
      {/* Header */}
      <header className="admin-header">
        <div className="brand">
          <div className="brand-badge">
            <Utensils size={20} />
          </div>
          <div>
            <span className="brand-title">Messly</span>
            <span className="brand-subtitle"> · KIET Hostel Admin</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="admin-nav">
          <button
            className={`nav-tab ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Calendar size={16} /> Weekly Menu
          </button>
          <button
            className={`nav-tab ${activeTab === 'timings' ? 'active' : ''}`}
            onClick={() => setActiveTab('timings')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Clock size={16} /> Meal Timings
          </button>
          <button
            className={`nav-tab ${activeTab === 'overrides' ? 'active' : ''}`}
            onClick={() => setActiveTab('overrides')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={16} /> Special Overrides
          </button>
          <button
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <BarChart3 size={16} /> Analytics
          </button>
        </nav>

        {/* Logout Button */}
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Sign Out
        </button>
      </header>

      {/* Main Content Area */}
      <main className="admin-container">
        {activeTab === 'weekly' && <WeeklyMenuEditor />}
        {activeTab === 'timings' && <MealTimingsEditor />}
        {activeTab === 'overrides' && <SpecialOverrideEditor />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--surface-card)',
        marginTop: '2rem'
      }}>
        Messly Admin Portal · KIET Group of Institutions, Boys Hostel · v1.0.0
      </footer>
    </div>
  );
};

export default App;
