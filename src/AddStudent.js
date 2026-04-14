import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { addDoc, collection, getDocs } from 'firebase/firestore';

const createEmptyExperience = () => ({
  restaurantId: '',
  role: '',
  isCurrentJob: false
});

const AddStudent = ({ onBack }) => {
  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Alumne');
  const [email, setEmail] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [experiences, setExperiences] = useState([createEmptyExperience()]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Restaurant'));
        const restaurants = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          Name: doc.data().Name
        }));

        setRestaurantsList(restaurants);
      } catch (error) {
        console.error('Error en carregar els restaurants:', error);
      }
    };

    fetchRestaurants();
  }, []);

  const handlePujarFoto = () => {
    const url = window.prompt("Enganxa l'URL de la imatge de l'alumne:");
    if (url) {
      setPhotoURL(url);
    }
  };

  const updateExperience = (index, field, value) => {
    setExperiences((current) =>
      current.map((experience, currentIndex) =>
        currentIndex === index ? { ...experience, [field]: value } : experience
      )
    );
  };

  const addExperience = () => {
    setExperiences((current) => [...current, createEmptyExperience()]);
  };

  const removeExperience = (index) => {
    setExperiences((current) => {
      if (current.length === 1) {
        return [createEmptyExperience()];
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!name.trim() || !email.trim()) {
      setMessage({ type: 'error', text: 'El nom i l’adreça electrònica són obligatoris.' });
      setLoading(false);
      return;
    }

    try {
      const studentRef = await addDoc(collection(db, 'Alumni'), {
        Name: name.trim(),
        PhotoURL: photoURL.trim(),
        Phone: phone.trim(),
        Status: status,
        Email: email.trim(),
        LinkedIn: linkedIn.trim()
      });

      const selectedExperiences = experiences.filter((experience) => experience.restaurantId);

      await Promise.all(
        selectedExperiences.map((experience) =>
          addDoc(collection(db, 'Rest_Alum'), {
            id_alumni: studentRef.id,
            id_restaurant: experience.restaurantId,
            rol: experience.role.trim(),
            current_job: experience.isCurrentJob
          })
        )
      );

      setMessage({ type: 'success', text: 'L’alumne i la seva trajectòria s’han desat correctament.' });
      setName('');
      setPhotoURL('');
      setPhone('');
      setStatus('Alumne');
      setEmail('');
      setLinkedIn('');
      setExperiences([createEmptyExperience()]);
    } catch (error) {
      console.error('Error en desar les dades:', error);
      setMessage({ type: 'error', text: 'No s’han pogut desar les dades de l’alumne.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-section-wrapper">
      <p className="admin-label-top">Administració</p>
      <h1 className="admin-main-title">Afegir alumne</h1>
      <p className="admin-description">
        Crea la fitxa de l’alumne i registra tots els restaurants on ha treballat o treballa actualment.
      </p>

      {message.text && (
        <div
          className={`alert-message ${message.type}`}
          style={{
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center',
            backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
            color: message.type === 'success' ? '#2e7d32' : '#c62828',
            fontWeight: '600'
          }}
        >
          {message.text}
        </div>
      )}

      <div className="top-cards-grid">
        <div className="admin-card">
          <div className="photo-upload-container">
            <button type="button" className={`photo-circle ${photoURL ? 'has-photo' : ''}`} onClick={handlePujarFoto}>
              {photoURL ? <img src={photoURL} alt="Previsualització de l’alumne" className="photo-img" /> : <span className="plus-icon">+</span>}
            </button>
            <p className="pujar-foto-label">Foto de perfil</p>
          </div>

          <div className="input-group">
            <label>Estat</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="Alumne">Alumne</option>
              <option value="Exalumne">Exalumne</option>
            </select>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">Informació principal</h3>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Nom complet</label>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom i cognoms" required />
            </div>

            <div className="input-group">
              <label>Correu electrònic</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correu@joviat.cat" required />
            </div>

            <div className="input-group">
              <label>Telèfon</label>
              <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="600 000 000" />
            </div>

            <div className="input-group full-width">
              <label>LinkedIn</label>
              <input type="url" value={linkedIn} onChange={(event) => setLinkedIn(event.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card trajectoria-card">
        <div className="trajectoria-header">
          <div>
            <p className="admin-label-top">Trajectòria professional</p>
            <h3 className="admin-card-title">Restaurants vinculats</h3>
          </div>
          <button type="button" className="btn-secondary" onClick={addExperience}>
            Afegir restaurant
          </button>
        </div>

        <p className="form-note">
          Pots indicar tants restaurants com calgui. Cada bloc representa una etapa professional diferent.
        </p>

        <div className="experience-list">
          {experiences.map((experience, index) => (
            <div key={`experience-${index}`} className="experience-card">
              <div className="experience-header">
                <p className="experience-title">Experiència {index + 1}</p>
                <button type="button" className="btn-link" onClick={() => removeExperience(index)}>
                  Eliminar
                </button>
              </div>

              <div className="form-grid">
                <div className="input-group full-width">
                  <label>Restaurant</label>
                  <select
                    value={experience.restaurantId}
                    onChange={(event) => updateExperience(index, 'restaurantId', event.target.value)}
                  >
                    <option value="">Selecciona un restaurant</option>
                    {restaurantsList.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Rol o càrrec</label>
                  <input
                    type="text"
                    value={experience.role}
                    onChange={(event) => updateExperience(index, 'role', event.target.value)}
                    placeholder="Ex.: cap de cuina, sommelier..."
                    disabled={!experience.restaurantId}
                  />
                </div>

                <div className="input-check-group experience-check">
                  <input
                    type="checkbox"
                    id={`current-job-${index}`}
                    checked={experience.isCurrentJob}
                    onChange={(event) => updateExperience(index, 'isCurrentJob', event.target.checked)}
                    disabled={!experience.restaurantId}
                  />
                  <label htmlFor={`current-job-${index}`}>És la seva feina actual</label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-submit-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Cancel·lar
        </button>
        <button type="submit" className="btn-joviat btn-submit" disabled={loading}>
          {loading ? 'Desant...' : 'Desar alumne'}
        </button>
      </div>
    </form>
  );
};

export default AddStudent;
