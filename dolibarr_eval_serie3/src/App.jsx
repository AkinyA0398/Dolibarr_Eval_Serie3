// src/App.jsx (Version Finale)
import React, { useState } from 'react';
import Login from './pages/backoffice/Login.jsx';
import Dashboard from './pages/backoffice/Dashboard.jsx';
import Import from './pages/backoffice/Import.jsx';
import Reset from './pages/backoffice/Reset.jsx';
import ListeSalaries from './pages/frontoffice/ListeSalaries.jsx';
import GestionSalaire from './pages/frontoffice/GestionSalaire.jsx';

export default function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('bo_token') || null);
  const [currentView, setCurrentView] = useState('front_liste');
  const [selectedEmploye, setSelectedEmploye] = useState(null);

  const handleLogin = (code) => {
    localStorage.setItem('bo_token', code);
    setAuthToken(code);
    setCurrentView('dashboard');
  };

  return (
    <div className="app-layout">
      {/* Navbar Structure */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand" onClick={() => { setCurrentView('front_liste'); setSelectedEmploye(null); }}>
            <span className="logo-icon"></span>
            <span>HR Core Portal</span>
          </div>
          
          <nav className="navbar-links">
            <button 
              className={`nav-btn ${currentView.startsWith('front') ? 'active' : ''}`}
              onClick={() => { setCurrentView('front_liste'); setSelectedEmploye(null); }}
            >
              Salariés
            </button>

            <span className="nav-divider"></span>

            {!authToken ? (
              <button className="btn btn-secondary btn-sm nav-login" onClick={() => setCurrentView('login')}>
                Accès Sécurisé
              </button>
            ) : (
              <div className="admin-actions">
                <span className="badge-admin">Admin</span>
                <button className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>Dashboard</button>
                <button className={`nav-btn ${currentView === 'import' ? 'active' : ''}`} onClick={() => setCurrentView('import')}>Import</button>
                <button className="btn btn-danger btn-sm" onClick={() => setCurrentView('reset')}>Reset</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { localStorage.removeItem('bo_token'); setAuthToken(null); setCurrentView('front_liste'); }}>Quitter</button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container">
        {currentView === 'login' && <Login onLogin={handleLogin} />}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'import' && <Import />}
        {currentView === 'reset' && <Reset />}
        
        {currentView === 'front_liste' && (
          !selectedEmploye ? (
            <ListeSalaries onSelectEmploye={(emp) => setSelectedEmploye(emp)} />
          ) : (
            <GestionSalaire employe={selectedEmploye} onBack={() => setSelectedEmploye(null)} />
          )
        )}
      </main>
    </div>
  );
}