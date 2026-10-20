import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'auth.boardly.cfd',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0365509316.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '556734245207',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:556734245207:web:4797f3915b424209b03612',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712');

async function main() {
  try {
    const snap = await getDocs(collection(db, 'wallets'));
    console.log(`Found ${snap.size} wallets:`);
    snap.forEach((doc) => {
      console.log(`WALLET ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });

    const userSnap = await getDocs(collection(db, 'users'));
    console.log(`Found ${userSnap.size} users:`);
    userSnap.forEach((doc) => {
      console.log(`USER ID: ${doc.id}, email: ${doc.data()?.email}, name: ${doc.data()?.displayName}`);
    });
  } catch (err) {
    console.error('Error querying Firestore:', err);
  }
}

main();
