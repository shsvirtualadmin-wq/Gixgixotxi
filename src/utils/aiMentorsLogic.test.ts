import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {
  AI_DEPTHS,
  AI_MENTORS,
  AISHA_MENTOR_ID,
  calculateMessageCreditCost,
  detectPhysicsTemplate,
  extractStreamingPhysicsScene,
  getDepthBaseCostForMentor,
  getPktDateKey,
  getPktResetInfo,
  hashPhysicsQuestion,
  isPhysicsVisualQuery,
  parseStoredPhysicsScene,
  prepareApiContents,
  renderAiMarkdownWithKatex,
  stripLatexForSpeech,
  buildChatTitle,
  resolveMentorIdFromParam,
  resolveAiDepthExecution,
  trimContentsForDepth,
  validatePhysicsScene,
  FREE_AI_CREDITS_PER_DAY,
  PRO_AI_CREDITS_PER_DAY,
  PLUS_AI_CREDITS_PER_DAY,
} from './aiMentorsLogic';
import {
  VOICE_ERROR_MESSAGES,
  isInAppBrowser,
  mapMicrophoneError,
  resolveVoiceLanguage,
} from './voiceInput';

test('shared ai-config limits and 6-mentor registry (protecting Aisha identity/position/avatar) match spec', () => {
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

  // Protect Aisha's exact identity, role, avatar, and position in the picker
  const aisha = AI_MENTORS[AISHA_MENTOR_ID];
  assert.equal(aisha.id, 5);
  assert.equal(aisha.slug, 'aisha');
  assert.equal(aisha.name, 'Aisha');
  assert.equal(aisha.role, 'Visual Physics Tutor');
  assert.equal(aisha.avatar, '/ai/aisha.webp');
  assert.ok((aisha.systemPrompt || '').includes('You are Aisha, a visual physics tutor'));
  assert.ok(!(aisha.systemPrompt || '').includes('My primary objective as Boardly AI Mentor'));
});

test('all 6 AI mentors honor all 4 answer depths through one shared router with monotonic speed/budget ordering', () => {
  assert.equal(AI_MENTORS.length, 6);
  assert.equal(AI_DEPTHS.length, 4);

  for (const mentor of AI_MENTORS) {
    const isAisha = mentor.id === AISHA_MENTOR_ID;
    const plans = AI_DEPTHS.map((depth) =>
      resolveAiDepthExecution({
        mentorId: mentor.id,
        depthId: depth.id,
        visualMode: isAisha,
        questionText: isAisha ? 'Explain projectile motion at 45 degrees' : '',
      })
    );

    const [quick, balanced, deep, max] = plans;

    // Every depth keeps the exact requested mentor & depth metadata
    plans.forEach((plan, depthIdx) => {
      assert.equal(plan.mentorId, mentor.id);
      assert.equal(plan.mentorName, mentor.name);
      assert.equal(plan.depthId, depthIdx);
      assert.ok(
        plan.systemInstruction.includes(mentor.name),
        `Prompt for ${mentor.name} must include mentor identity`
      );
    });

    // Strict monotonic token & timeout budgets: Quick <= Balanced <= Deep <= Max
    assert.ok(quick.maxOutputTokens <= balanced.maxOutputTokens);
    assert.ok(balanced.maxOutputTokens <= deep.maxOutputTokens);
    assert.ok(deep.maxOutputTokens <= max.maxOutputTokens);
    assert.ok(quick.firstAttemptTimeoutMs <= balanced.firstAttemptTimeoutMs);
    assert.ok(balanced.firstAttemptTimeoutMs <= deep.firstAttemptTimeoutMs);
    assert.ok(deep.firstAttemptTimeoutMs <= max.firstAttemptTimeoutMs);

    if (!isAisha) {
      // Mentors 0..4 MUST remain completely unchanged in behavior, speed, credits, and depth logic
      plans.forEach((plan, depthIdx) => {
        assert.ok(plan.systemInstruction.includes('DEPTH LAW'));
        assert.equal(plan.baseCost, AI_DEPTHS[depthIdx].baseCost);
      });
      assert.equal(quick.baseCost, 1);
      assert.equal(balanced.baseCost, 1);
      assert.equal(deep.baseCost, 3);
      assert.equal(max.baseCost, 5);

      assert.equal(quick.model, 'gemini-3.1-flash-lite');
      assert.equal(quick.thinkingLevel, 'MINIMAL');
      assert.equal(balanced.model, 'gemini-4-hydrogen');
      assert.equal(balanced.thinkingLevel, 'LOW');
      assert.equal(deep.model, 'gemini-4-hydrogen');
      assert.equal(deep.thinkingLevel, 'MEDIUM');
      assert.equal(max.model, 'gemini-4-hydrogen');
      assert.equal(max.thinkingLevel, 'HIGH');
      assert.ok(quick.maxHistoryMessages < balanced.maxHistoryMessages);
      assert.ok(balanced.maxHistoryMessages < deep.maxHistoryMessages);
    } else {
      // Aisha visual depth budgets: Quick 3/1200/2cr, Balanced 5/2000/4cr, Deep 8/3500/8cr, Max 12/5000/12cr
      assert.equal(quick.maxSteps, 3);
      assert.equal(quick.maxOutputTokens, 1200);
      assert.equal(quick.baseCost, 2);
      assert.equal(quick.model, 'gemini-3.1-flash-lite');
      assert.equal(quick.thinkingLevel, 'NONE');
      assert.equal(quick.generationConfig.thinkingConfig, undefined);

      assert.equal(balanced.maxSteps, 5);
      assert.equal(balanced.maxOutputTokens, 2000);
      assert.equal(balanced.baseCost, 4);
      assert.equal(balanced.model, 'gemini-3.1-flash-lite');

      assert.equal(deep.maxSteps, 8);
      assert.equal(deep.maxOutputTokens, 3500);
      assert.equal(deep.baseCost, 8);

      assert.equal(max.maxSteps, 12);
      assert.equal(max.maxOutputTokens, 5000);
      assert.equal(max.baseCost, 12);

      // Aisha always keeps last 10 messages across all 4 depths
      plans.forEach((plan) => {
        assert.equal(plan.maxHistoryMessages, 10);
        assert.equal(plan.responseMimeType, 'application/json');
      });

      // Cache hit cost is flat 1 credit for Aisha
      assert.equal(getDepthBaseCostForMentor(AISHA_MENTOR_ID, 3, { visualMode: true, cacheHit: true }), 1);
    }
  }
});

test('Aisha name, avatar, role, and saved chat history (including physics whiteboard scene) survive reload round-trip', () => {
  const sampleScene = {
    title: 'Projectile Motion at 45°',
    steps: [
      {
        narration: 'Launch the ball with initial speed u at angle 45 degrees.',
        equation: 'v_x = u \\cos 45^\\circ, \\; v_y = u \\sin 45^\\circ',
        shapes: [
          { type: 'line', x1: 30, y1: 205, x2: 370, y2: 205, stroke: '#475569' },
          { type: 'arrow', x1: 50, y1: 205, x2: 115, y2: 140, stroke: '#e11d48', label: 'u' },
          { type: 'circle', cx: 50, cy: 205, r: 8, stroke: '#0ea5e9', fill: '#bae6fd' },
        ],
      },
      {
        narration: 'Gravity pulls it along a symmetric parabolic trajectory to range R.',
        equation: 'R = \\frac{u^2 \\sin 2\\theta}{g}',
        shapes: [
          { type: 'line', x1: 30, y1: 205, x2: 370, y2: 205, stroke: '#475569' },
          { type: 'curve', points: [[50, 205], [200, 55], [350, 205]], stroke: '#0ea5e9' },
          { type: 'label', x: 200, y: 42, text: 'Max Height H', color: '#0f172a' },
        ],
      },
    ],
  };

  // Simulate saving a chat to localStorage/Firestore and reloading
  const serializedChat = JSON.stringify({
    id: 'chat_aisha_reload_1',
    mentor: AISHA_MENTOR_ID,
    title: 'Projectile Motion at 45°',
    updatedAt: 1764000000000,
    messages: [
      { role: 'user', text: 'Explain projectile motion at 45 degrees' },
      { role: 'model', text: JSON.stringify(sampleScene) },
    ],
  });

  const reloaded = JSON.parse(serializedChat);
  const mentorAfterReload = AI_MENTORS[reloaded.mentor];
  assert.equal(mentorAfterReload.name, 'Aisha');
  assert.equal(mentorAfterReload.avatar, '/ai/aisha.webp');
  assert.equal(mentorAfterReload.role, 'Visual Physics Tutor');
  assert.equal(reloaded.messages.length, 2);

  const restoredScene = parseStoredPhysicsScene(reloaded.messages[1].text);
  assert.ok(restoredScene, 'Reloaded Aisha physics scene must parse cleanly');
  assert.equal(restoredScene?.title, 'Projectile Motion at 45°');
  assert.equal(restoredScene?.steps.length, 2);
  assert.equal(restoredScene?.steps[1].shapes[1].type, 'curve');
});

