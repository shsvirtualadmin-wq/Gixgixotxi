import fs from 'fs';
import path from 'path';

interface RouteMetadata {
  path: string;
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  robots: string;
  schema: Record<string, any>;
  generateContent: () => string;
}

const PUBLIC_ROUTES: RouteMetadata[] = [
  {
    path: '/',
    title: 'Boardly | Online MCQ Practice for MDCAT, FSC & Matric',
    description: 'Master MDCAT, FSC & Matric exams with Boardly. Practice 25,000+ board-aligned MCQs, timed mock tests, step-by-step derivations & 24/7 Boardy AI tutor.',
    canonical: 'https://boardly.cfd/',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'EducationalOrganization',
          '@id': 'https://boardly.cfd/#organization',
          name: 'Boardly',
          url: 'https://boardly.cfd',
          logo: 'https://boardly.cfd/logo.png',
          parentOrganization: {
            '@type': 'Organization',
            name: 'SHS Virtual Academy',
            url: 'https://shsvirtualacademy.pro',
          },
        },
        {
          '@type': 'WebSite',
          '@id': 'https://boardly.cfd/#website',
          name: 'Boardly',
          url: 'https://boardly.cfd',
        },
      ],
    },
    generateContent: () => `
      <section class="hero-section py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-4">
          National Exam Testing Engine · 2026 Academic Season
        </span>
        <h1 class="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-6">
          Self-Paced MCQ Practice for <span class="text-blue-600">Matric, FSC &amp; Entry Tests</span>
        </h1>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
          Conquer FBISE, Punjab, Sindh &amp; KPK board exams along with high-stakes medical (MDCAT) and engineering entrance tests (FAST-NU, UET ECAT, NUST). Master 25,000+ SLO-aligned MCQs with complete derivations and 24/7 Boardy AI guidance.
        </p>
        <div class="flex flex-wrap justify-center gap-4 mb-12">
          <a href="/pricing" class="px-8 py-3.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg">Start Free Practice</a>
          <a href="/features" class="px-8 py-3.5 rounded-full bg-slate-100 text-slate-800 font-bold hover:bg-slate-200">Explore Features</a>
        </div>
      </section>

      <section class="max-w-6xl mx-auto px-4 py-12">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6 text-center">
          Choose Your Exam Preparation Track
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-xl font-bold text-slate-900 mb-2">MDCAT Medical</h3>
            <p class="text-sm text-slate-600 mb-4">PMDC syllabus-aligned question banks for Biology, Chemistry, Physics, English &amp; Logical Reasoning with timed full mocks.</p>
            <a href="/mdcat" class="text-sm font-bold text-blue-600 hover:underline">Explore MDCAT Prep &rarr;</a>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-xl font-bold text-slate-900 mb-2">FSC &amp; Matric (FBISE)</h3>
            <p class="text-sm text-slate-600 mb-4">Classes 9, 10, 11 &amp; 12 SLO-verified past papers and chapter vaults covering Federal and Provincial boards.</p>
            <a href="/fsc-matric" class="text-sm font-bold text-blue-600 hover:underline">Explore Board Prep &rarr;</a>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-xl font-bold text-slate-900 mb-2">FAST-NU &amp; UET</h3>
            <p class="text-sm text-slate-600 mb-4">Advanced Mathematics, Physics, and analytical speed drills calibrated for negative marking engineering entrance exams.</p>
            <a href="/fast-nu" class="text-sm font-bold text-blue-600 hover:underline">Explore Engineering Prep &rarr;</a>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-xl font-bold text-slate-900 mb-2">Boardly AI Assistant</h3>
            <p class="text-sm text-slate-600 mb-4">24/7 intelligent conceptual tutor trained on Pakistani curricula to break down difficult numericals step-by-step.</p>
            <a href="/boardly-ai" class="text-sm font-bold text-blue-600 hover:underline">Meet Boardy AI &rarr;</a>
          </div>
        </div>
      </section>

      <section class="max-w-5xl mx-auto px-4 py-12">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6 text-center">
          Why Pakistani Students Rely on Boardly
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
          <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-1">Authentic Derivations</h4>
            <p class="text-sm">Every single MCQ includes full mathematical formulas and conceptual justifications so you never have to guess the correct answer.</p>
          </div>
          <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-1">National Percentiles</h4>
            <p class="text-sm">Benchmark your test accuracy against 45,000+ candidates across Islamabad, Lahore, Karachi, Peshawar, and Quetta.</p>
          </div>
          <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-1">Transparent Pricing</h4>
            <p class="text-sm">Start free forever or unlock unlimited access starting at just Rs 199/month, backed by SHS Virtual Academy.</p>
          </div>
        </div>
      </section>
    `,
  },
  {
    path: '/features',
    title: 'Features | Boardly MCQ Practice, Mock Tests & AI Tutor',
    description: 'Explore Boardly\'s chapter-wise MCQ question banks, authentic board-pattern timed mocks, weak-topic analytics, step-by-step derivations & 24/7 AI assistance.',
    canonical: 'https://boardly.cfd/features',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Boardly Exam Features',
      applicationCategory: 'EducationalApplication',
      url: 'https://boardly.cfd/features',
      description: 'Adaptive diagnostic MCQ test engine with full board and entrance exam coverage in Pakistan.',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-4">
          Engineered for Deep Academic Mastery
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
          Everything You Need to Rank at the Top of Your Board
        </h1>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Boardly replaces fragmented past paper booklets with an intelligent, self-paced diagnostic testing portal. Designed to help Matric, Intermediate, and Entrance Test candidates achieve top percentiles.
        </p>
      </section>

      <section class="max-w-5xl mx-auto px-4 py-10 space-y-12">
        <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h2 class="text-2xl font-bold text-slate-900 mb-3">Chapter-Wise Question Vaults with Step-by-Step Derivations</h2>
          <p class="text-slate-600 mb-4 leading-relaxed">
            Practice questions organized strictly by chapter and topic according to the latest Student Learning Outcomes (SLOs). Each question is verified by experienced board examiners and includes detailed step-by-step mathematical calculations, biological justifications, and chemical equations.
          </p>
          <ul class="list-disc list-inside space-y-1.5 text-slate-700 text-sm">
            <li>25,000+ curated MCQs across Physics, Chemistry, Biology, Mathematics, and Computer Science.</li>
            <li>Categorized into Easy (Recall), Medium (Application), and Hard (Synthesis) cognitive levels.</li>
            <li>Instant feedback highlighting the exact textbook chapter and reference concept.</li>
          </ul>
        </div>

        <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h2 class="text-2xl font-bold text-slate-900 mb-3">Boardy: 24/7 Conceptual AI Study Buddy</h2>
          <p class="text-slate-600 mb-4 leading-relaxed">
            Stuck on a tricky physics numerical or organic reaction mechanism? Boardy is our proprietary AI academic assistant instructed specifically on Pakistani textbook boards. Instead of merely handing you the answer, Boardy uses Socratic hints to guide you through the formula derivation.
          </p>
          <a href="/boardly-ai" class="text-blue-600 font-bold hover:underline">Learn more about Boardy AI &rarr;</a>
        </div>

        <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h2 class="text-2xl font-bold text-slate-900 mb-3">Authentic Timed Mock Exams &amp; Negative Marking Simulations</h2>
          <p class="text-slate-600 mb-4 leading-relaxed">
            Experience the real pressure of examination day before entering the test hall. Our timed mock engine replicates official patterns for PMDC MDCAT, FAST-NU, UET ECAT, and FBISE annual papers, complete with sectional timers and negative marking penalties.
          </p>
        </div>

        <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h2 class="text-2xl font-bold text-slate-900 mb-3">Weak-Topic Diagnostic Analytics &amp; Formula Sheets</h2>
          <p class="text-slate-600 mb-4 leading-relaxed">
            Stop wasting time practicing what you already know. Boardly analyzes every attempt and builds a live diagnostic heat map highlighting your weak topics. Access printable high-yield formula sheets and quick-revision summaries before every paper.
          </p>
        </div>
      </section>
    `,
  },
  {
    path: '/pricing',
    title: 'Pricing Plans | Affordable Boardly Pro & Premium Prep',
    description: 'Explore flexible Boardly plans starting at Rs 0. Upgrade to Pro (Rs 199/mo) or Premium (Rs 399/mo) for unlimited chapter vaults and full-length mocks.',
    canonical: 'https://boardly.cfd/pricing',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Boardly Pro & Premium Memberships',
      description: 'Affordable online exam preparation subscriptions for Matric, FSC and MDCAT students.',
      offers: [
        { '@type': 'Offer', name: 'Starter Free', price: '0', priceCurrency: 'PKR' },
        { '@type': 'Offer', name: 'Pro Monthly', price: '199', priceCurrency: 'PKR' },
        { '@type': 'Offer', name: 'Premium Monthly', price: '399', priceCurrency: 'PKR' },
      ],
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-4">
          Affordable, Transparent Subscriptions
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
          Choose Your Path to <span class="text-blue-600">Success</span>
        </h1>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Flexible plans designed to fit your preparation journey. Start with what works for you and upgrade anytime. No hidden charges or automatic debit traps.
        </p>
      </section>

      <section class="max-w-6xl mx-auto px-4 py-10">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8 text-center">
          Compare Boardly Plans
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Starter</span>
              <h3 class="text-2xl font-bold text-slate-900 mt-2 mb-4">Starter Access</h3>
              <div class="text-4xl font-black text-slate-900 mb-2">Rs 0</div>
              <p class="text-xs text-slate-500 mb-6">Free forever. Perfect for evaluating chapter question styles.</p>
              <ul class="space-y-3 text-sm text-slate-700">
                <li>✓ 3 practice tests per day</li>
                <li>✓ 3 Boardy AI conceptual chats per day</li>
                <li>✓ Core chapter vaults unlocked</li>
                <li>✓ Basic performance review</li>
              </ul>
            </div>
            <a href="/login" class="mt-8 block w-full py-3 text-center rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50">Start Free</a>
          </div>

          <div class="p-8 rounded-3xl bg-blue-50/50 border-2 border-blue-600 shadow-xl flex flex-col justify-between relative">
            <span class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow">
              Most Popular
            </span>
            <div>
              <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Pro Tier</span>
              <h3 class="text-2xl font-bold text-slate-900 mt-2 mb-4">Boardly Pro</h3>
              <div class="text-4xl font-black text-slate-900 mb-2">Rs 199 <span class="text-sm font-normal text-slate-500">/ month</span></div>
              <p class="text-xs text-slate-500 mb-6">Discounted to Rs 159/mo (6 Months) or Rs 139/mo (12 Months).</p>
              <ul class="space-y-3 text-sm text-slate-700">
                <li>✓ 10 practice tests per day</li>
                <li>✓ 15 Boardy AI chats per day</li>
                <li>✓ All chapter question banks unlocked</li>
                <li>✓ Comprehensive step-by-step derivations</li>
                <li>✓ National percentile rankings</li>
              </ul>
            </div>
            <a href="/login" class="mt-8 block w-full py-3 text-center rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md">Get Pro</a>
          </div>

          <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">Maximum Edge</span>
              <h3 class="text-2xl font-bold text-slate-900 mt-2 mb-4">Boardly Premium</h3>
              <div class="text-4xl font-black text-slate-900 mb-2">Rs 399 <span class="text-sm font-normal text-slate-500">/ month</span></div>
              <p class="text-xs text-slate-500 mb-6">Discounted to Rs 319/mo (6 Months) or Rs 279/mo (12 Months).</p>
              <ul class="space-y-3 text-sm text-slate-700">
                <li>✓ Unlimited tests per day</li>
                <li>✓ Unlimited Boardy AI chats</li>
                <li>✓ University mock simulations (MDCAT/FAST/UET)</li>
                <li>✓ Offline printable PDF test exports</li>
                <li>✓ Priority tutor query resolution</li>
              </ul>
            </div>
            <a href="/login" class="mt-8 block w-full py-3 text-center rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800">Get Premium</a>
          </div>
        </div>
      </section>

      <section class="max-w-4xl mx-auto px-4 py-12">
        <h2 class="text-2xl font-bold text-slate-900 mb-4 text-center">Frequently Asked Questions</h2>
        <div class="space-y-4 text-slate-700 text-sm">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-1">What payment methods are supported?</h4>
            <p>We accept EasyPaisa, JazzCash, SadaPay, NayaPay, and direct bank transfer. Your account activates within minutes once the payment proof is verified.</p>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-1">Can I upgrade or renew later?</h4>
            <p>Yes, you can upgrade from Starter to Pro or Premium anytime without losing test history, bookmarks, or mock percentiles.</p>
          </div>
        </div>
      </section>
    `,
  },
  {
    path: '/boardly-ai',
    title: 'Boardy AI | 24/7 Intelligent Tutor & Solution Solver',
    description: 'Meet Boardy, your 24/7 AI study partner. Get immediate step-by-step derivations, tricky numerical breakdowns, and conceptual exam hints for Matric & FSC.',
    canonical: 'https://boardly.cfd/boardly-ai',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Boardy AI Assistant',
      applicationCategory: 'EducationalApplication',
      url: 'https://boardly.cfd/boardly-ai',
      description: 'AI-guided tutor assisting students in complex numerical derivations and Pakistani board concepts.',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-4">
          24/7 Conceptual Study Buddy
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
          Meet Boardy: Your Intelligent Academic Tutor
        </h1>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Stuck late at night on a challenging physics derivation, calculus integral, or organic reaction pathway? Boardy is available 24/7 to provide guided step-by-step clarity aligned with Pakistani textbooks.
        </p>
      </section>

      <section class="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h2 class="text-2xl font-bold text-slate-900 mb-3">Trained on Pakistani Federal &amp; Provincial Syllabi</h2>
          <p class="text-slate-600 leading-relaxed mb-4">
            Unlike generic foreign chatbots that use non-standard notation and unfamiliar units, Boardy is grounded in the exact textbook standards taught across FBISE, Punjab Curriculum and Textbook Board (PCTB), Sindh Textbook Board (STBB), and KPK Textbook Board.
          </p>
          <ul class="list-disc list-inside text-sm text-slate-700 space-y-1.5">
            <li>Supports complete KaTeX mathematical expressions and balanced chemical equations.</li>
            <li>Breaks multi-step numericals down into Given Data, Working Formula, and Unit Conversions.</li>
            <li>Adheres strictly to Pakistani board examination conventions and marking schemes.</li>
          </ul>
        </div>

        <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h2 class="text-2xl font-bold text-slate-900 mb-3">Socratic Guidance for Long-Term Conceptual Retention</h2>
          <p class="text-slate-600 leading-relaxed">
            Boardy does not simply spoon-feed the final answer. It engages you with targeted diagnostic questions to identify exactly where your conceptual understanding broke down. This active learning approach builds authentic problem-solving confidence essential for competitive entrance tests.
          </p>
        </div>
      </section>
    `,
  },
  {
    path: '/mdcat',
    title: 'MDCAT MCQ Practice & Mock Exams 2026 | Boardly Pakistan',
    description: 'Ace the PMDC MDCAT with chapter-wise Biology, Chemistry, Physics, English & Logic MCQs. Practice authentic timed mock tests with detailed derivations.',
    canonical: 'https://boardly.cfd/mdcat',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'PMDC MDCAT Medical Entrance Examination Prep',
      description: 'Comprehensive syllabus question banks for Biology, Chemistry, Physics, English, and Logical Reasoning with national percentile rankings.',
      provider: { '@type': 'Organization', name: 'Boardly', url: 'https://boardly.cfd' },
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
          PMDC 2026 Curriculum Aligned
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
          MDCAT 2026 Online MCQ Practice &amp; Timed Mocks
        </h1>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-6">
          Prepare for the Medical &amp; Dental College Admission Test with 8,000+ authentic PMDC-aligned MCQs. Master high-yield topics in Biology, Chemistry, Physics, English, and Logical Reasoning with national percentile benchmarking.
        </p>
        <a href="/pricing" class="inline-block px-8 py-3.5 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg">Start MDCAT Practice Free</a>
      </section>

      <section class="max-w-5xl mx-auto px-4 py-8">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">PMDC MDCAT Syllabus Breakdown &amp; Weightage</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-1">Biology (34% · 68 Questions)</h3>
            <p class="text-xs text-slate-600">Cell Biology, Biological Molecules, Enzymes, Bioenergetics, Coordination &amp; Control, Genetics, Evolution, Diversity of Life.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-1">Chemistry (27% · 54 Questions)</h3>
            <p class="text-xs text-slate-600">Stoichiometry, Atomic Structure, Chemical Bonding, Thermochemistry, Electrochemistry, Reaction Kinetics, Functional Groups &amp; Reaction Mechanisms.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-1">Physics (27% · 54 Questions)</h3>
            <p class="text-xs text-slate-600">Vectors &amp; Equilibrium, Force &amp; Motion, Work &amp; Energy, Circular Motion, Waves, Thermodynamics, Electromagnetism, Nuclear Physics.</p>
          </div>
        </div>

        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Sample MDCAT Diagnostic Question</h2>
        <div class="p-6 rounded-2xl bg-slate-50 border border-slate-300 mb-12">
          <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Biology · Cell Ultra-Structure</span>
          <p class="text-base font-semibold text-slate-900 mt-2 mb-4">
            Which organelle is primarily responsible for lipid synthesis and detoxification of drugs within eukaryotic cells?
          </p>
          <div class="space-y-2 text-sm text-slate-800">
            <div class="p-3 bg-white rounded-lg border border-slate-200">A) Rough Endoplasmic Reticulum</div>
            <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-300 font-bold text-emerald-900">B) Smooth Endoplasmic Reticulum (Correct)</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200">C) Golgi Apparatus</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200">D) Lysosomes</div>
          </div>
          <div class="mt-4 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong>Step-by-Step Derivation:</strong> The Smooth Endoplasmic Reticulum (SER) is specialized for lipid metabolism, phospholipid synthesis, steroid hormone production, and detoxification of chemical toxins via cytochrome P450 enzymes. In contrast, the Rough Endoplasmic Reticulum (RER) is coated with ribosomes and specializes in protein synthesis.
          </div>
        </div>
      </section>
    `,
  },
  {
    path: '/fsc-matric',
    title: 'FSC & Matric MCQ Practice | FBISE & Provincial Boards',
    description: 'Prepare for FBISE, Punjab, Sindh & KPK board exams. Practice SLO-aligned MCQs for Class 9, 10, 11 & 12 with full derivations and instant AI doubt clearing.',
    canonical: 'https://boardly.cfd/fsc-matric',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'FSC & Matric Board Exam Preparation',
      description: 'SLO-aligned diagnostic question banks for FBISE and provincial board candidates.',
      provider: { '@type': 'Organization', name: 'Boardly', url: 'https://boardly.cfd' },
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-4">
          FBISE, Punjab, Sindh &amp; KPK Boards
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
          FSC &amp; Matric Online MCQ Practice Portal
        </h1>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-6">
          High-yield chapter-wise practice aligned with the latest Student Learning Outcomes (SLOs). Master Classes 9, 10, 11, and 12 science and computer streams with authentic board derivations.
        </p>
        <a href="/pricing" class="inline-block px-8 py-3.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg">Start Free Board Practice</a>
      </section>

      <section class="max-w-5xl mx-auto px-4 py-8">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">Curriculum Coverage Across Grades</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-2">Matric (Class 9 &amp; 10)</h3>
            <p class="text-sm text-slate-600 mb-3">SSC Part 1 &amp; Part 2 foundation modules covering Physics, Chemistry, Biology, and Mathematics according to national SLO frameworks.</p>
            <ul class="text-xs text-slate-500 list-disc list-inside space-y-1">
              <li>Physics: Kinematics, Dynamics, Gravitation, Work &amp; Energy, Heat Properties.</li>
              <li>Chemistry: Atomic Structure, Chemical Bonding, States of Matter, Solutions.</li>
              <li>Math: Matrices, Real Numbers, Algebraic Manipulation, Linear Graphs.</li>
            </ul>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-2">FSC &amp; ICS (Class 11 &amp; 12)</h3>
            <p class="text-sm text-slate-600 mb-3">HSSC Pre-Medical, Pre-Engineering, and General Science question banks designed for conceptual numerical mastery.</p>
            <ul class="text-xs text-slate-500 list-disc list-inside space-y-1">
              <li>Physics: Vectors, Circular Motion, Oscillations, Thermodynamics, Electromagnetism.</li>
              <li>Chemistry: Atomic Orbitals, Hybridization, Organic Mechanisms, Transition Elements.</li>
              <li>Math: Trigonometric Identities, Analytic Geometry, Limits, Calculus Integration.</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Sample Board Exam Question &amp; Derivation</h2>
        <div class="p-6 rounded-2xl bg-slate-50 border border-slate-300">
          <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">Physics (Class 11) · Work &amp; Energy</span>
          <p class="text-base font-semibold text-slate-900 mt-2 mb-4">
            A body of mass 2 kg is dropped from a height of 20 m. Neglecting air resistance and taking g = 10 m/s², what is its kinetic energy just before striking the ground?
          </p>
          <div class="space-y-2 text-sm text-slate-800">
            <div class="p-3 bg-white rounded-lg border border-slate-200">A) 200 J</div>
            <div class="p-3 bg-blue-50 rounded-lg border border-blue-300 font-bold text-blue-900">B) 400 J (Correct)</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200">C) 100 J</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200">D) 50 J</div>
          </div>
          <div class="mt-4 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong>Step-by-Step Derivation:</strong> By Conservation of Mechanical Energy: Loss in Potential Energy (PE) = Gain in Kinetic Energy (KE). PE = m * g * h = 2 kg * 10 m/s² * 20 m = 400 J. Therefore, just before striking the ground, KE = 400 Joules.
          </div>
        </div>
      </section>
    `,
  },
  {
    path: '/fast-nu',
    title: 'FAST-NU Entrance Test MCQ Practice & Engineering Mocks',
    description: 'Conquer the FAST-NU, UET & NUST entrance exams with Advanced Math, Physics & Analytical MCQs. Train under authentic negative marking time constraints.',
    canonical: 'https://boardly.cfd/fast-nu',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'FAST-NU & Engineering Entrance Test Preparation',
      description: 'Timed engineering mock tests with negative marking calibration for FAST-NU, UET ECAT, and NUST NET candidates.',
      provider: { '@type': 'Organization', name: 'Boardly', url: 'https://boardly.cfd' },
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-4">
          Computer Science &amp; Engineering Admissions
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
          FAST-NU &amp; UET Entrance Exam Prep Portal
        </h1>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-6">
          Train for FAST-NU, UET ECAT, and NUST NET with rigorous Advanced Mathematics, Analytical Reasoning, and Physics speed drills calibrated for strict negative marking penalties.
        </p>
        <a href="/pricing" class="inline-block px-8 py-3.5 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg">Start Engineering Mock Drill</a>
      </section>

      <section class="max-w-5xl mx-auto px-4 py-8">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">FAST-NU Exam Pattern &amp; Critical Strategy</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-2">Advanced Mathematics (50%)</h3>
            <p class="text-xs text-slate-600">Calculus derivatives, definite integrals, conic sections, matrices, permutations &amp; trigonometric series.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-2">Basic &amp; Analytical Math (20%)</h3>
            <p class="text-xs text-slate-600">Percentages, ratios, word problems, algebraic systems, and rate-of-work questions that demand rapid mental computation.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-2">Physics &amp; English (30%)</h3>
            <p class="text-xs text-slate-600">Conceptual mechanics, rotational dynamics, electromagnetism, and reading comprehension under time limits.</p>
          </div>
        </div>

        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Sample Advanced Math Entry Test Question</h2>
        <div class="p-6 rounded-2xl bg-slate-50 border border-slate-300">
          <span class="text-xs font-bold text-indigo-700 uppercase tracking-wider">Calculus &amp; Limits</span>
          <p class="text-base font-semibold text-slate-900 mt-2 mb-4">
            Evaluate the trigonometric limit: lim (x &rarr; 0) [sin(5x) / tan(2x)].
          </p>
          <div class="space-y-2 text-sm text-slate-800">
            <div class="p-3 bg-indigo-50 rounded-lg border border-indigo-300 font-bold text-indigo-900">A) 5/2 (Correct)</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200">B) 2/5</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200">C) 1</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200">D) 0</div>
          </div>
          <div class="mt-4 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong>Rapid Derivation:</strong> Using the standard trigonometric limit theorem lim(u &rarr; 0) sin(u)/u = 1 and lim(u &rarr; 0) tan(u)/u = 1: [sin(5x) / tan(2x)] = [ (sin(5x)/(5x))*5x ] / [ (tan(2x)/(2x))*2x ]. As x approaches 0, the ratio simplifies directly to 5x / 2x = 5/2. Shortcut: directly divide the coefficients of the trigonometric arguments: 5 / 2.
          </div>
        </div>
      </section>
    `,
  },
  {
    path: '/about',
    title: 'About Boardly | Built by SHS Virtual Academy Pakistan',
    description: 'Learn how Boardly, developed by SHS Virtual Academy, democratizes high-yield diagnostic exam practice and conceptual learning for Pakistani students.',
    canonical: 'https://boardly.cfd/about',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Boardly',
      url: 'https://boardly.cfd/about',
      description: 'The educational mission, curriculum committee, and foundation behind Boardly testing portal.',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-4">
          Academic Heritage &amp; Mission
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
          About Boardly — Built by SHS Virtual Academy
        </h1>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Boardly was founded with a straightforward goal: provide every Matric, Intermediate, and competitive entrance test aspirant in Pakistan with world-class diagnostic testing, transparent solution derivations, and 24/7 AI-guided conceptual mastery.
        </p>
      </section>

      <section class="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div class="p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
          <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">Institutional Partnership</span>
          <h2 class="text-2xl font-bold mb-4">Proudly Engineered by SHS Virtual Academy</h2>
          <p class="text-slate-300 leading-relaxed mb-4">
            Boardly operates under the curriculum leadership and academic direction of <a href="https://shsvirtualacademy.pro" target="_blank" rel="noopener noreferrer" class="text-amber-300 underline font-semibold hover:text-white">SHS Virtual Academy (shsvirtualacademy.pro)</a>. While SHS Virtual Academy leads online secondary classes, student counseling, and live pedagogical mentorship, Boardly serves as the high-yield diagnostic testing engine where students test retention, benchmark speed, and analyze performance against thousands of peers nationwide.
          </p>
          <a href="https://shsvirtualacademy.pro" target="_blank" rel="noopener noreferrer" class="inline-block px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20">Visit shsvirtualacademy.pro &rarr;</a>
        </div>

        <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h2 class="text-2xl font-bold text-slate-900 mb-3">Our Pedagogical Method: Active Diagnostic Testing</h2>
          <p class="text-slate-600 leading-relaxed">
            Passive reading of textbooks and rote memorization of guidebooks often leads to false confidence that collapses under timed exam pressure. Boardly replaces passive review with active retrieval practice, forcing neural recall and providing immediate derivations so errors turn into permanent conceptual mastery.
          </p>
        </div>
      </section>
    `,
  },
  {
    path: '/contact',
    title: 'Contact Boardly | Student Support, WhatsApp & Email',
    description: 'Have questions about syllabus materials, plans, or payments? Contact the Boardly student support team via WhatsApp hotline or email for rapid guidance.',
    canonical: 'https://boardly.cfd/contact',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Boardly Support',
      url: 'https://boardly.cfd/contact',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-4">
          Student Support Hotline
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
          Get in Touch with the Boardly Team
        </h1>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Have an inquiry regarding syllabus questions, manual payment verification, or institutional access? We are here to support your exam preparation journey.
        </p>
      </section>

      <section class="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="p-8 rounded-3xl bg-emerald-950 text-white shadow-xl flex flex-col justify-between">
          <div>
            <span class="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">Fastest Response</span>
            <h2 class="text-2xl font-bold mt-4 mb-2">WhatsApp Student Hotline</h2>
            <p class="text-sm text-slate-300 leading-relaxed mb-6">
              For rapid verification of EasyPaisa / JazzCash payment screenshots, voucher issues, or technical queries, message our student coordinators directly on WhatsApp.
            </p>
          </div>
          <a href="https://wa.me/923058969050?text=Hello%20Boardly%20Support,%20I%20have%20an%20inquiry%20regarding%20my%20exam%20preparation." target="_blank" rel="noreferrer" class="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] text-slate-950 font-bold text-center block shadow hover:bg-[#20ba59]">
            Message on WhatsApp (+92 305 8969050)
          </a>
        </div>

        <div class="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 class="text-2xl font-bold text-slate-900 mb-4">Email Inquiries</h2>
            <p class="text-sm text-slate-600 mb-4">For institutional licensing, school bulk access, or academic dispute reviews:</p>
            <div class="space-y-3 text-sm">
              <div>
                <span class="text-xs text-slate-400 block">General Student Support:</span>
                <a href="mailto:support@boardly.cfd" class="font-bold text-blue-600 hover:underline">support@boardly.cfd</a>
              </div>
              <div>
                <span class="text-xs text-slate-400 block">Administration:</span>
                <a href="mailto:shsvirtualadmin@gmail.com" class="font-bold text-slate-800 hover:underline">shsvirtualadmin@gmail.com</a>
              </div>
            </div>
          </div>
          <div class="pt-6 border-t border-slate-100 text-xs text-slate-500">
            Support hours: Monday through Saturday, 9:00 AM – 10:00 PM PKT.
          </div>
        </div>
      </section>
    `,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Boardly Student Data Protection Notice',
    description: 'Read Boardly\'s privacy policy to understand how student data, test analytics, and account records are protected under modern security and encryption standards.',
    canonical: 'https://boardly.cfd/privacy',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Boardly Privacy Policy',
      url: 'https://boardly.cfd/privacy',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 mb-6">Boardly Privacy Policy</h1>
        <p class="text-slate-600 mb-8 leading-relaxed">Last updated: October 2026. Boardly by SHS Virtual Academy is committed to safeguarding student confidentiality and protecting personal information.</p>
        <div class="space-y-6 text-slate-700 text-sm leading-relaxed">
          <h2 class="text-xl font-bold text-slate-900">1. Information We Collect</h2>
          <p>We collect essential student account details including your name, email address, selected target board/university track, and practice test completion records to calculate personalized diagnostic analytics.</p>
          <h2 class="text-xl font-bold text-slate-900">2. How We Use Academic Data</h2>
          <p>Test scores and question attempts are used exclusively to generate your personalized progress charts, identify weak syllabus topics, and compute national percentile rankings. We do not sell or monetize student data.</p>
          <h2 class="text-xl font-bold text-slate-900">3. Account Security</h2>
          <p>Passwords and authentication credentials are encrypted using industry-standard protocols. Students may request complete account data deletion at any time by contacting support@boardly.cfd.</p>
        </div>
      </section>
    `,
  },
  {
    path: '/terms',
    title: 'Terms of Service | Boardly Online Educational Portal',
    description: 'Review Boardly\'s terms of service, subscription guidelines, fair use policy, and academic code of conduct for Matric, FSC, and entrance test candidates.',
    canonical: 'https://boardly.cfd/terms',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Boardly Terms of Service',
      url: 'https://boardly.cfd/terms',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 mb-6">Boardly Terms of Service</h1>
        <p class="text-slate-600 mb-8 leading-relaxed">Last updated: October 2026. By accessing Boardly, you agree to comply with these academic terms and conditions.</p>
        <div class="space-y-6 text-slate-700 text-sm leading-relaxed">
          <h2 class="text-xl font-bold text-slate-900">1. Educational License &amp; Fair Use</h2>
          <p>Boardly grants students a personal, non-transferable license to access our proprietary MCQ database, derivations, and AI study tools for individual exam preparation. Automated scraping or redistribution of test materials is strictly prohibited.</p>
          <h2 class="text-xl font-bold text-slate-900">2. Subscriptions &amp; Digital Purchases</h2>
          <p>Pro and Premium memberships provide immediate digital access to extended question banks and AI capabilities. Due to the immediate delivery of digital materials, all sales are subject to our standard non-refundable digital product policy.</p>
          <h2 class="text-xl font-bold text-slate-900">3. Academic Integrity</h2>
          <p>Boardly Blitz, Boardly Arena, and leaderboard contests are operated under an honor code. Accounts engaging in unauthorized automated scripts or sharing credentials will be disqualified.</p>
        </div>
      </section>
    `,
  },
  {
    path: '/crew',
    title: 'Boardly Crew: Lead your campus',
    description: 'Represent Boardly at your college or university as an official student ambassador. Unlock 30 days of free Premium, peer referral rewards, and paid internship opportunities.',
    canonical: 'https://boardly.cfd/crew',
    ogImage: 'https://boardly.cfd/assets/boardly-crew-og.png',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Boardly Crew: Lead your campus',
      url: 'https://boardly.cfd/crew',
      description: 'Official student campus ambassador program by Boardly and SHS Virtual Academy across Pakistani colleges and universities.',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto text-center">
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-violet-950 text-violet-300 border border-violet-700 mb-6">
          By students. For their campuses. Backed by Boardly.
        </span>
        <h1 class="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-6">
          Be the face of Boardly at your campus. <span class="text-violet-600">Lead your batch.</span>
        </h1>
        <p class="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Join Pakistan's premier student ambassador network. Empower your peers with national-standard test prep, build verifiable leadership experience, and unlock 30 days free Premium, live dashboards, and paid internship tracks.
        </p>
        <div class="flex flex-wrap justify-center gap-4 mb-12">
          <a href="/crew/apply" class="px-8 py-3.5 rounded-full bg-violet-600 text-white font-bold hover:bg-violet-700 shadow-lg">Apply to Join Crew</a>
          <a href="/crew/how-it-works" class="px-8 py-3.5 rounded-full bg-slate-100 text-slate-800 font-bold hover:bg-slate-200">See How It Works</a>
        </div>
      </section>
      <section class="max-w-5xl mx-auto px-4 py-12">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8 text-center">Ambassador Perks &amp; Rewards</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-2">30 Days Free Premium</h3>
            <p class="text-sm text-slate-600">Immediate unrestricted access to all 25,000+ MCQs, past papers, and 24/7 Boardy AI tutoring.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-2">Verifiable CV Credentials</h3>
            <p class="text-sm text-slate-600">Official signed Letter of Recommendation and verified digital badge for LinkedIn and resumes.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-2">Paid Internship Tracks</h3>
            <p class="text-sm text-slate-600">Top-performing student ambassadors unlock paid marketing and operations internships with SHS Academy.</p>
          </div>
        </div>
      </section>
    `,
  },
  {
    path: '/crew/how-it-works',
    title: 'How Boardly Crew Works | Campus Ambassador Program',
    description: 'Discover the 4 steps to becoming a verified Boardly Crew Ambassador: Apply, get verified, unlock Premium & dashboard, and earn rewards.',
    canonical: 'https://boardly.cfd/crew/how-it-works',
    ogImage: 'https://boardly.cfd/assets/boardly-crew-og.png',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'How Boardly Crew Works',
      url: 'https://boardly.cfd/crew/how-it-works',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 mb-6 text-center">How Boardly Crew Works</h1>
        <p class="text-slate-600 mb-10 text-center max-w-xl mx-auto">Four simple steps from application to national student leadership.</p>
        <div class="space-y-6">
          <div class="p-6 rounded-2xl bg-white border border-slate-200">
            <h3 class="font-bold text-lg text-slate-900 mb-1">1. Apply in 2 Minutes</h3>
            <p class="text-sm text-slate-600">Fill out our quick 3-step form with your institution name, academic level, and campus network.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200">
            <h3 class="font-bold text-lg text-slate-900 mb-1">2. Get Verified</h3>
            <p class="text-sm text-slate-600">Our student community team verifies your details within 24–48 hours and confirms your admission.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200">
            <h3 class="font-bold text-lg text-slate-900 mb-1">3. Unlock 30 Days Free Pro &amp; Dashboard</h3>
            <p class="text-sm text-slate-600">Your account receives 30 days of free Pro access along with your custom referral code and tracking portal.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200">
            <h3 class="font-bold text-lg text-slate-900 mb-1">4. Lead, Grow &amp; Unlock Career Rewards</h3>
            <p class="text-sm text-slate-600">Onboard batchmates, build your impact, and qualify for paid internships and signed CV letters.</p>
          </div>
        </div>
        <div class="text-center mt-10">
          <a href="/crew/apply" class="px-8 py-3.5 rounded-full bg-violet-600 text-white font-bold hover:bg-violet-700">Apply to Boardly Crew</a>
        </div>
      </section>
    `,
  },
  {
    path: '/crew/perks',
    title: 'Boardly Crew Perks & Benefits | Lead Your Campus',
    description: 'Explore ambassador perks: 30 days free Premium, 1-year tenure, live referral dashboard, verifiable CV credentials, and paid internship tracks.',
    canonical: 'https://boardly.cfd/crew/perks',
    ogImage: 'https://boardly.cfd/assets/boardly-crew-og.png',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Boardly Crew Perks & Benefits',
      url: 'https://boardly.cfd/crew/perks',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-5xl mx-auto">
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 mb-6 text-center">Ambassador Perks &amp; Career Benefits</h1>
        <p class="text-slate-600 mb-12 text-center max-w-xl mx-auto">Tangible value that propels your academic scores and elevates your professional resume.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="font-bold text-lg text-slate-900 mb-2">30 Days Free Pro Access</h3>
            <p class="text-sm text-slate-600">Full access to 25,000+ MCQs, chapter past paper vaults, and 24/7 AI tutoring.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="font-bold text-lg text-slate-900 mb-2">1-Year Leadership Title</h3>
            <p class="text-sm text-slate-600">Official designation as Boardly Campus Ambassador representing your college across Pakistan.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="font-bold text-lg text-slate-900 mb-2">Real-Time Referral Dashboard</h3>
            <p class="text-sm text-slate-600">Private analytics showing peer clicks, registrations, and your national ranking.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 class="font-bold text-lg text-slate-900 mb-2">Paid Internship Opportunities</h3>
            <p class="text-sm text-slate-600">Top performers qualify for paid student leadership and marketing internships at SHS Academy.</p>
          </div>
        </div>
      </section>
    `,
  },
  {
    path: '/crew/faq',
    title: 'Boardly Crew FAQ | Ambassador Program Questions Answered',
    description: 'Got questions about Boardly Crew? Learn who can join, how to apply, eligibility, reward counting, and ambassador responsibilities.',
    canonical: 'https://boardly.cfd/crew/faq',
    ogImage: 'https://boardly.cfd/assets/boardly-crew-og.png',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Who can join Boardly Crew?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Any currently enrolled Matric, Intermediate (FSC/ICS), or university student in Pakistan with a passion for helping peers excel academically.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is it completely free to join?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, 100% free forever. There are zero fees, application charges, or mandatory purchases.',
          },
        },
      ],
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 mb-6 text-center">Frequently Asked Questions</h1>
        <p class="text-slate-600 mb-10 text-center">Everything you need to know about Boardly Crew.</p>
        <div class="space-y-6">
          <div class="p-6 rounded-2xl bg-white border border-slate-200">
            <h3 class="font-bold text-slate-900 mb-2">Who can join Boardly Crew?</h3>
            <p class="text-sm text-slate-600">Any currently enrolled Matric, Intermediate (FSC/ICS), or undergraduate university student in Pakistan.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200">
            <h3 class="font-bold text-slate-900 mb-2">How do I apply?</h3>
            <p class="text-sm text-slate-600">Complete the 3-step application form on /crew/apply in under 2 minutes.</p>
          </div>
          <div class="p-6 rounded-2xl bg-white border border-slate-200">
            <h3 class="font-bold text-slate-900 mb-2">Is it completely free?</h3>
            <p class="text-sm text-slate-600">Yes, 100% free with zero fees or purchases required. Approved members get 30 days of free Pro access.</p>
          </div>
        </div>
      </section>
    `,
  },
  {
    path: '/crew/apply',
    title: 'Apply for Boardly Crew',
    description: 'Submit your student ambassador application for Boardly Crew. Lead your batch, share test prep resources, and unlock student leader perks.',
    canonical: 'https://boardly.cfd/crew/apply',
    ogImage: 'https://boardly.cfd/assets/boardly-crew-og.png',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Apply for Boardly Crew',
      url: 'https://boardly.cfd/crew/apply',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-3xl mx-auto text-center">
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 mb-4">Apply for Boardly Crew</h1>
        <p class="text-slate-600 mb-8">Help organize study events on your campus.</p>
        <div class="p-8 rounded-2xl bg-white border border-slate-200 text-left shadow-sm">
          <a href="/crew/apply" class="px-8 py-3.5 rounded-full bg-indigo-600 text-white font-bold inline-block hover:bg-indigo-700">Apply to Join Crew</a>
        </div>
      </section>
    `,
  },
  {
    path: '/captain',
    title: 'Boardly Captain | Campus Ambassador Program',
    description: 'Represent Boardly at your institution. Empower classmates with verified test prep, build verifiable leadership experience, and unlock exclusive rewards.',
    canonical: 'https://boardly.cfd/captain',
    ogImage: 'https://boardly.cfd/assets/boardly-crew-og.png',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Boardly Captain',
      url: 'https://boardly.cfd/captain',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-4xl mx-auto text-center">
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 mb-4">Boardly Captain Ambassador Program</h1>
        <p class="text-slate-600 mb-8">Lead your campus batch, empower peers with authentic test prep, and earn verified credentials.</p>
        <a href="/captain/apply" class="px-8 py-3.5 rounded-full bg-amber-500 text-slate-900 font-bold inline-block hover:bg-amber-600">Apply as Captain</a>
      </section>
    `,
  },
  {
    path: '/captain/apply',
    title: 'Apply for Boardly Captain',
    description: 'Submit your student ambassador application for Boardly Captain. Represent Boardly at your college, share prep resources, and unlock student leader perks.',
    canonical: 'https://boardly.cfd/captain/apply',
    ogImage: 'https://boardly.cfd/assets/boardly-crew-og.png',
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Apply for Boardly Captain',
      url: 'https://boardly.cfd/captain/apply',
    },
    generateContent: () => `
      <section class="py-16 px-4 max-w-3xl mx-auto text-center">
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 mb-4">Apply for Boardly Captain</h1>
        <p class="text-slate-600 mb-8">Represent Boardly and lead your campus.</p>
        <a href="/captain/apply" class="px-8 py-3.5 rounded-full bg-amber-500 text-slate-900 font-bold inline-block hover:bg-amber-600">Apply as Captain</a>
      </section>
    `,
  },
];

