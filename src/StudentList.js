import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useI18n } from './i18n';
import PaginationControls from './PaginationControls';

const PAGE_SIZE = 10;

const translateStatus = (status, t) => {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'alumne' || normalized === 'alumno' || normalized === 'student') {
    return t('statusStudent');
  }

  if (normalized === 'exalumne' || normalized === 'exalumno' || normalized === 'alumni') {
    return t('statusAlumni');
  }

  return status || t('statusStudent');
};

const StudentList = ({ onSelect, state, onStateChange }) => {
  const { t, tCount } = useI18n();
  const [alumni, setAlumni] = useState([]);
  const [searchTerm, setSearchTerm] = useState(state?.searchTerm || '');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(state?.currentPage || 1);

  useEffect(() => {
    const fetchAlumni = async () => {
      const querySnapshot = await getDocs(collection(db, 'Alumni'));
      setAlumni(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchAlumni();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    onStateChange?.({ searchTerm, currentPage });
  }, [searchTerm, currentPage, onStateChange]);

  if (loading) {
    return <div className="loader">{t('loadingStudents')}</div>;
  }

  const filteredAlumni = alumni.filter((person) =>
    person.Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredAlumni.length;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedAlumni = filteredAlumni.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <section className="content-section">
      <div className="section-header">
        <p className="section-kicker">{t('studentSectionKicker')}</p>
        <h2>{t('studentSectionTitle')}</h2>
        <div className="underline"></div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder={t('searchStudents')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" type="button" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>
      </div>

      <div className="results-toolbar">
        <p className="results-counter">
          {totalItems} {tCount('studentFound', totalItems)}
        </p>
      </div>

      <div className="data-grid">
        {paginatedAlumni.map((person) => (
          <article key={person.id} className="card">
            <div className="card-img-container">
              <img
                src={person.PhotoURL || 'https://via.placeholder.com/300x360?text=Sense+Foto'}
                className="card-img"
                alt={person.Name}
              />
            </div>
            <div className="card-body">
              <h3>{person.Name}</h3>
              <p>{translateStatus(person.Status, t)}</p>
            </div>
            <button className="btn-joviat card-action" type="button" onClick={() => onSelect(person)}>
              {t('viewProfile')}
            </button>
          </article>
        ))}
      </div>

      {filteredAlumni.length === 0 && <p className="no-data">{t('noStudentsFound')}</p>}

      <PaginationControls
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
      />
    </section>
  );
};

export default StudentList;