test('Aisha physics schema validation, incremental streaming step parser, caching hash, query classifier, and 7 templates', () => {
  // Streaming incremental extraction draws Step 1 before Step 2 finishes
  const partialStream =
    '{"title":"Free Fall","steps":[{"narration":"Drop ball from rest.","equation":"v = gt","shapes":[{"type":"circle","cx":200,"cy":50,"r":10,"stroke":"#0ea5e9"}]},{"narration":"Accelerating down';
  const partial = extractStreamingPhysicsScene(partialStream, 5);
  assert.ok(partial);
  assert.equal(partial?.title, 'Free Fall');
  assert.equal(partial?.steps.length, 1);
  assert.equal(partial?.isComplete, false);

  // Invalid scene rejected strictly (never charged)
  assert.equal(validatePhysicsScene('not json at all', 5).valid, false);
  assert.equal(validatePhysicsScene('{"title":"No steps","steps":[]}', 5).valid, false);
  assert.equal(
    validatePhysicsScene('{"title":"Bad shape","steps":[{"narration":"Hi","equation":"","shapes":[{"type":"invalid"}]}]}', 5).valid,
    false
  );

  // Normalization & cache hash deterministic across punctuation/case/whitespace
  const h1 = hashPhysicsQuestion('Explain Projectile Motion! ', 1);
  const h2 = hashPhysicsQuestion('explain   projectile motion?', 1);
  const h3 = hashPhysicsQuestion('explain projectile motion', 2);
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);

  // Greetings stay text; physics questions trigger visual mode
  assert.equal(isPhysicsVisualQuery('Salam!'), false);
  assert.equal(isPhysicsVisualQuery('hi how are you?'), false);
  assert.equal(isPhysicsVisualQuery('Explain projectile motion at 30 degrees'), true);
  assert.equal(isPhysicsVisualQuery('Calculate bending moment of a truck on a bridge'), true);

  // All 7 starter templates match cleanly
  assert.equal(detectPhysicsTemplate('projectile launch angle range').key, 'projectile_motion');
  assert.equal(detectPhysicsTemplate('object dropped in free fall').key, 'free_fall');
  assert.equal(detectPhysicsTemplate('truck on bridge bending moment').key, 'bridge_bending_moment');
  assert.equal(detectPhysicsTemplate('water filling a cone tank rate graph').key, 'tank_filling_rate');
  assert.equal(detectPhysicsTemplate('velocity-time graph and distance-time graph').key, 'kinematics_graphs');
  assert.equal(detectPhysicsTemplate('block on an inclined plane with friction').key, 'inclined_plane');
  assert.equal(detectPhysicsTemplate('series and parallel resistor circuit').key, 'simple_circuits');
  assert.equal(detectPhysicsTemplate('quantum tunneling barrier').key, 'free_compose');
});

