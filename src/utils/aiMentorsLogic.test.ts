import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {
  AI_DEPTHS,
  AI_MENTORS,
  calculateMessageCreditCost,
  getPktDateKey,
  getPktResetInfo,
  prepareApiContents,
  renderAiMarkdownWithKatex,
  stripLatexForSpeech,
  buildChatTitle,
  resolveMentorIdFromParam,
  resolveAiDepthExecution,
  trimContentsForDepth,
  FREE_AI_CREDITS_PER_DAY,
  PRO_AI_CREDITS_PER_DAY,
  PLUS_AI_CREDITS_PER_DAY,
} from './aiMentorsLogic';

test('shared ai-config limits and 6-mentor registry (including Aisha) match spec', () => {
  assert.equal(FREE_AI_CREDITS_PER_DAY, 5);
  assert.equal(PRO_AI_CREDITS_PER_DAY, 50);
  assert.equal(PLUS_AI_CREDITS_PER_DAY, 100);

  assert.equal(AI_MENTORS.length, 6);
  const expectedAvatars = [
    '/ai/noor.webp',
    '/ai/zen.webp',
    '/ai/seher.webp',
    '/ai/hamza.webp',
    '/ai/mahnur.webp',
    '/ai/aisha.webp',
  ];
  AI_MENTORS.forEach((m, idx) => {
    assert.equal(m.id, idx);
    assert.equal(m.avatar, expectedAvatars[idx]);
    assert.ok(m.name.length > 0);
    assert.ok(m.role.length > 0);
    assert.ok((m.systemPrompt || '').length > 10);
  });

  const aisha = AI_MENTORS[5];
  assert.equal(aisha.slug, 'aisha');
  assert.equal(aisha.name, 'Aisha');
});

test('all 6 AI mentors (including Aisha) honor all 4 answer depths through one shared router', () => {
  assert.equal(AI_MENTORS.length, 6);
  assert.equal(AI_DEPTHS.length, 4);

  for (const mentor of AI_MENTORS) {
    const plans = AI_DEPTHS.map((depth) =>
      resolveAiDepthExecution({ mentorId: mentor.id, depthId: depth.id })
    );

    const [quick, balanced, deep, max] = plans;

    // Every depth keeps the exact requested mentor & depth metadata (no special-casing)
    plans.forEach((plan, depthIdx) => {
      assert.equal(plan.mentorId, mentor.id);
      assert.equal(plan.mentorName, mentor.name);
      assert.equal(plan.depthId, depthIdx);
      assert.ok(plan.systemInstruction.includes(mentor.name), `Prompt for ${mentor.name} must include mentor identity`);
      assert.ok(plan.systemInstruction.includes('DEPTH LAW'), `Prompt for ${mentor.name} depth ${depthIdx} must include depth law`);
      assert.equal(plan.baseCost, AI_DEPTHS[depthIdx].baseCost);
    });

    // Credit cost ladder: 1 / 1 / 3 / 5
    assert.equal(quick.baseCost, 1);
    assert.equal(balanced.baseCost, 1);
    assert.equal(deep.baseCost, 3);
    assert.equal(max.baseCost, 5);

    // Quick must be the fastest configuration: flash-lite + MINIMAL thinking + smallest tokens & history
    assert.equal(quick.model, 'gemini-3.1-flash-lite');
    assert.equal(quick.thinkingLevel, 'MINIMAL');
    assert.equal(quick.generationConfig.thinkingConfig?.thinkingLevel, 'MINIMAL');
    assert.ok(quick.maxOutputTokens < balanced.maxOutputTokens);
    assert.ok(quick.maxHistoryMessages < balanced.maxHistoryMessages);
    assert.ok(quick.firstAttemptTimeoutMs < balanced.firstAttemptTimeoutMs);

    // Balanced / Deep / Max scale thinking budget, output tokens, and history window monotonically
    assert.equal(balanced.model, 'gemini-4-hydrogen');
    assert.equal(balanced.thinkingLevel, 'LOW');
    assert.equal(deep.model, 'gemini-4-hydrogen');
    assert.equal(deep.thinkingLevel, 'MEDIUM');
    assert.equal(max.model, 'gemini-4-hydrogen');
    assert.equal(max.thinkingLevel, 'HIGH');

    assert.ok(balanced.maxOutputTokens < deep.maxOutputTokens);
    assert.ok(deep.maxOutputTokens < max.maxOutputTokens);
    assert.ok(balanced.maxHistoryMessages < deep.maxHistoryMessages);
    assert.ok(deep.maxHistoryMessages <= max.maxHistoryMessages);

    // Distinct depth instructions per level
    const uniqueInstructions = new Set(plans.map((p) => p.depthInstruction));
    assert.equal(uniqueInstructions.size, 4);
  }
});

