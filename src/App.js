import React, { useState } from 'react';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <div className="app-container">
      {/* Cabecera Negra */}
      <header className="main-header">
        <button className="burger-btn" onClick={toggleMenu}>
          ☰
        </button>
        <div className="logo">JOVIAT HOSTELERÍA</div>
      </header>

      {/* Menú Lateral Desplegable */}
      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <ul>
          <li>Mapa de Restaurantes</li>
          <li>Lista de Alumnos</li>
          <li>Acceso Alumnos</li>
          <li>Acceso Restaurantes</li>
        </ul>
      </nav>

      {/* Contenido Principal */}
      <main className="content">
        <div className="construction-banner">
          <h1>🚧 PÁGINA EN CONSTRUCCIÓN 🚧</h1>
          <p>Estamos cocinando algo grande para los alumnos de la Joviat.</p>
        </div>
      </main>
    </div>
  );
}

export default App;