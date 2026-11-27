import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  stripLeadingChapterNumber,
  formatChapterTitleWithNumber,
  splitCompoundFormulaLatex,
  buildEnlargedFormulaPool,
} from '../utils/formulaVaultDisplay';

// 1. Duplicate chapter number prevention
assert.equal(stripLeadingChapterNumber('Number System', 1), 'Number System');
assert.equal(stripLeadingChapterNumber('1 Number System', 1), 'Number System');
assert.equal(stripLeadingChapterNumber('01. Number System', 1), 'Number System');
assert.equal(stripLeadingChapterNumber('01 - Number System', 1), 'Number System');
assert.equal(stripLeadingChapterNumber('Chapter 1: Number System', 1), 'Number System');
assert.equal(stripLeadingChapterNumber('1st Law of Motion', 1), '1st Law of Motion');
assert.equal(stripLeadingChapterNumber('2D Kinematics', 3), '2D Kinematics');

assert.equal(formatChapterTitleWithNumber(1, 'Number System'), '01 Number System');
assert.equal(formatChapterTitleWithNumber(1, '1 Number System'), '01 Number System');
assert.equal(formatChapterTitleWithNumber(14, '014. Percentages'), '14 Percentages');

// 2. Compound formula splitting for responsive wrapping (never splits inside braces/environments)
assert.deepEqual(
  splitCompoundFormulaLatex(
    '\\operatorname{HCF} = \\frac{\\operatorname{HCF}(\\text{numerators})}{\\operatorname{LCM}(\\text{denominators})}, \\qquad \\operatorname{LCM} = \\frac{\\operatorname{LCM}(\\text{numerators})}{\\operatorname{HCF}(\\text{denominators})}'
  ),
  [
    '\\operatorname{HCF} = \\frac{\\operatorname{HCF}(\\text{numerators})}{\\operatorname{LCM}(\\text{denominators})},',
    '\\operatorname{LCM} = \\frac{\\operatorname{LCM}(\\text{numerators})}{\\operatorname{HCF}(\\text{denominators})}',
  ]
);

assert.deepEqual(
  splitCompoundFormulaLatex(
    'u_{\\text{mp}} = \\sqrt{\\frac{2RT}{M}}, \\qquad u_{\\text{avg}} = \\sqrt{\\frac{8RT}{\\pi M}}, \\qquad u_{\\text{mp}} : u_{\\text{avg}} : u_{\\text{rms}} = 1 : 1.128 : 1.225'
  ),
  [
    'u_{\\text{mp}} = \\sqrt{\\frac{2RT}{M}},',
    'u_{\\text{avg}} = \\sqrt{\\frac{8RT}{\\pi M}},',
    'u_{\\text{mp}} : u_{\\text{avg}} : u_{\\text{rms}} = 1 : 1.128 : 1.225',
  ]
);

// Must NOT split inside \begin{cases}...\end{cases}
const casesLatex =
  'T(n) = \\begin{cases} \\Theta(n^{\\log_b a}) & \\text{if } a \\\\ \\Theta(f(n)) & \\text{if } b \\end{cases}';
assert.deepEqual(splitCompoundFormulaLatex(casesLatex), [casesLatex]);

// 3. Enlarged dialog pager pool builds full sorted chapter list (e.g. 21 formulas)
const chapter21 = Array.from({ length: 21 }, (_, idx) => ({
  id: `form_ch1_${idx + 1}`,
  formula_no: idx + 1,
  sort_order: idx + 1,
}));
const target = chapter21[6]; // formula #7 of 21
const pool = buildEnlargedFormulaPool(target, [...chapter21].reverse());
assert.equal(pool.length, 21);
assert.equal(pool.findIndex((f) => f.id === target.id), 6);

// Ensures target is included even if missing from candidates
const extraTarget = { id: 'form_extra', formula_no: 22, sort_order: 22 };
const mergedPool = buildEnlargedFormulaPool(extraTarget, chapter21);
assert.equal(mergedPool.length, 22);
assert.equal(mergedPool[21].id, 'form_extra');

// 4. Static regression checks on FormulaVaultPage.tsx & src/index.css
const rootDir = path.resolve(process.cwd());
const pageSrc = fs.readFileSync(
  path.join(rootDir, 'src/pages/formulas/FormulaVaultPage.tsx'),
  'utf8'
);
const cssSrc = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf8');

// Chapter button does not render `{chapter.chapter_no} {chapter.title}` next to the padded badge
assert.doesNotMatch(
  pageSrc,
  /\{chapter\.chapter_no\}\s+\{chapter\.title\}/,
  'Chapter button must not duplicate chapter_no next to the padded number badge'
);

// Formula of the Day no longer hardcodes `[formulaOfTheDay]` single-item pool
assert.doesNotMatch(
  pageSrc,
  /handleOpenEnlarged\(\s*formulaOfTheDay\s*,\s*\[formulaOfTheDay\]/,
  'Formula of the Day must load its full chapter pool instead of a 1-item array'
);
assert.match(
  pageSrc,
  /hydrateChapterPool:\s*true/,
  'Formula of the Day must hydrate its full chapter formula pool'
);

// Enlarged dialog uses FitFormulaMath variant="enlarged" and CSS does not fade-clip formula text
assert.match(
  pageSrc,
  /<FitFormulaMath[\s\S]*?variant="enlarged"/,
  'Enlarged dialog must use FitFormulaMath with variant="enlarged"'
);
assert.doesNotMatch(
  cssSrc,
  /\.formula-math-scroll--overflow/,
  'Right-edge fade mask must not clip formula text'
);

console.log('formulaVaultDisplay tests passed!');
