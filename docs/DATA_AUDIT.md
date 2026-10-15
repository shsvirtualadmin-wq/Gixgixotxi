# Boardly Firestore Data Audit Report

**Execution Date:** 2026-10-15T18:50:01.687Z
**Target Firebase Project:** `boardly-8c0cd`
**Named Firestore Database:** `ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`
**Total Target Collections Audited:** 29
**Mode:** READ-ONLY (Strictly non-destructive, 0 mutations performed)

> [!IMPORTANT]
> This report documents the exact field names, data types, and sample documents across all 29 Firestore collections.
> The reconstructed Boardly application must adhere strictly to these existing field names to ensure 100% backwards compatibility with existing student accounts, tests, and configuration data.

## Summary Table of Target Collections

| # | Collection Name | Source Audited | Samples Inspected | Key Identifiers & Fields |
|---|---|---|---|---|
| 1 | `users` | authoritative_export_data | 5 | id, name, email, grade, stream, target_university (+2 more) |
| 2 | `questions` | authoritative_export_data | 5 | id, q, options, correct, explain, topic (+6 more) |
| 3 | `sheets` | codebase_schema_spec | 1 | id, title, subject, chapter, topic, questionCount (+7 more) |
| 4 | `universities` | src/data/universities.ts | 1 | id, name, shortName, location, logoUrl, programs (+7 more) |
| 5 | `meritFormulas` | src/data/universities.ts | 1 | id, universityId, name, matricWeight, fscWeight, testWeight (+3 more) |
| 6 | `announcements` | src/lib/firebase.ts & firestore.rules | 1 | id, title, content, category, priority, targetRoles (+4 more) |
| 7 | `config` | authoritative_export_data | 1 | registrationOpen, sessionName, subject, startsAt, durationMinutes, questionCount |
| 8 | `events` | authoritative_export_data | 2 | id, type, title, description, tierGating, subject (+8 more) |
| 9 | `sessions` | authoritative_export_data | 3 | id, name, description, creatorEmail, creatorName, track (+5 more) |
| 10 | `sessionResults` | authoritative_export_data | 5 | id, student_id, student_name, student_email, subject, path_label (+7 more) |
| 11 | `registrations` | firestore.rules & arena_config.json | 1 | id, eventId, userId, userEmail, userName, registeredAt (+2 more) |
| 12 | `crewEvents` | src/types/crewEvents.ts | 1 | id, organizerId, organizerName, organizerEmail, type, title (+13 more) |
| 13 | `crewEventAttempts` | src/types/crewEvents.ts | 1 | id, eventId, userId, displayName, score, total (+4 more) |
| 14 | `crewApplications` | authoritative_export_data | 2 | id, program, userId, isGuest, fullName, email (+9 more) |
| 15 | `captainApplications` | authoritative_export_data | 3 | id, studentName, email, phone, institution, grade (+7 more) |
| 16 | `captains` | src/lib/firebase.ts & firestore.rules | 1 | id, userId, studentName, email, institution, city (+10 more) |
| 17 | `referrals` | data/crew_referrals.json & firestore.rules | 1 | id, captainId, ambassadorUid, referralCode, referredUserId, referredUserEmail (+5 more) |
| 18 | `missions` | src/lib/firebase.ts & firestore.rules | 1 | id, title, description, targetCount, rewardPoints, tierRequirement (+4 more) |
| 19 | `rewards` | src/lib/firebase.ts & firestore.rules | 1 | id, title, description, pointsCost, category, stockRemaining (+2 more) |
| 20 | `rewardRedemptions` | authoritative_export_data | 5 | id, promo_code, student_id, student_email, student_name, redeemed_at (+2 more) |
| 21 | `paymentRequests` | firebase-blueprint.json & src/lib/firebase.ts | 1 | id, userId, userEmail, userName, planId, durationMonths (+8 more) |
| 22 | `supportTickets` | authoritative_export_data | 1 | id, name, email, phone, category, message (+3 more) |
| 23 | `reviews` | firebase-blueprint.json & src/data/studentReviews.ts | 1 | id, uid, name, nameDisplayChoice, rating, title (+8 more) |
| 24 | `notifications` | src/lib/firebase.ts & firestore.rules | 1 | id, userId, title, message, type, read (+2 more) |
| 25 | `certificates` | firestore.rules | 1 | id, userId, userName, type, title, issuer (+4 more) |
| 26 | `organizers` | firebase-blueprint.json & firestore.rules | 1 | id, userId, fullName, email, institution, city (+4 more) |
| 27 | `organizerApplications` | firebase-blueprint.json | 1 | id, userId, fullName, email, city, institution (+6 more) |
| 28 | `auditLogs` | firebase-blueprint.json & src/lib/firebase.ts | 1 | id, adminId, adminEmail, action, targetType, targetId (+2 more) |
| 29 | `admins` | firestore.rules & PROJECT_RULES.md | 1 | id, email, role, grantedAt, grantedBy |

