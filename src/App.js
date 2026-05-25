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
import UserProfile from './UserProfile';
import RestaurantRequestForm from './RestaurantRequestForm';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getAccessState } from './accessControl';
import { useI18n } from './i18n';
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

const IconProfile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMessage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

function App() {
  const { language, languages, setLanguage, t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [, setNavigationHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [userRecord, setUserRecord] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewStates, setViewStates] = useState({
    students: { searchTerm: '', currentPage: 1 },
    restaurants: { searchTerm: '', currentPage: 1, viewMode: 'map' }
  });

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) {
        return;
      }

      if (!currentUser) {
        setUser(null);
        setUserRecord(null);
        setIsAdmin(false);
        return;
      }

      const accessState = await getAccessState(currentUser);
      if (!mounted) {
        return;
      }

      if (!accessState.allowed) {
        setUser(null);
        setUserRecord(null);
        setIsAdmin(false);
        return;
      }

      setUser(currentUser);
      setUserRecord(accessState.userRecord || null);
      setIsAdmin(accessState.isAdmin);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const openView = (view, options = {}) => {
    const { pushHistory = true, item = null } = options;

    if (pushHistory && (currentView !== view || item !== selectedItem)) {
      setNavigationHistory((history) => [...history, { view: currentView, selectedItem }]);
    }

    setCurrentView(view);
    setSelectedItem(item);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const goBack = (fallback = 'home') => {
    setNavigationHistory((history) => {
      const previousEntry = history[history.length - 1];

      if (previousEntry) {
        setCurrentView(previousEntry.view);
        setSelectedItem(previousEntry.selectedItem || null);
      } else {
        setCurrentView(fallback);
        setSelectedItem(null);
      }

      return history.slice(0, -1);
    });

    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const goToProfile = (type, data) => {
    openView(type === 'student' ? 'student-profile' : 'restaurant-profile', { item: data });
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <button
          className="burger-btn"
          type="button"
          aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className={`burger-line top ${menuOpen ? 'open' : ''}`}></span>
          <span className={`burger-line middle ${menuOpen ? 'open' : ''}`}></span>
          <span className={`burger-line bottom ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <button className="logo-container" type="button" onClick={() => openView('home')}>
          <img src="https://shoponline.unilabor.com/c/51-category_default/joviat.jpg" alt="Joviat logo" className="logo-img" />
          <span className="logo-text">Hostaleria Joviat</span>
        </button>

        <div className="header-actions">
          <label className="language-switcher">
            <span>{t('languageLabel')}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {Object.entries(languages).map(([code, values]) => (
                <option key={code} value={code}>
                  {values.languageName}
                </option>
              ))}
            </select>
          </label>

          {user && (
            <div className={`user-indicator ${isAdmin ? 'admin-badge' : ''}`}>
              {!isAdmin && userRecord?.photoURL && (
                <img src={userRecord.photoURL} alt={userRecord.name || user.email} className="user-avatar" />
              )}
              <span>{isAdmin ? user.email : (userRecord?.name || user.email)}</span>
            </div>
          )}
        </div>
      </header>

      <button
        type="button"
        className={`sidebar-overlay ${menuOpen ? 'open' : ''}`}
        aria-label={t('closeSidebar')}
        onClick={() => setMenuOpen(false)}
      ></button>

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          <li onClick={() => openView('home')}><IconHome /> <span>{t('navHome')}</span></li>
          <li onClick={() => openView('students')}><IconUsers /> <span>{t('navStudents')}</span></li>
          <li onClick={() => openView('restaurants')}><IconRest /> <span>{t('navRestaurants')}</span></li>

          <div className="sidebar-divider"></div>

          {!user ? (
            <li className="login-link" onClick={() => openView('login')}>{t('navPrivateAccess')}</li>
          ) : (
            <>
              <li onClick={() => openView('my-profile')}><IconProfile /> <span>{t('navMyProfile')}</span></li>
              <li onClick={() => openView('restaurant-request')}><IconMessage /> <span>{t('navRestaurantRequest')}</span></li>
              <li
                className="logout-link"
                onClick={async () => {
                  if (!window.confirm(t('logoutConfirm'))) {
                    return;
                  }
                  await signOut(auth);
                  openView('home');
                }}
              >
                {t('navLogout')}
              </li>

              {isAdmin && (
                <div className="admin-menu">
                  <p className="sidebar-label">{t('navManagement')}</p>
                  <li onClick={() => openView('add-student')}><IconPlus /> <span>{t('navNewStudent')}</span></li>
                  <li onClick={() => openView('add-restaurant')}><IconPlus /> <span>{t('navNewRestaurant')}</span></li>
                  <li onClick={() => openView('manage-altas')}><IconPlus /> <span>{t('navRegistrations')}</span></li>
                </div>
              )}
            </>
          )}
        </ul>
      </nav>

      <main className={`main-content ${menuOpen ? 'shifted' : ''}`}>
        {currentView === 'home' && (
          <div className="home-hero">
            <p className="hero-kicker">{t('heroKicker')}</p>
            <h1 className="joviat-title">{t('appTitle')}</h1>
            <div className="underline"></div>
            <p className="joviat-subtitle">{t('appSubtitle')}</p>
            <div className="hero-actions">
              <button type="button" className="btn-joviat" onClick={() => openView('students')}>
                {t('heroStudentsButton')}
              </button>
              <button type="button" className="btn-secondary hero-secondary" onClick={() => openView('restaurants')}>
                {t('heroRestaurantsButton')}
              </button>
            </div>
          </div>
        )}

        {currentView === 'login' && <Login onLoginSuccess={() => openView('home')} onGoToRegister={() => openView('register')} />}
        {currentView === 'register' && <Register onBack={() => goBack('login')} onRequestSubmitted={() => openView('home', { pushHistory: false })} />}
        {currentView === 'my-profile' && userRecord && (
          <UserProfile
            userRecord={userRecord}
            onBack={() => goBack('home')}
            onProfileUpdated={(updatedRecord) => setUserRecord(updatedRecord)}
          />
        )}
        {currentView === 'restaurant-request' && user && (
          <RestaurantRequestForm user={user} userRecord={userRecord} onBack={() => goBack('home')} />
        )}

        {currentView === 'students' && (
          <StudentList
            onSelect={(student) => goToProfile('student', student)}
            state={viewStates.students}
            onStateChange={(nextState) => setViewStates((current) => ({ ...current, students: nextState }))}
          />
        )}
        {currentView === 'restaurants' && (
          <RestaurantList
            onSelect={(restaurant) => goToProfile('restaurant', restaurant)}
            state={viewStates.restaurants}
            onStateChange={(nextState) => setViewStates((current) => ({ ...current, restaurants: nextState }))}
          />
        )}

        {currentView === 'student-profile' && selectedItem && (
          <AlumniProfile
            alumni={selectedItem}
            isLoggedIn={!!user}
            isAdmin={isAdmin}
            onBack={() => goBack('students')}
            onNavigateRest={(restaurant) => goToProfile('restaurant', restaurant)}
          />
        )}

        {currentView === 'restaurant-profile' && selectedItem && (
          <RestaurantProfile
            restaurant={selectedItem}
            isAdmin={isAdmin}
            onBack={() => goBack('restaurants')}
            onNavigateAlumni={(student) => goToProfile('student', student)}
          />
        )}

        {currentView === 'add-student' && <AddStudent onBack={() => goBack('home')} />}
        {currentView === 'add-restaurant' && <AddRestaurant onBack={() => goBack('home')} />}
        {currentView === 'manage-altas' && <ManageAltas onBack={() => goBack('home')} />}
      </main>
    </div>
  );
}

export default App;
