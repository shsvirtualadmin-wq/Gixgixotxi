import katex from 'katex';

let katexModule: any = katex;
let katexLoadPromise: Promise<any> = Promise.resolve(katex);

/**
 * Ensures KaTeX engine is loaded and available.
 */
export function loadKaTeX(): Promise<any> {
  return Promise.resolve(katexModule || katex);
}

export function isKaTeXLoaded(): boolean {
  return true;
}

export interface MathPart {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

/**
 * Helper to convert chemical formulas into standard KaTeX upright Roman chemical notation.
 * e.g., [Pt(NH3)2Cl2] -> \mathrm{[Pt(NH_{3})_{2}Cl_{2}]}
 *       NH3 -> \mathrm{NH_{3}}
 *       H2O -> \mathrm{H_{2}O}
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

  // 4. Standalone chemical formulas e.g. NH3, H2O, CO2, H2SO4, Na2SO4, Ca(OH)2, Fe2O3, C6H12O6
  s = s.replace(/\b([A-Z][a-z]?(?:\d+|\([A-Za-z0-9]+\)\d+|[A-Z][a-z]?)+)\b/g, (match) => {
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
 * Converts slash-based fractions (e.g. 1 / [(x - 1)(x + 2)], 2 / (1 + x²), A / (x - 1), \lambda / 2)
 * into textbook stacked LaTeX fractions \frac{numer}{denom}.
 */
export function convertSlashFractions(str: string): string {
  let s = str;

  // Protect \text{...} blocks from slash fraction conversion so units like mg/L or m/s are preserved
  const textBlocks: string[] = [];
  s = s.replace(/\\text\{[^{}]*\}/g, (match) => {
    textBlocks.push(match);
    return `__TEXT_BLOCK_${textBlocks.length - 1}__`;
  });

  // 1. Function / Function e.g. P(x) / Q(x), sin(x) / x, sin(3*θ)/sin(theta), \sin(3\theta)/\sin(\theta)
  s = s.replace(
    /(?<![\w\\])(\\?(?:sin|cos|tan|cot|sec|csc|ln|log|exp|arcsin|arccos|arctan|sinh|cosh|tanh|[a-zA-Z])\s*\(((?:[^()]|\([^()]*\))+)\))\s*\/\s*(\\?(?:sin|cos|tan|cot|sec|csc|ln|log|exp|arcsin|arccos|arctan|sinh|cosh|tanh|[a-zA-Z])\s*\(((?:[^()]|\([^()]*\))+)\))(?![\w\\])/gi,
    '\\frac{$1}{$3}'
  );

  // 2. Bracketed denominator with optional exponent: e.g. 1 / [(x - 1)(x + 2)], (2x + 3) / [(x - 1)(x^2 + 1)]
  const unwrapOuterParensOnly = (raw: string): string => {
    let clean = raw.trim();
    if (clean.startsWith('(') && clean.endsWith(')')) {
      let depth = 0;
      let isSinglePair = true;
      for (let i = 0; i < clean.length - 1; i++) {
        if (clean[i] === '(') depth++;
        else if (clean[i] === ')') {
          depth--;
          if (depth === 0) { isSinglePair = false; break; }
        }
      }
      if (isSinglePair) return clean.slice(1, -1).trim();
    }
    return clean;
  };

  s = s.replace(/\(((?:[^()]|\([^()]*\))+)\)\s*\/\s*\[([^\[\]]+)\]((?:\^[0-9a-zA-Z]+|\^\{[^\}]+\})?)/g, (_m, num, den, exp) => {
    return `\\frac{${num}}{${unwrapOuterParensOnly(den)}${exp || ''}}`;
  });
  s = s.replace(/(?<![\\a-zA-Z0-9_])([a-zA-Z0-9\^_\{\}\+\-\*\\]+)\s*\/\s*\[([^\[\]]+)\]((?:\^[0-9a-zA-Z]+|\^\{[^\}]+\})?)/g, (_m, num, den, exp) => {
    return `\\frac{${num}}{${unwrapOuterParensOnly(den)}${exp || ''}}`;
  });

  // 3. (numer) / (denom) with optional function prefix and exponent:
  // e.g. (v0^2 * sin^2(theta)) / (2g), (2x) / (1 - x^2), (x + 1) / (x - 2)^2, (sin(3*θ)) / (sin(theta))
  s = s.replace(/(?:(\\?[a-zA-Z0-9_]+)\s*)?\(((?:[^()]|\([^()]*\))+)\)\s*\/\s*(?:(\\?[a-zA-Z0-9_]+)\s*)?\(((?:[^()]|\([^()]*\))+)\)((?:\^[0-9a-zA-Z]+|\^\{[^\}]+\})?)/g, (_m, fn1, num, fn2, den, exp) => {
    const fullNum = fn1 ? `${fn1}(${num})` : num;
    const fullDen = (fn2 ? `${fn2}(${den})` : den) + (exp || '');
    return `\\frac{${fullNum}}{${fullDen}}`;
  });

  // 4. (numer) / simple denom: e.g. (x + 1) / 2, (Ax + B) / x^2, (v0^2 * sin(2*theta)) / g
  s = s.replace(/(?:(\\?[a-zA-Z0-9_]+)\s*)?\(((?:[^()]|\([^()]*\))+)\)\s*\/\s*([+-]?[a-zA-Z0-9\^_\{\}\\]+)/g, (_m, fn1, num, den) => {
    const fullNum = fn1 ? `${fn1}(${num})` : num;
    return `\\frac{${fullNum}}{${den}}`;
  });

  // 5. simple term / (denom) with optional exponent: e.g. A / (x - 1)^2, 2 / (1 + x^2), 2x / (1 + x^2), -2 / (1 + x^2), 1 / (x + 2)
  s = s.replace(/(?<![\\a-zA-Z0-9_])([+-]?[a-zA-Z0-9\^_\{\}\\]+)\s*\/\s*(?:(\\?[a-zA-Z0-9_]+)\s*)?\(((?:[^()]|\([^()]*\))+)\)((?:\^[0-9a-zA-Z]+|\^\{[^\}]+\})?)/g, (_m, num, fn2, den, exp) => {
    const fullDen = (fn2 ? `${fn2}(${den})` : den) + (exp || '');
    return `\\frac{${num}}{${fullDen}}`;
  });

  // 6. Term / sqrt denominator: e.g. 1 / \sqrt{\mu_0 \epsilon_0}, x_0 / \sqrt{2}, 1 / \sqrt{2}
  s = s.replace(/(?<![\\a-zA-Z0-9_])([a-zA-Z0-9_\^]+)\s*\/\s*(\\sqrt\{[^{}]*\})/g, '\\frac{$1}{$2}');

  // 7. LaTeX command or variable / symbol or number: e.g. \lambda / 2, \pi / 2, \sqrt{3} / 2
  s = s.replace(/(\\[a-zA-Z]+(?:\{[^{}]*\})?)\s*\/\s*([a-zA-Z0-9\^_\{\}\\]+)/g, '\\frac{$1}{$2}');

  // 8. Multi-term partial fraction terms: e.g. A / x + B / x^2 + C / (x - 2)
  s = s.replace(/(?<![\\a-zA-Z0-9_])([a-zA-Z])\s*\/\s*([a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^\}]+\})?)(?![\\a-zA-Z0-9_])/g, '\\frac{$1}{$2}');

  // 9. Single variable or constant / term: e.g. E / B, B / E, 1 / x, 1 / T, 2h / g, gh / 2, 2x / (1 - x^2)
  s = s.replace(/(?<![\\a-zA-Z0-9_])([+-]?[a-zA-Z0-9]+)\s*\/\s*([a-zA-Z][a-zA-Z0-9\^_\{\}]*)(?![\\a-zA-Z0-9_\(])/g, '\\frac{$1}{$2}');

  // 10. Pure numerical fractions: e.g. 3/2, -1/3, 1 / 4
  s = s.replace(/(?<![\\a-zA-Z0-9_/])([+-]?\d+)\s*\/\s*(\d+)(?![\\a-zA-Z0-9_/])/g, '\\frac{$1}{$2}');

  // Clean redundant double parentheses created by nested bracket regexes: e.g. ((x - 1)(x + 2)) -> (x - 1)(x + 2)
  s = s.replace(/\\frac\{([^}]+)\}\{\(\(([^)]+)\)\(([^)]+)\)\)\}/g, '\\frac{$1}{($2)($3)}');
  s = s.replace(/\\frac\{([^}]+)\}\{\(\(([^()]+)\)\)\}/g, '\\frac{$1}{($2)}');

  // Restore \text{...} blocks
  s = s.replace(/__TEXT_BLOCK_(\d+)__/g, (_m, idx) => textBlocks[Number(idx)]);

  return s;
}

/**
 * Normalizes raw mathematical notation into standard KaTeX LaTeX syntax.
 */
export function formatLatexContent(rawLatex: string): string {
  if (!rawLatex) return '';
  let s = rawLatex.trim();

  // Repair any invalid \frac leaked inside \text{...} blocks (e.g. \text{ \frac{mg}{L} } -> \text{ mg/L })
  s = s.replace(/\\text\{([^{}]*)\\frac\{([^{}]*)\}\{([^{}]*)\}([^{}]*)\}/g, '\\text{$1$2/$3$4}');

  // Normalize dashes
  s = s.replace(/[−–—]/g, '-');

  // Repair JS escape corruption where backslashed characters were turned into control codes
  s = s.replace(/\x0Crac/g, '\\frac')
       .replace(/\r(?=ho\b|ho\W)/g, '\\r') // carriage return before ho -> \rho
       .replace(/\bgammaho\b|\\gammaho\b/gi, '\\gamma \\rho')
       .replace(/\\gammarho\b/gi, '\\gamma \\rho')
       .replace(/\\gamma\\rho\b/gi, '\\gamma \\rho')
       .replace(/\x09(?=heta\b)/g, '\\t') // tab before heta -> \theta
       .replace(/\x09(?=o\b)/g, '\\t') // tab before o -> \to
       .replace(/\x08(?=eta\b)/g, '\\b') // backspace before eta -> \beta
       .replace(/\\r(?=\\n)/g, '')
       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // Repair Laplace correction factor formatting:
  // e.g. \frac{\sqrt{P}}{(\gammaho)} or \frac{\sqrt{P}}{\gamma \rho} -> \sqrt{\frac{P}{\gamma \rho}}
  s = s.replace(/\\frac\{\\sqrt\{([^{}]+)\}\}\{\(?\\?gamma\s*\\?r?ho\)?\}/gi, '\\sqrt{\\frac{$1}{\\gamma \\rho}}');
  s = s.replace(/\\frac\{\\sqrt\{([^{}]+)\}\}\{\(?\\gamma\s*\\rho\)?\}/gi, '\\sqrt{\\frac{$1}{\\gamma \\rho}}');

  // Normalize double-escaped commands like \\begin, \\end, \\displaystyle, \\frac
  s = s.replace(/\\\\(displaystyle|begin|end|frac|sqrt|pmatrix|bmatrix|vmatrix|matrix|array|text|mathrm|mathbf|lim|int|sum|prod|alpha|beta|gamma|delta|epsilon|theta|pi|lambda|mu|sigma|omega|rho|nu|Delta|Gamma|times|cdot|to|pm|approx)/g, '\\$1');

  // Convert unicode subscripts and superscripts
  s = s.replace(/₀/g, '_0').replace(/₁/g, '_1').replace(/₂/g, '_2').replace(/₃/g, '_3').replace(/₄/g, '_4')
       .replace(/₅/g, '_5').replace(/₆/g, '_6').replace(/₇/g, '_7').replace(/₈/g, '_8').replace(/₉/g, '_9');
  s = s.replace(/⁰/g, '^{0}').replace(/¹/g, '^{1}').replace(/²/g, '^{2}').replace(/³/g, '^{3}').replace(/⁴/g, '^{4}')
       .replace(/⁵/g, '^{5}').replace(/⁶/g, '^{6}').replace(/⁷/g, '^{7}').replace(/⁸/g, '^{8}').replace(/⁹/g, '^{9}');

  // Unicode fractions
  s = s.replace(/½/g, '\\frac{1}{2}').replace(/⅓/g, '\\frac{1}{3}').replace(/⅔/g, '\\frac{2}{3}')
       .replace(/¼/g, '\\frac{1}{4}').replace(/¾/g, '\\frac{3}{4}');

  // Chemical formulas
  s = formatChemicalFormulas(s);

  // Integrals
  s = s.replace(/∫/g, '\\int ');
  s = s.replace(/\\int\s+from\s+([^\s]+)\s+to\s+([^\s]+)\s+of\s+(.+?)\s*(dx|dy|dt|du)\b/gi, '\\int_{$1}^{$2} $3 \\, $4');
  s = s.replace(/\\int_?([0-9a-zA-Z\(\)]+)\^([0-9a-zA-Z\(\)]+)/g, '\\int_{$1}^{$2}');

  // Derivatives (MUST be converted before exponent replacements)
  s = s.replace(/\bd\^?2y\/dx\^?2\b/gi, '\\frac{d^2y}{dx^2}');
  s = s.replace(/\bd2y\/dx2\b/gi, '\\frac{d^2y}{dx^2}');
  s = s.replace(/\bdy\/dx\b/gi, '\\frac{dy}{dx}');
  s = s.replace(/\bd\/dx\b/gi, '\\frac{d}{dx}');
  s = s.replace(/\bd\/dt\b/gi, '\\frac{d}{dt}');
  s = s.replace(/\bdf\/dx\b/gi, '\\frac{df}{dx}');
  s = s.replace(/\bdM\/dt\b/gi, '\\frac{dM}{dt}');
  s = s.replace(/\bdv\/dt\b/gi, '\\frac{dv}{dt}');

  // Greek letters (WITH negative lookbehind (?<!\\) so \gamma, \rho, etc. are NEVER doubled!)
  s = s.replace(/(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/gi, (match) => `\\${match.toLowerCase()}`);
  s = s.replace(/(?<!\\)\b(Delta|Gamma|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)\b/g, '\\$1');
  s = s.replace(/π/g, '\\pi ').replace(/θ/g, '\\theta ').replace(/λ/g, '\\lambda ').replace(/μ/g, '\\mu ')
       .replace(/ω/g, '\\omega ').replace(/α/g, '\\alpha ').replace(/β/g, '\\beta ').replace(/γ/g, '\\gamma ')
       .replace(/δ/g, '\\delta ').replace(/σ/g, '\\sigma ').replace(/ρ/g, '\\rho ').replace(/ν/g, '\\nu ')
       .replace(/Δ/g, '\\Delta ').replace(/Φ/g, '\\Phi ').replace(/ψ/g, '\\psi ')
       .replace(/ε/g, '\\epsilon ').replace(/η/g, '\\eta ').replace(/ζ/g, '\\zeta ').replace(/κ/g, '\\kappa ')
       .replace(/ξ/g, '\\xi ').replace(/τ/g, '\\tau ').replace(/υ/g, '\\upsilon ').replace(/χ/g, '\\chi ')
       .replace(/Ψ/g, '\\Psi ').replace(/Ω/g, '\\Omega ').replace(/∞/g, '\\infty ');
  s = s.replace(/(?:\\mu_0|μ0|μ_0|mu_0)/g, '\\mu_0');
  s = s.replace(/(?:\\epsilon_0|ε0|ε_0|epsilon_0)/g, '\\epsilon_0');

  // Function mappings: f: A -> B or f: X \to Y
  s = s.replace(/\b([fghFGH])\s*:\s*([A-Za-z0-9_\{\}\mathbb\[\],\s\^]+?)\s*(?:->|-->|→|\\to)\s*([A-Za-z0-9_\{\}\mathbb\[\],\s\^]+?)(?=[.,;!?\s]|$|\))/g, '$1: $2 \\to $3');

  // Physics and math variable subscripts: e.g. a1 -> a_{1}, a_1, F_net, K.E.
  s = s.replace(/\bF_?net\b/gi, 'F_{\\text{net}}');
  s = s.replace(/\bK\.?E\.?(?:_?max|max)\b/gi, '\\text{K.E.}_{\\text{max}}');
  s = s.replace(/\bK\.?E\.?\b/gi, '\\text{K.E.}');
  s = s.replace(/\bP\.?E\.?\b/gi, '\\text{P.E.}');
  s = s.replace(/\bhnu\b/gi, 'h\\nu');
  s = s.replace(/\bF_?c\b/g, 'F_c');
  s = s.replace(/\ba_?c\b/g, 'a_c');
  s = s.replace(/\b([a-zA-Z])(\d+)\b/g, '$1_{$2}');
  s = s.replace(/(?<!\\)([PVTmrvaxyz])_([a-zA-Z0-9]+)/g, (_m, v, sub) => {
    if (/^\d+$/.test(sub) || sub.length === 1) return `${v}_{${sub}}`;
    return `${v}_{\\text{${sub}}}`;
  });

  // Square roots: normalize sqrt(...) and √(..) to \sqrt{...}
  // MUST use (?<!\\) so existing \sqrt is not doubled
  s = s.replace(/(?<!\\)\bsqrt\s*\(([^()]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\s*\{([^{}]+)\}/gi, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\s+([a-zA-Z0-9_]+)/gi, '\\sqrt{$1}');
  s = s.replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*\{([^{}]+)\}/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([a-zA-Z0-9_]+)/g, '\\sqrt{$1}');

  // Convert slash fractions INSIDE \sqrt{...} first, so \sqrt is never torn apart!
  // e.g. \sqrt{\gamma P / \rho} -> \sqrt{\frac{\gamma P}{\rho}}, \sqrt{P / (\gamma\rho)} -> \sqrt{\frac{P}{\gamma\rho}}
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (_m, inner) => {
    let convertedInner = inner;
    convertedInner = convertedInner.replace(/\(([^\(\)]+)\)/g, '$1');
    if (convertedInner.includes('/')) {
      const slashParts = convertedInner.split('/');
      if (slashParts.length === 2) {
        let den = slashParts[1].trim();
        // Ensure \gamma \rho has a space so KaTeX renders it cleanly
        den = den.replace(/\\gamma\\?r?ho\b/g, '\\gamma \\rho');
        return `\\sqrt{\\frac{${slashParts[0].trim()}}{${den}}}`;
      }
      convertedInner = convertSlashFractions(convertedInner);
    }
    return `\\sqrt{${convertedInner}}`;
  });

  // Standard math functions
  s = s.replace(/(?<!\\)\b(sin|cos|tan|sec|csc|cot|sinh|cosh|tanh|arcsin|arccos|arctan|arcsec|arccsc|arccot|ln|log|det|exp)\b/g, '\\$1');
  // Limits with arrow or infinity
  s = s.replace(/(?<!\\)\blim\s*_(?:\{([^{}]+)\}|([a-zA-Z0-9→\-\\>∞]+))/gi, (_m, g1, g2) => {
    let cleanSub = (g1 || g2).replace(/(?:->|-->|→)/g, '\\to ').replace(/\\?infty/g, '\\infty ');
    return `\\lim_{${cleanSub.trim()}}`;
  });
  s = s.replace(/(?<!\\)\blim_([a-zA-Z0-9\{\}\\\+\-\>→∞]+)/gi, (_m, sub) => {
    let cleanSub = sub.replace(/(?:->|-->|→)/g, '\\to ').replace(/\\?infty/g, '\\infty ');
    if (!cleanSub.startsWith('{')) cleanSub = `{${cleanSub}}`;
    return `\\lim_{${cleanSub}}`;
  });
  s = s.replace(/\blim\s*\(([^)]+)\)/gi, (_m, sub) => {
    const cleanSub = sub.replace(/(?:->|-->|→)/g, '\\to ').replace(/\\?infty/g, '\\infty ');
    return `\\lim_{${cleanSub}}`;
  });

  // Format arguments of functions with fractions: e.g. \arctan((2x) / (1 - x^2)) -> \arctan\left(\frac{2x}{1 - x^2}\right)
  s = s.replace(/(\\(?:sin|cos|tan|arcsin|arccos|arctan|sec|csc|cot|ln|log))\s*\(((?:[^()]|\([^()]*\))+)\)/g, (_m, fn, arg) => {
    let formattedArg = convertSlashFractions(arg);
    // Ensure carets inside argument are formatted
    formattedArg = formattedArg.replace(/\^([+\-]?[a-zA-Z0-9]+)(?![a-zA-Z0-9\{])/g, '^{$1}');
    if (formattedArg.includes('\\frac')) {
      return `${fn}\\left(${formattedArg}\\right)`;
    }
    return `${fn}(${formattedArg})`;
  });

  // Exponents & Superscripts: e.g. e^(3x) -> e^{3x}, e^x -> e^{x}, x^2 -> x^{2}, (1+1/n)^{3n}
  s = s.replace(/\^[\(\[]([^\)\]]+)[\)\]]/g, '^{$1}');
  s = s.replace(/\^([+\-]?[a-zA-Z0-9]+)(?![a-zA-Z0-9\{])/g, '^{$1}');

  // Normalize align* and matrix* to aligned / matrix for KaTeX compatibility
  s = s.replace(/\\begin\{align\*?\}/g, '\\begin{aligned}').replace(/\\end\{align\*?\}/g, '\\end{aligned}');
  s = s.replace(/\\begin\{matrix\*?\}/g, '\\begin{matrix}').replace(/\\end\{matrix\*?\}/g, '\\end{matrix}');

  // Multiplication asterisks (avoid replacing * inside environment names like align*, matrix*, or superscripts like ^*)
  s = s.replace(/(\d+(?:\.\d+)?)\s*\*\s*10\^/g, '$1 \\times 10^');
  s = s.replace(/(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)/g, '$1 \\times $2');
  s = s.replace(/([a-zA-Z0-9\)])\s*\*\s*(\\?[a-zA-Z]+)/g, '$1 $2');
  s = s.replace(/([a-zA-Z])(\d+)\s*\*\s*([a-zA-Z])/g, '$1_{$2} $3');
  s = s.replace(/([a-zA-Z0-9\)\}\]])\s*\*\s*([a-zA-Z0-9\(\{\[])/g, '$1 \\cdot $2');
  s = s.replace(/(?<!\\begin\{[a-zA-Z]+|\{align|\{matrix|\^)\s*\*\s*/g, ' \\cdot ');

  // Strip any rogue unescaped dollar signs from inside formula
  s = s.replace(/(?<!\\)\$/g, '').trim();

  // Convert general slash fractions outside of existing \frac and \sqrt
  s = convertSlashFractions(s);

  // Parentheses sizing around fractions
  s = s.replace(/(?<!\\left)\((\\frac\{[^}]+\}\{[^}]+\}[^\)]*)\)(?!\\right)/g, '\\left($1\\right)');
  s = s.replace(/(?<!\\left)\((1\s*[\+\-]\s*\\frac\{[^}]+\}\{[^}]+\})\)(?!\\right)/g, '\\left($1\\right)');
  s = s.replace(/\\left\s*\\left/g, '\\left');
  s = s.replace(/\\right\s*\\right/g, '\\right');

  // Arrows: -> or \rightarrow -> \to
  s = s.replace(/\s*(?:->|-->|\\rightarrow)\s*/g, ' \\to ');

  // Math symbols
  s = s.replace(/\s*\+\/\-\s*/g, ' \\pm ');
  s = s.replace(/\s*<=\s*/g, ' \\le ');
  s = s.replace(/\s*>=\s*/g, ' \\ge ');
  s = s.replace(/\s*!=\s*/g, ' \\neq ');
  s = s.replace(/≈/g, ' \\approx ');
  s = s.replace(/∝/g, ' \\propto ');

  // Units formatting inside math
  s = s.replace(/\b(m\/s\^2|m\/s²)\b/g, '\\text{ m/s}^2');
  s = s.replace(/\b(m\/s)\b/g, '\\text{ m/s}');
  s = s.replace(/\b(km\/s)\b/g, '\\text{ km/s}');
  s = s.replace(/\b(km\/h)\b/g, '\\text{ km/h}');

  // Add \displaystyle for stacked fractions, limits, and matrices in options/formulas
  if (!s.includes('\\displaystyle') && (/\\frac\{|\\lim_|\\begin\{(?:pmatrix|bmatrix|vmatrix|matrix|array|aligned)\}/.test(s))) {
    s = '\\displaystyle ' + s;
  }
  s = s.replace(/(?:\\displaystyle\s*)+/g, '\\displaystyle ');

  // Balance braces
  let openCount = (s.match(/\{/g) || []).length;
  let closeCount = (s.match(/\}/g) || []).length;
  while (openCount > closeCount) {
    s += '}';
    closeCount++;
  }

  return s.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Checks whether an option or string represents a standalone pure mathematical formula.
 */
export function isPureMathFormula(str: string): boolean {
  if (!str) return false;
  const s = str.trim();

  // If it already starts with a LaTeX command like \displaystyle, \frac, \sqrt, \begin
  if (/^\\+(?:displaystyle|frac|sqrt|begin|mathbf|mathrm|text|left|alpha|beta|gamma|lambda|theta|pi|rho|sigma|omega|Delta|Omega)\b/i.test(s)) {
    return true;
  }

  // If it starts with common English question or statement starters
  if (/^(?:Let|Find|Evaluate|Calculate|Where|When|What|Which|Select|If|Given|Show|Prove|Determine|Consider|Suppose|According|Because|True|False)\b/i.test(s)) {
    return false;
  }

  // If it contains obvious English sentence phrases
  if (/\b(which|because|is said to be|remains?|increases? by a factor of|decreases? by a factor of|none of these|all of the above|independent of|proportional to|inversely proportional|defined by|inverse function)\b/i.test(s)) {
    return false;
  }

  // Text options with multiple English words (e.g. "Both one-to-one and onto", "Only onto", "None of these")
  if (/\b(both|only|neither|either|all|none|always|never|increases?|decreases?|remains?|constant|independent|proportional)\b/i.test(s) &&
      /\b(and|or|to|of|in|for|with|than|the|a|an|one|onto|same)\b/i.test(s)) {
    return false;
  }

  // If it has multiple normal English prose words (words >= 3 letters that are not standard math symbols/functions), it is NOT a pure math formula
  const words = s.match(/\b[a-zA-Z]{3,}\b/g) || [];
  const allowedMathWords = new Set([
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh', 'exp', 'log', 'lim', 'det', 'adj',
    'dim', 'gcd', 'lcm', 'deg', 'rad', 'min', 'max', 'arg', 'inf', 'sup', 'ker', 'img', 'mod',
    'sqrt', 'arcsin', 'arccos', 'arctan', 'theta', 'alpha', 'beta', 'gamma', 'lambda', 'omega',
    'sigma', 'delta', 'mu_0', 'epsilon_0', 'text', 'frac', 'left', 'right', 'mathbf', 'mathrm'
  ]);
  const englishWordCount = words.filter(w => !allowedMathWords.has(w.toLowerCase())).length;
  if (englishWordCount >= 2) {
    return false;
  }

  // Check if it has math operators, variables, numbers, functions, fractions, units
  const hasMathChar = /[\^_\{\}\\\/\+\-\*=\<\>≤≥≠≈∝∫√πθλωαβγδσμρνΔΦψεηζικξτυχ→∞±]/.test(s);
  const hasMathKeyword = /\b(sqrt|sin|cos|tan|cot|sec|csc|ln|log|lim|dy\/dx|dM\/dt|dv\/dt|dx|dy|dt|mu_0|epsilon_0|theta|alpha|beta|gamma|lambda|omega|pi|rho|sigma|delta|phi|psi)\b/i.test(s);
  const hasFunctionMapping = /\b[fghFGH]\s*:\s*[A-Za-z0-9_\{\}\mathbb\[\],\s\^]+\s*(?:->|-->|→|\\to)\s*[A-Za-z0-9_\{\}\mathbb\[\],\s\^]+\b/.test(s);
  const hasPureFraction = /^[+-]?(?:[a-zA-Z0-9\(\)\^_\{\}\*\s\\]+)\s*\/\s*(?:[a-zA-Z0-9\(\)\^_\{\}\*\s\\]+)$/.test(s);
  const hasSqrt = /(?:^|[\s\+\-\*\/])(?:\\?sqrt\b|√)/i.test(s);
  const hasDerivative = /\b(dy\/dx|d\^?2y\/dx\^?2|d2y\/dx2|df\/dx|dM\/dt|dv\/dt|d\/dx|d\/dt)\b/i.test(s);
  const hasCompoundTrigOrFraction = /(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\)\s*\/\s*(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\)/i.test(s);
  const hasLimit = /\blim\s*[_({]/i.test(s);
  const hasOnlyMathAndUnits = /^[+-]?[0-9a-zA-Z\s\(\)\[\]\^\*\/\+\-\.,\\_\{\}=<>|πθλωαβγδσμρνΔΦψεηζικξτυχ→∞≠≤≥≈∝±]*(?:\s*(?:N|J|W|m\/s|m\/s\^2|m\/s²|kg|m|s|Hz|V|Pa|rad|deg|rad\/s|\\text\{[^}]+\}))?$/i.test(s);

  if (hasCompoundTrigOrFraction && hasOnlyMathAndUnits) return true;
  if (hasLimit && hasOnlyMathAndUnits) return true;
  if (hasFunctionMapping) return true;
  if (hasPureFraction) return true;
  if (hasSqrt && hasOnlyMathAndUnits) return true;
  if (hasDerivative) return true;
  if ((hasMathChar || hasMathKeyword) && hasOnlyMathAndUnits) return true;

  return false;
}

/**
 * Auto-detects and converts embedded mathematical expressions in mixed prose/questions.
 */
export function autoDetectAndConvertMath(text: string): string {
  if (!text) return '';
  let str = text;

  // Pre-normalize unicode subscripts and superscripts
  str = str.replace(/₀/g, '_0').replace(/₁/g, '_1').replace(/₂/g, '_2').replace(/₃/g, '_3').replace(/₄/g, '_4')
           .replace(/₅/g, '_5').replace(/₆/g, '_6').replace(/₇/g, '_7').replace(/₈/g, '_8').replace(/₉/g, '_9');
  str = str.replace(/⁰/g, '^0').replace(/¹/g, '^1').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4')
           .replace(/⁵/g, '^5').replace(/⁶/g, '^6').replace(/⁷/g, '^7').replace(/⁸/g, '^8').replace(/⁹/g, '^9');

  // If the whole string is a pure math option or standalone formula:
  if (isPureMathFormula(str)) {
    return `$${formatLatexContent(str)}$`;
  }

  const applyOutsideMath = (s: string, fn: (text: string) => string) => {
    return s.split(/(\$[^\$]+\$)/g).map(part => (part.startsWith('$') && part.endsWith('$')) ? part : fn(part)).join('');
  };

  // Otherwise, it is a mixed sentence (question text or explanation).

  // 0a. Limits with argument and powers: e.g. "lim_{n→∞}(1+1/n)^{3n}", "lim_{x->0} sin(x)/x", "\lim_{x \to 0} \frac{\sin(7x)}{x}", "\displaystyle \lim_{x \to \infty}"
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])(?:\\+displaystyle\s+)?(?:\\?lim\s*(?:_\{[^}]+\}|_\([^\)]+\)|_[a-zA-Z0-9→\-\\>∞]+))\s*(?:\\frac\{(?:[^{}]|\{[^{}]*\})+\}\{(?:[^{}]|\{[^{}]*\})+\}|(?:\((?:[^()]|\([^()]*\))+\)|\[(?:[^\[\]]|\[[^\[\]]*\])+\])(?:\^\{[^}]+\}|\^[a-zA-Z0-9]+)?|[a-zA-Z0-9\^_\{\}\\\/\+\-\*]+)?/gi, (match) => {
      return `$${formatLatexContent(match.trim())}$`;
    })
  );

  // 0b. Standalone LaTeX fractions: e.g. "\frac{\sin(7x)}{x}", "\frac{1}{2}"
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])([+-]?(?:\\?[a-zA-Z0-9]+\s*)?\\frac\{(?:[^{}]|\{[^{}]*\})+\}\{(?:[^{}]|\{[^{}]*\})+\})(?![\$\w])/g, (_m, match) => {
      return `$${formatLatexContent(match)}$`;
    })
  );

  // 0b. Compound trig / function fractions: e.g. "sin(3*θ)/sin(theta) - cos(3*θ)/cos(theta)"
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])(?:\\?(?:sin|cos|tan|cot|sec|csc)\s*\(((?:[^()]|\([^()]*\))+)\)\s*\/\s*\\?(?:sin|cos|tan|cot|sec|csc)\s*\(((?:[^()]|\([^()]*\))+)\))(?:\s*[\+\-\*\/]\s*(?:\\?(?:sin|cos|tan|cot|sec|csc)\s*\(((?:[^()]|\([^()]*\))+)\)\s*\/\s*\\?(?:sin|cos|tan|cot|sec|csc)\s*\(((?:[^()]|\([^()]*\))+)\)))*/gi, (match) => {
      return `$${formatLatexContent(match)}$`;
    })
  );

  // 1. Function mappings: e.g. "f: A -> B" -> "$f: A \to B$"
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/\b([fghFGH]\s*:\s*[A-Za-z0-9_\{\}\mathbb\[\],\s\^]+?\s*(?:->|-->|→|\\to)\s*[A-Za-z0-9_\{\}\mathbb\[\],\s\^]+?)(?=[.,;!?\s]|$|\))/g, (_m, match) => {
      return `$${formatLatexContent(match)}$`;
    })
  );

  // 2. Equations with functions and fractions: e.g. "y = arctan((2x) / (1 - x²))", "v = \sqrt{\gamma P / \rho}", "\gamma = Cp/Cv"
  const stopWords = '(?:\\s+(?:what|which|where|when|for|if|with|then|is|and|or|in|at|by|such|so|find|evaluate|calculate|defined)\\b|$)';
  str = applyOutsideMath(str, (chunk) => {
    let s = chunk.replace(new RegExp('\\b([fgh]\\([a-zA-Z0-9,\\s]+\\)\\s*=\\s*[0-9a-zA-Z\\^\\*\\/\\+\\-\\s\\(\\)\\\\]+?)(?=[.,;!?]|' + stopWords + ')', 'i'), (match) => {
      return `$${formatLatexContent(match)}$`;
    });

    s = s.replace(/(?<![\$\w])((?:\\[a-zA-Z]+|[a-zA-Z])(?:\([a-zA-Z0-9]+\))?\s*=\s*(?:\\?[a-zA-Z]+\s*\((?:[^()]|\([^()]*\))+\)|[a-zA-Z0-9\(\)\[\]\^_{}+\-*/\s\\]+?))(?=[.,;!?]|(?:\s+(?:what|which|where|when|for|if|with|then|is|and|or|in|at|by|such|so|find|evaluate|calculate|defined)\b|$))/g, (match) => {
      if (/[\^_\/\+\-\*√]|sqrt|arctan|tan|sin|cos|ln|log|\\/.test(match)) {
        return `$${formatLatexContent(match)}$`;
      }
      return match;
    });
    return s;
  });

  // 3. Inverse function notation: f^(-1)(x)
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/\b([fgh]\^\(-1\)\([a-zA-Z0-9,\s]+\))\b/g, (_m, match) => {
      return `$${formatLatexContent(match)}$`;
    })
  );

  // 4. Derivatives: dy/dx, d^2y/dx^2, d/dx, dM/dt, dv/dt
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])(d\^?2y\/dx\^?2|d2y\/dx2|dy\/dx|d\/dx|d\/dt|df\/dx|dM\/dt|dv\/dt)(?![\$\w])/g, (_m, match) => {
      return `$\\displaystyle ${formatLatexContent(match)}$`;
    })
  );

  // 5. Square root expressions: sqrt(...), √(..), sqrt 6, sqrt(6), sqrt 2
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w\\])(?:\\?sqrt\s*[\(\{]\s*([^{}()]+)\s*[\)\}]|\\?sqrt\s+([a-zA-Z0-9]+)|√\s*[\(\{]?\s*([^{}()]+)\s*[\)\}]?)(?![\$\w])/gi, (_m, g1, g2, g3) => {
      const inner = g1 || g2 || g3;
      return `$\\sqrt{${formatLatexContent(inner)}}$`;
    })
  );

  // 6. Scientific notation: e.g. 3.0 * 10^8, 1.5 * 10^-3
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])([+-]?\d+(?:\.\d+)?)\s*\*\s*10\^([+\-]?[0-9]+)(?![\$\w])/g, (_m, coef, exp) => {
      return `$${coef} \\times 10^{${exp}}$`;
    })
  );

  // 7. Standalone slash fractions: e.g. 1 / [(x - 1)(x + 2)], (x + 1) / [x^2(x - 2)], 2 / (1 + x²)
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])((?:[+-]?[a-zA-Z0-9\(\)]+)\s*\/\s*(?:\[[^\[\]]+\]|\(((?:[^()]|\([^()]*\))+)\)|[a-zA-Z0-9]+(?:\^[0-9]+)?))(?![\$\w])/g, (_m, match) => {
      if (match.includes('/')) {
        // Avoid converting standard standalone unit strings like m/s or km/h
        if (/^(?:m\/s|km\/h|kJ\/mol|cm\/s|g\/cm|N\/m)$/i.test(match.trim())) {
          return match;
        }
        return `$${formatLatexContent(match)}$`;
      }
      return match;
    })
  );

  // 8. Standalone caret exponents: e.g. x^2, e^(3x), 10^-3, 2^n
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])(?:[a-zA-Z0-9_]+|\([^\)\n]+\))\^(?:\([^\)\n]+\)|[+\-]?[a-zA-Z0-9]+)(?![\$\w])/g, (match) => {
      if (/^[0-9]+$/.test(match)) return match;
      return `$${formatLatexContent(match)}$`;
    })
  );

  // 9. Relations in formulas: e.g. θ != n*pi, x <= 5
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])([a-zA-Z0-9_θπαβγδλω\\]+)\s*(!=|<=|>=|<|>)\s*([a-zA-Z0-9_θπαβγδλω\*\\]+)(?![\$\w])/g, (_m, left, op, right) => {
      const opLatex = op === '!=' ? '\\neq' : op === '<=' ? '\\le' : op === '>=' ? '\\ge' : op;
      return `$${formatLatexContent(left)} ${opLatex} ${formatLatexContent(right)}$`;
    })
  );

  // 10. Standalone Greek letters and symbols in text: e.g. \gamma, \lambda, \theta, theta, alpha
  const GREEK_MAP: Record<string, string> = {
    'θ': '\\theta',
    'π': '\\pi',
    'α': '\\alpha',
    'β': '\\beta',
    'γ': '\\gamma',
    'δ': '\\delta',
    'λ': '\\lambda',
    'ω': '\\omega',
    'μ': '\\mu',
    'ρ': '\\rho',
    'σ': '\\sigma',
    'Δ': '\\Delta',
    'Ω': '\\Omega',
    'Φ': '\\Phi',
    'ψ': '\\psi'
  };

  str = applyOutsideMath(str, (chunk) => {
    let s = chunk;
    s = s.replace(/(?<![\$\\\w])\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)(?![\w\{])/gi, (m, g) => `$\\${g.toLowerCase()}$`);
    s = s.replace(/(?<![\$\\\w])\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b(?![\w\{])/gi, (m, g) => `$\\${g.toLowerCase()}$`);
    s = s.replace(/(?<![\$\\\w])\b(Delta|Gamma|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)\b(?![\w\{])/g, '$\\$1$');
    s = s.replace(/(?<![\$\\\w])([θπαβγδλωΔΩΦψ])(?![\$\w\{])/g, (_m, char) => `$${GREEK_MAP[char] || char}$`);
    s = s.replace(/(?<![\$\\\w])\\(mu_0|epsilon_0)(?![\w\{])/g, '$\\$1$');
    return s;
  });

  // 11. Expressions with asterisks (multiplication): e.g. a1*x, 3*θ, n*pi
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])([a-zA-Z0-9_θπαβγδλω\\]+\s*\*\s*[a-zA-Z0-9_θπαβγδλω\\]+(?:\s*[\+\-\*\/=]\s*[a-zA-Z0-9_θπαβγδλω\\]+)*)(?![\$\w])/g, (match) => {
      return `$${formatLatexContent(match)}$`;
    })
  );

  // 11. Standalone chemical / nuclear reactions with ->
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\$\w])([a-zA-Z0-9_\^\{\}\+\-\s]+\s*(?:->|-->)\s*[a-zA-Z0-9_\^\{\}\+\-\s]+)(?![\$\w])/g, (match) => {
      if (/[a-zA-Z0-9]\s*->\s*[a-zA-Z0-9]/.test(match)) {
        return `$${formatLatexContent(match)}$`;
      }
      return match;
    })
  );

  // 12. Asterisks as multiplication in prose: e.g. r * F -> r × F, 3 * 10 -> 3 × 10
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<=\b[a-zA-Z0-9]\b)\s*\*\s*(?=\b[a-zA-Z0-9]\b)/g, ' × ')
  );

  // 13. Replace any remaining -> with Unicode arrow → in plain text
  str = applyOutsideMath(str, (chunk) =>
    chunk.replace(/(?<![\\a-zA-Z0-9_])->|-->(?![\\a-zA-Z0-9_])/g, '→').replace(/->|-->/g, '→')
  );

  return str;
}

/**
 * Preprocesses a raw text string containing potential plain-text math or chemistry notation,
 * converting expressions into standard LaTeX math delimiters ($...$ or $$...$$) while preserving
 * all Markdown headers, bolding, lists, and prose explanations intact.
 */
export function preprocessMathText(text: string): string {
  if (!text) return '';
  let str = String(text);

  // Normalize newlines and carriage returns cleanly (DO NOT delete \r in commands!)
  str = str.replace(/\r\n/g, '\n').replace(/\r(?!\w)/g, '\n');
  if (str.includes('\\n')) {
    str = str.replace(/\\n(?!(?:u|eq|otin|abla|eg|exists|sim|vdash|subseteq|parallel|cong|rightarrow|leftarrow|Rightarrow|Leftarrow|earrow|warrow|atural|ewcommand|ormalsize|obreak|o|ode|ull|um|umber|int|oalign)(?![a-zA-Z]))/g, '\n');
  }
  str = str.replace(/\\r\\n/g, '\n').replace(/\\r(?=\\n)/g, '');

  str = str.replace(/\x0Crac/g, '\\frac');
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // 1. Normalize LaTeX block delimiters \[ ... \] to $$ ... $$ and \( ... \) to $ ... $
  str = str.replace(/\\\[([\s\S]*?)\\\]/g, (_m, g) => `\n\n$$\n${g.trim()}\n$$\n\n`);
  str = str.replace(/\\\(([\s\S]*?)\\\)/g, (_m, g) => `$${g.trim()}$`);

  // Protect standalone currency values like $0, $10, $100 (only when NOT followed by a matching closing $ on the same line)
  str = str.replace(/(^|[\s\(\[\{])\$(\d+(?:\.\d+)?)(?=[\s,;:\.!?)]|$)/g, (match, prefix, num, offset, full) => {
    const after = full.slice(offset + match.length);
    if (/^[^\$\n]*\$/.test(after)) {
      return match;
    }
    return prefix + '\\$' + num;
  });

  // Ensure headings start on new lines
  str = str.replace(/([^\n])\s*(#{1,6})([^\s#\n])/g, '$1\n\n$2 $3');
  str = str.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');
  str = str.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');

  // If the string as a whole is a pure math formula, format it directly
  if (!str.includes('```') && isPureMathFormula(str)) {
    return `$${formatLatexContent(str)}$`;
  }

  // Split by existing LaTeX delimiters ($...$ or $$...$$)
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

      // Matrix [[a, b], [c, d]]
      textChunk = textChunk.replace(
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

      // LaTeX begin{...} ... end{...}
      textChunk = textChunk.replace(
        /(?:\\+displaystyle\s*)?\\+begin\{([a-zA-Z*]+)\}[\s\S]*?\\+end\{\1\}/g,
        (match) => `\n\n$$\n${formatLatexContent(match)}\n$$\n\n`
      );

      // LaTeX un-delimited \displaystyle blocks or formulas
      textChunk = textChunk.replace(
        /(?<![\$\w\\])(?:\\+displaystyle\s+)([^\n$]+?)(?=(?:\n\n|\n[A-Z]|\.$|\?$|\!$|$|\s+[A-Z][a-z]{3,}\b))/g,
        (_m, content) => `\n\n$$\n${formatLatexContent('\\displaystyle ' + content)}\n$$\n\n`
      );

      // Run autoDetectAndConvertMath
      textChunk = autoDetectAndConvertMath(textChunk);

      // Clean remaining plain text
      textChunk = textChunk.replace(/(?<![\\a-zA-Z0-9_])->|-->(?![\\a-zA-Z0-9_])/g, '→');

      result += textChunk;
    }
  }

  // Auto-close unclosed $$ block if text was truncated or streaming
  const displayDollarCount = (result.match(/\$\$/g) || []).length;
  if (displayDollarCount % 2 !== 0) {
    result += '\n$$\n';
  }

  return result;
}

/**
 * Emergency fallback cleaner to convert LaTeX syntax into human-readable text
 * so that raw LaTeX source code (\displaystyle, \frac, \sqrt, etc.) is NEVER shown to the student.
 */
export function convertLatexToReadableText(latex: string): string {
  let s = latex;
  s = s.replace(/\\displaystyle/g, '');
  s = s.replace(/\\gammaho\b/gi, 'γρ').replace(/\\gamma\\rho\b/gi, 'γρ');
  s = s.replace(/\\frac\{\\sqrt\{([^}]+)\}\}\{\(?\\?gamma\s*\\?r?ho\)?\}/gi, '√(($1) / (γρ))');
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1) / ($2)');
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  s = s.replace(/\\to\b/g, '→');
  s = s.replace(/\\times\b/g, '×');
  s = s.replace(/\\cdot\b/g, '·');
  s = s.replace(/\\pm\b/g, '±');
  s = s.replace(/\\le\b/g, '≤');
  s = s.replace(/\\ge\b/g, '≥');
  s = s.replace(/\\neq\b/g, '≠');
  s = s.replace(/\\approx\b/g, '≈');
  s = s.replace(/\\propto\b/g, '∝');
  s = s.replace(/\\alpha\b/g, 'α').replace(/\\beta\b/g, 'β').replace(/\\gamma\b/g, 'γ')
       .replace(/\\delta\b/g, 'δ').replace(/\\theta\b/g, 'θ').replace(/\\lambda\b/g, 'λ')
       .replace(/\\mu\b/g, 'μ').replace(/\\pi\b/g, 'π').replace(/\\rho\b/g, 'ρ')
       .replace(/\\sigma\b/g, 'σ').replace(/\\omega\b/g, 'ω').replace(/\\nu\b/g, 'ν')
       .replace(/\\Delta\b/g, 'Δ').replace(/\\Phi\b/g, 'Φ').replace(/\\psi\b/g, 'ψ');
  s = s.replace(/\\mathrm\{([^{}]+)\}/g, '$1');
  s = s.replace(/\\text\{([^{}]+)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^{}]+)\}/g, '$1');
  s = s.replace(/\\[a-zA-Z]+/g, '');
  s = s.replace(/[{}]/g, '');
  return s.trim();
}

