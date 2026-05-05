import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { useI18n } from './i18n';

const RestaurantRequestForm = ({ user, userRecord, onBack }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'RestaurantRequests'), {
        restaurantName: formData.restaurantName.trim(),
        address: formData.address.trim(),
        message: formData.message.trim(),
        status: 'pending',
        requestedAt: new Date(),
        requestedByUid: user?.uid || '',
        requestedByEmail: user?.email || '',
        requestedByName: userRecord?.name || user?.email || ''
      });

      setFormData({ restaurantName: '', address: '', message: '' });
      window.alert(t('requestSentSuccess'));
      onBack();
    } catch (error) {
      console.error(error);
      window.alert(t('requestSentError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-section-wrapper">
      <p className="admin-label-top">{t('requestRestaurantMenu')}</p>
      <h1 className="admin-main-title">{t('restaurantRequestTitle')}</h1>
      <p className="admin-description">{t('restaurantRequestDescription')}</p>

      <div className="admin-card">
        <div className="form-grid">
          <div className="input-group full-width">
            <label>{t('requestRestaurantName')}</label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(event) => handleChange('restaurantName', event.target.value)}
              required
            />
          </div>

          <div className="input-group full-width">
            <label>{t('requestRestaurantAddress')}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(event) => handleChange('address', event.target.value)}
            />
          </div>

          <div className="input-group full-width">
            <label>{t('requestMessage')}</label>
            <textarea
              className="profile-textarea"
              value={formData.message}
              onChange={(event) => handleChange('message', event.target.value)}
              placeholder={t('requestMessagePlaceholder')}
              rows={6}
              required
            />
          </div>
        </div>
      </div>

      <div className="form-submit-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          {t('backHome')}
        </button>
        <button type="submit" className="btn-joviat" disabled={loading}>
          {loading ? t('sending') : t('sendRequest')}
        </button>
      </div>
    </form>
  );
};

export default RestaurantRequestForm;
