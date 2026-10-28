#!/usr/bin/env node
/**
 * ============================================================================
 * ONE-TIME MIGRATION: FIRESTORE POSTS & ATTACHMENTS -> CLOUDFLARE D1 + R2
 * ============================================================================
 * 1. Authenticates with Firebase Auth and queries all visible posts in
 *    Firestore `commonsPosts` (`where('isHidden', '==', false)`).
 * 2. Reconstructs all 42 chunked `firestore://att_...` PDFs into real binary
 *    PDF files in `data/r2-bucket/commons/pdfs/...`, uploads to Cloudflare R2
 *    if R2 S3 credentials are configured, and rewrites attachment URLs to
 *    `https://pub-51ccade1f191417389ac7df61830c670.r2.dev/commons/pdfs/...`.
 * 3. Generates `data/cloudflare_d1_posts.json` (used by local/preview server)
 *    and `cloudflare/d1-seed-posts.sql` (ready for `wrangler d1 execute`).
 * 4. Leaves existing Firestore post data untouched until verified.
 */

import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';

const R2_PUBLIC_BASE_URL = (
  process.env.R2_PUBLIC_BASE_URL ||
  'https://pub-51ccade1f191417389ac7df61830c670.r2.dev'
).replace(/\/+$/, '');

const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const r2BucketName = process.env.R2_BUCKET_NAME || 'boardly-commons-media';

const firebaseConfigPath = path.resolve('firebase-applet-config.json');
const firebaseConfigJson = fs.existsSync(firebaseConfigPath)
  ? JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'))
  : {
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316',
      appId: process.env.VITE_FIREBASE_APP_ID || '1:556734245207:web:4797f3915b424209b03612',
      apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'auth.boardly.cfd',
      firestoreDatabaseId:
        process.env.VITE_FIREBASE_DATABASE_ID ||
        'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712',
      storageBucket:
        process.env.VITE_FIREBASE_STORAGE_BUCKET ||
        'gen-lang-client-0365509316.firebasestorage.app',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '556734245207',
    };

const app = initializeApp(firebaseConfigJson);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);

let s3Client = null;
let PutObjectCommand = null;
if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
  try {
    const s3Mod = await import('@aws-sdk/client-s3');
    PutObjectCommand = s3Mod.PutObjectCommand;
    s3Client = new s3Mod.S3Client({
      region: 'auto',
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });
  } catch {
    s3Client = null;
  }
}

