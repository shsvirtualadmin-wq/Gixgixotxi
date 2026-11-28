import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import {
  AI_DEPTHS,
  AI_MENTORS,
  AISHA_MENTOR_ID,
  buildGraphSvg,
  calculateCallBilling,
  calculateMessageCreditCost,
  canContinueCallMinute,
  extractStreamingPhysicsScene,
  getCallRatePerMinute,
  getDepthBaseCostForMentor,
  getPktDateKey,
  getPktResetInfo,
  hashPhysicsQuestion,
  isGraphOnlyQuery,
  isPhysicsVisualQuery,
  normalizeAndValidateGraph,
  parseStoredPhysicsScene,
  prepareApiContents,
  renderAiMarkdownWithKatex,
  sanitizeAnimationSvg,
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
  selectVoiceForMentor,
} from './voiceInput';
import { isPreviewAdHost, resolveLandingAdVideoMode } from '../config/ads';

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

test('Aisha name, avatar, role, and saved chat history (alive SVG + graph scene) survive reload round-trip', () => {
  const sampleScene = {
    title: 'Car Velocity-Time Motion',
    steps: [
      { from: 0, to: 3, narration: 'The car accelerates from 0 to 20 m/s.', equation: 'v = u + at' },
      { from: 3, to: 6, narration: 'It cruises at steady 20 m/s.', equation: 'a = 0' },
      { from: 6, to: 9, narration: 'It brakes smoothly back to 0 m/s.', equation: 'v^2 = u^2 + 2as' },
    ],
    animationSvg:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 240"><rect width="380" height="240" fill="#e0f2fe"/><g class="car"><rect x="20" y="150" width="70" height="28" rx="8" fill="#0284c7"/></g></svg>',
    graph: {
      xLabel: 'Time (s)',
      yLabel: 'Velocity (m/s)',
      xMax: 10,
      yMax: 20,
      points: [[0, 0], [4, 20], [7, 20], [10, 0]],
      phases: [
        { fromIndex: 0, toIndex: 1, label: 'Accelerate' },
        { fromIndex: 1, toIndex: 2, label: 'Cruise' },
        { fromIndex: 2, toIndex: 3, label: 'Brake' },
      ],
    },
  };

  const reloaded = JSON.parse(
    JSON.stringify({
      id: 'chat_aisha_reload_1',
      mentor: AISHA_MENTOR_ID,
      title: sampleScene.title,
      updatedAt: 1764000000000,
      messages: [
        { role: 'user', text: 'Draw velocity-time graph of a car accelerating, cruising, and braking' },
        { role: 'model', text: JSON.stringify(sampleScene) },
      ],
    })
  );

  const mentorAfterReload = AI_MENTORS[reloaded.mentor];
  assert.equal(mentorAfterReload.name, 'Aisha');
  assert.equal(mentorAfterReload.avatar, '/ai/aisha.webp');
  assert.equal(mentorAfterReload.role, 'Visual Physics Tutor');

  const restored = parseStoredPhysicsScene(reloaded.messages[1].text);
  assert.ok(restored);
  assert.equal(restored?.steps.length, 3);
  assert.equal(restored?.totalDuration, 9);
  assert.ok(restored?.animationSvg.startsWith('<svg'));
  assert.equal(restored?.graph?.phases.length, 3);
});

