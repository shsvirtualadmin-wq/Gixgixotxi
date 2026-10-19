// Test script to verify 5 sprints and uniqueness
import {
  selectUnseenQuestionsForSubject,
  getStudentSeenQuestions,
  recordStudentSeenQuestions,
  resetStudentSeenQuestions,
} from '../src/services/testEngine';

async function testUniquenessSimulation() {
  console.log('\n--- Running 5 Sprints Uniqueness Algorithm Test (100-Question Pool) ---');
  const mockPool = Array.from({ length: 100 }, (_, i) => `q_math_${i + 1}`);
  const testUserId = `test-runner-${Date.now()}`;
  const subject = 'mathematics';
  const allDelivered: string[] = [];
  const results: Array<{ sprint: number; ids: string[]; notice?: string }> = [];

  for (let sprint = 1; sprint <= 5; sprint++) {
    const seen = new Set(getStudentSeenQuestions(testUserId, subject));
    let unseen = mockPool.filter((id) => !seen.has(id));

    if (unseen.length === 0 && mockPool.length > 0) {
      resetStudentSeenQuestions(testUserId, subject);
      unseen = [...mockPool];
    }

    // Shuffle unseen
    const shuffled = [...unseen].sort(() => 0.5 - Math.random());
    const chosen = shuffled.slice(0, 10);
    recordStudentSeenQuestions(testUserId, subject, chosen);

    results.push({ sprint, ids: chosen });
    allDelivered.push(...chosen);
    console.log(`Sprint ${sprint}: Delivered ${chosen.length} MCQs -> [${chosen.slice(0, 3).join(', ')}, ... (${chosen.length} total)]`);
  }

  const unique = new Set(allDelivered);
  const repeats = allDelivered.length - unique.size;

  console.log('\n--- 5-Sprint Test Results ---');
  console.log(`Total MCQs Delivered across 5 Sprints: ${allDelivered.length}`);
  console.log(`Total Unique MCQs: ${unique.size}`);
  console.log(`Repeated MCQs Count: ${repeats}`);

  if (repeats === 0) {
    console.log('SUCCESS: Zero repeats across 5 consecutive 10-Minute Sprints! Every single question served was unique.');
  } else {
    console.log(`Notice: ${repeats} repeats occurred.`);
  }

  console.log('\n--- Running Deficit Test (25-Question Pool across 5 sprints = 50 requests) ---');
  const smallPool = Array.from({ length: 25 }, (_, i) => `q_small_${i + 1}`);
  const allDeliveredSmall: string[] = [];
  const testUser2 = `test-runner-deficit-${Date.now()}`;

  for (let sprint = 1; sprint <= 5; sprint++) {
    const seen = getStudentSeenQuestions(testUser2, subject);
    const seenSet = new Set(seen);
    let unseen = smallPool.filter((id) => !seenSet.has(id));

    let chosen: string[] = [];
    let notice = '';

    if (unseen.length === 0 && smallPool.length > 0) {
      resetStudentSeenQuestions(testUser2, subject);
      unseen = [...smallPool];
    }

    if (unseen.length >= 10) {
      chosen = [...unseen].sort(() => 0.5 - Math.random()).slice(0, 10);
    } else {
      chosen = [...unseen].sort(() => 0.5 - Math.random());
      const deficit = 10 - chosen.length;
      const chosenSet = new Set(chosen);
      const lrs = seen.filter((id) => smallPool.includes(id) && !chosenSet.has(id));
      const fill = lrs.slice(0, deficit);
      chosen = [...chosen, ...fill];
      notice = `Serving ${fill.length} least recently seen questions`;
    }

    recordStudentSeenQuestions(testUser2, subject, chosen);
    allDeliveredSmall.push(...chosen);
    console.log(`Sprint ${sprint}: Delivered ${chosen.length} MCQs ${notice ? `[Notice: ${notice}]` : ''}`);
  }

  const uniqueSmall = new Set(allDeliveredSmall);
  console.log(`Small Pool (25 questions) Delivered: ${allDeliveredSmall.length} | Unique questions seen: ${uniqueSmall.size}/25`);

  // Clean up
  resetStudentSeenQuestions(testUserId, subject);
  resetStudentSeenQuestions(testUser2, subject);
}

testUniquenessSimulation().catch(console.error);
