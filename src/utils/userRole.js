// src/utils/userRole.js
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// เพิ่มข้อมูล user และ role
export const createUserWithRole = async (userId, email, role = 'user') => {
  try {
    await setDoc(doc(db, 'users', userId), {
      email,
      role,
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
};

// ดึงข้อมูล role ของ user
export const getUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};