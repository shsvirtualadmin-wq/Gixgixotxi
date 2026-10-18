import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getCountFromServer, query, limit } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'auth.boardly.cfd',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0365509316.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '556734245207',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:556734245207:web:4797f3915b424209b03612',
};

const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, databaseId);

async function inspect() {
  console.log('--- FIRESTORE INVESTIGATION (READ-ONLY) ---');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Database ID:', databaseId);

  const targetCollections = [
    'questions',
    'questions_mathematics',
    'questions_physics',
    'questions_chemistry',
    'questions_biology',
    'questions_english',
    'questions_computer',
    'questions_computer_science',
    'questions_analytical_reasoning',
    'questionKeys',
    'auditLogs'
  ];

  for (const colName of targetCollections) {
    try {
      const colRef = collection(db, colName);
      const countSnap = await getCountFromServer(colRef);
      const count = countSnap.data().count;
      console.log(`Collection "${colName}": ${count} documents`);

      if (count > 0 && count <= 1000) {
        const snap = await getDocs(colRef);
        const subjects = {};
        snap.docs.forEach(d => {
          const sub = d.data().subject || 'NO_SUBJECT';
          subjects[sub] = (subjects[sub] || 0) + 1;
        });
        console.log(`  Subjects in "${colName}":`, subjects);
        if (count <= 10) {
          console.log(`  Sample IDs in "${colName}":`, snap.docs.map(d => ({ id: d.id, subject: d.data().subject, q: (d.data().q || d.data().text || '').slice(0, 40) })));
        }
      } else if (count > 1000) {
        const snap = await getDocs(query(colRef, limit(100)));
        const subjects = {};
        snap.docs.forEach(d => {
          const sub = d.data().subject || 'NO_SUBJECT';
          subjects[sub] = (subjects[sub] || 0) + 1;
        });
        console.log(`  Sample 100 docs subjects in "${colName}":`, subjects);
      }
    } catch (err) {
      console.log(`Collection "${colName}": Error querying - ${err.message}`);
    }
  }

  // Also check local json files
  console.log('\n--- LOCAL FILE INVESTIGATION ---');
  const cleanedJsonPath = path.join(process.cwd(), 'data/questions.cleaned.json');
  if (fs.existsSync(cleanedJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cleanedJsonPath, 'utf8'));
      console.log(`data/questions.cleaned.json: ${data.length} questions`);
      const subs = {};
      data.forEach(q => {
        const s = q.subject || 'NO_SUBJECT';
        subs[s] = (subs[s] || 0) + 1;
      });
      console.log('  Subjects in questions.cleaned.json:', subs);
    } catch (e) {
      console.log('Error reading questions.cleaned.json:', e.message);
    }
  } else {
    console.log('data/questions.cleaned.json: DOES NOT EXIST');
  }

  // Check audit logs for deletion or move actions
  try {
    const auditSnap = await getDocs(query(collection(db, 'auditLogs'), limit(50)));
    console.log(`\n--- RECENT AUDIT LOGS (${auditSnap.size} docs) ---`);
    auditSnap.docs.forEach(d => {
      const data = d.data();
      console.log(`  [${data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : 'no-time'}] ${data.action} by ${data.adminEmail}: ${JSON.stringify(data.details || {})}`);
    });
  } catch (err) {
    console.log('Could not read audit logs:', err.message);
  }
}

inspect().then(() => process.exit(0)).catch(err => {
  console.error('Fatal inspection error:', err);
  process.exit(1);
});
