import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

const Register = ({ onBack }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await addDoc(collection(db, "Users"), {
        uid: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        status: 'pendent', // Així ManageAltas el trobarà
        date: new Date()
      });
      alert("Sol·licitud enviada! Un administrador l'haurà d'aprovar.");
      onBack();
    } catch (error) {
      alert("Error en el registre: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="joviat-title">Demanar Alta</h2>
        <p style={{textAlign: 'center', marginBottom: '20px', color: '#666'}}>Registra't per formar part de la xarxa Alumni.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Nom Complet</label>
            <input type="text" required onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Contrasenya</label>
            <input type="password" required onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" className="btn-joviat" disabled={loading}>
            {loading ? 'Enviant...' : 'Sol·licitar Accés'}
          </button>
          <button type="button" className="btn-secondary" onClick={onBack} style={{marginTop: '10px', width: '100%'}}>Tornar al Login</button>
        </form>
      </div>
    </div>
  );
};

export default Register;