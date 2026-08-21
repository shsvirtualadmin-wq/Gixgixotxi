/**
 * Topic & Subject Validation Utility for Boardly / SHS Virtual Academy
 * Strictly enforces that generated and cached MCQs belong ONLY to the selected scope
 * (Subtopic, Chapter, or Subject) with zero cross-topic or cross-subject leakage.
 */

// Comprehensive Concept Map linking chapters & subtopics to positive concept keywords
export const TOPIC_CONCEPT_MAP: Record<string, string[]> = {
  // --- PHYSICS ---
  "physical quantities": ["physical", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "base", "derived", "scalar", "vector", "measurement", "precision", "accuracy", "least count", "error", "uncertainty", "significant figures", "prefix", "vernier", "caliper", "screw gauge", "kelvin", "meter", "kilogram", "second", "ampere", "candela", "mole", "spherometer", "zero error"],
  "base quantities": ["base", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "fundamental", "length", "mass", "time", "electric current", "temperature", "amount of substance", "luminous intensity", "meter", "kilogram", "second", "ampere", "kelvin", "mole", "candela", "derived", "measurement", "least count", "precision", "accuracy", "error", "uncertainty", "significant figures"],
  "base quantity": ["base", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "fundamental", "length", "mass", "time", "electric current", "temperature", "amount of substance", "luminous intensity", "meter", "kilogram", "second", "ampere", "kelvin", "mole", "candela", "derived", "measurement", "least count", "precision", "accuracy", "error", "uncertainty", "significant figures"],
  "derived quantities": ["derived", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "velocity", "force", "acceleration", "work", "power", "pressure", "newton", "joule", "watt", "pascal", "base"],
  "units and dimensions": ["unit", "dimension", "dimensional", "si unit", "base", "derived", "formula", "dimensional analysis", "least count", "error", "uncertainty"],
  "measurements": ["physical", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "base", "derived", "measurement", "precision", "accuracy", "least count", "error", "uncertainty", "significant figures", "prefix", "vernier", "caliper", "screw gauge", "spherometer", "zero error"],
  "kinematics": ["kinematics", "displacement", "distance", "speed", "velocity", "acceleration", "equations of motion", "free fall", "gravity", "projectile", "trajectory", "range of projectile", "maximum height", "time of flight", "graphical analysis", "velocity-time", "distance-time"],
  "dynamics": ["dynamics", "force", "newton", "first law", "second law", "third law", "momentum", "conservation of momentum", "impulse", "friction", "limiting friction", "coefficient of friction", "tension", "atwood", "mass and weight"],
  "circular motion": ["circular motion", "centripetal acceleration", "centripetal force", "angular velocity", "angular displacement", "angular acceleration", "banked track", "centrifugal", "frequency", "time period", "radians"],
  "gravitation": ["gravitation", "gravitational force", "coulomb's law of gravitation", "gravitational constant", "escape velocity", "orbital velocity", "satellite", "kepler's law", "weightlessness", "geostationary"],
  "work, power and energy": ["work done", "kinetic energy", "potential energy", "power", "efficiency", "conservation of energy", "joule", "watt", "kilowatt-hour", "work-energy theorem", "mechanical energy"],
  "oscillations": ["simple harmonic motion", "shm", "simple pendulum", "restoring force", "amplitude", "period", "frequency", "resonance", "damped", "phase angle", "hooke's law", "spring constant"],
  "waves": ["wave", "wavelength", "frequency", "speed of sound", "transverse", "longitudinal", "doppler effect", "standing wave", "stationary wave", "beats", "node", "antinode", "intensity", "loudness", "decibel"],
  "optics": ["optics", "reflection", "refraction", "lens", "mirror", "focal length", "diffraction", "interference", "polarization", "young's double slit", "magnification", "refractive index", "total internal reflection", "prism", "dispersion", "diffraction grating", "telescope", "microscope"],
  "electrostatics": ["electrostatics", "coulomb", "electric charge", "electric field", "electric potential", "electric flux", "gauss's law", "capacitor", "capacitance", "parallel plate", "dielectric", "permittivity", "potential difference"],
  "current electricity": ["current electricity", "electric current", "resistance", "resistivity", "ohm's law", "ohmic", "non-ohmic", "emf", "electromotive force", "terminal potential", "kirchhoff", "wheatstone", "potentiometer", "drift velocity", "joule heating", "series and parallel"],
  "electromagnetism": ["magnetic field", "magnetic flux", "lorentz force", "biot-savart", "ampere's law", "solenoid", "toroid", "magnetic force", "tesla", "gauss", "cyclotron"],
  "electromagnetic induction": ["electromagnetic induction", "faraday's law", "lenz's law", "induced emf", "transformer", "mutual inductance", "self inductance", "eddy current", "generator"],
  "alternating current": ["alternating current", "ac circuit", "rms value", "peak value", "impedance", "reactance", "inductive reactance", "capacitive reactance", "power factor", "resonance in ac"],
  "modern physics": ["photoelectric effect", "work function", "photon", "de broglie", "compton effect", "x-ray", "black body", "atomic spectra", "bohr's model", "quantum", "energy levels", "rydberg"],
  "nuclear physics": ["radioactivity", "half-life", "alpha decay", "beta decay", "gamma ray", "mass defect", "binding energy", "fission", "fusion", "isotope", "radioactive decay", "nuclear reactor"],

  // --- CHEMISTRY ---
  "fundamentals of chemistry": ["mole", "avogadro", "molar mass", "stochiometry", "empirical formula", "molecular formula", "limiting reactant", "percentage yield", "atomic mass unit", "gram atom"],
  "atomic structure": ["atomic structure", "subatomic", "proton", "neutron", "electron", "rutherford", "bohr model", "quantum numbers", "orbital", "aufbau", "hund's rule", "pauli exclusion", "electronic configuration", "isotopes"],
  "periodic table": ["periodic table", "periodicity", "ionization energy", "electron affinity", "electronegativity", "atomic radius", "shielding effect", "periods", "groups", "transition elements"],
  "chemical bonding": ["chemical bond", "ionic bond", "covalent bond", "coordinate covalent", "hydrogen bonding", "vsepr", "hybridization", "dipole moment", "electronegativity difference", "sigma bond", "pi bond"],
  "states of matter": ["gaseous state", "boyle's law", "charles's law", "ideal gas equation", "dalton's law", "graham's law", "kinetic molecular theory", "viscosity", "surface tension", "vapor pressure", "boiling point", "crystalline solid"],
  "chemical equilibrium": ["chemical equilibrium", "equilibrium constant", "kc", "kp", "le chatelier", "haber process", "solubility product", "common ion effect", "buffer solution"],
  "acids, bases and salts": ["acid", "base", "ph", "poh", "arrhenius", "bronsted-lowry", "lewis acid", "indicator", "neutralization", "salt hydrolysis", "strong acid", "weak base"],
  "electrochemistry": ["oxidation", "reduction", "oxidation number", "redox", "galvanic cell", "electrolytic cell", "electrode potential", "standard hydrogen electrode", "she", "nernst equation", "corrosion", "electroplating"],
  "reaction kinetics": ["rate of reaction", "order of reaction", "rate law", "activation energy", "arrhenius equation", "catalyst", "half-life of reaction", "collision theory"],
  "organic chemistry": ["functional group", "homologous series", "isomerism", "alkane", "alkene", "alkyne", "haloalkane", "alcohol", "phenol", "ether", "aldehyde", "ketone", "carboxylic acid", "ester", "amine", "benzene", "aromatic", "sn1", "sn2", "electrophilic substitution", "nucleophilic addition"],

  // --- BIOLOGY ---
  "the science of biology": ["biology", "living", "organism", "scientific method", "hypothesis", "deduction", "theory", "law", "experiment", "control group", "branches of biology", "zoology", "botany", "microbiology", "morphology", "anatomy", "histology", "physiology", "genetics", "embryology", "taxonomy", "paleontology", "environmental", "biotechnology", "levels of biological organization", "subatomic", "atom", "molecule", "organelle", "cell", "tissue", "organ", "organ system", "individual", "population", "community", "ecosystem", "biosphere"],
  "fundamental concepts": ["biology", "living", "organism", "life", "cell", "scientific method", "hypothesis", "theory", "law", "experiment", "branches of biology", "levels of organization", "matter", "energy", "metabolism", "homeostasis", "reproduction", "adaptation", "evolution", "characteristics of life", "biomolecules", "classification", "prokaryote", "eukaryote", "species", "biodiversity", "observation", "deduction", "data", "biological problem", "carbohydrate", "protein", "lipid", "water", "nucleic acid", "enzyme"],
  "core fundamentals": ["biology", "living", "organism", "life", "cell", "scientific method", "hypothesis", "theory", "law", "experiment", "branches of biology", "levels of organization", "matter", "energy", "metabolism", "homeostasis", "reproduction", "adaptation", "evolution", "characteristics of life", "biomolecules", "classification", "prokaryote", "eukaryote", "species", "biodiversity", "observation", "deduction", "data", "biological problem"],
  "scientific method": ["scientific method", "biological method", "observation", "hypothesis", "deduction", "experiment", "experimentation", "control group", "experimental group", "result", "conclusion", "theory", "law", "principle", "data", "quantitative", "qualitative", "malaria", "plasmodium", "ronald ross", "laveran"],
  "branches of biology": ["zoology", "botany", "microbiology", "morphology", "anatomy", "histology", "cell biology", "physiology", "genetics", "embryology", "taxonomy", "paleontology", "environmental biology", "socio-biology", "parasitology", "biotechnology", "immunology", "entomology", "pharmacology"],
  "levels of biological organization": ["subatomic", "atom", "molecule", "biomolecule", "organelle", "cell", "tissue", "organ", "organ system", "individual", "organism", "population", "community", "ecosystem", "biosphere", "biome", "species", "habitat"],
  "biodiversity": ["biodiversity", "species", "five kingdom", "classification", "monera", "protista", "fungi", "plantae", "animalia", "binomial nomenclature", "linnaeus", "genus", "family", "order", "class", "phylum", "kingdom", "taxon", "flora", "fauna", "endangered", "extinct"],
  "cell biology": ["cell structure", "cell wall", "cell membrane", "fluid mosaic", "mitochondria", "chloroplast", "ribosome", "endoplasmic reticulum", "golgi apparatus", "lysosome", "nucleus", "vacuole", "cytoskeleton", "prokaryote", "eukaryote"],
  "cell structure and function": ["cell structure", "cell wall", "cell membrane", "fluid mosaic", "mitochondria", "chloroplast", "ribosome", "endoplasmic reticulum", "golgi apparatus", "lysosome", "nucleus", "vacuole", "cytoskeleton", "prokaryote", "eukaryote"],
  "biological molecules": ["carbohydrate", "monosaccharide", "glucose", "disaccharide", "polysaccharide", "protein", "amino acid", "peptide bond", "lipid", "fatty acid", "nucleic acid", "dna", "rna", "nucleotide", "enzyme", "water", "hydrogen bond", "polarity"],
  "bio molecules": ["carbohydrate", "monosaccharide", "glucose", "disaccharide", "polysaccharide", "protein", "amino acid", "peptide bond", "lipid", "fatty acid", "nucleic acid", "dna", "rna", "nucleotide", "enzyme", "water", "hydrogen bond", "polarity"],
  "water properties": ["water", "polar", "polarity", "hydrogen bond", "hydrogen bonding", "solvent", "heat capacity", "heat of vaporization", "cohesion", "adhesion", "surface tension", "density of ice", "hydrophobic", "hydrophilic", "aqueous", "universal solvent", "specific heat", "latent heat", "amphipathic"],
  "properties of water": ["water", "polar", "polarity", "hydrogen bond", "hydrogen bonding", "solvent", "heat capacity", "heat of vaporization", "cohesion", "adhesion", "surface tension", "density of ice", "hydrophobic", "hydrophilic", "aqueous", "universal solvent", "specific heat", "latent heat", "amphipathic"],
  "carbohydrates": ["carbohydrate", "monosaccharide", "glucose", "fructose", "galactose", "disaccharide", "sucrose", "lactose", "maltose", "polysaccharide", "starch", "glycogen", "cellulose", "chitin", "glycosidic", "reducing sugar", "triose", "tetrose", "pentose", "hexose", "aldose", "ketose", "amylose", "amylopectin", "saccharide", "haworth", "fischer", "hemiacetal", "hemiketal"],
  "carbohydrate": ["carbohydrate", "monosaccharide", "glucose", "fructose", "galactose", "disaccharide", "sucrose", "lactose", "maltose", "polysaccharide", "starch", "glycogen", "cellulose", "chitin", "glycosidic", "reducing sugar", "triose", "tetrose", "pentose", "hexose", "aldose", "ketose", "amylose", "amylopectin", "saccharide"],
  "lipids": ["lipid", "fatty acid", "triglyceride", "glycerol", "phospholipid", "steroid", "cholesterol", "wax", "ester bond", "saturated", "unsaturated", "hydrophobic", "lipoprotein", "prostaglandin"],
  "lipids & fatty acids": ["lipid", "fatty acid", "triglyceride", "glycerol", "phospholipid", "steroid", "cholesterol", "wax", "ester bond", "saturated", "unsaturated", "hydrophobic"],
  "proteins": ["protein", "amino acid", "peptide bond", "polypeptide", "primary structure", "secondary structure", "tertiary structure", "quaternary structure", "denaturation", "zwitterion", "peptide", "alpha helix", "beta sheet", "globular", "fibrous"],
  "proteins & amino acids": ["protein", "amino acid", "peptide bond", "polypeptide", "primary structure", "secondary structure", "tertiary structure", "quaternary structure", "denaturation", "zwitterion", "peptide"],
  "nucleic acids": ["nucleic acid", "dna", "rna", "nucleotide", "purine", "pyrimidine", "adenine", "thymine", "guanine", "cytosine", "uracil", "phosphodiester", "double helix", "ribose", "deoxyribose", "mrna", "trna", "rrna"],
  "enzymes": ["enzyme", "active site", "substrate", "lock and key", "induced fit", "competitive inhibition", "non-competitive", "vmax", "km", "coenzyme", "cofactor", "denaturation"],
  "bioenergetics": ["photosynthesis", "light reaction", "dark reaction", "calvin cycle", "photophosphorylation", "chlorophyll", "rubisco", "respiration", "glycolysis", "krebs cycle", "electron transport chain", "atp", "fermentation"],
  "human physiology": ["digestion", "alimentary canal", "stomach", "enzyme", "circulatory system", "heart", "blood vessel", "artery", "vein", "capillary", "blood group", "respiratory system", "lung", "alveoli", "hemoglobin", "nephron", "kidney", "dialysis", "nervous system", "neuron", "synapse", "reflex arc"],
  "genetics": ["gene", "allele", "chromosome", "dna", "rna", "transcription", "translation", "meiosis", "mitosis", "crossing over", "mendel", "dominant", "recessive", "genotype", "phenotype", "mutation", "pedigree"],

  // --- MATHEMATICS ---
  "matrices and determinants": ["matrix", "matrices", "determinant", "cramer's rule", "inverse of matrix", "singular matrix", "transposed matrix", "identity matrix", "row", "column", "order of matrix"],
  "algebra": ["quadratic equation", "quadratic formula", "factorization", "remainder theorem", "factor theorem", "polynomial", "logarithm", "sequence", "series", "arithmetic progression", "geometric progression", "binomial theorem", "partial fractions"],
  "trigonometry": ["sine", "cosine", "tangent", "secant", "cosecant", "cotangent", "trigonometric identity", "radians", "degrees", "law of sines", "law of cosines", "inverse trigonometry"],
  "calculus": ["limit", "differentiation", "derivative", "dy/dx", "integration", "integral", "definite integral", "indefinite integral", "tangent line", "secant line", "area under curve"]
};

