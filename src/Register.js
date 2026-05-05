import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useI18n } from './i18n';

const Register = ({ onBack, onRequestSubmitted }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      await addDoc(collection(db, 'Users'), {
        uid: userCredential.user.uid,
        name: formData.name.trim(),
        email: formData.email.trim(),
        status: 'pendent',
        date: new Date()
      });

      await signOut(auth);
      window.alert(t('requestSent'));
      onRequestSubmitted();
    } catch (submissionError) {
      setError(`Error: ${submissionError.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="section-header">
          <p className="section-kicker">{t('registerKicker')}</p>
          <h2>{t('registerTitle')}</h2>
          <div className="underline"></div>
        </div>

        <p className="form-note">{t('registerDescription')}</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>{t('fullNameLabel')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => handleChange('name', event.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>{t('emailLabel')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => handleChange('email', event.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>{t('passwordLabel')}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(event) => handleChange('password', event.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-joviat full-button" disabled={loading}>
            {loading ? t('sending') : t('requestAccessButton')}
          </button>
          <button type="button" className="btn-secondary full-button" onClick={onBack}>
            {t('backToLogin')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
