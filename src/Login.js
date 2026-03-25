import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Netegem errors anteriors

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Sessió iniciada correctament!");
      onLoginSuccess(); // Funció per tornar a la home o tancar el login
    } catch (err) {
      // Gestionem els errors clàssics de Firebase
      switch (err.code) {
        case 'auth/invalid-email':
          setError('El format del correu no és vàlid.');
          break;
        case 'auth/user-not-found':
          setError('Aquest usuari no està registrat.');
          break;
        case 'auth/wrong-password':
          setError('La contrasenya és incorrecta.');
          break;
        case 'auth/invalid-credential':
          setError('Correu o contrasenya incorrectes.');
          break;
        default:
          setError('S\'ha produït un error en iniciar sessió.');
      }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="section-header">
          <h2>Accés Usuaris</h2>
          <div className="underline"></div>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Correu Electrònic</label>
            <input 
              type="email" 
              placeholder="Ex: alumne@joviat.cat" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Contrasenya</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {error && <p className="error-message">⚠️ {error}</p>}

          <button type="submit" className="btn-joviat">Entrar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;