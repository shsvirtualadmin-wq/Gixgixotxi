let katexModule: any = null;
let katexCssLoaded = false;
let katexLoadPromise: Promise<any> | null = null;

/**
 * Dynamically loads KaTeX engine and injects KaTeX styles only when math formulas are rendered.
 */
export function loadKaTeX(): Promise<any> {
  if (katexModule) return Promise.resolve(katexModule);
  if (katexLoadPromise) return katexLoadPromise;

  if (!katexCssLoaded && typeof document !== 'undefined') {
    katexCssLoaded = true;
    import('katex/dist/katex.min.css').catch(() => {});
  }

  katexLoadPromise = import('katex')
    .then((mod) => {
      katexModule = mod.default || mod;
      return katexModule;
    })
    .catch((err) => {
      console.warn('[loadKaTeX] Failed to load KaTeX dynamic module:', err);
      return null;
    });

  return katexLoadPromise;
}

export function isKaTeXLoaded(): boolean {
  return Boolean(katexModule);
}

interface Chunk {
  type: 'text' | 'math' | 'display-math';
  content: string;
}

/**
 * Helper to convert chemical formulas into standard KaTeX upright Roman chemical subscript notation.
 * e.g., [Pt(NH3)2Cl2] -> \mathrm{[Pt(NH_{3})_{2}Cl_{2}]}
 *       NH3 -> \mathrm{NH_{3}}
 *       H2O -> \mathrm{H_{2}O}
 *       CO2 -> \mathrm{CO_{2}}
 *       H2SO4 -> \mathrm{H_{2}SO_{4}}
 */
export function formatChemicalFormulas(str: string): string {
  if (!str) return '';

  const makeChemSubscript = (s: string) => {
    return s.replace(/([A-Z][a-z]?|\))(\d+)/g, '$1_{$2}');
  };

  let s = str;

  // 1. Complex ions with square brackets e.g. [Fe(CN)6]^3-, [Pt(NH3)2Cl2]
  s = s.replace(/\[([A-Za-z0-9\(\)]+)\](\d+)?(?:\^?([0-9]*[\+\-]))?/g, (_match, inner, num, charge) => {
    let convertedInner = makeChemSubscript(inner);
    let result = '\\mathrm{[' + convertedInner + ']}';
    if (num) result += '_{' + num + '}';
    if (charge) result += '^{' + charge + '}';
    return result;
  });

  // 2. Polyatomic ions e.g. CO3^2-, S2O3^2-, HCO3-
  s = s.replace(/\b([A-Z][a-z]?(?:\d+|[A-Z][a-z]?)+)\^([0-9]*[\+\-])\b/g, (_m, formula, charge) => {
    let converted = makeChemSubscript(formula);
    return '\\mathrm{' + converted + '^{' + charge + '}}';
  });

  // 3. Full chemical equations with + or -> or =
  s = s.replace(/\b((?:\d+)?[A-Z][a-zA-Z0-9\(\)]+\s*(?:\+|\-\>|\\to|\=)\s*)+(?:\d+)?[A-Z][a-zA-Z0-9\(\)]+\b/g, (match) => {
    let converted = makeChemSubscript(match).replace(/\-\>/g, '\\to ');
    return '\\mathrm{' + converted + '}';
  });

  // 4. Standalone chemical formulas e.g. NH3, H2O, CO2, H2SO4, Na2SO4, Ca(OH)2, Fe2O3, C6H12O6, KMnO4, CuSO4, NH4Cl
  s = s.replace(/\b([A-Z][a-z]?(?:\d+|\([A-Za-z0-9]+\)\d+|[A-Z][a-z]?)+)\b/g, (match) => {
    // Exclude physics/math variables from chemical conversion
    if (/^(P1V1|P2V2|T1|T2|V1|V2|P1|P2|F1|F2|m1|m2|r1|r2|v0|v1|v2|x1|x2|y1|y2|z1|z2)$/i.test(match)) {
      return match;
    }
    if (/[A-Z][a-z]?\d+/.test(match) || /\)\d+/.test(match)) {
      let converted = makeChemSubscript(match);
      return '\\mathrm{' + converted + '}';
    }
    return match;
  });

  return s;
}

