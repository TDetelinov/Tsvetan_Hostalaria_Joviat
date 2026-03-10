import React, { useState } from 'react';
import StudentList from './StudentList';
import './App.css';

function App() {
  // Estado para el menú en móvil
  const [menuOpen, setMenuOpen] = useState(false);
  // Estado para controlar qué pantalla vemos ('home' o 'students')
  const [currentView, setCurrentView] = useState('home');

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Funciones de navegación (cierran el menú en móvil al hacer clic)
  const goToHome = () => {
    setCurrentView('home');
    setMenuOpen(false);
  };

  const goToStudents = () => {
    setCurrentView('students');
    setMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* CABECERA NEGRA */}
      <header className="main-header">
        {/* El botón hamburguesa solo se verá en móvil vía CSS */}
        <button className="burger-btn" onClick={toggleMenu}>
          {menuOpen ? '✕' : '☰'}
        </button>
        
        {/* LOGO JOVIAT (Imagen clickeable para ir a inicio) */}
        <div className="logo-container" onClick={goToHome}>
          <img 
            src="https://shoponline.unilabor.com/c/51-category_default/joviat.jpg" /* <-- Pega aquí tu URL */
            alt="Joviat Home" 
            className="logo-img"
          />
        </div>
      </header>

      {/* MENÚ LATERAL (Siempre visible en PC, desplegable en móvil) */}
      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          <li onClick={goToHome}>🏠 Inicio</li>
          <li onClick={goToStudents}>👨‍🎓 Alumnos</li>
          <li>📍 Modo Mapa</li>
          <li>🍴 Restaurantes</li>
          <hr />
          <li>🔑 Login Alumno</li>
          <li>🏢 Login Restaurante</li>
        </ul>
      </nav>

      {/* CONTENIDO PRINCIPAL (Cambia según el currentView) */}
      <main className={`main-content ${menuOpen ? 'blur' : ''}`}>
        
        {currentView === 'home' && (
          <div className="construction-banner">
            <h1>🚧 WEB EN CONSTRUCCIÓN 🚧</h1>
            <p>Proyecto Escuela Joviat - Manresa</p>
            <p>Selecciona "Alumnos" en el menú para ver la lista.</p>
          </div>
        )}

        {currentView === 'students' && (
          <StudentList />
        )}

      </main>

      {/* OVERLAY PARA MÓVIL (Cierra el menú al clicar fuera) */}
      {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
    </div>
  );
}

export default App;