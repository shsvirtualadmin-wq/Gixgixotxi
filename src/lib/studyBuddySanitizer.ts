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

  // 7. Ensure markdown headings have space after '#' and start on new lines
  text = text.replace(/([^\n])\s*(#{1,6})([^\s#\n])/g, '$1\n\n$2 $3');
  text = text.replace(/^(#{1,6})([^\s#\n])/gm, '$1 $2');
  text = text.replace(/^(#{1,6}\s+[^\n]+)\n([^\n#\s])/gm, '$1\n\n$2');

  // 8. Normalize multi-newlines (collapse 3+ newlines to 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Safety check to detect if text is unparsed raw JSON errors or system artifacts.
 */
export function isGarbledResponse(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const trimmed = text.trim();
  if (!trimmed) return false;

  // Check 1: Looks like unparsed raw Gemini JSON error object
  if (/^\s*\{\s*"error"\s*:\s*\{/i.test(trimmed)) {
    return true;
  }

  // Check 2: Raw RPC or API error payload with no actual message
  if (/^\s*\{\s*"(candidates|contents|parts|statusCode)"\s*:\s*\[/i.test(trimmed)) {
    return true;
  }

  return false;
}
