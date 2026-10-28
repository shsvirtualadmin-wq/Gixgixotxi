#!/usr/bin/env node
/**
 * Boardly Commons Live Feed, Anonymous Attribution, KaTeX & Attachment Verification Script
 *
 * Queries the exact Firebase project (`gen-lang-client-0365509316`),
 * named Firestore database (`ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`),
 * and `commonsPosts` collection using the exact query and client-side filtering logic
 * in `fetchCommonsPosts` (`src/services/commonsService.ts`), then verifies:
 *   1. All 50 study-material posts are published ANONYMOUSLY (`isAnonymous: true`, `authorUid: null`, `authorName: 'Anonymous'`).
 *   2. All 50 study-material posts contain valid KaTeX/MathJax expressions (`$...$` / `$$...$$`) that compile cleanly via `katex.renderToString(..., { throwOnError: true })`.
 *   3. All 50 legacy non-anonymous posts (`commons_topic_01`..`50`) are hidden (`isHidden: true`) and excluded from the feed.
 *   4. Live PDF attachments resolve from Firestore chunk storage and parse cleanly.
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
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
} from 'firebase/firestore';
import { getDocumentProxy, extractText } from 'unpdf';
import katex from 'katex';
import 'katex/contrib/mhchem';

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

function validateKatexInText(text) {
  if (!text || typeof text !== 'string') {
    return { ok: false, reason: 'Empty text', count: 0, expressions: [] };
  }
  const regex = /(?:\\\$)|(?:\$\$([\s\S]+?)\$\$)|(?:\\\[([\s\S]+?)\\\])|(?:\$([^$\n]+?)\$)|(?:\\\(([\s\S]+?)\\\))/g;
  let match;
  const expressions = [];

  while ((match = regex.exec(text)) !== null) {
    if (match[0] === '\\$') continue;
    const isDisplay = match[1] !== undefined || match[2] !== undefined;
    const expr = (match[1] ?? match[2] ?? match[3] ?? match[4] ?? '').trim();
    if (!expr) {
      return { ok: false, reason: 'Empty math expression found.', count: 0, expressions: [] };
    }
    try {
      katex.renderToString(expr, {
        displayMode: isDisplay,
        throwOnError: true,
        strict: false,
      });
      expressions.push(match[0]);
    } catch (err) {
      return {
        ok: false,
        reason: `Invalid KaTeX syntax in "${match[0]}": ${err.message}`,
        count: 0,
        expressions: [],
      };
    }
  }

  if (expressions.length === 0) {
    return {
      ok: false,
      reason: 'No KaTeX/MathJax expressions ($...$ or $$...$$) found.',
      count: 0,
      expressions: [],
    };
  }
  return { ok: true, count: expressions.length, expressions };
}

async function verifyFeedAndPdf() {
  console.log('================================================================================');
  console.log('BOARDLY COMMONS LIVE FEED, ANONYMOUS ATTRIBUTION & KATEX VERIFICATION');
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
  // query(collection(db, 'commonsPosts'), where('isHidden', '==', false), orderBy('createdAt', 'desc'), limit(40))
  const allVisiblePosts = [];
  let lastDoc = null;
  let pageNum = 0;

  while (true) {
    pageNum++;
    const constraints = [where('isHidden', '==', false), orderBy('createdAt', 'desc'), limit(40)];
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    const q = query(collection(db, 'commonsPosts'), ...constraints);
    const snap = await getDocs(q);
    if (snap.empty) break;

    for (const d of snap.docs) {
      const data = d.data();
      if (d.id.startsWith('att_')) continue;
      if (data.isAttachmentChunk === true || data.type === 'attachment_chunk') continue;
      if (data.isHidden === true) continue;

      allVisiblePosts.push({ id: d.id, ...data, _rawCreatedAt: data.createdAt });
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < 40) break;
  }

  const generatedPosts = allVisiblePosts.filter((p) => p.id.startsWith('commons_anon_topic_'));
  const leakedLegacyPosts = allVisiblePosts.filter((p) => p.id.startsWith('commons_topic_'));
  const communityPosts = allVisiblePosts.filter(
    (p) => !p.id.startsWith('commons_anon_topic_') && !p.id.startsWith('commons_topic_')
  );
  const pdfPosts = generatedPosts.filter((p) => Array.isArray(p.files) && p.files.length > 0);
  const textPosts = generatedPosts.filter((p) => !p.files || p.files.length === 0);

  console.log(`Total visible posts in Commons Feed (Newest tab) : ${allVisiblePosts.length}`);
  console.log(`  - Pinned / existing community posts            : ${communityPosts.length}`);
  console.log(`  - Published anonymous study-material posts     : ${generatedPosts.length} (42 PDF + 8 Text expected)`);
  console.log(`    * PDF study guides with attachments          : ${pdfPosts.length}`);
  console.log(`    * Text-only revision posts                   : ${textPosts.length}`);
  console.log(`  - Visible non-anonymous legacy posts           : ${leakedLegacyPosts.length} (0 expected)\n`);

  // Verify Anonymous Attribution & KaTeX across all 50 generated posts
  let anonErrors = 0;
  let katexErrors = 0;
  let timestampErrors = 0;
  let totalKatexBlocks = 0;

  for (const p of generatedPosts) {
    if (!(p._rawCreatedAt instanceof Timestamp)) {
      console.error(`[Timestamp Error] ${p.id}: createdAt is not a Firestore Timestamp`);
      timestampErrors++;
    }
    if (
      p.isAnonymous !== true ||
      p.authorUid !== null ||
      p.authorName !== 'Anonymous' ||
      p.authorRole !== null ||
      p.authorAvatar !== null ||
      p.authorFrame !== null ||
      p.authorEquippedAvatar !== null ||
      p.authorPhotoURL !== null ||
      p.authorCustomRole !== null
    ) {
      console.error(
        `[Anonymous Error] ${p.id}: isAnonymous=${p.isAnonymous}, authorUid=${p.authorUid}, authorName=${p.authorName}, authorRole=${p.authorRole}`
      );
      anonErrors++;
    }

    const katexRes = validateKatexInText(p.description);
    if (!katexRes.ok) {
      console.error(`[KaTeX Error] ${p.id} ("${p.title}"): ${katexRes.reason}`);
      katexErrors++;
    } else {
      totalKatexBlocks += katexRes.count;
    }
  }

  console.log('================================================================================');
  console.log('VERIFICATION RESULTS ACROSS ALL 50 GENERATED STUDY-MATERIAL POSTS');
  console.log('================================================================================');
  console.log(
    `1. Anonymous Attribution Check (isAnonymous: true, authorUid: null, authorName: "Anonymous") : ${
      anonErrors === 0 && generatedPosts.length === 50
        ? 'PASSED (50/50 posts strictly anonymous, 0 errors)'
        : `FAILED (${anonErrors} errors, ${generatedPosts.length} posts)`
    }`
  );
  console.log(
    `2. KaTeX / MathJax Validation (katex.renderToString throwOnError: true)                      : ${
      katexErrors === 0 && generatedPosts.length === 50
        ? `PASSED (50/50 posts contain valid KaTeX, ${totalKatexBlocks} total math blocks, 0 syntax errors)`
        : `FAILED (${katexErrors} errors)`
    }`
  );
  console.log(
    `3. Firestore Timestamp & Feed Visibility Check                                               : ${
      timestampErrors === 0 && leakedLegacyPosts.length === 0 && generatedPosts.length === 50
        ? 'PASSED (50/50 valid Timestamps, 0 duplicate/non-anonymous posts visible)'
        : `FAILED (timestampErrors=${timestampErrors}, leakedLegacy=${leakedLegacyPosts.length})`
    }\n`
  );

  // Also check the 5 existing community formula sheet posts
  const communityMathPosts = communityPosts.filter((p) => p.id !== 'fXfn19ZUURYH7zfwpgrX');
  let communityAnonCount = 0;
  let communityKatexCount = 0;
  for (const cp of communityMathPosts) {
    if (cp.isAnonymous === true && cp.authorName === 'Anonymous') communityAnonCount++;
    if (validateKatexInText(cp.description).ok) communityKatexCount++;
  }
  console.log(
    `Existing Community Formula Sheet Posts (${communityMathPosts.length} posts): ${communityAnonCount}/${communityMathPosts.length} anonymous, ${communityKatexCount}/${communityMathPosts.length} valid KaTeX.\n`
  );

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

  console.log('Sample of 10 Published Anonymous Study-Material Posts (with KaTeX expression counts):');
  const sortedByTopic = [...generatedPosts].sort((a, b) => a.id.localeCompare(b.id));
  for (let i = 0; i < Math.min(10, sortedByTopic.length); i++) {
    const p = sortedByTopic[i];
    const kRes = validateKatexInText(p.description);
    const att = p.files?.length ? `PDF (${p.files[0].size} B)` : 'TEXT';
    console.log(
      `  ${String(i + 1).padStart(2, '0')}. [${p.id}] author="${p.authorName}" (isAnonymous=${p.isAnonymous}, uid=${p.authorUid}) | KaTeX=${kRes.count} exprs (e.g. ${kRes.expressions[0]}) | ${att} | ${p.title}`
    );
  }

  if (anonErrors > 0 || katexErrors > 0 || timestampErrors > 0 || generatedPosts.length !== 50 || leakedLegacyPosts.length > 0) {
    process.exit(1);
  }
}

verifyFeedAndPdf()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Verification Failed]', err);
    process.exit(1);
  });