/**
 * Standardizes and formats LaTeX math strings so that KaTeX renders them
 * cleanly without alignment shifts, squished brackets, misaligned superscripts, or broken fractions.
 */
export function formatLatexContent(rawLatex: string): string {
  if (!rawLatex) return '';
  let s = rawLatex.trim();

  // Normalize double-escaped commands like \\begin, \\end, \\displaystyle, \\frac
  s = s.replace(/\\\\(displaystyle|begin|end|frac|sqrt|pmatrix|bmatrix|vmatrix|matrix|array|text|mathrm|lim|int|sum|prod|alpha|beta|gamma|delta|theta|pi|lambda|mu|sigma|omega|Delta|Gamma)/g, '\\$1');

  // 0. Clean control characters
  s = s.replace(/\x0Crac/g, '\\frac').replace(/[\x00-\x1F]/g, '');

  // 1. Convert unicode subscripts to standard numbers
  s = s.replace(/₀/g, '0').replace(/₁/g, '1').replace(/₂/g, '2').replace(/₃/g, '3').replace(/₄/g, '4')
       .replace(/₅/g, '5').replace(/₆/g, '6').replace(/₇/g, '7').replace(/₈/g, '8').replace(/₉/g, '9');

  // 2. Convert unicode superscripts to standard KaTeX exponent syntax
  s = s.replace(/⁰/g, '^{0}').replace(/¹/g, '^{1}').replace(/²/g, '^{2}').replace(/³/g, '^{3}').replace(/⁴/g, '^{4}')
       .replace(/⁵/g, '^{5}').replace(/⁶/g, '^{6}').replace(/⁷/g, '^{7}').replace(/⁸/g, '^{8}').replace(/⁹/g, '^{9}');

  // 3. Convert unicode fractions
  s = s.replace(/½/g, '\\frac{1}{2}').replace(/⅓/g, '\\frac{1}{3}').replace(/⅔/g, '\\frac{2}{3}')
       .replace(/¼/g, '\\frac{1}{4}').replace(/¾/g, '\\frac{3}{4}');

  // 4. Chemical formulas
  s = formatChemicalFormulas(s);

  // 5. Integrals
  s = s.replace(/∫/g, '\\int ');
  s = s.replace(/\\int\s+from\s+([^\s]+)\s+to\s+([^\s]+)\s+of\s+(.+?)\s*(dx|dy|dt|du)\b/gi, '\\int_{$1}^{$2} $3 \\, $4');
  s = s.replace(/\\int_?([0-9a-zA-Z\(\)]+)\^([0-9a-zA-Z\(\)]+)/g, '\\int_{$1}^{$2}');

  // 6. Physics and math variable subscripts: e.g., v0 -> v_{0}, v_0 -> v_{0}, Fnet -> F_{\text{net}}
  s = s.replace(/\bF_?net\b/gi, 'F_{\\text{net}}');
  s = s.replace(/([PVTmrvaxyz])(\d+)/g, '$1_{$2}');
  s = s.replace(/([PVTmrvaxyz])_(\d+|[a-z])/g, '$1_{$2}');

  // 7. Multiplication asterisks & scientific notation: e.g., x * e^x -> x e^{x}, 1.8 * 10^-5 -> 1.8 \times 10^{-5}
  s = s.replace(/(\d+(?:\.\d+)?)\s*\*\s*10/g, '$1 \\times 10');
  s = s.replace(/(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)/g, '$1 \\times $2');
  s = s.replace(/([a-zA-Z0-9\)\}\]])\s*\*\s*([a-zA-Z0-9\(\{\[]|\\[a-zA-Z]+)/g, '$1 $2');
  s = s.replace(/(\d+(?:\.\d+)?)\s*[x×]\s*10\^/g, '$1 \\times 10^');

  // 8. Exponents & Superscripts: e.g. e^(3x) -> e^{3x}, e^x -> e^{x}, e^-x -> e^{-x}, x^2 -> x^{2}, 10^-3 -> 10^{-3}
  s = s.replace(/\^[\(\[]([^\)\]]+)[\)\]]/g, '^{$1}');
  s = s.replace(/\^([+\-]?[a-zA-Z0-9]+)(?![a-zA-Z0-9\{])/g, '^{$1}');

  // Ensure matrix environments get \displaystyle for properly proportioned scaled brackets
  if (/\b\\begin\{(?:pmatrix|bmatrix|vmatrix|matrix|array)\}/.test(s) && !s.includes('\\displaystyle')) {
    s = '\\displaystyle ' + s;
  }

  // 9. Square roots: e.g. sqrt(1/2) -> \sqrt{\frac{1}{2}}, √(2 g R) -> \sqrt{2 g R}
  s = s.replace(/\bsqrt\(([^)]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√([a-zA-Z0-9\_]+)/g, '\\sqrt{$1}');

  // 10. Subscripts: e.g. x_(ij) -> x_{ij}
  s = s.replace(/_[\(\[]([^\)\]]+)[\)\]]/g, '_{$1}');

  // 11. Trig, log, limit functions: e.g. 3cos(x) -> 3\cos(x), sin(x) -> \sin(x), lim (x -> 0) -> \lim_{x \to 0}
  s = s.replace(/(?<!\\)(?:\b|(?<=\d))(sin|cos|tan|sec|csc|cot|sinh|cosh|tanh|ln|log|det)(?![a-zA-Z])/gi, '\\$1');
  s = s.replace(/(?<!\\)\blim_([a-zA-Z0-9\{\}\\\+\-\>]+)/gi, '\\lim_{$1}');
  s = s.replace(/\blim\s*\(([^)]+)\)/gi, '\\lim_{$1}');

  // 12. Derivatives and calculus fractions
  s = s.replace(/\bd\^2y\/dx\^2\b/g, '\\frac{d^2y}{dx^2}');
  s = s.replace(/\bd2y\/dx2\b/g, '\\frac{d^2y}{dx^2}');
  s = s.replace(/\bdy\/dx\b/g, '\\frac{dy}{dx}');
  s = s.replace(/\bd\/dx\b/g, '\\frac{d}{dx}');
  s = s.replace(/\bd\/dt\b/g, '\\frac{d}{dt}');
  s = s.replace(/\bdf\/dx\b/g, '\\frac{df}{dx}');

  // 13. Numerical or parenthesized slash fractions
  s = s.replace(/\(([^)]+)\)\/([a-zA-Z0-9\^\{\}\+\-\*\\]+)/g, '\\frac{$1}{$2}');
  s = s.replace(/(?<![\w\\])([+-]?\d+)\/(\d+)(?![\w\\])/g, '\\frac{$1}{$2}');

  // 14. Units formatting inside math
  s = s.replace(/\b(m\/s\^2|m\/s²)\b/g, '\\text{ m/s}^2');
  s = s.replace(/\b(m\/s)\b/g, '\\text{ m/s}');
  s = s.replace(/\b(km\/s)\b/g, '\\text{ km/s}');
  s = s.replace(/\b(km\/h)\b/g, '\\text{ km/h}');

  // 15. Math symbols
  s = s.replace(/\s*\+\/\-\s*/g, ' \\pm ');
  s = s.replace(/\s*(?:->|\\to)\s*/g, ' \\to ');
  s = s.replace(/\s*<=\s*/g, ' \\le ');
  s = s.replace(/\s*>=\s*/g, ' \\ge ');
  s = s.replace(/\s*!=\s*/g, ' \\neq ');
  s = s.replace(/≈/g, ' \\approx ');
  s = s.replace(/∝/g, ' \\propto ');
  s = s.replace(/\bpi\b|π/gi, ' \\pi ');
  s = s.replace(/\btheta\b|θ/gi, ' \\theta ');
  s = s.replace(/\blambda\b|λ/gi, ' \\lambda ');
  s = s.replace(/\bmu\b|μ/gi, ' \\mu ');
  s = s.replace(/μ0/g, ' \\mu_0 ');
  s = s.replace(/ε0/g, ' \\epsilon_0 ');
  s = s.replace(/\bomega\b|ω/gi, ' \\omega ');

  // 16. Balance unclosed braces
  if (s.includes('\\frac') || s.includes('\\sqrt') || s.includes('\\mathrm') || s.includes('\\text')) {
    let openCount = (s.match(/\{/g) || []).length;
    let closeCount = (s.match(/\}/g) || []).length;
    while (openCount > closeCount) {
      s += '}';
      closeCount++;
    }
  }

  return s.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Preprocesses a raw text string containing potential plain-text math or chemistry notation,
 * converting expressions into standard LaTeX math delimiters ($...$ or $$...$$) while preserving
 * all Markdown headers, bolding, lists, and prose explanations intact.
 */
