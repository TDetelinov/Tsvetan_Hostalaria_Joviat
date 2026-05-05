import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { useI18n } from './i18n';

const UserProfile = ({ userRecord, onBack, onProfileUpdated }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedIn: '',
    photoURL: '',
    about: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: userRecord?.name || '',
      email: userRecord?.email || '',
      phone: userRecord?.phone || '',
      linkedIn: userRecord?.linkedIn || '',
      photoURL: userRecord?.photoURL || '',
      about: userRecord?.about || ''
    });
  }, [userRecord]);

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userRecord?.id) {
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      linkedIn: formData.linkedIn.trim(),
      photoURL: formData.photoURL.trim(),
      about: formData.about.trim()
    };

    try {
      await updateDoc(doc(db, 'Users', userRecord.id), payload);

      const alumniQuery = query(collection(db, 'Alumni'), where('Email', '==', formData.email.trim()));
      const alumniSnapshot = await getDocs(alumniQuery);

      await Promise.all(
        alumniSnapshot.docs.map((alumniDoc) =>
          updateDoc(doc(db, 'Alumni', alumniDoc.id), {
            Name: formData.name.trim(),
            Phone: formData.phone.trim(),
            LinkedIn: formData.linkedIn.trim(),
            PhotoURL: formData.photoURL.trim()
          })
        )
      );

      onProfileUpdated?.({ ...userRecord, ...payload });
      window.alert(t('profileSaved'));
    } catch (error) {
      console.error(error);
      window.alert(t('profileSaveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-section-wrapper">
      <p className="admin-label-top">{t('navMyProfile')}</p>
      <h1 className="admin-main-title">{t('myProfileTitle')}</h1>
      <p className="admin-description">{t('myProfileDescription')}</p>

      <div className="admin-card">
        <p className="form-note">{t('myProfilePublicHint')}</p>

        <div className="form-grid">
          <div className="input-group full-width">
            <label>{t('displayNameLabel')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => handleChange('name', event.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>{t('emailLabel')}</label>
            <input type="email" value={formData.email} readOnly disabled />
          </div>

          <div className="input-group">
            <label>{t('phoneLabel')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(event) => handleChange('phone', event.target.value)}
            />
          </div>

          <div className="input-group full-width">
            <label>{t('linkedinLabel')}</label>
            <input
              type="url"
              value={formData.linkedIn}
              onChange={(event) => handleChange('linkedIn', event.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className="input-group full-width">
            <label>{t('photoLabel')}</label>
            <input
              type="url"
              value={formData.photoURL}
              onChange={(event) => handleChange('photoURL', event.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="input-group full-width">
            <label>{t('aboutLabel')}</label>
            <textarea
              className="profile-textarea"
              value={formData.about}
              onChange={(event) => handleChange('about', event.target.value)}
              rows={5}
            />
          </div>
        </div>
      </div>

      <div className="form-submit-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          {t('backHome')}
        </button>
        <button type="submit" className="btn-joviat" disabled={loading}>
          {loading ? t('saving') : t('saveProfile')}
        </button>
      </div>
    </form>
  );
};

export default UserProfile;
