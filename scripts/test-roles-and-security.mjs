import {
  validateNickname,
  validateUsernameFormat,
  isForbiddenAdminRole,
  isReservedUsername,
  normalizeForReservedCheck,
} from '../src/utils/usernameValidation.js';

console.log('=== RUNNING ROLES & SECURITY VALIDATION TESTS ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. ROLE NAME RESTRICTIONS & SPOOFING PREVENTION
console.log('--- Testing Forbidden Admin Roles ---');
assert(isForbiddenAdminRole('Super Admin') === true, 'Blocks "Super Admin"');
assert(isForbiddenAdminRole('Admin') === true, 'Blocks "Admin"');
assert(isForbiddenAdminRole('superadmin') === true, 'Blocks "superadmin"');
assert(isForbiddenAdminRole('Super-Admin') === true, 'Blocks "Super-Admin"');
assert(isForbiddenAdminRole('administrator') === true, 'Blocks "administrator"');
assert(isForbiddenAdminRole('System Admin') === true, 'Blocks "System Admin"');
assert(isForbiddenAdminRole('admin_123') === true, 'Blocks "admin_123"');
assert(isForbiddenAdminRole('Student') === false, 'Allows "Student"');
assert(isForbiddenAdminRole('Teacher') === false, 'Allows "Teacher"');
assert(isForbiddenAdminRole('Parent') === false, 'Allows "Parent"');
assert(isForbiddenAdminRole('Mentor') === false, 'Allows "Mentor"');
assert(isForbiddenAdminRole('Counselor') === false, 'Allows "Counselor"');
assert(isForbiddenAdminRole('Biology Tutor') === false, 'Allows "Biology Tutor"');

// 2. NICKNAME VALIDATION
console.log('\n--- Testing Nickname Validation ---');
assert(validateNickname('Ali').valid === true, 'Allows valid nickname "Ali"');
assert(validateNickname('Dr. Ayesha Khan, MD').valid === true, 'Allows letters, numbers, spaces, and basic punctuation');
assert(validateNickname('A').valid === false, 'Rejects nickname shorter than 2 chars');
assert(validateNickname('A'.repeat(31)).valid === false, 'Rejects nickname longer than 30 chars');
assert(validateNickname('Ali🚀').valid === false, 'Rejects non-basic punctuation / emoji');
assert(validateNickname('shs_official').valid === false && validateNickname('shs_official').isReserved === true, 'Flags reserved word in nickname');

// 3. USERNAME VALIDATION & RESERVED NAMES
console.log('\n--- Testing Username Format & Reserved Names ---');
assert(validateUsernameFormat('ali_123').valid === true, 'Allows valid username "ali_123"');
assert(validateUsernameFormat('ayesha.k').valid === true, 'Allows dots and underscores "ayesha.k"');
assert(validateUsernameFormat('ab').valid === false, 'Rejects username < 3 chars');
assert(validateUsernameFormat('a'.repeat(21)).valid === false, 'Rejects username > 20 chars');
assert(validateUsernameFormat('Ali123').valid === false, 'Rejects uppercase letters');
assert(validateUsernameFormat('ali-123').valid === false, 'Rejects hyphens (only dots and underscores allowed)');
assert(validateUsernameFormat('ali 123').valid === false, 'Rejects spaces in username');

// Reserved words checks
assert(isReservedUsername('boardly_admin') === true, 'Detects "boardly" reserved word');
assert(isReservedUsername('shs_student') === true, 'Detects "shs" reserved word');
assert(isReservedUsername('scholario_hq') === true, 'Detects "scholario" reserved word');
assert(isReservedUsername('shsvirtualacademy') === true, 'Detects "shsvirtualacademy"');
assert(isReservedUsername('superadmin_user') === true, 'Detects "superadmin" reserved word');
assert(validateUsernameFormat('boardly_fan').isReserved === true, 'Marks username as reserved for request workflow');

console.log(`\n=== RESULTS: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) process.exit(1);
