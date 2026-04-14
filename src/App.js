import React, { useEffect, useState } from 'react';
import StudentList from './StudentList';
import RestaurantList from './RestaurantList';
import Login from './Login';
import Register from './Register';
import AddStudent from './AddStudent';
import AddRestaurant from './AddRestaurant';
import AlumniProfile from './AlumniProfile';
import RestaurantProfile from './RestaurantProfile';
import ManageAltas from './ManageAltas';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getAccessState } from './accessControl';
import './App.css';

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconRest = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
);

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) {
        return;
      }

      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      const accessState = await getAccessState(currentUser);
      if (!mounted) {
        return;
      }

      if (!accessState.allowed) {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      setUser(currentUser);
      setIsAdmin(accessState.isAdmin);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const openView = (view) => {
    setCurrentView(view);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const goToProfile = (type, data) => {
    setSelectedItem(data);
    openView(type === 'student' ? 'student-profile' : 'restaurant-profile');
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <button
          className="burger-btn"
          type="button"
          aria-label={menuOpen ? 'Tanca el menú' : 'Obre el menú'}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className={`burger-line top ${menuOpen ? 'open' : ''}`}></span>
          <span className={`burger-line middle ${menuOpen ? 'open' : ''}`}></span>
          <span className={`burger-line bottom ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <button className="logo-container" type="button" onClick={() => openView('home')}>
          <img src="https://shoponline.unilabor.com/c/51-category_default/joviat.jpg" alt="Logotip de Joviat" className="logo-img" />
          <span className="logo-text">Hostaleria Joviat</span>
        </button>

        {user && <div className={`user-indicator ${isAdmin ? 'admin-badge' : ''}`}>{isAdmin ? 'ADMIN' : user.email}</div>}
      </header>

      <button
        type="button"
        className={`sidebar-overlay ${menuOpen ? 'open' : ''}`}
        aria-label="Tanca el menú lateral"
        onClick={() => setMenuOpen(false)}
      ></button>

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          <li onClick={() => openView('home')}><IconHome /> <span>Inici</span></li>
          <li onClick={() => openView('students')}><IconUsers /> <span>Alumnes</span></li>
          <li onClick={() => openView('restaurants')}><IconRest /> <span>Restaurants</span></li>

          <div className="sidebar-divider"></div>

          {!user ? (
            <li className="login-link" onClick={() => openView('login')}>Accés privat</li>
          ) : (
            <>
              <li
                className="logout-link"
                onClick={async () => {
                  await signOut(auth);
                  openView('home');
                }}
              >
                Tancar sessió
              </li>

              {isAdmin && (
                <div className="admin-menu">
                  <p className="sidebar-label">Gestió</p>
                  <li onClick={() => openView('add-student')}><IconPlus /> <span>Nou alumne</span></li>
                  <li onClick={() => openView('add-restaurant')}><IconPlus /> <span>Nou restaurant</span></li>
                  <li onClick={() => openView('manage-altas')}><IconPlus /> <span>Altes</span></li>
                </div>
              )}
            </>
          )}
        </ul>
      </nav>

      <main className={`main-content ${menuOpen ? 'shifted' : ''}`}>
        {currentView === 'home' && (
          <div className="home-hero">
            <p className="hero-kicker">Escola Joviat de Manresa</p>
            <h1 className="joviat-title">Xarxa Alumni d&apos;Hostaleria</h1>
            <div className="underline"></div>
            <p className="joviat-subtitle">
              Una plataforma per connectar alumnat, exalumnat i restaurants vinculats al projecte de l&apos;escola.
            </p>
          </div>
        )}

        {currentView === 'login' && <Login onLoginSuccess={() => openView('home')} onGoToRegister={() => openView('register')} />}
        {currentView === 'register' && <Register onBack={() => openView('login')} onRequestSubmitted={() => openView('home')} />}

        {currentView === 'students' && <StudentList onSelect={(student) => goToProfile('student', student)} />}
        {currentView === 'restaurants' && <RestaurantList onSelect={(restaurant) => goToProfile('restaurant', restaurant)} />}

        {currentView === 'student-profile' && selectedItem && (
          <AlumniProfile
            alumni={selectedItem}
            isAdmin={isAdmin}
            onBack={() => openView('students')}
            onNavigateRest={(restaurant) => goToProfile('restaurant', restaurant)}
          />
        )}

        {currentView === 'restaurant-profile' && selectedItem && (
          <RestaurantProfile
            restaurant={selectedItem}
            isAdmin={isAdmin}
            onBack={() => openView('restaurants')}
            onNavigateAlumni={(student) => goToProfile('student', student)}
          />
        )}

        {currentView === 'add-student' && <AddStudent onBack={() => openView('home')} />}
        {currentView === 'add-restaurant' && <AddRestaurant onBack={() => openView('home')} />}
        {currentView === 'manage-altas' && <ManageAltas onBack={() => openView('home')} />}
      </main>
    </div>
  );
}

export default App;
