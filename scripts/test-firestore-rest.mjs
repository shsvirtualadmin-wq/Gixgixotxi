const TARGET_PROJECT_ID = 'gen-lang-client-0365509316';
const TARGET_DATABASE_ID = 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';
const TARGET_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';

async function getAuthToken() {
  const email = `investigator_${Date.now()}@test.internal`;
  const password = 'TestPassword123!';
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${TARGET_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (data.idToken) return { token: data.idToken, email };
    console.log('signUp error:', data);
  } catch (e) {
    console.warn('signUp exception:', e.message);
  }
  return null;
}

async function queryCollection(token, collectionId) {
  const url = `https://firestore.googleapis.com/v1/projects/${TARGET_PROJECT_ID}/databases/${TARGET_DATABASE_ID}/documents:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      limit: 10,
    },
  };
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  console.log(`runQuery [${collectionId}] status:`, res.status);
  const data = await res.json();
  if (Array.isArray(data)) {
    console.log(`runQuery [${collectionId}] docs count returned:`, data.filter(x => x.document).length);
    if (data.length > 0 && data[0].document) {
      console.log(`  First doc name:`, data[0].document.name);
    }
  } else {
    console.log(`runQuery [${collectionId}] error result:`, JSON.stringify(data).slice(0, 300));
  }
}

async function main() {
  const auth = await getAuthToken();
  console.log('Auth:', auth ? auth.email : 'FAILED');
  if (auth) {
    await queryCollection(auth.token, 'questions');
    await queryCollection(auth.token, 'questions_mathematics');
  }
}

main().catch(console.error);
