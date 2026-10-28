#!/usr/bin/env node
/**
 * Boardly Commons Live Feed & Attachment Verification Script
 *
 * Queries the exact Firebase project (`gen-lang-client-0365509316`),
 * named Firestore database (`ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`),
 * and `commonsPosts` collection using the exact query and client-side filtering logic
 * in `fetchCommonsPosts` (`src/services/commonsService.ts`), then resolves and verifies
 * a live PDF attachment from Firestore chunk storage.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
} from 'firebase/firestore';
import { getDocumentProxy, extractText } from 'unpdf';

const PROJECT_ID = 'gen-lang-client-0365509316';
const DATABASE_ID = 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'auth.boardly.cfd',
  projectId: PROJECT_ID,
  storageBucket: 'gen-lang-client-0365509316.firebasestorage.app',
  messagingSenderId: '556734245207',
  appId: '1:556734245207:web:4797f3915b424209b03612',
});

const auth = getAuth(app);
const db = getFirestore(app, DATABASE_ID);

async function verifyFeedAndPdf() {
  console.log('================================================================================');
  console.log('BOARDLY COMMONS LIVE FEED & ATTACHMENT VERIFICATION');
  console.log(`Project ID  : ${PROJECT_ID}`);
  console.log(`Database ID : ${DATABASE_ID}`);
  console.log('Collection  : commonsPosts');
  console.log('================================================================================\n');

  const cred = await signInWithEmailAndPassword(
    auth,
    'inspector.dev@boardly.test',
    'InspectorPassword123!'
  );
  console.log(`Signed in as student reader: ${cred.user.email} (uid: ${cred.user.uid})\n`);

  // Paginate using the exact query from `fetchCommonsPosts` in `src/services/commonsService.ts`:
  // query(collection(db, 'commonsPosts'), orderBy('createdAt', 'desc'), limit(limitCount * 2))
  const allVisiblePosts = [];
  let lastDoc = null;
  let pageNum = 0;

  while (true) {
    pageNum++;
    const constraints = [orderBy('createdAt', 'desc'), limit(40)];
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    const q = query(collection(db, 'commonsPosts'), ...constraints);
    const snap = await getDocs(q);
    if (snap.empty) break;

    for (const d of snap.docs) {
      const data = d.data();
      // Exact client-side filters from `fetchCommonsPosts` (commonsService.ts lines 387-397)
      if (d.id.startsWith('att_')) continue;
      if (data.isAttachmentChunk === true || data.type === 'attachment_chunk') continue;
      if (data.isHidden === true) continue;

      allVisiblePosts.push({ id: d.id, ...data, _rawCreatedAt: data.createdAt });
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < 40) break;
  }

  const generatedPosts = allVisiblePosts.filter((p) => p.id.startsWith('commons_topic_'));
  const pdfPosts = generatedPosts.filter((p) => Array.isArray(p.files) && p.files.length > 0);
  const textPosts = generatedPosts.filter((p) => !p.files || p.files.length === 0);

  console.log(`Total visible posts in Commons Feed (Newest tab) : ${allVisiblePosts.length}`);
  console.log(`  - Pinned / existing community posts            : ${allVisiblePosts.length - generatedPosts.length}`);
  console.log(`  - Published study-material posts               : ${generatedPosts.length} (42 PDF + 8 Text expected)`);
  console.log(`    * PDF study guides with attachments          : ${pdfPosts.length}`);
  console.log(`    * Text-only revision posts                   : ${textPosts.length}\n`);

  // Verify schema of all generated posts
  let schemaErrors = 0;
  for (const p of generatedPosts) {
    const isTimestamp = p._rawCreatedAt instanceof Timestamp;
    if (!isTimestamp) {
      console.error(`[Schema Error] ${p.id}: createdAt is not a Firestore Timestamp`);
      schemaErrors++;
    }
    if (p.authorUid !== 'A5YMRimdHRcmeDWutxtUGt2e4hf2' || p.authorName !== 'SHS Virtual Academy') {
      console.error(`[Schema Error] ${p.id}: unexpected author (${p.authorUid} / ${p.authorName})`);
      schemaErrors++;
    }
    if (p.authorRole !== 'Super Admin') {
      console.error(`[Schema Error] ${p.id}: unexpected authorRole (${p.authorRole})`);
      schemaErrors++;
    }
  }
  console.log(`Field & Timestamp schema verification across ${generatedPosts.length} posts: ${schemaErrors === 0 ? 'PASSED (0 errors)' : `FAILED (${schemaErrors} errors)`}\n`);

  // Verify opening a PDF attachment via Boardly's `resolveCommonsAttachmentUrl` logic
  if (pdfPosts.length > 0) {
    const samplePost = pdfPosts[0];
    const fileMeta = samplePost.files[0];
    console.log(`Testing live PDF attachment resolution for post "${samplePost.title}" (${samplePost.id}):`);
    console.log(`  - Attachment name : ${fileMeta.name}`);
    console.log(`  - Attachment URL  : ${fileMeta.url}`);
    console.log(`  - Storage path    : ${fileMeta.storagePath}`);
    console.log(`  - File size       : ${fileMeta.size} bytes`);

    if (fileMeta.url.startsWith('firestore://')) {
      const withoutScheme = fileMeta.url.slice('firestore://'.length);
      const [prefix, totalChunksStr] = withoutScheme.split('/');
      const totalChunks = parseInt(totalChunksStr, 10);
      const chunks = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkDocId = `${prefix}_${i}`;
        const chunkSnap = await getDoc(doc(db, 'commonsPosts', chunkDocId));
        if (!chunkSnap.exists()) {
          throw new Error(`Missing attachment chunk document: commonsPosts/${chunkDocId}`);
        }
        chunks.push(chunkSnap.data().data || chunkSnap.data().description);
      }
      const reconstructedBytes = Buffer.from(chunks.join(''), 'base64');
      const pdfProxy = await getDocumentProxy(new Uint8Array(reconstructedBytes));
      const { text } = await extractText(pdfProxy, { mergePages: true });
      const extracted = typeof text === 'string' ? text : (text || []).join('\n');
      const hasFooter = extracted.includes(
        'Generated with AI for revision. Please verify with your textbook.'
      );
      console.log(
        `  - Live Firestore Chunk Resolution : PASSED (${totalChunks} chunk(s), ${reconstructedBytes.length} bytes reconstructed)`
      );
      console.log(
        `  - PDF Open & Parse Check          : PASSED (${pdfProxy.numPages} pages, footer present: ${hasFooter})\n`
      );
    }
  }

  console.log('Top 10 Newest Posts Returned by Live Feed Query:');
  for (let i = 0; i < Math.min(10, allVisiblePosts.length); i++) {
    const p = allVisiblePosts[i];
    const dt = p._rawCreatedAt?.toDate ? p._rawCreatedAt.toDate().toISOString() : String(p._rawCreatedAt);
    const att = p.files?.length ? `PDF (${p.files[0].size} B)` : 'TEXT';
    console.log(
      `  ${String(i + 1).padStart(2, '0')}. [${p.id}] ${dt} | ${p.subject} | ${att} | ${p.title}`
    );
  }
}

verifyFeedAndPdf()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Verification Failed]', err);
    process.exit(1);
  });
