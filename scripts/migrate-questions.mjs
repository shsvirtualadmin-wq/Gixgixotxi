#!/usr/bin/env node
import { runQuestionsMigration } from './migrate-questions/index.mjs';

runQuestionsMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
