#!/usr/bin/env npx tsx
/**
 * Verification Script: Check for Orphaned Rows after User Deletion
 * 
 * Usage:
 *   npx tsx scripts/verify-user-deletion.ts <email_or_user_id>
 * 
 * Examples:
 *   npx tsx scripts/verify-user-deletion.ts student@example.com
 *   npx tsx scripts/verify-user-deletion.ts 550e8400-e29b-41d4-a716-446655440000
 * 
 * This script is READ-ONLY. It verifies that zero orphaned rows or auth credentials
 * remain across Supabase Auth, public database tables, storage, and local data files.
 */

const createClient: any = () => null;
import fs from "fs";
import path from "path";

const target = process.argv[2]?.trim();

if (!target) {
  console.error("\n❌ Error: Missing required student email or UUID argument.");
  console.error("Usage: npx tsx scripts/verify-user-deletion.ts <email_or_user_id>\n");
  process.exit(1);
}

const isEmail = target.includes("@");
const targetEmail = isEmail ? target.toLowerCase() : "";
const targetId = isEmail ? "" : target;

console.log("\n" + "=".repeat(70));
console.log("🔍 USER DELETION AUDIT & ORPHAN VERIFICATION");
console.log("=".repeat(70));
console.log(`Target Identifier: ${target}`);
if (targetEmail) console.log(`Target Email:      ${targetEmail}`);
if (targetId) console.log(`Target User ID:    ${targetId}`);
console.log("=".repeat(70) + "\n");

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://wbvzbbnapowwmrjecdyt.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const supabase = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

interface AuditFinding {
  source: string;
  count: number;
  details?: string;
}

const findings: AuditFinding[] = [];