function generateNavigationHeader(): string {
  return `
    <header class="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 text-xl font-bold text-slate-950 font-display">
          <img src="/assets/boardly-logo-transparent.png" alt="Boardly" class="h-8 w-auto object-contain" />
          <span>Boardly</span>
        </a>
        <nav class="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600" aria-label="Main Navigation">
          <a href="/" class="hover:text-blue-600">Home</a>
          <a href="/features" class="hover:text-blue-600">Features</a>
          <a href="/pricing" class="hover:text-blue-600">Pricing</a>
          <a href="/boardly-ai" class="hover:text-blue-600">Boardly AI</a>
          <a href="/mdcat" class="hover:text-blue-600">MDCAT</a>
          <a href="/fsc-matric" class="hover:text-blue-600">FSC &amp; Matric</a>
          <a href="/fast-nu" class="hover:text-blue-600">FAST-NU</a>
          <a href="/about" class="hover:text-blue-600">About</a>
          <a href="/contact" class="hover:text-blue-600">Contact</a>
        </nav>
        <div class="flex items-center gap-3">
          <a href="/login" class="text-sm font-bold text-slate-700 hover:text-blue-600 px-3 py-1.5">Sign In</a>
          <a href="/pricing" class="text-sm font-bold bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 shadow-sm">Get Started</a>
        </div>
      </div>
    </header>
  `;
}