export function preprocessMathText(text: string): string {
  if (!text) return '';
  let str = String(text);

  if (str.includes('\\n')) {
    str = str.replace(/\\n(?!(?:u|eq|otin|abla|eg|exists|sim|vdash|subseteq|parallel|cong|rightarrow|leftarrow|Rightarrow|Leftarrow|earrow|warrow|atural|ewcommand|ormalsize|obreak|o|ode|ull|um|umber|int|oalign)(?![a-zA-Z]))/g, '\n');
  }
  if (str.includes('\\r')) {
    str = str.replace(/\\r/g, '');
  }

  str = str.replace(/\x0Crac/g, '\\frac');
  str = str.replace(/[\x00-\x1F]/g, '');

  // 1. Normalize LaTeX block delimiters \[ ... \] to $$ ... $$ and \( ... \) to $ ... $
  str = str.replace(/\\\[([\s\S]*?)\\\]/g, (_m, g) => `\n\n$$\n${g.trim()}\n$$\n\n`);
  str = str.replace(/\\\(([\s\S]*?)\\\)/g, (_m, g) => `$${g.trim()}$`);

  // Protect standalone currency values like $0, $10, $100, $5/month from being treated as inline math delimiters
  str = str.replace(/(^|[\s\(\[\{])\$(\d+(?:\.\d+)?)(?=[^\d\$]|$)/g, '$1\\$$2');

  // 2. Ensure all markdown headings (#{1,6}) start on a new line with space after #
  str = str.replace(/([^\n])\s*(#{1,6})([^\s#\n])/g, '$1\n\n$2 $3');
  str = str.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');
  str = str.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');

  // Protect code blocks ``` ... ```
  if (str.includes('```')) {
    const codeBlockRegex = /(```[\s\S]*?```)/g;
    const parts = str.split(codeBlockRegex);
    return parts.map((part) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        return part;
      }
      return processNonCodeMathText(part);
    }).join('');
  }

  return processNonCodeMathText(str);
}

function replaceOutsideMath(text: string, regex: RegExp, replacer: (...args: any[]) => string): string {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+\$)/g);
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].startsWith('$')) {
      parts[i] = parts[i].replace(regex, replacer);
    }
  }
  return parts.join('');
}