test('AI full-screen overlay, 44px close button, SVG sanitizer, invalid fallback, connected v-t graph, and landing ad fallback', () => {
  // 1. Full-screen overlay + >=44px X close button
  const overlaySrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/ai/AiMentorsOverlay.tsx'),
    'utf8'
  );
  assert.ok(overlaySrc.includes('fixed inset-0') && overlaySrc.includes('h-[100dvh]'));
  assert.ok(!overlaySrc.includes('lg:max-w-[1040px]') && !overlaySrc.includes('lg:h-[86vh]'));
  assert.ok(overlaySrc.includes('data-ai-close-button="true"'));
  assert.ok(overlaySrc.includes('min-h-[44px] min-w-[44px]'));
  assert.ok(overlaySrc.includes('onClick={onClose}'));

  // 2. SVG sanitizer blocks <script>, <foreignObject>, on* attributes, external URLs, and >6KB SVGs
  assert.equal(
    sanitizeAnimationSvg('<svg viewBox="0 0 380 240"><script>alert(1)</script><rect width="10" height="10"/></svg>').ok,
    false
  );
  assert.equal(
    sanitizeAnimationSvg('<svg viewBox="0 0 380 240"><rect onclick="steal()" width="10" height="10"/></svg>').ok,
    false
  );
  assert.equal(
    sanitizeAnimationSvg('<svg viewBox="0 0 380 240"><foreignObject><div>x</div></foreignObject></svg>').ok,
    false
  );
  assert.equal(
    sanitizeAnimationSvg('<svg viewBox="0 0 380 240"><a href="https://evil.example"><rect width="10" height="10"/></a></svg>').ok,
    false
  );
  assert.equal(
    sanitizeAnimationSvg(`<svg viewBox="0 0 380 240">${'<rect width="1" height="1"/>'.repeat(300)}</svg>`).ok,
    false
  );

  // 3. Invalid SVG fails validation -> triggers retry/text fallback (never raw code)
  assert.equal(validatePhysicsScene('not json at all', 5).valid, false);
  assert.equal(validatePhysicsScene('{"title":"Empty","steps":[{"from":0,"to":3,"narration":"Hi","equation":""}],"animationSvg":""}', 5).valid, false);
  assert.equal(
    validatePhysicsScene(
      JSON.stringify({
        title: 'Unsafe',
        steps: [{ from: 0, to: 3, narration: 'Hi', equation: '' }],
        animationSvg: '<svg viewBox="0 0 380 240" onload="alert(1)"><circle cx="50" cy="50" r="10"/></svg>',
      }),
      5
    ).valid,
    false
  );

  // Streaming narration extracts steps before SVG completes
  const partial = extractStreamingPhysicsScene(
    '{"title":"Free Fall","steps":[{"from":0,"to":3,"narration":"Drop ball from rest.","equation":"v = gt"}],"animationSvg":"<svg',
    5
  );
  assert.ok(partial);
  assert.equal(partial?.steps.length, 1);
  assert.equal(partial?.isComplete, false);

  // 4. Velocity-time graph (accelerate, cruise, brake): ONE set of axes + ONE connected polyline + touching phases
  const graph = normalizeAndValidateGraph({
    xLabel: 'Time (s)',
    yLabel: 'Velocity (m/s)',
    xMax: 10,
    yMax: 20,
    points: [[7, 20], [0, 0], [10, 0], [4, 20]], // deliberately unsorted to verify auto-repair
    phases: [
      { fromIndex: 0, toIndex: 1, label: 'Accelerate' },
      { fromIndex: 1, toIndex: 2, label: 'Cruise' },
      { fromIndex: 2, toIndex: 3, label: 'Brake' },
    ],
  });
  assert.ok(graph);
  assert.deepEqual(graph?.points, [[0, 0], [4, 20], [7, 20], [10, 0]]);
  for (let i = 1; i < (graph?.phases.length || 0); i++) {
    assert.equal(graph!.phases[i].fromIndex, graph!.phases[i - 1].toIndex);
  }
  const svg = buildGraphSvg(graph!, { totalDuration: 9, activePhase: 1 });
  assert.equal((svg.match(/data-axis="x"/g) || []).length, 1);
  assert.equal((svg.match(/data-axis="y"/g) || []).length, 1);
  assert.equal((svg.match(/data-connected-curve="true"/g) || []).length, 1);
  assert.ok(svg.includes('Accelerate') && svg.includes('Cruise') && svg.includes('Brake'));
  assert.equal(sanitizeAnimationSvg(svg).ok, true);
  assert.equal(isGraphOnlyQuery('Draw only a velocity-time graph'), true);

  // Cache hash deterministic across punctuation/case/whitespace
  assert.equal(hashPhysicsQuestion('Explain Projectile Motion! ', 1), hashPhysicsQuestion('explain   projectile motion?', 1));
  assert.notEqual(hashPhysicsQuestion('explain projectile motion', 1), hashPhysicsQuestion('explain projectile motion', 2));
  assert.equal(isPhysicsVisualQuery('Salam!'), false);
  assert.equal(isPhysicsVisualQuery('Explain projectile motion at 30 degrees'), true);

  // 5. Landing ad card shows animated promo when unset, plays real video when set, and shows error+retry on failure
  assert.equal(isPreviewAdHost('ais-dev-abc.us-west1.run.app', true), true);
  assert.equal(isPreviewAdHost('boardly.cfd', false), false);
  assert.equal(resolveLandingAdVideoMode({ videoUrl: '' }), 'animated');
  assert.equal(resolveLandingAdVideoMode({ videoUrl: 'https://cdn.boardly.cfd/ad.mp4', loadFailed: true }), 'error');
  assert.equal(resolveLandingAdVideoMode({ videoUrl: 'https://cdn.boardly.cfd/ad.mp4', loadFailed: false }), 'video');
});

