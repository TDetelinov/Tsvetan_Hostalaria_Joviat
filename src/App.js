import React, { useState, useEffect } from 'react';
import StudentList from './StudentList';
import RestaurantList from './RestaurantList';
import Login from './Login';
import AddStudent from './AddStudent'; // Importem el component d'afegir alumne
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './App.css';

// --- COMPONENTS D'ICONES MINIMALISTES (SVG) ---
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconRest = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;
const IconLogin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) await checkIfAdmin(currentUser.email);
      else setIsAdmin(false);
    });
    return () => unsubscribe();
  }, []);

  const checkIfAdmin = async (email) => {
    const q = query(collection(db, "Administrator"), where("Email", "==", email));
    const querySnapshot = await getDocs(q);
    setIsAdmin(!querySnapshot.empty);
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <button className="burger-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <div className={`burger-line ${menuOpen ? 'open' : ''}`}></div>
        </button>
        <div className="logo-container" onClick={() => setCurrentView('home')}>
          <img src="https://shoponline.unilabor.com/c/51-category_default/joviat.jpg" alt="Logo" className="logo-img" />
        </div>
        {user && (
          <div className={`user-indicator ${isAdmin ? 'admin-badge' : ''}`}>
            {user.email}
          </div>
        )}
      </header>

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          <li onClick={() => {setCurrentView('home'); setMenuOpen(false);}}>
            <IconHome /> <span>Inici</span>
          </li>
          <li onClick={() => {setCurrentView('students'); setMenuOpen(false);}}>
            <IconUsers /> <span>Alumnes</span>
          </li>
          <li onClick={() => {setCurrentView('restaurants'); setMenuOpen(false);}}>
            <IconRest /> <span>Restaurants</span>
          </li>
          
          <div className="sidebar-separator"></div>
          
          {!user ? (
            <li className="login-link" onClick={() => {setCurrentView('login'); setMenuOpen(false);}}>
              <IconLogin /> <span>Accés Privat</span>
            </li>
          ) : (
            <>
              <li className="logout-link" onClick={() => {signOut(auth); setCurrentView('home'); setMenuOpen(false);}}>
                <IconLogout /> <span>Tancar Sessió</span>
              </li>

              {isAdmin && (
                <div className="admin-section">
                  <p className="sidebar-label">Administració</p>
                  <li onClick={() => {setCurrentView('add-student'); setMenuOpen(false);}}>
                    <IconPlus /> <span>Nou Alumne</span>
                  </li>
                  <li onClick={() => {setCurrentView('add-restaurant'); setMenuOpen(false);}}>
                    <IconPlus /> <span>Nou Restaurant</span>
                  </li>
                  <li onClick={() => {setCurrentView('manage-altas'); setMenuOpen(false);}}>
                    <IconPlus /> <span>Gestionar Altes</span>
                  </li>
                </div>
              )}
            </>
          )}
        </ul>
      </nav>

      <main className={`main-content ${menuOpen ? 'shifted' : ''}`}>
        {currentView === 'home' && (
          <div className="home-hero">
            <h1 className="joviat-title">XARXA ALUMNI</h1>
            <div className="underline"></div>
            <p className="joviat-subtitle">Escola Hoteleria Joviat</p>
          </div>
        )}
        
        {/* Vistes públiques i de login */}
        {currentView === 'login' && <Login onLoginSuccess={() => setCurrentView('home')} />}
        {currentView === 'students' && <StudentList />}
        {currentView === 'restaurants' && <RestaurantList />}
        
        {/* Vistes d'Administrador (Formularis) */}
        {currentView === 'add-student' && <AddStudent />}
        
        {/* Vistes en desenvolupament per l'Admin */}
        {currentView === 'add-restaurant' && (
          <div className="admin-form-container">
            <div className="section-header">
              <h2>Alta de Nou Restaurant</h2>
              <div className="underline"></div>
              <p>Panell en construcció.</p>
            </div>
          </div>
        )}
        {currentView === 'manage-altas' && (
          <div className="admin-form-container">
            <div className="section-header">
              <h2>Gestionar Altes</h2>
              <div className="underline"></div>
              <p>Panell en construcció.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;