function autoDetectAndConvertMath(text: string): string {
  if (!text) return '';
  let str = text;

  // Pre-normalize unicode subscripts and superscripts
  str = str.replace(/₀/g, '_0').replace(/₁/g, '_1').replace(/₂/g, '_2').replace(/₃/g, '_3').replace(/₄/g, '_4')
           .replace(/₅/g, '_5').replace(/₆/g, '_6').replace(/₇/g, '_7').replace(/₈/g, '_8').replace(/₉/g, '_9');

  str = str.replace(/⁰/g, '^0').replace(/¹/g, '^1').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4')
           .replace(/⁵/g, '^5').replace(/⁶/g, '^6').replace(/⁷/g, '^7').replace(/⁸/g, '^8').replace(/⁹/g, '^9');

  // Check if string already contains $...$ or $$...$$ math delimiters
  const hasDollarMath = /\$[^\$]+\$/.test(str) || /\$\$[\s\S]+\$\$/.test(str);
  if (!hasDollarMath) {
    // Check if entire string is a standalone option or pure math expression
    const isEnglishSentence = /\b(using|what|which|find|evaluate|calculate|where|when|according|because|select|during|between|with|respect|to|is|the|of|a|an)\b/i.test(str);
    const hasMarkdownOrProse = 
      /\*\*|__|#|✓|[§¶†‡]/.test(str) ||
      /^\s*[*+\-\d+\.]\s+/m.test(str) ||
      /[a-zA-Z]{3,}/.test(str.replace(/\\(?:displaystyle|begin|end|pmatrix|bmatrix|vmatrix|frac|sqrt|lim|int|sum|prod|alpha|beta|gamma|delta|epsilon|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega|Delta|Gamma|Theta|Lambda|Sigma|Phi|Psi|Omega|cdot|times|div|pm|mp|le|ge|neq|approx|equiv|to|rightarrow|leftarrow|infty|partial|nabla|vec|hat|bar|tilde|mathrm|mathbf|text|binom|sin|cos|tan|sec|csc|cot|sinh|cosh|tanh|ln|log|det)/g, ''));

    const isPureOption = !isEnglishSentence && !hasMarkdownOrProse && /[\^∫√]|e\^|x\^|y\^|10\^|sqrt|d\/dx|\/|\+|\-|=|\b\d+\/\d+\b|\\+displaystyle|\\+begin|\\+pmatrix|\\+bmatrix|\\+vmatrix|\\+frac|\\+sqrt|\\+lim|\\+int|\\+sum|\\+alpha|\\+beta|\\+gamma|\\+delta|\\+theta|\\+pi|\\+lambda|\\+mu|\\+sigma|\\+omega|\\+Delta/.test(str);

    if (isPureOption) {
      return `$${formatLatexContent(str)}$`;
    }
  }

  let result = str;

  // 1. Integrals in text
  result = replaceOutsideMath(result, /∫\s*from\s+([^\s]+)\s+to\s+([^\s]+)\s+of\s+([^\.]+?)\s*(dx|dy|dt|du)\b/gi, (_m, a, b, f, d) => {
    return `$${formatLatexContent(`\\int_{${a}}^{${b}} ${f} \\, ${d}`)}$`;
  });
  result = replaceOutsideMath(result, /∫(?:_([a-zA-Z0-9]+))?(?:\^([a-zA-Z0-9]+))?\s*([^\.]+?)\s*(dx|dy|dt|du)\b/gi, (_m, a, b, f, d) => {
    let bounds = '';
    if (a || b) bounds = `_{${a || ''}}^{${b || ''}}`;
    return `$${formatLatexContent(`\\int${bounds} ${f} \\, ${d}`)}$`;
  });

  // 2. Scientific notation & values with units
  result = replaceOutsideMath(result, /\b(\d+(?:\.\d+)?\s*[*x×]\s*10\^([+\-]?\d+)(?:\s*(?:m\/s|km\/h|Hz|M|m|s|kg|J|km\/s))?)\b/gi, (match) => {
    return `$${formatLatexContent(match)}$`;
  });

  // 3. Equations / Formulas e.g. f(x, y) = sqrt(x^2 + y^2), f(x) = e^(3x) * cos(x), 2x^2 - 5x + 3 = 0, x = 3/5, y = 4/5
  const stopWords = '(?:\\s+(?:with|for|where|when|using|and|or|in|at|is|by|with respect to)\\b|$)';
  const eqRegex = new RegExp(`\\b([fgh]\\([a-zA-Z0-9,\\s]+\\)\\s*=\\s*[^.\\n;,]+?)${stopWords}`, 'i');
  result = replaceOutsideMath(result, eqRegex, (_m, eq) => {
    return `$${formatLatexContent(eq)}$`;
  });

  result = replaceOutsideMath(result, /\b(\d*[a-z]\^2\s*[\+\-]\s*\d*[a-z]\s*[\+\-]\s*\d+\s*=\s*0)\b/gi, (match) => {
    return `$${formatLatexContent(match)}$`;
  });

  result = replaceOutsideMath(result, /\b([a-zA-Z]\s*=\s*\d+\/\d+)\b/gi, (match) => {
    return `$${formatLatexContent(match)}$`;
  });

  // 4. Complex chemical ions e.g. [Fe(CN)6]^3-, CO3^2-, S2O3^2-
  result = replaceOutsideMath(result, /(\[?[A-Z][a-zA-Z0-9\(\)]+\]?\^[0-9]*[\+\-])/g, (match) => {
    return `$${formatLatexContent(match)}$`;
  });

  // 5. Standalone limits e.g. lim (x -> 0) [sin(5x) / x]
  result = replaceOutsideMath(result, /\b(lim\s*\([^)]+\)\s*\[?[^.\n;,\]]+\]?)\b/gi, (_m, limStr) => {
    return `$${formatLatexContent(limStr)}$`;
  });

  // 6. Standalone caret exponents e.g. e^x, e^(3x), x^2, 10^-3, day^-1, (x+1)^2, [f(x)]^2
  result = replaceOutsideMath(result, /(?<!\$)(?:[a-zA-Z0-9_]+|\([^\)\n]+\)|\[[^\]\n]+\])\^(?:\([^\)\n]+\)|\[[^\]\n]+\]|\{[^\}\n]+\}|[+\-]?[a-zA-Z0-9]+)(?!\$)/g, (match) => {
    if (/^[0-9]+$/.test(match)) return match;
    return `$${formatLatexContent(match)}$`;
  });

  // 7. Standalone sqrt
  result = replaceOutsideMath(result, /\b(sqrt\([^\)]+\)|√\([^\)]+\)|√[a-zA-Z0-9_]+)\b/g, (match) => {
    return `$${formatLatexContent(match)}$`;
  });

  // 8. Standalone derivatives
  result = replaceOutsideMath(result, /\b(d\^2y\/dx\^2|d2y\/dx2|dy\/dx|d\/dx|df\/dx|d\/dt)\b/g, (match) => {
    return `$${formatLatexContent(match)}$`;
  });

  return result;
}

