const TARGET_PROJECT_ID = 'gen-lang-client-0365509316';
const TARGET_DATABASE_ID = 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';
const TARGET_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';

async function test() {
  const email = `investigator_${Date.now()}@test.internal`;
  const password = 'TestPassword123!';
  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${TARGET_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const authData = await authRes.json();
  const token = authData.idToken;

  // Let's test listing documents in collection "questions" with pageSize=10
  const url = `https://firestore.googleapis.com/v1/projects/${TARGET_PROJECT_ID}/databases/${TARGET_DATABASE_ID}/documents/questions?pageSize=10`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('List /questions status:', res.status);
  const data = await res.json();
  if (data.documents) {
    console.log(`Found ${data.documents.length} docs in /questions`);
    console.log('Next page token:', data.nextPageToken ? 'YES' : 'NO');
    console.log('Sample doc subjects:', data.documents.map(d => {
      const f = d.fields || {};
      return { id: d.name.split('/').pop(), subject: f.subject?.stringValue, chapter: f.chapter?.stringValue };
    }));
  } else {
    console.log('Error listing /questions:', data);
  }
}

test().catch(console.error);
