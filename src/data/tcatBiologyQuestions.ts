import { Question } from '../types';

/**
 * TCAT Biology Question Bank (96 MCQs)
 * Covers all 8 official UET Taxila TCAT Biology syllabus chapters:
 * 1. Cell Biology & Bioenergetics (12 MCQs: 4 Easy, 4 Medium, 4 Hard)
 * 2. Biological Molecules (12 MCQs: 4 Easy, 4 Medium, 4 Hard)
 * 3. Human Physiology (12 MCQs: 4 Easy, 4 Medium, 4 Hard)
 * 4. Genetics & Biotechnology (12 MCQs: 4 Easy, 4 Medium, 4 Hard)
 * 5. Support & Movement (12 MCQs: 4 Easy, 4 Medium, 4 Hard)
 * 6. Coordination & Control (12 MCQs: 4 Easy, 4 Medium, 4 Hard)
 * 7. Reproduction & Development (12 MCQs: 4 Easy, 4 Medium, 4 Hard)
 * 8. Evolution & Ecology (12 MCQs: 4 Easy, 4 Medium, 4 Hard)
 * Total: exactly 96 MCQs (32 Easy, 32 Medium, 32 Hard).
 * Every item has correct: 0 (shuffled at runtime), 4 distinct options, detailed factual explanation.
 */
