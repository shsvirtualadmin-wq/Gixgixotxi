import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { stripMarkdown } from '../utils/stripMarkdown';
import { maskPublicUserText } from '../utils/privacy';

// 1. Headings (## Overview, #, ###, trailing hashes, setext underlines)
assert.equal(
  stripMarkdown('## Overview\n\nLogarithms are the inverse of exponential functions.'),
  'Overview Logarithms are the inverse of exponential functions.'
);
assert.equal(
  stripMarkdown('# Chapter 3: Logarithms ###\n### Key Laws\nProduct rule and quotient rule.'),
  'Chapter 3: Logarithms Key Laws Product rule and quotient rule.'
);
assert.equal(
  stripMarkdown('Logarithms\n==========\nDefinition and properties.'),
  'Logarithms Definition and properties.'
);

// 2. Bold, italic, bold-italic, strikethrough, inline code
assert.equal(
  stripMarkdown('**Product Rule**: *log(MN)* equals __log(M)__ + _log(N)_ and ~~old~~ `log_b(x)`.'),
  'Product Rule: log(MN) equals log(M) + log(N) and old log_b(x).'
);
assert.equal(
  stripMarkdown('***Important***: **Read _carefully_ before exams.**'),
  'Important: Read carefully before exams.'
);

// 3. Links, images, autolinks, reference links
assert.equal(
  stripMarkdown('See [Laws of Logarithms](https://boardly.cfd/formulas) and ![Graph](https://cdn.example.com/log.png "Log curve").'),
  'See Laws of Logarithms and Graph.'
);
assert.equal(
  stripMarkdown('Check [**Formula Sheet**](https://en.wikipedia.org/wiki/Logarithm_(math)) or **[Guide](https://boardly.cfd/guide)**.'),
  'Check Formula Sheet or Guide.'
);
assert.equal(
  stripMarkdown('Reference [Change of Base][cob] for details.\n\n[cob]: https://boardly.cfd/cob'),
  'Reference Change of Base for details.'
);
assert.equal(
  stripMarkdown('Visit <https://boardly.cfd> for notes.'),
  'Visit https://boardly.cfd for notes.'
);

// 4. Lists, task lists, blockquotes, horizontal rules, code fences, tables
assert.equal(
  stripMarkdown('> **Note:** Always check domain.\n- [x] Product rule\n- Quotient rule\n---\n```math\nlog(10) = 1\n```'),
  'Note: Always check domain. Product rule Quotient rule log(10) = 1'
);
assert.equal(
  stripMarkdown('| Rule | Formula |\n| --- | :---: |\n| Product | log(ab) = log(a) + log(b) |'),
  'Rule Formula Product log(ab) = log(a) + log(b)'
);

// 5. Preserves math notation, snake_case, inequalities, and privacy masks
assert.equal(
  stripMarkdown('For b > 0 and 0 < x < y, log_b(x) < log_b(y) and 2 * 3 * 4 = 24.'),
  'For b > 0 and 0 < x < y, log_b(x) < log_b(y) and 2 * 3 * 4 = 24.'
);
assert.equal(
  stripMarkdown(maskPublicUserText('## Contact\nReach me at **student@example.com** or 0300-1234567')),
  'Contact Reach me at [email hidden] or [phone hidden]'
);

// 6. Null / empty / pure-punctuation edge cases
assert.equal(stripMarkdown(null), '');
assert.equal(stripMarkdown(undefined), '');
assert.equal(stripMarkdown('   \n---\n  '), '');

// 7. Verify Commons search surfaces wire up stripMarkdown
const rootDir = path.resolve(process.cwd());
for (const filePath of [
  'src/components/commons/CommonsSearchModal.tsx',
  'src/pages/SearchPage.tsx',
]) {
  const source = fs.readFileSync(path.join(rootDir, filePath), 'utf8');
  assert.match(
    source,
    /import\s*\{\s*stripMarkdown\s*\}\s*from\s*'@\/utils\/stripMarkdown'/,
    `${filePath} must import stripMarkdown`
  );
  assert.match(
    source,
    /stripMarkdown\(/,
    `${filePath} must strip Markdown from rendered snippets`
  );
}

console.log('stripMarkdown tests passed!');