test('voice input error mapper returns exact friendly message for every microphone error type and in-app browser', () => {
  assert.equal(
    mapMicrophoneError({ error: 'not-allowed' }, { logToConsole: false }).message,
    VOICE_ERROR_MESSAGES.notAllowed
  );
  assert.equal(
    mapMicrophoneError({ error: 'service-not-allowed' }, { logToConsole: false }).message,
    VOICE_ERROR_MESSAGES.notAllowed
  );
  assert.equal(
    mapMicrophoneError({ error: 'network' }, { logToConsole: false }).message,
    VOICE_ERROR_MESSAGES.network
  );
  assert.equal(
    mapMicrophoneError({ error: 'audio-capture' }, { logToConsole: false }).message,
    VOICE_ERROR_MESSAGES.audioCapture
  );
  assert.equal(
    mapMicrophoneError({ name: 'NotReadableError' }, { logToConsole: false }).message,
    VOICE_ERROR_MESSAGES.audioCapture
  );
  assert.equal(
    mapMicrophoneError({ error: 'no-speech' }, { logToConsole: false }).message,
    VOICE_ERROR_MESSAGES.noSpeech
  );
  assert.equal(
    mapMicrophoneError({ error: 'language-not-supported' }, { logToConsole: false }).code,
    'language-not-supported'
  );
  assert.equal(
    mapMicrophoneError(
      { name: 'NotAllowedError' },
      { userAgent: 'Mozilla/5.0 Instagram 312.0', logToConsole: false }
    ).message,
    VOICE_ERROR_MESSAGES.inAppBrowser
  );
  assert.equal(isInAppBrowser('Mozilla/5.0 Instagram 312.0'), true);
  assert.equal(isInAppBrowser('Mozilla/5.0 WhatsApp/2.24'), true);
  assert.equal(isInAppBrowser('Mozilla/5.0 Chrome/126.0.0.0 Mobile Safari/537.36'), false);

  assert.equal(resolveVoiceLanguage({ draftText: 'فزکس کا سوال' }), 'ur-PK');
  assert.equal(resolveVoiceLanguage({ draftText: 'Find acceleration' }), 'en-US');
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

test('female voice selection, call credit exhaustion, per-started-minute billing, and animated landing ad fallback', () => {
  // 1. Female voice selected when available; pitch raised to ~1.15 when only male/neutral voice exists
  assert.equal(AI_MENTORS[AISHA_MENTOR_ID].voice, 'female');
  assert.equal(AI_MENTORS[1].voice, 'male');
  assert.equal(AI_MENTORS[3].voice, 'male');
  const pickedFemale = selectVoiceForMentor({
    voices: [
      { name: 'Microsoft David Desktop', lang: 'en-US', default: true },
      { name: 'Microsoft Zira Desktop', lang: 'en-US' },
    ],
    gender: 'female',
    lang: 'en-US',
  });
  assert.equal(pickedFemale.voice?.name, 'Microsoft Zira Desktop');
  assert.equal(pickedFemale.matchedGender, true);
  assert.equal(pickedFemale.pitch, 1.0);

  const fallbackPitch = selectVoiceForMentor({
    voices: [{ name: 'Microsoft David Desktop', lang: 'en-US', default: true }],
    gender: 'female',
    lang: 'en-US',
  });
  assert.equal(fallbackPitch.matchedGender, false);
  assert.equal(fallbackPitch.pitch, 1.15);

  // 2. Call ends when credits run out or daily minutes hit 0
  assert.deepEqual(
    canContinueCallMinute({ creditsLeft: 2, isUnlimited: false, depthId: 1, callMinutesLeft: 5 }),
    { ok: false, reason: 'INSUFFICIENT_CREDITS', needed: 3 }
  );
  assert.deepEqual(
    canContinueCallMinute({ creditsLeft: 50, isUnlimited: false, depthId: 0, callMinutesLeft: 0 }),
    { ok: false, reason: 'DAILY_LIMIT_REACHED', needed: 2 }
  );
  assert.equal(
    canContinueCallMinute({ creditsLeft: 3, isUnlimited: false, depthId: 1, callMinutesLeft: 1 }).ok,
    true
  );

  // 3. Call billing is strictly per started minute (Quick 2, Balanced 3, Deep 5, Max 8) and 0 if unanswered
  assert.equal(getCallRatePerMinute(0), 2);
  assert.equal(getCallRatePerMinute(1), 3);
  assert.equal(getCallRatePerMinute(2), 5);
  assert.equal(getCallRatePerMinute(3), 8);
  assert.deepEqual(calculateCallBilling({ elapsedSec: 15, depthId: 1, answered: true }), {
    startedMinutes: 1,
    creditsCharged: 3,
    ratePerMin: 3,
  });
  assert.deepEqual(calculateCallBilling({ elapsedSec: 61, depthId: 2, answered: true }), {
    startedMinutes: 2,
    creditsCharged: 10,
    ratePerMin: 5,
  });
  assert.deepEqual(calculateCallBilling({ elapsedSec: 45, depthId: 3, answered: false }), {
    startedMinutes: 0,
    creditsCharged: 0,
    ratePerMin: 8,
  });

  // 4. Ad card shows animated promo when no video URL is set, and real video when set
  assert.equal(resolveLandingAdVideoMode({ videoUrl: '' }), 'animated');
  assert.equal(resolveLandingAdVideoMode({ videoUrl: 'https://cdn.boardly.cfd/promo.mp4' }), 'video');
});