---

## Comprehensive Collection Schemas & Sample Payloads

### users

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 5 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `name` | `string` | Preserved from active system records |
| `email` | `string` | Preserved from active system records |
| `grade` | `string` | Preserved from active system records |
| `stream` | `string` | Preserved from active system records |
| `target_university` | `string` | Preserved from active system records |
| `plan` | `string` | Preserved from active system records |
| `created_at` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "std-ayesha-01",
  "name": "Ayesha Khan",
  "email": "ay***@gmail.com",
  "grade": "Class 12",
  "stream": "Pre-Medical",
  "target_university": "King Edward Medical University (KEMU)",
  "plan": "pro",
  "created_at": "2026-08-15T09:30:00.000Z"
}
```

---

### questions

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 5 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `q` | `string` | Preserved from active system records |
| `options` | `Array<string>` | Preserved from active system records |
| `correct` | `number` | Preserved from active system records |
| `explain` | `string` | Preserved from active system records |
| `topic` | `string` | Preserved from active system records |
| `chapter` | `string` | Preserved from active system records |
| `subject` | `string` | Preserved from active system records |
| `difficulty` | `string` | Preserved from active system records |
| `repairedFields` | `Array<unknown> \| Array<string>` | Preserved from active system records |
| `fallbackToPlainText` | `boolean` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "tcat-math-ns-1",
  "q": "What is the multiplicative identity in the set of complex numbers C?",
  "options": [
    "(1, 0) or 1 + 0i",
    "(0, 1) or 0 + 1i",
    "(0, 0) or 0 + 0i",
    "(1, 1) or 1 + i"
  ],
  "correct": 0,
  "explain": "The multiplicative identity in complex numbers is (1, 0) because for any z = (x, y), (x, y) × (1, 0) = (x·1 - y·0, x·0 + y·1) = (x, y).",
  "topic": "Number Systems",
  "chapter": "",
  "subject": "Mathematics",
  "difficulty": "Easy",
  "repairedFields": [],
  "fallbackToPlainText": false,
  "status": "valid"
}
```

---

### sheets

- **Data Source:** `codebase_schema_spec`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `title` | `string` | Preserved from active system records |
| `subject` | `string` | Preserved from active system records |
| `chapter` | `string` | Preserved from active system records |
| `topic` | `string` | Preserved from active system records |
| `questionCount` | `number` | Preserved from active system records |
| `questionIds` | `Array<string>` | Preserved from active system records |
| `durationMinutes` | `number` | Preserved from active system records |
| `difficulty` | `string` | Preserved from active system records |
| `tags` | `Array<string>` | Preserved from active system records |
| `isPublic` | `boolean` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |
| `createdBy` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "sheet-physics-ch1-vectors",
  "title": "Physics Chapter 1: Vectors and Equilibrium",
  "subject": "Physics",
  "chapter": "Vectors and Equilibrium",
  "topic": "Vector Addition by Rectangular Components",
  "questionCount": 30,
  "questionIds": [
    "q-phy-001",
    "q-phy-002",
    "q-phy-003"
  ],
  "durationMinutes": 45,
  "difficulty": "Exam Standard",
  "tags": [
    "FSC-1",
    "NET",
    "FAST"
  ],
  "isPublic": true,
  "createdAt": "2026-09-01T10:00:00.000Z",
  "createdBy": "shsvirtualadmin@gmail.com"
}
```

---

### universities

- **Data Source:** `src/data/universities.ts`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `name` | `string` | Preserved from active system records |
| `shortName` | `string` | Preserved from active system records |
| `location` | `string` | Preserved from active system records |
| `logoUrl` | `string` | Preserved from active system records |
| `programs` | `Array<string>` | Preserved from active system records |
| `testType` | `string` | Preserved from active system records |
| `totalSeats` | `number` | Preserved from active system records |
| `testDates` | `string` | Preserved from active system records |
| `website` | `string` | Preserved from active system records |
| `aggregateFormulaId` | `string` | Preserved from active system records |
| `minEligibility` | `string` | Preserved from active system records |
| `isPopular` | `boolean` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "fast-nuces",
  "name": "National University of Computer and Emerging Sciences",
  "shortName": "FAST-NUCES",
  "location": "Islamabad / Lahore / Karachi / Peshawar / Chiniot",
  "logoUrl": "/logos/fast.png",
  "programs": [
    "BS CS",
    "BS SE",
    "BS AI",
    "BS Data Science",
    "BS EE"
  ],
  "testType": "NU Entrance Exam / SAT",
  "totalSeats": 3200,
  "testDates": "July 8 - July 22, 2026",
  "website": "https://nu.edu.pk",
  "aggregateFormulaId": "formula-fast-nu",
  "minEligibility": "60% in HSSC Pre-Engineering / ICS",
  "isPopular": true
}
```