function generateNavigationFooter(): string {
  return `
    <footer class="bg-slate-950 text-slate-400 py-16 border-t border-slate-800 mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Product</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/features" class="hover:text-white">Features</a></li>
            <li><a href="/pricing" class="hover:text-white">Pricing</a></li>
            <li><a href="/boardly-ai" class="hover:text-white">Boardly AI (24/7)</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Exam Prep</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/mdcat" class="hover:text-white">MDCAT Medical</a></li>
            <li><a href="/fsc-matric" class="hover:text-white">FSC &amp; Matric (FBISE)</a></li>
            <li><a href="/fast-nu" class="hover:text-white">FAST-NU &amp; UET Prep</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Company</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/" class="hover:text-white">Home</a></li>
            <li><a href="/about" class="hover:text-white">About Boardly</a></li>
            <li><a href="/contact" class="hover:text-white">Contact &amp; WhatsApp</a></li>
            <li><a href="https://shsvirtualacademy.pro" target="_blank" rel="noopener noreferrer" class="hover:text-white">SHS Virtual Academy</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Legal</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/privacy" class="hover:text-white">Privacy Policy</a></li>
            <li><a href="/terms" class="hover:text-white">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>&copy; 2026 Boardly by SHS Virtual Academy. All rights reserved.</p>
        <p>National Online MCQ Practice &amp; Diagnostic Testing Portal across Pakistan.</p>
      </div>
    </footer>
  `;
}

