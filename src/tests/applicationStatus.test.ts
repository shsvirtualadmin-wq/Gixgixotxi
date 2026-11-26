import assert from 'node:assert/strict';
import {
  normalizeApplicationStatus,
  isPendingApplicationStatus,
  normalizeCaptainApplicationDoc,
  normalizeCrewApplicationDoc,
  filterApplicationsByStatus,
  countPendingApplications,
} from '../lib/applicationStatus';

// 1. Status normalization handles mixed casing from CaptainApplyPage ('Pending') & CrewApplyPage ('pending')
assert.equal(normalizeApplicationStatus('Pending'), 'pending');
assert.equal(normalizeApplicationStatus('PENDING'), 'pending');
assert.equal(normalizeApplicationStatus('pending'), 'pending');
assert.equal(normalizeApplicationStatus(' pending '), 'pending');
assert.equal(normalizeApplicationStatus('submitted'), 'pending');
assert.equal(normalizeApplicationStatus('under_review'), 'pending');
assert.equal(normalizeApplicationStatus(undefined), 'pending');
assert.equal(normalizeApplicationStatus(null), 'pending');

assert.equal(normalizeApplicationStatus('approved'), 'approved');
assert.equal(normalizeApplicationStatus('Approved'), 'approved');
assert.equal(normalizeApplicationStatus('APPROVED'), 'approved');

assert.equal(normalizeApplicationStatus('rejected'), 'rejected');
assert.equal(normalizeApplicationStatus('Rejected'), 'rejected');
assert.equal(normalizeApplicationStatus('REJECTED'), 'rejected');

assert.equal(isPendingApplicationStatus('Pending'), true);
assert.equal(isPendingApplicationStatus('approved'), false);
assert.equal(isPendingApplicationStatus('rejected'), false);

// 2. CaptainApplyPage payload shape normalization
const captainFromForm = normalizeCaptainApplicationDoc('uid-123', {
  id: 'uid-123',
  type: 'captain',
  userId: 'uid-123',
  studentName: 'Hashir Khan',
  fullName: 'Hashir Khan',
  email: 'applicant@example.com',
  phone: '03001234567',
  institution: 'QAU',
  university: 'QAU',
  grade: 'University Undergraduate',
  city: 'rawalpindi',
  statement: 'I want to lead a study crew at QAU.',
  status: 'Pending',
  createdAt: { seconds: 1730000000 },
});

assert.equal(captainFromForm.status, 'pending');
assert.equal(captainFromForm.name, 'Hashir Khan');
assert.equal(captainFromForm.university, 'QAU');
assert.equal(captainFromForm.motivation, 'I want to lead a study crew at QAU.');
assert.equal(captainFromForm.semester, 'University Undergraduate');
assert.equal(captainFromForm.userId, 'uid-123');

// 3. CrewApplyPage payload shape normalization
const crewFromForm = normalizeCrewApplicationDoc('crew-doc-1', {
  userId: 'uid-456',
  fullName: 'Amina Tariq',
  email: 'amina@example.com',
  phone: '03211234567',
  institution: 'PGC Lahore',
  city: 'Lahore',
  promotionPlan: 'Weekly mock sessions with classmates.',
  status: 'pending',
});

assert.equal(crewFromForm.status, 'pending');
assert.equal(crewFromForm.name, 'Amina Tariq');
assert.equal(crewFromForm.college, 'PGC Lahore');
assert.equal(crewFromForm.whyCrew, 'Weekly mock sessions with classmates.');

// 4. Overview pending count matches /admin/applications pending filter exactly
const mixedDocs = [
  captainFromForm,
  normalizeCaptainApplicationDoc('uid-2', {
    email: 'done@example.com',
    university: 'NUST',
    status: 'approved',
  }),
  normalizeCaptainApplicationDoc('uid-3', {
    email: 'declined@example.com',
    university: 'FAST',
    status: 'REJECTED',
  }),
];

const pendingFiltered = filterApplicationsByStatus(mixedDocs, 'pending');
const overviewCount = countPendingApplications(mixedDocs);
assert.equal(pendingFiltered.length, 1);
assert.equal(overviewCount, pendingFiltered.length);

// After approving the pending doc, both count and pending list drop to 0
const afterApprove = mixedDocs.map((item) =>
  item.id === captainFromForm.id ? { ...item, status: 'approved' as const } : item
);
assert.equal(filterApplicationsByStatus(afterApprove, 'pending').length, 0);
assert.equal(countPendingApplications(afterApprove), 0);

console.log('ALL applicationStatus TESTS PASSED');
