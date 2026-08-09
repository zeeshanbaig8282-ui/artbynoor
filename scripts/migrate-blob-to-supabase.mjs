// One-time migration: Vercel Blob -> Supabase Storage
//
// Run this LOCALLY (not on Vercel) with:
//   node scripts/migrate-blob-to-supabase.mjs
//
// Required env vars (put them in a local .env file and load with `node --env-file=.env ...`,
// or export them in your shell before running):
//   BLOB_READ_WRITE_TOKEN       -> from your existing Vercel Blob store settings
//   SUPABASE_URL                -> Project Settings -> API -> Project URL
//   SUPABASE_SERVICE_ROLE_KEY   -> Project Settings -> API -> service_role key (NOT anon key)
//
// Requires @vercel/blob to still be installed (npm install @vercel/blob) — safe to
// remove it after this script has run successfully.

import { list } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'gallery-images';

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return val;
}

const BLOB_TOKEN = requireEnv('BLOB_READ_WRITE_TOKEN');
const SUPABASE_URL = requireEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log(`Migrating from Vercel Blob -> Supabase bucket "${BUCKET}"...\n`);

  let cursor;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  do {
    const { blobs, cursor: nextCursor } = await list({ token: BLOB_TOKEN, cursor });

    for (const blob of blobs) {
      try {
        process.stdout.write(`  ${blob.pathname} ... `);

        const resp = await fetch(blob.url);
        if (!resp.ok) throw new Error(`download failed: HTTP ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(blob.pathname, buffer, {
            contentType: blob.contentType || 'application/octet-stream',
            upsert: true, // safe to re-run this script; re-uploads overwrite rather than fail
          });

        if (error) throw error;

        console.log('done');
        migrated++;
      } catch (err) {
        console.log('FAILED');
        console.error(`    -> ${err.message}`);
        failed++;
      }
    }

    cursor = nextCursor;
  } while (cursor);

  console.log(`\nMigration complete.`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Failed:   ${failed}`);
  if (failed > 0) {
    console.log(`\nRe-run this script to retry — it's safe, existing files will just be overwritten.`);
  }
}

main().catch((err) => {
  console.error('Migration script crashed:', err);
  process.exit(1);
});