/**
 * Signature forbidden keywords for OTHER chapters within the same subject.
 * If a question is requested for Chapter A, but contains strong signature keywords
 * belonging uniquely to Chapter B, it is REJECTED as off-topic.
 */
export function getForbiddenKeywordsForOtherChapters(requestedTopic: string, subject: string): string[] {
  const normTarget = requestedTopic.toLowerCase();
  const forbidden: string[] = [];

  const isPhysics = subject.toLowerCase().includes("physic");
  const isChemistry = subject.toLowerCase().includes("chem");
  const isBio = subject.toLowerCase().includes("bio");

  if (isPhysics) {
    if (normTarget.includes("physical quantit") || normTarget.includes("measurement") || normTarget.includes("si unit")) {
      forbidden.push(
        "electric resistance", "ohm's law", "ohmic", "resistor", "current electricity", "kirchhoff", "wheatstone", "potentiometer", "drift velocity",
        "coulomb's law", "electric field intensity", "capacitor", "capacitance", "dielectric", "parallel plate",
        "doppler effect", "standing wave", "diffraction grating", "polarization", "young's double slit",
        "simple harmonic", "simple pendulum", "restoring force", "shm",
        "photoelectric", "work function", "half-life", "radioactivity", "alpha decay", "beta decay", "binding energy", "fission", "fusion",
        "centripetal acceleration", "projectile motion", "trajectory", "angular velocity", "torque", "moment of inertia",
        "first law of thermodynamics", "entropy", "bernoulli", "viscosity"
      );
    } else if (normTarget.includes("kinematic") || normTarget.includes("motion")) {
      forbidden.push("electric resistance", "ohm's law", "capacitor", "capacitance", "diffraction", "half-life", "radioactivity", "screw gauge", "dimensional formula");
    } else if (normTarget.includes("dynamic") || normTarget.includes("force")) {
      forbidden.push("electric resistance", "ohm's law", "capacitor", "capacitance", "diffraction", "half-life", "radioactivity", "screw gauge");
    } else if (normTarget.includes("work") || normTarget.includes("energy")) {
      forbidden.push("electric resistance", "ohm's law", "kirchhoff", "diffraction", "half-life", "screw gauge");
    } else if (normTarget.includes("electrostatic")) {
      forbidden.push("screw gauge", "vernier caliper", "projectile", "doppler effect", "half-life", "radioactivity", "kirchhoff");
    } else if (normTarget.includes("current electricity")) {
      forbidden.push("screw gauge", "vernier caliper", "projectile", "doppler effect", "half-life", "radioactivity", "diffraction grating", "simple pendulum");
    } else if (normTarget.includes("wave") || normTarget.includes("optic")) {
      forbidden.push("electric resistance", "ohm's law", "capacitor", "half-life", "screw gauge", "vernier caliper");
    } else if (normTarget.includes("modern") || normTarget.includes("nuclear")) {
      forbidden.push("screw gauge", "vernier caliper", "projectile", "doppler effect", "ohm's law", "wheatstone");
    }
  }

  if (isChemistry) {
    if (normTarget.includes("fundamental") || normTarget.includes("mole")) {
      forbidden.push("vsepr", "hybridization", "galvanic cell", "sn1", "sn2", "benzene", "le chatelier");
    } else if (normTarget.includes("atomic structure")) {
      forbidden.push("vsepr", "galvanic cell", "sn1", "sn2", "benzene", "le chatelier");
    } else if (normTarget.includes("bonding")) {
      forbidden.push("mole calculation", "galvanic cell", "sn1", "sn2", "order of reaction");
    } else if (normTarget.includes("organic")) {
      forbidden.push("boyle's law", "quantum numbers", "rutherford", "galvanic cell", "molarity");
    }
  }

  if (isBio) {
    if (normTarget.includes("carbohydrat")) {
      forbidden.push(
        "photolysis", "photosynthesis", "light reaction", "dark reaction", "calvin cycle", "chlorophyll", "rubisco",
        "cellular respiration", "glycolysis", "krebs cycle", "electron transport chain",
        "nephron", "alveoli", "heart", "artery", "vein", "neuron", "synapse", "reflex arc",
        "dna replication", "transcription", "translation", "mendel", "crossing over"
      );
    } else if (normTarget.includes("cell")) {
      forbidden.push("digestion", "heart", "nephron", "mendel", "crossing over", "blood group");
    } else if (normTarget.includes("genetics")) {
      forbidden.push("fluid mosaic", "mitochondria", "rubisco", "calvin cycle", "nephron");
    }
  }

  return forbidden;
}

