import React, { useState } from 'react';
import StudentList from './StudentList';
import RestaurantList from './RestaurantList';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');

  return (
    <div className="app-container">
      <header className="main-header">
        <button className="burger-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <div className="logo-container" onClick={() => setCurrentView('home')}>
          <img src="https://shoponline.unilabor.com/c/51-category_default/joviat.jpg" alt="Logo" className="logo-img" />
        </div>
      </header>

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          <li onClick={() => {setCurrentView('home'); setMenuOpen(false);}}>🏠 Inici</li>
          <li onClick={() => {setCurrentView('students'); setMenuOpen(false);}}>👨‍🎓 Alumnes</li>
          <li onClick={() => {setCurrentView('restaurants'); setMenuOpen(false);}}>🍴 Restaurants</li>
        </ul>
      </nav>

      <main className={`main-content ${menuOpen ? 'shifted' : ''}`}>
        {currentView === 'home' && (
          <div style={{textAlign: 'center', marginTop: '50px'}}>
            <h1>Benvinguts a la Xarxa Joviat</h1>
            <p>Projecte SDAMV2 - Gestió d'Alumni i Restaurants</p>
          </div>
        )}
        {currentView === 'students' && <StudentList />}
        {currentView === 'restaurants' && <RestaurantList />}
      </main>
    </div>
  );
}

export default App;