import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const ManageAltas = ({ onBack }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    try {
      // Suposem que guardes els usuaris a una col·lecció "Users" amb status "pendent"
      const q = query(collection(db, "Users"), where("status", "==", "pendent"));
      const snap = await getDocs(q);
      setPendingUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error carregant altes:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, "Users", id), { status: 'aprovat' });
      fetchPending();
    } catch (e) { alert("Error al aprovar"); }
  };

  const handleReject = async (id) => {
    if (window.confirm("Segur que vols rebutjar aquesta sol·licitud?")) {
      await deleteDoc(doc(db, "Users", id));
      fetchPending();
    }
  };

  return (
    <div className="admin-section-wrapper">
      <h1 className="admin-main-title">Gestió d'Altes Pendents</h1>
      <div className="admin-card">
        {loading ? <p>Carregant...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--joviat-gold)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Usuari</th>
                <th>Email</th>
                <th style={{ textAlign: 'right' }}>Accions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center' }}>No hi ha sol·licituds pendents.</td></tr>
              ) : (
                pendingUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px 10px' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleApprove(u.id)} className="btn-approve">Aprovar</button>
                      <button onClick={() => handleReject(u.id)} className="btn-reject">Rebutjar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <button className="btn-secondary" onClick={onBack} style={{marginTop: '20px'}}>Tornar a l'inici</button>
      
      <style>{`
        .btn-approve { background: #2e7d32; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; margin-right: 5px; }
        .btn-reject { background: #c62828; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default ManageAltas;