function processNonCodeMathText(str: string): string {
  if (!str) return '';

  // Split string by existing LaTeX delimiters ($...$ or $$...$$)
  const delimiterRegex = /(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+?\$)/g;
  const rawTokens = str.split(delimiterRegex);

  let result = '';

  for (const token of rawTokens) {
    if (!token) continue;

    if (token.startsWith('$$') && token.endsWith('$$')) {
      const inner = token.slice(2, -2).trim();
      result += `\n\n$$\n${formatLatexContent(inner)}\n$$\n\n`;
    } else if (token.startsWith('$') && token.endsWith('$')) {
      const inner = token.slice(1, -1).trim();
      result += `$${formatLatexContent(inner)}$`;
    } else {
      let textChunk = token;

      // Convert standalone raw LaTeX commands e.g. \frac{a}{b}, \sqrt{x}, \lim_{x \to 0}, \int_{a}^{b}, \displaystyle \begin{pmatrix}... into inline math $...$ if not already delimited
      textChunk = replaceOutsideMath(
        textChunk,
        /(?:\\+displaystyle\s*)?\\+begin\{([a-zA-Z*]+)\}[\s\S]*?\\+end\{\1\}/g,
        (match) => {
          return `$${formatLatexContent(match)}$`;
        }
      );

      textChunk = replaceOutsideMath(
        textChunk,
        /(\\(?:displaystyle|frac|sqrt|lim|int|sum|prod|alpha|beta|gamma|delta|epsilon|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega|Delta|Gamma|Theta|Lambda|Sigma|Phi|Psi|Omega|cdot|times|div|pm|mp|le|ge|neq|approx|equiv|to|rightarrow|leftarrow|infty|partial|nabla|vec|hat|bar|tilde|mathrm|mathbf|text|binom|left|right|begin|end)(?:\{[^{}]*\}|\[[^\]]*\])*(?:_\{[^{}]*\}|_[\w\-\>]+)?(?:\^\([^\)]*\)|\^[\w\{\}\-]+)?(?:\s*\{[^{}]*\})*)/g,
        (match) => {
          return `$${formatLatexContent(match)}$`;
        }
      );

      // Convert standalone matrix [[a,b],[c,d]] into inline math $...$
      textChunk = replaceOutsideMath(
        textChunk,
        /\[\s*\[\s*([^\]]+)\s*\]\s*,\s*\[\s*([^\]]+)\s*\](?:\s*,\s*\[\s*([^\]]+)\s*\])?\s*\]/g,
        (_m, r1, r2, r3) => {
          const parseRow = (r: string) =>
            r.split(',').map((item) => item.trim().replace(/^([+-]?\d+)\/(\d+)$/, '\\frac{$1}{$2}')).join(' & ');
          let rows = [parseRow(r1), parseRow(r2)];
          if (r3) rows.push(parseRow(r3));
          const matrixLatex = '\\displaystyle \\begin{pmatrix} ' + rows.join(' \\\\ ') + ' \\end{pmatrix}';
          return `$${matrixLatex}$`;
        }
      );

      // Run auto-detection for un-delimited math/physics/chemistry notation
      textChunk = autoDetectAndConvertMath(textChunk);

      // Merge adjacent dollar math tokens e.g. $a$ $b$ -> $a b$ (do NOT match $$ block delimiters)
      textChunk = textChunk.replace(/(?<!\$)\$\s*\$(?!\$)/g, ' ');

      result += textChunk;
    }
  }

  return result;
}