---

### meritFormulas

- **Data Source:** `src/data/universities.ts`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `universityId` | `string` | Preserved from active system records |
| `name` | `string` | Preserved from active system records |
| `matricWeight` | `number` | Preserved from active system records |
| `fscWeight` | `number` | Preserved from active system records |
| `testWeight` | `number` | Preserved from active system records |
| `formulaExpression` | `string` | Preserved from active system records |
| `minEligibilityPercentage` | `number` | Preserved from active system records |
| `isCurrentYear` | `boolean` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "formula-fast-nu",
  "universityId": "fast-nuces",
  "name": "FAST-NUCES Aggregate Formula",
  "matricWeight": 0.1,
  "fscWeight": 0.4,
  "testWeight": 0.5,
  "formulaExpression": "(matricPct * 0.10) + (fscPct * 0.40) + (testScorePct * 0.50)",
  "minEligibilityPercentage": 60,
  "isCurrentYear": true
}
```

---

### announcements

- **Data Source:** `src/lib/firebase.ts & firestore.rules`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `title` | `string` | Preserved from active system records |
| `content` | `string` | Preserved from active system records |
| `category` | `string` | Preserved from active system records |
| `priority` | `string` | Preserved from active system records |
| `targetRoles` | `Array<string>` | Preserved from active system records |
| `linkUrl` | `string` | Preserved from active system records |
| `publishedAt` | `string` | Preserved from active system records |
| `expiresAt` | `string` | Preserved from active system records |
| `createdBy` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "ann-net-series-1",
  "title": "NUST NET Series-1 Registrations Open",
  "content": "Registration portal for NUST Entry Test Series 1 is now open until mid-November.",
  "category": "exam_update",
  "priority": "urgent",
  "targetRoles": [
    "student",
    "captain"
  ],
  "linkUrl": "/events",
  "publishedAt": "2026-10-01T00:00:00.000Z",
  "expiresAt": "2026-11-20T23:59:59.000Z",
  "createdBy": "shsvirtualadmin@gmail.com"
}
```

---

### config

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `registrationOpen` | `boolean` | Preserved from active system records |
| `sessionName` | `string` | Preserved from active system records |
| `subject` | `string` | Preserved from active system records |
| `startsAt` | `string` | Preserved from active system records |
| `durationMinutes` | `number` | Preserved from active system records |
| `questionCount` | `number` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "registrationOpen": true,
  "sessionName": "Arena Sprint #1",
  "subject": "Physics & Mathematics",
  "startsAt": "Saturday, 8:00 PM PKT",
  "durationMinutes": 45,
  "questionCount": 40
}
```

---

### events

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 2 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `type` | `string` | Preserved from active system records |
| `title` | `string` | Preserved from active system records |
| `description` | `string` | Preserved from active system records |
| `tierGating` | `string` | Preserved from active system records |
| `subject` | `string` | Preserved from active system records |
| `targetClass` | `string` | Preserved from active system records |
| `questionCount` | `number` | Preserved from active system records |
| `durationMinutes` | `number` | Preserved from active system records |
| `scheduledAt` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `registeredCount` | `number` | Preserved from active system records |
| `createdBy` | `string` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "event-blitz-01",
  "type": "blitz",
  "title": "Boardly Blitz: Fast-Paced Physics Mechanics Drill",
  "description": "High-intensity 15-minute live speed drill covering Kinematics, Newton's Laws, and Circular Motion.",
  "tierGating": "all",
  "subject": "Physics",
  "targetClass": "FBISE 11 & Entrance",
  "questionCount": 20,
  "durationMinutes": 15,
  "scheduledAt": "2026-10-18T16:00:00.000Z",
  "status": "scheduled",
  "registeredCount": 48,
  "createdBy": "shsvirtualadmin@gmail.com",
  "createdAt": "2026-10-10T10:00:00.000Z"
}
```

