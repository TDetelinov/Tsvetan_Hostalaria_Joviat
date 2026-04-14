import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const StudentList = ({ onSelect }) => {
  const [alumni, setAlumni] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlumni = async () => {
      const querySnapshot = await getDocs(collection(db, 'Alumni'));
      setAlumni(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchAlumni();
  }, []);

  if (loading) {
    return <div className="loader">Carregant alumnes...</div>;
  }

  const filteredAlumni = alumni.filter((person) =>
    person.Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="content-section">
      <div className="section-header">
        <p className="section-kicker">Comunitat Joviat</p>
        <h2>Els nostres alumnes</h2>
        <div className="underline"></div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Cerca per nom..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" type="button" onClick={() => setSearchTerm('')}>
              x
            </button>
          )}
        </div>
      </div>

      <div className="data-grid">
        {filteredAlumni.map((person) => (
          <article key={person.id} className="card">
            <div className="card-img-container">
              <img src={person.PhotoURL || 'https://via.placeholder.com/300x360?text=Sense+Foto'} className="card-img" alt={person.Name} />
            </div>
            <div className="card-body">
              <h3>{person.Name}</h3>
              <p>{person.Status || 'Alumni Joviat'}</p>
            </div>
            <button className="btn-joviat card-action" type="button" onClick={() => onSelect(person)}>
              Veure perfil
            </button>
          </article>
        ))}
      </div>

      {filteredAlumni.length === 0 && <p className="no-data">No s han trobat alumnes amb aquest nom.</p>}
    </section>
  );
};

export default StudentList;