function prerenderAllRoutes() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error(`[prerender] Error: dist/index.html not found. Please run vite build first.`);
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  console.log(`[prerender] Generating crawlable pre-rendered HTML for ${PUBLIC_ROUTES.length} public routes...`);

  for (const route of PUBLIC_ROUTES) {
    let renderedHtml = baseHtml;

    // 1. Replace Title
    renderedHtml = renderedHtml.replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${route.title}</title>`
    );

    // 2. Replace or Inject Meta Description
    if (renderedHtml.includes('name="description"')) {
      renderedHtml = renderedHtml.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
        `<meta name="description" content="${route.description}" />`
      );
    } else {
      renderedHtml = renderedHtml.replace(
        '</head>',
        `  <meta name="description" content="${route.description}" />\n</head>`
      );
    }

    // 3. Replace Canonical
    if (renderedHtml.includes('rel="canonical"') || renderedHtml.includes("rel='canonical'")) {
      renderedHtml = renderedHtml.replace(
        /<link\s+[^>]*rel=["']canonical["'][^>]*\/?>/i,
        `<link rel="canonical" href="${route.canonical}" />`
      );
    } else {
      renderedHtml = renderedHtml.replace(
        '</head>',
        `  <link rel="canonical" href="${route.canonical}" />\n</head>`
      );
    }

    // 4. Update OpenGraph and Twitter Tags
    renderedHtml = renderedHtml.replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${route.title}" />`
    );
    renderedHtml = renderedHtml.replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${route.description}" />`
    );
    renderedHtml = renderedHtml.replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${route.canonical}" />`
    );
    const resolvedOgImage = route.ogImage || 'https://boardly.cfd/logo.png';
    renderedHtml = renderedHtml.replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${resolvedOgImage}" />`
    );
    renderedHtml = renderedHtml.replace(
      /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:card" content="summary_large_image" />`
    );
    renderedHtml = renderedHtml.replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${route.title}" />`
    );
    renderedHtml = renderedHtml.replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${route.description}" />`
    );
    renderedHtml = renderedHtml.replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${resolvedOgImage}" />`
    );

    // 5. Inject / replace robots
    if (renderedHtml.includes('name="robots"')) {
      renderedHtml = renderedHtml.replace(
        /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
        `<meta name="robots" content="${route.robots}" />`
      );
    } else {
      renderedHtml = renderedHtml.replace(
        '</head>',
        `  <meta name="robots" content="${route.robots}" />\n</head>`
      );
    }

    // 6. Inject Schema JSON-LD
    const schemaTag = `<script type="application/ld+json" id="page-schema">\n${JSON.stringify(route.schema, null, 2)}\n</script>`;
    renderedHtml = renderedHtml.replace('</head>', `  ${schemaTag}\n</head>`);

    // 7. Inject Semantic Pre-rendered Content into <noscript> for SEO crawlers (NOT inside <div id="root">)
    // <div id="root"> must keep only the initial lightweight preloader with #F8F9FB background to prevent flashing on app refresh
    const fullPageContent = `
      <div class="prerendered-content">
        ${generateNavigationHeader()}
        <main id="main-content">
          ${route.generateContent()}
        </main>
        ${generateNavigationFooter()}
      </div>
    `;

    // Move SEO content into <noscript> so crawlers see it while <div id="root"> holds only the loading screen
    renderedHtml = renderedHtml.replace(
      '</noscript>',
      `  <div class="prerendered-seo-content" style="display:none;" aria-hidden="true">\n${fullPageContent}\n  </div>\n</noscript>`
    );

    // Write file
    if (route.path === '/') {
      fs.writeFileSync(indexHtmlPath, renderedHtml, 'utf8');
      console.log(`[prerender] Written: dist/index.html (Home /)`);
    } else {
      const cleanSubPath = route.path.replace(/^\//, '');
      const targetDir = path.join(distDir, cleanSubPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const targetFile = path.join(targetDir, 'index.html');
      fs.writeFileSync(targetFile, renderedHtml, 'utf8');
      console.log(`[prerender] Written: dist/${cleanSubPath}/index.html (${route.path})`);
    }
  }

  // Ensure sitemap.xml, robots.txt, _routes.json, and _redirects are in dist
  const publicFiles = ['sitemap.xml', 'robots.txt', '_redirects', '_headers', '_routes.json'];
  for (const file of publicFiles) {
    const srcPath = path.resolve(process.cwd(), 'public', file);
    const destPath = path.resolve(distDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[prerender] Copied public/${file} to dist/${file}`);
    }
  }

  console.log(`[prerender] Finished successfully! All ${PUBLIC_ROUTES.length} public routes pre-rendered with 200 OK HTML.`);
}

prerenderAllRoutes();
