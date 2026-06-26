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
  const [currentView, setCurrentView] = useState('front_liste'); // Vue par défaut sur le FrontOffice
  const [selectedEmploye, setSelectedEmploye] = useState(null);

  const handleLogin = (code) => {
    localStorage.setItem('bo_token', code);
    setAuthToken(code);
    setCurrentView('dashboard'); // Redirection auto sur le dashboard après auth
  };

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f7fafc', minHeight: '100vh' }}>
      {/* Barre de navigation unifiée (Front & Bouton Accès Backoffice) */}
      <nav style={{ display: 'flex', gap: '20px', padding: '15px', background: '#2d3748', color: '#fff', alignItems: 'center' }}>
        <strong style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => { setCurrentView('front_liste'); setSelectedEmploye(null); }}>
          💼 HumanResources NewAPP
        </strong>
        
        <button onClick={() => { setCurrentView('front_liste'); setSelectedEmploye(null); }} style={{ background: 'none', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Espace Salariés (Front)
        </button>

        <span style={{ color: '#4a5568' }}>|</span>

        {/* Section Backoffice sécurisée */}
        {!authToken ? (
          <button onClick={() => setCurrentView('login')} style={{ background: '#4a5568', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}>
            🔒 Accès Backoffice
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '15px', marginLeft: 'auto', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e0', fontSize: '13px' }}>Mode Admin enclenché</span>
            <button onClick={() => setCurrentView('dashboard')} style={{ background: 'none', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: currentView === 'dashboard' ? 'bold' : 'normal' }}>Dashboard</button>
            <button onClick={() => setCurrentView('import')} style={{ background: 'none', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: currentView === 'import' ? 'bold' : 'normal' }}>Import CSV/ZIP</button>
            <button onClick={() => setCurrentView('reset')} style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Reset</button>
            <button onClick={() => { localStorage.removeItem('bo_token'); setAuthToken(null); setCurrentView('front_liste'); }} style={{ background: '#718096', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Quitter BO</button>
          </div>
        )}
      </nav>

      {/* Zone d'affichage des écrans */}
      <div style={{ padding: '25px' }}>
        {currentView === 'login' && <Login onLogin={handleLogin} />}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'import' && <Import />}
        {currentView === 'reset' && <Reset />}
        
        {/* Logique Front-office imbriquée */}
        {currentView === 'front_liste' && (
          !selectedEmploye ? (
            <ListeSalaries onSelectEmploye={(emp) => setSelectedEmploye(emp)} />
          ) : (
            <GestionSalaire employe={selectedEmploye} onBack={() => setSelectedEmploye(null)} />
          )
        )}
      </div>
    </div>
  );
}