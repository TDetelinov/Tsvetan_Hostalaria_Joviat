import React, { useEffect, useState } from 'react';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useI18n } from './i18n';

const createEmptyExperience = () => ({
  restaurantId: '',
  role: '',
  isCurrentJob: false
});

const STATUS_STUDENT = 'student';
const STATUS_ALUMNI = 'alumni';

const AddStudent = ({ onBack }) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(STATUS_STUDENT);
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
        setRestaurantsList(
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            Name: doc.data().Name
          }))
        );
      } catch (error) {
        console.error('Error loading restaurants:', error);
      }
    };

    fetchRestaurants();
  }, []);

  const handlePujarFoto = () => {
    const url = window.prompt('URL');
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
      setMessage({ type: 'error', text: t('requiredNameEmail') });
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

      setMessage({ type: 'success', text: t('studentSaved') });
      setName('');
      setPhotoURL('');
      setPhone('');
      setStatus(STATUS_STUDENT);
      setEmail('');
      setLinkedIn('');
      setExperiences([createEmptyExperience()]);
    } catch (error) {
      console.error('Error saving student:', error);
      setMessage({ type: 'error', text: t('studentSaveError') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-section-wrapper">
      <p className="admin-label-top">{t('adminLabel')}</p>
      <h1 className="admin-main-title">{t('addStudentTitle')}</h1>
      <p className="admin-description">{t('addStudentDescription')}</p>

      {message.text && (
        <div className={`alert-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="top-cards-grid">
        <div className="admin-card">
          <div className="photo-upload-container">
            <button type="button" className={`photo-circle ${photoURL ? 'has-photo' : ''}`} onClick={handlePujarFoto}>
              {photoURL ? <img src={photoURL} alt={t('photoProfile')} className="photo-img" /> : <span className="plus-icon">+</span>}
            </button>
            <p className="pujar-foto-label">{t('photoProfile')}</p>
          </div>

          <div className="input-group">
            <label>{t('statusLabel')}</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value={STATUS_STUDENT}>{t('statusStudent')}</option>
              <option value={STATUS_ALUMNI}>{t('statusAlumni')}</option>
            </select>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">{t('mainInformation')}</h3>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>{t('fullNameLabel')}</label>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>

            <div className="input-group">
              <label>{t('emailLabel')}</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>

            <div className="input-group">
              <label>{t('phoneLabel')}</label>
              <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>

            <div className="input-group full-width">
              <label>{t('linkedinLabel')}</label>
              <input type="url" value={linkedIn} onChange={(event) => setLinkedIn(event.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card trajectoria-card">
        <div className="trajectoria-header">
          <div>
            <p className="admin-label-top">{t('professionalJourney')}</p>
            <h3 className="admin-card-title">{t('linkedRestaurants')}</h3>
          </div>
          <button type="button" className="btn-secondary" onClick={addExperience}>
            {t('addRestaurantButton')}
          </button>
        </div>

        <p className="form-note">{t('journeyDescription')}</p>

        <div className="experience-list">
          {experiences.map((experience, index) => (
            <div key={`experience-${index}`} className="experience-card">
              <div className="experience-header">
                <p className="experience-title">{t('experienceTitle', { index: index + 1 })}</p>
                <button type="button" className="btn-link" onClick={() => removeExperience(index)}>
                  {t('delete')}
                </button>
              </div>

              <div className="form-grid">
                <div className="input-group full-width">
                  <label>{t('restaurantLabel')}</label>
                  <select
                    value={experience.restaurantId}
                    onChange={(event) => updateExperience(index, 'restaurantId', event.target.value)}
                  >
                    <option value="">{t('selectRestaurant')}</option>
                    {restaurantsList.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>{t('roleLabel')}</label>
                  <input
                    type="text"
                    value={experience.role}
                    onChange={(event) => updateExperience(index, 'role', event.target.value)}
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
                  <label htmlFor={`current-job-${index}`}>{t('currentJobLabel')}</label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-submit-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          {t('cancel')}
        </button>
        <button type="submit" className="btn-joviat btn-submit" disabled={loading}>
          {loading ? t('saving') : t('saveStudent')}
        </button>
      </div>
    </form>
  );
};

export default AddStudent;
