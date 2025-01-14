import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from './firebase';

export const db = getFirestore(app);

export interface UserData {
  uid: string;
  email: string;
  name: string;
  createdAt: Date;
}

export async function createUserDocument(userData: UserData) {
  try {
    await setDoc(doc(db, 'users', userData.uid), {
      ...userData,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}