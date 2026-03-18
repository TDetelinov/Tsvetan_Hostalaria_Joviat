import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import AlumniProfile from './AlumniProfile';

const StudentList = () => {
  const [alumni, setAlumni] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  useEffect(() => {
    const fetchAlumni = async () => {
      const querySnapshot = await getDocs(collection(db, "Alumni"));
      setAlumni(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchAlumni();
  }, []);

  if (selectedAlumni) return <AlumniProfile alumni={selectedAlumni} onBack={() => setSelectedAlumni(null)} />;
  if (loading) return <div className="loader">Carregant...</div>;

  const filtered = alumni.filter(a => a.Name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <section>
      <div className="section-header">
        <h2>Els nostres Alumnes</h2>
        <div className="underline"></div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <input type="text" placeholder="Cerca per nom..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button className="clear-search" onClick={() => setSearchTerm("")}>✕</button>}
        </div>
      </div>

      <div className="data-grid">
        {filtered.map(persona => (
          <div key={persona.id} className="card">
            <div className="card-img-container">
              <img src={persona.PhotoURL || 'https://via.placeholder.com/300'} className="card-img" alt={persona.Name} />
            </div>
            <div className="card-body">
              <h3>{persona.Name}</h3>
              <p>{persona.Status}</p>
            </div>
            <button className="btn-joviat" onClick={() => setSelectedAlumni(persona)}>Veure Perfil</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StudentList;