/**
 * Helper to extract canonical chapter key from topic string
 */
export function getCanonicalChapter(topicStr: string): string {
  if (!topicStr) return '';
  const lower = topicStr.toLowerCase().trim();
  const parts = lower.split(/\s+-\s+|\s+:\s+/);
  const chapterPart = parts[0].trim();

  // Subtopic & Chapter mapping for Biology
  if (
    chapterPart.includes("bio molecule") || chapterPart.includes("biological molecule") ||
    chapterPart.includes("carbohydrate") || chapterPart.includes("lipid") ||
    chapterPart.includes("protein") || chapterPart.includes("water") ||
    chapterPart.includes("nucleic acid") || chapterPart.includes("amino acid") ||
    chapterPart.includes("enzyme")
  ) return "biological molecules";

  if (
    chapterPart.includes("cell structure") || chapterPart.includes("cell biology") ||
    chapterPart.includes("cell function") || chapterPart.includes("organelle") ||
    chapterPart.includes("membrane") || chapterPart.includes("wall")
  ) return "cell structure and function";

  if (chapterPart.includes("cell division") || chapterPart.includes("mitosis") || chapterPart.includes("meiosis")) return "cell division";
  if (chapterPart.includes("diversity") || chapterPart.includes("animal kingdom")) return "diversity among animals";
  if (chapterPart.includes("life processes") || chapterPart.includes("nutrition")) return "life processes in animals and plants";
  if (chapterPart.includes("bioenergetic") || chapterPart.includes("photosynthesis") || chapterPart.includes("respiration")) return "bioenergetics";
  if (chapterPart.includes("transport") || chapterPart.includes("circulation")) return "transport";
  if (chapterPart.includes("homeostasis") || chapterPart.includes("excretion") || chapterPart.includes("osmoregulat")) return "homeostasis";
  if (chapterPart.includes("genetics") || chapterPart.includes("inheritance") || chapterPart.includes("gene") || chapterPart.includes("dna")) return "genetics";
  if (chapterPart.includes("reproduction")) return "reproduction";
  if (chapterPart.includes("coordination") || chapterPart.includes("nervous")) return "coordination and control";
  if (chapterPart.includes("evolution")) return "evolution";
  
  // Subtopic & Chapter mapping for Physics
  if (chapterPart.includes("physical quantit") || chapterPart.includes("measurement") || chapterPart.includes("unit") || chapterPart.includes("dimension")) return "physical quantities and measurement";
  if (chapterPart.includes("kinematics") || chapterPart.includes("velocity") || chapterPart.includes("projectile")) return "kinematics";
  if (chapterPart.includes("dynamics") || chapterPart.includes("force") || chapterPart.includes("momentum")) return "dynamics";
  if (chapterPart.includes("circular motion") || chapterPart.includes("angular")) return "circular motion";
  if (chapterPart.includes("gravitation") || chapterPart.includes("gravity")) return "gravitation";
  if (chapterPart.includes("work") || chapterPart.includes("energy") || chapterPart.includes("power")) return "work, power and energy";
  if (chapterPart.includes("oscillation") || chapterPart.includes("shm") || chapterPart.includes("pendulum")) return "oscillations";
  if (chapterPart.includes("wave") || chapterPart.includes("sound")) return "waves";
  if (chapterPart.includes("optic") || chapterPart.includes("light") || chapterPart.includes("lens")) return "optics";
  if (chapterPart.includes("electrostatics") || chapterPart.includes("coulomb") || chapterPart.includes("electric field")) return "electrostatics";
  if (chapterPart.includes("current electricity") || chapterPart.includes("ohm") || chapterPart.includes("resistance")) return "current electricity";
  if (chapterPart.includes("electromagnetism") || chapterPart.includes("magnetic")) return "electromagnetism";
  
  // Subtopic & Chapter mapping for Chemistry
  if (chapterPart.includes("atomic structure") || chapterPart.includes("bohr") || chapterPart.includes("orbital")) return "atomic structure";
  if (chapterPart.includes("chemical bonding") || chapterPart.includes("covalent") || chapterPart.includes("ionic")) return "chemical bonding";
  if (chapterPart.includes("organic") || chapterPart.includes("hydrocarbon") || chapterPart.includes("alkane") || chapterPart.includes("alkene")) return "organic chemistry";

  return chapterPart;
}

