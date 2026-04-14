import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const RestaurantProfile = ({ restaurant, onBack, onNavigateAlumni, isAdmin }) => {
  const [alumniWorkers, setAlumniWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...restaurant });

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
      } catch (error) { console.error(error); setLoading(false); }
    };
    fetchWorkers();
  }, [restaurant.id]);

  const handleSave = async () => {
    try {
      const restRef = doc(db, "Restaurant", restaurant.id);
      await updateDoc(restRef, {
        Name: editData.Name,
        Address: editData.Address,
        Phone: editData.Phone,
        Email: editData.Email
      });
      setIsEditing(false);
      alert("Dades del restaurant actualitzades!");
    } catch (e) { alert("Error en desar"); }
  };

  return (
    <div className="profile-container">
      <div className="profile-nav-header">
        <button className="back-button" onClick={onBack}>← Tornar al mapa</button>
        {isAdmin && (
          <button className="btn-joviat" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
            {isEditing ? "💾 Guardar Canvis" : "✏️ Editar Restaurant"}
          </button>
        )}
      </div>

      <div className="profile-main-card">
        <div className="profile-header">
          <img src={restaurant.PhotoURL || 'https://via.placeholder.com/400'} alt={restaurant.Name} className="profile-avatar" />
          <div className="profile-info">
            {isEditing ? (
              <input className="edit-input-h2" value={editData.Name} onChange={e => setEditData({...editData, Name: e.target.value})} />
            ) : (
              <h2>{editData.Name}</h2>
            )}
            
            <div className="contact-grid">
              <div className="contact-item">
                <label>📍 Adreça</label>
                {isEditing ? <input value={editData.Address} onChange={e => setEditData({...editData, Address: e.target.value})} /> : <p>{editData.Address}</p>}
              </div>
              <div className="contact-item">
                <label>📞 Telèfon</label>
                {isEditing ? <input value={editData.Phone} onChange={e => setEditData({...editData, Phone: e.target.value})} /> : <p>{editData.Phone}</p>}
              </div>
              <div className="contact-item">
                <label>✉️ Email</label>
                {isEditing ? <input value={editData.Email} onChange={e => setEditData({...editData, Email: e.target.value})} /> : <p>{editData.Email}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {restaurant.Location && !isEditing && (
        <div className="map-section">
          <h3>Localització</h3>
          <MapContainer center={[restaurant.Location.latitude, restaurant.Location.longitude]} zoom={15} style={{ height: "250px", borderRadius: "12px" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[restaurant.Location.latitude, restaurant.Location.longitude]}>
              <Popup>{restaurant.Name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      <h3 className="section-subtitle">Alumnes en aquest establiment</h3>
      <div className="worker-grid">
        {alumniWorkers.map((worker) => (
          <div key={worker.id} className="worker-card" onClick={() => onNavigateAlumni({id: worker.id_alumni, ...worker.alumniData})}>
            <img src={worker.alumniData.PhotoURL || 'https://via.placeholder.com/60'} alt={worker.alumniData.Name} className="worker-img" />
            <div className="worker-details">
              <h4>{worker.alumniData.Name}</h4>
              <p>{worker.rol}</p>
              <span className={`status-tag ${worker.current_job ? 'active' : 'past'}`}>
                {worker.current_job ? "Actual" : "Anterior"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantProfile;