import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "../_utils/supabaseStub.js";

interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
}

export interface MCQQuestion {
  id: string;
  q: string;
  options: string[];
  correct: number;
  topic: string;
  explain: string;
  difficulty: string;
}

export interface SharedCustomTopic {
  id?: string;
  subject: string;
  topicName: string;
  topicKey: string;
  createdAt?: string;
}

function normalizeSubjectKey(subject: string): string {
  if (!subject) return "Physics";
  const clean = subject.trim();
  const lower = clean.toLowerCase();

  if (lower.includes("physic")) return "Physics";
  if (lower.includes("chem")) return "Chemistry";
  if (lower.includes("bio") || lower.includes("botany") || lower.includes("zoology")) return "Biology";
  if (lower.includes("math")) return "Mathematics";
  if (lower.includes("computer") || lower === "cs" || lower.includes("it")) return "Computer Science";
  if (lower.includes("english") || lower.includes("verbal")) return "English";
  if (lower.includes("logic") || lower.includes("reasoning")) return "Logical Reasoning";
  if (lower.includes("urdu")) return "Urdu";
  if (lower.includes("islam") || lower.includes("din")) return "Islamiat";
  if (lower.includes("pakistan") || lower.includes("pak")) return "Pakistan Studies";

  return clean;
}

function normalizeTopicNameServer(inputTopic: string): { displayName: string; topicKey: string } {
  if (!inputTopic || typeof inputTopic !== 'string') {
    return { displayName: '', topicKey: '' };
  }
  const trimmed = inputTopic.trim().replace(/\s+/g, ' ');
  const topicKey = trimmed.toLowerCase();
  let displayName = trimmed;
  if (trimmed === trimmed.toLowerCase()) {
    displayName = trimmed.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return { displayName, topicKey };
}

function getCurrentMonthPeriod(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getNextMonthResetDate(): string {
  const d = new Date();
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const monthName = nextMonth.toLocaleString('en-US', { month: 'long' });
  return `${monthName} 1st`;
}

function createSupabaseServerClient(env: Record<string, string | undefined>, authHeader?: string | null) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://wbvzbbnapowwmrjecdyt.supabase.co";
  const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;

  if (authHeader) {
    return createClient(url, key, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
  }
  return createClient(url, key);
}

// Memory fallback store for workers
const inMemoryUsageStore: Record<string, Record<string, number>> = {};

async function getStudentMonthlyUsage(
  supabaseClient: any,
  userId: string,
  userEmail?: string
): Promise<number> {
  const period = getCurrentMonthPeriod();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('student_mcq_usage')
        .select('count')
        .eq('student_id', userId)
        .eq('month_period', period)
        .maybeSingle();

      if (!error && data && typeof data.count === 'number') {
        if (!inMemoryUsageStore[period]) inMemoryUsageStore[period] = {};
        inMemoryUsageStore[period][userId] = data.count;
        return data.count;
      }
    } catch (err) {
      console.warn("[getStudentMonthlyUsage error]:", err);
    }
  }

  if (!inMemoryUsageStore[period]) inMemoryUsageStore[period] = {};
  return inMemoryUsageStore[period][userId] || 0;
}

async function incrementStudentMonthlyUsage(
  supabaseClient: any,
  userId: string,
  userEmail: string | undefined,
  addCount: number
): Promise<number> {
  const period = getCurrentMonthPeriod();
  const currentCount = await getStudentMonthlyUsage(supabaseClient, userId, userEmail);
  const newCount = currentCount + addCount;

  if (!inMemoryUsageStore[period]) inMemoryUsageStore[period] = {};
  inMemoryUsageStore[period][userId] = newCount;

  if (supabaseClient) {
    try {
      const { data: existing } = await supabaseClient
        .from('student_mcq_usage')
        .select('id, count')
        .eq('student_id', userId)
        .eq('month_period', period)
        .maybeSingle();

      if (existing && existing.id) {
        await supabaseClient
          .from('student_mcq_usage')
          .update({
            count: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        const { error: insertErr } = await supabaseClient
          .from('student_mcq_usage')
          .insert({
            student_id: userId,
            student_email: userEmail || '',
            month_period: period,
            count: newCount,
            updated_at: new Date().toISOString(),
          });

        if (insertErr) {
          await supabaseClient.from('student_mcq_usage').upsert({
            student_id: userId,
            student_email: userEmail || '',
            month_period: period,
            count: newCount,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'student_id,month_period'
          });
        }
      }
    } catch (err) {
      console.warn("[incrementStudentMonthlyUsage error]:", err);
    }
  }

  return newCount;
}

async function saveSharedCustomTopic(supabaseClient: any, subject: string, rawTopicName: string) {
  const { displayName, topicKey } = normalizeTopicNameServer(rawTopicName);
  if (!topicKey) return { success: false, topicName: '' };

  const normSubKey = normalizeSubjectKey(subject || "Physics").toLowerCase();

  if (supabaseClient) {
    try {
      await supabaseClient.from('shared_custom_topics').upsert({
        subject: normSubKey,
        topic_name: displayName,
        topic_key: topicKey,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'subject,topic_key'
      });
    } catch (err: any) {
      console.warn('[saveSharedCustomTopic error]:', err?.message || err);
    }
  }

  return { success: true, topicName: displayName };
}

async function getCachedMcqs(supabaseClient: any, subject: string, rawTopicName: string, classNum: number = 11): Promise<any[] | null> {
  const { topicKey } = normalizeTopicNameServer(rawTopicName);
  if (!topicKey || topicKey === 'all topics') return null;

  const normSubKey = normalizeSubjectKey(subject || "Physics").toLowerCase();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('shared_mcq_cache')
        .select('questions, topic')
        .ilike('subject', normSubKey)
        .eq('topic_key', topicKey)
        .maybeSingle();

      if (!error && data && Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions;
      }
    } catch (err: any) {
      console.warn('[getCachedMcqs error]:', err?.message || err);
    }
  }

  return null;
}

async function saveMcqsToCache(supabaseClient: any, subject: string, rawTopicName: string, questions: any[], classNum: number = 11): Promise<boolean> {
  const { displayName, topicKey } = normalizeTopicNameServer(rawTopicName);
  if (!topicKey || !Array.isArray(questions) || questions.length === 0) return false;

  const normSubKey = normalizeSubjectKey(subject || "Physics").toLowerCase();

  if (supabaseClient) {
    try {
      await supabaseClient.from('shared_mcq_cache').upsert({
        subject: normSubKey,
        topic: displayName,
        topic_key: topicKey,
        class_num: classNum,
        questions,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'subject,topic_key'
      });
    } catch (err: any) {
      console.warn('[saveMcqsToCache error]:', err?.message || err);
    }
  }

  return true;
}

