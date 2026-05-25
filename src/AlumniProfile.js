import React, { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { useI18n } from './i18n';

const AlumniProfile = ({ alumni, onBack, onNavigateRest, isAdmin, isLoggedIn }) => {
  const { t } = useI18n();
  const [workHistory, setWorkHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...alumni });
  const [deleting, setDeleting] = useState(false);

  const normalizeStatus = (status) => {
    const normalized = (status || '').toLowerCase();

    if (normalized === 'alumne' || normalized === 'alumno' || normalized === 'student') {
      return 'student';
    }

    if (normalized === 'exalumne' || normalized === 'exalumno' || normalized === 'alumni') {
      return 'alumni';
    }

    return 'student';
  };

  const translateStatus = (status) => {
    const normalized = normalizeStatus(status);
    return normalized === 'alumni' ? t('statusAlumni') : t('statusStudent');
  };

  useEffect(() => {
    setEditData({ ...alumni });
  }, [alumni]);

  useEffect(() => {
    const fetchWorkHistory = async () => {
      try {
        const historyQuery = query(collection(db, 'Rest_Alum'), where('id_alumni', '==', alumni.id));
        const historySnapshot = await getDocs(historyQuery);
        const historyData = await Promise.all(
          historySnapshot.docs.map(async (joinDoc) => {
            const joinData = joinDoc.data();
            const restaurantRef = doc(db, 'Restaurant', joinData.id_restaurant);
            const restaurantSnapshot = await getDoc(restaurantRef);

            return {
              id: joinDoc.id,
              id_restaurant: joinData.id_restaurant,
              current_job: joinData.current_job,
              rol: joinData.rol,
              restaurantData: restaurantSnapshot.exists() ? restaurantSnapshot.data() : null
            };
          })
        );

        setWorkHistory(historyData.filter((item) => item.restaurantData));
      } catch (error) {
        console.error("Error loading work history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkHistory();
  }, [alumni.id]);

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'Alumni', alumni.id), {
        Name: editData.Name,
        Email: editData.Email,
        Phone: editData.Phone,
        LinkedIn: editData.LinkedIn,
        Status: editData.Status
      });

      setIsEditing(false);
      window.alert(t('profileSaved'));
    } catch (error) {
      window.alert(t('profileSaveError'));
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t('deleteStudentConfirm'));

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const relationQuery = query(collection(db, 'Rest_Alum'), where('id_alumni', '==', alumni.id));
      const relationSnapshot = await getDocs(relationQuery);

      await Promise.all(relationSnapshot.docs.map((relationDoc) => deleteDoc(doc(db, 'Rest_Alum', relationDoc.id))));
      await deleteDoc(doc(db, 'Alumni', alumni.id));

      window.alert(t('deleteStudentSuccess'));
      onBack();
    } catch (error) {
      console.error(error);
      window.alert(t('deleteStudentError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-nav-header">
        <button className="back-button" type="button" onClick={onBack}>
          {t('profileBackList')}
        </button>

        {isAdmin && (
          <div className="profile-actions">
            {isEditing && (
              <button className="btn-danger" type="button" onClick={handleDelete} disabled={deleting}>
                {deleting ? t('deleting') : t('deleteStudent')}
              </button>
            )}

            <button className="btn-joviat" type="button" onClick={() => (isEditing ? handleUpdate() : setIsEditing(true))}>
              {isEditing ? t('saveChanges') : t('editRecord')}
            </button>
          </div>
        )}
      </div>

      <div className="profile-main-card">
        <div className="profile-header">
          <img
            src={alumni.PhotoURL || 'https://via.placeholder.com/280x280?text=Sense+Foto'}
            alt={alumni.Name}
            className="profile-avatar"
          />

          <div className="profile-info">
            {isEditing ? (
              <input className="edit-input-h2" value={editData.Name || ''} onChange={(event) => setEditData({ ...editData, Name: event.target.value })} />
            ) : (
              <h2>{editData.Name}</h2>
            )}

            <div className="status-container">
              {isEditing ? (
                <select value={normalizeStatus(editData.Status)} onChange={(event) => setEditData({ ...editData, Status: event.target.value })}>
                  <option value="student">{t('statusStudent')}</option>
                  <option value="alumni">{t('statusAlumni')}</option>
                </select>
              ) : (
                <span className="badge">{translateStatus(editData.Status)}</span>
              )}
            </div>

            {isLoggedIn ? (
              <div className="contact-grid">
                <div className="contact-item">
                  <label className="contact-label">{t('emailLabel')}</label>
                  {isEditing ? (
                    <input value={editData.Email || ''} onChange={(event) => setEditData({ ...editData, Email: event.target.value })} />
                  ) : (
                    <p className="contact-value">{editData.Email || t('notSpecified')}</p>
                  )}
                </div>

                <div className="contact-item">
                  <label className="contact-label">{t('phoneLabel')}</label>
                  {isEditing ? (
                    <input value={editData.Phone || ''} onChange={(event) => setEditData({ ...editData, Phone: event.target.value })} />
                  ) : (
                    <p className="contact-value">{editData.Phone || t('notSpecified')}</p>
                  )}
                </div>

                <div className="contact-item">
                  <label className="contact-label">{t('linkedinLabel')}</label>
                  {isEditing ? (
                    <input value={editData.LinkedIn || ''} onChange={(event) => setEditData({ ...editData, LinkedIn: event.target.value })} />
                  ) : (
                    <p className="contact-value">
                      {editData.LinkedIn ? (
                        <a href={editData.LinkedIn} target="_blank" rel="noreferrer">
                          {t('publicProfile')}
                        </a>
                      ) : (
                        t('notSpecified')
                      )}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="contact-hidden-notice">{t('loginToSeeContact')}</p>
            )}
          </div>
        </div>
      </div>

      <h3 className="section-subtitle">{t('studentJourneyTitle')}</h3>
      {loading ? (
        <p className="loader-inline">{t('loadingJourney')}</p>
      ) : (
        <div className="history-grid">
          {workHistory.map((work) => (
            <button
              key={work.id}
              type="button"
              className={`history-card ${work.current_job ? 'active-job' : ''}`}
              onClick={() => onNavigateRest({ id: work.id_restaurant, ...work.restaurantData })}
            >
              <h4>{work.restaurantData.Name}</h4>
              <p className="role-text">{work.rol || t('roleNotSpecified')}</p>
              <div className="job-status">{work.current_job ? t('currentWork') : t('previousWork')}</div>
            </button>
          ))}

          {workHistory.length === 0 && <p className="no-data">{t('noLinkedRestaurants')}</p>}
        </div>
      )}
    </div>
  );
};

export default AlumniProfile;