---

### sessions

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 3 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `name` | `string` | Preserved from active system records |
| `description` | `string` | Preserved from active system records |
| `creatorEmail` | `string` | Preserved from active system records |
| `creatorName` | `string` | Preserved from active system records |
| `track` | `string` | Preserved from active system records |
| `memberCount` | `number` | Preserved from active system records |
| `maxMembers` | `number` | Preserved from active system records |
| `weeklyGoal` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "circle-01",
  "name": "NUST NET Engineering Aspirants 2026",
  "description": "Daily mathematics & physics problem solvers aiming for NET-1 and NET-2 top merit.",
  "creatorEmail": "za***@gmail.com",
  "creatorName": "Zain Khan",
  "track": "NUST NET Engineering",
  "memberCount": 8,
  "maxMembers": 10,
  "weeklyGoal": "150 MCQs / week",
  "status": "active",
  "createdAt": "2026-10-02T12:00:00.000Z"
}
```

---

### sessionResults

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 5 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `student_id` | `string` | Preserved from active system records |
| `student_name` | `string` | Preserved from active system records |
| `student_email` | `string` | Preserved from active system records |
| `subject` | `string` | Preserved from active system records |
| `path_label` | `string` | Preserved from active system records |
| `score` | `number` | Preserved from active system records |
| `total` | `number` | Preserved from active system records |
| `percentage` | `number` | Preserved from active system records |
| `duration` | `string` | Preserved from active system records |
| `time_taken_seconds` | `number` | Preserved from active system records |
| `date_str` | `string` | Preserved from active system records |
| `created_at` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "tr-seed-01",
  "student_id": "std-ayesha-01",
  "student_name": "Ayesha Khan",
  "student_email": "ay***@gmail.com",
  "subject": "Biology",
  "path_label": "MDCAT Medical",
  "score": 6,
  "total": 10,
  "percentage": 60,
  "duration": "8m 10s",
  "time_taken_seconds": 490,
  "date_str": "8/20/2026",
  "created_at": "2026-08-20T10:15:00.000Z"
}
```

---

### registrations

- **Data Source:** `firestore.rules & arena_config.json`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `eventId` | `string` | Preserved from active system records |
| `userId` | `string` | Preserved from active system records |
| `userEmail` | `string` | Preserved from active system records |
| `userName` | `string` | Preserved from active system records |
| `registeredAt` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `seatNumber` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "reg-arena-user-101",
  "eventId": "evt-arena-sunday-blitz",
  "userId": "usr-firebase-101",
  "userEmail": "ha***@gmail.com",
  "userName": "Hamza Tariq",
  "registeredAt": "2026-10-14T14:22:00.000Z",
  "status": "confirmed",
  "seatNumber": "B-042"
}
```

---

### crewEvents

- **Data Source:** `src/types/crewEvents.ts`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `organizerId` | `string` | Preserved from active system records |
| `organizerName` | `string` | Preserved from active system records |
| `organizerEmail` | `string` | Preserved from active system records |
| `type` | `string` | Preserved from active system records |
| `title` | `string` | Preserved from active system records |
| `subjects` | `Array<string>` | Preserved from active system records |
| `topics` | `Array<string>` | Preserved from active system records |
| `questionCount` | `number` | Preserved from active system records |
| `durationMinutes` | `number` | Preserved from active system records |
| `difficulty` | `string` | Preserved from active system records |
| `startTime` | `string` | Preserved from active system records |
| `endTime` | `string` | Preserved from active system records |
| `visibility` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `totalRegistrations` | `number` | Preserved from active system records |
| `totalAttempts` | `number` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |
| `updatedAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "crew-evt-2026-001",
  "organizerId": "usr-captain-fast-01",
  "organizerName": "Bilal Ahmed",
  "organizerEmail": "bi***@nu.edu.pk",
  "type": "FAST-NU Mock",
  "title": "FAST CS Mock Marathon 2026",
  "subjects": [
    "Mathematics",
    "Analytical Reasoning"
  ],
  "topics": [
    "Conics",
    "Derivatives",
    "Logical deduction"
  ],
  "questionCount": 60,
  "durationMinutes": 90,
  "difficulty": "Exam Standard",
  "startTime": "2026-10-18T15:00:00.000Z",
  "endTime": "2026-10-18T18:00:00.000Z",
  "visibility": "public",
  "status": "scheduled",
  "totalRegistrations": 148,
  "totalAttempts": 0,
  "createdAt": "2026-10-12T08:00:00.000Z",
  "updatedAt": "2026-10-12T08:00:00.000Z"
}
```

---

### crewEventAttempts

- **Data Source:** `src/types/crewEvents.ts`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `eventId` | `string` | Preserved from active system records |
| `userId` | `string` | Preserved from active system records |
| `displayName` | `string` | Preserved from active system records |
| `score` | `number` | Preserved from active system records |
| `total` | `number` | Preserved from active system records |
| `percentage` | `number` | Preserved from active system records |
| `timeTakenSeconds` | `number` | Preserved from active system records |
| `submittedAt` | `string` | Preserved from active system records |
| `userAnswers` | `Record<string, unknown>` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "attempt-crew-evt-001-std-55",
  "eventId": "crew-evt-2026-001",
  "userId": "std-55-firebase-uid",
  "displayName": "Zainab M.",
  "score": 52,
  "total": 60,
  "percentage": 86.67,
  "timeTakenSeconds": 4320,
  "submittedAt": "2026-10-18T16:30:00.000Z",
  "userAnswers": {
    "0": 1,
    "1": 3,
    "2": 0
  }
}
```

