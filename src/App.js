import React, { useState } from 'react';
import StudentList from './StudentList';
import RestaurantList from './RestaurantList';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <div className="app-container">
      <header className="main-header">
        <button className="burger-btn" onClick={toggleMenu}>
          {menuOpen ? '✕' : '☰'}
        </button>
        
        <div className="logo-container" onClick={() => setCurrentView('home')}>
          <img 
            src="URL_LOGOTIP_JOVIAT.png" 
            alt="Joviat Inici" 
            className="logo-img"
          />
        </div>
      </header>

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          <li onClick={() => {setCurrentView('home'); setMenuOpen(false);}}>🏠 Inici</li>
          <li onClick={() => {setCurrentView('students'); setMenuOpen(false);}}>👨‍🎓 Alumnes</li>
          <li onClick={() => {setCurrentView('restaurants'); setMenuOpen(false);}}>🍴 Restaurants</li>
          <hr />
          <li>🔑 Login Alumne</li>
          <li>🏢 Login Restaurant</li>
        </ul>
      </nav>

      <main className={`main-content ${menuOpen ? 'blur' : ''}`}>
        {currentView === 'home' && (
          <div className="construction-banner">
            <h1>🚧 WEB EN CONSTRUCCIÓ 🚧</h1>
            <p>Projecte SDAMV2 - Escola Joviat Manresa</p>
          </div>
        )}

        {currentView === 'students' && <StudentList />}
        {currentView === 'restaurants' && <RestaurantList />}
      </main>

      {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
    </div>
  );
}

export default App;