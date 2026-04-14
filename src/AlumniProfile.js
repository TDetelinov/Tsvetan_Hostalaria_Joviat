import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

const AlumniProfile = ({ alumni, onBack, onNavigateRest, isAdmin }) => {
  const [workHistory, setWorkHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...alumni });

  useEffect(() => {
    const fetchWorkHistory = async () => {
      try {
        const q = query(collection(db, "Rest_Alum"), where("id_alumni", "==", alumni.id));
        const querySnapshot = await getDocs(q);
        const historyData = await Promise.all(querySnapshot.docs.map(async (joinDoc) => {
          const joinData = joinDoc.data();
          const restRef = doc(db, "Restaurant", joinData.id_restaurant);
          const restSnap = await getDoc(restRef);
          return {
            id: joinDoc.id,
            id_restaurant: joinData.id_restaurant,
            current_job: joinData.current_job,
            rol: joinData.rol,
            restaurantData: restSnap.exists() ? restSnap.data() : null
          };
        }));
        setWorkHistory(historyData.filter(item => item.restaurantData));
        setLoading(false);
      } catch (error) {
        console.error("Error historial:", error);
        setLoading(false);
      }
    };
    fetchWorkHistory();
  }, [alumni.id]);

  const handleUpdate = async () => {
    try {
      const alumniRef = doc(db, "Alumni", alumni.id);
      await updateDoc(alumniRef, {
        Name: editData.Name,
        Email: editData.Email,
        Phone: editData.Phone,
        LinkedIn: editData.LinkedIn,
        Status: editData.Status
      });
      setIsEditing(false);
      alert("Perfil actualitzat correctament");
    } catch (e) {
      alert("Error en actualitzar");
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-nav-header">
        <button className="back-button" onClick={onBack}>← Llistat</button>
        {isAdmin && (
          <button className="btn-joviat" onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}>
            {isEditing ? "DESAR CANVIS" : "EDITAR FITXA"}
          </button>
        )}
      </div>
      
      <div className="profile-main-card">
        <div className="profile-header">
          <img 
            src={alumni.PhotoURL || 'https://via.placeholder.com/200?text=Sense+Foto'} 
            alt={alumni.Name} 
            className="profile-avatar" 
          />
          <div className="profile-info">
            {isEditing ? (
              <input 
                className="edit-input-h2" 
                value={editData.Name} 
                onChange={e => setEditData({...editData, Name: e.target.value})} 
              />
            ) : (
              <h2>{editData.Name}</h2>
            )}
            
            <div className="status-container">
               {isEditing ? (
                 <select value={editData.Status} onChange={e => setEditData({...editData, Status: e.target.value})}>
                   <option value="Alumne">Alumne</option>
                   <option value="Exalumne">Exalumne</option>
                 </select>
               ) : (
                 <span className="badge">{editData.Status}</span>
               )}
            </div>

            <div className="contact-grid">
              <div className="contact-item">
                <label>✉️ Email</label>
                {isEditing ? <input value={editData.Email} onChange={e => setEditData({...editData, Email: e.target.value})} /> : <p>{editData.Email}</p>}
              </div>
              <div className="contact-item">
                <label>📞 Telèfon</label>
                {isEditing ? <input value={editData.Phone} onChange={e => setEditData({...editData, Phone: e.target.value})} /> : <p>{editData.Phone}</p>}
              </div>
              <div className="contact-item">
                <label>🔗 LinkedIn</label>
                {isEditing ? <input value={editData.LinkedIn} onChange={e => setEditData({...editData, LinkedIn: e.target.value})} /> : (
                  <p>{editData.LinkedIn ? <a href={editData.LinkedIn} target="_blank" rel="noreferrer">Veure Perfil</a> : 'No indicat'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="section-subtitle">Trajectòria a Restaurants</h3>
      {loading ? (
        <p>Carregant...</p>
      ) : (
        <div className="history-grid">
          {workHistory.map((work) => (
            <div 
              key={work.id} 
              className={`history-card ${work.current_job ? 'active-job' : ''}`}
              onClick={() => onNavigateRest({ id: work.id_restaurant, ...work.restaurantData })}
            >
              <h4>{work.restaurantData.Name} <span>➔</span></h4>
              <p className="role-text">{work.rol || 'Càrrec no especificat'}</p>
              <div className="job-status">
                {work.current_job ? "🟢 Actualitat" : "🕒 Anterior"}
              </div>
            </div>
          ))}
          {workHistory.length === 0 && <p className="no-data">No hi ha restaurants vinculats.</p>}
        </div>
      )}
    </div>
  );
};

export default AlumniProfile;