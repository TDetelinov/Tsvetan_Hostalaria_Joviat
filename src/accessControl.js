import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const normalizeStatus = (status) => (status || '').toString().trim().toLowerCase();

export const isAdministrator = async (email) => {
  if (!email) {
    return false;
  }

  const adminQuery = query(collection(db, 'Administrator'), where('Email', '==', email));
  const adminSnapshot = await getDocs(adminQuery);
  return !adminSnapshot.empty;
};

export const getPendingOrApprovedUserRecord = async ({ uid, email }) => {
  if (uid) {
    const userByUidQuery = query(collection(db, 'Users'), where('uid', '==', uid));
    const userByUidSnapshot = await getDocs(userByUidQuery);

    if (!userByUidSnapshot.empty) {
      return { id: userByUidSnapshot.docs[0].id, ...userByUidSnapshot.docs[0].data() };
    }
  }

  if (email) {
    const userByEmailQuery = query(collection(db, 'Users'), where('email', '==', email));
    const userByEmailSnapshot = await getDocs(userByEmailQuery);

    if (!userByEmailSnapshot.empty) {
      return { id: userByEmailSnapshot.docs[0].id, ...userByEmailSnapshot.docs[0].data() };
    }
  }

  return null;
};

export const getAccessState = async (authUser) => {
  if (!authUser) {
    return { allowed: false, isAdmin: false, status: null, userRecord: null };
  }

  const admin = await isAdministrator(authUser.email);
  if (admin) {
    return { allowed: true, isAdmin: true, status: 'admin', userRecord: null };
  }

  const userRecord = await getPendingOrApprovedUserRecord(authUser);
  const status = normalizeStatus(userRecord?.status);

  return {
    allowed: status === 'aprovat',
    isAdmin: false,
    status,
    userRecord
  };
};
