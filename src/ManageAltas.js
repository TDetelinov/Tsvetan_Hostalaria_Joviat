import React, { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { useI18n } from './i18n';

const ManageAltas = ({ onBack }) => {
  const { t } = useI18n();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingRestaurantRequests, setPendingRestaurantRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);

    try {
      const [usersSnapshot, restaurantRequestsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'Users'), where('status', '==', 'pendent'))),
        getDocs(query(collection(db, 'RestaurantRequests'), where('status', '==', 'pending')))
      ]);

      setPendingUsers(usersSnapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
      setPendingRestaurantRequests(
        restaurantRequestsSnapshot.docs.map((document) => ({ id: document.id, ...document.data() }))
      );
    } catch (error) {
      console.error('Error loading pending requests:', error);
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
      window.alert(t('requestSentError'));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm(t('rejectConfirm'))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'Users', id));
      fetchPending();
    } catch (error) {
      window.alert(t('rejectError'));
    }
  };

  const handleApproveRestaurantRequest = async (requestEntry) => {
    try {
      await addDoc(collection(db, 'Restaurant'), {
        Name: requestEntry.restaurantName?.trim() || '',
        Address: requestEntry.address?.trim() || '',
        Phone: '',
        Email: '',
        PhotoURL: 'https://via.placeholder.com/400x320?text=Restaurant'
      });

      await updateDoc(doc(db, 'RestaurantRequests', requestEntry.id), {
        status: 'approved',
        approvedAt: new Date()
      });

      fetchPending();
    } catch (error) {
      console.error(error);
      window.alert(t('approveRestaurantError'));
    }
  };

  const handleRejectRestaurantRequest = async (id) => {
    if (!window.confirm(t('rejectRestaurantConfirm'))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'RestaurantRequests', id));
      fetchPending();
    } catch (error) {
      window.alert(t('rejectRestaurantError'));
    }
  };

  return (
    <section className="admin-section-wrapper">
      <p className="admin-label-top">{t('adminLabel')}</p>
      <h1 className="admin-main-title">{t('approvalTitle')}</h1>
      <p className="admin-description">{t('approvalDescription')}</p>

      <div className="admin-card">
        {loading ? (
          <p className="loader-inline">{t('loadingRequests')}</p>
        ) : pendingUsers.length === 0 ? (
          <p className="no-data">{t('noPendingRequests')}</p>
        ) : (
          <div className="table-wrapper">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>{t('userColumn')}</th>
                  <th>{t('emailColumn')}</th>
                  <th>{t('statusColumn')}</th>
                  <th className="actions-column">{t('actionsColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="table-status">{t('pending')}</span>
                    </td>
                    <td className="requests-actions">
                      <button type="button" className="btn-approve" onClick={() => handleApprove(user.id)}>
                        {t('approve')}
                      </button>
                      <button type="button" className="btn-reject" onClick={() => handleReject(user.id)}>
                        {t('reject')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-card">
        <div className="section-header section-header-tight">
          <p className="section-kicker">{t('navRestaurants')}</p>
          <h2>{t('pendingRestaurantRequests')}</h2>
        </div>

        {loading ? (
          <p className="loader-inline">{t('loadingRequests')}</p>
        ) : pendingRestaurantRequests.length === 0 ? (
          <p className="no-data">{t('noPendingRestaurantRequests')}</p>
        ) : (
          <div className="table-wrapper">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>{t('restaurantColumn')}</th>
                  <th>{t('addressLabel')}</th>
                  <th>{t('messageColumn')}</th>
                  <th>{t('userColumn')}</th>
                  <th className="actions-column">{t('actionsColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingRestaurantRequests.map((requestEntry) => (
                  <tr key={requestEntry.id}>
                    <td>{requestEntry.restaurantName}</td>
                    <td>{requestEntry.address || t('notSpecifiedF')}</td>
                    <td>{requestEntry.message}</td>
                    <td>{requestEntry.requestedByName || requestEntry.requestedByEmail}</td>
                    <td className="requests-actions">
                      <button
                        type="button"
                        className="btn-approve"
                        onClick={() => handleApproveRestaurantRequest(requestEntry)}
                      >
                        {t('approveRestaurantRequest')}
                      </button>
                      <button
                        type="button"
                        className="btn-reject"
                        onClick={() => handleRejectRestaurantRequest(requestEntry.id)}
                      >
                        {t('reject')}
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
          {t('backHome')}
        </button>
      </div>
    </section>
  );
};

export default ManageAltas;