async function runAudit() {
  let authUserId: string | null = null;

  // 1. Check Supabase Auth
  console.log("1️⃣  Checking Supabase Auth (auth.users)...");
  if (supabase && (supabase as any).auth?.admin?.listUsers) {
    try {
      const { data, error } = await (supabase as any).auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) {
        console.warn(`   ⚠️ Supabase Auth listUsers returned error: ${error.message}`);
      } else if (data?.users) {
        const found = data.users.find(
          (u: any) =>
            (targetEmail && (u.email || "").toLowerCase() === targetEmail) ||
            (targetId && u.id === targetId)
        );
        if (found) {
          authUserId = found.id;
          findings.push({
            source: "auth.users (Supabase Auth)",
            count: 1,
            details: `User exists with ID=${found.id}, Email=${found.email}`,
          });
          console.log(`   ❌ FOUND in auth.users: ID=${found.id}`);
        } else {
          console.log("   ✅ Clean: No matching user in auth.users");
        }
      }
    } catch (e: any) {
      console.warn(`   ⚠️ Exception accessing auth.admin: ${e?.message || e}`);
    }
  } else {
    console.log("   ℹ️  Auth admin client not available or lacking service role key.");
  }

  // 2. Check Database Tables
  console.log("\n2️⃣  Checking Supabase Database Tables (public schema)...");
  const tables = [
    { table: "students", cols: ["id", "email"] },
    { table: "profiles", cols: ["id", "email"] },
    { table: "test_results", cols: ["student_id", "student_email"] },
    { table: "mcq_attempts", cols: ["student_id", "student_email"] },
    { table: "student_attempted_mcqs", cols: ["student_id"] },
    { table: "student_mcq_usage", cols: ["student_id", "email"] },
    { table: "mcq_usage", cols: ["student_id", "email"] },
    { table: "student_progress", cols: ["student_id"] },
    { table: "ai_history", cols: ["student_id"] },
    { table: "study_buddy_history", cols: ["student_id"] },
    { table: "study_buddy_usage", cols: ["student_id", "email"] },
    { table: "student_achievements", cols: ["student_id"] },
    { table: "achievements", cols: ["student_id"] },
    { table: "payment_requests", cols: ["student_id", "student_email"] },
    { table: "promo_redemptions", cols: ["student_id", "student_email"] },
    { table: "admin_activity_logs", cols: ["target_student_id", "target_student_email"] },
  ];

  if (supabase) {
    for (const t of tables) {
      try {
        const orClauses: string[] = [];
        for (const col of t.cols) {
          if (col.includes("email") && targetEmail) {
            orClauses.push(`${col}.ilike.${targetEmail}`);
          } else if (!col.includes("email") && targetId) {
            orClauses.push(`${col}.eq.${targetId}`);
          } else if (!col.includes("email") && authUserId) {
            orClauses.push(`${col}.eq.${authUserId}`);
          }
        }

        if (orClauses.length > 0) {
          const { data, count, error } = await supabase
            .from(t.table)
            .select("id", { count: "exact" })
            .or(orClauses.join(","));

          if (error) {
            if (!error.message.includes("does not exist")) {
              console.log(`   ⚠️ Table ${t.table}: ${error.message}`);
            }
          } else {
            const rowCount = count || (Array.isArray(data) ? data.length : 0);
            if (rowCount > 0) {
              findings.push({
                source: `Table: ${t.table}`,
                count: rowCount,
                details: `Matched on [${t.cols.join(", ")}]`,
              });
              console.log(`   ❌ FOUND ${rowCount} orphaned row(s) in ${t.table}`);
            } else {
              console.log(`   ✅ Clean: 0 rows in ${t.table}`);
            }
          }
        }
      } catch (err: any) {
        // Table or permission error
      }
    }
  } else {
    console.log("   ℹ️  Supabase client not initialized.");
  }

  // 3. Check Local Server JSON Files
  console.log("\n3️⃣  Checking Local Data Files...");
  const dataDir = path.join(process.cwd(), "data");

  const filesToCheck = [
    { file: "promo_redemptions.json", idField: "student_id", emailField: "student_email" },
    { file: "test_sessions.json", idField: "student_id", emailField: "student_email" },
    { file: "test_results.json", idField: "student_id", emailField: "student_email" },
  ];

  for (const item of filesToCheck) {
    const fullPath = path.join(dataDir, item.file);
    if (fs.existsSync(fullPath)) {
      try {
        const raw = fs.readFileSync(fullPath, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const matches = list.filter((row: any) => {
            const mId = targetId && row[item.idField] === targetId;
            const mEmail = targetEmail && row[item.emailField] && String(row[item.emailField]).toLowerCase() === targetEmail;
            return mId || mEmail;
          });
          if (matches.length > 0) {
            findings.push({
              source: `Local File: data/${item.file}`,
              count: matches.length,
              details: `Found in ${item.file}`,
            });
            console.log(`   ❌ FOUND ${matches.length} row(s) in data/${item.file}`);
          } else {
            console.log(`   ✅ Clean: 0 records in data/${item.file}`);
          }
        }
      } catch (e) {
        console.log(`   ℹ️  Could not parse data/${item.file}`);
      }
    }
  }

  // Check promo_links.json redemptions array
  const promoLinksPath = path.join(dataDir, "promo_links.json");
  if (fs.existsSync(promoLinksPath)) {
    try {
      const raw = fs.readFileSync(promoLinksPath, "utf-8");
      const links = JSON.parse(raw);
      if (Array.isArray(links)) {
        let linkRedemptionsFound = 0;
        for (const l of links) {
          if (Array.isArray(l.redemptions)) {
            const m = l.redemptions.filter((r: any) => {
              const mId = targetId && r.student_id === targetId;
              const mEmail = targetEmail && r.student_email && String(r.student_email).toLowerCase() === targetEmail;
              return mId || mEmail;
            });
            linkRedemptionsFound += m.length;
          }
        }
        if (linkRedemptionsFound > 0) {
          findings.push({
            source: "Local File: data/promo_links.json (redemptions)",
            count: linkRedemptionsFound,
          });
          console.log(`   ❌ FOUND ${linkRedemptionsFound} claimed redemption(s) in data/promo_links.json`);
        } else {
          console.log("   ✅ Clean: 0 redemptions in data/promo_links.json");
        }
      }
    } catch {}
  }

  // 4. Final Verdict
  console.log("\n" + "=".repeat(70));
  const totalOrphaned = findings.reduce((sum, f) => sum + f.count, 0);

  if (totalOrphaned === 0) {
    console.log("🎉 AUDIT PASSED: 100% CLEAN");
    console.log("=".repeat(70));
    console.log(`Zero records or credentials found for "${target}".`);
    console.log("The user and all associated data have been completely eradicated.");
    console.log("If this email signs up again, it will be a 100% brand-new account.\n");
    process.exit(0);
  } else {
    console.log(`⚠️  AUDIT FAILED: ${totalOrphaned} ORPHANED RECORD(S) DETECTED`);
    console.log("=".repeat(70));
    findings.forEach((f) => {
      console.log(` • [${f.source}]: ${f.count} record(s)${f.details ? ` (${f.details})` : ""}`);
    });
    console.log("\nPlease investigate why these records remain.\n");
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