test('trimContentsForDepth caps turns per depth and keeps user-first invariant', () => {
  const longThread = [
    { role: 'user' as const, parts: [{ text: 'Q1' }] },
    { role: 'model' as const, parts: [{ text: 'A1' }] },
    { role: 'user' as const, parts: [{ text: 'Q2' }] },
    { role: 'model' as const, parts: [{ text: 'A2' }] },
    { role: 'user' as const, parts: [{ text: 'Q3' }] },
    { role: 'model' as const, parts: [{ text: 'A3' }] },
    { role: 'user' as const, parts: [{ text: 'Q4' }] },
  ];

  const quickTrimmed = trimContentsForDepth(longThread, 4);
  assert.ok(quickTrimmed.length <= 4);
  assert.equal(quickTrimmed[0].role, 'user');
  assert.equal(quickTrimmed[quickTrimmed.length - 1].parts[0].text, 'Q4');
});

test('calculateMessageCreditCost matches depth, text, photo, PDF, and history rules', () => {
  // Quick / Balanced short message
  assert.equal(
    calculateMessageCreditCost({ depth: 0, textLength: 50, photoCount: 0, pdfCount: 0, historyMessageCount: 0 }).total,
    1
  );
  assert.equal(
    calculateMessageCreditCost({ depth: 1, textLength: 399, photoCount: 0, pdfCount: 0, historyMessageCount: 7 }).total,
    1
  );

  // Text extra: +1 per 400 chars, capped at +3
  assert.equal(
    calculateMessageCreditCost({ depth: 1, textLength: 400 }).textExtra,
    1
  );
  assert.equal(
    calculateMessageCreditCost({ depth: 1, textLength: 2500 }).textExtra,
    3
  );

  // Deep = 3, Max = 5
  assert.equal(
    calculateMessageCreditCost({ depth: 2, textLength: 100 }).total,
    3
  );
  assert.equal(
    calculateMessageCreditCost({ depth: 3, textLength: 100 }).total,
    5
  );

  // Combined: Deep(3) + 800 chars(+2) + 2 photos(+2) + 1 PDF(+2) + 16 msgs(+2) = 11
  const combined = calculateMessageCreditCost({
    depth: 2,
    textLength: 850,
    photoCount: 2,
    pdfCount: 1,
    historyMessageCount: 16,
  });
  assert.equal(combined.baseCost, 3);
  assert.equal(combined.textExtra, 2);
  assert.equal(combined.photoExtra, 2);
  assert.equal(combined.pdfExtra, 2);
  assert.equal(combined.historyExtra, 2);
  assert.equal(combined.total, 11);

  // History capped at +3 even at 40 messages
  assert.equal(
    calculateMessageCreditCost({ depth: 0, textLength: 10, historyMessageCount: 40 }).historyExtra,
    3
  );
});

test('PKT date key and midnight reset calculation', () => {
  // 2026-05-10 18:30:00 UTC = 2026-05-10 23:30:00 PKT -> 30 minutes to midnight
  const ms1 = Date.UTC(2026, 4, 10, 18, 30, 0);
  assert.equal(getPktDateKey(ms1), '2026-05-10');
  const reset1 = getPktResetInfo(ms1);
  assert.equal(reset1.dateKey, '2026-05-10');
  assert.equal(reset1.hoursLeft, 0);
  assert.equal(reset1.minutesLeft, 30);
  assert.equal(reset1.countdownLabel, '30m');

  // 2026-05-10 19:05:00 UTC = 2026-05-11 00:05:00 PKT -> rolled over to May 11!
  const ms2 = Date.UTC(2026, 4, 10, 19, 5, 0);
  assert.equal(getPktDateKey(ms2), '2026-05-11');
});

