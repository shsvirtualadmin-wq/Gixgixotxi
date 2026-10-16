/**
 * Repairs corrupted JS escape sequences in LaTeX strings that were stored
 * without proper escaping (e.g., \f → \frac, \t → \theta, etc.)
 */
export function normalizeMath(text: string): string {
  if (!text) return text;

  // Restore common escaped LaTeX sequences that got corrupted
  return text
    // \f sequences
    .replace(/\\frac/g, '\\frac') // already fine
    .replace(/\\f([^r]|$)/g, (_m, c) => {
      if (c === 'r') return '\\frac' + c; // shouldn't happen but safe
      if (c === 'i') return '\\phi';
      return '\\frac' + (c ?? '');
    })
    // \t sequences — be careful not to break \text, \times, etc.
    .replace(/\\theta/g, '\\theta')
    .replace(/\\times/g, '\\times')
    .replace(/\\tan/g, '\\tan')
    // \b sequences
    .replace(/\\beta/g, '\\beta')
    .replace(/\\begin/g, '\\begin')
    // \r sequences
    .replace(/\\rho/g, '\\rho')
    .replace(/\\rightarrow/g, '\\rightarrow')
    .replace(/\\right/g, '\\right')
    // \n sequences (preserve as newlines in explanations)
    .replace(/\\neq/g, '\\neq')
    .replace(/\\nu/g, '\\nu')
    .replace(/\\nabla/g, '\\nabla')
    // \v sequences
    .replace(/\\vec/g, '\\vec')
    .replace(/\\varepsilon/g, '\\varepsilon')
    // Double-escaped backslashes
    .replace(/\\\\([a-zA-Z])/g, '\\$1');
}
