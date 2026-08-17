/**
 * Decodes literal unicode escapes like \u0627 or \u001f into actual UTF-8 characters.
 */
export function decodeUnicodeEscapes(str: string): string {
  if (!str || typeof str !== 'string') return '';
  // Check if string contains literal \uXXXX sequences
  if (/\\u[0-9a-fA-F]{4}/.test(str)) {
    try {
      return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
        const codePoint = parseInt(hex, 16);
        // Avoid replacing control characters like \u000a (\n) or \u0009 (\t) incorrectly if needed
        if (codePoint < 32 && codePoint !== 10 && codePoint !== 13 && codePoint !== 9) {
          return '';
        }
        return String.fromCharCode(codePoint);
      });
    } catch {
      return str;
    }
  }
  return str;
}

/**
 * Sanitizes and extracts clean readable text from AI model responses,
 * stripping away raw JSON wrappers, SSE artifacts, raw code blocks, and unparsed Unicode.
 */
export function sanitizeStudyBuddyText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText.trim();

  // 1. Decode literal \uXXXX unicode escapes
  text = decodeUnicodeEscapes(text);

  // 2. Remove raw JSON block wrappers like ```json { "explanation": "..." } ```
  const jsonCodeBlockMatch = text.match(/^```(?:json|markdown|text)?\s*([\s\S]*?)\s*```$/i);
  if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
    const inner = jsonCodeBlockMatch[1].trim();
    if (inner.startsWith('{') && inner.endsWith('}')) {
      try {
        const parsed = JSON.parse(inner);
        if (parsed.explanation && typeof parsed.explanation === 'string') {
          text = parsed.explanation;
        } else if (parsed.text && typeof parsed.text === 'string') {
          text = parsed.text;
        } else if (parsed.response && typeof parsed.response === 'string') {
          text = parsed.response;
        } else if (parsed.answer && typeof parsed.answer === 'string') {
          text = parsed.answer;
        } else {
          text = inner;
        }
      } catch {
        text = inner;
      }
    } else {
      text = inner;
    }
  }

  // 3. If raw text starts with { and ends with } (unwrapped JSON object)
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.explanation && typeof parsed.explanation === 'string') {
        text = parsed.explanation;
      } else if (parsed.text && typeof parsed.text === 'string') {
        text = parsed.text;
      } else if (parsed.response && typeof parsed.response === 'string') {
        text = parsed.response;
      } else if (parsed.answer && typeof parsed.answer === 'string') {
        text = parsed.answer;
      }
    } catch {}
  }

  // 4. Strip stray SSE prefix/suffix artifacts if leaked
  text = text.replace(/^data:\s*/gm, '');
  text = text.replace(/\[DONE\]$/g, '').trim();

  // 5. Always replace literal \n escaping with actual line breaks (excluding LaTeX commands like \nu, \nu_0, \neq, \notin, \nabla, etc.)
  text = text.replace(/\\n(?!(?:u|eq|otin|abla|eg|exists|sim|vdash|subseteq|parallel|cong|rightarrow|leftarrow|Rightarrow|Leftarrow|earrow|warrow|atural|ewcommand|ormalsize|obreak|o|ode|ull|um|umber|int|oalign)(?![a-zA-Z]))/g, '\n');
  if (text.includes('\\r')) {
    text = text.replace(/\\r/g, '');
  }

  // 6. Normalize LaTeX block delimiters \[ ... \] to $$ ... $$ and \( ... \) to $ ... $
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, g) => `\n\n$$\n${g.trim()}\n$$\n\n`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, g) => `$${g.trim()}$`);

  // 7. Fix concatenated heading words (e.g. "FeaturesIncludes" -> "Features Includes" or "TrialIncludes" -> "Trial Includes")
  text = text.replace(/([a-z0-9])([A-Z][a-z]{2,})/g, '$1 $2');
  text = text.replace(/(Features|Plan|Trial|Access|Benefits|Details|Overview)(Includes|Provides|Offers|Gives|Has|Contains|Allows|Full)/g, '$1 $2');

  // 8. Ensure all markdown headings (#{1,6}) start on a new line with space after #
  text = text.replace(/([^\n])\s*(#{1,6})([^\s#\n])/g, '$1\n\n$2 $3');
  text = text.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');
  text = text.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');

  // 9. Convert inline pseudo-headings like "## Heading: Body text" to "## Heading\n\nBody text"
  text = text.replace(/^(#{1,6}\s+[^:\n]+):\s*([^\n]+)$/gm, '$1\n\n$2');

  // 10. Convert standalone inline bold pseudo-headings (not inside bullet/numbered list items) like "**Heading:** Body" into real "## Heading\n\nBody"
  text = text.replace(/(?:^|\n)\s*(?!\*|-|\+|\d+\.)\*\*([^*:\n]{2,60})\*\*\s*:?\s*(?=\n|[A-Z])/g, (_match, title) => {
    const cleanTitle = title.trim();
    if (cleanTitle.length >= 2) {
      return `\n\n## ${cleanTitle}\n\n`;
    }
    return _match;
  });

  // 11. Convert standalone un-bolded section titles with colons (not inside list items) like "Free Trial Features: Includes..." into real headings
  text = text.replace(/(?:^|\n)\s*(?!\*|-|\+|\d+\.)([A-Z][A-Za-z0-9\s\-\/\&]{2,40})\s*:\s*(?=[A-Z0-9])/g, (_match, title) => {
    const cleanTitle = title.trim();
    const lower = cleanTitle.toLowerCase();
    if (['note', 'warning', 'tip', 'for example', 'example', 'http', 'https'].includes(lower)) {
      return _match;
    }
    if (cleanTitle.includes(' ') || cleanTitle.length >= 4) {
      return `\n\n## ${cleanTitle}\n\n`;
    }
    return _match;
  });

  // 12. Ensure a blank line after every heading before body text
  text = text.replace(/^(#{1,6}\s+[^\n]+)\n([^\n#\s])/gm, '$1\n\n$2');

  // 13. Normalize multi-newlines (collapse 3+ newlines to 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Safety check to detect if text is unparsed JSON, garbled control chars, or broken artifacts.
 */
export function isGarbledResponse(text: string): boolean {
  if (!text) return false;

  const cleaned = sanitizeStudyBuddyText(text);

  // Check 1: Looks like unparsed raw JSON object/array
  if (/^\s*[\{\[]\s*"(candidates|contents|parts|error|status|statusCode|response|explanation)"/i.test(cleaned)) {
    return true;
  }

  // Check 2: Contains literal unparsed unicode escape chains like \u0627\u0644\u0633
  if (/(\\u[0-9a-fA-F]{4}){3,}/.test(text)) {
    return true;
  }

  return false;
}