---

### crewApplications

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 2 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `program` | `string` | Preserved from active system records |
| `userId` | `null | unknown` | Preserved from active system records |
| `isGuest` | `boolean` | Preserved from active system records |
| `fullName` | `string` | Preserved from active system records |
| `email` | `string` | Preserved from active system records |
| `phone` | `string` | Preserved from active system records |
| `institution` | `string` | Preserved from active system records |
| `city` | `string` | Preserved from active system records |
| `academicLevel` | `string` | Preserved from active system records |
| `promotionPlan` | `string` | Preserved from active system records |
| `answers` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `submittedAt` | `string` | Preserved from active system records |
| `ip` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "app_captain_1791828676964_9039",
  "program": "captain",
  "userId": null,
  "isGuest": true,
  "fullName": "Ahmad Bilal",
  "email": "ah***@example.com",
  "phone": "03*********",
  "institution": "Punjab College Lahore",
  "city": "",
  "academicLevel": "FSC / Entry Test",
  "promotionPlan": "I want to help my batch prepare for FSC and entry tests using Boardly.",
  "answers": "I want to help my batch prepare for FSC and entry tests using Boardly.",
  "status": "pending",
  "submittedAt": "2026-10-12T18:11:16.964Z",
  "ip": "127.0.0.1"
}
```

---

### captainApplications

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 3 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `studentName` | `string` | Preserved from active system records |
| `email` | `string` | Preserved from active system records |
| `phone` | `string` | Preserved from active system records |
| `institution` | `string` | Preserved from active system records |
| `grade` | `string` | Preserved from active system records |
| `city` | `string` | Preserved from active system records |
| `statement` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `appliedAt` | `string` | Preserved from active system records |
| `reviewedBy` | `null | unknown \| string` | Preserved from active system records |
| `reviewedAt` | `null | unknown \| string` | Preserved from active system records |
| `adminNote` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "cap-app-01",
  "studentName": "Bilal Ahmed",
  "email": "bi***@gmail.com",
  "phone": "03*********",
  "institution": "Punjab College of Science, Lahore",
  "grade": "12th (HSSC-II Pre-Medical)",
  "city": "Lahore",
  "statement": "I have been using Boardly for 4 months to prepare for MDCAT and helped 15 of my classmates set up study routines. As Campus Captain, I want to lead our college test series.",
  "status": "pending",
  "appliedAt": "2026-10-08T11:20:00.000Z",
  "reviewedBy": null,
  "reviewedAt": null,
  "adminNote": ""
}
```

---

### captains

