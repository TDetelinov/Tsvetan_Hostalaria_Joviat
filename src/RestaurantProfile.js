import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const RestaurantProfile = ({ restaurant, onBack }) => {
  const [alumniWorkers, setAlumniWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const q = query(collection(db, "Rest_Alum"), where("id_restaurant", "==", restaurant.id));
        const querySnapshot = await getDocs(q);
        
        const workersData = await Promise.all(querySnapshot.docs.map(async (joinDoc) => {
          const joinData = joinDoc.data();
          const alumRef = doc(db, "Alumni", joinData.id_alumni);
          const alumSnap = await getDoc(alumRef);
          
          return {
            id: joinDoc.id,
            current_job: joinData.current_job,
            rol: joinData.rol,
            alumniData: alumSnap.exists() ? alumSnap.data() : null
          };
        }));

        setAlumniWorkers(workersData.filter(item => item.alumniData));
        setLoading(false);
      } catch (error) {
        console.error("Error carregant els treballadors: ", error);
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [restaurant.id]);

  return (
    <div className="profile-container">
      <button className="back-button" onClick={onBack}>← Tornar als restaurants</button>
      
      <div className="profile-header">
        <img 
          src={restaurant.PhotoURL || 'https://via.placeholder.com/200?text=Restaurant'} 
          alt={restaurant.Name} 
          className="profile-avatar" 
        />
        <div className="profile-info">
          <h2>{restaurant.Name}</h2>
          <p>📍 {restaurant.Address}</p>
          <div className="contact-grid">
            <p><strong>📞 Telèfon:</strong> {restaurant.Phone}</p>
            <p><strong>✉️ Email:</strong> {restaurant.Email}</p>
          </div>
        </div>
      </div>

      {restaurant.Location && (
        <div className="map-wrapper" style={{ marginTop: '20px' }}>
          <MapContainer 
            center={[restaurant.Location.latitude, restaurant.Location.longitude]} 
            zoom={16} 
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[restaurant.Location.latitude, restaurant.Location.longitude]}>
              <Popup>{restaurant.Name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      <hr className="joviat-divider" />

      <h3>Alumnes de la Joviat en aquest establiment</h3>
      {loading ? (
        <p>Carregant equip...</p>
      ) : (
        <div className="worker-grid">
          {alumniWorkers.length > 0 ? (
            alumniWorkers.map((worker) => (
              <div key={worker.id} className={`worker-card ${!worker.current_job ? 'past-worker' : ''}`}>
                <img 
                  src={worker.alumniData.PhotoURL || 'https://via.placeholder.com/60'} 
                  alt={worker.alumniData.Name} 
                  className="worker-img" 
                />
                <div className="worker-details">
                  <h4>{worker.alumniData.Name}</h4>
                  <p className="worker-role"><strong>Rol:</strong> {worker.rol}</p>
                  <span className={`status-tag ${worker.current_job ? 'active' : 'past'}`}>
                    {worker.current_job ? "🟢 Actualment aquí" : "⚪ Experiència passada"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results">No hi ha alumnes registrats en aquest restaurant.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantProfile;