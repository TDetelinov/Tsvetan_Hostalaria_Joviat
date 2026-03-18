import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const AlumniProfile = ({ alumni, onBack }) => {
  const [workHistory, setWorkHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
            current_job: joinData.current_job,
            rol: joinData.rol,
            restaurantData: restSnap.exists() ? restSnap.data() : null
          };
        }));

        setWorkHistory(historyData.filter(item => item.restaurantData));
        setLoading(false);
      } catch (error) {
        console.error("Error carregant l'historial: ", error);
        setLoading(false);
      }
    };

    fetchWorkHistory();
  }, [alumni.id]);

  return (
    <div className="profile-container">
      <button className="back-button" onClick={onBack}>← Tornar a la llista</button>
      
      <div className="profile-header">
        <img 
          src={alumni.PhotoURL || 'https://via.placeholder.com/200'} 
          alt={alumni.Name} 
          className="profile-avatar" 
        />
        <div className="profile-info">
          <h2>{alumni.Name}</h2>
          <span className="badge">{alumni.Status}</span>
          <div className="contact-grid">
            <p><strong>📞 Telèfon:</strong> {alumni.Phone}</p>
            <p><strong>✉️ Email:</strong> {alumni.Email}</p>
            {alumni.LinkedIn && (
              <p><strong>🔗 LinkedIn:</strong> <a href={alumni.LinkedIn} target="_blank" rel="noreferrer">Veure perfil</a></p>
            )}
          </div>
        </div>
      </div>

      <hr className="joviat-divider" />

      <h3>Trajectòria Professional</h3>
      {loading ? (
        <p>Carregant historial...</p>
      ) : (
        <div className="history-grid">
          {workHistory.length > 0 ? (
            workHistory.map((work) => (
              <div key={work.id} className={`history-card ${work.current_job ? 'active-job' : ''}`}>
                <h4>{work.restaurantData.Name}</h4>
                <p><strong>Posició:</strong> {work.rol}</p>
                <p className="address-text">📍 {work.restaurantData.Address}</p>
                <span className={`status-tag ${work.current_job ? 'active' : 'past'}`}>
                  {work.current_job ? "🟢 Feina actual" : "📅 Feina anterior"}
                </span>
              </div>
            ))
          ) : (
            <p className="no-results">Aquest alumne encara no té restaurants vinculats.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AlumniProfile;