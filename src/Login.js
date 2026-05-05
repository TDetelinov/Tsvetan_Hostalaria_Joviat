import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getAccessState } from './accessControl';
import { auth } from './firebase';
import { useI18n } from './i18n';

const Login = ({ onLoginSuccess, onGoToRegister }) => {
  const { t } = useI18n();
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
        setError(accessState.status === 'pendent' ? t('pendingApproval') : t('noAccessYet'));
        return;
      }

      onLoginSuccess();
    } catch (err) {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="section-header">
          <p className="section-kicker">{t('loginKicker')}</p>
          <h2>{t('loginTitle')}</h2>
          <div className="underline"></div>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>{t('emailLabel')}</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          <div className="input-group">
            <label>{t('passwordLabel')}</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-joviat full-button" disabled={loading}>
            {loading ? t('loggingIn') : t('loginButton')}
          </button>

          <div className="register-prompt">
            <p>{t('noAccount')}</p>
            <button type="button" onClick={onGoToRegister} className="btn-link">
              {t('requestUserAccess')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
