import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';

const ManageAltas = ({ onBack }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);

    try {
      const pendingQuery = query(collection(db, 'Users'), where('status', '==', 'pendent'));
      const snapshot = await getDocs(pendingQuery);
      setPendingUsers(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
    } catch (error) {
      console.error('Error carregant altes pendents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, 'Users', id), { status: 'aprovat' });
      fetchPending();
    } catch (error) {
      window.alert('No s ha pogut aprovar la sollicitud.');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Segur que vols rebutjar aquesta sollicitud?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'Users', id));
      fetchPending();
    } catch (error) {
      window.alert('No s ha pogut rebutjar la sollicitud.');
    }
  };

  return (
    <section className="admin-section-wrapper">
      <p className="admin-label-top">Administracio</p>
      <h1 className="admin-main-title">Gestio d altes pendents</h1>
      <p className="admin-description">
        Revisa les peticions de nous usuaris i decideix quins comptes poden accedir a la zona privada.
      </p>

      <div className="admin-card">
        {loading ? (
          <p className="loader-inline">Carregant sollicituds...</p>
        ) : pendingUsers.length === 0 ? (
          <p className="no-data">No hi ha sollicituds pendents.</p>
        ) : (
          <div className="table-wrapper">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Usuari</th>
                  <th>Email</th>
                  <th>Estat</th>
                  <th className="actions-column">Accions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="table-status">Pendent</span>
                    </td>
                    <td className="requests-actions">
                      <button type="button" className="btn-approve" onClick={() => handleApprove(user.id)}>
                        Aprovar
                      </button>
                      <button type="button" className="btn-reject" onClick={() => handleReject(user.id)}>
                        Rebutjar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="form-submit-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Tornar a l inici
        </button>
      </div>
    </section>
  );
};

export default ManageAltas;
