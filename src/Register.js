import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';

const Register = ({ onBack, onRequestSubmitted }) => {
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
      window.alert('Sol·licitud enviada. Quan l’administració la revisi ja podràs iniciar sessió.');
      onRequestSubmitted();
    } catch (submissionError) {
      setError(`Error en el registre: ${submissionError.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="section-header">
          <p className="section-kicker">Nova sol·licitud</p>
          <h2>Demanar alta</h2>
          <div className="underline"></div>
        </div>

        <p className="form-note">Omple les dades i l’equip administrador revisarà la petició abans de donar-te accés.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Nom complet</label>
            <input type="text" value={formData.name} onChange={(event) => handleChange('name', event.target.value)} required />
          </div>

          <div className="input-group">
            <label>Correu electrònic</label>
            <input type="email" value={formData.email} onChange={(event) => handleChange('email', event.target.value)} required />
          </div>

          <div className="input-group">
            <label>Contrasenya</label>
            <input type="password" value={formData.password} onChange={(event) => handleChange('password', event.target.value)} required minLength={6} />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-joviat full-button" disabled={loading}>
            {loading ? 'Enviant...' : 'Sol·licitar accés'}
          </button>
          <button type="button" className="btn-secondary full-button" onClick={onBack}>
            Tornar al login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