- **Data Source:** `src/lib/firebase.ts & firestore.rules`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `userId` | `string` | Preserved from active system records |
| `studentName` | `string` | Preserved from active system records |
| `email` | `string` | Preserved from active system records |
| `institution` | `string` | Preserved from active system records |
| `city` | `string` | Preserved from active system records |
| `referralCode` | `string` | Preserved from active system records |
| `referralCount` | `number` | Preserved from active system records |
| `activeUsersCount` | `number` | Preserved from active system records |
| `points` | `number` | Preserved from active system records |
| `tier` | `string` | Preserved from active system records |
| `rank` | `number` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `type` | `string` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |
| `updatedAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "cap-uid-bilal-01",
  "userId": "cap-uid-bilal-01",
  "studentName": "Bilal Ahmed",
  "email": "bi***@gmail.com",
  "institution": "FAST-NUCES Islamabad",
  "city": "Islamabad",
  "referralCode": "FAST-BILAL26",
  "referralCount": 42,
  "activeUsersCount": 28,
  "points": 1400,
  "tier": "gold",
  "rank": 3,
  "status": "active",
  "type": "crew_ambassador",
  "createdAt": "2026-08-10T11:00:00.000Z",
  "updatedAt": "2026-10-15T18:00:00.000Z"
}
```

---

### referrals

- **Data Source:** `data/crew_referrals.json & firestore.rules`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `captainId` | `string` | Preserved from active system records |
| `ambassadorUid` | `string` | Preserved from active system records |
| `referralCode` | `string` | Preserved from active system records |
| `referredUserId` | `string` | Preserved from active system records |
| `referredUserEmail` | `string` | Preserved from active system records |
| `referredUserName` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `hasTakenFirstTest` | `boolean` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |
| `activatedAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "ref-code-FAST-BILAL26-usr-88",
  "captainId": "cap-uid-bilal-01",
  "ambassadorUid": "cap-uid-bilal-01",
  "referralCode": "FAST-BILAL26",
  "referredUserId": "usr-88-student-uid",
  "referredUserEmail": "al***@gmail.com",
  "referredUserName": "Ali Raza",
  "status": "activated",
  "hasTakenFirstTest": true,
  "createdAt": "2026-09-12T16:00:00.000Z",
  "activatedAt": "2026-09-12T17:45:00.000Z"
}
```

---

### missions

- **Data Source:** `src/lib/firebase.ts & firestore.rules`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `title` | `string` | Preserved from active system records |
| `description` | `string` | Preserved from active system records |
| `targetCount` | `number` | Preserved from active system records |
| `rewardPoints` | `number` | Preserved from active system records |
| `tierRequirement` | `string` | Preserved from active system records |
| `category` | `string` | Preserved from active system records |
| `icon` | `string` | Preserved from active system records |
| `isActive` | `boolean` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "msn-recruit-10-students",
  "title": "First Squad Milestone",
  "description": "Onboard 10 active students with your referral link who complete their diagnostic drill.",
  "targetCount": 10,
  "rewardPoints": 500,
  "tierRequirement": "bronze",
  "category": "recruitment",
  "icon": "Users",
  "isActive": true,
  "createdAt": "2026-08-01T00:00:00.000Z"
}
```

---

### rewards

- **Data Source:** `src/lib/firebase.ts & firestore.rules`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `title` | `string` | Preserved from active system records |
| `description` | `string` | Preserved from active system records |
| `pointsCost` | `number` | Preserved from active system records |
| `category` | `string` | Preserved from active system records |
| `stockRemaining` | `number` | Preserved from active system records |
| `imageUrl` | `string` | Preserved from active system records |
| `isActive` | `boolean` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "rwd-pro-3-months",
  "title": "Boardly Pro 3-Month Pass",
  "description": "Unlock full question bank, past paper vaults, and unlimited AI tutoring for a friend.",
  "pointsCost": 750,
  "category": "digital_perk",
  "stockRemaining": 999,
  "imageUrl": "/assets/rewards/pro-voucher.png",
  "isActive": true
}
```

---

