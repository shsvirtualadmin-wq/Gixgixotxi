/**
 * Converts Markdown-formatted post content into clean, readable plain text
 * suitable for search result snippets, preview cards, and meta descriptions.
 *
 * Strips headings (#, ##, ###), bold/italic/strikethrough (**text**, *text*, __text__, _text_, ~~text~~),
 * links ([label](url)), images (![alt](url)), code fences/inline code, blockquotes,
 * list markers, horizontal rules, table pipes, and basic HTML tags while preserving
 * mathematical operators (e.g. 2 * 3, x_1, b > 0, 0 < x < y) and privacy masks like [email hidden].
 */
export function stripMarkdown(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';

  let text = input.replace(/\r\n?/g, '\n');

  // 1. Unwrap fenced code blocks (```lang ... ``` or ~~~lang ... ~~~)
  text = text.replace(
    /^[ \t]{0,3}(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^[ \t]{0,3}\1[ \t]*$/gm,
    (_match, _fence, body: string) => body
  );
  // Remove any leftover unclosed fence markers
  text = text.replace(/^[ \t]{0,3}(?:`{3,}|~{3,})[^\n]*$/gm, '');

  // 2. Remove reference-style link definitions: [ref]: https://example.com "title"
  text = text.replace(/^[ \t]{0,3}\[[^\]]+\]:[ \t]*<?[^\s>]+>?(?:[ \t]+(?:"[^"]*"|'[^']*'|\([^)]*\)))?[ \t]*$/gm, '');

  // 3. Images: ![alt](url "title") and ![alt][ref] -> alt text
  text = text.replace(
    /!\[([^\]]*)\]\(\s*(?:<[^>]*>|(?:[^()\s]+|\([^()\s]*\))+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g,
    '$1'
  );
  text = text.replace(/!\[([^\]]*)\]\[[^\]]*\]/g, '$1');

  // 4. Inline and reference links: [label](url "title") and [label][ref] -> label
  text = text.replace(
    /\[([^\]]+)\]\(\s*(?:<[^>]*>|(?:[^()\s]+|\([^()\s]*\))+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g,
    '$1'
  );
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');

  // Autolinks: <https://...> or <mailto:...>
  text = text.replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/gi, '$1');

  // 5. Setext heading underlines & horizontal rules
  text = text.replace(/^[ \t]{0,3}(?:={2,}|-{2,})[ \t]*$/gm, '');
  text = text.replace(/^[ \t]{0,3}(?:[-*_][ \t]*){3,}$/gm, '');

  // 6. ATX headings: # Title, ## Overview, ### Subheading ###
  text = text.replace(/^[ \t]{0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/gm, '$1');
  text = text.replace(/^[ \t]{0,3}#{1,6}[ \t]*$/gm, '');

  // 7. Blockquotes: > quote or >> nested quote
  text = text.replace(/^[ \t]{0,3}(?:>[ \t]?)+/gm, '');

  // 8. Markdown tables: remove separator lines and flatten pipe delimiters on pipe-formatted rows
  text = text.replace(/^[ \t]*\|?(?:[ \t]*:?-{3,}:?[ \t]*\|)+[ \t]*:?-{3,}:?[ \t]*\|?[ \t]*$/gm, '');
  text = text.replace(/^[ \t]*\|(.+)\|[ \t]*$/gm, (_m, row: string) =>
    row
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean)
      .join(' ')
  );

  // 9. Task lists and unordered list markers
  text = text.replace(/^[ \t]*[-*+][ \t]+\[[ xX]\][ \t]+/gm, '');
  text = text.replace(/^[ \t]*[-*+][ \t]+/gm, '');

  // 10. Inline code spans: ``code`` or `code`
  text = text.replace(/(`+)([\s\S]*?)\1/g, (_m, _ticks, code: string) => code.trim());

  // 11. Inline emphasis / bold / strikethrough (2 passes for nested styles like **bold _italic_**)
  for (let pass = 0; pass < 2; pass++) {
    text = text.replace(/~~([^\s~](?:[^~\n]*[^\s~])?)~~/g, '$1');
    text = text.replace(/\*\*\*([^\s*](?:[^*\n]*[^\s*])?)\*\*\*/g, '$1');
    text = text.replace(/(?<![\p{L}\p{N}])___([^\s_](?:[^_\n]*[^\s_])?)___(?![\p{L}\p{N}])/gu, '$1');
    text = text.replace(/\*\*([^\s*](?:[^*\n]*[^\s*])?)\*\*/g, '$1');
    text = text.replace(/(?<![\p{L}\p{N}])__([^\s_](?:[^_\n]*[^\s_])?)__(?![\p{L}\p{N}])/gu, '$1');
    text = text.replace(/\*([^\s*](?:[^*\n]*[^\s*])?)\*/g, '$1');
    text = text.replace(/(?<![\p{L}\p{N}])_([^\s_](?:[^_\n]*[^\s_])?)_(?![\p{L}\p{N}])/gu, '$1');
  }

  // 12. Strip valid HTML tags while leaving math comparisons (e.g. "0 < x < y") untouched
  text = text.replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s+[^<>]*)?\/?>/g, ' ');

  // 13. Unescape Markdown-escaped punctuation (preserves LaTeX commands like \log, \frac)
  text = text.replace(/\\([\\`*_{}[\]()#+\-.!|>~])/g, '$1');

  // 14. Collapse line breaks and extra whitespace into a single clean line
  return text.replace(/\s+/g, ' ').trim();
}
