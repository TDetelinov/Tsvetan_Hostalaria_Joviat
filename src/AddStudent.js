import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const AddStudent = ({ onBack }) => {
  // --- ESTATS DE L'ALUMNE ---
  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Alumne');
  const [email, setEmail] = useState('');
  const [linkedIn, setLinkedIn] = useState('');

  // --- ESTATS PER VINCULAR RESTAURANT ---
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [role, setRole] = useState('');
  const [isCurrentJob, setIsCurrentJob] = useState(true);

  // --- FEEDBACK ---
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Carregar restaurants de la base de dades al principi
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Restaurant"));
        const rests = querySnapshot.docs.map(doc => ({
          id: doc.id,
          Name: doc.data().Name
        }));
        setRestaurantsList(rests);
      } catch (error) {
        console.error("Error carregant restaurants:", error);
      }
    };
    fetchRestaurants();
  }, []);

  const handlePujarFoto = () => {
    const url = prompt("Enganxa la URL de la imatge de l'alumne:");
    if (url) setPhotoURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!name || !email) {
      setMessage({ type: 'error', text: 'Nom i Email són obligatoris.' });
      setLoading(false);
      return;
    }

    try {
      // 1. Guardem l'alumne a la col·lecció "Alumni"
      const studentRef = await addDoc(collection(db, "Alumni"), {
        Name: name,
        PhotoURL: photoURL,
        Phone: phone,
        Status: status,
        Email: email,
        LinkedIn: linkedIn
      });

      // 2. Si s'ha seleccionat un restaurant, creem el vincle a "Rest_Alum"
      if (selectedRestaurantId) {
        await addDoc(collection(db, "Rest_Alum"), {
          id_alumni: studentRef.id,
          id_restaurant: selectedRestaurantId,
          rol: role,
          current_job: isCurrentJob
        });
      }

      setMessage({ type: 'success', text: 'Alumne i vinculació creats correctament!' });
      
      // Neteja de formulari
      setName(''); setPhotoURL(''); setPhone(''); setEmail(''); 
      setLinkedIn(''); setSelectedRestaurantId(''); setRole('');
      
    } catch (e) {
      console.error("Error en el procés: ", e);
      setMessage({ type: 'error', text: 'Error en desar les dades.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-section-wrapper">
      <p className="admin-label-top">ADMINISTRACIÓ</p>
      <h1 className="admin-main-title">Afegir Alumne</h1>
      <p className="admin-description">
        Crea la fitxa de l'alumne i vincula'l a un restaurant de la base de dades.
      </p>

      {message.text && (
        <div className={`alert-message ${message.type}`} style={{
          padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center',
          backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
          color: message.type === 'success' ? '#2e7d32' : '#c62828', fontWeight: '600'
        }}>
          {message.text}
        </div>
      )}

      <div className="top-cards-grid">
        {/* TARGETA ESQUERRA: FOTO I ESTAT */}
        <div className="admin-card">
          <div className="photo-upload-container">
            <div className={`photo-circle ${photoURL ? 'has-photo' : ''}`} onClick={handlePujarFoto}>
              {photoURL ? <img src={photoURL} alt="Preview" className="photo-img" /> : <span className="plus-icon">+</span>}
            </div>
            <p className="pujar-foto-label">Foto Perfil</p>
          </div>

          <div className="input-group">
            <label>Estat</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Alumne">Alumne</option>
              <option value="Exalumne">Exalumne</option>
            </select>
          </div>
        </div>

        {/* TARGETA DRETA: DADES PERSONALS */}
        <div className="admin-card">
          <h3>Informació Primària</h3>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Nom Complet</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom i cognoms" required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correu@joviat.cat" required />
            </div>
            <div className="input-group">
              <label>Telèfon</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600000000" />
            </div>
            <div className="input-group full-width">
              <label>LinkedIn</label>
              <input type="url" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        </div>
      </div>

      {/* TARGETA INFERIOR: VINCULACIÓ AMB RESTAURANT EXISTENT */}
      <div className="admin-card" style={{ marginTop: '20px' }}>
        <p className="admin-label-top">TRAJECTÒRIA PROFESSIONAL</p>
        <h3 style={{ marginTop: '5px' }}>Vincular a Restaurant</h3>
        
        <div className="form-grid">
          <div className="input-group full-width">
            <label>Selecciona un restaurant de la llista</label>
            <select 
              value={selectedRestaurantId} 
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
            >
              <option value="">-- No vincular a cap restaurant --</option>
              {restaurantsList.map(res => (
                <option key={res.id} value={res.id}>{res.Name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Rol / Càrrec</label>
            <input 
              type="text" 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              placeholder="Ex: Cap de Cuina, Sommelier..." 
              disabled={!selectedRestaurantId}
            />
          </div>

          <div className="input-check-group" style={{ alignSelf: 'center', marginBottom: '20px' }}>
            <input 
              type="checkbox" 
              id="currJob" 
              checked={isCurrentJob} 
              onChange={(e) => setIsCurrentJob(e.target.checked)}
              disabled={!selectedRestaurantId}
            />
            <label htmlFor="currJob">És la seva feina actual</label>
          </div>
        </div>
      </div>

      <div className="form-submit-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>Cancel·lar</button>
        <button type="submit" className="btn-joviat btn-submit" disabled={loading}>
          {loading ? 'DESANT...' : 'Guardar Alumne'}
        </button>
      </div>
    </form>
  );
};

export default AddStudent;