import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Copy,
  Check,
  Target,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MathText } from '../ui/MathText';

interface FormulaVaultViewProps {
  onAskBoardyWithFormula: (formulaTitle: string, latex: string) => void;
}

interface FormulaItem {
  id: string;
  subject: 'Mathematics' | 'Physics' | 'Chemistry';
  chapter: string;
  title: string;
  latex: string;
  description: string;
  examTip?: string;
}

const FORMULAS_DATA: FormulaItem[] = [
  // Mathematics
  {
    id: 'm-1',
    subject: 'Mathematics',
    chapter: 'Differentiation',
    title: 'Product & Quotient Rules',
    latex: '\\frac{d}{dx}[u \\cdot v] = u \\frac{dv}{dx} + v \\frac{du}{dx}, \\quad \\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{v \\frac{du}{dx} - u \\frac{dv}{dx}}{v^2}',
    description: 'Fundamental differential calculus rules used throughout algebraic and trigonometric derivatives.',
    examTip: 'Remember: In the quotient rule, denominator is v^2 and the minus sign belongs to the numerator derivative times denominator.',
  },
  {
    id: 'm-2',
    subject: 'Mathematics',
    chapter: 'Integration',
    title: 'Integration by Parts',
    latex: '\\int u \\, dv = u \\cdot v - \\int v \\, du',
    description: 'Used when integrating product of algebraic, logarithmic, inverse trig, or exponential functions.',
    examTip: 'Use the ILATE rule (Inverse, Log, Algebraic, Trig, Exponential) to pick u.',
  },
  {
    id: 'm-3',
    subject: 'Mathematics',
    chapter: 'Conics',
    title: 'Standard Parabola Equations',
    latex: 'y^2 = 4ax \\implies \\text{Focus: } (a, 0), \\quad \\text{Directrix: } x = -a, \\quad \\text{Latus Rectum} = 4a',
    description: 'Rightward parabola opening along the positive x-axis with vertex at the origin.',
    examTip: 'Length of latus rectum is ALWAYS 4a regardless of orientation or shifts.',
  },
  {
    id: 'm-4',
    subject: 'Mathematics',
    chapter: 'Trigonometry',
    title: 'Double Angle & Half Angle Formulas',
    latex: '\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta, \\quad \\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta = 2\\cos^2\\theta - 1',
    description: 'Essential double-angle relationships used to simplify complex entrance test trigonometric integrals.',
  },
  {
    id: 'm-5',
    subject: 'Mathematics',
    chapter: 'Vectors',
    title: 'Dot & Cross Product',
    latex: '\\vec{A} \\cdot \\vec{B} = |\\vec{A}||\\vec{B}|\\cos\\theta, \\quad |\\vec{A} \\times \\vec{B}| = |\\vec{A}||\\vec{B}|\\sin\\theta',
    description: 'Scalar and vector product relations between two vectors in 3D Euclidean space.',
    examTip: 'Orthogonal condition: A · B = 0. Collinear condition: A × B = 0.',
  },

  // Physics
  {
    id: 'p-1',
    subject: 'Physics',
    chapter: 'Mechanics',
    title: 'Projectile Motion Relations',
    latex: 'H_{\\max} = \\frac{v_0^2 \\sin^2\\theta}{2g}, \\quad R = \\frac{v_0^2 \\sin(2\\theta)}{g}, \\quad T = \\frac{2v_0 \\sin\\theta}{g}',
    description: 'Maximum height, horizontal range, and total time of flight for a projectile fired at angle θ.',
    examTip: 'Max range occurs at θ = 45°. Complementary angles (e.g. 30° and 60°) produce the exact same horizontal range R.',
  },
  {
    id: 'p-2',
    subject: 'Physics',
    chapter: 'Circular Motion',
    title: 'Centripetal Force & Angular Acceleration',
    latex: 'F_c = \\frac{m v^2}{r} = m r \\omega^2, \\quad a_c = \\frac{v^2}{r} = r \\omega^2',
    description: 'Inward radial force required to keep a body of mass m moving along a circular path of radius r.',
  },
  {
    id: 'p-3',
    subject: 'Physics',
    chapter: 'Electrostatics',
    title: 'Coulomb Law & Electric Potential',
    latex: 'F = \\frac{1}{4\\pi \\varepsilon_0} \\frac{q_1 q_2}{r^2}, \\quad V = \\frac{1}{4\\pi \\varepsilon_0} \\frac{q}{r}',
    description: 'Electrostatic force between point charges and the electric potential at distance r.',
    examTip: 'Potential is scalar (signs matter!), while electric field is a vector.',
  },
  {
    id: 'p-4',
    subject: 'Physics',
    chapter: 'Current Electricity',
    title: 'Equivalent Resistance & Wheatstone Bridge',
    latex: 'R_{\\text{series}} = R_1 + R_2, \\quad \\frac{1}{R_{\\text{parallel}}} = \\frac{1}{R_1} + \\frac{1}{R_2}, \\quad \\frac{R_1}{R_2} = \\frac{R_3}{R_4}',
    description: 'Combination of resistances and the balanced condition for null deflection in Wheatstone bridge.',
  },
  {
    id: 'p-5',
    subject: 'Physics',
    chapter: 'Electromagnetism',
    title: 'Faraday Law of Induction',
    latex: '\\mathcal{E} = -N \\frac{\\Delta \\Phi_B}{\\Delta t}, \\quad \\Phi_B = \\vec{B} \\cdot \\vec{A} = B A \\cos\\theta',
    description: 'Induced electromotive force in a coil of N turns due to rate of change of magnetic flux.',
    examTip: 'The negative sign represents Lenz Law: the induced emf opposes the magnetic flux change causing it.',
  },

  // Chemistry
  {
    id: 'c-1',
    subject: 'Chemistry',
    chapter: 'Physical Chemistry',
    title: 'Ideal Gas Law & Graham Law of Diffusion',
    latex: 'PV = nRT = \\frac{m}{M}RT, \\quad \\frac{r_1}{r_2} = \\sqrt{\\frac{M_2}{M_1}} = \\sqrt{\\frac{d_2}{d_1}}',
    description: 'Equation of state for ideal gases and relative rates of diffusion of two gases.',
    examTip: 'Lighter gases diffuse faster than heavier gases by inverse square root of molar masses.',
  },
  {
    id: 'c-2',
    subject: 'Chemistry',
    chapter: 'Chemical Equilibrium',
    title: 'Equilibrium Constant & Henderson-Hasselbalch',
    latex: 'K_p = K_c (RT)^{\\Delta n}, \\quad \\text{pH} = \\text{pK}_a + \\log\\left(\\frac{[\\text{Conjugate Base}]}{[\\text{Acid}]}\\right)',
    description: 'Relation between pressure and concentration equilibrium constants and buffer solution pH.',
  },
  {
    id: 'c-3',
    subject: 'Chemistry',
    chapter: 'Reaction Kinetics',
    title: 'Arrhenius Equation & Activation Energy',
    latex: 'k = A e^{-\\frac{E_a}{RT}}, \\quad \\ln\\left(\\frac{k_2}{k_1}\\right) = \\frac{E_a}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)',
    description: 'Temperature dependence of reaction rate constants and activation energy determination.',
  },
];