async function getStudentWeaknessProfile(supabaseClient: any, studentId: string, subject?: string) {
  const normSub = subject ? normalizeSubjectKey(subject) : undefined;
  if (!supabaseClient || !studentId) return null;

  try {
    let query = supabaseClient
      .from("mcq_attempts")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });

    if (normSub) {
      query = query.eq("subject", normSub);
    }

    const { data, error } = await query;
    if (error || !Array.isArray(data) || data.length === 0) return null;

    const targetSub = normSub || data[0]?.subject || "Mathematics";
    const totalAttempts = data.length;
    const correctAttempts = data.filter((a: any) => a.is_correct).length;
    const overallAccuracy = Math.round((correctAttempts / totalAttempts) * 100);
    const totalTime = data.reduce((sum: number, a: any) => sum + (a.time_taken_seconds || 15), 0);
    const avgTimePerQuestionSeconds = Math.round(totalTime / totalAttempts);

    const chapterMap: Record<string, { total: number; correct: number; totalTime: number }> = {};
    for (const item of data) {
      const ch = item.chapter || "General Concepts";
      if (!chapterMap[ch]) chapterMap[ch] = { total: 0, correct: 0, totalTime: 0 };
      chapterMap[ch].total += 1;
      if (item.is_correct) chapterMap[ch].correct += 1;
      chapterMap[ch].totalTime += item.time_taken_seconds || 15;
    }

    const chapterStats = Object.keys(chapterMap).map((ch) => {
      const c = chapterMap[ch];
      return {
        chapter: ch,
        total: c.total,
        correct: c.correct,
        accuracy: Math.round((c.correct / c.total) * 100),
        avgTime: Math.round(c.totalTime / c.total),
      };
    });

    chapterStats.sort((a, b) => a.accuracy - b.accuracy);
    const weakestTopics = chapterStats.slice(0, 3);

    const weakTopicNames = weakestTopics.map((w) => `${w.chapter} (${w.accuracy}% accuracy)`).join(", ");

    const promptContext = `=== ADAPTIVE LEARNING & WEAKNESS PROFILE CONTEXT ===
- Student ID: ${studentId}
- Subject: ${targetSub} (${overallAccuracy}% overall accuracy across ${totalAttempts} attempts)
- WEAKEST TOPICS (REMEDIATION TARGETS): ${weakTopicNames || "None flagged"}
- MANDATORY INSTRUCTION FOR GEMINI: This is a personalized practice test. Focus approximately 60-70% of generated questions on weakest topics (${weakestTopics.map((w) => w.chapter).join(", ")}).`;

    return {
      studentId,
      subject: targetSub,
      totalAttempts,
      overallAccuracy,
      weakestTopics,
      promptContext,
    };
  } catch (err) {
    return null;
  }
}