/**
 * Validates whether a question strictly belongs to the requested subject & topic/chapter.
 */
export function checkQuestionTopicRelevance(
  qText: string,
  questionTopic: string | undefined,
  options: string[] = [],
  explainText: string | undefined = "",
  activeTopic: string = "",
  subject: string = ""
): boolean {
  if (!qText || typeof qText !== "string") return false;

  const fullText = `${qText} ${(options || []).join(" ")} ${explainText || ""} ${questionTopic || ""}`.toLowerCase();
  const lowerSub = (subject || "").toLowerCase();
  const lowerTarget = (activeTopic || "").toLowerCase().trim();

  // 1. CHAPTER MISMATCH CHECK: If question specifies a topic and activeTopic specifies a topic/chapter
  if (questionTopic && typeof questionTopic === 'string' && questionTopic.trim().length > 0 && lowerTarget.length > 0) {
    const qChapter = getCanonicalChapter(questionTopic);
    const reqChapter = getCanonicalChapter(activeTopic);
    if (qChapter && reqChapter && qChapter !== reqChapter) {
      // Check if one is a substring of the other or if both refer to the same domain
      const isCrossSubtopic = qChapter.includes(reqChapter) || reqChapter.includes(qChapter);
      if (!isCrossSubtopic) {
        return false;
      }
    }
  }

  // 2. SUBJECT ISOLATION CHECK (Strictly prevents cross-subject leakage for "Practice All Chapters")
  if (lowerSub.includes("physic")) {
    const bioInPhysics = ["mitochondria", "chloroplast", "photosynthesis", "cellular respiration", "ribosome", "xylem", "phloem", "dna replication", "digestive system", "synaptic knob", "allele", "genotype", "phenotype", "nephron", "alveoli"].some(k => fullText.includes(k));
    const chemInPhysics = ["molarity", "vsepr", "sn1 reaction", "sn2 reaction", "alkane", "carboxylic acid", "electronegativity", "galvanic cell", "electronic configuration", "subatomic", "atomic structure", "periodic table", "isomerism", "empirical formula", "mole ratio", "buffer solution", "le chatelier"].some(k => fullText.includes(k));
    const mathInPhysics = ["cramer's rule", "matrix inversion", "quadratic formula", "binomial theorem", "collinear points", "arithmetic progression"].some(k => fullText.includes(k));
    if (bioInPhysics || chemInPhysics || mathInPhysics) return false;
  } else if (lowerSub.includes("chem")) {
    const physInChem = ["centripetal acceleration", "bernoulli's equation", "coulomb's law of gravitation", "simple harmonic motion", "projectile motion", "young's double slit", "doppler effect", "vernier caliper", "screw gauge"].some(k => fullText.includes(k));
    const bioInChem = ["digestive system", "nephron", "synaptic knob", "alveoli", "reflex arc"].some(k => fullText.includes(k));
    if (physInChem || bioInChem) return false;
  } else if (lowerSub.includes("bio")) {
    const physInBio = ["centripetal acceleration", "ohm's law", "electric resistance", "coulomb's law", "bernoulli's", "projectile motion", "vernier caliper", "screw gauge", "wheatstone", "potentiometer"].some(k => fullText.includes(k));
    if (physInBio) return false;
  } else if (lowerSub.includes("urdu") || lowerSub.includes("islam") || lowerSub.includes("din")) {
    const scienceInLang = ["vector", "torque", "mechanics", "newton", "velocity", "acceleration", "physics", "chemistry", "biology", "mitochondria"].some(k => fullText.includes(k));
    if (scienceInLang) return false;
  }

  // If topic is generic ("All Topics", "Full Syllabus", "Practice All Chapters", "All Physics Chapters", etc.),
  // subject isolation passed above, so accept!
  const isGenericTopic = !lowerTarget || 
    lowerTarget.includes("syllabus") || 
    lowerTarget.includes("all topic") || 
    lowerTarget.includes("all chapter") || 
    lowerTarget.includes("full mock") || 
    lowerTarget.includes("full exam") || 
    lowerTarget === `${lowerSub} core curriculum` || 
    lowerTarget === lowerSub;

  if (isGenericTopic) {
    return true;
  }

  // 3. CHECK FORBIDDEN KEYWORDS OF OTHER CHAPTERS
  const forbiddenKeywords = getForbiddenKeywordsForOtherChapters(activeTopic, subject);
  if (forbiddenKeywords.length > 0) {
    const hasForbidden = forbiddenKeywords.some(fk => fullText.includes(fk.toLowerCase()));
    if (hasForbidden) {
      const normTargetClean = lowerTarget.replace(/chapter \d+:?/g, "").trim();
      let positiveMatch = false;
      for (const [key, keywords] of Object.entries(TOPIC_CONCEPT_MAP)) {
        if (normTargetClean.includes(key) || key.includes(normTargetClean)) {
          if (keywords.some(k => fullText.includes(k.toLowerCase()))) {
            positiveMatch = true;
            break;
          }
        }
      }
      if (!positiveMatch) {
        return false;
      }
    }
  }

  // 4. CHECK POSITIVE CONCEPT MATCHING (SUBTOPIC FIRST)
  const normTargetClean = lowerTarget.replace(/chapter \d+:?/g, "").trim();
  
  // Extract subtopic if format is "Chapter - Subtopic"
  let subtopicKey = normTargetClean;
  if (normTargetClean.includes(" - ")) {
    subtopicKey = normTargetClean.split(" - ")[1].trim();
  } else if (normTargetClean.includes(":")) {
    subtopicKey = normTargetClean.split(":")[1].trim();
  }

  let conceptKeywords: string[] = [];

  // Check subtopic key in TOPIC_CONCEPT_MAP first for precise matching
  for (const [key, keywords] of Object.entries(TOPIC_CONCEPT_MAP)) {
    if (subtopicKey.includes(key) || key.includes(subtopicKey)) {
      conceptKeywords = keywords;
      break;
    }
  }

  // Fallback to full target topic string if no subtopic match found
  if (conceptKeywords.length === 0) {
    for (const [key, keywords] of Object.entries(TOPIC_CONCEPT_MAP)) {
      if (normTargetClean.includes(key) || key.includes(normTargetClean)) {
        conceptKeywords = keywords;
        break;
      }
    }
  }

  if (conceptKeywords.length > 0) {
    const hasConceptMatch = conceptKeywords.some(k => fullText.includes(k.toLowerCase()));
    if (!hasConceptMatch) {
      return false;
    }
  } else {
    // Fallback: check if raw tokens of the subtopic appear in the question
    const rawTokens = subtopicKey.split(/[\s\-_,:]+/).filter(t => t.length > 2 && !["chapter", "topics", "subtopic", "and", "the", "for", "with", "units"].includes(t));
    if (rawTokens.length > 0) {
      const isIntroductoryOrGeneral = ["fundamental", "concepts", "concept", "intro", "introduction", "basic", "basics", "overview", "principles", "principle", "core", "general", "methods", "definitions"].some(ig => subtopicKey.includes(ig));
      if (isIntroductoryOrGeneral) {
        // For general/introductory subtopics, allow if either a token matches or any chapter/subject term matches
        const tokenMatch = rawTokens.some(t => fullText.includes(t));
        const chapterMatch = normTargetClean.length > 3 && normTargetClean.split(/[\s\-_,:]+/).some(ct => ct.length > 3 && fullText.includes(ct));
        if (!tokenMatch && !chapterMatch) {
          return false;
        }
      } else {
        const tokenMatch = rawTokens.some(t => fullText.includes(t));
        if (!tokenMatch) {
          return false;
        }
      }
    }
  }

  return true;
}