export const FormulaVaultView: React.FC<FormulaVaultViewProps> = ({
  onAskBoardyWithFormula,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFormulas = useMemo(() => {
    return FORMULAS_DATA.filter((f) => {
      if (selectedSubject !== 'All Subjects' && f.subject !== selectedSubject) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.chapter.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.latex.toLowerCase().includes(q)
      );
    });
  }, [selectedSubject, searchQuery]);

  const handleCopyLatex = (id: string, latex: string) => {
    navigator.clipboard.writeText(latex);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
            High-Yield Formula Vault
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Official formulas, identities, and shortcuts rendered with KaTeX for Pakistani entrance tests.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['All Subjects', 'Mathematics', 'Physics', 'Chemistry'].map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/30'
                  : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-faint)]" />
          <input
            type="text"
            placeholder="Search formula, chapter, or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
      </div>

      {/* Formulas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFormulas.map((item) => (
          <Card
            key={item.id}
            variant="glass"
            className="p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all text-left"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="student" size="sm">
                    {item.subject}
                  </Badge>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    {item.chapter}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyLatex(item.id, item.latex)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                  title="Copy LaTeX formula"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-[#34D399]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <h3 className="text-base font-bold text-white">
                {item.title}
              </h3>

              {/* KaTeX Formula Box */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center overflow-x-auto my-2">
                <MathText text={`$$${item.latex}$$`} />
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {item.description}
              </p>

              {item.examTip && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                  <span className="font-bold text-amber-400">Exam Shortcut: </span>
                  {item.examTip}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/8 flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-faint)]">
                National Syllabus v2026
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAskBoardyWithFormula(item.title, item.latex)}
                rightIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--brand-2)]" />}
                className="text-xs"
              >
                Derive with Boardy AI
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
