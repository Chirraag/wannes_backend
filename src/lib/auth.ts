import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthError {
  code: string;
  message: string;
}

export async function loginUser(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw {
      code: (error as any).code,
      message: (error as any).message
    };
  }
}

export async function signupUser(email: string, password: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw {
      code: (error as any).code,
      message: (error as any).message
    };
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}