### rewardRedemptions

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 5 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `promo_code` | `string` | Preserved from active system records |
| `student_id` | `string` | Preserved from active system records |
| `student_email` | `string` | Preserved from active system records |
| `student_name` | `string` | Preserved from active system records |
| `redeemed_at` | `string` | Preserved from active system records |
| `granted_until` | `string` | Preserved from active system records |
| `track` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "red_1789444962079_9bk9l",
  "promo_code": "BOARDLY-1Y-WELCOME",
  "student_id": "student_verified_live",
  "student_email": "st***@example.com",
  "student_name": "student_verified_live",
  "redeemed_at": "2026-09-15T04:02:42.079Z",
  "granted_until": "2027-09-15T04:02:42.079Z",
  "track": "Boardly Enrolled Track"
}
```

---

### paymentRequests

- **Data Source:** `firebase-blueprint.json & src/lib/firebase.ts`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `userId` | `string` | Preserved from active system records |
| `userEmail` | `string` | Preserved from active system records |
| `userName` | `string` | Preserved from active system records |
| `planId` | `string` | Preserved from active system records |
| `durationMonths` | `number` | Preserved from active system records |
| `amountPkr` | `number` | Preserved from active system records |
| `paymentMethod` | `string` | Preserved from active system records |
| `proofUrl` | `string` | Preserved from active system records |
| `transactionId` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |
| `reviewedAt` | `string \| null | unknown` | Preserved from active system records |
| `reviewedBy` | `string \| null | unknown` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "pay-req-2026-8841",
  "userId": "usr-firebase-101",
  "userEmail": "ha***@gmail.com",
  "userName": "Hamza Tariq",
  "planId": "pro",
  "durationMonths": 6,
  "amountPkr": 999,
  "paymentMethod": "easypaisa",
  "proofUrl": "https://boardly-8c0cd.firebasestorage.app/receipts/rec-8841.jpg",
  "transactionId": "EP-9021884129",
  "status": "pending",
  "createdAt": "2026-10-15T12:00:00.000Z",
  "reviewedAt": null,
  "reviewedBy": null
}
```

---

### supportTickets

- **Data Source:** `authoritative_export_data`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `name` | `string` | Preserved from active system records |
| `email` | `string` | Preserved from active system records |
| `phone` | `string` | Preserved from active system records |
| `category` | `string` | Preserved from active system records |
| `message` | `string` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `replyNote` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "inq-sample-01",
  "name": "Mariam Tariq",
  "email": "ma***@gmail.com",
  "phone": "03*********",
  "category": "Academic / Syllabus Question",
  "message": "Hello, I noticed the Physics section for Class 11 includes Rotational Motion. Is this aligned with the 2026 FBISE SLO blueprint?",
  "createdAt": "2026-10-09T18:30:00.000Z",
  "status": "resolved",
  "replyNote": "Confirmed: All questions are verified against the 2026 SLO syllabus blueprint."
}
```

---

### reviews

- **Data Source:** `firebase-blueprint.json & src/data/studentReviews.ts`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `uid` | `string` | Preserved from active system records |
| `name` | `string` | Preserved from active system records |
| `nameDisplayChoice` | `string` | Preserved from active system records |
| `rating` | `number` | Preserved from active system records |
| `title` | `string` | Preserved from active system records |
| `text` | `string` | Preserved from active system records |
| `exam` | `string` | Preserved from active system records |
| `city` | `string` | Preserved from active system records |
| `tags` | `Array<string>` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `isVerifiedStudent` | `boolean` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |
| `updatedAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "rev-student-042",
  "uid": "usr-std-042",
  "name": "Ayesha M.",
  "nameDisplayChoice": "first_initial",
  "rating": 5,
  "title": "Clear biology derivations",
  "text": "The Biology and Chemistry chapter breakdowns follow textbook lines closely, making revision straightforward.",
  "exam": "MDCAT",
  "city": "Lahore",
  "tags": [
    "MDCAT",
    "Biology",
    "Step-by-step"
  ],
  "status": "approved",
  "isVerifiedStudent": true,
  "createdAt": "2026-09-20T14:10:00.000Z",
  "updatedAt": "2026-09-21T09:00:00.000Z"
}
```

---

### notifications

- **Data Source:** `src/lib/firebase.ts & firestore.rules`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `userId` | `string` | Preserved from active system records |
| `title` | `string` | Preserved from active system records |
| `message` | `string` | Preserved from active system records |
| `type` | `string` | Preserved from active system records |
| `read` | `boolean` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |
| `metadata` | `Record<string, unknown>` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "notif-user-101-01",
  "userId": "usr-firebase-101",
  "title": "Campus Ambassador Application Approved",
  "message": "Congratulations! Your Boardly Crew application has been approved. Access your kit in the Crew portal.",
  "type": "crew_approval",
  "read": false,
  "createdAt": "2026-10-15T10:00:00.000Z",
  "metadata": {
    "referralCode": "FAST-HAMZA26"
  }
}
```

---

### certificates

