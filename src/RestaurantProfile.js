import React, { useEffect, useState } from 'react';
import { db } from './firebase';
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
import 'leaflet/dist/leaflet.css';

const markerIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const RestaurantProfile = ({ restaurant, onBack, onNavigateAlumni, isAdmin }) => {
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
      const restaurantRef = doc(db, 'Restaurant', restaurant.id);
      await updateDoc(restaurantRef, {
        Name: editData.Name,
        Address: editData.Address,
        Phone: editData.Phone,
        Email: editData.Email
      });

      setIsEditing(false);
      window.alert("Les dades del restaurant s'han actualitzat correctament.");
    } catch (error) {
      window.alert("Hi ha hagut un error en desar els canvis.");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Segur que vols eliminar aquest restaurant? També s'esborraran les vinculacions amb alumnat."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const relationQuery = query(collection(db, 'Rest_Alum'), where('id_restaurant', '==', restaurant.id));
      const relationSnapshot = await getDocs(relationQuery);

      await Promise.all(relationSnapshot.docs.map((relationDoc) => deleteDoc(doc(db, 'Rest_Alum', relationDoc.id))));
      await deleteDoc(doc(db, 'Restaurant', restaurant.id));

      window.alert("El restaurant s'ha eliminat correctament.");
      onBack();
    } catch (error) {
      console.error(error);
      window.alert("No s'ha pogut eliminar el restaurant.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-nav-header">
        <button className="back-button" type="button" onClick={onBack}>
          Tornar al mapa
        </button>

        {isAdmin && (
          <div className="profile-actions">
            {isEditing && (
              <button
                className="btn-danger"
                type="button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminant...' : 'Eliminar restaurant'}
              </button>
            )}

            <button className="btn-joviat" type="button" onClick={() => (isEditing ? handleSave() : setIsEditing(true))}>
              {isEditing ? 'Desar canvis' : 'Editar restaurant'}
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
                <label className="contact-label">Adreça</label>
                {isEditing ? (
                  <input value={editData.Address || ''} onChange={(event) => setEditData({ ...editData, Address: event.target.value })} />
                ) : (
                  <p className="contact-value">{editData.Address || 'No indicada'}</p>
                )}
              </div>

              <div className="contact-item">
                <label className="contact-label">Telèfon</label>
                {isEditing ? (
                  <input value={editData.Phone || ''} onChange={(event) => setEditData({ ...editData, Phone: event.target.value })} />
                ) : (
                  <p className="contact-value">{editData.Phone || 'No indicat'}</p>
                )}
              </div>

              <div className="contact-item">
                <label className="contact-label">Correu electrònic</label>
                {isEditing ? (
                  <input value={editData.Email || ''} onChange={(event) => setEditData({ ...editData, Email: event.target.value })} />
                ) : (
                  <p className="contact-value">{editData.Email || 'No indicat'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {restaurant.Location && !isEditing && (
        <div className="map-section">
          <h3 className="section-subtitle">Localització</h3>
          <div className="map-wrapper">
            <MapContainer center={[restaurant.Location.latitude, restaurant.Location.longitude]} zoom={15} className="map-panel">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[restaurant.Location.latitude, restaurant.Location.longitude]} icon={markerIcon}>
                <Popup>{restaurant.Name}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      <h3 className="section-subtitle">Alumnes en aquest establiment</h3>

      {loading ? (
        <p className="loader-inline">Carregant alumnat relacionat...</p>
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
                <p>{worker.rol || 'Càrrec no especificat'}</p>
                <span className={`status-tag ${worker.current_job ? 'active' : 'past'}`}>
                  {worker.current_job ? 'Actual' : 'Anterior'}
                </span>
              </div>
            </button>
          ))}

          {alumniWorkers.length === 0 && <p className="no-data">No hi ha alumnes vinculats a aquest restaurant.</p>}
        </div>
      )}
    </div>
  );
};

export default RestaurantProfile;