test('prepareApiContents trims to 12, merges same-role, drops greetings/errors, starts with user', () => {
  const input = [
    { role: 'model' as const, text: 'Assalam-o-Alaikum!', isGreeting: true },
    { role: 'model' as const, text: 'orphan model message' },
    { role: 'user' as const, text: 'Q1' },
    { role: 'user' as const, text: 'Q1 follow-up' },
    { role: 'model' as const, text: 'A1' },
    { role: 'model' as const, text: 'Network error', isError: true },
    { role: 'user' as const, text: 'Q2' },
  ];

  const prepared = prepareApiContents(input, 12);
  assert.equal(prepared.length, 3);
  assert.equal(prepared[0].role, 'user');
  assert.equal(prepared[0].parts.length, 2);
  assert.equal(prepared[1].role, 'model');
  assert.equal(prepared[2].role, 'user');
  assert.equal(prepared[2].parts[0].text, 'Q2');
});

test('renderAiMarkdownWithKatex renders display/inline math, escapes HTML, and renders markdown tables', () => {
  const sample = [
    '### Quadratic Formula',
    'Solve $ax^2 + bx + c = 0$:',
    '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
    '<script>alert(1)</script>',
    '',
    '| Variable | Value |',
    '| --- | --- |',
    '| $a$ | **1** |',
    '| $b$ | `-3` |',
  ].join('\n');

  const html = renderAiMarkdownWithKatex(sample, katex);
  assert.ok(html.includes('class="katex"'), 'Expected KaTeX rendered output');
  assert.ok(html.includes('ai-math-display'), 'Expected display math wrapper');
  assert.ok(!html.includes('<script>'), 'Expected raw script tags to be escaped');
  assert.ok(html.includes('&lt;script&gt;'), 'Expected escaped script text');
  assert.ok(html.includes('<table class="ai-md-table">'), 'Expected real HTML table');
  assert.ok(html.includes('ai-table-scroll-wrap'), 'Expected scrollable table wrapper');
  assert.ok(html.includes('<strong>1</strong>'), 'Expected bold cell text');
  assert.ok(html.includes('<code class="ai-inline-code">-3</code>'), 'Expected inline code');
});

test('stripLatexForSpeech strips math delimiters and markdown cleanly', () => {
  const spoken = stripLatexForSpeech('Use $\\frac{1}{2} mv^2$ and **bold** $\\ce{H2O}$.');
  assert.ok(spoken.includes('1 over 2'));
  assert.ok(spoken.includes('H2O'));
  assert.ok(!spoken.includes('$'));
  assert.ok(!spoken.includes('**'));
});

test('mentor slug/alias resolution (all 6 mentors including Aisha) and chat title truncation', () => {
  assert.equal(resolveMentorIdFromParam('noor'), 0);
  assert.equal(resolveMentorIdFromParam('Zain'), 1);
  assert.equal(resolveMentorIdFromParam('zen'), 1);
  assert.equal(resolveMentorIdFromParam('sehar'), 2);
  assert.equal(resolveMentorIdFromParam('seher'), 2);
  assert.equal(resolveMentorIdFromParam('hamza'), 3);
  assert.equal(resolveMentorIdFromParam('mahnoor'), 4);
  assert.equal(resolveMentorIdFromParam('mahnur'), 4);
  assert.equal(resolveMentorIdFromParam('aisha'), 5);
  assert.equal(resolveMentorIdFromParam('Ayesha'), 5);
  assert.equal(resolveMentorIdFromParam('5'), 5);
  assert.equal(resolveMentorIdFromParam('unknown'), 0);

  const longTitle = buildChatTitle('Explain Kirchhoff voltage law and solve this 3-loop circuit problem in detail please');
  assert.ok(longTitle.length <= 48);
});
