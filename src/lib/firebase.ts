import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD77o9iKbFadOlAXzjI2Yb3WpV8L46SprE",
  authDomain: "wannes-whitelabelled.firebaseapp.com",
  projectId: "wannes-whitelabelled",
  storageBucket: "wannes-whitelabelled.firebasestorage.app",
  messagingSenderId: "967761917332",
  appId: "1:967761917332:web:9c3ce88c64d52413decb81",
  measurementId: "G-VBDYZ40F52"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);