function buildSlug(id, title) {
  const cleanTitle = String(title || 'post')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return `${id}-${cleanTitle || 'post'}`;
}

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '0';
  if (typeof val === 'boolean') return val ? '1' : '0';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function toEpochMs(ts) {
  if (!ts) return Date.now();
  if (typeof ts === 'number') return ts;
  if (typeof ts?.toMillis === 'function') return ts.toMillis();
  if (typeof ts?.seconds === 'number') return ts.seconds * 1000;
  const parsed = Date.parse(String(ts));
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

async function reconstructFirestoreAttachment(rawUrl, fallbackId, totalChunksHint) {
  let prefix = fallbackId || '';
  let totalChunks = Number(totalChunksHint || 0);

  if (rawUrl.startsWith('firestore://')) {
    const withoutScheme = rawUrl
      .slice('firestore://'.length)
      .replace(/^commons_attachments\//, '');
    const parts = withoutScheme.split('/');
    prefix = parts[0] || prefix;
    if (parts[1] && !Number.isNaN(parseInt(parts[1], 10))) {
      totalChunks = parseInt(parts[1], 10);
    }
  }

  if (!prefix) return null;
  const maxChunks = Math.max(totalChunks || 1, 25);
  const chunks = [];

  for (let i = 0; i < maxChunks; i++) {
    const chunkDocId = `${prefix}_${i}`;
    let snap = await getDoc(doc(db, 'commonsPosts', chunkDocId)).catch(() => null);
    if (!snap || !snap.exists()) {
      snap = await getDoc(doc(db, 'posts', chunkDocId)).catch(() => null);
    }
    if (!snap || !snap.exists()) {
      if (i === 0) return null;
      break;
    }
    const d = snap.data();
    const b64 = d?.data || d?.description || d?.dataBase64 || '';
    if (b64) {
      chunks.push(b64);
    }
    if (totalChunks > 0 && i + 1 >= totalChunks) {
      break;
    }
    if (d?.totalChunks && i + 1 >= d.totalChunks) {
      break;
    }
  }

  if (chunks.length === 0) return null;
  return Buffer.from(chunks.join(''), 'base64');
}

async function runMigration() {
  console.log('🚀 Starting Firestore -> Cloudflare D1 + R2 Post Migration...');

  await signInWithEmailAndPassword(
    auth,
    'inspector.dev@boardly.test',
    'InspectorPassword123!'
  ).catch(() => {});

  const localR2Dir = path.resolve('data/r2-bucket/commons/pdfs');
  fs.mkdirSync(localR2Dir, { recursive: true });
  fs.mkdirSync(path.resolve('data'), { recursive: true });
  fs.mkdirSync(path.resolve('cloudflare'), { recursive: true });

  // Paginate all visible posts using the exact Commons feed query
  const visibleDocs = [];
  let lastDoc = null;
  while (true) {
    const constraints = [where('isHidden', '==', false), orderBy('createdAt', 'desc'), limit(40)];
    if (lastDoc) constraints.push(startAfter(lastDoc));
    const snap = await getDocs(query(collection(db, 'commonsPosts'), ...constraints));
    if (snap.empty) break;
    for (const d of snap.docs) {
      const data = d.data();
      if (d.id.startsWith('att_') || data.isAttachmentChunk === true || data.type === 'attachment_chunk') {
        continue;
      }
      if (data.isHidden === true) continue;
      visibleDocs.push({ id: d.id, data });
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < 40) break;
  }

  console.log(`📦 Read ${visibleDocs.length} visible posts from Firestore 'commonsPosts'.`);

  const migratedPosts = [];
  const sqlStatements = [
    '-- Auto-generated Cloudflare D1 seed file from Firestore commonsPosts migration',
    'BEGIN TRANSACTION;',
  ];

  let reconstructedPdfCount = 0;
  let uploadedR2Count = 0;

  for (const { id, data } of visibleDocs) {
    const rawFiles = Array.isArray(data.files)
      ? data.files
      : Array.isArray(data.attachments)
      ? data.attachments
      : [];

    const migratedFiles = [];

    for (const fileObj of rawFiles) {
      const rawUrl = String(fileObj?.url || '').trim();
      const rawName = String(fileObj?.name || `${id}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const mimeType = String(fileObj?.type || 'application/pdf');

      if (rawUrl.startsWith('firestore://') || fileObj?.fallbackId) {
        const buf = await reconstructFirestoreAttachment(
          rawUrl,
          fileObj.fallbackId,
          fileObj.totalChunks
        );

        if (buf) {
          reconstructedPdfCount++;
          const r2Key = `commons/pdfs/${id}_${rawName}`;
          const localFilePath = path.resolve('data/r2-bucket', r2Key);
          fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
          fs.writeFileSync(localFilePath, buf);

          if (s3Client && PutObjectCommand) {
            await s3Client.send(
              new PutObjectCommand({
                Bucket: r2BucketName,
                Key: r2Key,
                Body: buf,
                ContentType: mimeType,
                CacheControl: 'public, max-age=31536000, immutable',
              })
            );
            uploadedR2Count++;
          }

          const publicR2Url = `${R2_PUBLIC_BASE_URL}/${r2Key}`;
          migratedFiles.push({
            name: fileObj.name || rawName,
            url: publicR2Url,
            r2Key,
            localUrl: `/api/r2/${r2Key}`,
            type: mimeType,
            size: buf.length,
          });
          continue;
        }
      }

      migratedFiles.push({
        name: fileObj.name || rawName,
        url: rawUrl,
        type: mimeType,
        size: Number(fileObj.size || 0),
      });
    }

    const title = String(data.title || 'Untitled Study Resource').trim();
    const description = String(data.description || data.body || data.content || '').trim();
    const slug = buildSlug(id, title);
    const isAnon = Boolean(data.isAnonymous ?? data.anonymous ?? false);
    const createdAtMs = toEpochMs(data.createdAt);
    const updatedAtMs = toEpochMs(data.updatedAt || data.createdAt);
    const tags = Array.isArray(data.tags) ? data.tags : [];

    const d1Post = {
      id,
      slug,
      type: String(data.type || 'notes'),
      title,
      description,
      subject: String(data.subject || 'General'),
      chapter: String(data.chapter || 'General'),
      target: String(data.target || 'General'),
      class_level: String(data.classLevel || data.class || '11'),
      board: String(data.board || 'Federal'),
      format: migratedFiles.length > 0 ? 'pdf' : String(data.format || 'text'),
      tags_json: JSON.stringify(tags),
      files_json: JSON.stringify(migratedFiles),
      is_anonymous: isAnon ? 1 : 0,
      anonymous_alias: String(data.anonymousAlias || 'Anonymous Student'),
      author_uid: isAnon ? null : data.authorUid || null,
      real_author_uid: data.authorUid || data.realAuthorUid || null,
      author_name: isAnon ? 'Anonymous' : String(data.authorName || 'Student'),
      author_avatar: isAnon ? null : data.authorAvatar || null,
      author_frame: isAnon ? null : data.authorFrame || null,
      author_equipped_avatar: isAnon ? null : data.authorEquippedAvatar || null,
      author_photo_url: isAnon ? null : data.authorPhotoURL || null,
      author_role: isAnon ? 'student' : String(data.authorRole || 'student'),
      author_custom_role: isAnon ? null : data.authorCustomRole || null,
      status: String(data.status || 'published'),
      visibility: String(data.visibility || 'public'),
      is_hidden: data.isHidden ? 1 : 0,
      is_pinned: data.isPinned ? 1 : 0,
      is_featured: data.isFeatured ? 1 : 0,
      upvotes: Number(data.upvotes ?? data.likesCount ?? 0),
      downvotes: Number(data.downvotes ?? 0),
      views: Number(data.views ?? data.viewsCount ?? 0),
      comment_count: Number(data.commentCount ?? data.commentsCount ?? 0),
      save_count: Number(data.saveCount ?? data.savesCount ?? 0),
      shares_count: Number(data.sharesCount ?? 0),
      report_count: Number(data.reportCount ?? 0),
      created_at: createdAtMs,
      updated_at: updatedAtMs,
    };

    migratedPosts.push(d1Post);

    sqlStatements.push(
      `INSERT OR REPLACE INTO posts (
        id, slug, type, title, description, subject, chapter, target,
        class_level, board, format, tags_json, files_json, is_anonymous,
        anonymous_alias, author_uid, real_author_uid, author_name,
        author_avatar, author_frame, author_equipped_avatar, author_photo_url,
        author_role, author_custom_role, status, visibility, is_hidden,
        is_pinned, is_featured, upvotes, downvotes, views, comment_count,
        save_count, shares_count, report_count, created_at, updated_at
      ) VALUES (
        ${sqlEscape(d1Post.id)}, ${sqlEscape(d1Post.slug)}, ${sqlEscape(d1Post.type)},
        ${sqlEscape(d1Post.title)}, ${sqlEscape(d1Post.description)}, ${sqlEscape(d1Post.subject)},
        ${sqlEscape(d1Post.chapter)}, ${sqlEscape(d1Post.target)}, ${sqlEscape(d1Post.class_level)},
        ${sqlEscape(d1Post.board)}, ${sqlEscape(d1Post.format)}, ${sqlEscape(d1Post.tags_json)},
        ${sqlEscape(d1Post.files_json)}, ${d1Post.is_anonymous}, ${sqlEscape(d1Post.anonymous_alias)},
        ${sqlEscape(d1Post.author_uid)}, ${sqlEscape(d1Post.real_author_uid)}, ${sqlEscape(d1Post.author_name)},
        ${sqlEscape(d1Post.author_avatar)}, ${sqlEscape(d1Post.author_frame)}, ${sqlEscape(d1Post.author_equipped_avatar)},
        ${sqlEscape(d1Post.author_photo_url)}, ${sqlEscape(d1Post.author_role)}, ${sqlEscape(d1Post.author_custom_role)},
        ${sqlEscape(d1Post.status)}, ${sqlEscape(d1Post.visibility)}, ${d1Post.is_hidden},
        ${d1Post.is_pinned}, ${d1Post.is_featured}, ${d1Post.upvotes}, ${d1Post.downvotes},
        ${d1Post.views}, ${d1Post.comment_count}, ${d1Post.save_count}, ${d1Post.shares_count},
        ${d1Post.report_count}, ${d1Post.created_at}, ${d1Post.updated_at}
      );`
    );
  }

  sqlStatements.push('COMMIT;');

  migratedPosts.sort((a, b) => b.created_at - a.created_at);

  const d1StorePayload = {
    version: 1,
    migratedAt: new Date().toISOString(),
    r2PublicBaseUrl: R2_PUBLIC_BASE_URL,
    posts: migratedPosts,
    likes: [],
    saves: [],
    comments: [],
    reports: [],
    userRoles: [
      {
        uid: 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
        email: 'shsvirtualadmin@gmail.com',
        role: 'superadmin',
        custom_role: 'Super Admin',
        is_posting_banned: 0,
        updated_at: Date.now(),
      },
    ],
  };

  const jsonOutPath = path.resolve('data/cloudflare_d1_posts.json');
  fs.writeFileSync(jsonOutPath, JSON.stringify(d1StorePayload, null, 2), 'utf8');

  const sqlOutPath = path.resolve('cloudflare/d1-seed-posts.sql');
  fs.writeFileSync(sqlOutPath, sqlStatements.join('\n\n'), 'utf8');

  console.log(`✅ Migrated ${migratedPosts.length} visible posts to Cloudflare D1 format.`);
  console.log(
    `📄 Reconstructed ${reconstructedPdfCount} PDFs into R2 bucket key layout (${R2_PUBLIC_BASE_URL}/commons/pdfs/...).`
  );
  if (s3Client) {
    console.log(
      `☁️ Uploaded ${uploadedR2Count} PDFs directly to Cloudflare R2 bucket '${r2BucketName}'.`
    );
  } else {
    console.log(
      `💾 Saved ${reconstructedPdfCount} PDFs to data/r2-bucket/commons/pdfs/ (ready for R2 sync & local serving).`
    );
  }
  console.log(`📝 Wrote D1 seed SQL: ${sqlOutPath}`);
  console.log(`📝 Wrote D1 store JSON: ${jsonOutPath}`);
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
