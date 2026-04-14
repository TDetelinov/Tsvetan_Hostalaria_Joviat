import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getAccessState } from './accessControl';

const Login = ({ onLoginSuccess, onGoToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = await signInWithEmailAndPassword(auth, email.trim(), password);
      const accessState = await getAccessState(credentials.user);

      if (!accessState.allowed) {
        await signOut(auth);
        setError(
          accessState.status === 'pendent'
            ? 'La teva sollicitud encara esta pendent d aprovacio.'
            : 'Aquest compte encara no te permis per entrar.'
        );
        return;
      }

      onLoginSuccess();
    } catch (err) {
      setError('Correu o contrasenya incorrectes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="section-header">
          <p className="section-kicker">Zona privada</p>
          <h2>Acces Privat</h2>
          <div className="underline"></div>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Correu electronic</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          <div className="input-group">
            <label>Contrasenya</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-joviat full-button" disabled={loading}>
            {loading ? 'Entrant...' : 'Entrar'}
          </button>

          <div className="register-prompt">
            <p>No tens compte?</p>
            <button type="button" onClick={onGoToRegister} className="btn-link">
              Sollicitar alta d usuari
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
