import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Importamos la conexión
import { collection, getDocs } from 'firebase/firestore'; 
import './StudentList.css';

const StudentList = () => {
  const [Alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        // "Alumni" es el nombre de tu colección en Firebase
        const querySnapshot = await getDocs(collection(db, "Alumni"));
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAlumni(docs);
        setLoading(false);
      } catch (error) {
        console.error("Error al traer Alumni: ", error);
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  if (loading) return <div className="loader">Cargando Alumni de la Joviat...</div>;

  return (
    <section className="student-section">
      <div className="section-header">
        <h2>Nuestros Alumni (Live)</h2>
        <div className="underline"></div>
      </div>

      <div className="student-grid">
        {Alumni.map((alumno) => (
          <div key={alumno.id} className="student-card">
            <div className="image-container">
              {/* Usamos Name y PhotoURL tal cual están en Firebase */}
              <img src={alumno.PhotoURL} alt={alumno.Name} className="student-img" />
            </div>
            <div className="student-info">
              <h3>{alumno.Name}</h3>
              <button className="profile-button">Ver Perfil</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StudentList;