// Hard constraint topic relevance filter for MCQ question generation
function checkQuestionTopicRelevance(
  qText: string,
  reportedTopic: string | undefined,
  options: string[],
  explainText: string,
  targetTopicName: string,
  subject: string
): boolean {
  if (!targetTopicName) return true;

  const cleanTarget = targetTopicName.trim();
  const lowerTarget = cleanTarget.toLowerCase();
  const normSub = normalizeSubjectKey(subject).toLowerCase();

  // If topic is generic syllabus-wide or "All Topics", skip strict chapter filtering
  if (
    lowerTarget === 'all topics' ||
    lowerTarget === 'full syllabus' ||
    lowerTarget === 'all chapters' ||
    lowerTarget === `${normSub} syllabus` ||
    lowerTarget === `${normSub} board syllabus` ||
    lowerTarget === `${normSub} fbise syllabus` ||
    lowerTarget === `${normSub} core curriculum` ||
    lowerTarget.includes('all chapter') ||
    lowerTarget.includes('full mock') ||
    lowerTarget.includes('full exam')
  ) {
    return true;
  }

  // 1. Tokenize target topic name and remove common filler/stop words
  const stopWords = new Set([
    'and', 'or', 'the', 'of', 'in', 'to', 'a', 'an', 'for', 'with', 'on', 'at', 'by', 'from',
    'chapter', 'subtopic', 'topic', 'unit', 'lesson', 'fbise', 'mdcat', 'pmdc', 'class', '9', '10', '11', '12',
    'part', 'section', 'mcqs', 'mcq', 'practice', 'test', 'exam'
  ]);

  const rawTokens = lowerTarget
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !stopWords.has(t));

  // If no specific topic tokens remain after filtering stop words, allow
  if (rawTokens.length === 0) return true;

  const fullText = (
    qText + ' ' +
    (reportedTopic || '') + ' ' +
    (explainText || '') + ' ' +
    (options || []).join(' ')
  ).toLowerCase();

  const lowerReportedTopic = (reportedTopic || '').toLowerCase();

  // 2. Direct topic match token counting
  let tokenMatchCount = 0;
  for (const token of rawTokens) {
    const stem = token.length > 5 ? token.substring(0, token.length - 2) : token;
    if (fullText.includes(token) || fullText.includes(stem)) {
      tokenMatchCount++;
    }
  }

  // Topic specific dictionary mappings for major Board Exams & PMDC MDCAT chapters & subtopics
  const TOPIC_CONCEPT_MAP: Record<string, string[]> = {
    "the science of biology": ["biology", "living", "organism", "scientific method", "hypothesis", "deduction", "theory", "law", "experiment", "branches of biology", "levels of organization"],
    "fundamental concepts": ["biology", "living", "organism", "life", "cell", "scientific method", "hypothesis", "theory", "law", "experiment", "branches of biology", "levels of organization", "metabolism", "homeostasis", "reproduction", "characteristics of life", "biomolecules", "carbohydrate", "protein", "lipid", "water"],
    "core fundamentals": ["biology", "living", "organism", "life", "cell", "scientific method", "hypothesis", "theory", "law", "experiment", "branches of biology", "levels of organization", "metabolism", "homeostasis"],
    "cell biology": ["cell", "mitochondria", "organelle", "ribosome", "membrane", "endoplasmic", "golgi", "nucleus", "cytoplasm", "lysosome", "chloroplast"],
    "cell structure and function": ["cell", "mitochondria", "organelle", "ribosome", "membrane", "endoplasmic", "golgi", "nucleus", "cytoplasm", "lysosome", "chloroplast", "fluid mosaic"],
    "water properties": ["water", "polar", "polarity", "hydrogen bond", "hydrogen bonding", "solvent", "heat capacity", "heat of vaporization", "cohesion", "adhesion", "surface tension", "density of ice", "hydrophobic", "hydrophilic", "aqueous", "universal solvent", "specific heat", "latent heat", "amphipathic"],
    "properties of water": ["water", "polar", "polarity", "hydrogen bond", "hydrogen bonding", "solvent", "heat capacity", "heat of vaporization", "cohesion", "adhesion", "surface tension", "density of ice", "hydrophobic", "hydrophilic", "aqueous", "universal solvent", "specific heat", "latent heat", "amphipathic"],
    "carbohydrates": ["carbohydrate", "monosaccharide", "glucose", "fructose", "galactose", "disaccharide", "sucrose", "lactose", "maltose", "polysaccharide", "starch", "glycogen", "cellulose", "chitin", "glycosidic", "reducing sugar", "triose", "tetrose", "pentose", "hexose", "aldose", "ketose", "amylose", "amylopectin", "saccharide", "haworth", "fischer", "hemiacetal", "hemiketal"],
    "carbohydrate": ["carbohydrate", "monosaccharide", "glucose", "fructose", "galactose", "disaccharide", "sucrose", "lactose", "maltose", "polysaccharide", "starch", "glycogen", "cellulose", "chitin", "glycosidic", "reducing sugar", "triose", "tetrose", "pentose", "hexose", "aldose", "ketose", "amylose", "amylopectin", "saccharide"],
    "lipids": ["lipid", "fatty acid", "triglyceride", "glycerol", "phospholipid", "steroid", "cholesterol", "wax", "ester bond", "saturated", "unsaturated", "hydrophobic"],
    "proteins": ["protein", "amino acid", "peptide bond", "polypeptide", "primary structure", "secondary structure", "tertiary structure", "quaternary structure", "denaturation", "zwitterion"],
    "nucleic acids": ["nucleic acid", "dna", "rna", "nucleotide", "purine", "pyrimidine", "adenine", "thymine", "guanine", "cytosine", "uracil", "phosphodiester", "double helix"],
    "physical quantities": ["physical", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "base", "derived", "scalar", "vector", "measurement", "precision", "accuracy", "least count", "error", "uncertainty", "significant figures", "prefix", "vernier", "caliper", "gauge", "kelvin", "meter", "kilogram", "second", "ampere", "candela", "mole"],
    "base quantities": ["base", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "fundamental", "length", "mass", "time", "electric current", "temperature", "amount of substance", "luminous intensity", "meter", "kilogram", "second", "ampere", "kelvin", "mole", "candela", "derived", "measurement", "least count", "precision", "accuracy", "error", "uncertainty", "significant figures"],
    "base quantity": ["base", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "fundamental", "length", "mass", "time", "electric current", "temperature", "amount of substance", "luminous intensity", "meter", "kilogram", "second", "ampere", "kelvin", "mole", "candela", "derived", "measurement", "least count", "precision", "accuracy", "error", "uncertainty", "significant figures"],
    "derived quantities": ["derived", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "velocity", "force", "acceleration", "work", "power", "pressure", "newton", "joule", "watt", "pascal", "base"],
    "units and dimensions": ["unit", "dimension", "dimensional", "si unit", "base", "derived", "formula", "dimensional analysis", "least count", "error", "uncertainty"],
    "measurement": ["measurement", "physical", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "least count", "vernier", "screw gauge", "error", "uncertainty", "significant figures"],
    "vectors and equilibrium": ["vector", "vectors", "cross product", "dot product", "resultant", "torque", "equilibrium", "moment arm", "component", "unit vector", "null vector", "scalar product", "center of gravity"],
    "motion and force": ["motion", "force", "newton", "momentum", "impulse", "projectile", "trajectory", "friction", "velocity", "acceleration", "displacement", "inertia"],
    "work and energy": ["work", "energy", "power", "kinetic", "potential", "joule", "watt", "conservation of energy", "work energy theorem", "gravitational potential"],
    "circular motion": ["circular", "centripetal", "angular", "radian", "frequency", "period", "geostationary", "moment of inertia", "banked curve"],
    "fluid dynamics": ["fluid", "viscosity", "bernoulli", "terminal velocity", "laminar", "turbulent", "equation of continuity", "poiseuille", "stokes law"],
    "oscillations": ["oscillation", "oscillations", "shm", "simple harmonic", "pendulum", "resonance", "damping", "restoring force", "amplitude", "frequency"],
    "waves": ["wave", "waves", "doppler", "transverse", "longitudinal", "superposition", "interference", "node", "antinode", "standing wave", "diffraction", "speed of sound"],
    "physical optics": ["optics", "interference", "diffraction", "polarization", "youngs double slit", "huygens", "diffraction grating", "thin film", "brewsters law"],
    "electrostatics": ["electrostatic", "electrostatics", "coulomb", "electric field", "electric potential", "capacitance", "capacitor", "dielectric", "gauss law", "permittivity"],
    "current electricity": ["current", "resistance", "resistor", "ohms law", "kirchhoff", "wheatstone", "potentiometer", "resistivity", "emf", "drift velocity"],
    "electromagnetism": ["magnetic", "magnetism", "solenoid", "lorentz", "biot savart", "ampere law", "flux", "galvanometer", "tesla"],
    "electromagnetic induction": ["induction", "faraday", "lenz", "eddy current", "transformer", "inductance", "henry", "generator", "back emf"],
    "alternating current": ["alternating current", "ac circuit", "impedance", "reactance", "rms", "peak value", "power factor", "choke coil", "resonance circuit"],
    "physics of solids": ["solid", "solids", "stress", "strain", "youngs modulus", "crystalline", "amorphous", "semiconductor", "hysteresis", "elasticity"],
    "electronics": ["transistor", "diode", "pn junction", "rectifier", "operational amplifier", "op amp", "gain", "logic gate", "biasing"],
    "dawn of modern physics": ["photoelectric", "compton", "de broglie", "photon", "blackbody", "work function", "pair production", "relativity", "quantum"],
    "atomic spectra": ["atomic spectra", "bohr", "rydberg", "lyman", "balmer", "paschen", "laser", "x-ray", "energy level"],
    "nuclear physics": ["nuclear", "radioactivity", "alpha", "beta", "gamma", "half life", "binding energy", "mass defect", "fission", "fusion", "decay"],
    "matrices and determinants": ["matrix", "matrices", "determinant", "determinants", "singular", "non singular", "adjoint", "inverse", "cramers rule", "echelon", "transpose"],
    "quadratic equations": ["quadratic", "discriminant", "roots", "synthetic division", "nature of roots", "quadratic formula"],
    "complex numbers": ["complex number", "complex numbers", "imaginary", "iota", "modulus", "argument", "conjugate", "de moivre"],
    "differentiation": ["derivative", "derivatives", "differentiation", "tangent", "normal", "rate of change", "chain rule", "product rule", "quotient rule"],
    "integration": ["integral", "integrals", "integration", "antiderivative", "definite integral", "area under curve", "by parts", "partial fractions"],
    "biological molecules": ["carbohydrate", "protein", "lipid", "amino acid", "enzyme", "nucleic acid", "dna", "rna", "peptide", "monosaccharide", "water", "hydrogen bond"],
    "chemical equilibrium": ["equilibrium", "le chatelier", "kc", "kp", "solubility product", "common ion", "buffer", "reversible"],
    "stoichiometry": ["mole", "avogadro", "molar mass", "empirical formula", "limiting reactant", "percentage yield", "stoichiometry"]
  };

  const targetParts = lowerTarget.split(/\s*[-:–—]\s*/);
  const subtopicKey = targetParts.length > 1 ? targetParts[targetParts.length - 1].trim() : lowerTarget;

  let conceptKeywords: string[] = [];

  // Try exact match first
  if (TOPIC_CONCEPT_MAP[subtopicKey]) {
    conceptKeywords = TOPIC_CONCEPT_MAP[subtopicKey];
  } else if (TOPIC_CONCEPT_MAP[lowerTarget]) {
    conceptKeywords = TOPIC_CONCEPT_MAP[lowerTarget];
  } else {
    // Try substring matching for subtopic
    for (const [key, keywords] of Object.entries(TOPIC_CONCEPT_MAP)) {
      if (subtopicKey.includes(key) || key.includes(subtopicKey)) {
        conceptKeywords = keywords;
        break;
      }
    }
    // Fallback to full target topic
    if (conceptKeywords.length === 0) {
      for (const [key, keywords] of Object.entries(TOPIC_CONCEPT_MAP)) {
        if (lowerTarget.includes(key) || key.includes(lowerTarget)) {
          conceptKeywords = keywords;
          break;
        }
      }
    }
  }

  if (conceptKeywords.length > 0) {
    const hasConceptMatch = conceptKeywords.some(k => fullText.includes(k.toLowerCase()));
    if (!hasConceptMatch) {
      return false;
    }
  } else {
    // Generic topic match: at least 1 topic token must match
    const isIntroductory = ["fundamental", "concepts", "concept", "intro", "basic", "basics", "principles", "core"].some(ig => subtopicKey.includes(ig));
    if (!isIntroductory && tokenMatchCount === 0) {
      return false;
    }
  }

  const normalizedFullText = fullText.replace(/[\u2018\u2019’`']/g, "'");

  // 3. Collision / Off-topic Filter (Discard questions clearly belonging to unrelated chapters)
  if (lowerTarget.includes("physical quantit") || lowerTarget.includes("measurement") || lowerTarget.includes("si unit")) {
    const forbiddenChapterTerms = [
      "projectile", "trajectory", "angle of projection",
      "newton", "second law", "third law", "rate of change of momentum", "conservation of momentum",
      "harmonic motion", "simple harmonic", "simple pendulum", "extreme positions", "shm",
      "bernoulli", "terminal velocity", "viscosity", "poiseuille", "fluid dynamics",
      "magnetic flux", "flux density", "parallel plate", "capacitor", "capacitance", "dielectric",
      "faraday", "lenz", "eddy current", "photoelectric",
      "half life", "binding energy", "fission", "fusion",
      "mitochondria", "chloroplast", "quadratic formula",
      "cramer's rule", "derivative of", "integral of", "matrix", "determinant", "vsepr", "sn1", "sn2", "le chatelier"
    ];
    for (const forbidden of forbiddenChapterTerms) {
      if (normalizedFullText.includes(forbidden)) {
        return false;
      }
    }
  } else if (lowerTarget.includes("vector") || lowerTarget.includes("equilibrium")) {
    const forbiddenChapterTerms = [
      "projectile", "bernoulli", "simple harmonic", "shm", "magnetic flux", "faraday",
      "photoelectric", "half life", "binding energy", "fission", "fusion", "mitochondria",
      "chloroplast", "derivative of", "integral of", "matrix", "cramer's rule", "le chatelier"
    ];
    for (const forbidden of forbiddenChapterTerms) {
      if (normalizedFullText.includes(forbidden)) return false;
    }
  } else if (lowerTarget.includes("carbohydrat")) {
    const forbiddenChapterTerms = [
      "photolysis", "photosynthesis", "light reaction", "dark reaction", "calvin cycle", "chlorophyll", "rubisco",
      "cellular respiration", "glycolysis", "krebs cycle", "electron transport",
      "nephron", "alveoli", "heart", "artery", "vein", "neuron", "synapse",
      "dna replication", "transcription", "translation", "mendel", "crossing over"
    ];
    for (const forbidden of forbiddenChapterTerms) {
      if (normalizedFullText.includes(forbidden)) return false;
    }
  } else if (lowerTarget.includes("cell biology") || lowerTarget.includes("cell structure")) {
    const forbiddenChapterTerms = [
      "newton", "torque", "equilibrium", "vector quantity", "capacitance", "derivative of",
      "integral of", "cramer's rule", "molar mass", "projectile", "simple harmonic"
    ];
    for (const forbidden of forbiddenChapterTerms) {
      if (normalizedFullText.includes(forbidden)) return false;
    }
  }

  return true;
}

function repairAndParseJson(rawText: string): any[] {
  if (!rawText || typeof rawText !== "string") return [];
  const text = rawText.trim();

  // 1. Direct JSON.parse
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && typeof parsed === "object") return [parsed];
  } catch {}

  // 2. Strip Markdown code fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && typeof parsed === "object") return [parsed];
  } catch {}

  // 3. Extract outermost array slice
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const arraySlice = cleaned.substring(firstBracket, lastBracket + 1);
    try {
      const parsed = JSON.parse(arraySlice);
      if (Array.isArray(parsed)) return parsed;
    } catch {}

    // 4. Remove trailing commas before } or ]
    const noTrailingCommas = arraySlice.replace(/,\s*([\]\}])/g, "$1");
    try {
      const parsed = JSON.parse(noTrailingCommas);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  // 5. Regex extraction for individual JSON question objects
  const objectMatches = cleaned.match(/\{[\s\S]*?"q"[\s\S]*?"options"[\s\S]*?"correct"[\s\S]*?\}/g);
  if (objectMatches && objectMatches.length > 0) {
    const extractedObjects: any[] = [];
    for (const objStr of objectMatches) {
      try {
        const cleanObjStr = objStr.replace(/,\s*([\}])/g, "$1");
        const parsedObj = JSON.parse(cleanObjStr);
        if (parsedObj && (parsedObj.q || parsedObj.question)) {
          extractedObjects.push(parsedObj);
        }
      } catch {}
    }
    if (extractedObjects.length > 0) {
      return extractedObjects;
    }
  }

  return [];
}

function validateAndFixQuestions(
  rawQuestions: any[],
  subject: string,
  topicLabel: string,
  difficulty: string,
  targetTopicName?: string
): MCQQuestion[] {
  if (!Array.isArray(rawQuestions)) return [];

  const validated: MCQQuestion[] = [];
  const canonSubject = normalizeSubjectKey(subject);
  const activeTopic = targetTopicName || topicLabel;
  const seenStems = new Set<string>();
  const seenOptionSigs = new Set<string>();

  const QUESTION_PLACEHOLDER_REGEX = /\b(lorem ipsum|placeholder|insert question|sample question|example question|type question|test question|n\/a|tbd|todo)\b/i;
  const OPTION_PLACEHOLDER_REGEX = /^(option\s*[a-d1-4]|choice\s*[a-d1-4]|placeholder|sample\s*option|lorem\s*ipsum|tbd|todo)$/i;

  const isBoilerplateOption = (text: string): boolean => {
    const lower = text.trim().toLowerCase();
    if (lower.length < 2) return true;
    if (OPTION_PLACEHOLDER_REGEX.test(lower)) return true;
    const fillerPhrases = [
      "primary rule of",
      "primary law of",
      "secondary principle of",
      "secondary principle",
      "standard rule of",
      "primary fundamental principle",
      "secondary empirical approximation",
      "inverse derivative constant",
      "unrelated systemic formula",
      "general scientific method",
      "concept 1",
      "concept 2",
      "concept 3",
      "concept 4"
    ];
    return fillerPhrases.some(phrase => lower.includes(phrase));
  };

  for (let i = 0; i < rawQuestions.length; i++) {
    const item = rawQuestions[i];
    if (!item || typeof item !== "object") continue;

    // 1. Question text extraction & sanitization
    let qText = typeof item.q === "string" ? item.q.trim() : "";
    if (!qText && typeof item.question === "string") qText = item.question.trim();
    if (!qText || qText.length < 8) continue;

    // Strip question numbering prefixes like "Q1: " or "1) "
    qText = qText.replace(/^(Q\d+[:\.]?|\d+[\.\)])\s*/i, "");

    // Check for placeholder text in question stem
    if (QUESTION_PLACEHOLDER_REGEX.test(qText)) continue;

    const normStem = qText.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, "");
    if (!normStem || seenStems.has(normStem)) continue;

    const lowerQ = qText.toLowerCase();
    const isUrduOrIslamiat = canonSubject === "Urdu" || canonSubject === "Islamiat";
    const hasUrduScript = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(qText);

    if (isUrduOrIslamiat) {
      if (!hasUrduScript) continue;
      if (
        lowerQ.includes("vector quantity") ||
        lowerQ.includes("classical mechanics") ||
        lowerQ.includes("newton") ||
        lowerQ.includes("harmonic motion") ||
        lowerQ.includes("magnetic flux") ||
        lowerQ.includes("capacitance") ||
        lowerQ.includes("derivative") ||
        lowerQ.includes("mitochondria") ||
        lowerQ.includes("physics") ||
        lowerQ.includes("chemistry")
      ) {
        continue;
      }
    } else if (["English", "Pakistan Studies"].includes(canonSubject)) {
      if (
        lowerQ.includes("vector quantity") ||
        lowerQ.includes("classical mechanics") ||
        lowerQ.includes("newton's") ||
        lowerQ.includes("harmonic motion") ||
        lowerQ.includes("capacitance") ||
        lowerQ.includes("mitochondria")
      ) {
        continue;
      }
    }

    // 2. Options validation
    let rawOptions = item.options;
    if (!Array.isArray(rawOptions) || rawOptions.length < 4) continue;

    const cleanedOptions = rawOptions.slice(0, 4).map((opt: any) => {
      let str = typeof opt === "string" ? opt.trim() : String(opt || "").trim();
      return str.replace(/^(\([A-Da-d1-4]\)|[A-Da-d1-4][\.\)]|\d+[\.\)])\s*/, "");
    });

    // Ensure options array has exactly 4 non-empty choices
    if (cleanedOptions.length !== 4) continue;
    if (cleanedOptions.some((opt) => !opt || opt.trim().length === 0)) continue;

    // Reject questions with generic placeholder option text or boilerplate filler
    if (cleanedOptions.some((opt) => isBoilerplateOption(opt))) continue;

    // Ensure options are 100% distinct (exactly 4 unique options in this question)
    const uniqueOpts = new Set(cleanedOptions.map((o) => o.toLowerCase()));
    if (uniqueOpts.size < 4) continue;

    const optionSig = Array.from(uniqueOpts).sort().join("|");
    if (seenOptionSigs.has(optionSig)) continue;

    // 3. Correct answer index validation & robust alignment
    let correctIdx = -1;

    // Check if item.correct directly matches the text of an option
    if (item.correct !== undefined && item.correct !== null) {
      const itemCorrectStr = String(item.correct).trim().toLowerCase();
      const directMatchIdx = cleanedOptions.findIndex((opt) => opt.toLowerCase() === itemCorrectStr);
      if (directMatchIdx !== -1) {
        correctIdx = directMatchIdx;
      }
    }

    // Check letter representation
    if (correctIdx === -1 && typeof item.correct === "string") {
      const char = item.correct.trim().toUpperCase();
      if (char === "A" || char === "OPTION A" || char === "CHOICE A" || char === "0") correctIdx = 0;
      else if (char === "B" || char === "OPTION B" || char === "CHOICE B" || char === "1") correctIdx = 1;
      else if (char === "C" || char === "OPTION C" || char === "CHOICE C" || char === "2") correctIdx = 2;
      else if (char === "D" || char === "OPTION D" || char === "CHOICE D" || char === "3") correctIdx = 3;
    }

    // Check numeric representation
    if (correctIdx === -1) {
      const num = typeof item.correct === "number" ? item.correct : parseInt(String(item.correct), 10);
      if (!isNaN(num)) {
        if (num === 4) {
          correctIdx = 3; // 1-based index 4 = Option D
        } else if (num >= 0 && num <= 3) {
          correctIdx = num;
        }
      }
    }

    // 4. Explanation & Index Alignment Cross-check
    let explainText = typeof item.explain === "string" ? item.explain.trim() : "";
    if (!explainText && typeof item.explanation === "string") explainText = item.explanation.trim();

    if (explainText) {
      const expUpper = explainText.toUpperCase();
      const letterMatches: number[] = [];
      if (/\b(OPTION\s*A|CHOICE\s*A|\(A\))\b/.test(expUpper)) letterMatches.push(0);
      if (/\b(OPTION\s*B|CHOICE\s*B|\(B\))\b/.test(expUpper)) letterMatches.push(1);
      if (/\b(OPTION\s*C|CHOICE\s*C|\(C\))\b/.test(expUpper)) letterMatches.push(2);
      if (/\b(OPTION\s*D|CHOICE\s*D|\(D\))\b/.test(expUpper)) letterMatches.push(3);

      if (letterMatches.length === 1) {
        correctIdx = letterMatches[0];
      }
    }

    // 5. Strict Bounds Validation: correct index MUST be within [0, cleanedOptions.length - 1]
    if (correctIdx < 0 || correctIdx >= cleanedOptions.length) {
      // Reject malformed question instead of saving invalid or out-of-bounds state
      continue;
    }

    if (!explainText || QUESTION_PLACEHOLDER_REGEX.test(explainText)) {
      explainText = `Option ${String.fromCharCode(65 + correctIdx)} (${cleanedOptions[correctIdx]}) is the correct answer according to standard textbook principles.`;
    }

    if (activeTopic) {
      const isTopicMatch = checkQuestionTopicRelevance(qText, item.topic, cleanedOptions, explainText, activeTopic, subject);
      if (!isTopicMatch) {
        continue;
      }
    }

    seenStems.add(normStem);
    seenOptionSigs.add(optionSig);

    validated.push({
      id: `ai-q-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      q: qText,
      options: cleanedOptions,
      correct: correctIdx,
      topic: activeTopic || item.topic || subject,
      explain: explainText,
      difficulty: item.difficulty || difficulty,
    });
  }

  return validated;
}

