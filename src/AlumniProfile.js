import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

const AlumniProfile = ({ alumni, onBack, onNavigateRest, isAdmin }) => {
  const [workHistory, setWorkHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...alumni });

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
        console.error('Error carregant historial:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkHistory();
  }, [alumni.id]);

  const handleUpdate = async () => {
    try {
      const alumniRef = doc(db, 'Alumni', alumni.id);
      await updateDoc(alumniRef, {
        Name: editData.Name,
        Email: editData.Email,
        Phone: editData.Phone,
        LinkedIn: editData.LinkedIn,
        Status: editData.Status
      });

      setIsEditing(false);
      window.alert('Perfil actualitzat correctament.');
    } catch (error) {
      window.alert('Error en actualitzar el perfil.');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-nav-header">
        <button className="back-button" type="button" onClick={onBack}>
          Tornar al llistat
        </button>

        {isAdmin && (
          <button className="btn-joviat" type="button" onClick={() => (isEditing ? handleUpdate() : setIsEditing(true))}>
            {isEditing ? 'Desar canvis' : 'Editar fitxa'}
          </button>
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
                <select value={editData.Status || 'Alumne'} onChange={(event) => setEditData({ ...editData, Status: event.target.value })}>
                  <option value="Alumne">Alumne</option>
                  <option value="Exalumne">Exalumne</option>
                </select>
              ) : (
                <span className="badge">{editData.Status || 'Alumne'}</span>
              )}
            </div>

            <div className="contact-grid">
              <div className="contact-item">
                <label className="contact-label">Email</label>
                {isEditing ? (
                  <input value={editData.Email || ''} onChange={(event) => setEditData({ ...editData, Email: event.target.value })} />
                ) : (
                  <p className="contact-value">{editData.Email || 'No indicat'}</p>
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
                <label className="contact-label">LinkedIn</label>
                {isEditing ? (
                  <input value={editData.LinkedIn || ''} onChange={(event) => setEditData({ ...editData, LinkedIn: event.target.value })} />
                ) : (
                  <p className="contact-value">
                    {editData.LinkedIn ? (
                      <a href={editData.LinkedIn} target="_blank" rel="noreferrer">
                        Veure perfil
                      </a>
                    ) : (
                      'No indicat'
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="section-subtitle">Trajectoria a restaurants</h3>
      {loading ? (
        <p className="loader-inline">Carregant trajectoria...</p>
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
              <p className="role-text">{work.rol || 'Carrec no especificat'}</p>
              <div className="job-status">{work.current_job ? 'Actualment' : 'Anteriorment'}</div>
            </button>
          ))}

          {workHistory.length === 0 && <p className="no-data">No hi ha restaurants vinculats.</p>}
        </div>
      )}
    </div>
  );
};

export default AlumniProfile;
