const TARGET_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';
const TARGET_PROJECT_ID = 'gen-lang-client-0365509316';
const TARGET_DATABASE_ID = 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

async function main() {
  const email = 'jan798408@gmail.com';
  console.log('Testing REST query for Firestore...');
  
  // Let's see if we can query public collections without auth or inspect REST documents
  const url = `https://firestore.googleapis.com/v1/projects/${TARGET_PROJECT_ID}/databases/${TARGET_DATABASE_ID}/documents/publicProfiles`;
  const res = await fetch(url);
  console.log('publicProfiles status:', res.status);
  const data = await res.json();
  console.log('publicProfiles count:', data.documents?.length || 0);
  if (data.documents) {
    for (const d of data.documents) {
      console.log('PublicProfile doc:', d.name.split('/').pop(), JSON.stringify(d.fields));
    }
  }
}

main().catch(console.error);