/**
 * Escapes HTML characters.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders LaTeX content safely using KaTeX. Returns HTML string.
 * Guarantees that raw unrendered LaTeX source code is NEVER shown to the student.
 */
export function renderKaTeX(latex: string, displayMode: boolean = false): string {
  try {
    let cleanLatex = formatLatexContent(latex);
    if (katexModule) {
      let html = katexModule.renderToString(cleanLatex, {
        displayMode,
        throwOnError: false,
        output: 'html',
        strict: false,
      });

      // Remove phantom nulldelimiter elements that leave stray cursor or vertical bar artifacts
      html = html.replace(/<span class="m(?:open|close) nulldelimiter"><\/span>/g, '');

      // Check if KaTeX encountered an error
      if (html.includes('katex-error')) {
        // Attempt emergency repair: strip \displaystyle, fix \gammaho, etc.
        let repaired = cleanLatex
          .replace(/\\displaystyle/g, '')
          .replace(/\\gammaho\b/gi, '\\gamma \\rho')
          .replace(/\\gamma\\rho\b/gi, '\\gamma \\rho')
          .replace(/\\frac\{\\sqrt\{([^}]+)\}\}\{\(?\\?gamma\s*\\?r?ho\)?\}/gi, '\\sqrt{\\frac{$1}{\\gamma \\rho}}')
          .replace(/\\frac\{\\sqrt\{([^}]+)\}\}\{\(?\\gamma\s*\\rho\)?\}/gi, '\\sqrt{\\frac{$1}{\\gamma \\rho}}');
        let repairedHtml = katexModule.renderToString(repaired, {
          displayMode,
          throwOnError: false,
          output: 'html',
          strict: false,
        });

        if (!repairedHtml.includes('katex-error')) {
          return repairedHtml.replace(/<span class="m(?:open|close) nulldelimiter"><\/span>/g, '');
        }

        // If still errored, NEVER leak raw LaTeX source code to the student!
        // Format as clean, readable mathematical Unicode text
        const readable = convertLatexToReadableText(latex);
        return `<span class="math-fallback font-sans font-medium text-inherit">${escapeHtml(readable)}</span>`;
      }

      return html;
    }

    // Trigger background loading if needed
    loadKaTeX();

    const readable = convertLatexToReadableText(cleanLatex);
    return `<span class="math-fallback font-sans font-medium text-inherit">${escapeHtml(readable)}</span>`;
  } catch (err) {
    console.warn('KaTeX rendering error:', err);
    const readable = convertLatexToReadableText(latex);
    return `<span class="math-fallback font-sans font-medium text-inherit">${escapeHtml(readable)}</span>`;
  }
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