export const TCAT_BIOLOGY_QUESTIONS: Question[] = [
  // ================================================
  // CHAPTER 1: Cell Biology & Bioenergetics (12 MCQs)
  // ================================================
  {
    id: 'tcat-bio-1',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Easy',
    q: 'Which organelle is universally referred to as the "powerhouse of the cell" due to ATP generation via oxidative phosphorylation?',
    options: [
      'Mitochondrion',
      'Ribosome',
      'Golgi apparatus',
      'Lysosome'
    ],
    correct: 0,
    explain: 'Mitochondria produce the bulk of cellular ATP through the citric acid cycle and oxidative phosphorylation on the inner mitochondrial cristae.'
  },
  {
    id: 'tcat-bio-2',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Easy',
    q: 'In plant cells, where do the light-dependent reactions of photosynthesis specifically take place?',
    options: [
      'Thylakoid membranes of chloroplasts',
      'Stroma of chloroplasts',
      'Outer mitochondrial membrane',
      'Cytosol'
    ],
    correct: 0,
    explain: 'Light-dependent reactions occur across the thylakoid membranes where chlorophyll pigments, photosystems I and II, and ATP synthase reside.'
  },
  {
    id: 'tcat-bio-3',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Easy',
    q: 'What is the net yield of ATP molecules generated per molecule of glucose during anaerobic glycolysis in the cytoplasm?',
    options: [
      '2 ATP',
      '4 ATP',
      '36 ATP',
      '38 ATP'
    ],
    correct: 0,
    explain: 'Glycolysis consumes 2 ATP and produces 4 ATP, yielding a net gain of exactly 2 ATP molecules per glucose.'
  },
  {
    id: 'tcat-bio-4',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Easy',
    q: 'Which organelle contains acid hydrolases responsible for intracellular digestion and autolysis of worn-out organelles?',
    options: [
      'Lysosome',
      'Peroxisome',
      'Centrosome',
      'Nucleolus'
    ],
    correct: 0,
    explain: 'Lysosomes contain acidic hydrolytic enzymes (optimal pH ~4.5-5.0) for degrading biological polymers and cellular debris.'
  },
  {
    id: 'tcat-bio-5',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Medium',
    q: 'What is the primary enzyme responsible for carbon fixation in the stroma during the Calvin Cycle (light-independent reactions)?',
    options: [
      'RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase)',
      'PEP carboxylase',
      'ATP synthase',
      'Phosphofructokinase'
    ],
    correct: 0,
    explain: 'RuBisCO catalyzes the addition of CO2 to ribulose 1,5-bisphosphate (RuBP) to form two molecules of 3-phosphoglycerate (3-PGA).'
  },
  {
    id: 'tcat-bio-6',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Medium',
    q: 'How does a competitive enzyme inhibitor alter the kinetic parameters Vmax and Km of an enzymatic reaction?',
    options: [
      'Km increases while Vmax remains unchanged',
      'Vmax decreases while Km remains unchanged',
      'Both Vmax and Km decrease proportionally',
      'Both Vmax and Km increase'
    ],
    correct: 0,
    explain: 'Competitive inhibitors bind to the active site; adding excess substrate overcomes the inhibitor (Vmax unchanged), but requires higher substrate concentration (Km increases).'
  },
  {
    id: 'tcat-bio-7',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Medium',
    q: 'During the mitochondrial electron transport chain, what serves as the ultimate terminal electron acceptor?',
    options: [
      'Molecular Oxygen (O₂)',
      'NAD⁺',
      'Cytochrome c',
      'Water (H₂O)'
    ],
    correct: 0,
    explain: 'Electrons flowing through complex IV are transferred to molecular oxygen (O2), which combines with protons to form water.'
  },
  {
    id: 'tcat-bio-8',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Medium',
    q: 'What mechanism drives the transport of sodium and potassium ions across the plasma membrane via the Na⁺/K⁺-ATPase pump?',
    options: [
      'Primary active transport pumping 3 Na⁺ out and 2 K⁺ in against their electrochemical gradients using 1 ATP',
      'Facilitated diffusion moving 2 Na⁺ out and 3 K⁺ in down their gradients',
      'Secondary active symport moving Na⁺ and K⁺ in the same direction',
      'Passive osmosis governed by extracellular osmolarity'
    ],
    correct: 0,
    explain: 'The Na+/K+-ATPase uses 1 ATP molecule to export 3 Na+ ions and import 2 K+ ions against their concentration gradients.'
  },
  {
    id: 'tcat-bio-9',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Hard',
    q: 'Peter Mitchell\'s chemiosmotic hypothesis explains ATP synthesis by demonstrating that:',
    options: [
      'Proton pumping across the inner mitochondrial membrane establishes an electrochemical proton gradient (pmf) that drives ATP synthase',
      'Substrate-level phosphorylation directly transfers high-energy phosphate from acetyl-CoA',
      'Electron transfer complexes mechanically twist the mitochondrial matrix proteins',
      'Water splitting in the matrix generates pressurized molecular hydrogen'
    ],
    correct: 0,
    explain: 'Mitchell\'s chemiosmotic hypothesis demonstrated that the proton motive force across the inner membrane powers rotational catalysis in ATP synthase (F₀F₁).'
  },
  {
    id: 'tcat-bio-10',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Hard',
    q: 'How many turns of the Calvin cycle, and how many net molecules of CO₂, ATP, and NADPH are required to synthesize one net molecule of Glucose (C₆H₁₂O₆)?',
    options: [
      '6 turns: 6 CO₂, 18 ATP, and 12 NADPH',
      '3 turns: 3 CO₂, 9 ATP, and 6 NADPH',
      '6 turns: 6 CO₂, 12 ATP, and 18 NADPH',
      '1 turn: 6 CO₂, 36 ATP, and 24 NADPH'
    ],
    correct: 0,
    explain: 'Synthesizing one glucose requires fixing 6 CO2 molecules over 6 turns, consuming 18 ATP and 12 NADPH.'
  },
  {
    id: 'tcat-bio-11',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Hard',
    q: 'Which mitochondrial matrix intermediate combines with oxaloacetate (4C) to initiate the Krebs citric acid cycle?',
    options: [
      'Acetyl-CoA (2C) to form Citrate (6C)',
      'Pyruvate (3C) to form Isocitrate (6C)',
      'Succinyl-CoA (4C) to form α-Ketoglutarate (5C)',
      'Malate (4C) to form Fumarate (4C)'
    ],
    correct: 0,
    explain: 'Citrate synthase condenses 2-carbon Acetyl-CoA with 4-carbon Oxaloacetate to produce 6-carbon Citric Acid (Citrate).'
  },
  {
    id: 'tcat-bio-12',
    subject: 'Biology',
    topic: 'Cell Biology & Bioenergetics',
    difficulty: 'Hard',
    q: 'In cyclic photophosphorylation in chloroplasts, which photosystem operates independently and what product is uniquely synthesized without NADPH production?',
    options: [
      'Photosystem I (P700) alone operates, synthesizing exclusively ATP',
      'Photosystem II (P680) alone operates, synthesizing exclusively NADPH',
      'Both PSI and PSII operate together, synthesizing ATP and O₂',
      'Photosystem II operates, synthesizing Glucose directly'
    ],
    correct: 0,
    explain: 'Cyclic photophosphorylation involves only PSI (P700); excited electrons return via ferredoxin and cytochrome b6f to PSI, generating ATP without reducing NADP+.'
  },

  // ============================================
  // CHAPTER 2: Biological Molecules (12 MCQs)
  // ============================================
  {
    id: 'tcat-bio-13',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Easy',
    q: 'Which covalent linkage joins individual amino acid monomers together to form a polypeptide chain?',
    options: [
      'Peptide bond (-CO-NH-)',
      'Glycosidic bond',
      'Phosphodiester bond',
      'Ester bond'
    ],
    correct: 0,
    explain: 'A peptide bond forms between the carboxyl group of one amino acid and the amino group of another via a condensation (dehydration) reaction.'
  },
  {
    id: 'tcat-bio-14',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Easy',
    q: 'Which nitrogenous base is present in RNA nucleotides but replaced by Thymine in DNA?',
    options: [
      'Uracil',
      'Adenine',
      'Guanine',
      'Cytosine'
    ],
    correct: 0,
    explain: 'RNA contains Uracil (U) instead of Thymine (T); both base-pair with Adenine (A).'
  },
  {
    id: 'tcat-bio-15',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Easy',
    q: 'What is the primary storage polysaccharide found in animal liver and skeletal muscle cells?',
    options: [
      'Glycogen',
      'Starch (Amylose)',
      'Cellulose',
      'Chitin'
    ],
    correct: 0,
    explain: 'Glycogen is a highly branched polymer of glucose used by animals for rapid energy storage and glucose mobilization.'
  },
  {
    id: 'tcat-bio-16',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Easy',
    q: 'What chemical components combine to form a single triglyceride lipid molecule?',
    options: [
      'One glycerol molecule and three fatty acid chains',
      'Three glycerol molecules and one fatty acid chain',
      'One sphingosine and two phosphate groups',
      'One glucose and three amino acid residues'
    ],
    correct: 0,
    explain: 'A triglyceride consists of a 3-carbon glycerol backbone esterified to three fatty acid tails.'
  },
  {
    id: 'tcat-bio-17',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Medium',
    q: 'What type of chemical bond stabilizes the secondary structure of proteins (such as α-helices and β-pleated sheets)?',
    options: [
      'Hydrogen bonds between backbone carbonyl oxygens and amide hydrogens',
      'Disulfide bridges between cysteine side chains',
      'Hydrophobic interactions between non-polar aliphatic groups',
      'Ionic salt bridges between aspartate and lysine'
    ],
    correct: 0,
    explain: 'Secondary structure (α-helix and β-sheet) is maintained strictly by repetitive hydrogen bonding along the peptide backbone.'
  },
  {
    id: 'tcat-bio-18',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Medium',
    q: 'Which pair of nitrogenous bases are two-ringed Purines?',
    options: [
      'Adenine and Guanine',
      'Cytosine and Thymine',
      'Thymine and Uracil',
      'Adenine and Cytosine'
    ],
    correct: 0,
    explain: 'Adenine (A) and Guanine (G) are purines with a double-ring structure (pyrimidine fused to imidazole).'
  },
  {
    id: 'tcat-bio-19',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Medium',
    q: 'Why cannot human digestive enzymes hydrolyze dietary cellulose, despite it being composed entirely of glucose subunits?',
    options: [
      'Cellulose contains β-1,4-glycosidic linkages which humans lack cellulase enzymes to cleave',
      'Cellulose contains α-1,4-glycosidic bonds that are shielded by lipids',
      'Cellulose is composed of L-glucose stereoisomers rather than D-glucose',
      'Cellulose has branched peptide cross-links that inactivate salivary amylase'
    ],
    correct: 0,
    explain: 'Human amylase only breaks α-1,4 linkages (starch/glycogen); human bodies lack cellulase to hydrolyze β-1,4 glycosidic bonds in cellulose.'
  },
  {
    id: 'tcat-bio-20',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Medium',
    q: 'What structural property makes phospholipids amphipathic molecules capable of forming cell membrane bilayers?',
    options: [
      'A hydrophilic polar phosphate head group combined with two hydrophobic non-polar fatty acid tails',
      'Two hydrophilic glycerol backbones linked to a non-polar peptide chain',
      'Equal numbers of positively charged amino and negatively charged carboxyl groups',
      'A cholesterol ring fused covalently to three phosphate ions'
    ],
    correct: 0,
    explain: 'Phospholipids have a hydrophilic polar head (phosphate + glycerol) and hydrophobic nonpolar tails, spontaneously forming bilayers in water.'
  },
  {
    id: 'tcat-bio-21',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Hard',
    q: 'In the tertiary structure of globular proteins, which covalent interaction forms the strongest bond between distant amino acid residues?',
    options: [
      'Disulfide bond (-S-S-) between two cysteine residues',
      'Hydrogen bond between serine and threonine',
      'Electrostatic interaction between glutamate and arginine',
      'Van der Waals attraction between leucine residues'
    ],
    correct: 0,
    explain: 'Disulfide bridges are true covalent bonds formed by oxidation of thiol (-SH) groups on cysteine residues, providing strong structural stability.'
  },
  {
    id: 'tcat-bio-22',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Hard',
    q: 'What is the structural distinction between DNA and RNA pentose sugars at the 2\' carbon position?',
    options: [
      'Deoxyribose has an -H atom at C-2\', while Ribose has an -OH hydroxyl group at C-2\'',
      'Ribose lacks an oxygen atom at C-2\', while Deoxyribose possesses two -OH groups',
      'Deoxyribose contains 6 carbons (hexose), whereas Ribose contains 5 carbons (pentose)',
      'Ribose has a nitrogenous base attached directly to C-2\''
    ],
    correct: 0,
    explain: 'Deoxyribose is \'de-oxygenated\' at the 2\' position (bearing -H instead of -OH), making DNA chemically less prone to alkaline hydrolysis than RNA.'
  },
  {
    id: 'tcat-bio-23',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Hard',
    q: 'According to Chargaff\'s rules for double-stranded DNA, if a genomic sample contains 28% Cytosine, what percentage of Adenine does it contain?',
    options: [
      '22%',
      '28%',
      '44%',
      '14%'
    ],
    correct: 0,
    explain: 'In dsDNA, C = G = 28%, so C + G = 56%. The remaining 44% is divided equally between A and T (A = T = 44% / 2 = 22%).'
  },
  {
    id: 'tcat-bio-24',
    subject: 'Biology',
    topic: 'Biological Molecules',
    difficulty: 'Hard',
    q: 'What is the characteristic prosthetic group present in Hemoglobin and Myoglobin that binds reversible molecular oxygen?',
    options: [
      'Iron-containing Protoporphyrin IX (Heme group with Fe²⁺)',
      'Magnesium-containing Chlorin ring',
      'Cobalt-containing Corrin ring',
      'Zinc-containing Carbonic Anhydrase core'
    ],
    correct: 0,
    explain: 'Hemoglobin contains four heme prosthetic groups (iron protoporphyrin IX with Fe²⁺), each capable of binding one O₂ molecule reversibly.'
  },

  // =========================================
  // CHAPTER 3: Human Physiology (12 MCQs)
  // =========================================
  {
    id: 'tcat-bio-25',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Easy',
    q: 'Which human heart chamber pumps oxygenated blood directly into the systemic circulation via the Aorta?',
    options: [
      'Left Ventricle',
      'Right Ventricle',
      'Left Atrium',
      'Right Atrium'
    ],
    correct: 0,
    explain: 'The left ventricle has the thickest muscular wall and generates high pressure to pump oxygenated blood through the aortic valve into the aorta.'
  },
  {
    id: 'tcat-bio-26',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Easy',
    q: 'What is the functional microscopic filtration unit of the human kidney?',
    options: [
      'Nephron',
      'Alveolus',
      'Neuron',
      'Lobule'
    ],
    correct: 0,
    explain: 'The nephron is the basic structural and functional unit of the kidney, consisting of a renal corpuscle and renal tubule system.'
  },
  {
    id: 'tcat-bio-27',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Easy',
    q: 'Which proteolytic enzyme is secreted by stomach gastric chief cells in an inactive zymogen form and activated by hydrochloric acid (HCl)?',
    options: [
      'Pepsin (secreted as Pepsinogen)',
      'Trypsin (secreted as Trypsinogen)',
      'Amylase',
      'Lipase'
    ],
    correct: 0,
    explain: 'Chief cells secrete inactive pepsinogen, which is converted to active pepsin in the acidic environment (pH 1.5-2.0) created by parietal cell HCl.'
  },
  {
    id: 'tcat-bio-28',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Easy',
    q: 'Which blood type is considered the "Universal Red Blood Cell Donor" because its erythrocytes lack both A and B surface antigens?',
    options: [
      'O negative (O⁻)',
      'AB positive (AB⁺)',
      'A positive (A⁺)',
      'B negative (B⁻)'
    ],
    correct: 0,
    explain: 'Type O negative blood has neither A nor B antigens nor the Rh (D) antigen on RBC membranes, minimizing hemolytic transfusion reaction risks.'
  },
  {
    id: 'tcat-bio-29',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Medium',
    q: 'What physiological event causes the characteristic "lub" (first heart sound, S1)?',
    options: [
      'Closure of the atrioventricular (Tricuspid and Mitral/Bicuspid) valves at the onset of ventricular systole',
      'Closure of the semilunar (Aortic and Pulmonary) valves at the end of systole',
      'Rapid passive filling of the ventricles during diastole',
      'Contraction of the papillary muscles during atrial systole'
    ],
    correct: 0,
    explain: 'The first heart sound (S1, "lub") is caused by the sudden closure and vibration of the AV valves (mitral and tricuspid) as ventricles contract.'
  },
  {
    id: 'tcat-bio-30',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Medium',
    q: 'What does the Bohr effect describe regarding hemoglobin-oxygen affinity in actively respiring tissues?',
    options: [
      'Elevated CO₂ and decreased pH (increased H⁺) reduce hemoglobin\'s affinity for O₂, promoting oxygen unloading',
      'Increased oxygen partial pressure drives carbon dioxide release from carbamino compounds',
      'Decreased temperature shifts the oxygen dissociation curve to the right',
      'High concentrations of carbon monoxide lock hemoglobin in the relaxed R-state'
    ],
    correct: 0,
    explain: 'The Bohr effect explains that lower pH and higher CO2 in metabolically active tissues decrease hemoglobin affinity for O2, releasing oxygen where needed.'
  },
  {
    id: 'tcat-bio-31',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Medium',
    q: 'In the nephron, which segment is primarily responsible for the reabsorption of approximately 65-70% of filtered water, sodium, and 100% of filtered glucose and amino acids?',
    options: [
      'Proximal Convoluted Tubule (PCT)',
      'Loop of Henle descending limb',
      'Distal Convoluted Tubule (DCT)',
      'Collecting Duct'
    ],
    correct: 0,
    explain: 'The PCT has extensive microvilli (brush border) and mitochondria, actively reabsorbing glucose, amino acids, and most electrolytes and water.'
  },
  {
    id: 'tcat-bio-32',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Medium',
    q: 'How is the major fraction (~70%) of carbon dioxide transported in human systemic venous blood?',
    options: [
      'As dissolved bicarbonate ions (HCO₃⁻) in blood plasma',
      'Bound directly to hemoglobin as carbaminohemoglobin',
      'As dissolved CO₂ gas bubbles in blood serum',
      'Bound covalently to plasma albumin proteins'
    ],
    correct: 0,
    explain: 'Carbonic anhydrase inside RBCs converts CO2 to H2CO3, which dissociates into H+ and HCO3-; HCO3- is then transported in plasma via chloride shift.'
  },
  {
    id: 'tcat-bio-33',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Hard',
    q: 'How does the countercurrent multiplier mechanism in the Loop of Henle establish a hypertonic medullary osmotic gradient?',
    options: [
      'The descending limb is permeable to water but impermeable to solutes; the ascending limb actively pumps NaCl out while being impermeable to water',
      'The ascending limb allows water to leave by osmosis; the descending limb actively absorbs urea',
      'Both limbs actively pump glucose and sodium ions simultaneously into the renal cortex',
      'Vasa recta capillaries pump potassium ions into the collecting tubules against concentration gradients'
    ],
    correct: 0,
    explain: 'Descending limb loses water (concentrating tubular fluid); ascending limb actively pumps NaCl into the interstitium without water following, creating a gradient up to 1200 mOsm/L.'
  },
  {
    id: 'tcat-bio-34',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Hard',
    q: 'What is the role of Antidiuretic Hormone (ADH / Vasopressin) in regulating renal water excretion?',
    options: [
      'It stimulates insertion of Aquaporin-2 water channels into the apical membranes of collecting duct principal cells, increasing water reabsorption',
      'It inhibits sodium reabsorption in the ascending loop of Henle, causing diuresis',
      'It constricts the afferent glomerular arteriole to lower GFR to zero',
      'It activates aldosterone secretion directly from the juxtaglomerular apparatus'
    ],
    correct: 0,
    explain: 'ADH binds V2 receptors in collecting duct cells, triggering exocytosis of Aquaporin-2 channels to reabsorb water and produce concentrated urine.'
  },
  {
    id: 'tcat-bio-35',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Hard',
    q: 'On a standard clinical Electrocardiogram (ECG/EKG), what electrical event is represented by the QRS complex?',
    options: [
      'Ventricular depolarization preceding ventricular contraction',
      'Atrial depolarization preceding atrial contraction',
      'Ventricular repolarization during diastole',
      'Atrial repolarization masking the T wave'
    ],
    correct: 0,
    explain: 'The QRS complex corresponds to rapid ventricular depolarization; atrial repolarization also occurs simultaneously but is hidden by the large QRS amplitude.'
  },
  {
    id: 'tcat-bio-36',
    subject: 'Biology',
    topic: 'Human Physiology',
    difficulty: 'Hard',
    q: 'Which digestive hormone stimulates the gall bladder to contract and expels pancreatic digestive enzymes into the duodenum in response to fatty chyme?',
    options: [
      'Cholecystokinin (CCK)',
      'Secretin',
      'Gastrin',
      'Glucose-dependent Insulinotropic Peptide (GIP)'
    ],
    correct: 0,
    explain: 'CCK is secreted by enteroendocrine I cells in the duodenum; it stimulates gallbladder contraction (bile release) and pancreatic acinar enzyme secretion.'
  },

  // ==============================================
  // CHAPTER 4: Genetics & Biotechnology (12 MCQs)
  // ==============================================
  {
    id: 'tcat-bio-37',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Easy',
    q: 'What phenotypic ratio is expected in the F2 generation of a classic Mendelian monohybrid cross between two heterozygous parents (Aa × Aa) with complete dominance?',
    options: [
      '3 : 1 (Dominant : Recessive)',
      '1 : 2 : 1',
      '9 : 3 : 3 : 1',
      '1 : 1'
    ],
    correct: 0,
    explain: 'In a monohybrid cross (Aa × Aa), genotypes are 1 AA : 2 Aa : 1 aa, producing a 3 dominant : 1 recessive phenotypic ratio.'
  },
  {
    id: 'tcat-bio-38',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Easy',
    q: 'Which enzyme is responsible for synthesizing a complementary messenger RNA (mRNA) transcript from a DNA template during transcription?',
    options: [
      'RNA Polymerase',
      'DNA Ligase',
      'DNA Polymerase I',
      'Reverse Transcriptase'
    ],
    correct: 0,
    explain: 'RNA Polymerase binds to the promoter sequence and adds complementary ribonucleotides to build the pre-mRNA transcript in the 5\' to 3\' direction.'
  },
  {
    id: 'tcat-bio-39',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Easy',
    q: 'What laboratory technique is used to amplify millions of copies of a specific targeted DNA sequence in vitro?',
    options: [
      'Polymerase Chain Reaction (PCR)',
      'Gel Electrophoresis',
      'Western Blotting',
      'Sanger DNA Sequencing'
    ],
    correct: 0,
    explain: 'PCR (using Taq polymerase, primers, and thermal cycling) exponentially amplifies targeted DNA fragments in vitro.'
  },
  {
    id: 'tcat-bio-40',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Easy',
    q: 'How many nucleotide bases constitute a single genetic codon that specifies an amino acid in the genetic code?',
    options: [
      '3 bases (Triplet code)',
      '2 bases',
      '4 bases',
      '1 base'
    ],
    correct: 0,
    explain: 'The genetic code is a triplet code where three consecutive mRNA bases form a codon specifying one amino acid or a termination signal.'
  },
  {
    id: 'tcat-bio-41',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Medium',
    q: 'What cross is used to determine whether an individual displaying a dominant phenotype is homozygous dominant or heterozygous?',
    options: [
      'Test Cross (crossing the individual with a homozygous recessive individual)',
      'Reciprocal Cross',
      'Dihybrid Cross',
      'Backcross with a homozygous dominant parent'
    ],
    correct: 0,
    explain: 'A test cross with a homozygous recessive (aa) reveals the genotype: if 100% dominant, parent was AA; if 50% dominant / 50% recessive, parent was Aa.'
  },
  {
    id: 'tcat-bio-42',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Medium',
    q: 'Why are X-linked recessive disorders such as Hemophilia and Red-Green Color Blindness observed significantly more frequently in biological males than females?',
    options: [
      'Males are hemizygous (XY), possessing only one X chromosome; a single recessive allele on the X is expressed',
      'Females inactivate both X chromosomes in somatic tissues',
      'The Y chromosome actively represses the clotting factor genes',
      'Males produce testosterone which accelerates mutation rates on the X chromosome'
    ],
    correct: 0,
    explain: 'Males have XY chromosomes; since there is no homologous counterpart on the Y chromosome, any recessive allele on the single X chromosome is automatically expressed.'
  },
  {
    id: 'tcat-bio-43',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Medium',
    q: 'Which enzyme seals nicks in the phosphodiester backbone by joining Okazaki fragments on the lagging strand during DNA replication?',
    options: [
      'DNA Ligase',
      'DNA Helicase',
      'Topoisomerase (Gyrase)',
      'Primase'
    ],
    correct: 0,
    explain: 'DNA ligase catalyzes formation of phosphodiester bonds between the 3\'-OH of one Okazaki fragment and 5\'-phosphate of the next fragment.'
  },
  {
    id: 'tcat-bio-44',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Medium',
    q: 'In agarose gel electrophoresis, how do DNA fragments migrate under an applied electric field?',
    options: [
      'Negatively charged DNA fragments migrate toward the positive anode; smaller fragments move faster through the gel pores',
      'Positively charged DNA fragments migrate toward the negative cathode; larger fragments move faster',
      'Neutral DNA molecules separate based strictly on nucleotide base composition',
      'DNA fragments remain stationary until cleaved by ultraviolet light'
    ],
    correct: 0,
    explain: 'DNA\'s phosphate backbone carries negative charges, driving migration toward the positive electrode; smaller fragments experience less matrix resistance and travel farther.'
  },
  {
    id: 'tcat-bio-45',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Hard',
    q: 'What are the three sequential thermal phases of a standard Polymerase Chain Reaction (PCR) cycle?',
    options: [
      'Denaturation (~95°C) → Primer Annealing (~55°C) → Primer Extension (~72°C)',
      'Annealing (~95°C) → Extension (~55°C) → Denaturation (~72°C)',
      'Ligation (~95°C) → Cleavage (~55°C) → Hybridization (~72°C)',
      'Extension (~95°C) → Denaturation (~55°C) → Termination (~72°C)'
    ],
    correct: 0,
    explain: 'PCR cycles: 94-96°C denatures dsDNA into single strands; 50-65°C anneals primers; 72°C enables thermostable Taq polymerase extension.'
  },
  {
    id: 'tcat-bio-46',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Hard',
    q: 'What is the function of Restriction Endonucleases (e.g., EcoRI) in recombinant DNA technology?',
    options: [
      'They recognize specific palindromic DNA sequences and cleave phosphodiester bonds, generating sticky or blunt ends',
      'They synthesize complementary DNA (cDNA) from mature mRNA transcripts',
      'They add poly-A tails to the 3\' ends of eukaryotic pre-mRNAs',
      'They protect bacterial host ribosomes from viral bacteriophage infection'
    ],
    correct: 0,
    explain: 'Restriction enzymes recognize specific palindromic sequences (e.g. 5\'-GAATTC-3\') and produce cohesive ("sticky") or blunt overhangs suitable for recombinant insertion.'
  },
  {
    id: 'tcat-bio-47',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Hard',
    q: 'In eukaryotic mRNA post-transcriptional processing, what modifications must occur before mature mRNA exports from the nucleus?',
    options: [
      'Addition of a 7-methylguanosine cap at the 5\' end, a poly-A tail at the 3\' end, and spliceosomal excision of non-coding introns',
      'Removal of exons and joining of introns via reverse transcriptase',
      'Phosphorylation of serine residues along the transcript backbone',
      'Attachment of transfer RNA molecules directly to the promoter region'
    ],
    correct: 0,
    explain: 'Eukaryotic pre-mRNA undergoes 5\' 7-methylguanosine capping, 3\' polyadenylation (poly-A tail), and splicing out of introns by spliceosomes.'
  },
  {
    id: 'tcat-bio-48',
    subject: 'Biology',
    topic: 'Genetics & Biotechnology',
    difficulty: 'Hard',
    q: 'What is the molecular cause of Sickle Cell Anemia at the genetic and polypeptide level?',
    options: [
      'A point mutation (GAG to GTG transversion) substituting Valine for Glutamic acid at position 6 of the β-globin chain',
      'A frameshift deletion eliminating phenylalanine at position 508',
      'A nonsense mutation terminating the α-globin chain prematurely',
      'A chromosomal trisomy of chromosome 21 leading to defective heme synthesis'
    ],
    correct: 0,
    explain: 'Sickle cell is caused by a missense mutation in the β-globin gene (GAG to GTG), substituting hydrophilic Glutamic acid with hydrophobic Valine at residue 6.'
  },

  // ========================================
  // CHAPTER 5: Support & Movement (12 MCQs)
  // ========================================
  {
    id: 'tcat-bio-49',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Easy',
    q: 'How many total bones comprise the adult human skeletal system?',
    options: [
      '206 bones',
      '300 bones',
      '180 bones',
      '240 bones'
    ],
    correct: 0,
    explain: 'The adult human skeleton consists of exactly 206 bones (80 axial and 126 appendicular).'
  },
  {
    id: 'tcat-bio-50',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Easy',
    q: 'Which type of joint provides the greatest range of movement in multiple planes, such as at the shoulder and hip joints?',
    options: [
      'Ball-and-socket joint',
      'Hinge joint',
      'Pivot joint',
      'Suture joint'
    ],
    correct: 0,
    explain: 'Ball-and-socket joints (glenohumeral and acetabulofemoral) allow multiaxial movement: flexion, extension, abduction, adduction, rotation, and circumduction.'
  },
  {
    id: 'tcat-bio-51',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Easy',
    q: 'What tough fibrous connective tissue bands connect skeletal muscles to bones?',
    options: [
      'Tendons',
      'Ligaments',
      'Cartilage',
      'Fascia'
    ],
    correct: 0,
    explain: 'Tendons attach muscles to bones, while ligaments connect bones to other bones across joints.'
  },
  {
    id: 'tcat-bio-52',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Easy',
    q: 'What is the basic functional contractile unit of a skeletal muscle myofibril, bounded by two Z-discs?',
    options: [
      'Sarcomere',
      'Sarcoplasmic reticulum',
      'Sarcolemma',
      'Myosin head'
    ],
    correct: 0,
    explain: 'The sarcomere is the segment between two adjacent Z-lines and forms the repeating contractile unit of striated muscle.'
  },
  {
    id: 'tcat-bio-53',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Medium',
    q: 'According to the Sliding Filament Theory of muscle contraction, what happens to the sarcomere banding during active contraction?',
    options: [
      'The H-zone and I-band narrow/disappear while the A-band length remains constant',
      'The A-band shortens while the I-band length remains unchanged',
      'Both the A-band and actin filaments lengthen',
      'The Z-discs move farther apart as myosin filaments compress'
    ],
    correct: 0,
    explain: 'During contraction, actin filaments slide over myosin; the A-band (myosin length) stays constant while the I-band and H-zone shorten.'
  },
  {
    id: 'tcat-bio-54',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Medium',
    q: 'Which regulatory ion is released from the sarcoplasmic reticulum to trigger cross-bridge cycling in skeletal muscle fibers?',
    options: [
      'Calcium ions (Ca²⁺)',
      'Sodium ions (Na⁺)',
      'Potassium ions (K⁺)',
      'Magnesium ions (Mg²⁺)'
    ],
    correct: 0,
    explain: 'Action potentials traversing T-tubules cause terminal cisternae of the sarcoplasmic reticulum to release Ca²⁺ into the sarcoplasm.'
  },
  {
    id: 'tcat-bio-55',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Medium',
    q: 'What is the role of Troponin-C when calcium ions bind to it during muscle activation?',
    options: [
      'It induces a conformational change that shifts Tropomyosin away from the myosin-binding sites on actin',
      'It hydrolyzes ATP to ADP and inorganic phosphate on the myosin tail',
      'It directly polymerizes G-actin into F-actin microfilaments',
      'It pumps calcium back into the terminal cisternae'
    ],
    correct: 0,
    explain: 'Ca²⁺ binding to Troponin-C causes tropomyosin to move away from actin\'s myosin-binding sites, allowing myosin heads to form cross-bridges.'
  },
  {
    id: 'tcat-bio-56',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Medium',
    q: 'Which bone cell type is actively responsible for bone resorption and mineral matrix demineralization?',
    options: [
      'Osteoclasts',
      'Osteoblasts',
      'Osteocytes',
      'Chondrocytes'
    ],
    correct: 0,
    explain: 'Osteoclasts are multinucleated cells derived from monocyte lineage that secrete acids and enzymes to resorb bone matrix.'
  },
  {
    id: 'tcat-bio-57',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Hard',
    q: 'What causes the stiffening of muscles known as Rigor Mortis following death?',
    options: [
      'Complete depletion of cellular ATP prevents the detachment of myosin heads from actin filaments',
      'Excessive synthesis of lactic acid crystallizes the sarcoplasm',
      'Spontaneous hyperpolarization of the motor neuron axon terminals',
      'Uncontrolled degradation of troponin by lysosomal enzymes'
    ],
    correct: 0,
    explain: 'ATP binding is required to detach the myosin head from actin. After death, ATP depletion locks cross-bridges in place, causing rigor mortis.'
  },
  {
    id: 'tcat-bio-58',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Hard',
    q: 'In the microscopic architecture of compact bone, what structure occupies the central canal (Haversian canal) of each Osteon?',
    options: [
      'Blood vessels (arterioles and venules) and nerve fibers',
      'Red bone marrow synthesizing platelets',
      'Articular cartilage producing synovial fluid',
      'Dense bundles of elastin fibers'
    ],
    correct: 0,
    explain: 'Each Haversian canal contains blood vessels that nourish osteocytes in surrounding concentric lamellae, and associated nerve fibers.'
  },
  {
    id: 'tcat-bio-59',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Hard',
    q: 'What step during the cross-bridge cycle directly produces the "power stroke" that pulls actin toward the M-line?',
    options: [
      'The release of inorganic phosphate (Pi) and ADP from the energized myosin head',
      'The hydrolysis of ATP into ADP and Pi by myosin ATPase',
      'The binding of a brand-new ATP molecule to the myosin active site',
      'The influx of potassium ions through voltage-gated sarcolemma channels'
    ],
    correct: 0,
    explain: 'Release of Pi initiates the power stroke as the myosin head pivots ~45°; ADP release follows, pulling the actin filament toward the center of the sarcomere.'
  },
  {
    id: 'tcat-bio-60',
    subject: 'Biology',
    topic: 'Support & Movement',
    difficulty: 'Hard',
    q: 'How many pairs of ribs are classified as "True Ribs" (vertebrosternal ribs) because their costal cartilages attach directly to the sternum?',
    options: [
      'First 7 pairs (Ribs 1 to 7)',
      'First 5 pairs (Ribs 1 to 5)',
      'Pairs 8 to 10 (False ribs)',
      'Pairs 11 and 12 (Floating ribs)'
    ],
    correct: 0,
    explain: 'Ribs 1-7 attach directly to the sternum via individual costal cartilages and are termed true (vertebrosternal) ribs.'
  },

  // ===========================================
  // CHAPTER 6: Coordination & Control (12 MCQs)
  // ===========================================
  {
    id: 'tcat-bio-61',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Easy',
    q: 'What is the normal resting membrane potential of a typical mammalian neuron?',
    options: [
      '-70 mV',
      '+30 mV',
      '0 mV',
      '-90 mV'
    ],
    correct: 0,
    explain: 'The typical resting membrane potential of a resting neuron is approximately -70 millivolts, polarized negatively on the inside.'
  },
  {
    id: 'tcat-bio-62',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Easy',
    q: 'Which hormone is secreted by pancreatic β-cells in response to elevated blood glucose concentrations?',
    options: [
      'Insulin',
      'Glucagon',
      'Epinephrine',
      'Cortisol'
    ],
    correct: 0,
    explain: 'Beta cells of the islets of Langerhans secrete insulin, promoting glucose uptake into tissues and glycogenesis.'
  },
  {
    id: 'tcat-bio-63',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Easy',
    q: 'What fatty insulating layer wraps around neuronal axons in the peripheral nervous system to accelerate nerve impulse conduction?',
    options: [
      'Myelin sheath produced by Schwann cells',
      'Perineurium produced by astrocytes',
      'Endoneurium composed of collagen fibers',
      'Basement membrane rich in keratin'
    ],
    correct: 0,
    explain: 'Schwann cells wrap around PNS axons to form the myelin sheath, insulating the axon and enabling rapid saltatory conduction.'
  },
  {
    id: 'tcat-bio-64',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Easy',
    q: 'Which endocrine gland is historically called the "Master Gland" because its tropic hormones regulate other endocrine organs?',
    options: [
      'Pituitary gland (Hypophysis)',
      'Thyroid gland',
      'Adrenal cortex',
      'Thymus'
    ],
    correct: 0,
    explain: 'The anterior pituitary secretes trophic hormones (TSH, ACTH, FSH, LH) regulating target endocrine glands throughout the body.'
  },
  {
    id: 'tcat-bio-65',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Medium',
    q: 'What ion movement causes the rapid depolarization phase of a neuronal action potential once the threshold voltage (-55 mV) is reached?',
    options: [
      'Rapid influx of Na⁺ through voltage-gated sodium channels',
      'Efflux of K⁺ through voltage-gated potassium channels',
      'Influx of Cl⁻ through ligand-gated chloride channels',
      'Active export of Ca²⁺ via plasma membrane calcium pumps'
    ],
    correct: 0,
    explain: 'Depolarization above threshold opens voltage-gated Na+ channels; Na+ rushes inward down its electrical and chemical gradient, reversing membrane potential toward +30 mV.'
  },
  {
    id: 'tcat-bio-66',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Medium',
    q: 'What is the physiological role of the Nodes of Ranvier along a myelinated nerve axon?',
    options: [
      'They concentrate voltage-gated Na⁺ channels, allowing the action potential to jump rapidly from node to node (Saltatory Conduction)',
      'They synthesize acetylcholine neurotransmitters for vesicular storage',
      'They provide physical attachment anchors to surrounding muscle fascias',
      'They prevent potassium ions from exiting the axonal cytoplasm'
    ],
    correct: 0,
    explain: 'Nodes of Ranvier are unmyelinated gaps with high densities of Na+ channels, allowing action potentials to regenerate and "jump" via saltatory conduction.'
  },
  {
    id: 'tcat-bio-67',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Medium',
    q: 'Which neurotransmitter is released at the neuromuscular junction to stimulate skeletal muscle contraction?',
    options: [
      'Acetylcholine (ACh)',
      'Dopamine',
      'Gamma-aminobutyric acid (GABA)',
      'Serotonin'
    ],
    correct: 0,
    explain: 'Somatic motor neurons release acetylcholine (ACh) into the synaptic cleft, binding nicotinic receptors on the muscle motor end plate.'
  },
  {
    id: 'tcat-bio-68',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Medium',
    q: 'Which hormone is secreted by the adrenal medulla during the sympathetic "fight-or-flight" emergency response?',
    options: [
      'Epinephrine (Adrenaline)',
      'Aldosterone',
      'Thyroxine (T₄)',
      'Prolactin'
    ],
    correct: 0,
    explain: 'The adrenal medulla acts as a modified sympathetic ganglion, secreting epinephrine and norepinephrine to elevate heart rate, blood pressure, and blood glucose.'
  },
  {
    id: 'tcat-bio-69',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Hard',
    q: 'During the repolarization phase of an action potential, what channel state transitions restore the negative membrane interior?',
    options: [
      'Inactivation gates close voltage-gated Na⁺ channels, and voltage-gated K⁺ channels open allowing K⁺ efflux',
      'Sodium channels open wider while potassium channels close tightly',
      'Chloride ions are actively pumped out of the axon by ATPases',
      'Calcium channels open to neutralize internal negative charges'
    ],
    correct: 0,
    explain: 'At +30 mV, Na+ channel inactivation gates close, and delayed-rectifier K+ channels open, allowing K+ to exit and restore negative potential.'
  },
  {
    id: 'tcat-bio-70',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Hard',
    q: 'What triggers synaptic vesicles containing neurotransmitters to undergo exocytosis at the presynaptic terminal?',
    options: [
      'Influx of Ca²⁺ through voltage-gated calcium channels upon action potential arrival',
      'Efflux of sodium ions into the extracellular fluid',
      'Direct electrical spark discharge across the synaptic cleft',
      'Cleavage of vesicle membranes by postsynaptic receptors'
    ],
    correct: 0,
    explain: 'Terminal depolarization opens voltage-gated Ca²⁺ channels; Ca²⁺ binds synaptotagmin, triggering SNARE-mediated fusion and exocytosis of neurotransmitters.'
  },
  {
    id: 'tcat-bio-71',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Hard',
    q: 'What type of feedback mechanism regulates thyroid hormone (T₃ and T₄) secretion along the hypothalamic-pituitary-thyroid axis?',
    options: [
      'Negative feedback: elevated free T₃ and T₄ inhibit TRH secretion from the hypothalamus and TSH secretion from the anterior pituitary',
      'Positive feedback: elevated T₄ stimulates increased TRH production',
      'Feed-forward regulation governed exclusively by pancreatic glucagon',
      'Direct autonomic neural activation bypassing the pituitary entirely'
    ],
    correct: 0,
    explain: 'Circulating T3 and T4 exert negative feedback on the hypothalamus (reducing TRH) and anterior pituitary (reducing TSH) to maintain homeostasis.'
  },
  {
    id: 'tcat-bio-72',
    subject: 'Biology',
    topic: 'Coordination & Control',
    difficulty: 'Hard',
    q: 'What is the absolute refractory period of a neuron, and what molecular mechanism enforces it?',
    options: [
      'A period during which no stimulus can elicit a second action potential, enforced by inactivation of voltage-gated Na⁺ channels',
      'A period where sub-threshold stimuli produce double-amplitude spikes due to potassium accumulation',
      'A resting interval where the Na⁺/K⁺ pump is chemically inhibited by ATP',
      'A state where only inhibitory neurotransmitters can bind postsynaptic dendrites'
    ],
    correct: 0,
    explain: 'During the absolute refractory period, voltage-gated Na+ channels are in an inactivated state and cannot reopen until the membrane repolarizes.'
  },

  // ============================================
  // CHAPTER 7: Reproduction & Development (12 MCQs)
  // ============================================
  {
    id: 'tcat-bio-73',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Easy',
    q: 'Where does human fertilization of the ovum by a spermatozoon typically take place under normal physiological conditions?',
    options: [
      'Ampulla of the Fallopian tube (Oviduct)',
      'Uterine cavity',
      'Cervical canal',
      'Ovarian stroma'
    ],
    correct: 0,
    explain: 'Fertilization normally occurs in the ampulla (outer third) of the fallopian tube.'
  },
  {
    id: 'tcat-bio-74',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Easy',
    q: 'Which cells in the human testes secrete the primary androgen Testosterone under stimulation by Luteinizing Hormone (LH)?',
    options: [
      'Leydig cells (Interstitial cells)',
      'Sertoli cells (Sustentacular cells)',
      'Spermatogonia',
      'Primary spermatocytes'
    ],
    correct: 0,
    explain: 'Interstitial cells of Leydig, located in connective tissue between seminiferous tubules, produce testosterone in response to LH.'
  },
  {
    id: 'tcat-bio-75',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Easy',
    q: 'Which hormone surge triggers ovulation (release of the secondary oocyte from the Graafian follicle) around day 14 of the menstrual cycle?',
    options: [
      'Luteinizing Hormone (LH) surge',
      'Progesterone surge',
      'Prolactin surge',
      'Human Chorionic Gonadotropin (hCG) surge'
    ],
    correct: 0,
    explain: 'High estrogen levels trigger positive feedback on the pituitary, causing an LH surge that induces rupture of the mature follicle and ovulation.'
  },
  {
    id: 'tcat-bio-76',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Easy',
    q: 'What is the solid ball of 16 to 32 cells resulting from early cleavage divisions of the zygote called?',
    options: [
      'Morula',
      'Blastocyst',
      'Gastrula',
      'Neurula'
    ],
    correct: 0,
    explain: 'Cleavage divisions produce a solid mulberry-like ball of blastomeres known as the morula (around day 3-4 post-fertilization).'
  },
  {
    id: 'tcat-bio-77',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Medium',
    q: 'What is the primary endocrine function of the Corpus Luteum formed from the collapsed follicle after ovulation?',
    options: [
      'Secretion of high levels of Progesterone and Estrogen to maintain the secretory endometrium for implantation',
      'Production of large amounts of FSH to stimulate immediate new follicular growth',
      'Excretion of human placental lactogen into the maternal bloodstream',
      'Synthesis of oxytocin to trigger uterine contractions'
    ],
    correct: 0,
    explain: 'The corpus luteum secretes progesterone (and some estrogen), maintaining a vascularized, glandular endometrium required for embryo implantation.'
  },
  {
    id: 'tcat-bio-78',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Medium',
    q: 'What is the role of the Acrosome located at the anterior tip of the mammalian sperm head?',
    options: [
      'It contains hydrolytic enzymes (hyaluronidase and acrosin) that penetrate the corona radiata and zona pellucida of the oocyte',
      'It houses tightly packed mitochondria to generate ATP for flagellar propulsion',
      'It anchors the sperm nucleus directly to the maternal mitochondrial DNA',
      'It prevents polyspermy by polarizing the vaginal canal'
    ],
    correct: 0,
    explain: 'The acrosome is a modified lysosome containing enzymes that digest through the protective zona pellucida during the acrosome reaction.'
  },
  {
    id: 'tcat-bio-79',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Medium',
    q: 'Which embryonic germ layer gives rise to the nervous system (brain and spinal cord) and the epidermis of the skin?',
    options: [
      'Ectoderm',
      'Mesoderm',
      'Endoderm',
      'Trophoblast'
    ],
    correct: 0,
    explain: 'The ectoderm differentiates into the nervous system (via the neural tube and crest) and the epidermal layer of skin and its appendages.'
  },
  {
    id: 'tcat-bio-80',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Medium',
    q: 'Which hormone is detected by standard home pregnancy test kits to confirm early pregnancy?',
    options: [
      'Human Chorionic Gonadotropin (hCG)',
      'Human Placental Lactogen (hPL)',
      'Luteinizing Hormone (LH)',
      'Estriol'
    ],
    correct: 0,
    explain: 'The syncytiotrophoblast of the implanted blastocyst secretes hCG, which maintains the corpus luteum and is excreted in maternal urine.'
  },
  {
    id: 'tcat-bio-81',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Hard',
    q: 'What cellular mechanism acts as the "slow block to polyspermy" in human fertilization?',
    options: [
      'The cortical reaction: exocytosis of cortical granules releases enzymes that harden the zona pellucida and destroy sperm receptors',
      'A rapid influx of sodium ions that depolarizes the egg plasma membrane for 60 seconds',
      'Immediate expulsion of the sperm tail through the perivitelline space',
      'Degradation of all male chromosomes by egg cytoplasmic nucleases'
    ],
    correct: 0,
    explain: 'The cortical reaction (slow block) releases enzymes from cortical granules, altering the zona pellucida (zona hardening) so no further sperm can bind or penetrate.'
  },
  {
    id: 'tcat-bio-82',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Hard',
    q: 'At what stage of meiosis is a human female primary oocyte arrested from fetal development until puberty?',
    options: [
      'Prophase I (specifically Diplotene stage)',
      'Metaphase II',
      'Anaphase I',
      'Telophase II'
    ],
    correct: 0,
    explain: 'Primary oocytes begin meiosis during fetal life and arrest at Prophase I (diplotene stage); they resume meiosis after puberty under LH influence.'
  },
  {
    id: 'tcat-bio-83',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Hard',
    q: 'Which adult tissues and organs originate from the embryonic Mesoderm germ layer?',
    options: [
      'Skeletal muscles, cardiovascular system, bones, and kidneys',
      'Epithelial lining of the digestive tract and respiratory system',
      'Central nervous system and retinal photoreceptors',
      'Thyroid, parathyroid glands, and liver hepatocytes'
    ],
    correct: 0,
    explain: 'Mesoderm forms connective tissues, bone, cartilage, skeletal/smooth/cardiac muscle, blood vessels, kidneys, and gonads.'
  },
  {
    id: 'tcat-bio-84',
    subject: 'Biology',
    topic: 'Reproduction & Development',
    difficulty: 'Hard',
    q: 'What is the physiological role of Sertoli cells in the seminiferous epithelium of the testes?',
    options: [
      'They form the blood-testis barrier, provide nourishment to developing spermatids, and secrete androgen-binding protein (ABP) and inhibin',
      'They synthesize testosterone directly under the influence of adrenocorticotropic hormone',
      'They undergo meiotic reduction divisions to produce mature flagellated spermatozoa',
      'They produce alkaline seminal fluid to neutralize vaginal acidity'
    ],
    correct: 0,
    explain: 'Sertoli cells support, nourish, and regulate spermatogenesis, form tight junctions creating the blood-testis barrier, and secrete ABP and inhibin.'
  },

  // ========================================
  // CHAPTER 8: Evolution & Ecology (12 MCQs)
  // ========================================
  {
    id: 'tcat-bio-85',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Easy',
    q: 'What is the primary mechanism of adaptive evolutionary change proposed by Charles Darwin in 1859?',
    options: [
      'Natural Selection',
      'Inheritance of Acquired Characteristics',
      'Directed Genetic Mutation',
      'Catastrophism'
    ],
    correct: 0,
    explain: 'Darwin proposed that differential reproductive success of individuals with heritable traits suited to their environment drives adaptation (Natural Selection).'
  },
  {
    id: 'tcat-bio-86',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Easy',
    q: 'Which trophic level forms the fundamental nutritional base of all terrestrial ecosystems?',
    options: [
      'Primary Producers (Autotrophs / Green plants)',
      'Primary Consumers (Herbivores)',
      'Secondary Consumers (Carnivores)',
      'Decomposers (Saprotrophs)'
    ],
    correct: 0,
    explain: 'Primary producers (photoautotrophs) fix solar energy into biochemical bonds, forming the base of ecological food chains.'
  },
  {
    id: 'tcat-bio-87',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Easy',
    q: 'What anatomical term describes structures with common evolutionary ancestry but divergent modern functions (e.g., human arm, bat wing, and whale flipper)?',
    options: [
      'Homologous structures',
      'Analogous structures',
      'Vestigial structures',
      'Convergent structures'
    ],
    correct: 0,
    explain: 'Homologous organs share common developmental and evolutionary origins (divergent evolution), even if their functions differ.'
  },
  {
    id: 'tcat-bio-88',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Easy',
    q: 'What biological process initiates "Primary Succession"?',
    options: [
      'Colonization of an entirely newly formed or bare substrate lacking previous soil (e.g., cooled lava or exposed rock)',
      'Regrowth of vegetation following a forest wildfire in existing fertile soil',
      'Plowing of an agricultural field followed by weed infestation',
      'Flooding of a wetland during seasonal monsoons'
    ],
    correct: 0,
    explain: 'Primary succession begins on previously uninhabited, lifeless rock or sand where no soil exists (pioneer species like lichens build soil).'
  },
  {
    id: 'tcat-bio-89',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Medium',
    q: 'According to Lindeman\'s Ten Percent Law in ecology, what happens to energy as it transfers from one trophic level to the next higher level?',
    options: [
      'Only approximately 10% of the energy is transferred and stored as biomass; ~90% is lost as metabolic heat and respiration',
      'Energy increases by 10% due to predatory concentration',
      'Energy transfers with 100% efficiency in stable climax communities',
      'Exactly 50% is converted into thermal radiation and 50% into biomass'
    ],
    correct: 0,
    explain: 'On average, only ~10% of energy is transferred up each trophic level; the rest is dissipated through respiration, heat, and non-consumed parts.'
  },
  {
    id: 'tcat-bio-90',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Medium',
    q: 'Which ecological pyramid is ALWAYS upright and cannot be inverted in any natural self-sustaining ecosystem?',
    options: [
      'Pyramid of Energy',
      'Pyramid of Biomass',
      'Pyramid of Numbers',
      'Pyramid of Diversity'
    ],
    correct: 0,
    explain: 'The Pyramid of Energy must obey the Second Law of Thermodynamics; energy decreases with each successive trophic level, so it is always upright.'
  },
  {
    id: 'tcat-bio-91',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Medium',
    q: 'What are Analogous structures, and what evolutionary phenomenon produces them?',
    options: [
      'Structures with similar functions but distinct ancestral origins, produced by Convergent Evolution',
      'Structures with identical embryonic origins, produced by Divergent Evolution',
      'Non-functional residual organs inherited from ancestors',
      'Duplicated chromosomes produced by Polyploidy'
    ],
    correct: 0,
    explain: 'Analogous structures (e.g., bird wing and butterfly wing) evolve independently to serve similar functions in response to similar environmental pressures (convergent evolution).'
  },
  {
    id: 'tcat-bio-92',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Medium',
    q: 'Which bacterial species plays a crucial role in converting atmospheric nitrogen (N₂) into bioavailable ammonia (NH₃) through symbiotic root nodule association in legumes?',
    options: [
      'Rhizobium',
      'Nitrosomonas',
      'Nitrobacter',
      'Pseudomonas denitrificans'
    ],
    correct: 0,
    explain: 'Rhizobium bacteria live symbiotically in root nodules of leguminous plants, using nitrogenase to fix atmospheric N2 into ammonia.'
  },
  {
    id: 'tcat-bio-93',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Hard',
    q: 'In a population in Hardy-Weinberg equilibrium, if the frequency of a recessive allele (q) is 0.3, what percentage of the population is expected to be heterozygous carriers (2pq)?',
    options: [
      '42% (0.42)',
      '49% (0.49)',
      '9% (0.09)',
      '21% (0.21)'
    ],
    correct: 0,
    explain: 'p + q = 1 → p = 1 - 0.3 = 0.7. The heterozygous carrier frequency is 2pq = 2 × 0.7 × 0.3 = 0.42 = 42%.'
  },
  {
    id: 'tcat-bio-94',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Hard',
    q: 'What five conditions are mandatory for a biological population to remain in strict Hardy-Weinberg genetic equilibrium?',
    options: [
      'No natural selection, no mutation, no gene flow (migration), extremely large population size (no genetic drift), and random mating',
      'Continuous directional selection, high mutation rate, small population, assortative mating, and active migration',
      'Complete dominance, equal sex ratios, diploidy, self-fertilization, and seasonal hibernation',
      'Zero genetic variance, polyploidy, geographic isolation, and clonal asexual reproduction'
    ],
    correct: 0,
    explain: 'Hardy-Weinberg equilibrium requires: 1) no mutations, 2) random mating, 3) no natural selection, 4) infinitely large population, 5) no gene flow.'
  },
  {
    id: 'tcat-bio-95',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Hard',
    q: 'What is the difference between Allopatric Speciation and Sympatric Speciation?',
    options: [
      'Allopatric speciation requires physical geographic isolation preventing gene flow; Sympatric speciation occurs within the same geographic area without physical barriers',
      'Allopatric speciation occurs instantly via polyploidy; Sympatric speciation takes millions of years',
      'Allopatric speciation affects only plant species; Sympatric speciation affects animals',
      'Allopatric speciation involves convergent evolution; Sympatric speciation involves vestigial structures'
    ],
    correct: 0,
    explain: 'Allopatric speciation happens when a population is split by a geographic barrier; sympatric speciation occurs in overlapping ranges (e.g. through polyploidy or niche differentiation).'
  },
  {
    id: 'tcat-bio-96',
    subject: 'Biology',
    topic: 'Evolution & Ecology',
    difficulty: 'Hard',
    q: 'In the nitrogen cycle, which group of chemosynthetic autotrophic bacteria converts toxic Nitrites (NO₂⁻) into plant-absorbable Nitrates (NO₃⁻)?',
    options: [
      'Nitrobacter',
      'Nitrosomonas',
      'Azotobacter',
      'Clostridium'
    ],
    correct: 0,
    explain: 'Nitrification has two steps: Nitrosomonas oxidizes ammonia (NH3) to nitrite (NO2-), and Nitrobacter oxidizes nitrite (NO2-) to nitrate (NO3-).'
  }
];