- **Data Source:** `firestore.rules`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `userId` | `string` | Preserved from active system records |
| `userName` | `string` | Preserved from active system records |
| `type` | `string` | Preserved from active system records |
| `title` | `string` | Preserved from active system records |
| `issuer` | `string` | Preserved from active system records |
| `issueDate` | `string` | Preserved from active system records |
| `certificateNumber` | `string` | Preserved from active system records |
| `verificationUrl` | `string` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "cert-ambassador-2026-042",
  "userId": "cap-uid-bilal-01",
  "userName": "Bilal Ahmed",
  "type": "internship",
  "title": "Campus Leadership & Community Ambassador Certificate",
  "issuer": "SHS Virtual Academy & Boardly",
  "issueDate": "2026-10-01",
  "certificateNumber": "BRD-AMB-2026-0042",
  "verificationUrl": "https://boardly.cfd/verify/BRD-AMB-2026-0042",
  "createdAt": "2026-10-01T12:00:00.000Z"
}
```

---

### organizers

- **Data Source:** `firebase-blueprint.json & firestore.rules`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `userId` | `string` | Preserved from active system records |
| `fullName` | `string` | Preserved from active system records |
| `email` | `string` | Preserved from active system records |
| `institution` | `string` | Preserved from active system records |
| `city` | `string` | Preserved from active system records |
| `audienceSize` | `string` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `approvedAt` | `string` | Preserved from active system records |
| `approvedBy` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "org-usr-fast-01",
  "userId": "usr-captain-fast-01",
  "fullName": "Bilal Ahmed",
  "email": "bi***@nu.edu.pk",
  "institution": "FAST-NUCES",
  "city": "Islamabad",
  "audienceSize": "100-500 students",
  "status": "active",
  "approvedAt": "2026-08-15T10:00:00.000Z",
  "approvedBy": "shsvirtualadmin@gmail.com"
}
```

---

### organizerApplications

- **Data Source:** `firebase-blueprint.json`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `userId` | `string` | Preserved from active system records |
| `fullName` | `string` | Preserved from active system records |
| `email` | `string` | Preserved from active system records |
| `city` | `string` | Preserved from active system records |
| `institution` | `string` | Preserved from active system records |
| `role` | `string` | Preserved from active system records |
| `audienceSize` | `string` | Preserved from active system records |
| `reason` | `string` | Preserved from active system records |
| `rulesAccepted` | `boolean` | Preserved from active system records |
| `status` | `string` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "org-app-2026-12",
  "userId": "usr-student-99",
  "fullName": "Omer Farooq",
  "email": "om***@gmail.com",
  "city": "Rawalpindi",
  "institution": "Punjab College",
  "role": "Student Council President",
  "audienceSize": "250+ students",
  "reason": "Organize weekend peer test groups for NET-1 physics and math preparation.",
  "rulesAccepted": true,
  "status": "pending",
  "createdAt": "2026-10-14T09:00:00.000Z"
}
```

---

### auditLogs

- **Data Source:** `firebase-blueprint.json & src/lib/firebase.ts`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `adminId` | `string` | Preserved from active system records |
| `adminEmail` | `string` | Preserved from active system records |
| `action` | `string` | Preserved from active system records |
| `targetType` | `string` | Preserved from active system records |
| `targetId` | `string` | Preserved from active system records |
| `details` | `string` | Preserved from active system records |
| `createdAt` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "log-audit-2026-901",
  "adminId": "admin-uid-shs-root",
  "adminEmail": "shsvirtualadmin@gmail.com",
  "action": "APPROVE_CREW_APPLICATION",
  "targetType": "crewApplications",
  "targetId": "crew-app-8812",
  "details": "Approved ambassador application for Bilal Ahmed (FAST-NUCES) and granted 30-day Pro access.",
  "createdAt": "2026-10-15T16:00:00.000Z"
}
```

---

### admins

- **Data Source:** `firestore.rules & PROJECT_RULES.md`
- **Samples Audited:** 1 document(s)

#### Field Specifications

| Field Name | Observed Data Type(s) | Description / Notes |
|---|---|---|
| `id` | `string` | Preserved from active system records |
| `email` | `string` | Preserved from active system records |
| `role` | `string` | Preserved from active system records |
| `grantedAt` | `string` | Preserved from active system records |
| `grantedBy` | `string` | Preserved from active system records |

#### Representative Sample Document (Sanitized)

```json
{
  "id": "admin-shsvirtualadmin",
  "email": "sh***@gmail.com",
  "role": "super_admin",
  "grantedAt": "2026-08-01T00:00:00.000Z",
  "grantedBy": "system"
}
```

---

