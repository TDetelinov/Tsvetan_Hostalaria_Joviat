import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = ({ onLoginSuccess, onGoToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err) {
      setError('Correu o contrasenya incorrectes.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="section-header">
          <h2>Accés Privat</h2>
          <div className="underline"></div>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Correu Electrònic</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Contrasenya</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="error-message">⚠️ {error}</p>}

          <button type="submit" className="btn-joviat" style={{width: '100%', marginTop: '20px'}}>
            Entrar
          </button>
          
          <div className="register-prompt" style={{marginTop: '25px', textAlign: 'center', fontSize: '0.85rem'}}>
            <p>No tens compte?</p>
            <button type="button" onClick={onGoToRegister} className="btn-link">
              Sol·licitar alta d'usuari
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;