test('voice input error mapper returns exact friendly message for every microphone error type and in-app browser', () => {
  assert.equal(
    mapMicrophoneError({ name: 'NotAllowedError' }).message,
    VOICE_ERROR_MESSAGES.notAllowed
  );
  assert.equal(
    mapMicrophoneError({ name: 'PermissionDeniedError' }).message,
    VOICE_ERROR_MESSAGES.notAllowed
  );
  assert.equal(
    mapMicrophoneError({ name: 'NotFoundError' }).message,
    VOICE_ERROR_MESSAGES.notFound
  );
  assert.equal(
    mapMicrophoneError({ name: 'NotReadableError' }).message,
    VOICE_ERROR_MESSAGES.notReadable
  );
  assert.equal(
    mapMicrophoneError(
      { name: 'NotAllowedError' },
      { userAgent: 'Mozilla/5.0 Instagram 312.0' }
    ).message,
    VOICE_ERROR_MESSAGES.inAppBrowser
  );
  assert.equal(
    mapMicrophoneError({ name: 'SomeUnknownErr' }, { logToConsole: false }).message,
    VOICE_ERROR_MESSAGES.generic
  );
  assert.equal(isInAppBrowser('Mozilla/5.0 Instagram 312.0'), true);
  assert.equal(isInAppBrowser('Mozilla/5.0 WhatsApp/2.24'), true);
  assert.equal(isInAppBrowser('Mozilla/5.0 Chrome/126.0.0.0 Mobile Safari/537.36'), false);

  assert.equal(resolveVoiceLanguage({ draftText: 'فزکس کا سوال' }), 'ur-PK');
  assert.equal(resolveVoiceLanguage({ preferredLang: 'en-PK', draftText: 'Find acceleration' }), 'en-PK');
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

test('calculateMessageCreditCost matches depth, text, photo, PDF, history, and Aisha visual credit rules', () => {
  // Quick / Balanced short message (mentors 0..4)
  assert.equal(
    calculateMessageCreditCost({ depth: 0, textLength: 50, photoCount: 0, pdfCount: 0, historyMessageCount: 0 }).total,
    1
  );
  assert.equal(
    calculateMessageCreditCost({ depth: 1, textLength: 399, photoCount: 0, pdfCount: 0, historyMessageCount: 7 }).total,
    1
  );

  // Aisha visual credits: Quick=2, Balanced=4, Deep=8, Max=12, Cache hit=1
  assert.equal(calculateMessageCreditCost({ depth: 0, mentorId: AISHA_MENTOR_ID, visualMode: true, textLength: 40 }).total, 2);
  assert.equal(calculateMessageCreditCost({ depth: 1, mentorId: AISHA_MENTOR_ID, visualMode: true, textLength: 40 }).total, 4);
  assert.equal(calculateMessageCreditCost({ depth: 2, mentorId: AISHA_MENTOR_ID, visualMode: true, textLength: 40 }).total, 8);
  assert.equal(calculateMessageCreditCost({ depth: 3, mentorId: AISHA_MENTOR_ID, visualMode: true, textLength: 40 }).total, 12);
  assert.equal(calculateMessageCreditCost({ depth: 3, mentorId: AISHA_MENTOR_ID, visualMode: true, cacheHit: true, textLength: 40 }).total, 1);

  // Text extra: +1 per 400 chars, capped at +3
  assert.equal(
    calculateMessageCreditCost({ depth: 1, textLength: 400 }).textExtra,
    1
  );
  assert.equal(
    calculateMessageCreditCost({ depth: 1, textLength: 2500 }).textExtra,
    3
  );

  // Deep = 3, Max = 5 (mentors 0..4)
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
  const ms1 = Date.UTC(2026, 4, 10, 18, 30, 0);
  assert.equal(getPktDateKey(ms1), '2026-05-10');
  const reset1 = getPktResetInfo(ms1);
  assert.equal(reset1.dateKey, '2026-05-10');
  assert.equal(reset1.hoursLeft, 0);
  assert.equal(reset1.minutesLeft, 30);
  assert.equal(reset1.countdownLabel, '30m');

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