function shuffleQuestionOptions(item: {
  id?: string;
  q: string;
  options: string[];
  correct: number;
  topic?: string;
  explain?: string;
  difficulty?: string;
}): MCQQuestion {
  const originalOptions = [...(item.options || [])];
  const correctOptionText = originalOptions[item.correct] ?? originalOptions[0];

  const shuffledOptions = [...originalOptions];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }

  const newCorrectIndex = shuffledOptions.findIndex(opt => opt === correctOptionText);

  return {
    id: item.id || `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    q: item.q,
    options: shuffledOptions,
    correct: newCorrectIndex >= 0 ? newCorrectIndex : 0,
    topic: item.topic || "Core Curriculum",
    explain: item.explain || `Option ${String.fromCharCode(65 + (newCorrectIndex >= 0 ? newCorrectIndex : 0))} is correct.`,
    difficulty: item.difficulty || "medium",
  };
}

function generateSyllabusQuestions(
  subject: string,
  customTopic: string | undefined,
  questionCount: number,
  difficulty: string
): MCQQuestion[] {
  const topicLabel = customTopic || `${subject} Core Principles`;
  const questions: MCQQuestion[] = [];

  const templates: Record<string, Array<{ q: string; options: string[]; correct: number; explain: string }>> = {
    Physics: [
      {
        q: `Which of the following physical quantities is a vector quantity in classical mechanics?`,
        options: ["Torque", "Electric Potential", "Work Done", "Kinetic Energy"],
        correct: 0,
        explain: "Torque is defined as τ = r × F, which is a cross product resulting in a vector quantity with both magnitude and direction."
      },
      {
        q: `According to Newton's Second Law of Motion, the rate of change of momentum is equal to:`,
        options: ["Applied Net Force", "Mass x Velocity", "Impulse per unit mass", "Total Energy"],
        correct: 0,
        explain: "F_net = dp/dt. The rate of change of linear momentum of a body is directly proportional to the net applied force."
      },
      {
        q: `In a simple harmonic motion (SHM), the acceleration of the particle is maximum at:`,
        options: ["Extreme positions", "Mean position", "Halfway between mean and extreme", "It remains constant"],
        correct: 0,
        explain: "Since a = -ω²x, acceleration is directly proportional to displacement x. Thus, 'a' is maximum at extreme positions where x = A."
      }
    ],
    Chemistry: [
      {
        q: `Which of the following orbitals has the lowest energy according to the (n + l) rule?`,
        options: ["4s orbital", "3d orbital", "4p orbital", "5s orbital"],
        correct: 0,
        explain: "For 4s: n+l = 4+0 = 4. For 3d: n+l = 3+2 = 5. Lower (n+l) value means lower energy according to Aufbau principle."
      },
      {
        q: `The geometry of a water molecule (H₂O) according to VSEPR theory is:`,
        options: ["Bent / Angular", "Linear", "Tetrahedral", "Trigonal Planar"],
        correct: 0,
        explain: "H₂O has 2 bonding pairs and 2 lone pairs on Oxygen, leading to a bent shape with bond angle ~104.5°."
      }
    ],
    Mathematics: [
      {
        q: `What is the derivative of f(x) = e^(2x) * sin(x) with respect to x?`,
        options: [
          "e^(2x) [2 sin(x) + cos(x)]",
          "2 e^(2x) cos(x)",
          "e^(2x) [sin(x) + 2 cos(x)]",
          "2 e^(2x) sin(x)"
        ],
        correct: 0,
        explain: "Using product rule d/dx[u*v] = u'v + uv': f'(x) = 2e^(2x)sin(x) + e^(2x)cos(x) = e^(2x)[2sin(x) + cos(x)]."
      }
    ],
    Biology: [
      {
        q: `Which organelle is known as the powerhouse of the eukaryotic cell?`,
        options: ["Mitochondria", "Ribosome", "Golgi Apparatus", "Endoplasmic Reticulum"],
        correct: 0,
        explain: "Mitochondria produce ATP through oxidative phosphorylation during cellular respiration."
      }
    ],
    "Computer Science": [
      {
        q: "Which linear data structure operates on a First-In, First-Out (FIFO) basis?",
        options: ["Queue", "Stack", "Binary Search Tree", "Graph"],
        correct: 0,
        explain: "Queues insert elements at the rear and process them from the front in strict FIFO order."
      }
    ],
    English: [
      {
        q: "Select the correctly punctuated and grammatically sound sentence:",
        options: [
          "It's a great day for an exam.",
          "Its a great day for an exam.",
          "Its' a great day for an exam.",
          "It is a great day, for an exam"
        ],
        correct: 0,
        explain: "\"It's\" is the proper apostrophe contraction for 'It is'. 'Its' without apostrophe is possessive."
      }
    ],
    Urdu: [
      {
        q: "اسم نکرہ کی نشاندہی کریں:",
        options: ["شاعر", "لاہور", "علامہ اقبال", "قرآن مجید"],
        correct: 0,
        explain: "'شاعر' ایک عام اسم (اسم نکرہ) ہے جبکہ لاہور اور علامہ اقبال اسم معرفہ ہیں۔"
      }
    ],
    Islamiat: [
      {
        q: "قرآن مجید کی کس سورۃ کو 'قلب القرآن' (قرآن کا دل) کہا جاتا ہے؟",
        options: ["سورۃ یٰسین", "سورۃ الفاتحہ", "سورۃ البقرہ", "سورۃ الرحمن"],
        correct: 0,
        explain: "احادیث مبارکہ کی روشنی میں سورۃ یٰسین کو قرآن مجید کا دل کہا گیا ہے۔"
      }
    ]
  };

  const keySubject = normalizeSubjectKey(subject);
  const pool = templates[keySubject] || [];

  if (pool.length === 0) {
    return [];
  }

  for (let i = 0; i < Math.min(questionCount, pool.length); i++) {
    const template = pool[i];
    if (!template) continue;

    questions.push({
      id: `verified-q-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      q: template.q,
      options: template.options,
      correct: template.correct,
      topic: customTopic || topicLabel || subject,
      explain: template.explain,
      difficulty
    });
  }

  return questions;
}

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;

  const authHeader = request.headers.get("authorization");
  const supabaseClient = createSupabaseServerClient(env, authHeader);

  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const {
    subtopic,
    chapterName,
    customTopic,
    topic: requestedTopic,
    classNum,
    group,
    questionCount = 10,
    difficulty = "Exam Standard",
    mode = "ai-custom",
    userId = "guest",
    userEmail,
    bypassCache = false,
  } = body;

  const subject = normalizeSubjectKey(body.subject || "Physics");
  const requestedCount = Math.max(1, Number(questionCount) || 10);
  const ADMIN_EMAILS = ["shsvirtualadmin@gmail.com", "support@boardly.cfd"];
  const isAdmin = Boolean(userEmail && ADMIN_EMAILS.includes(userEmail.trim().toLowerCase()));
  const isMdcat = (body.pathType === 'mdcat') || (body.path === 'mdcat') || String(classNum) === 'MDCAT' || String(group) === 'MDCAT' || (body.subject && String(body.subject).toLowerCase().includes('mdcat'));
  const resetDateStr = getNextMonthResetDate();

  if (customTopic && typeof customTopic === 'string' && customTopic.trim()) {
    await saveSharedCustomTopic(supabaseClient, subject, customTopic);
  }

  let activeClassNum = Number(classNum) || 11;
  let activeGroup = String(group || "Pre-Medical");

  // Academic Class & Stream Alignment
  if (userId && userId !== "guest" && !isAdmin && !isMdcat && supabaseClient) {
    try {
      const { data: studentRecord } = await supabaseClient
        .from("students")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const savedGrade = studentRecord?.grade || "";
      const savedStream = studentRecord?.stream || "";

      let lockedClassNum = 11;
      if (savedGrade.includes("9")) lockedClassNum = 9;
      else if (savedGrade.includes("10")) lockedClassNum = 10;
      else if (savedGrade.includes("11")) lockedClassNum = 11;
      else if (savedGrade.includes("12")) lockedClassNum = 12;

      let lockedGroup = "Pre-Medical";
      if (savedStream.includes("Biology")) lockedGroup = "Medical";
      else if (savedStream.includes("Computer Science")) lockedGroup = "Computer Science";
      else if (savedStream.includes("Pre-Medical")) lockedGroup = "Pre-Medical";
      else if (savedStream.includes("Pre-Engineering")) lockedGroup = "Pre-Engineering";
      else if (savedStream.includes("ICS")) lockedGroup = "ICS";

      if (classNum && Number(classNum) !== lockedClassNum) {
        return new Response(JSON.stringify({
          success: false,
          locked: true,
          error: `Class & Stream Locked: Your registration is locked to Class ${lockedClassNum} (${savedStream}). You cannot request questions for Class ${classNum}.`,
          message: `Class & Stream Locked: Your registration is locked to Class ${lockedClassNum} (${savedStream}). You cannot request questions for Class ${classNum}.`
        }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      activeClassNum = lockedClassNum;
      activeGroup = lockedGroup;
    } catch (e) {
      console.warn("[Registration Lock Check Error]:", e);
    }
  }

  const topicLabel = customTopic || requestedTopic || `${subject} Board Syllabus`;
  const currentUsage = isAdmin ? 0 : await getStudentMonthlyUsage(supabaseClient, userId, userEmail);

  // Cache Lookup
  if (!bypassCache && topicLabel && topicLabel !== `${subject} Board Syllabus` && topicLabel !== `${subject} FBISE Syllabus` && topicLabel !== "All Topics") {
    try {
      const cachedBank = await getCachedMcqs(supabaseClient, subject, topicLabel, activeClassNum);
      if (Array.isArray(cachedBank) && cachedBank.length >= 1) {
        const shuffledCached = [...cachedBank].sort(() => 0.5 - Math.random());
        const selectedCached = shuffledCached.slice(0, requestedCount);

        return new Response(JSON.stringify({
          success: true,
          selectedSubject: subject,
          subjectSentToGemini: subject,
          subjectReturned: subject,
          questions: selectedCached,
          cached: true,
          usage: {
            currentUsage,
            limit: 100,
            remaining: isAdmin ? 999999 : Math.max(0, 100 - currentUsage),
            resetDate: resetDateStr,
            isAdmin,
          }
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    } catch (cacheErr) {
      console.warn("[MCQ Cache Lookup Error]:", cacheErr);
    }
  }

  // Monthly Limit Check
  if (!isAdmin && !isMdcat && currentUsage >= 100) {
    const errorMessage = `You've reached your monthly limit of 100 AI-generated MCQs. This resets on ${resetDateStr}. You can still practice using previously generated/cached questions.`;
    return new Response(JSON.stringify({
      success: false,
      limitExceeded: true,
      error: errorMessage,
      message: errorMessage,
      currentUsage,
      requestedCount,
      limit: 100,
      resetDate: resetDateStr,
    }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  let finalQuestions: MCQQuestion[] = [];
  let weaknessProfile: any = null;

  if (userId && userId !== "guest") {
    try {
      weaknessProfile = await getStudentWeaknessProfile(supabaseClient, userId, subject);
    } catch (profErr) {
      console.warn("[Adaptive Context Error]:", profErr);
    }
  }

  const allCandidateKeys = [
    env.GEMINI_API_KEY,
    env.GEMINI_API_KEY_2,
    env.VITE_GEMINI_API_KEY,
    env.GOOGLE_API_KEY,
    ...(typeof process !== "undefined"
      ? [process.env?.GEMINI_API_KEY, process.env?.GEMINI_API_KEY_2, process.env?.VITE_GEMINI_API_KEY, process.env?.GOOGLE_API_KEY]
      : [])
  ].filter((k): k is string => Boolean(k && typeof k === "string" && k.trim().length > 0 && k !== "MY_GEMINI_API_KEY"));

  const aizaKey = allCandidateKeys.find((k) => k.startsWith("AIzaSy"));
  const apiKey = (aizaKey || allCandidateKeys[0] || "").trim();
  const keyPresent = Boolean(apiKey && apiKey.trim().length > 0);
  const keyLength = apiKey ? apiKey.trim().length : 0;
  const keyPrefix = apiKey ? `${apiKey.trim().substring(0, 4)}...` : "NONE";

  let geminiErrorDetails: any = null;

  if ((mode === "ai-custom" || customTopic || mode === "instant") && apiKey) {
    // Preserve original fetch
    const originalFetch = globalThis.fetch;
    // Wrap globalThis.fetch to enforce native Gemini authentication headers & params
    const nativeGeminiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      let targetUrl = urlStr;

      if (urlStr.includes("generativelanguage.googleapis.com")) {
        if (apiKey && !targetUrl.includes("key=")) {
          const sep = targetUrl.includes("?") ? "&" : "?";
          targetUrl = `${targetUrl}${sep}key=${encodeURIComponent(apiKey)}`;
        }
      }

      const newInit: RequestInit = { ...init };
      const headers = new Headers(
        newInit.headers || (typeof input === "object" && input && "headers" in input ? (input as Request).headers : {})
      );

      // STOPS 401 ACCESS_TOKEN_TYPE_UNSUPPORTED: Remove OAuth/Bearer headers
      headers.delete("Authorization");
      headers.delete("authorization");

      if (apiKey) {
        headers.set("x-goog-api-key", apiKey);
      }

      newInit.headers = headers;

      if (typeof input === "object" && input && !(input instanceof URL) && "url" in input) {
        return originalFetch(new Request(targetUrl, newInit));
      }
      return originalFetch(targetUrl, newInit);
    };

    try {
      globalThis.fetch = nativeGeminiFetch as typeof fetch;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "x-goog-api-key": apiKey,
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = isMdcat
        ? `You are a senior chief medical entrance examination creator for Pakistan National MDCAT (Medical and Dental College Admission Test).
Your sole responsibility is to generate high-yield, 100% factually accurate, exam-standard multiple choice questions (MCQs) for the MDCAT entrance test.

MDCAT SPECIFIC MANDATES:
- Subjects allowed: Biology, Chemistry, Physics, English, and Logical Reasoning.
- Questions must reflect official PMDC 2026 uniform curriculum standards and difficulty.
- Factually accurate question stems, exact options, and detailed explanatory reasoning.
- Every question MUST belong strictly to the requested subject "${subject}".`
        : `You are a senior academic curriculum specialist and senior chief examination creator for Board Examinations (Classes 9, 10, 11, and 12).

Your sole responsibility is to generate high-yield, 100% factually accurate, flawless multiple choice questions (MCQs) strictly mapped to the Board curriculum for the specified Class and Group combination.

STRICT CURRICULUM BOUNDARIES:
- For Class 9 and 10: The two groups are 'Medical' and 'Computer Science'.
- For Class 11 and 12: The three groups are 'Pre-Medical', 'Pre-Engineering', and 'ICS'.
- Class 9 & Class 11 NEVER include Pakistan Studies.
- Class 10 & Class 12 INCLUDE Pakistan Studies.
- Ensure every generated question is strictly suited for Class ${activeClassNum} (${activeGroup}) Board level.

STRICT CRITERIA & MANDATORY REQUIREMENTS:
1. FACTUAL & ACADEMIC ACCURACY:
   - Every single question stem, answer choice, mathematical equation, scientific constant, and explanation MUST be 100% factually accurate and verified against accredited textbooks.

2. ABSOLUTE CORRECT ANSWER MATCHING:
   - The 'correct' field MUST be an integer between 0 and 3 corresponding EXACTLY to the ZERO-BASED index of the options array that contains the 100% correct answer (0 = 1st option, 1 = 2nd option, 2 = 3rd option, 3 = 4th option).
   - Double check that options[correct] IS factually true.

3. SPELLING, GRAMMAR & FORMATTING QUALITY CONTROL:
   - Ensure perfect English/Urdu spelling, proper subject terminology, correct SI units/qawaid, and perfect grammar.

4. DISTINCT & PLAUSIBLE OPTIONS:
   - Each question must contain EXACTLY 4 distinct, plausible options with EXACTLY ONE correct answer.

5. STRICT SUBJECT SEPARATION:
   - Every question MUST belong strictly to the requested subject "${subject}". NEVER output questions from other subjects.

6. LANGUAGE MANDATE FOR URDU & ISLAMIAT:
   - If subject is "Urdu", "Islamiat", or "Islamic Studies", ALL question stems (q), option choices (options), topics (topic), and explanations (explain) MUST BE WRITTEN 100% IN URDU SCRIPT (اردو زبان).

7. NO PLACEHOLDER OR GENERIC PHRASES:
   - NEVER generate generic placeholder options, template filler phrases, or abstract terms like 'Concept 1', 'Concept 2', 'Secondary empirical approximation', 'Inverse derivative constant', 'Unrelated systemic formula', or 'Primary fundamental principle'.
   - EVERY question stem, option choice, and explanation MUST contain REAL, factually accurate, curriculum-specific facts, formulas, SI units, definitions, and calculations for the requested subject and topic.`;

      const targetTopicConstraint = customTopic || topicLabel;

      let subjectConstraintNote = "";
      const subLower = subject.toLowerCase();
      if (subLower.includes("urdu")) {
        subjectConstraintNote = `CRITICAL URDU MANDATE: Generate authentic Urdu MCQs for Board Class ${classNum || 11}. ALL text MUST be in Urdu script. DO NOT output any science/Physics questions.`;
      } else if (subLower.includes("islam") || subLower.includes("din")) {
        subjectConstraintNote = `CRITICAL ISLAMIAT MANDATE: Generate authentic Islamiat MCQs for Board Class ${classNum || 11}. ALL text MUST be in Urdu script. DO NOT output any science/Physics questions.`;
      }

      let adaptiveContextText = "";
      if (weaknessProfile && weaknessProfile.promptContext) {
        const isSpecificTopic = targetTopicConstraint && 
          !targetTopicConstraint.toLowerCase().includes("syllabus") && 
          !targetTopicConstraint.toLowerCase().includes("all topic") && 
          !targetTopicConstraint.toLowerCase().includes("full mock") &&
          !targetTopicConstraint.toLowerCase().includes("full exam");

        if (isSpecificTopic) {
          adaptiveContextText = `\n\nADAPTIVE TOPIC FOCUS: The student is practicing specifically on "${targetTopicConstraint}". Focus on testing key concepts, definitions, and formulas within "${targetTopicConstraint}". Generate questions ONLY about ${targetTopicConstraint}. Do not include questions from other chapters or unrelated concepts, even if tangentially related.`;
        } else {
          adaptiveContextText = `\n\n${weaknessProfile.promptContext}`;
        }
      }

      let scopeInstruction = "";
      if (subtopic && chapterName) {
        scopeInstruction = `SCOPE LEVEL: SPECIFIC SUBTOPIC\nSubject: ${subject}\nChapter: ${chapterName}\nSubtopic: ${subtopic}\nSTRICT BOUNDARY: Generate questions ONLY from subtopic "${subtopic}" within chapter "${chapterName}" in subject "${subject}". Every single question MUST directly test concepts, structures, formulas, linkages, or reactions of "${subtopic}" (for Carbohydrates: monosaccharides, disaccharides, polysaccharides, glycosidic bonds, reducing sugars, glucose, fructose, sucrose, starch, glycogen, cellulose, chitin, etc.). Do NOT include questions from any other subtopics (such as general water properties, photosynthesis, enzymes, lipids, or proteins), any other chapters, or any other subjects.`;
      } else if (subtopic) {
        scopeInstruction = `SCOPE LEVEL: SPECIFIC SUBTOPIC\nSubject: ${subject}\nSubtopic: ${subtopic}\nSTRICT BOUNDARY: Generate questions ONLY from subtopic "${subtopic}" in subject "${subject}". Every single question MUST directly test concepts, structures, formulas, linkages, or reactions of "${subtopic}". Do NOT include questions from any other subtopics, any other chapters, or any other subjects.`;
      } else if (chapterName) {
        scopeInstruction = `SCOPE LEVEL: FULL CHAPTER\nSubject: ${subject}\nChapter: ${chapterName}\nSTRICT BOUNDARY: Generate questions ONLY from subtopics belonging to chapter "${chapterName}" in subject "${subject}". Do NOT include questions from any other chapters, and do NOT include questions from any other subjects.`;
      } else {
        scopeInstruction = `SCOPE LEVEL: FULL SUBJECT PRACTICE (${subject})\nSubject: ${subject}\nSTRICT BOUNDARY: Questions may span all chapters within subject "${subject}", but MUST NOT include any questions from other subjects (e.g. NO Chemistry, Biology, Mathematics, or English questions in a ${subject} test). Every question MUST belong strictly to "${subject}".`;
      }

      const userPrompt = isMdcat
        ? `Generate ${requestedCount} multiple choice questions (MCQs) for MDCAT Entrance Test:
Subject: ${subject}
Track: MDCAT Medical & Dental College Admission Test
${targetTopicConstraint ? `Topic Focus: ${targetTopicConstraint}` : ''}
Target Difficulty Level: ${difficulty}
${adaptiveContextText}

${scopeInstruction}`
        : `Generate ${requestedCount} multiple choice questions (MCQs) for:
Subject: ${subject}
Class Level: Class ${classNum || 11}
Group/Stream: ${group || 'Pre-Engineering'}
${targetTopicConstraint ? `Topic/Syllabus Focus: ${targetTopicConstraint}` : ''}
Target Difficulty Level: ${difficulty}
${subjectConstraintNote}${adaptiveContextText}

${scopeInstruction}`;

      const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest"];
      let mcqSuccess = false;
      let lastStatusCode = 0;
      let lastErrorMessage = "";

      for (const modelName of modelsToTry) {
        if (mcqSuccess) break;
        let attempt = 0;
        const maxRetries = 3;

        while (attempt < maxRetries && !mcqSuccess) {
          attempt++;
          const callStart = Date.now();
          try {
            console.log(`[Generate MCQs Worker] Calling Gemini model: ${modelName} (attempt ${attempt}/${maxRetries})`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: userPrompt,
              config: {
                systemInstruction,
                temperature: 0.1,
                topP: 0.95,
                topK: 40,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  description: "List of verified multiple choice questions",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      q: { type: Type.STRING, description: "Factually accurate question text." },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Array of exactly 4 distinct choices."
                      },
                      correct: {
                        type: Type.INTEGER,
                        description: "Zero-based index (0, 1, 2, or 3) indicating correct answer."
                      },
                      topic: { type: Type.STRING, description: "Specific sub-topic or concept tested." },
                      explain: { type: Type.STRING, description: "Detailed explanation." }
                    },
                    required: ["q", "options", "correct", "topic", "explain"]
                  }
                }
              }
            });

            const elapsed = Date.now() - callStart;
            const responseText = response.text || "";
            console.log(`[Generate MCQs Worker] Response from ${modelName} in ${elapsed}ms: ${responseText.length} chars`);

            if (responseText) {
              const rawParsed = repairAndParseJson(responseText);
              const validatedQs = validateAndFixQuestions(rawParsed, subject, topicLabel, difficulty, targetTopicConstraint);
              if (validatedQs.length > 0) {
                finalQuestions = validatedQs.slice(0, requestedCount);
                mcqSuccess = true;
                break;
              } else {
                console.warn(`[Generate MCQs Worker] Model ${modelName} output yielded 0 validated questions out of ${rawParsed.length} parsed items. Raw snippet: ${responseText.slice(0, 150)}`);
              }
            }
          } catch (err: any) {
            const elapsed = Date.now() - callStart;
            lastStatusCode = Number(err?.status || err?.statusCode || err?.code) || 500;
            lastErrorMessage = err?.message || String(err);
            console.error(`[Generate MCQs Worker Error] Model ${modelName} attempt ${attempt} failed after ${elapsed}ms (Status ${lastStatusCode}):`, lastErrorMessage);

            const errStr = lastErrorMessage.toLowerCase();
            const isRetryable =
              lastStatusCode === 503 ||
              lastStatusCode === 500 ||
              lastStatusCode === 502 ||
              lastStatusCode === 504 ||
              lastStatusCode === 429 ||
              errStr.includes("503") ||
              errStr.includes("unavailable") ||
              errStr.includes("high demand") ||
              errStr.includes("overloaded") ||
              errStr.includes("resource_exhausted") ||
              errStr.includes("rate limit") ||
              errStr.includes("fetch failed") ||
              errStr.includes("timeout");

            if (isRetryable && attempt < maxRetries) {
              const backoffMs = attempt * 1200;
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
            } else {
              break;
            }
          }
        }
      }

      if (!mcqSuccess) {
        geminiErrorDetails = {
          message: `Gemini MCQ Generation Error [Status ${lastStatusCode || 500}]: ${lastErrorMessage || "Failed to generate MCQs with Gemini API"}`,
          code: "GEMINI_ERROR",
          status: lastStatusCode || 500
        };
      }
    } catch (outerErr: any) {
      console.error("[Gemini AI MCQ generation outer error]:", outerErr?.message || outerErr, outerErr?.stack || "");
      geminiErrorDetails = {
        message: outerErr?.message || String(outerErr),
        name: outerErr?.name || "Error"
      };
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  if (finalQuestions.length < requestedCount) {
    console.warn(`[Functions MCQ Generation Retries Complete] Generated ${finalQuestions.length}/${requestedCount} authentic questions for "${subject}" - "${customTopic || topicLabel}". Missing slots will be skipped without fallback placeholders.`);
  }

  if (finalQuestions.length > 0 && topicLabel && topicLabel !== `${subject} Board Syllabus` && topicLabel !== `${subject} FBISE Syllabus` && topicLabel !== "All Topics") {
    await saveMcqsToCache(supabaseClient, subject, topicLabel, finalQuestions, activeClassNum);
  }

  let newUsage = currentUsage;
  if (finalQuestions.length > 0 && !isMdcat) {
    newUsage = await incrementStudentMonthlyUsage(supabaseClient, userId, userEmail, finalQuestions.length);
  }

  return new Response(JSON.stringify({
    success: true,
    selectedSubject: subject,
    subjectSentToGemini: subject,
    subjectReturned: subject,
    questions: finalQuestions,
    adaptiveContextApplied: Boolean(weaknessProfile),
    weaknessProfile: weaknessProfile || undefined,
    usage: {
      currentUsage: isMdcat ? 0 : newUsage,
      limit: isMdcat ? 999999 : 100,
      remaining: (isAdmin || isMdcat) ? 999999 : Math.max(0, 100 - newUsage),
      resetDate: resetDateStr,
      isAdmin,
      isMdcat,
    },
    debug: {
      keyPresent,
      keyLength,
      keyPrefix,
      geminiError: geminiErrorDetails
    }
  }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
};

export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
