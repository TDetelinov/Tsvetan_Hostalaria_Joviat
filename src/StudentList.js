import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Importem la base de dades
import { collection, getDocs } from 'firebase/firestore'; 
import './StudentList.css';

const StudentList = () => {
  const [alumni, setAlumni] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        // Canviem el nom de la col·lecció a "Alumni"
        const querySnapshot = await getDocs(collection(db, "Alumni"));
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAlumni(docs);
        setLoading(false);
      } catch (error) {
        console.error("Error al carregar els Alumni: ", error);
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  // Lògica de filtre en temps real pel camp "Name"
  const filteredAlumni = alumni.filter((persona) =>
    persona.Name && persona.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loader">Carregant la xarxa d'Alumni de la Joviat...</div>;

  return (
    <section className="student-section">
      <div className="section-header">
        <h2>Els nostres Alumnes i Exalumnes</h2>
        <div className="underline"></div>
      </div>

      {/* BARRA DE CERCA AMB BOTÓ X */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <input 
            type="text" 
            placeholder="Cerca per nom d'alumne..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>✕</button>
          )}
        </div>
      </div>

      {/* QUADRÍCULA D'ALUMNES */}
      <div className="student-grid">
        {filteredAlumni.length > 0 ? (
          filteredAlumni.map((persona) => (
            <div key={persona.id} className="student-card">
              <div className="image-container">
                {/* Utilitzem el camp PhotoURL de Firebase */}
                <img 
                  src={persona.PhotoURL || 'https://via.placeholder.com/200'} 
                  alt={persona.Name} 
                  className="student-img" 
                />
              </div>
              <div className="student-info">
                <h3>{persona.Name}</h3>
                <button className="profile-button">Veure Perfil</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No s'ha trobat cap alumne amb el nom "{searchTerm}".</p>
        )}
      </div>
    </section>
  );
};

export default StudentList;