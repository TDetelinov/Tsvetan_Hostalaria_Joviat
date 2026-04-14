import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const RestaurantProfile = ({ restaurant, onBack, onNavigateAlumni, isAdmin }) => {
  const [alumniWorkers, setAlumniWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...restaurant });

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
      window.alert('Dades del restaurant actualitzades.');
    } catch (error) {
      window.alert('Error en desar els canvis.');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-nav-header">
        <button className="back-button" type="button" onClick={onBack}>
          Tornar al mapa
        </button>

        {isAdmin && (
          <button className="btn-joviat" type="button" onClick={() => (isEditing ? handleSave() : setIsEditing(true))}>
            {isEditing ? 'Guardar canvis' : 'Editar restaurant'}
          </button>
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
                <label className="contact-label">Adreca</label>
                {isEditing ? (
                  <input value={editData.Address || ''} onChange={(event) => setEditData({ ...editData, Address: event.target.value })} />
                ) : (
                  <p className="contact-value">{editData.Address || 'No indicada'}</p>
                )}
              </div>

              <div className="contact-item">
                <label className="contact-label">Telefon</label>
                {isEditing ? (
                  <input value={editData.Phone || ''} onChange={(event) => setEditData({ ...editData, Phone: event.target.value })} />
                ) : (
                  <p className="contact-value">{editData.Phone || 'No indicat'}</p>
                )}
              </div>

              <div className="contact-item">
                <label className="contact-label">Email</label>
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
          <h3 className="section-subtitle">Localitzacio</h3>
          <div className="map-wrapper">
            <MapContainer center={[restaurant.Location.latitude, restaurant.Location.longitude]} zoom={15} className="map-panel">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[restaurant.Location.latitude, restaurant.Location.longitude]}>
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
                <p>{worker.rol || 'Carrec no especificat'}</p>
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
