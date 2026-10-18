const TARGET_PROJECT_ID = 'gen-lang-client-0365509316';
const TARGET_DATABASE_ID = 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';
const TARGET_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';

async function getAuthToken() {
  const email = 'inspector.dev@boardly.test';
  const password = 'InspectorPassword123!';
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${TARGET_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  return data.idToken;
}

async function queryKeys(token) {
  const url = `https://firestore.googleapis.com/v1/projects/${TARGET_PROJECT_ID}/databases/${TARGET_DATABASE_ID}/documents:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'questionKeys' }],
      limit: 10,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  console.log('queryKeys status:', res.status);
  const data = await res.json();
  console.log('queryKeys data:', JSON.stringify(data, null, 2));
}

async function main() {
  const token = await getAuthToken();
  await queryKeys(token);
}

main().catch(console.error);
