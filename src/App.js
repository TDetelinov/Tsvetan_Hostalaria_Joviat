import React, { useState, useEffect } from 'react';
import StudentList from './StudentList';
import RestaurantList from './RestaurantList';
import Login from './Login';
import Register from './Register';
import AddStudent from './AddStudent';
import AddRestaurant from './AddRestaurant';
import AlumniProfile from './AlumniProfile';
import RestaurantProfile from './RestaurantProfile';
import ManageAltas from './ManageAltas';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './App.css';

// --- ICONES ---
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconRest = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Verifiquem si és admin a la col·lecció Administrator
        const q = query(collection(db, "Administrator"), where("Email", "==", currentUser.email));
        const snap = await getDocs(q);
        setIsAdmin(!snap.empty);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const goToProfile = (type, data) => {
    setSelectedItem(data);
    setCurrentView(type === 'student' ? 'student-profile' : 'restaurant-profile');
    setMenuOpen(false);
    window.scrollTo(0, 0);
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
        {user && <div className="user-indicator">{isAdmin ? "ADMIN" : user.email}</div>}
      </header>

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          <li onClick={() => {setCurrentView('home'); setMenuOpen(false);}}><IconHome /> <span>Inici</span></li>
          <li onClick={() => {setCurrentView('students'); setMenuOpen(false);}}><IconUsers /> <span>Alumnes</span></li>
          <li onClick={() => {setCurrentView('restaurants'); setMenuOpen(false);}}><IconRest /> <span>Restaurants</span></li>
          
          <div className="sidebar-divider"></div>
          
          {!user ? (
            <li className="login-link" onClick={() => {setCurrentView('login'); setMenuOpen(false);}}>Accés Privat</li>
          ) : (
            <>
              <li className="logout-link" onClick={() => {signOut(auth); setCurrentView('home');}}>Tancar Sessió</li>
              {isAdmin && (
                <div className="admin-menu">
                  <p className="sidebar-label">GESTIÓ</p>
                  <li onClick={() => {setCurrentView('add-student'); setMenuOpen(false);}}><IconPlus /> <span>Nou Alumne</span></li>
                  <li onClick={() => {setCurrentView('add-restaurant'); setMenuOpen(false);}}><IconPlus /> <span>Nou Restaurant</span></li>
                  <li onClick={() => {setCurrentView('manage-altas'); setMenuOpen(false);}}><IconPlus /> <span>Altes</span></li>
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

        {currentView === 'login' && <Login onLoginSuccess={() => setCurrentView('home')} onGoToRegister={() => setCurrentView('register')} />}
        {currentView === 'register' && <Register onBack={() => setCurrentView('login')} />}
        
        {currentView === 'students' && <StudentList onSelect={(s) => goToProfile('student', s)} />}
        {currentView === 'restaurants' && <RestaurantList onSelect={(r) => goToProfile('restaurant', r)} />}

        {currentView === 'student-profile' && (
          <AlumniProfile 
            alumni={selectedItem} 
            isAdmin={isAdmin}
            onBack={() => setCurrentView('students')} 
            onNavigateRest={(r) => goToProfile('restaurant', r)} 
          />
        )}

        {currentView === 'restaurant-profile' && (
          <RestaurantProfile 
            restaurant={selectedItem} 
            isAdmin={isAdmin}
            onBack={() => setCurrentView('restaurants')} 
            onNavigateAlumni={(s) => goToProfile('student', s)} 
          />
        )}

        {currentView === 'add-student' && <AddStudent onBack={() => setCurrentView('home')} />}
        {currentView === 'add-restaurant' && <AddRestaurant onBack={() => setCurrentView('home')} />}
        {currentView === 'manage-altas' && <ManageAltas onBack={() => setCurrentView('home')} />}
      </main>
    </div>
  );
}

export default App;