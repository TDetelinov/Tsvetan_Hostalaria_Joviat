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
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { db } from './firebase';
import { useI18n } from './i18n';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const RestaurantProfile = ({ restaurant, onBack, onNavigateAlumni, isAdmin }) => {
  const { t } = useI18n();
  const [alumniWorkers, setAlumniWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...restaurant });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setEditData({ ...restaurant });
  }, [restaurant]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const workersQuery = query(collection(db, 'Rest_Alum'), where('id_restaurant', '==', restaurant.id));
        const workersSnapshot = await getDocs(workersQuery);
        const workersData = await Promise.all(
          workersSnapshot.docs.map(async (joinDoc) => {
            const joinData = joinDoc.data();
            const alumniRef = doc(db, 'Alumni', joinData.id_alumni);
            const alumniSnapshot = await getDoc(alumniRef);

            return {
              id: joinDoc.id,
              id_alumni: joinData.id_alumni,
              current_job: joinData.current_job,
              rol: joinData.rol,
              alumniData: alumniSnapshot.exists() ? alumniSnapshot.data() : null
            };
          })
        );

        setAlumniWorkers(workersData.filter((item) => item.alumniData));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [restaurant.id]);

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'Restaurant', restaurant.id), {
        Name: editData.Name,
        Address: editData.Address,
        Phone: editData.Phone,
        Email: editData.Email
      });

      setIsEditing(false);
      window.alert(t('profileSaved'));
    } catch (error) {
      window.alert(t('profileSaveError'));
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t('deleteRestaurantConfirm'));

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const relationQuery = query(collection(db, 'Rest_Alum'), where('id_restaurant', '==', restaurant.id));
      const relationSnapshot = await getDocs(relationQuery);

      await Promise.all(relationSnapshot.docs.map((relationDoc) => deleteDoc(doc(db, 'Rest_Alum', relationDoc.id))));
      await deleteDoc(doc(db, 'Restaurant', restaurant.id));

      window.alert(t('deleteRestaurantSuccess'));
      onBack();
    } catch (error) {
      console.error(error);
      window.alert(t('deleteRestaurantError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-nav-header">
        <button className="back-button" type="button" onClick={onBack}>
          {t('profileBackMap')}
        </button>

        {isAdmin && (
          <div className="profile-actions">
            {isEditing && (
              <button className="btn-danger" type="button" onClick={handleDelete} disabled={deleting}>
                {deleting ? t('deleting') : t('deleteRestaurant')}
              </button>
            )}

            <button className="btn-joviat" type="button" onClick={() => (isEditing ? handleSave() : setIsEditing(true))}>
              {isEditing ? t('saveChanges') : t('editRestaurant')}
            </button>
          </div>
        )}
      </div>

      <div className="profile-main-card">
        <div className="profile-header">
          <img src={restaurant.PhotoURL || 'https://via.placeholder.com/400x320?text=Sense+Foto'} alt={restaurant.Name} className="profile-avatar" />

          <div className="profile-info">
            {isEditing ? (
              <input className="edit-input-h2" value={editData.Name || ''} onChange={(event) => setEditData({ ...editData, Name: event.target.value })} />
            ) : (
              <h2>{editData.Name}</h2>
            )}

            <div className="contact-grid">
              <div className="contact-item">
                <label className="contact-label">{t('addressLabel')}</label>
                {isEditing ? (
                  <input value={editData.Address || ''} onChange={(event) => setEditData({ ...editData, Address: event.target.value })} />
                ) : (
                  <p className="contact-value">{editData.Address || t('notSpecifiedF')}</p>
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
                <label className="contact-label">{t('emailLabel')}</label>
                {isEditing ? (
                  <input value={editData.Email || ''} onChange={(event) => setEditData({ ...editData, Email: event.target.value })} />
                ) : (
                  <p className="contact-value">{editData.Email || t('notSpecified')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {restaurant.Location && !isEditing && (
        <div className="map-section">
          <h3 className="section-subtitle">{t('locationTitle')}</h3>
          <div className="map-wrapper">
            <MapContainer center={[restaurant.Location.latitude, restaurant.Location.longitude]} zoom={15} scrollWheelZoom={false} className="map-panel">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[restaurant.Location.latitude, restaurant.Location.longitude]} icon={markerIcon}>
                <Popup>{restaurant.Name}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      <h3 className="section-subtitle">{t('studentsAtRestaurant')}</h3>

      {loading ? (
        <p className="loader-inline">{t('loadingRelatedStudents')}</p>
      ) : (
        <div className="worker-grid">
          {alumniWorkers.map((worker) => (
            <button
              key={worker.id}
              type="button"
              className="worker-card"
              onClick={() => onNavigateAlumni({ id: worker.id_alumni, ...worker.alumniData })}
            >
              <img src={worker.alumniData.PhotoURL || 'https://via.placeholder.com/72x72?text=Foto'} alt={worker.alumniData.Name} className="worker-img" />
              <div className="worker-details">
                <h4>{worker.alumniData.Name}</h4>
                <p>{worker.rol || t('roleNotSpecified')}</p>
                <span className={`status-tag ${worker.current_job ? 'active' : 'past'}`}>
                  {worker.current_job ? t('current') : t('previousShort')}
                </span>
              </div>
            </button>
          ))}

          {alumniWorkers.length === 0 && <p className="no-data">{t('noStudentsAtRestaurant')}</p>}
        </div>
      )}
    </div>
  );
};

export default RestaurantProfile;
