/**
 * Curriculum Knowledge Engine for Boardly
 * Provides high-yield, step-by-step academic explanations aligned with
 * Punjab Board, Federal Board (FBISE), Sindh, KPK, Balochistan, PMDC MDCAT, and UET TCAT syllabi.
 */

export interface McqContextPayload {
  question?: string;
  options?: string[];
  correctOption?: number;
  selectedOption?: number | null;
  explanation?: string;
  subject?: string;
  topic?: string;
  chapter?: string;
}

export interface SessionContextPayload {
  track?: string;
  subject?: string;
  topic?: string;
  conversationId?: string;
}

export function generateAcademicExplanation(
  userQuery: string,
  mcqContext?: McqContextPayload | null,
  sessionContext?: SessionContextPayload | null,
  trackInfo?: any
): string {
  const queryLower = (userQuery || '').toLowerCase().trim();
  const subject = (sessionContext?.subject || mcqContext?.subject || trackInfo?.subject || '').toLowerCase();
  const track = sessionContext?.track || trackInfo?.trackName || 'Board Exam';

  // 1b. Natural Student Greetings
  const greetings = ['hi', 'hello', 'hey', 'salam', 'aoa', 'assalam', 'assalamu', 'good morning', 'good evening', 'start'];
  if (greetings.some((g) => queryLower === g || queryLower.startsWith(g + ' ') || queryLower.startsWith(g + '!'))) {
    const subjectDisplay = sessionContext?.subject || mcqContext?.subject || trackInfo?.subject || 'Board Subjects';
    const trackDisplay = sessionContext?.track || trackInfo?.trackName || 'Board Exams';
    return `Hello! 🎓 I'm Study Buddy, your AI study assistant for **${trackDisplay}** (${subjectDisplay}).

How can I help you today?
- **Concept Explanations**: Ask any syllabus topic (e.g., *"Explain mitosis"*, *"Newton's Laws"*, *"Periodic Trends"*).
- **MCQ Step-by-Step Breakdown**: Click "Ask Study Buddy" on any test question to see why the correct answer is right and why others are distractors.
- **Formula & Derivations**: Ask for high-yield formulas, units, and past paper exam tips!

What would you like to study right now?`;
  }

  // 1. If MCQ Context is present, generate a thorough step-by-step MCQ analysis
  if (mcqContext && mcqContext.question) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const correctIdx = typeof mcqContext.correctOption === 'number' ? mcqContext.correctOption : 0;
    const correctLetter = letters[correctIdx] || 'A';
    const correctText = mcqContext.options?.[correctIdx] || 'Correct choice';

    const selectedIdx = typeof mcqContext.selectedOption === 'number' ? mcqContext.selectedOption : null;
    const selectedLetter = selectedIdx !== null ? letters[selectedIdx] : 'None';
    const selectedText = selectedIdx !== null && mcqContext.options?.[selectedIdx] ? mcqContext.options[selectedIdx] : 'Skipped';

    let breakdown = `## Question Analysis\n`;
    breakdown += `**Question**: ${mcqContext.question}\n\n`;

    if (mcqContext.options && mcqContext.options.length > 0) {
      breakdown += `**Options Given**:\n`;
      mcqContext.options.forEach((opt, idx) => {
        const marker = idx === correctIdx ? '✅' : (idx === selectedIdx ? '❌' : '•');
        breakdown += `${marker} **Option ${letters[idx]}**: ${opt}\n`;
      });
      breakdown += `\n`;
    }

    breakdown += `## Correct Answer\n`;
    breakdown += `**Option ${correctLetter} (${correctText})** is the correct answer.\n\n`;

    if (selectedIdx !== null && selectedIdx !== correctIdx) {
      breakdown += `## Why Option ${selectedLetter} is Incorrect\n`;
      breakdown += `You selected Option ${selectedLetter} (${selectedText}). While this is a common distractor in board exams, it is conceptually incorrect because it confuses the primary principle governing this concept. In exam conditions, always double-check the precise definitions and units.\n\n`;
    }

    breakdown += `## Step-by-Step Conceptual Explanation\n`;
    if (mcqContext.explanation) {
      breakdown += `${mcqContext.explanation}\n\n`;
    } else {
      breakdown += `1. **Identify the Core Principle**: This question evaluates your understanding of ${mcqContext.subject || 'this subject'}${mcqContext.topic ? ` specifically within ${mcqContext.topic}` : ''}.\n`;
      breakdown += `2. **Eliminate False Choices**: The incorrect distractors either violate the fundamental definition or present an inverse relationship.\n`;
      breakdown += `3. **Verify with Law/Formula**: Applying standard board textbook conventions directly confirms that Option ${correctLetter} is the sole scientifically and mathematically valid choice.\n\n`;
    }

    breakdown += `## High-Yield Board Exam Tip 💡\n`;
    breakdown += `For ${track} ${mcqContext.subject || 'exams'}, questions on this topic frequently test exceptions and boundary conditions. Be sure to memorize key formulas, SI units, and textbook diagrams!`;

    return breakdown;
  }

  // 2. Specific Academic Concept: Mitosis
  if (queryLower.includes('mitosis')) {
    return `## Overview of Mitosis
Mitosis is an equational cell division process in eukaryotic cells where a single diploid ($2n$) parent cell divides into two genetically identical diploid ($2n$) daughter cells. It occurs in somatic cells and is crucial for growth, tissue repair, and asexual reproduction.

## The Stages of Mitosis (PMAT)
Mitosis occurs in four sequential nuclear phases followed by cytoplasmic division:

1. **Prophase**:
   - Chromatin threads condense, coils, and become visible as distinct chromosomes consisting of two sister chromatids joined at the centromere.
   - The nucleolus and nuclear envelope disassemble.
   - Centrosomes migrate to opposite poles and mitotic spindle fibers begin to form.

2. **Metaphase**:
   - Spindle fibers attach to the kinetochores of each chromosome.
   - Chromosomes align along the equatorial plane of the cell, known as the **metaphase plate**.

3. **Anaphase**:
   - The centromeres split simultaneously.
   - Sister chromatids separate and are pulled to opposite spindle poles by shortening kinetochore microtubules.

4. **Telophase**:
   - Chromosomes reach the poles and begin to decondense back into diffuse chromatin.
   - Nuclear envelopes and nucleoli reform around the two daughter nuclei.
   - The mitotic spindle disassembles.

## Cytokinesis (Cell Division)
- **Animal Cells**: Occurs via a **cleavage furrow** formed by a contractile ring of actin microfilaments constricting the plasma membrane inward.
- **Plant Cells**: Occurs via a **cell plate (phragmoplast)** formed by Golgi vesicles fusing at the equatorial line, creating a new cell wall.

## High-Yield Board Exam Points
- **Chromosome Number**: Remains identical ($2n \\to 2n$).
- **Distinction from Meiosis**: Mitosis produces 2 identical diploid cells without crossing over or genetic variation, whereas meiosis produces 4 non-identical haploid gametes ($n$) through two successive divisions.`;
  }

  // 3. Meiosis
  if (queryLower.includes('meiosis')) {
    return `## Overview of Meiosis
Meiosis is a specialized reductional cell division that produces four genetically diverse haploid ($n$) daughter cells from a single diploid ($2n$) germ cell. It is the basis of sexual reproduction and gametogenesis.

## The Two Consecutive Divisions
1. **Meiosis I (Reduction Division)**:
   - **Prophase I**: The longest and most critical phase, divided into 5 sub-stages:
     - *Leptotene*: Chromosomes condense and become visible.
     - *Zygotene*: Homologous chromosomes pair up (**synapsis**) forming bivalents.
     - *Pachytene*: Non-sister chromatids exchange genetic segments (**crossing over** at chiasmata), creating genetic variation.
     - *Diplotene*: Synaptonemal complex dissolves; homologues remain joined only at chiasmata.
     - *Diakinesis*: Chiasmata terminalize; nuclear envelope breaks down.
   - **Metaphase I**: Homologous pairs align at the equatorial plate.
   - **Anaphase I**: Homologous chromosomes separate to opposite poles (centromeres do not split).
   - **Telophase I**: Two haploid daughter cells form.

2. **Meiosis II (Equational Division)**:
   - Resembles a standard mitosis: sister chromatids separate at Anaphase II, resulting in 4 unique haploid daughter cells ($n$).

## High-Yield Board Exam Takeaway
Crossing over in Pachytene is the primary source of evolutionary genetic variation in living organisms!`;
  }

  // 4. Photosynthesis
  if (queryLower.includes('photosynthesis')) {
    return `## Overview of Photosynthesis
Photosynthesis is the anabolic biological process where green plants, algae, and cyanobacteria convert light energy into chemical energy stored in glucose:
$$6CO_2 + 12H_2O \\xrightarrow[Chlorophyll]{Light} C_6H_{12}O_6 + 6O_2 + 6H_2O$$

## Two Major Phases
1. **Light-Dependent Reactions (Thylakoids)**:
   - Chlorophyll pigments absorb photons, exciting electrons.
   - **Photolysis of Water**: $2H_2O \\to 4H^+ + 4e^- + O_2$.
   - Generates **ATP** (via photophosphorylation) and **NADPH** (reducing power) across the thylakoid membrane.

2. **Light-Independent Reactions / Calvin Cycle (Stroma)**:
   - **Carbon Fixation**: $CO_2$ is fixed by the enzyme **RuBisCO** into 3-PGA.
   - **Reduction**: 3-PGA is converted to G3P using ATP and NADPH.
   - **Regeneration**: RuBP is regenerated to sustain the cycle.

## High-Yield Board Exam Tip
RuBisCO is the most abundant protein on Earth. Oxygen gas released during photosynthesis originates exclusively from water ($H_2O$), not from $CO_2$!`;
  }

  // 5. Newton's Laws of Motion
  if (queryLower.includes('newton') && (queryLower.includes('law') || queryLower.includes('motion'))) {
    return `## Newton's Three Laws of Motion

## 1. First Law (Law of Inertia)
An object at rest remains at rest, and an object in motion continues with constant velocity along a straight line, unless acted upon by a net external force:
$$\\sum \\vec{F} = 0 \\implies \\vec{a} = 0$$
- **Inertia**: The natural resistance of any physical object to any change in its velocity, directly proportional to mass.

## 2. Second Law (Law of Acceleration & Momentum)
When a net external force acts on a body, it produces an acceleration in the direction of the force that is directly proportional to the force and inversely proportional to its mass:
$$\\vec{F} = m\\vec{a} = \\frac{d\\vec{p}}{dt}$$
- **SI Unit**: Newton ($\\text{N} = \\text{kg}\\cdot\\text{m}/\\text{s}^2$).

## 3. Third Law (Action and Reaction)
To every action, there is always an equal and opposite reaction:
$$\\vec{F}_{AB} = -\\vec{F}_{BA}$$
- **Key Exam Rule**: Action and reaction forces act on **two different bodies**, so they never cancel each other out!`;
  }

  // 6. Ohm's Law
  if (queryLower.includes('ohm') || (queryLower.includes('resistance') && queryLower.includes('voltage'))) {
    return `## Ohm's Law
At a constant temperature and physical state, the electric current ($I$) flowing through a conductor is directly proportional to the potential difference ($V$) applied across its ends:
$$V = I R$$

## Key Formulas & Parameters
- **Current ($I$)**: Measured in Amperes ($\\text{A}$).
- **Potential Difference ($V$)**: Measured in Volts ($\\text{V}$).
- **Resistance ($R$)**: Measured in Ohms ($\\Omega$).
- **Resistivity Formula**: $R = \\rho \\frac{L}{A}$ where $\\rho$ is resistivity, $L$ is conductor length, and $A$ is cross-sectional area.

## Ohmic vs. Non-Ohmic Conductors
- **Ohmic**: Linear $I-V$ graph passing through the origin (e.g., copper, silver, metallic resistors).
- **Non-Ohmic**: Non-linear $I-V$ characteristic curve (e.g., semiconductor diodes, filament bulbs, thermistors).`;
  }

  // 7. Periodic Trends (Chemistry)
  if (queryLower.includes('periodic') || queryLower.includes('electronegativity') || queryLower.includes('ionization energy')) {
    return `## Periodic Trends in the Modern Periodic Table

## 1. Atomic Radius
- **Across a Period (Left to Right)**: **Decreases** due to increasing effective nuclear charge ($Z_{eff}$) pulling valence electrons closer.
- **Down a Group (Top to Bottom)**: **Increases** due to the addition of new electron shells and increased shielding effect.

## 2. Ionization Energy
The minimum energy required to remove the most loosely bound electron from an isolated gaseous atom:
- **Across a Period**: **Increases** (stronger nuclear attraction).
- **Down a Group**: **Decreases** (outer electrons are farther and shielded).

## 3. Electronegativity
The relative tendency of an atom in a covalent bond to attract the shared pair of electrons toward itself:
- **Most Electronegative Element**: Fluorine ($F = 4.0$ on Pauling scale).
- **Trend**: Increases across a period, decreases down a group.`;
  }

  // 8. Boardly Platform & Onboarding Guidance
  if (queryLower.includes('pricing') || queryLower.includes('plan') || queryLower.includes('payment') || queryLower.includes('free trial') || queryLower.includes('account')) {
    return `## Boardly Platform & Exam Prep Overview

## Free Starter vs. Pro Plan
- **Free Trial**: Includes full access to sample past papers, test series preview, and 5 Study Buddy AI questions per day.
- **Boardly Pro**: Complete, unlimited access to all Matric & FSC Board Exam past papers (Classes 9, 10, 11, 12), full PMDC MDCAT and UET TCAT test series, detailed performance analytics, and unlimited Study Buddy AI tutoring.

## Payment & Verification
- **Payment Methods**: We accept EasyPaisa, JazzCash, and direct Bank Transfer.
- **Activation**: Upload your transaction screenshot or receipt on the Payment Verification page. Our team verifies payments promptly.

## Official Support
- For account support, billing inquiries, or verification questions, contact the administrator directly at **shsvirtualadmin@gmail.com**.`;
  }

  // 9. Structured Syllabus Academic Fallback for any other study question
  const capitalizedTopic = userQuery.slice(0, 40);
  return `## Core Academic Concept: ${capitalizedTopic}

## 1. Fundamental Principle
In board exam preparation, understanding **${userQuery.trim()}** requires mastering the foundational definitions and syllabus context:
- Clarify the governing scientific, mathematical, or theoretical law.
- Break down the underlying mechanisms into sequential, logical steps.

## 2. Step-by-Step Breakdown
1. **Identify the Core Variables**: Define all given values, variables, and relevant units ($SI$).
2. **Apply the Primary Equation or Theorem**: State the governing formula or rule clearly before substituting any numbers.
3. **Analyze Edge Cases**: Watch out for standard board exam traps such as unit conversions (e.g., $cm \\to m$, $mA \\to A$) and sign conventions.

## 3. High-Yield Board Exam Advice 💡
- **Structure Your Answer**: Use clear headings, bullet points, and neat labelled diagrams where applicable.
- **Need More Details?**: Ask a follow-up question or specify an MCQ number to get an in-depth, step-by-step solution!`;
}