export interface MathPart {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

/**
 * Splits preprocessed text into structured parts (text, inline-math, display-math).
 */
export function parseMathParts(rawText: string): MathPart[] {
  const processed = preprocessMathText(rawText);
  if (!processed) return [];

  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
  const rawParts = processed.split(regex);
  const result: MathPart[] = [];

  for (const part of rawParts) {
    if (!part) continue;
    if (part.startsWith('$$') && part.endsWith('$$')) {
      result.push({ type: 'display-math', content: part.slice(2, -2).trim() });
    } else if (part.startsWith('$') && part.endsWith('$')) {
      result.push({ type: 'inline-math', content: part.slice(1, -1).trim() });
    } else {
      result.push({ type: 'text', content: part });
    }
  }

  return result;
}

/**
 * Renders LaTeX content safely using KaTeX. Returns HTML string.
 */
export function renderKaTeX(latex: string, displayMode: boolean = false): string {
  try {
    let cleanLatex = formatLatexContent(latex);
    if (katexModule) {
      let html = katexModule.renderToString(cleanLatex, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
        strict: false,
      });

      // Remove any accidental red error cursor character '|' from katex-error elements if present
      if (html.includes('katex-error')) {
        html = html.replace(/(<span class="katex-error"[^>]*>.*?)\|(<\/span>)/g, '$1$2');
      }

      return html;
    }

    // Trigger background loading if not already initiated
    loadKaTeX();

    // Clean fallback presentation until KaTeX finishes downloading
    return `<span class="katex-fallback font-mono">${cleanLatex}</span>`;
  } catch (err) {
    console.warn('KaTeX rendering error:', err);
    return latex;
  }
}
