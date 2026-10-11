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
  },
  {
    id: "tcat-bio-97",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "In eukaryotic cells, which organelle contains hydrolytic enzymes active at acidic pH to degrade cellular waste and engulfed pathogens?",
    options: [
          "Lysosome",
          "Ribosome",
          "Peroxisome",
          "Endoplasmic Reticulum"
    ],
    correct: 0,
    explain: "Lysosomes are membrane-bound organelles containing acid hydrolases (pH ~4.5–5.0) for intracellular digestion and autolysis."
  },
  {
    id: "tcat-bio-98",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "What is the net yield of ATP molecules generated per single molecule of glucose during anaerobic glycolysis?",
    options: [
          "2 ATP",
          "4 ATP",
          "36 ATP",
          "38 ATP"
    ],
    correct: 0,
    explain: "Glycolysis consumes 2 ATP in the preparatory phase and generates 4 ATP in the payoff phase, yielding a net gain of 2 ATP."
  },
  {
    id: "tcat-bio-99",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "Which photosynthetic pigment serves as the primary electron donor in the reaction center of Photosystem II (PS II)?",
    options: [
          "Chlorophyll a (P680)",
          "Chlorophyll b",
          "Carotenoid (P700)",
          "Phycocyanin"
    ],
    correct: 0,
    explain: "The reaction center of Photosystem II is P680, a specialized chlorophyll a pair absorbing light maximally at 680 nm."
  },
  {
    id: "tcat-bio-100",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "In the plasma membrane's fluid mosaic model, what is the role of cholesterol at elevated physiological temperatures?",
    options: [
          "It prevents membrane lipids from freezing into a solid gel",
          "It restrains excessive phospholipid movement, stabilizing membrane fluidity",
          "It pumps potassium ions across the bilayer against concentration gradients",
          "It acts as the primary receptor for peptide hormones"
    ],
    correct: 1,
    explain: "Cholesterol acts as a fluidity buffer: at warm temperatures, it restrains phospholipid displacement to reduce fluidity; at low temperatures, it prevents close packing."
  },
  {
    id: "tcat-bio-101",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "During the light reactions of photosynthesis, what is the source of electrons and oxygen gas released via photolysis?",
    options: [
          "Carbon dioxide (CO2)",
          "Water (H2O)",
          "Glucose (C6H12O6)",
          "NADPH"
    ],
    correct: 1,
    explain: "Photolysis occurs at the oxygen-evolving complex of PS II, where water is oxidized: 2H2O -> 4H+ + 4e- + O2."
  },
  {
    id: "tcat-bio-102",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "In the mitochondrial electron transport chain, which enzyme complex synthesizes ATP using the proton-motive force across the inner membrane?",
    options: [
          "Complex I (NADH Dehydrogenase)",
          "Complex III (Cytochrome bc1)",
          "Complex IV (Cytochrome c Oxidase)",
          "ATP Synthase (F0F1 Complex)"
    ],
    correct: 3,
    explain: "ATP Synthase (Complex V) harnesses the electrochemical proton gradient across the inner mitochondrial membrane to drive the phosphorylation of ADP to ATP."
  },
  {
    id: "tcat-bio-103",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "What is the primary four-carbon compound that accepts Acetyl-CoA (2C) to initiate the citric acid (Krebs) cycle?",
    options: [
          "Citrate",
          "Oxaloacetate",
          "Alpha-Ketoglutarate",
          "Malate"
    ],
    correct: 1,
    explain: "Oxaloacetate (4C) condenses with Acetyl-CoA (2C) catalyzed by citrate synthase to form Citrate (6C)."
  },
  {
    id: "tcat-bio-104",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "How many molecules of ATP and NADPH are consumed in the Calvin cycle to fix 3 molecules of CO2 to yield one net molecule of Glyceraldehyde-3-Phosphate (G3P)?",
    options: [
          "6 ATP and 6 NADPH",
          "9 ATP and 6 NADPH",
          "12 ATP and 12 NADPH",
          "18 ATP and 12 NADPH"
    ],
    correct: 1,
    explain: "Fixing 3 CO2 into 1 net G3P requires 6 ATP and 6 NADPH in the reduction phase plus 3 ATP in the regeneration of RuBP, totaling 9 ATP and 6 NADPH."
  },
  {
    id: "tcat-bio-105",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "What structural evidence strongly supports Lynn Margulis's endosymbiotic theory for the evolutionary origin of mitochondria and chloroplasts?",
    options: [
          "They possess 80S ribosomes identical to the host cytoplasm",
          "They possess circular double-stranded DNA and 70S prokaryotic-like ribosomes",
          "Their outer membranes contain peptidoglycan cell walls",
          "They reproduce via eukaryotic mitosis with spindle fibers"
    ],
    correct: 1,
    explain: "Mitochondria and chloroplasts contain circular DNA without histones and 70S ribosomes, mirroring aerobic bacteria and cyanobacteria."
  },
  {
    id: "tcat-bio-106",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "The sodium-potassium pump (Na+/K+ ATPase) is electrogenic because in each operational cycle it pumps:",
    options: [
          "3 Na+ ions into the cell and 2 K+ ions out of the cell",
          "3 Na+ ions out of the cell and 2 K+ ions into the cell",
          "2 Na+ ions out of the cell and 3 K+ ions into the cell",
          "1 Na+ ion out and 1 K+ ion in symmetrically"
    ],
    correct: 1,
    explain: "The pump exports 3 Na+ ions for every 2 K+ ions imported, expelling a net positive charge and maintaining the negative resting membrane potential."
  },
  {
    id: "tcat-bio-107",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "Which chemical linkage connects adjacent amino acids in a polypeptide chain?",
    options: [
          "Glycosidic bond",
          "Peptide bond (amide linkage)",
          "Ester linkage",
          "Phosphodiester bond"
    ],
    correct: 1,
    explain: "Amino acids are joined by peptide bonds formed through dehydration condensation between the carboxyl group of one and the amino group of another."
  },
  {
    id: "tcat-bio-108",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "Which nitrogenous base is present in RNA nucleotides but absent from DNA?",
    options: [
          "Thymine",
          "Uracil",
          "Adenine",
          "Cytosine"
    ],
    correct: 1,
    explain: "RNA incorporates Uracil (U) as the pyrimidine base that pairs with Adenine, whereas DNA uses Thymine (T)."
  },
  {
    id: "tcat-bio-109",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "Which carbohydrate serves as the primary glucose storage polysaccharide in the liver and skeletal muscles of animals?",
    options: [
          "Cellulose",
          "Starch",
          "Glycogen",
          "Chitin"
    ],
    correct: 2,
    explain: "Glycogen is a highly branched alpha-glucan that serves as the major energy storage polysaccharide in animal tissues."
  },
  {
    id: "tcat-bio-110",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "A triglyceride molecule is formed by condensation of one glycerol molecule with how many fatty acid chains?",
    options: [
          "1",
          "2",
          "3",
          "4"
    ],
    correct: 2,
    explain: "Triglycerides consist of a glycerol backbone esterified to three fatty acid molecules via ester bonds."
  },
  {
    id: "tcat-bio-111",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "What types of bonds stabilize the secondary structure of proteins (such as alpha-helices and beta-pleated sheets)?",
    options: [
          "Disulfide bridges between cysteine residues",
          "Hydrogen bonds between backbone carbonyl oxygens (C=O) and amide hydrogens (N-H)",
          "Hydrophobic interactions between nonpolar R-groups",
          "Ionic bonds between basic and acidic side chains"
    ],
    correct: 1,
    explain: "Secondary protein structures are maintained by regular repeating hydrogen bonds between peptide backbone C=O and N-H groups."
  },
  {
    id: "tcat-bio-112",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "How does a competitive enzyme inhibitor affect the Michaelis constant (Km) and maximum reaction velocity (Vmax)?",
    options: [
          "Increases Km while Vmax remains unchanged",
          "Decreases Km while Vmax decreases",
          "Km remains unchanged while Vmax decreases",
          "Both Km and Vmax decrease proportionally"
    ],
    correct: 0,
    explain: "Competitive inhibitors compete for the active site; adding excess substrate overcomes inhibition (Vmax unchanged), but apparent affinity decreases (Km increases)."
  },
  {
    id: "tcat-bio-113",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "Why can humans digest starch (amylose and amylopectin) but cannot digest plant cellulose?",
    options: [
          "Cellulose contains toxic nitrogenous subunits",
          "Human digestive enzymes (amylase) hydrolyze alpha-1,4-glycosidic bonds but lack cellulase to hydrolyze beta-1,4-glycosidic bonds",
          "Cellulose is insoluble in water and cannot be swallowed",
          "Starch is composed of fructose while cellulose is composed of galactose"
    ],
    correct: 1,
    explain: "Humans produce alpha-amylase to cleave alpha-1,4 bonds, but lack beta-glucosidase/cellulase to cleave the beta-1,4 linkages of cellulose."
  },
  {
    id: "tcat-bio-114",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "What is the disaccharide composition of maltose produced during starch digestion?",
    options: [
          "Glucose + Fructose",
          "Glucose + Galactose",
          "Glucose + Glucose (alpha-1,4 linkage)",
          "Galactose + Fructose"
    ],
    correct: 2,
    explain: "Maltose is a reducing disaccharide consisting of two D-glucose units linked by an alpha-1,4-glycosidic bond."
  },
  {
    id: "tcat-bio-115",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "How does a non-competitive (allosteric) enzyme inhibitor alter the kinetic parameters of an enzymatic reaction?",
    options: [
          "Km increases and Vmax increases",
          "Vmax is reduced while Km remains unchanged",
          "Vmax remains unchanged while Km decreases",
          "Both Vmax and Km increase"
    ],
    correct: 1,
    explain: "Non-competitive inhibitors bind to an allosteric site regardless of whether substrate is bound, lowering the functional enzyme pool (Vmax decreases) without altering substrate binding affinity (Km unchanged)."
  },
  {
    id: "tcat-bio-116",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "In the DNA double helix, how many hydrogen bonds form between a Guanine (G) and Cytosine (C) complementary base pair compared to an Adenine (A) and Thymine (T) pair?",
    options: [
          "G-C has 3 hydrogen bonds; A-T has 2 hydrogen bonds",
          "G-C has 2 hydrogen bonds; A-T has 3 hydrogen bonds",
          "Both pairs have exactly 2 hydrogen bonds",
          "Both pairs have exactly 3 hydrogen bonds"
    ],
    correct: 0,
    explain: "Watson-Crick base pairing establishes 3 hydrogen bonds between Guanine and Cytosine, and 2 hydrogen bonds between Adenine and Thymine."
  },
  {
    id: "tcat-bio-117",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "What is the structural basis for the amphipathic nature of a phospholipid molecule in biological membranes?",
    options: [
          "A polar hydrophilic phosphate head and two nonpolar hydrophobic fatty acid hydrocarbon tails",
          "A nonpolar glycerol core attached to three polar steroid rings",
          "An entirely hydrophilic polypeptide backbone",
          "A hydrophobic nucleic acid base attached to a hydrophilic ribose"
    ],
    correct: 0,
    explain: "Phospholipids are amphipathic because they contain a charged/polar phosphate head (hydrophilic) linked to two nonpolar fatty acid chains (hydrophobic)."
  },
  {
    id: "tcat-bio-118",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "Which intrinsic pacemaker of the human heart initiates electrical impulses to establish the basal heart rate?",
    options: [
          "Atrioventricular (AV) Node",
          "Sinoatrial (SA) Node",
          "Bundle of His",
          "Purkinje Fibers"
    ],
    correct: 1,
    explain: "The Sinoatrial (SA) Node in the right atrium initiates spontaneous electrical action potentials that regulate rhythmic cardiac contraction."
  },
  {
    id: "tcat-bio-119",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "Which digestive secretion produced by the liver and stored in the gallbladder contains bile salts that emulsify dietary fats?",
    options: [
          "Gastric juice",
          "Pancreatic amylase",
          "Bile",
          "Intestinal succus entericus"
    ],
    correct: 2,
    explain: "Bile is synthesized by hepatocytes in the liver and concentrated in the gallbladder, containing bile salts that break large lipid droplets into micro-droplets."
  },
  {
    id: "tcat-bio-120",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "What is the basic functional and microscopic filtration unit of the human kidney?",
    options: [
          "Nephron",
          "Alveolus",
          "Hepatocyte",
          "Neuron"
    ],
    correct: 0,
    explain: "Each human kidney contains approximately one million nephrons responsible for ultrafiltration, selective reabsorption, and secretion."
  },
  {
    id: "tcat-bio-121",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "Which endocrine hormone secreted by the beta cells of the islets of Langerhans lowers blood glucose concentration?",
    options: [
          "Glucagon",
          "Insulin",
          "Epinephrine",
          "Cortisol"
    ],
    correct: 1,
    explain: "Insulin stimulates cellular uptake of glucose and promotes glycogen synthesis in liver and muscle cells, reducing blood glucose."
  },
  {
    id: "tcat-bio-122",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "What causes the first heart sound (\"lub\") during the cardiac cycle?",
    options: [
          "Closure of the aortic and pulmonary semilunar valves at ventricular diastole",
          "Closure of the atrioventricular (tricuspid and bicuspid/mitral) valves at the onset of ventricular systole",
          "Rapid inflow of blood into the relaxed atria",
          "Contraction of the papillary muscles"
    ],
    correct: 1,
    explain: "The first heart sound (S1, \"lub\") is caused by the sudden closure and tension of the AV valves (mitral and tricuspid) as ventricular pressure exceeds atrial pressure."
  },
  {
    id: "tcat-bio-123",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "What physiological mechanism describes the \"Bohr Effect\" on the hemoglobin-oxygen dissociation curve?",
    options: [
          "Increased oxygen binding affinity at low blood pH",
          "Decreased oxygen affinity and rightward shift of the dissociation curve caused by elevated CO2, higher H+ (lower pH), and temperature in metabolizing tissues",
          "The competitive binding of carbon monoxide to the heme iron",
          "The failure of fetal hemoglobin to release oxygen in the placenta"
    ],
    correct: 1,
    explain: "The Bohr Effect describes how elevated pCO2 and lower pH in active tissues decrease hemoglobin's affinity for O2, promoting oxygen unloading."
  },
  {
    id: "tcat-bio-124",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "Which ion is primarily responsible for the rapid depolarization phase of an axonal neuronal action potential?",
    options: [
          "Efflux of potassium ions (K+)",
          "Rapid influx of sodium ions (Na+) through voltage-gated channels",
          "Influx of chloride ions (Cl-)",
          "Active transport of calcium ions (Ca2+) out of the axon"
    ],
    correct: 1,
    explain: "Upon reaching threshold potential (~ -55 mV), voltage-gated Na+ channels open rapidly, allowing Na+ influx down its electrochemical gradient."
  },
  {
    id: "tcat-bio-125",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "What is the role of the countercurrent multiplier system established by the Loop of Henle in mammalian kidneys?",
    options: [
          "To generate a hyperosmotic medullary interstitial gradient that enables water reabsorption from the collecting duct",
          "To actively secrete red blood cells into urine",
          "To filter large plasma proteins across the glomerulus",
          "To convert urea into ammonia in the cortex"
    ],
    correct: 0,
    explain: "The countercurrent multiplier in the Loop of Henle creates an increasing osmotic gradient in the renal medulla (up to 1200 mOsm/L), allowing ADH-mediated water reabsorption."
  },
  {
    id: "tcat-bio-126",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "During synaptic transmission at a chemical neuromuscular junction, what event triggers the exocytosis of acetylcholine vesicles into the synaptic cleft?",
    options: [
          "Efflux of K+ from the postsynaptic muscle fiber",
          "Influx of Ca2+ ions through voltage-gated calcium channels in the presynaptic terminal upon action potential arrival",
          "Hydrolysis of ATP inside the synaptic cleft by acetylcholinesterase",
          "Hyperpolarization of the presynaptic axonal membrane"
    ],
    correct: 1,
    explain: "The arrival of an action potential depolarizes the axon terminal, opening voltage-gated Ca2+ channels; Ca2+ influx causes vesicle fusion and neurotransmitter release."
  },
  {
    id: "tcat-bio-127",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "In the human respiratory system, what is \"Vital Capacity\" defined as?",
    options: [
          "The volume of air inhaled or exhaled during quiet normal breathing (Tidal Volume)",
          "The maximum volume of air that can be exhaled following a maximum inhalation (VC = TV + IRV + ERV)",
          "The volume of air remaining in the lungs after a forced maximal expiration (Residual Volume)",
          "The total physiological volume of the alveolar dead space"
    ],
    correct: 1,
    explain: "Vital Capacity is the maximal volume exhaled after maximal inhalation, equal to Tidal Volume (TV) + Inspiratory Reserve Volume (IRV) + Expiratory Reserve Volume (ERV)."
  },
  {
    id: "tcat-bio-128",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "What is the physiological role of the enzyme enterokinase (enteropeptidase) secreted by the duodenal brush border mucosa?",
    options: [
          "Directly digesting dietary starch into disaccharides",
          "Activating pancreatic trypsinogen into active trypsin, which then activates other pancreatic zymogens",
          "Converting pepsinogen into active pepsin in the stomach",
          "Hydrolyzing triglycerides into monoacylglycerols"
    ],
    correct: 1,
    explain: "Enteropeptidase cleaves trypsinogen into active trypsin; trypsin then acts autocatalytically to activate chymotrypsinogen, procarboxypeptidase, and more trypsinogen."
  },
  {
    id: "tcat-bio-129",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "In a classical Mendelian monohybrid cross between two heterozygous individuals (Aa × Aa), what is the expected phenotypic ratio for a complete dominance trait?",
    options: [
          "3 : 1",
          "1 : 2 : 1",
          "9 : 3 : 3 : 1",
          "1 : 1"
    ],
    correct: 0,
    explain: "Aa × Aa yields genotypes 1 AA : 2 Aa : 1 aa. Because AA and Aa exhibit the dominant phenotype, the phenotypic ratio is 3 dominant : 1 recessive."
  },
  {
    id: "tcat-bio-130",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "Which biological tool is commonly referred to as \"molecular scissors\" used to cleave DNA at specific palindromic recognition sequences?",
    options: [
          "DNA Ligase",
          "Restriction Endonuclease",
          "RNA Polymerase",
          "Reverse Transcriptase"
    ],
    correct: 1,
    explain: "Restriction endonucleases recognize specific palindromic sequences (e.g., EcoRI at GAATTC) and cleave phosphodiester bonds."
  },
  {
    id: "tcat-bio-131",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "What is the universal start codon in mRNA translation that encodes the amino acid methionine?",
    options: [
          "UAA",
          "UAG",
          "UGA",
          "AUG"
    ],
    correct: 3,
    explain: "AUG is the standard initiation codon in both prokaryotic and eukaryotic translation, coding for methionine (or formylmethionine)."
  },
  {
    id: "tcat-bio-132",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "Why are X-linked recessive disorders (such as hemophilia A and red-green color blindness) expressed significantly more frequently in human males than females?",
    options: [
          "Males produce higher levels of testosterone that activate the mutant gene",
          "Males are hemizygous (XY) and have only one X chromosome, so a single recessive allele results in phenotypic expression",
          "Females inactivate both of their X chromosomes in all somatic tissues",
          "The Y chromosome contains dominant suppressors of the healthy allele"
    ],
    correct: 1,
    explain: "Males possess only one X chromosome (XY). A single recessive mutant allele on the X chromosome is expressed phenotypically because there is no second allele to mask it."
  },
  {
    id: "tcat-bio-133",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "During DNA replication, which enzyme joins the Okazaki fragments on the lagging strand by catalyzing phosphodiester bond formation?",
    options: [
          "DNA Helicase",
          "DNA Polymerase I",
          "DNA Ligase",
          "Topoisomerase (Gyrase)"
    ],
    correct: 2,
    explain: "DNA Ligase seals the nicks between Okazaki fragments on the lagging strand by forming covalent phosphodiester bonds."
  },
  {
    id: "tcat-bio-134",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "In the ABO human blood group system, the inheritance of alleles IA and IB in an AB individual represents which genetic phenomenon?",
    options: [
          "Incomplete Dominance",
          "Codominance",
          "Polygenic Inheritance",
          "Epistasis"
    ],
    correct: 1,
    explain: "In an AB individual, both IA and IB alleles are fully and simultaneously expressed on erythrocyte membranes, exemplifying codominance."
  },
  {
    id: "tcat-bio-135",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "What is the correct temperature and purpose of the three sequential steps in a standard Polymerase Chain Reaction (PCR) cycle?",
    options: [
          "Denaturation (~95°C), Primer Annealing (~55°C), Primer Extension (~72°C)",
          "Annealing (~95°C), Extension (~55°C), Denaturation (~72°C)",
          "Extension (~95°C), Denaturation (~55°C), Annealing (~72°C)",
          "Ligation (~95°C), Cleavage (~55°C), Transcription (~72°C)"
    ],
    correct: 0,
    explain: "PCR steps: 1) Denaturation at ~94-96°C to separate strands, 2) Annealing at ~50-65°C for primers to bind, 3) Extension at ~72°C for Taq polymerase."
  },
  {
    id: "tcat-bio-136",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "In agarose gel electrophoresis of DNA fragments, which physical property governs the migration rate and direction of DNA molecules?",
    options: [
          "DNA is positively charged and migrates toward the cathode at rates proportional to molecular mass",
          "DNA is negatively charged due to its phosphate backbone and migrates toward the positive anode, with smaller fragments traveling faster through the porous matrix",
          "DNA migration depends exclusively on GC content regardless of base pair length",
          "DNA fragments remain stationary until stained with ethidium bromide"
    ],
    correct: 1,
    explain: "The phosphate backbone imparts a uniform negative charge; fragments migrate toward the positive electrode (anode), with smaller fragments experiencing less frictional resistance."
  },
  {
    id: "tcat-bio-137",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "Why is the genetic code described as \"degenerate\" (redundant)?",
    options: [
          "A single codon can specify several different amino acids depending on tissue type",
          "Most amino acids are specified by more than one triplet codon (61 sense codons for 20 amino acids)",
          "Codons overlap with each other along the mRNA transcript",
          "The code changes during viral evolution"
    ],
    correct: 1,
    explain: "The genetic code is degenerate because multiple distinct codons can encode the same amino acid (e.g., Leucine is encoded by 6 different codons)."
  },
  {
    id: "tcat-bio-138",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "What is the function of the enzyme Reverse Transcriptase in retroviral replication and cDNA library synthesis?",
    options: [
          "Synthesizing single-stranded RNA from a DNA template",
          "Synthesizing complementary DNA (cDNA) from a single-stranded RNA template",
          "Degrading double-stranded viral DNA in the host cytoplasm",
          "Translating ribosomal RNA into retroviral capsid proteins"
    ],
    correct: 1,
    explain: "Reverse transcriptase is an RNA-dependent DNA polymerase that synthesizes complementary DNA (cDNA) using an RNA template."
  },
  {
    id: "tcat-bio-139",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "Which structural component of the human skeleton includes the skull, vertebral column, ribs, and sternum?",
    options: [
          "Appendicular Skeleton",
          "Axial Skeleton",
          "Pectoral Girdle",
          "Pelvic Girdle"
    ],
    correct: 1,
    explain: "The axial skeleton forms the central longitudinal axis of the human body, comprising 80 bones: skull, vertebral column, ribs, and sternum."
  },
  {
    id: "tcat-bio-140",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "What type of synovial joint allows multiaxial movement in all planes, exemplified by the shoulder and hip joints?",
    options: [
          "Hinge Joint",
          "Pivot Joint",
          "Ball-and-Socket Joint",
          "Suture Joint"
    ],
    correct: 2,
    explain: "Ball-and-socket joints (glenohumeral and acetabulofemoral joints) provide the widest range of motion in three rotational dimensions."
  },
  {
    id: "tcat-bio-141",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "What is the basic functional, contractile unit of a striated skeletal muscle myofibril bounded by two adjacent Z-lines?",
    options: [
          "Sarcomere",
          "Sarcolemma",
          "Sarcoplasmic Reticulum",
          "Fascicle"
    ],
    correct: 0,
    explain: "A sarcomere is the segment of a myofibril between two consecutive Z-discs, containing organized thick (myosin) and thin (actin) filaments."
  },
  {
    id: "tcat-bio-142",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "According to the Sliding Filament Model of muscle contraction, what happens to the sarcomere bands during contraction?",
    options: [
          "The A-band shortens, while the I-band remains constant in width",
          "The I-band and H-zone shorten while the A-band width remains unchanged",
          "Both actin and myosin filaments physically shrink in individual length",
          "The distance between Z-lines increases"
    ],
    correct: 1,
    explain: "During contraction, actin filaments slide over myosin toward the M-line: the I-band and H-zone narrow or disappear, but the A-band (myosin length) remains unchanged."
  },
  {
    id: "tcat-bio-143",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "What is the specific biochemical role of Calcium ions (Ca2+) released from the sarcoplasmic reticulum during excitation-contraction coupling?",
    options: [
          "Binding to myosin heads to phosphorylate them into ATP",
          "Binding to troponin, causing a conformational change that pulls tropomyosin away from actin's myosin-binding sites",
          "Directly cleaving the Z-disc to allow muscle elongation",
          "Inhibiting the sodium-potassium ATPase pump"
    ],
    correct: 1,
    explain: "Ca2+ binds to troponin C, inducing a conformational shift in the troponin-tropomyosin complex that exposes the binding sites on actin for myosin cross-bridges."
  },
  {
    id: "tcat-bio-144",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "What cellular process causes \"Rigor Mortis\" (stiffness of skeletal muscles) following death?",
    options: [
          "Excessive production of lactic acid in dead mitochondria",
          "Cessation of ATP synthesis prevents detachment of myosin cross-bridge heads from actin filaments",
          "Rapid degradation of actin and myosin by lysosomal enzymes",
          "Spontaneous firing of motor neurons"
    ],
    correct: 1,
    explain: "ATP binding is required to break the cross-bridge between myosin and actin; post-mortem ATP depletion locks myosin heads to actin in a rigid state."
  },
  {
    id: "tcat-bio-145",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "In bone remodeling and maintenance, which cells are multinucleated and responsible for bone resorption (degrading bone matrix)?",
    options: [
          "Osteoblasts",
          "Osteoclasts",
          "Osteocytes",
          "Chondrocytes"
    ],
    correct: 1,
    explain: "Osteoclasts are large multinucleated cells that secrete acid and enzymes to dissolve bone minerals and collagen during remodeling (bone resorption)."
  },
  {
    id: "tcat-bio-146",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "What is the structural unit of compact bone consisting of concentric lamellae arranged around a central canal containing blood vessels and nerves?",
    options: [
          "Trabecula",
          "Osteon (Haversian System)",
          "Epiphyseal Plate",
          "Medullary Cavity"
    ],
    correct: 1,
    explain: "The Osteon (Haversian system) is the cylindrical structural unit of compact bone, featuring concentric mineralized lamellae surrounding a neurovascular canal."
  },
  {
    id: "tcat-bio-147",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "During the cross-bridge cycle in muscle contraction, what event directly triggers the \"power stroke\" (tilting of the myosin head)?",
    options: [
          "The binding of a new ATP molecule to the myosin head",
          "The release of inorganic phosphate (Pi) from the energized myosin head",
          "The active reuptake of Ca2+ into the sarcoplasm",
          "The phosphorylation of troponin by protein kinase A"
    ],
    correct: 1,
    explain: "When the myosin head binds to actin, the release of inorganic phosphate (Pi) initiates the power stroke, pivoting the head ~45° and pulling the thin filament."
  },
  {
    id: "tcat-bio-148",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "Which connective tissue structure connects skeletal muscle to bone, and which structure connects bone to bone across a synovial joint?",
    options: [
          "Muscle to bone: Tendon; Bone to bone: Ligament",
          "Muscle to bone: Ligament; Bone to bone: Tendon",
          "Muscle to bone: Fascia; Bone to bone: Aponeurosis",
          "Muscle to bone: Cartilage; Bone to bone: Bursa"
    ],
    correct: 0,
    explain: "Tendons attach skeletal muscles to bones; ligaments are fibrous connective tissues joining bones to other bones at joints."
  },
  {
    id: "tcat-bio-149",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "Which division of the autonomic nervous system is responsible for the \"fight-or-flight\" emergency response (dilating pupils, increasing heart rate)?",
    options: [
          "Sympathetic Nervous System",
          "Parasympathetic Nervous System",
          "Somatic Nervous System",
          "Enteric Nervous System"
    ],
    correct: 0,
    explain: "The sympathetic division stimulates emergency catabolic reactions (\"fight or flight\"), whereas the parasympathetic division coordinates resting vegetative states."
  },
  {
    id: "tcat-bio-150",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "Which brain region coordinates voluntary muscle movements, posture, and motor balance?",
    options: [
          "Cerebrum",
          "Cerebellum",
          "Medulla Oblongata",
          "Hypothalamus"
    ],
    correct: 1,
    explain: "The cerebellum processes sensory input to fine-tune skeletal muscle coordination, balance, and motor precision."
  },
  {
    id: "tcat-bio-151",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "Which plant hormone promotes apical dominance and phototropic bending toward light by stimulating cell elongation on the shaded side of stems?",
    options: [
          "Auxin (IAA)",
          "Abscisic Acid (ABA)",
          "Ethylene",
          "Cytokinin"
    ],
    correct: 0,
    explain: "Auxin (indole-3-acetic acid) migrates to the shaded side of coleoptiles, stimulating cell elongation to produce phototropic curvature."
  },
  {
    id: "tcat-bio-152",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "Deficiency of dietary iodine impairs the synthesis of which hormone, causing compensatory enlargement of the thyroid gland (goiter)?",
    options: [
          "Thyroxine (T4 and T3)",
          "Insulin",
          "Calcitonin",
          "Parathyroid Hormone"
    ],
    correct: 0,
    explain: "Thyroid hormones (T3 and T4) contain iodine. Lack of iodine diminishes thyroxine synthesis, elevating TSH and leading to goiter."
  },
  {
    id: "tcat-bio-153",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "Why does \"saltatory conduction\" in myelinated axons propagate nerve impulses up to 100 times faster than in unmyelinated axons?",
    options: [
          "Action potentials jump from one Node of Ranvier to the next because voltage-gated ion channels are concentrated at the nodes",
          "The myelin sheath actively generates additional ATP along the axonal membrane",
          "The diameter of the axon shrinks to zero under myelin",
          "Sodium ions are replaced by faster-moving lithium ions"
    ],
    correct: 0,
    explain: "Myelin acts as an electrical insulator; action potentials regenerate only at the uninsulated Nodes of Ranvier, allowing rapid electrotonic jumping."
  },
  {
    id: "tcat-bio-154",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "Which gaseous plant hormone triggers rapid fruit ripening and promotes leaf and fruit abscission?",
    options: [
          "Gibberellin",
          "Ethylene",
          "Cytokinin",
          "Auxin"
    ],
    correct: 1,
    explain: "Ethylene (C2H4) is a volatile hydrocarbon gas functioning as a plant hormone that accelerates climatic fruit ripening and senescence."
  },
  {
    id: "tcat-bio-155",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "What is the correct sequential pathway of a basic reflex arc?",
    options: [
          "Receptor -> Sensory Neuron -> Interneuron (CNS) -> Motor Neuron -> Effector",
          "Effector -> Motor Neuron -> Interneuron -> Sensory Neuron -> Receptor",
          "Receptor -> Motor Neuron -> Brain -> Sensory Neuron -> Effector",
          "Sensory Neuron -> Receptor -> Effector -> Motor Neuron"
    ],
    correct: 0,
    explain: "The reflex pathway flows: sensory receptor detects stimulus -> afferent sensory neuron -> integration center in spinal cord -> efferent motor neuron -> effector."
  },
  {
    id: "tcat-bio-156",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "Which hormone is synthesized by the hypothalamus and stored in the posterior pituitary gland to stimulate water reabsorption in renal collecting ducts?",
    options: [
          "Antidiuretic Hormone (ADH / Vasopressin)",
          "Adrenocorticotropic Hormone (ACTH)",
          "Aldosterone",
          "Prolactin"
    ],
    correct: 0,
    explain: "ADH (vasopressin) is synthesized by supraoptic nuclei in the hypothalamus and released from the posterior pituitary to increase aquaporin water channels."
  },
  {
    id: "tcat-bio-157",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "Which plant hormone is commonly known as the \"stress hormone\" because it closes stomata during drought and enforces seed dormancy?",
    options: [
          "Abscisic Acid (ABA)",
          "Gibberellic Acid (GA3)",
          "Zeatin",
          "Brassinolide"
    ],
    correct: 0,
    explain: "Abscisic Acid (ABA) mediates plant responses to environmental stressors, closing stomatal guard cells under water deficiency and inhibiting germination."
  },
  {
    id: "tcat-bio-158",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "What is the mechanism by which the steroid hormone aldosterone regulates blood pressure in the distal convoluted tubule and collecting duct?",
    options: [
          "It stimulates Na+ reabsorption and K+ excretion, driving osmotic water retention and expanding blood volume",
          "It dilates the renal afferent arterioles to increase glomerular filtration",
          "It degrades angiotensin II in the systemic circulation",
          "It stimulates insulin release from pancreatic islets"
    ],
    correct: 0,
    explain: "Aldosterone (from the adrenal cortex) upregulates basolateral Na+/K+ pumps and apical ENaC channels, increasing sodium and water retention."
  },
  {
    id: "tcat-bio-159",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "Which brain structure acts as the primary sensory relay station, filtering and forwarding all sensory impulses (except olfaction) to appropriate cerebral cortical areas?",
    options: [
          "Thalamus",
          "Hypothalamus",
          "Hippocampus",
          "Pons"
    ],
    correct: 0,
    explain: "The thalamus serves as the central relay hub for all conscious sensory pathways (vision, hearing, taste, touch) en route to the cerebral cortex, excluding olfactory signals."
  },
  {
    id: "tcat-bio-160",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "In male mammalian reproductive anatomy, in which microscopic structures does spermatogenesis occur?",
    options: [
          "Seminiferous tubules",
          "Epididymis",
          "Seminal vesicles",
          "Prostate gland"
    ],
    correct: 0,
    explain: "Spermatogenesis occurs within the seminiferous tubules of the testes, supported by Sertoli cells."
  },
  {
    id: "tcat-bio-161",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "A surge in which anterior pituitary gonadotropic hormone directly triggers ovulation (release of the secondary oocyte) around day 14 of the ovarian cycle?",
    options: [
          "Luteinizing Hormone (LH)",
          "Follicle-Stimulating Hormone (FSH)",
          "Estrogen",
          "Progesterone"
    ],
    correct: 0,
    explain: "The mid-cycle LH surge triggers rupture of the mature Graafian follicle and release of the secondary oocyte (ovulation)."
  },
  {
    id: "tcat-bio-162",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "What is the characteristic reproductive feature of angiosperms known as \"Double Fertilization\"?",
    options: [
          "One sperm fertilizes the egg to form the diploid zygote (2n), while a second sperm fuses with the two polar nuclei to form the triploid endosperm (3n)",
          "Two sperm fertilize the same ovum to produce fraternal twins",
          "Fertilization occurs simultaneously in the flower and in the root system",
          "The stigma captures two pollen grains per ovule"
    ],
    correct: 0,
    explain: "Double fertilization yields a 2n zygote (embryo) and a 3n primary endosperm nucleus that develops into nutrient tissue for the seed."
  },
  {
    id: "tcat-bio-163",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "What hormonal change induces menstruation (shedding of the uterine functional endometrial lining) when pregnancy does not occur?",
    options: [
          "Degeneration of the corpus luteum causing a sharp decline in progesterone and estrogen levels",
          "A massive spike in human chorionic gonadotropin (hCG)",
          "Sudden hypersecretion of testosterone by the ovaries",
          "Elevated levels of oxytocin triggering uterine spasms"
    ],
    correct: 0,
    explain: "In the absence of fertilization, the corpus luteum regresses into the corpus albicans; the withdrawal of progesterone triggers endometrial ischemia and menses."
  },
  {
    id: "tcat-bio-164",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "During mammalian embryonic cleavage, what is the hollow spherical stage consisting of an outer trophoblast and an inner cell mass called?",
    options: [
          "Morula",
          "Blastocyst (Blastula)",
          "Gastrula",
          "Neurula"
    ],
    correct: 1,
    explain: "The blastocyst comprises an outer trophoblast (future placenta) and an inner cell mass (which gives rise to the embryo proper)."
  },
  {
    id: "tcat-bio-165",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "What is the \"cortical reaction\" that occurs immediately following the entry of a single sperm into an oocyte?",
    options: [
          "Exocytosis of cortical granules that hardens the zona pellucida (fertilization envelope) to permanently prevent polyspermy",
          "Immediate expulsion of the sperm nucleus from the cytoplasm",
          "Degeneration of the polar body",
          "Spontaneous lysis of the ovarian follicle"
    ],
    correct: 0,
    explain: "The cortical reaction is the slow block to polyspermy: cortical granules release enzymes that crosslink and harden the zona pellucida, blocking extra sperm."
  },
  {
    id: "tcat-bio-166",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "Which embryonic primary germ layer gives rise to the nervous system, epidermis of the skin, and sensory receptors?",
    options: [
          "Ectoderm",
          "Mesoderm",
          "Endoderm",
          "Trophoderm"
    ],
    correct: 0,
    explain: "The ectoderm differentiates into the nervous system (brain, spinal cord), sensory organs, and the epidermis of the skin."
  },
  {
    id: "tcat-bio-167",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "Which tissues develop embryologically from the embryonic Mesoderm layer in vertebrates?",
    options: [
          "Digestive tract epithelial lining and respiratory alveoli",
          "Skeletal muscles, circulatory system (heart and blood vessels), kidneys, and skeleton",
          "Brain, spinal cord, and hair follicles",
          "Pancreatic and thyroid glandular parenchymas"
    ],
    correct: 1,
    explain: "The mesoderm forms the cardiovascular system, skeleton, striated and smooth muscles, gonads, and excretory organs (kidneys)."
  },
  {
    id: "tcat-bio-168",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "What is the role of Human Chorionic Gonadotropin (hCG) secreted by the embryonic trophoblast after implantation?",
    options: [
          "It maintains the maternal corpus luteum so it continues secreting progesterone, preventing menstruation and sustaining early pregnancy",
          "It initiates rhythmic labor contractions in the myometrium",
          "It induces the production of milk in the mammary alveoli",
          "It inhibits embryonic cell differentiation"
    ],
    correct: 0,
    explain: "hCG rescues the corpus luteum from regression, sustaining progesterone output until the placenta assumes steroidogenic function."
  },
  {
    id: "tcat-bio-169",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "In plant alternation of generations, how does the gametophyte generation differ ploidy-wise from the sporophyte generation, and by which cell division does it form gametes?",
    options: [
          "Gametophyte is haploid (n) and forms gametes by mitosis; Sporophyte is diploid (2n) and forms spores by meiosis",
          "Gametophyte is diploid (2n) and forms gametes by meiosis; Sporophyte is haploid (n) and forms spores by mitosis",
          "Both generations are diploid (2n) and divide solely by binary fission",
          "Gametophytes form spores; sporophytes form gametes"
    ],
    correct: 0,
    explain: "The haploid gametophyte (n) produces gametes (n) via mitosis; fertilization produces a diploid sporophyte (2n), which generates haploid spores through meiosis."
  },
  {
    id: "tcat-bio-170",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "Structures in different species that share a common ancestral evolutionary origin but may serve different functions (such as the human arm, bat wing, and whale flipper) are termed:",
    options: [
          "Homologous structures",
          "Analogous structures",
          "Vestigial structures",
          "Convergent adaptations"
    ],
    correct: 0,
    explain: "Homologous structures share common anatomical derivation (divergent evolution), even if their functional adaptations diverge."
  },
  {
    id: "tcat-bio-171",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "What is the approximate percentage of energy transferred from one trophic level to the next higher level in an ecological food pyramid (Lindeman's efficiency)?",
    options: [
          "10%",
          "50%",
          "90%",
          "100%"
    ],
    correct: 0,
    explain: "Lindeman's 10% rule indicates that approximately 10% of chemical energy in biomass at one trophic level is transferred to the next; ~90% is lost as metabolic heat."
  },
  {
    id: "tcat-bio-172",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "Which biological process in the nitrogen cycle converts atmospheric molecular nitrogen (N2) into ammonia (NH3), carried out by bacteria such as Rhizobium and Azotobacter?",
    options: [
          "Nitrification",
          "Nitrogen fixation",
          "Denitrification",
          "Ammonification"
    ],
    correct: 1,
    explain: "Nitrogen fixation is the reduction of inert atmospheric N2 gas into ammonia (NH3) by nitrogenase-producing diazotrophic bacteria."
  },
  {
    id: "tcat-bio-173",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "What term describes non-functional anatomical remnants of structures that had functional roles in ancestral organisms, such as the human vermiform appendix or whale pelvic bones?",
    options: [
          "Vestigial structures",
          "Homologous organs",
          "Analogous wings",
          "Atavistic phenotypes"
    ],
    correct: 0,
    explain: "Vestigial structures are degenerate, rudimentary remnants of organs that served significant functions in evolutionary ancestors."
  },
  {
    id: "tcat-bio-174",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "In population genetics, what is the Hardy-Weinberg equilibrium equation representing genotype frequencies for a gene with two alleles with frequencies p and q?",
    options: [
          "p^2 + 2pq + q^2 = 1",
          "p + q = 2",
          "p^2 - q^2 = 1",
          "(p + q)^3 = 1"
    ],
    correct: 0,
    explain: "The Hardy-Weinberg equation p^2 + 2pq + q^2 = 1 models homozygous dominant (p^2), heterozygous (2pq), and homozygous recessive (q^2) genotype frequencies."
  },
  {
    id: "tcat-bio-175",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "Which evolutionary mode occurs when a physical geographic barrier (such as a mountain range or ocean channel) splits a single population into isolated gene pools?",
    options: [
          "Allopatric speciation",
          "Sympatric speciation",
          "Parapatric speciation",
          "Polyploid speciation"
    ],
    correct: 0,
    explain: "Allopatric speciation requires geographical isolation preventing gene flow, allowing genetic drift and natural selection to diverge populations into distinct species."
  },
  {
    id: "tcat-bio-176",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "How does primary ecological succession differ fundamentally from secondary ecological succession?",
    options: [
          "Primary succession begins in a barren environment lacking pre-existing soil (such as cooled volcanic lava), whereas secondary succession occurs where existing communities were disturbed but soil remains intact",
          "Primary succession involves only animals, whereas secondary involves only plants",
          "Secondary succession requires thousands of years longer than primary succession",
          "Primary succession occurs exclusively in deep aquatic benthic trenches"
    ],
    correct: 0,
    explain: "Primary succession begins on newly exposed substrate without soil (e.g., retreating glaciers, lava flows); secondary succession begins after disturbance of an area where soil remains."
  },
  {
    id: "tcat-bio-177",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "Which terrestrial biome is characterized by permafrost, low precipitation, dwarf vegetation (mosses and lichens), and absence of tall trees?",
    options: [
          "Tundra",
          "Taiga (Boreal Forest)",
          "Temperate Deciduous Forest",
          "Savanna"
    ],
    correct: 0,
    explain: "The Arctic Tundra is defined by a permanently frozen subsoil layer (permafrost) and extremely short growing seasons preventing tree growth."
  },
  {
    id: "tcat-bio-178",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "Which condition will DISRUPT Hardy-Weinberg genetic equilibrium in a biological population?",
    options: [
          "Infinitely large population size",
          "Complete absence of mutations",
          "Random mating (panmixia)",
          "Natural selection favoring specific adaptive genotypes"
    ],
    correct: 3,
    explain: "Hardy-Weinberg equilibrium assumes no mutation, no gene flow, large population size, random mating, and NO natural selection; selection alters allele frequencies."
  },
  {
    id: "tcat-bio-179",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "The analogous wing structures of birds and butterflies illustrate which evolutionary pattern?",
    options: [
          "Divergent evolution from a winged common ancestor",
          "Convergent evolution where unrelated lineages independently evolve similar functional structures under similar selective pressures",
          "Genetic bottlenecking leading to morphological convergence",
          "Adaptive radiation following mass extinction"
    ],
    correct: 1,
    explain: "Convergent evolution produces analogous structures: bird wings (bony endoskeleton) and insect wings (chitinous cuticle) evolved independently for flight."
  },
  {
    id: "tcat-bio-180",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "What is the role of denitrifying bacteria (such as Pseudomonas denitrificans) in the global nitrogen cycle?",
    options: [
          "Converting soil nitrates (NO3-) back into gaseous atmospheric nitrogen (N2)",
          "Oxidizing toxic ammonia into nitrites (NO2-)",
          "Fixing molecular nitrogen into plant amino acids",
          "Decomposing dead animal tissue into urea"
    ],
    correct: 0,
    explain: "Denitrification reduces nitrates (NO3-) into gaseous nitrogen (N2 and N2O) under anaerobic conditions, returning fixed nitrogen to the atmosphere."
  },
  {
    id: "tcat-bio-181",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Easy",
    q: "Which cellular organelle is the primary site of intracellular hydrolytic digestion and cellular autophagy in eukaryotic cells?",
    options: [
      "Lysosome",
      "Ribosome",
      "Peroxisome",
      "Centrosome"
    ],
    correct: 0,
    explain: "Lysosomes contain acid hydrolases (active around pH 4.5–5.0) that digest endocytosed macromolecules, cellular debris, and obsolete organelles through autophagy."
  },
  {
    id: "tcat-bio-182",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Easy",
    q: "What type of covalent chemical bond links adjacent amino acids in the primary polypeptide chain of a protein?",
    options: [
      "Peptide bond",
      "Phosphodiester bond",
      "Glycosidic bond",
      "Ester bond"
    ],
    correct: 0,
    explain: "Peptide bonds (amide bonds) are formed via dehydration synthesis between the alpha-carboxyl group of one amino acid and the alpha-amino group of the next."
  },
  {
    id: "tcat-bio-183",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Easy",
    q: "Which structural polysaccharide composed of beta-1,4-glycosidic linkages forms the predominant structural constituent of plant cell walls?",
    options: [
      "Cellulose",
      "Starch",
      "Glycogen",
      "Chitin"
    ],
    correct: 0,
    explain: "Cellulose is a linear unbranched polymer of D-glucose linked by beta-1,4-glycosidic bonds, forming rigid microfibrils with high tensile strength."
  },
  {
    id: "tcat-bio-184",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Easy",
    q: "According to the Singer-Nicolson Fluid Mosaic Model, what forms the fundamental amphipathic structural matrix of cell membranes?",
    options: [
      "Phospholipid bilayer",
      "Triglyceride monolayer",
      "Glycoprotein meshwork",
      "Cholesterol lattice"
    ],
    correct: 0,
    explain: "The fluid mosaic model describes the plasma membrane as a fluid phospholipid bilayer with hydrophilic polar heads facing water and hydrophobic fatty acid tails sequestered inside."
  },
  {
    id: "tcat-bio-185",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Medium",
    q: "During which phase of eukaryotic cell division do homologous chromosomes pair up and undergo genetic crossing-over?",
    options: [
      "Prophase I of meiosis",
      "Metaphase I of meiosis",
      "Prophase of mitosis",
      "Anaphase II of meiosis"
    ],
    correct: 0,
    explain: "In Prophase I of Meiosis (specifically the pachytene substage), non-sister chromatids of homologous chromosomes form synaptonemal complexes and exchange genetic material (crossing-over)."
  },
  {
    id: "tcat-bio-186",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Medium",
    q: "Which molecular motor protein utilizes ATP hydrolysis to transport cargo retrogradely toward the minus ends of microtubules (toward the cell center)?",
    options: [
      "Cytoplasmic Dynein",
      "Kinesin",
      "Myosin II",
      "Actin"
    ],
    correct: 0,
    explain: "Cytoplasmic dynein is a minus-end-directed microtubule motor protein mediating retrograde transport, whereas most kinesins move anterogradely toward plus ends."
  },
  {
    id: "tcat-bio-187",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Medium",
    q: "What is the role of cholesterol in animal cell plasma membranes at fluctuating physiological temperatures?",
    options: [
      "Acts as a bidirectional fluidity buffer: prevents excessive fluidity at warm temperatures and inhibits crystalline packing at low temperatures",
      "Serves as the primary active transport pump for sodium ions",
      "Receptors that exclusively bind steroid hormones on the cell surface",
      "Catalyzes the synthesis of phosphodiester bonds"
    ],
    correct: 0,
    explain: "Cholesterol acts as a membrane fluidity buffer: at high temperatures it restricts phospholipid hydrocarbon chain movement, while at low temperatures it prevents tight packing and solidification."
  },
  {
    id: "tcat-bio-188",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Hard",
    q: "Which eukaryotic nuclear pore complex transport receptor specifically recognizes the basic Nuclear Localization Signal (NLS) on cargo proteins targeted for nuclear import?",
    options: [
      "Importin-alpha / Importin-beta heterodimer",
      "Exportin-1 (CRM1)",
      "RanGAP",
      "RanGEF (RCC1)"
    ],
    correct: 0,
    explain: "Classical nuclear import requires Importin-alpha (which binds the basic NLS on cargo) and Importin-beta (which docks at the nuclear pore complex and interacts with FG-repeats)."
  },
  {
    id: "tcat-bio-189",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Hard",
    q: "In the mitochondrial electron transport chain, which protein complex does NOT pump protons across the inner mitochondrial membrane into the intermembrane space?",
    options: [
      "Complex II (Succinate Dehydrogenase)",
      "Complex I (NADH Dehydrogenase)",
      "Complex III (Cytochrome bc_1 Complex)",
      "Complex IV (Cytochrome c Oxidase)"
    ],
    correct: 0,
    explain: "Complex II (Succinate-ubiquinone oxidoreductase) transfers electrons from FADH_2 to ubiquinone without pumping any protons across the inner mitochondrial membrane."
  },
  {
    id: "tcat-bio-190",
    subject: "Biology",
    topic: "Cell Biology & Biological Molecules",
    difficulty: "Hard",
    q: "What lipid modifications target peripheral membrane proteins to the cytoplasmic leaflet of the eukaryotic plasma membrane?",
    options: [
      "Myristoylation and Palmitoylation",
      "Glycosylphosphatidylinositol (GPI) anchors",
      "Beta-barrel transconformation",
      "Cholesterol sulfation"
    ],
    correct: 0,
    explain: "Myristoylation (attachment of myristic acid to N-terminal glycine) and palmitoylation (thioester linkage to cysteine) anchor peripheral cytosolic proteins into the inner leaflet of the plasma membrane."
  },
  {
    id: "tcat-bio-191",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Easy",
    q: "How does an enzyme accelerate the rate of an uncatalyzed biochemical reaction?",
    options: [
      "By lowering the activation energy barrier (Delta G_ddagger) required to attain the transition state",
      "By increasing the net Gibbs free energy change (Delta G) of the reaction",
      "By increasing the equilibrium constant K_eq toward products",
      "By raising the kinetic temperature of reactant molecules"
    ],
    correct: 0,
    explain: "Enzymes lower the activation energy barrier by stabilizing the transition state. They do not alter the initial or final free energies (Delta G) or the equilibrium constant K_eq."
  },
  {
    id: "tcat-bio-192",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Easy",
    q: "In cellular respiration, what is the net yield of ATP molecules synthesized per molecule of glucose via substrate-level phosphorylation during Glycolysis alone?",
    options: [
      "2 ATP",
      "4 ATP",
      "32 ATP",
      "36 ATP"
    ],
    correct: 0,
    explain: "Glycolysis consumes 2 ATP in the preparatory phase and generates 4 ATP in the payoff phase, resulting in a net yield of 4 - 2 = 2 ATP per glucose molecule."
  },
  {
    id: "tcat-bio-193",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Easy",
    q: "What is the non-protein organic cofactor that is tightly or permanently bound to an enzyme called?",
    options: [
      "Prosthetic group",
      "Apoenzyme",
      "Co-substrate",
      "Zymogen"
    ],
    correct: 0,
    explain: "A prosthetic group is a non-protein organic or organometallic moiety (like heme or FAD) that remains tightly bound (often covalently) to an apoenzyme to form a holoenzyme."
  },
  {
    id: "tcat-bio-194",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Easy",
    q: "In the light-dependent reactions of photosynthesis, what process splits water molecules to release oxygen gas and replenish lost electrons in Photosystem II?",
    options: [
      "Photolysis",
      "Carbon fixation",
      "Chemiosmosis",
      "Oxidative phosphorylation"
    ],
    correct: 0,
    explain: "Photolysis of water occurs at the oxygen-evolving complex of Photosystem II (P680), splitting 2 H_2O into 4 H^+, 4 e^-, and O_2 gas."
  },
  {
    id: "tcat-bio-195",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Medium",
    q: "In Michaelis-Menten enzyme kinetics, how does a reversible Competitive Inhibitor alter the kinetic parameters V_max and K_m?",
    options: [
      "Apparent K_m increases while V_max remains unchanged",
      "V_max decreases while K_m remains unchanged",
      "Both K_m and V_max decrease proportionally",
      "Both K_m and V_max increase"
    ],
    correct: 0,
    explain: "A competitive inhibitor competes with substrate for the active site. Increasing substrate concentration outcompetes the inhibitor, so V_max is unchanged, but higher substrate is needed for half-V_max, raising apparent K_m."
  },
  {
    id: "tcat-bio-196",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Medium",
    q: "Which enzyme serves as the primary rate-limiting and committed-step allosteric control point of Glycolysis?",
    options: [
      "Phosphofructokinase-1 (PFK-1)",
      "Hexokinase",
      "Pyruvate Kinase",
      "Aldolase"
    ],
    correct: 0,
    explain: "Phosphofructokinase-1 (PFK-1) catalyzes the phosphorylation of fructose-6-phosphate to fructose-1,6-bisphosphate, acting as the key committed and allosterically regulated pacemaker step of glycolysis."
  },
  {
    id: "tcat-bio-197",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Medium",
    q: "What is the immediate chemical acceptor molecule that binds atmospheric CO_2 during the carboxylation phase of the Calvin cycle, catalyzed by RuBisCO?",
    options: [
      "Ribulose 1,5-bisphosphate (RuBP)",
      "Phosphoenolpyruvate (PEP)",
      "Oxaloacetate",
      "3-Phosphoglycerate (3-PGA)"
    ],
    correct: 0,
    explain: "In C3 photosynthesis, RuBisCO catalyzes the addition of CO_2 to the 5-carbon sugar ribulose 1,5-bisphosphate (RuBP), yielding an unstable 6-carbon intermediate that splits into two molecules of 3-PGA."
  },
  {
    id: "tcat-bio-198",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Hard",
    q: "In Mitchell's chemiosmotic hypothesis, how does the proton-motive force (Delta p) drive ATP synthesis through the mitochondrial F_oF_1-ATP Synthase?",
    options: [
      "Proton flow through the F_o subunit drives mechanical rotation of the central gamma stalk, inducing sequential binding-change conformational states in the catalytic beta subunits of F_1",
      "Protons directly phosphorylate ADP molecules by transferring high-energy covalent bonds",
      "Protons act as allosteric activators opening gated calcium channels",
      "Proton entry reduces NAD+ to NADH directly inside the F_1 head"
    ],
    correct: 0,
    explain: "Peter Mitchell and Paul Boyer demonstrated that proton translocation through the F_o rotor drives rotational catalysis of the gamma subunit, cycling F_1 beta subunits through Open, Loose, and Tight conformational states."
  },
  {
    id: "tcat-bio-199",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Hard",
    q: "What distinguishes non-competitive inhibition from uncompetitive inhibition on a Lineweaver-Burk double reciprocal plot?",
    options: [
      "Non-competitive inhibition lines intersect on the negative 1/[S] x-axis (K_m unchanged), whereas uncompetitive inhibition produces parallel lines (both K_m and V_max decreased)",
      "Non-competitive inhibition produces parallel lines",
      "Uncompetitive inhibition lines intersect on the 1/V y-axis",
      "Both forms of inhibition yield identical x-intercepts"
    ],
    correct: 0,
    explain: "Pure non-competitive inhibitors bind free enzyme and ES complex equally, leaving K_m unchanged (same x-intercept -1/K_m). Uncompetitive inhibitors bind only the ES complex, shifting both x and y intercepts to produce parallel lines."
  },
  {
    id: "tcat-bio-200",
    subject: "Biology",
    topic: "Enzymes & Bioenergetics",
    difficulty: "Hard",
    q: "In C4 photosynthetic plants, which enzyme fixes atmospheric CO_2 into a four-carbon carboxylic acid inside mesophyll cells, completely avoiding photorespiration?",
    options: [
      "Phosphoenolpyruvate (PEP) carboxylase",
      "RuBisCO oxygenase",
      "Malate dehydrogenase",
      "Carbonic anhydrase"
    ],
    correct: 0,
    explain: "PEP carboxylase in mesophyll cells fixes HCO_3^- onto phosphoenolpyruvate to form oxaloacetate. PEP carboxylase has exceptionally high affinity for bicarbonate and zero affinity for oxygen, eliminating photorespiration."
  },
  {
    id: "tcat-bio-201",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Easy",
    q: "What is the protective protein shell that encloses the viral nucleic acid genome termed?",
    options: [
      "Capsid",
      "Peptidoglycan",
      "Envelope",
      "Capsule"
    ],
    correct: 0,
    explain: "A viral capsid is the symmetrical protein coat composed of individual capsomere subunits that encloses and protects the viral genetic material."
  },
  {
    id: "tcat-bio-202",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Easy",
    q: "Which unique polymer consisting of alternating N-acetylglucosamine (NAG) and N-acetylmuramic acid (NAM) crosslinked by oligopeptides forms the bacterial cell wall?",
    options: [
      "Peptidoglycan (Murein)",
      "Cellulose",
      "Chitin",
      "Pseudomurein"
    ],
    correct: 0,
    explain: "Peptidoglycan (murein) is the rigid meshwork polymer specific to bacterial cell walls, composed of glycan strands (NAG-NAM) cross-linked by short peptide chains."
  },
  {
    id: "tcat-bio-203",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Easy",
    q: "What is the primary mode of asexual cell division in typical prokaryotes?",
    options: [
      "Binary fission",
      "Mitosis",
      "Budding",
      "Sporogenesis"
    ],
    correct: 0,
    explain: "Prokaryotes reproduce asexually through binary fission: the single circular chromosome replicates, attaches to the plasma membrane, and the cell cleaves into two identical daughter cells."
  },
  {
    id: "tcat-bio-204",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Medium",
    q: "In the Gram staining procedure, why do Gram-positive bacteria retain the primary crystal violet-iodine complex and appear purple under a microscope?",
    options: [
      "They possess a thick, multi-layered peptidoglycan wall that dehydrates and traps the dye complex during alcohol washing",
      "They have an outer lipopolysaccharide membrane that binds crystal violet irreversibly",
      "Their cytoplasm contains acidic vacuoles that precipitate iodine",
      "Gram-positive bacteria lack plasma membranes"
    ],
    correct: 0,
    explain: "Gram-positive bacteria have thick peptidoglycan cell walls (20-80 nm) with teichoic acids. Alcohol dehydrates the peptidoglycan meshwork, trapping the crystal violet-iodine mordant complex inside."
  },
  {
    id: "tcat-bio-205",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Medium",
    q: "Which specialized bacterial surface structures mediate the horizontal transfer of conjugative plasmid DNA between donor (F+) and recipient (F-) cells?",
    options: [
      "Sex pili (Conjugative pili)",
      "Flagella",
      "Endospores",
      "Mesosomes"
    ],
    correct: 0,
    explain: "Sex pili (F-pili) encoded by the F plasmid establish physical contact between bacterial cells and retract to facilitate the formation of a mating bridge for plasmid transfer."
  },
  {
    id: "tcat-bio-206",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Medium",
    q: "What enzyme allows retroviruses like HIV to synthesize a complementary DNA (cDNA) molecule using an RNA viral genome template?",
    options: [
      "Reverse Transcriptase",
      "RNA Polymerase II",
      "DNA Ligase",
      "Topoisomerase I"
    ],
    correct: 0,
    explain: "Reverse transcriptase is an RNA-dependent DNA polymerase that transcribes the single-stranded viral RNA genome into double-stranded proviral DNA."
  },
  {
    id: "tcat-bio-207",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Medium",
    q: "What infectious biological agents consist solely of naked, circular, single-stranded RNA molecules without any protein capsid, primarily causing diseases in plants?",
    options: [
      "Viroids",
      "Prions",
      "Virions",
      "Bacteriophages"
    ],
    correct: 0,
    explain: "Viroids are infectious plant pathogens consisting exclusively of short, circular, non-coding single-stranded RNA without a protein coat. Prions, in contrast, are infectious proteins without nucleic acid."
  },
  {
    id: "tcat-bio-208",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Hard",
    q: "What chemical compound in the outer spore coat of bacterial endospores (e.g., Bacillus anthracis) confers extraordinary resistance to extreme heat, radiation, and desiccation?",
    options: [
      "Dipicolinic acid complexed with calcium ions (Calcium dipicolinate)",
      "Poly-beta-hydroxybutyrate",
      "Lipopolysaccharide lipid A",
      "Mycolic acid waxes"
    ],
    correct: 0,
    explain: "Endospores contain high concentrations (up to 15% dry weight) of dipicolinic acid complexed with calcium (Ca-DPA), which dehydrates the spore core and protects DNA against heat and radiation."
  },
  {
    id: "tcat-bio-209",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Hard",
    q: "In the lysogenic cycle of bacteriophage lambda, which viral repressor protein maintains transcriptional silencing of lytic genes to preserve the integrated prophage state?",
    options: [
      "Lambda repressor (cI protein)",
      "Cro protein",
      "RecA protease",
      "cII activator"
    ],
    correct: 0,
    explain: "The cI repressor protein binds operator sites O_R and O_L, repressing lytic promoter transcription (P_R and P_L) and maintaining lysogeny. DNA damage activates RecA, cleaving cI and inducing the lytic cycle."
  },
  {
    id: "tcat-bio-210",
    subject: "Biology",
    topic: "Acellular & Prokaryotic Life",
    difficulty: "Hard",
    q: "How do Archaea cell membranes differ chemically from those of Bacteria and Eukarya?",
    options: [
      "Archaea utilize branched isoprenoid hydrocarbon chains joined to L-glycerol by ether linkages rather than ester linkages",
      "Archaea lack phospholipids entirely and use pure cellulose",
      "Archaea have peptidoglycan containing D-amino acids",
      "Archaea cell membranes contain triple-helical collagen fibrils"
    ],
    correct: 0,
    explain: "Archaea possess unique membrane lipids: phytanyl/biphytanyl branched isoprenoid chains linked to glycerol-1-phosphate via ether linkages (forming monolayers or bilayers resistant to extreme heat and acid)."
  },
  {
    id: "tcat-bio-211",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Easy",
    q: "Which phylum of the animal kingdom is characterized by jointed appendages, chitinous exoskeletons, and segmented bodies?",
    options: [
      "Arthropoda",
      "Mollusca",
      "Annelida",
      "Platyhelminthes"
    ],
    correct: 0,
    explain: "Phylum Arthropoda is the largest animal phylum, defined by chitinous cuticular exoskeletons, metameric segmentation, and paired jointed appendages."
  },
  {
    id: "tcat-bio-212",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Easy",
    q: "In bryophytes (e.g., mosses and liverworts), which generation is morphologically dominant, photosynthetic, and independent?",
    options: [
      "Gametophyte generation (haploid, n)",
      "Sporophyte generation (diploid, 2n)",
      "Protonema only",
      "Zygote"
    ],
    correct: 0,
    explain: "In non-vascular bryophytes, the haploid gametophyte generation is dominant and free-living, while the diploid sporophyte is nutritionally dependent upon the gametophyte."
  },
  {
    id: "tcat-bio-213",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Easy",
    q: "Which specialized stinging cells containing coiled venomous threads are unique to Phylum Cnidaria (coelenterates)?",
    options: [
      "Cnidocytes (nematocysts)",
      "Choanocytes",
      "Amoebocytes",
      "Flame cells"
    ],
    correct: 0,
    explain: "Cnidarians (jellyfish, corals, hydra) possess specialized stinging cells called cnidocytes containing explosive organelle capsules called nematocysts for prey capture and defense."
  },
  {
    id: "tcat-bio-214",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Medium",
    q: "In angiosperms, what is the process where one sperm nucleus fertilizes the egg while the second fertilizes the binucleate central cell?",
    options: [
      "Double fertilization",
      "Apomixis",
      "Parthenocarpy",
      "Polyembryony"
    ],
    correct: 0,
    explain: "Double fertilization produces a diploid zygote (sperm + egg -> 2n) and a triploid endosperm (sperm + 2 polar nuclei -> 3n nutritive tissue), unique to angiosperms."
  },
  {
    id: "tcat-bio-215",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Medium",
    q: "Which diagnostic morphological feature distinguishes members of Phylum Chordata at some point during their embryonic development?",
    options: [
      "Notochord, dorsal hollow nerve cord, pharyngeal gill slits, and post-anal tail",
      "Ventral nerve cord, open circulatory system, and calcareous shell",
      "Radial symmetry, cnidocytes, and gastrovascular cavity",
      "Pseudocoelom, cuticular cuticle, and terminal anus"
    ],
    correct: 0,
    explain: "All chordates share four cardinal embryonic characteristics: a flexible notochord, a dorsal hollow nerve cord, pharyngeal gill slits/clefts, and a muscular post-anal tail."
  },
  {
    id: "tcat-bio-216",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Medium",
    q: "How does the embryonic coelom develop in Deuterostomes compared to Protostomes?",
    options: [
      "In deuterostomes, the coelom forms by enterocoely (outpocketing of the archenteron), and the blastopore develops into the anus",
      "In deuterostomes, the coelom forms by schizocoely (splitting of mesoderm), and the blastopore becomes the mouth",
      "In deuterostomes, radial cleavage produces an acoelomate body plan",
      "Deuterostomes develop without any mesodermal germ layer"
    ],
    correct: 0,
    explain: "Deuterostomes (echinoderms, chordates) exhibit radial, indeterminate cleavage, enterocoelous coelom formation (archenteron outpocketing), and the blastopore becomes the anus."
  },
  {
    id: "tcat-bio-217",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Medium",
    q: "Which group of gymnosperms produces naked seeds on woody female cones and possesses needle-like xerophytic leaves with sunken stomata?",
    options: [
      "Conifers (Pinophyta)",
      "Cycads",
      "Ginkgophytes",
      "Gnetophytes"
    ],
    correct: 0,
    explain: "Conifers (pines, spruces, firs) produce naked seeds on cones (gymnosperms) and have evolved needle-like leaves with thick cuticles and sunken stomata to resist water loss in cold or arid climates."
  },
  {
    id: "tcat-bio-218",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Hard",
    q: "In the water vascular system of Echinoderms (e.g., starfish), through which perforated sieve-like plate does seawater enter the system?",
    options: [
      "Madreporite",
      "Ring canal",
      "Radial canal",
      "Ampulla"
    ],
    correct: 0,
    explain: "The madreporite is a porous, calcareous plate located on the aboral surface of echinoderms through which seawater enters the stone canal to pressurize the hydraulic water vascular system."
  },
  {
    id: "tcat-bio-219",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Hard",
    q: "What embryonic extra-embryonic membrane forms a fluid-filled aquatic cushion that prevents mechanical shock and desiccation in the amniotic eggs of reptiles, birds, and mammals?",
    options: [
      "Amnion",
      "Allantois",
      "Chorion",
      "Yolk sac"
    ],
    correct: 0,
    explain: "The amnion encloses the amniotic cavity filled with amniotic fluid, providing a protective internal aquatic environment that allowed amniotes to reproduce on dry land independent of external water."
  },
  {
    id: "tcat-bio-220",
    subject: "Biology",
    topic: "Diversity of Plants & Animals",
    difficulty: "Hard",
    q: "In vascular plant xylem anatomy, what evolutionary structural adaptation distinguishes the vessel elements of angiosperms from the tracheids of gymnosperms?",
    options: [
      "Vessel elements possess perforated open end-plates forming continuous tubular conduits with lower hydraulic resistance",
      "Tracheids are completely devoid of pit membranes",
      "Vessel elements are living cells with dense cytoplasm",
      "Tracheids lack secondary lignified walls"
    ],
    correct: 0,
    explain: "Vessel elements are shorter, wider cells stacked end-to-end with open perforation plates, allowing bulk flow of water with significantly lower hydrodynamic resistance than tapered, pit-dependent tracheids."
  },
  {
    id: "tcat-bio-221",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "Which chamber of the human heart pumps oxygenated blood at high pressure into the systemic circulation via the aorta?",
    options: [
      "Left ventricle",
      "Right ventricle",
      "Left atrium",
      "Right atrium"
    ],
    correct: 0,
    explain: "The left ventricle has the thickest muscular myocardium, contracting during ventricular systole to eject oxygenated blood through the aortic semilunar valve into the aorta."
  },
  {
    id: "tcat-bio-222",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "What is the functional structural unit of the human kidney responsible for filtration, reabsorption, and urine formation?",
    options: [
      "Nephron",
      "Alveolus",
      "Hepatocyte",
      "Neuron"
    ],
    correct: 0,
    explain: "The nephron is the microscopic functional unit of the kidney, consisting of the renal corpuscle (glomerulus and Bowman's capsule) and renal tubule system."
  },
  {
    id: "tcat-bio-223",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "Which endocrine hormone secreted by the beta cells of the Islets of Langerhans promotes glucose uptake and lowers blood glucose levels?",
    options: [
      "Insulin",
      "Glucagon",
      "Epinephrine",
      "Cortisol"
    ],
    correct: 0,
    explain: "Insulin is an anabolic peptide hormone secreted by pancreatic beta cells in response to elevated blood glucose, stimulating GLUT4 translocation and glycogen synthesis."
  },
  {
    id: "tcat-bio-224",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "Which protein component of red blood cells reversibly binds molecular oxygen for transport from pulmonary capillaries to systemic tissues?",
    options: [
      "Hemoglobin",
      "Myoglobin",
      "Albumin",
      "Fibrinogen"
    ],
    correct: 0,
    explain: "Hemoglobin is a tetrameric globular metalloprotein in erythrocytes containing four iron-protoporphyrin IX heme groups, each cooperatively binding one O_2 molecule."
  },
  {
    id: "tcat-bio-225",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "What ion influx through voltage-gated channels triggers rapid depolarization during the upstroke of a neuronal action potential?",
    options: [
      "Sodium ion (Na+) influx",
      "Potassium ion (K+) efflux",
      "Chloride ion (Cl-) influx",
      "Calcium ion (Ca2+) efflux"
    ],
    correct: 0,
    explain: "Upon reaching threshold potential (-55 mV), voltage-gated Na+ channels open rapidly, allowing a surge of Na+ ions down their electrochemical gradient into the neuron (depolarization)."
  },
  {
    id: "tcat-bio-226",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "In skeletal muscle contraction, what regulatory protein is displaced when Ca2+ binds to Troponin C, exposing the myosin-binding sites on actin filaments?",
    options: [
      "Tropomyosin",
      "Titin",
      "Nebulin",
      "Myosin light chain"
    ],
    correct: 0,
    explain: "At rest, tropomyosin sterically blocks the myosin-binding sites on actin. When Ca2+ binds to Troponin C, a conformational shift rolls tropomyosin away, allowing cross-bridge formation."
  },
  {
    id: "tcat-bio-227",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "How does the Bohr Effect facilitate oxygen delivery to actively respiring metabolizing tissues?",
    options: [
      "Elevated CO_2 and H+ (lower pH) stabilize the deoxygenated T-state of hemoglobin, shifting the oxygen dissociation curve to the right and promoting O_2 release",
      "Elevated CO_2 increases hemoglobin affinity for O_2",
      "Decreased temperature shifts the curve to the right",
      "High tissue pH forces hemoglobin to bind oxygen tighter"
    ],
    correct: 0,
    explain: "The Bohr Effect describes how higher pCO_2 and lower pH (acidosis) in active tissues promote proton binding to hemoglobin, stabilizing the low-affinity T-state and offloading oxygen."
  },
  {
    id: "tcat-bio-228",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "In the nephron, how does the countercurrent multiplier mechanism in the loop of Henle generate an osmotic hypertonicity gradient in the renal medulla?",
    options: [
      "The descending limb is permeable to water but impermeable to NaCl, while the thick ascending limb actively pumps NaCl out while being impermeable to water",
      "The ascending limb passively reabsorbs water through aquaporins",
      "The descending limb actively secretes urea into the cortex",
      "The collecting duct actively pumps water into the renal vein"
    ],
    correct: 0,
    explain: "The countercurrent multiplier functions because the descending limb lets water exit via aquaporins into the hypertonic interstitium, while the ascending limb actively pumps Na+ and Cl- out into the interstitium while being water-impermeable."
  },
  {
    id: "tcat-bio-229",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "In the cardiac conduction cycle, why does the electrical impulse experience a physiological delay (~0.1 seconds) at the Atrioventricular (AV) node?",
    options: [
      "To ensure atrial systole is fully completed and ventricles are filled with blood before ventricular contraction commences",
      "To prevent the pacemaker from firing above 200 bpm",
      "To allow coronary arteries to fill during ventricular systole",
      "Because the AV node cells have larger diameters and faster conduction speeds"
    ],
    correct: 0,
    explain: "The AV nodal delay (~100 ms) allows the atria to fully contract and empty their blood into the ventricles (atrial kick) before the ventricles are stimulated to contract."
  },
  {
    id: "tcat-bio-230",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "What endocrine feedback cascade is initiated when the juxtaglomerular apparatus senses reduced renal perfusion pressure or decreased sodium delivery?",
    options: [
      "Renin-Angiotensin-Aldosterone System (RAAS)",
      "Hypothalamic-Pituitary-Thyroid Axis",
      "Atrial Natriuretic Peptide cascade",
      "Oxytocin positive feedback loop"
    ],
    correct: 0,
    explain: "Juxtaglomerular cells secrete Renin, which converts angiotensinogen to Angiotensin I. ACE converts it to Angiotensin II (vasoconstrictor), which stimulates Aldosterone release to increase Na+ and water retention."
  },
  {
    id: "tcat-bio-231",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Easy",
    q: "According to Chargaff's rules of base pairing in double-stranded DNA, which nucleotide base pairs specifically with Guanine via three hydrogen bonds?",
    options: [
      "Cytosine",
      "Thymine",
      "Adenine",
      "Uracil"
    ],
    correct: 0,
    explain: "In double-stranded DNA, Guanine pairs with Cytosine (forming three hydrogen bonds: G ≡ C), and Adenine pairs with Thymine (forming two hydrogen bonds: A = T)."
  },
  {
    id: "tcat-bio-232",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Easy",
    q: "In a classic Mendelian monohybrid cross between two heterozygous individuals (Aa x Aa), what is the expected phenotypic ratio among offspring showing complete dominance?",
    options: [
      "3 : 1",
      "1 : 2 : 1",
      "9 : 3 : 3 : 1",
      "1 : 1"
    ],
    correct: 0,
    explain: "A monohybrid cross of Aa x Aa yields genotype frequencies 1 AA : 2 Aa : 1 aa. With complete dominance of A over a, the dominant phenotype appears with probability 3/4 and recessive with 1/4 (3:1)."
  },
  {
    id: "tcat-bio-233",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Easy",
    q: "Which universal RNA codon designates the initiation start site for protein translation in almost all living organisms?",
    options: [
      "AUG (Methionine)",
      "UAA (Ochre)",
      "UAG (Amber)",
      "UGA (Opal)"
    ],
    correct: 0,
    explain: "AUG is the canonical start codon in mRNA, coding for the amino acid methionine in eukaryotes (N-formylmethionine in prokaryotes)."
  },
  {
    id: "tcat-bio-234",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Medium",
    q: "During DNA replication, which enzyme synthesizes short RNA primers that provide the essential free 3'-OH group required by DNA Polymerase?",
    options: [
      "Primase (RNA Polymerase)",
      "DNA Helicase",
      "DNA Ligase",
      "Single-Strand Binding Protein"
    ],
    correct: 0,
    explain: "DNA polymerases cannot initiate synthesis de novo; RNA Primase synthesizes an RNA primer (~10 nucleotides) providing the free 3'-hydroxyl group for extension."
  },
  {
    id: "tcat-bio-235",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Medium",
    q: "In the E. coli lactose operon (lac operon), what molecule functions as the inducer that binds the LacI repressor protein and causes its dissociation from the operator?",
    options: [
      "Allolactose",
      "Glucose",
      "Galactose",
      "Cyclic AMP (cAMP)"
    ],
    correct: 0,
    explain: "Allolactose (an isomer of lactose produced by beta-galactosidase) acts as the inducer by binding allosterically to the LacI repressor, causing it to detach from the lac operator."
  },
  {
    id: "tcat-bio-236",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Medium",
    q: "What is the term for a point mutation that substitutes a single nucleotide, resulting in a codon that specifies a completely different amino acid?",
    options: [
      "Missense mutation",
      "Nonsense mutation",
      "Silent mutation",
      "Frameshift mutation"
    ],
    correct: 0,
    explain: "A missense mutation changes a single nucleotide codon such that it encodes a different amino acid (e.g., sickle-cell anemia: GAG -> GUG, glutamic acid -> valine)."
  },
  {
    id: "tcat-bio-237",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Hard",
    q: "In eukaryotic pre-mRNA processing, what enzymatic ribonucleoprotein complex excises non-coding introns and splices coding exons together?",
    options: [
      "Spliceosome (snRNPs)",
      "Proteasome",
      "Ribosome",
      "Dicer enzyme"
    ],
    correct: 0,
    explain: "The spliceosome, composed of small nuclear RNAs and associated proteins (U1, U2, U4, U5, U6 snRNPs), recognizes 5' and 3' splice sites to excise introns as lariat structures."
  },
  {
    id: "tcat-bio-238",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Hard",
    q: "What proofreading enzymatic activity allows DNA Polymerase III to detect and excise improperly paired bases during DNA synthesis?",
    options: [
      "3' to 5' exonuclease activity",
      "5' to 3' exonuclease activity",
      "Endonuclease cleavage",
      "DNA topoisomerase untwisting"
    ],
    correct: 0,
    explain: "DNA Polymerase III possesses intrinsic 3' -> 5' exonuclease activity that proofreads newly incorporated bases, backing up and excising mismatched nucleotides."
  },
  {
    id: "tcat-bio-239",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Hard",
    q: "In epigenetic gene regulation, what is the consequence of enzymatic histone acetylation (by histone acetyltransferases / HATs) on chromatin structure?",
    options: [
      "Neutralizes positive charges on histone lysine tails, loosening chromatin from condensed heterochromatin to open euchromatin and activating transcription",
      "Condenses chromatin into transcriptionally silent heterochromatin",
      "Triggers immediate ubiquitin-mediated histone degradation",
      "Prevents RNA Polymerase II from binding to the TATA box"
    ],
    correct: 0,
    explain: "Histone acetyltransferases (HATs) add acetyl groups to basic lysine residues on histone tails, neutralizing their positive charge, weakening DNA-histone attraction, and opening chromatin into euchromatin."
  },
  {
    id: "tcat-bio-240",
    subject: "Biology",
    topic: "Genetics & Molecular Biology",
    difficulty: "Hard",
    q: "What phenomenon causes non-allelic genes located close together on the exact same chromosome to violate Mendel's Law of Independent Assortment?",
    options: [
      "Genetic linkage",
      "Epistasis",
      "Pleiotropy",
      "Incomplete dominance"
    ],
    correct: 0,
    explain: "Genetic linkage occurs when gene loci reside in physical proximity on the same chromosome; they tend to be inherited together as a linkage group unless separated by homologous recombination."
  },
  {
    id: "tcat-bio-241",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Easy",
    q: "What is the thermostable DNA polymerase commonly used in the Polymerase Chain Reaction (PCR) due to its resistance to high denaturation temperatures?",
    options: [
      "Taq Polymerase",
      "DNA Polymerase I",
      "RNA Polymerase II",
      "Reverse Transcriptase"
    ],
    correct: 0,
    explain: "Taq polymerase, isolated from the thermophilic bacterium Thermus aquaticus, remains catalytically active through repeated cycles of thermal denaturation at 95°C in PCR."
  },
  {
    id: "tcat-bio-242",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Easy",
    q: "In an ecological food chain, what ecological rule explains why only approximately 10% of total energy is transferred from one trophic level to the next higher level?",
    options: [
      "Lindeman's 10% Efficiency Law",
      "Bergmann's Rule",
      "Allen's Rule",
      "Gause's Principle"
    ],
    correct: 0,
    explain: "Raymond Lindeman's 10% Law states that only approximately 10% of energy stored as organic biomass is transferred from one trophic level to the next, with 90% lost to respiration and heat."
  },
  {
    id: "tcat-bio-243",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Easy",
    q: "Which technique separates fragmented DNA molecules according to their molecular size by migrating through a porous matrix under an electric field?",
    options: [
      "Agarose gel electrophoresis",
      "Chromatography",
      "Differential centrifugation",
      "Spectrophotometry"
    ],
    correct: 0,
    explain: "In agarose gel electrophoresis, negatively charged DNA fragments migrate toward the positive anode; smaller fragments travel faster through the gel pores, separating by size."
  },
  {
    id: "tcat-bio-244",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Medium",
    q: "What are the molecular \"scissors\" used in recombinant DNA technology to cleave DNA molecules at specific palindromic recognition sequences?",
    options: [
      "Restriction endonucleases",
      "DNA Ligases",
      "DNA Polymerases",
      "Alkaline phosphatases"
    ],
    correct: 0,
    explain: "Restriction endonucleases recognize specific palindromic nucleotide sequences (e.g., EcoRI recognizes 5'-GAATTC-3') and cleave phosphodiester bonds to produce sticky or blunt ends."
  },
  {
    id: "tcat-bio-245",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Medium",
    q: "In population ecology, what mathematical term represents the maximum population size that an environment can sustainably support indefinitely?",
    options: [
      "Carrying capacity (K)",
      "Biotic potential (r)",
      "Intrinsic rate of increase",
      "Environmental resistance"
    ],
    correct: 0,
    explain: "Carrying capacity (designated as K in the logistic growth equation dN/dt = rN(1 - N/K)) is the maximum sustainable population size determined by available resources."
  },
  {
    id: "tcat-bio-246",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Medium",
    q: "What ecological interaction describes a symbiotic relationship where one species benefits while the other species is neither harmed nor helped?",
    options: [
      "Commensalism",
      "Mutualism",
      "Parasitism",
      "Amensalism"
    ],
    correct: 0,
    explain: "Commensalism is an interspecific interaction in which one organism derives nutritional or protective benefit (+), while the host organism is unaffected (0) (e.g., epiphytes on trees)."
  },
  {
    id: "tcat-bio-247",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Hard",
    q: "In molecular genetics, what RNA-guided endonuclease system has been adapted for targeted genomic gene editing in living organisms?",
    options: [
      "CRISPR-Cas9 system",
      "Cre-LoxP recombinase",
      "TALENs (Transcription Activator-Like Effector Nucleases)",
      "Zinc-finger nucleases"
    ],
    correct: 0,
    explain: "The bacterial CRISPR-Cas9 system uses a single guide RNA (sgRNA) complementary to a 20-base genomic target adjacent to a Protospacer Adjacent Motif (PAM) to introduce site-specific double-strand breaks."
  },
  {
    id: "tcat-bio-248",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Hard",
    q: "According to Gause's Competitive Exclusion Principle, what occurs when two competing species occupy the exact same ecological niche with limited resources?",
    options: [
      "One species will inevitably outcompete and eliminate the other locally, or evolutionary resource partitioning will occur",
      "Both species will merge into a single hybrid population",
      "Both species will experience exponential population growth",
      "Predators will eliminate both species simultaneously"
    ],
    correct: 0,
    explain: "Gause's principle states that two species competing for the exact same limiting resources cannot coexist at constant population values; one will outcompete the other or undergo niche differentiation."
  },
  {
    id: "tcat-bio-249",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Hard",
    q: "What ecological process leads to excessive algae proliferation, surface scums, and subsequent deep-water hypoxia following runoff of agricultural nitrogen and phosphorus?",
    options: [
      "Cultural eutrophication",
      "Biomagnification",
      "Thermal inversion",
      "Acid precipitation"
    ],
    correct: 0,
    explain: "Eutrophication occurs when excess nutrient enrichment (phosphates/nitrates) stimulates dense algal blooms. Decomposition of dying biomass by aerobic bacteria depletes dissolved oxygen (hypoxia), killing aquatic fauna."
  },
  {
    id: "tcat-bio-250",
    subject: "Biology",
    topic: "Biotechnology & Ecology",
    difficulty: "Hard",
    q: "In the production of monoclonal antibodies using hybridoma technology, which two cell types are fused using polyethylene glycol (PEG)?",
    options: [
      "Antigen-sensitized splenic B lymphocytes and immortal myeloma (cancerous plasma) cells",
      "Cytotoxic T cells and erythrocytes",
      "Macrophage cells and bacterial plasmids",
      "Stem cells and viral capsids"
    ],
    correct: 0,
    explain: "Kohler and Milstein's hybridoma method fuses specific antibody-producing B lymphocytes from an immunized animal with immortal non-secreting myeloma cells to produce hybridomas secreting monoclonal antibodies."
  },
  {
    id: "tcat-bio-251",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "Which organelle is universally known as the powerhouse of the eukaryotic cell because it synthesizes the vast majority of ATP via oxidative phosphorylation?",
    options: ["Mitochondria","Golgi apparatus","Endoplasmic reticulum","Lysosome"],
    correct: 0,
    explain: "Mitochondria contain the electron transport chain and ATP synthase complexes on their cristae, generating cellular ATP through oxidative phosphorylation."
  },
  {
    id: "tcat-bio-252",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "In which specific sub-compartment of the chloroplast do the light-independent reactions (Calvin cycle) of photosynthesis take place?",
    options: ["Stroma","Thylakoid lumen","Outer chloroplast membrane","Granum membrane"],
    correct: 0,
    explain: "The Calvin cycle (dark reactions) takes place in the fluid-filled stroma of the chloroplast where RuBisCO and carbon fixation enzymes reside."
  },
  {
    id: "tcat-bio-253",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "What is the net yield of ATP molecules generated per single glucose molecule during the anaerobic glycolytic pathway?",
    options: ["2 net ATP","4 net ATP","36 net ATP","38 net ATP"],
    correct: 0,
    explain: "Glycolysis consumes 2 ATP molecules in its preparatory phase and synthesizes 4 ATP by substrate-level phosphorylation, yielding a net gain of 2 ATP."
  },
  {
    id: "tcat-bio-254",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Medium",
    q: "What is the terminal electron acceptor in the mitochondrial electron transport chain during aerobic cellular respiration?",
    options: ["Molecular Oxygen (O2)","Cytochrome c","NAD+","Ubiquinone (Coenzyme Q)"],
    correct: 0,
    explain: "Molecular oxygen (O2) acts as the terminal electron acceptor at Cytochrome c Oxidase (Complex IV), combining with protons to form water (H2O)."
  },
  {
    id: "tcat-bio-255",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Medium",
    q: "According to Peter Mitchell's Chemiosmotic Hypothesis, what electrochemical gradient directly drives the catalytic rotation of ATP Synthase (F0F1 complex)?",
    options: ["Proton motive force (proton concentration and electrical gradient) across the inner mitochondrial membrane","Sodium-potassium concentration gradient","Calcium ion influx across the nuclear envelope","Direct hydrolysis of GTP"],
    correct: 0,
    explain: "Protons pumped into the intermembrane space generate a proton motive force (PMF); the downhill flow of H+ through the F0 rotor subunit drives ATP synthesis in the F1 headpiece."
  },
  {
    id: "tcat-bio-256",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Medium",
    q: "In the Krebs citric acid cycle, which enzymatic reaction directly produces a high-energy nucleotide triphosphate via substrate-level phosphorylation?",
    options: ["Succinyl-CoA Synthetase (converting Succinyl-CoA to Succinate)","Citrate Synthase","Isocitrate Dehydrogenase","Malate Dehydrogenase"],
    correct: 0,
    explain: "The cleavage of the high-energy thioester bond of succinyl-CoA by succinyl-CoA synthetase couples with the phosphorylation of GDP to GTP (or ADP to ATP)."
  },
  {
    id: "tcat-bio-257",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Medium",
    q: "During non-cyclic photophosphorylation (Z-scheme), what biochemical reaction replenishes the electrons lost by the reaction center P680 of Photosystem II?",
    options: ["Photolysis of water (2H2O -> O2 + 4H+ + 4e-)","Oxidation of NADPH","Reduction of Plastoquinone","Decarboxylation of Malate"],
    correct: 0,
    explain: "The oxygen-evolving complex (OEC) associated with Photosystem II extracts electrons by photolysing water molecules, releasing O2 and protons into the thylakoid lumen."
  },
  {
    id: "tcat-bio-258",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "How does the uncoupling protein 1 (UCP-1 / Thermogenin) in brown adipose tissue alter mitochondrial bioenergetics?",
    options: ["Permits protons to re-enter the mitochondrial matrix without passing through ATP synthase, dissipating proton motive force as heat","Completely halts electron flow through Complex I","Increases ATP production by four-fold","Inhibits the tricarboxylic acid cycle"],
    correct: 0,
    explain: "Thermogenin (UCP-1) provides an alternative channel for proton conductance across the inner mitochondrial membrane, short-circuiting the proton gradient and releasing energy as non-shivering thermogenesis."
  },
  {
    id: "tcat-bio-259",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "In C4 photosynthetic plants, what enzyme initially fixes atmospheric carbon dioxide into a 4-carbon oxaloacetate molecule in mesophyll cells?",
    options: ["Phosphoenolpyruvate (PEP) Carboxylase","RuBisCO","Pyruvate Dehydrogenase","Carbonic Anhydrase"],
    correct: 0,
    explain: "PEP carboxylase has a high affinity for HCO3- and zero oxygenase activity, fixing CO2 to phosphoenolpyruvate to form oxaloacetate in mesophyll cells, avoiding photorespiration."
  },
  {
    id: "tcat-bio-260",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "Why does photorespiration (C2 cycle) decrease photosynthetic efficiency in C3 plants under high temperatures and elevated O2 concentrations?",
    options: ["RuBisCO acts as an oxygenase, producing 2-phosphoglycolate which consumes ATP and NADPH to salvage without fixing net carbon","It destroys the thylakoid membrane structure","It uncouples chlorophyll from the reaction centers","It converts glucose back into starch irreversibly"],
    correct: 0,
    explain: "At higher temperatures, RuBisCO oxygenase activity increases relative to carboxylase activity, fixing O2 to RuBP to yield 3-PGA and toxic 2-phosphoglycolate, which costs energy to salvage in peroxisomes and mitochondria."
  },
  {
    id: "tcat-bio-261",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "What chemical covalent bond links adjacent monosaccharide monomers together during polysaccharide synthesis?",
    options: ["Glycosidic bond","Peptide bond","Phosphodiester bond","Ester linkage"],
    correct: 0,
    explain: "Monosaccharides are joined by condensation reactions forming covalent glycosidic linkages (e.g., α-1,4 or β-1,4 glycosidic bonds)."
  },
  {
    id: "tcat-bio-262",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "Which nitrogenous base is present in ribonucleic acid (RNA) but replaced by Thymine in deoxyribonucleic acid (DNA)?",
    options: ["Uracil","Guanine","Cytosine","Adenine"],
    correct: 0,
    explain: "RNA contains Uracil in place of Thymine; both are pyrimidines that base-pair complementary with Adenine."
  },
  {
    id: "tcat-bio-263",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "What type of lipid molecule forms the fundamental bilayer matrix of biological cell membranes?",
    options: ["Phospholipids","Triglycerides","Waxes","Prostaglandins"],
    correct: 0,
    explain: "Phospholipids are amphipathic molecules with hydrophilic phosphate head groups and hydrophobic fatty acid tails, naturally organizing into lipid bilayers in aqueous environments."
  },
  {
    id: "tcat-bio-264",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "What type of chemical reaction breaks polymers down into constituent monomers with the consumption of a water molecule?",
    options: ["Hydrolysis reaction","Condensation reaction","Polymerization","Oxidation-reduction"],
    correct: 0,
    explain: "Hydrolysis cleavage uses a water molecule (H+ and OH-) to cleave covalent bonds between polymer sub-units."
  },
  {
    id: "tcat-bio-265",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "What secondary protein structure is stabilized primarily by localized hydrogen bonding between carbonyl oxygen (C=O) and amide hydrogen (N-H) along the polypeptide backbone?",
    options: ["Alpha-helix and Beta-pleated sheet","Disulfide bridge framework","Quaternary subunit assembly","Hydrophobic core packing"],
    correct: 0,
    explain: "Protein secondary structures (α-helices and β-sheets) are maintained exclusively by regular hydrogen bonds between peptide backbone atoms."
  },
  {
    id: "tcat-bio-266",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "In enzyme kinetics, how does a competitive inhibitor affect the Michaelis constant (Km) and maximum velocity (Vmax) of an enzyme-catalyzed reaction?",
    options: ["Increases apparent Km while leaving Vmax unchanged","Decreases Vmax while leaving Km unchanged","Decreases both Km and Vmax","Increases Vmax and decreases Km"],
    correct: 0,
    explain: "Competitive inhibitors bind reversibly to the catalytic active site. Excess substrate outcompetes the inhibitor, restoring the same maximum velocity (Vmax unchanged), but requiring a higher substrate concentration (Km increases)."
  },
  {
    id: "tcat-bio-267",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "Which structural polysaccharide composed of unbranched β-1,4-glycosidic linked D-glucose chains confers tensile strength to plant cell walls?",
    options: ["Cellulose","Starch (Amylose)","Glycogen","Chitin"],
    correct: 0,
    explain: "Cellulose consists of linear β-1,4-glucan chains held together by extensive inter- and intra-molecular hydrogen bonds into rigid microfibrils."
  },
  {
    id: "tcat-bio-268",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "What thermodynamic driving force predominantly stabilizes the tertiary conformation of globular water-soluble proteins in aqueous cellular environments?",
    options: ["The Hydrophobic Effect (entropic gain of surrounding water molecules as non-polar residues sequester into the interior)","Covalent peptide bonds exclusively","Ionic salt bridges between all surface residues","Magnetic orientation of iron atoms"],
    correct: 0,
    explain: "Burial of nonpolar amino acid side chains inside the protein core minimizes clathrate water cages, increasing the entropy of solvent water molecules, which drives tertiary folding."
  },
  {
    id: "tcat-bio-269",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "What is the biochemical significance of phosphodiester linkages possessing negative charges at physiological pH in the structural integrity of DNA?",
    options: ["Repels nucleophilic attack by hydroxyl ions, shielding the phosphodiester backbone from spontaneous hydrolytic cleavage","Attracts negatively charged lipid membranes","Prevents transcription factors from binding","Facilitates binding of negative tRNA anticodons"],
    correct: 0,
    explain: "The repeating negative charges on the phosphate groups (pKa ~ 1) protect the phosphodiester backbone from hydrolytic attack by repelling nucleophiles like hydroxide ions (OH-)."
  },
  {
    id: "tcat-bio-270",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "How does an allosteric non-competitive enzyme inhibitor affect the Lineweaver-Burk double reciprocal plot (1/V versus 1/[S])?",
    options: ["Increases the y-intercept (1/Vmax) while leaving the x-intercept (-1/Km) unchanged","Increases the x-intercept while leaving the y-intercept unchanged","Shifts the plot parallel downwards","Rotates the line about the origin"],
    correct: 0,
    explain: "Pure non-competitive inhibitors decrease Vmax (so 1/Vmax increases, raising the y-intercept) without affecting affinity for substrate (Km and x-intercept -1/Km remain constant)."
  },
  {
    id: "tcat-bio-271",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "Which chamber of the human heart possesses the thickest muscular myocardium to generate sufficient pressure for systemic arterial circulation?",
    options: ["Left ventricle","Right ventricle","Left atrium","Right atrium"],
    correct: 0,
    explain: "The left ventricle pumps oxygenated blood through the high-resistance systemic circulation via the aorta, requiring a myocardium 3 times thicker than the right ventricle."
  },
  {
    id: "tcat-bio-272",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "What functional microscopic unit of the human kidney is responsible for filtering blood plasma and producing urine?",
    options: ["Nephron","Alveolus","Hepatocyte","Osteon"],
    correct: 0,
    explain: "The nephron is the microscopic structural and functional filtration unit of the mammalian kidney."
  },
  {
    id: "tcat-bio-273",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "Where in the human digestive tract does the greatest extent of nutrient digestion and enzymatic absorption occur?",
    options: ["Small intestine (duodenum and jejunum)","Stomach","Large intestine (colon)","Esophagus"],
    correct: 0,
    explain: "The small intestine (particularly the duodenum and jejunum) contains extensive villi and microvilli, providing huge surface area for chemical digestion and nutrient absorption."
  },
  {
    id: "tcat-bio-274",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "How does the Bohr effect facilitate the release of oxygen from oxyhemoglobin in actively metabolizing peripheral tissues?",
    options: ["Elevated CO2 and lowered pH (acidosis) decrease hemoglobin's oxygen affinity, shifting the dissociation curve to the right","Increased oxygen partial pressure forces oxygen unloading","Decreased temperature shifts the dissociation curve to the right","Lowered 2,3-BPG levels increase oxygen release"],
    correct: 0,
    explain: "The Bohr effect describes how increased pCO2 and H+ concentration (lower pH) in active tissues stabilize the deoxygenated T-state of hemoglobin, shifting the curve right and releasing O2."
  },
  {
    id: "tcat-bio-275",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "What role does the loop of Henle play in the renal medulla of mammalian kidneys?",
    options: ["Establishes a hyperosmotic medullary concentration gradient via countercurrent multiplication","Directly reabsorbs all glucose and amino acids","Secretes erythropoietin into renal capillaries","Filters large plasma proteins into Bowman's space"],
    correct: 0,
    explain: "The loop of Henle operates as a countercurrent multiplier, pumping NaCl from the ascending limb to build a hypertonic osmotic gradient in the medullary interstitium for water reabsorption."
  },
  {
    id: "tcat-bio-276",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "In the cardiac conduction system, which node functions as the primary intrinsic pacemaker of the heart under normal physiological conditions?",
    options: ["Sinoatrial (SA) node","Atrioventricular (AV) node","Bundle of His","Purkinje fibers"],
    correct: 0,
    explain: "The SA node in the right atrium exhibits the fastest spontaneous diastolic depolarization rate (~70-80 bpm), entraining the rest of the heart as the primary pacemaker."
  },
  {
    id: "tcat-bio-277",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "What is the primary physiological function of pulmonary surfactant produced by Type II alveolar pneumocytes in the lungs?",
    options: ["Reduces alveolar surface tension, preventing atelectasis (alveolar collapse) at low lung volumes during exhalation","Transports oxygen across the capillary endothelium","Neutralizes inhaled pathogens chemically","Constricts bronchioles during exercise"],
    correct: 0,
    explain: "Pulmonary surfactant (dipalmitoylphosphatidylcholine) disrupts cohesive water hydrogen bonds at the alveolar air-liquid interface, reducing surface tension and stabilizing alveoli against collapse."
  },
  {
    id: "tcat-bio-278",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "How does the Renin-Angiotensin-Aldosterone System (RAAS) restore mean arterial pressure upon sensing hypotension or reduced renal perfusion pressure?",
    options: ["Juxtaglomerular cells secrete renin, cleaving angiotensinogen to angiotensin I; ACE converts it to angiotensin II, which induces potent vasoconstriction and stimulates aldosterone release","Renin directly opens renal water channels without hormones","Angiotensin II dilates systemic arterioles to decrease vascular resistance","Aldosterone causes immediate excretion of sodium ions in the proximal tubule"],
    correct: 0,
    explain: "Renin cleaves angiotensinogen to Ang I; pulmonary ACE converts it to Ang II, causing systemic vasoconstriction and prompting adrenal aldosterone secretion to promote renal Na+ and water retention."
  },
  {
    id: "tcat-bio-279",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "What physiological mechanism mediates the chloride shift (Hamburger phenomenon) across erythrocyte membranes in systemic capillary beds?",
    options: ["Exchange of bicarbonate (HCO3-) ions moving out into plasma for chloride (Cl-) ions moving into erythrocytes via an anion exchanger","Active transport of Cl- using ATP hydrolysis","Cotransport of sodium and chloride through leak channels","Diffusion of chlorine gas through lipid rafts"],
    correct: 0,
    explain: "Carbonic anhydrase inside RBCs produces HCO3- from CO2; the Band 3 (AE1) antiporter exports HCO3- into plasma in exchange for Cl- entering the erythrocyte to maintain electrical neutrality."
  },
  {
    id: "tcat-bio-280",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "In the cardiac ventricular action potential, what ionic current accounts for the prolonged phase 2 plateau unique to cardiac myocytes?",
    options: ["Inward flux of Ca2+ ions through L-type calcium channels balancing outward K+ efflux","Massive influx of fast Na+ ions","Rapid influx of Cl- ions through GABA receptors","Shutting down of all ion channels completely"],
    correct: 0,
    explain: "The plateau phase 2 is maintained by sustained inward Ca2+ current through voltage-gated L-type channels balanced by outward K+ flow through delayed rectifier channels, prolonging the refractory period."
  },
  {
    id: "tcat-bio-281",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "What expected phenotypic ratio is obtained in the F2 generation of a classic Mendelian monohybrid cross between two heterozygous individuals (Aa x Aa) with complete dominance?",
    options: ["3 : 1","1 : 2 : 1","9 : 3 : 3 : 1","1 : 1"],
    correct: 0,
    explain: "Crossing Aa x Aa yields genotypes 1 AA : 2 Aa : 1 aa, which manifest phenotypically as 3 dominant to 1 recessive (3 : 1 ratio)."
  },
  {
    id: "tcat-bio-282",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "Which enzyme synthesizes a complementary DNA strand by polymerizing deoxynucleotide triphosphates during DNA replication?",
    options: ["DNA Polymerase","RNA Polymerase","DNA Ligase","Topoisomerase"],
    correct: 0,
    explain: "DNA Polymerase synthesizes new DNA strands in the 5' to 3' direction by adding complementary dNTPs to a free 3'-OH group."
  },
  {
    id: "tcat-bio-283",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "What molecular tools act as \"molecular scissors\" by recognizing and cleaving specific palindromic DNA sequences?",
    options: ["Restriction Endonucleases","DNA Ligases","Ribosomes","Reverse Transcriptases"],
    correct: 0,
    explain: "Restriction endonucleases (restriction enzymes) cleave double-stranded DNA at specific palindromic recognition sequences, creating sticky or blunt ends."
  },
  {
    id: "tcat-bio-284",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "In the Polymerase Chain Reaction (PCR), what is the correct chronological sequence of the three thermal cycling steps?",
    options: ["Denaturation (~95°C) -> Primer Annealing (~55°C) -> Extension (~72°C)","Annealing (~55°C) -> Extension (~72°C) -> Denaturation (~95°C)","Denaturation (~95°C) -> Extension (~72°C) -> Annealing (~55°C)","Extension (~72°C) -> Denaturation (~95°C) -> Annealing (~55°C)"],
    correct: 0,
    explain: "PCR cycling proceeds in 3 steps: 1) Thermal denaturation separates DNA strands (~95°C), 2) Primer annealing binds oligonucleotide primers (~55°C), 3) Extension by Taq polymerase synthesizes new strands (~72°C)."
  },
  {
    id: "tcat-bio-285",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "How did the Meselson-Stahl experiment (1958) using 15N and 14N isotopes definitively demonstrate the mode of DNA replication?",
    options: ["Proved that DNA replicates semi-conservatively (each daughter duplex contains one parental and one nascent strand)","Proved that DNA replication is fully conservative","Demonstrated that DNA replication is purely dispersive","Showed that genetic material is composed of protein"],
    correct: 0,
    explain: "By tracking density gradients of DNA in CsCl after one and two rounds of replication in 14N media, Meselson and Stahl proved semi-conservative replication."
  },
  {
    id: "tcat-bio-286",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "In a dihybrid test cross involving two genes that are located on the same chromosome, what indicates that genetic linkage has occurred?",
    options: ["Recombinant offspring frequency is significantly less than 50%","Recombinant offspring frequency is exactly 50%","Offspring exhibit a 9:3:3:1 phenotypic ratio","Only male progeny show the recombinant phenotype"],
    correct: 0,
    explain: "Unlinked genes assort independently, producing 50% recombinants. A recombination frequency strictly less than 50% confirms that the genes are syntenic and linked on the same chromosome."
  },
  {
    id: "tcat-bio-287",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "In the prokaryotic lac operon, what biochemical event occurs in the presence of both high lactose and high glucose concentrations?",
    options: ["Allolactose binds the LacI repressor causing it to dissociate, but low cAMP prevents CAP-cAMP activation, resulting in basal (very low) transcription","High transcription of lacZ, lacY, and lacA genes","The repressor permanently binds the operator region","RNA polymerase is degraded by proteasomes"],
    correct: 0,
    explain: "When lactose is present, allolactose inactives the repressor. However, high glucose inhibits adenylate cyclase, resulting in low cAMP; without active CAP-cAMP, RNA polymerase binds inefficiently, yielding only minimal basal transcription."
  },
  {
    id: "tcat-bio-288",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "What is the precise biochemical mechanism of the CRISPR-Cas9 genome editing platform?",
    options: ["A single guide RNA (sgRNA) guides Cas9 endonuclease to a complementary target sequence adjacent to a Protospacer Adjacent Motif (PAM), where it induces a double-strand break (DSB)","Cas9 methylates cytosine bases in promoter regions without cutting DNA","Cas9 inserts viral retrotransposons randomly into heterochromatin","CRISPR synthesizes cDNA from mature cytoplasmic mRNA"],
    correct: 0,
    explain: "The synthetic sgRNA matches a 20-nt target sequence upstream of a 5'-NGG PAM site; Cas9 uses its RuvC and HNH nuclease domains to generate a precise blunt-ended double-strand DNA break."
  },
  {
    id: "tcat-bio-289",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "How does Sanger dideoxy DNA sequencing terminate chain elongation during automated capillary electrophoresis?",
    options: ["Incorporation of 2',3'-dideoxynucleotide triphosphates (ddNTPs) lacking a 3'-OH group prevents phosphodiester bond formation with subsequent incoming nucleotides","Dideoxynucleotides cleave the phosphate backbone hydrolytically","ddNTPs bind irreversibly to the active site of DNA ligase","ddNTPs introduce thymine dimers that stall replication"],
    correct: 0,
    explain: "ddNTPs lack the essential 3'-hydroxyl group required for condensation with the 5'-phosphate of the next dNTP; once incorporated by DNA polymerase, elongation halts permanently."
  },
  {
    id: "tcat-bio-290",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "In eukaryotic post-transcriptional gene silencing mediated by RNA interference (RNAi), what is the function of the enzyme Dicer?",
    options: ["Cleaves double-stranded precursor RNA (dsRNA/pre-miRNA) into short ~21-23 nucleotide siRNA or miRNA duplexes","Degrades ribosomal RNA in the nucleolus","Transcribes non-coding DNA in telomeric repeats","Synthesizes the poly-A tail onto pre-mRNA"],
    correct: 0,
    explain: "Dicer is an RNase III endonuclease that processes long double-stranded RNAs or hairpin pre-miRNAs into short 21-23 nucleotide interfering duplexes that are loaded into the RISC complex."
  },
  {
    id: "tcat-bio-291",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "What anatomical connective tissue bands connect skeletal muscles directly to bones?",
    options: ["Tendons","Ligaments","Cartilage","Fascia"],
    correct: 0,
    explain: "Tendons are dense regular collagenous connective tissues that anchor skeletal muscles to periosteum of bones."
  },
  {
    id: "tcat-bio-292",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "What is the basic functional contractile unit of a skeletal muscle myofibril delimited between two adjacent Z-lines?",
    options: ["Sarcomere","Sarcolemma","Myosin head","Sarcoplasmic reticulum"],
    correct: 0,
    explain: "The sarcomere is the repeating structural and functional contractile unit of striated muscle tissue extending between two successive Z-lines."
  },
  {
    id: "tcat-bio-293",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "Which mineral ion is released from the sarcoplasmic reticulum to trigger cross-bridge cycling during skeletal muscle contraction?",
    options: ["Calcium (Ca2+)","Sodium (Na+)","Potassium (K+)","Iron (Fe2+)"],
    correct: 0,
    explain: "Depolarization of T-tubules triggers the release of Ca2+ from the terminal cisternae of the sarcoplasmic reticulum into the sarcoplasm to initiate contraction."
  },
  {
    id: "tcat-bio-294",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "According to the Sliding Filament Theory, which band of the sarcomere shortens in length during active muscle contraction?",
    options: ["I-band and H-zone","A-band","Z-line width","M-line thickness"],
    correct: 0,
    explain: "During cross-bridge cycling, actin filaments are pulled toward the center of the sarcomere; the A-band length remains constant while both the I-band and H-zone shorten."
  },
  {
    id: "tcat-bio-295",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "What biochemical event causes the myosin head to detach from the actin filament during the cross-bridge cycle?",
    options: ["Binding of a new ATP molecule to the myosin head","Hydrolysis of ATP into ADP and inorganic phosphate","Release of Ca2+ into the extracellular space","Binding of acetylcholine to the sarcolemma"],
    correct: 0,
    explain: "Binding of a new ATP molecule to the nucleotide-binding pocket on the myosin head causes a conformational change that dissociates the myosin head from the actin active site."
  },
  {
    id: "tcat-bio-296",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "What type of synovial joint permits universal multi-axial movement across all three rotational planes (e.g., glenohumeral and hip joints)?",
    options: ["Ball-and-socket joint","Hinge joint","Pivot joint","Saddle joint"],
    correct: 0,
    explain: "Ball-and-socket joints (spheroidal joints) provide multiaxial degrees of freedom, permitting flexion, extension, abduction, adduction, circumduction, and rotation."
  },
  {
    id: "tcat-bio-297",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "What is the molecular pathogenesis of rigor mortis in skeletal muscle following somatic death?",
    options: ["Cessation of metabolic ATP production prevents ATP from binding to myosin heads, locking actin-myosin cross-bridges in an irreversible rigor state","Excessive accumulation of acetylcholine in synaptic clefts","Instantaneous degradation of all actin filaments by proteases","Hyperpolarization of motor neuron axons"],
    correct: 0,
    explain: "Following death, ATP synthesis ceases. Without ATP, myosin heads cannot detach from actin filaments, trapping muscles in continuous rigidity until enzymatic autolysis occurs."
  },
  {
    id: "tcat-bio-298",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "In the excitation-contraction coupling of skeletal muscle, what mechanical interaction bridges the T-tubule membrane to the sarcoplasmic reticulum?",
    options: ["Conformational coupling between dihydropyridine receptors (DHPR) on T-tubules and ryanodine receptors (RyR1) on the sarcoplasmic reticulum","Free diffusion of sodium across desmosomes","Direct electrical transmission across gap junctions","Phosphorylation of myosin light chains by calmodulin"],
    correct: 0,
    explain: "Depolarization activates voltage-sensing dihydropyridine receptors (DHPR / CaV1.1) in T-tubules, mechanically triggering the opening of junctional ryanodine receptor (RyR1) Ca2+ release channels."
  },
  {
    id: "tcat-bio-299",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "What regulatory subunit of the troponin complex binds calcium ions to induce the conformational displacement of tropomyosin off actin active sites?",
    options: ["Troponin C (TnC)","Troponin I (TnI)","Troponin T (TnT)","G-actin monomer"],
    correct: 0,
    explain: "Troponin C contains EF-hand motifs that bind Ca2+ ions, triggering a conformational shift in Troponin T and Troponin I that pulls tropomyosin away from the myosin-binding sites on actin."
  },
  {
    id: "tcat-bio-300",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "What is the standard resting membrane potential of a typical mammalian neuron?",
    options: ["-70 mV","+30 mV","0 mV","-90 mV"],
    correct: 0,
    explain: "The typical resting membrane potential of a mammalian neuron is approximately -70 mV, established by the Na+/K+ ATPase and passive K+ leak channels."
  },
  {
    id: "tcat-bio-301",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "Which endocrine hormone produced by beta cells of the islets of Langerhans lowers blood glucose levels by promoting cellular glucose uptake and glycogenesis?",
    options: ["Insulin","Glucagon","Cortisol","Epinephrine"],
    correct: 0,
    explain: "Insulin promotes translocation of GLUT4 transporters to cell surfaces, stimulating glucose uptake into skeletal muscle and adipose tissue and promoting glycogen synthesis."
  },
  {
    id: "tcat-bio-302",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "What insulating glial sheath covers the axons of peripheral nerves to increase the conduction velocity of nerve impulses?",
    options: ["Myelin sheath","Ependymal lining","Basement membrane","Astrocyte podosome"],
    correct: 0,
    explain: "The myelin sheath (formed by Schwann cells in the PNS and oligodendrocytes in the CNS) electrically insulates axons, facilitating rapid saltatory conduction."
  },
  {
    id: "tcat-bio-303",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "During the rising depolarization phase of a neuronal action potential, which ion channels open rapidly in response to reaching threshold potential?",
    options: ["Voltage-gated Sodium (Na+) channels","Voltage-gated Potassium (K+) channels","Chloride (Cl-) leak channels","ATP-dependent proton pumps"],
    correct: 0,
    explain: "Reaching threshold potential (~ -55 mV) opens voltage-gated Na+ activation gates, causing rapid influx of Na+ down its electrochemical gradient to depolarize the membrane toward +30 mV."
  },
  {
    id: "tcat-bio-304",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "What mode of rapid action potential propagation occurs in myelinated neurons, where depolarization jumps between unmyelinated nodes of Ranvier?",
    options: ["Saltatory conduction","Continuous conduction","Electrotonic decrement","Retrograde axonal transport"],
    correct: 0,
    explain: "In myelinated axons, action potentials regenerate exclusively at the nodes of Ranvier where voltage-gated Na+ channels are clustered, \"jumping\" from node to node via saltatory conduction."
  },
  {
    id: "tcat-bio-305",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "What second messenger is synthesized inside target cells when epinephrine binds to cell-surface beta-adrenergic receptors linked to Gs proteins?",
    options: ["Cyclic AMP (cAMP)","Inositol trisphosphate (IP3)","cGMP","Nitric Oxide"],
    correct: 0,
    explain: "Gs activation stimulates adenylyl cyclase, converting ATP into the intracellular second messenger cyclic adenosine monophosphate (cAMP), which activates Protein Kinase A."
  },
  {
    id: "tcat-bio-306",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "How do steroid hormones (e.g., cortisol, aldosterone, estrogen) differ from peptide hormones in their mechanism of cellular signal transduction?",
    options: ["They are lipophilic, passively crossing the plasma membrane to bind intracellular nuclear receptors that act directly as ligand-activated transcription factors","They bind exclusively to extracellular G-protein coupled receptors","They require second messengers like cAMP to alter enzyme activity","They are degraded instantaneously in the bloodstream within microseconds"],
    correct: 0,
    explain: "Steroid hormones are lipophilic derivatives of cholesterol that diffuse across plasma membranes to bind cytosolic or nuclear hormone receptors, translocating to hormone response elements on DNA."
  },
  {
    id: "tcat-bio-307",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "At chemical synapses, what influx of ions into the presynaptic terminal triggers the exocytosis of neurotransmitter-filled synaptic vesicles?",
    options: ["Influx of Calcium ions (Ca2+) through voltage-gated calcium channels","Efflux of Potassium ions (K+)","Influx of Magnesium ions (Mg2+)","Outflow of Sodium ions (Na+)"],
    correct: 0,
    explain: "Action potential arrival depolarizes the presynaptic bouton, opening voltage-gated Ca2+ channels; Ca2+ influx binds synaptotagmin, triggering SNARE-mediated vesicle fusion with the presynaptic membrane."
  },
  {
    id: "tcat-bio-308",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "What is the primary neurochemical mechanism of inhibitory postsynaptic potentials (IPSPs) mediated by GABA_A receptors in the central nervous system?",
    options: ["GABA_A receptors act as ligand-gated chloride (Cl-) channels, permitting Cl- influx that hyperpolarizes the postsynaptic membrane","GABA_A receptors open sodium channels to depolarize the dendrite","GABA_A blocks potassium efflux entirely","GABA_A pumps calcium into mitochondria"],
    correct: 0,
    explain: "GABA_A receptors are ionotropic chloride channels. Binding GABA triggers Cl- influx down its electrochemical gradient, hyperpolarizing the neuron below resting potential and reducing excitability."
  },
  {
    id: "tcat-bio-309",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "In the female menstrual cycle, an abrupt mid-cycle surge of which pituitary gonadotropic hormone triggers ovulation?",
    options: ["Luteinizing Hormone (LH)","Follicle-Stimulating Hormone (FSH)","Progesterone","Prolactin"],
    correct: 0,
    explain: "A surge in estrogen from the dominant Graafian follicle switches to positive feedback, triggering a massive LH surge from the anterior pituitary that induces ovulation within 24-36 hours."
  },
  {
    id: "tcat-bio-310",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "In human anatomy, where does fertilization of the ovum by a spermatozoon normally take place under healthy conditions?",
    options: ["Ampulla of the fallopian tube (oviduct)","Uterine cavity","Cervix","Ovary surface"],
    correct: 0,
    explain: "Fertilization normally occurs in the ampulla, the longest and widest section of the fallopian tube (oviduct)."
  },
  {
    id: "tcat-bio-311",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "What steroid hormone secreted by the corpus luteum maintains the vascularized secretory endometrium necessary for embryo implantation?",
    options: ["Progesterone","Testosterone","Oxytocin","Growth hormone"],
    correct: 0,
    explain: "The corpus luteum secretes high levels of progesterone, which converts the uterine endometrium into a nutrient-rich, vascular secretory bed for pregnancy maintenance."
  },
  {
    id: "tcat-bio-312",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "During early mammalian embryogenesis, what is the hollow spherical stage of development characterized by an outer trophoblast layer and an inner cell mass (ICM)?",
    options: ["Blastocyst","Morula","Gastrula","Zygote"],
    correct: 0,
    explain: "The blastocyst consists of an outer sphere of trophoblast cells (giving rise to the placenta) surrounding a fluid-filled blastocoel and an inner cell mass (giving rise to the embryo proper)."
  },
  {
    id: "tcat-bio-313",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "What embryonic developmental process establishes the three primary germ layers: ectoderm, mesoderm, and endoderm?",
    options: ["Gastrulation","Cleavage","Neurulation","Capacitation"],
    correct: 0,
    explain: "Gastrulation involves morphogenetic cell migrations that convert the single-layered blastula into a trilaminar embryo with ectoderm, mesoderm, and endoderm."
  },
  {
    id: "tcat-bio-314",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "In spermatogenesis, what testicular cells located in the seminiferous tubules provide metabolic support, nourishment, and regulatory cues to developing spermatids?",
    options: ["Sertoli cells (sustentacular cells)","Leydig cells (interstitial cells)","Primary spermatocytes","Follicular cells"],
    correct: 0,
    explain: "Sertoli cells form the blood-testis barrier, provide nutrients and phagocytose residual cytoplasm, nourishing developing spermatozoa under FSH stimulation."
  },
  {
    id: "tcat-bio-315",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "How does the cortical reaction execute the slow block to polyspermy upon sperm penetration of the oocyte plasma membrane?",
    options: ["Intracellular Ca2+ wave triggers exocytosis of cortical granules, releasing proteases that cleave ZP3 receptors and cross-link the zona pellucida into an impenetrable fertilization envelope","Instantaneous influx of sodium ions hyperpolarizes the egg membrane permanently","Rapid secretion of hydrochloric acid into the perivitelline space","Destruction of all maternal mitochondria"],
    correct: 0,
    explain: "Sperm-egg fusion triggers an intracellular Ca2+ wave that causes exocytosis of cortical granules. Enzymes modify zona pellucida proteins (cleaving ZP3 and hardening ZP2), creating the permanent slow block to polyspermy."
  },
  {
    id: "tcat-bio-316",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "What embryonic structure secretes human Chorionic Gonadotropin (hCG) to rescue the maternal corpus luteum from degeneration during early pregnancy?",
    options: ["Syncytiotrophoblast of the blastocyst","Epiblast of the inner cell mass","Endometrial stromal cells","Maternal anterior pituitary gland"],
    correct: 0,
    explain: "The invading syncytiotrophoblast secretes hCG, which binds LH receptors on the corpus luteum to maintain progesterone production until placental luteal shift at ~8-10 weeks."
  },
  {
    id: "tcat-bio-317",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "Which primary embryonic germ layer gives rise to the central and peripheral nervous systems, epidermis, and neural crest derivatives in vertebrate development?",
    options: ["Ectoderm","Mesoderm","Endoderm","Hypoblast"],
    correct: 0,
    explain: "The ectoderm differentiates into the surface ectoderm (epidermis, hair, nails) and neuroectoderm (neural tube giving rise to CNS; neural crest giving rise to PNS, melanocytes, and craniofacial bones)."
  },
  {
    id: "tcat-bio-318",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "What ecological term describes the maximum population size of a species that a particular environment can sustain indefinitely given available food, water, and habitat?",
    options: ["Carrying capacity (K)","Biotic potential","Intrinsic rate of increase (r)","Ecological footprint"],
    correct: 0,
    explain: "Carrying capacity (symbolized as K) is the maximum population density an ecosystem can support indefinitely without environmental degradation."
  },
  {
    id: "tcat-bio-319",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "What form of symbiotic relationship benefits one organism while the host organism is neither harmed nor helped (e.g., barnacles attached to a whale)?",
    options: ["Commensalism","Mutualism","Parasitism","Amensalism"],
    correct: 0,
    explain: "Commensalism (+/0) is a symbiotic interaction where one partner benefits while the other experiences no significant positive or negative consequence."
  },
  {
    id: "tcat-bio-320",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "Structures in different species that share common evolutionary ancestry and anatomical origins despite performing different functions (e.g., human arm and bat wing) are called:",
    options: ["Homologous structures","Analogous structures","Vestigial structures","Atavistic traits"],
    correct: 0,
    explain: "Homologous structures share common ancestral anatomical derivation via divergent evolution, even if adapted for distinct functions like swimming, flying, or grasping."
  },
  {
    id: "tcat-bio-321",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "According to Lindeman's 10% Ecological Efficiency Law, approximately what percentage of energy is transferred from one trophic level to the next higher level in a food web?",
    options: ["10%","50%","1%","90%"],
    correct: 0,
    explain: "Roughly 10% of net energy transfers from one trophic level to the next; ~90% is dissipated as metabolic heat, respiration, or unassimilated waste."
  },
  {
    id: "tcat-bio-322",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "Under the Hardy-Weinberg equilibrium principle for a two-allele locus (p + q = 1), what formula represents the expected frequency of heterozygous individuals in the population?",
    options: ["2pq","p^2","q^2","p^2 + q^2"],
    correct: 0,
    explain: "In the binomial expansion (p + q)^2 = p^2 + 2pq + q^2 = 1, 2pq represents the theoretical proportion of heterozygous individuals (Aa)."
  },
  {
    id: "tcat-bio-323",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "What evolutionary speciation mechanism occurs when a geographic barrier (e.g., mountain range, river bifurcation) physically isolates subpopulations, preventing gene flow?",
    options: ["Allopatric speciation","Sympatric speciation","Parapatric speciation","Peripatric speciation"],
    correct: 0,
    explain: "Allopatric speciation occurs when biological populations become geographically isolated from each other to an extent that prevents or interferes with genetic interchange."
  },
  {
    id: "tcat-bio-324",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "How does the Endosymbiotic Theory account for the presence of circular double-stranded DNA and 70S ribosomes inside eukaryotic mitochondria and chloroplasts?",
    options: ["They originated as autonomous aerobic proteobacteria and photosynthetic cyanobacteria engulfed by an ancestral nucleated cell that established mutualistic endosymbiosis","They were synthesized de novo from nuclear genomic duplication","They represent viral capsids trapped in eukaryotic lysosomes","They evolved from invaginations of the cell membrane without external organisms"],
    correct: 0,
    explain: "Lynn Margulis' endosymbiotic theory posits that mitochondria evolved from engulfed alpha-proteobacteria and chloroplasts from cyanobacteria, explaining their circular DNA, bacterial-type 70S ribosomes, and double membranes."
  },
  {
    id: "tcat-bio-325",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "In population ecology, what mathematical differential equation represents logistic population growth accounting for environmental carrying capacity K?",
    options: ["dN/dt = rN * (1 - N/K)","dN/dt = rN","dN/dt = rN * (K/N)","dN/dt = K * (1 - rN)"],
    correct: 0,
    explain: "The Verhulst logistic growth equation is dN/dt = rN(1 - N/K), where the term (1 - N/K) acts as the density-dependent environmental resistance brake that slows growth as population N approaches carrying capacity K."
  },
  {
    id: "tcat-bio-326",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "Which cellular organelle is known as the \"powerhouse of the cell\" because it generates the majority of cellular ATP via oxidative phosphorylation?",
    options: ["Mitochondrion","Ribosome","Golgi apparatus","Lysosome"],
    correct: 0,
    explain: "Mitochondria produce the bulk of ATP in eukaryotic cells through the Krebs cycle and the electron transport chain on the inner cristae."
  },
  {
    id: "tcat-bio-327",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "In plant photosynthetic cells, where do the light-dependent reactions of photosynthesis occur?",
    options: ["Thylakoid membranes of chloroplasts","Stroma of chloroplasts","Cytosol","Mitochondrial matrix"],
    correct: 0,
    explain: "The light reactions of photosynthesis take place in the thylakoid membranes containing photosystems I and II, while the Calvin cycle occurs in the stroma."
  },
  {
    id: "tcat-bio-328",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "What is the net yield of ATP molecules generated per single glucose molecule during anaerobic glycolysis in the cytoplasm?",
    options: ["2 net ATP","4 net ATP","36 net ATP","38 net ATP"],
    correct: 0,
    explain: "Glycolysis consumes 2 ATP and produces 4 ATP, yielding a net gain of 2 ATP per glucose molecule along with 2 NADH."
  },
  {
    id: "tcat-bio-329",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Medium",
    q: "What is the primary function of the enzyme Ribulose-1,5-bisphosphate carboxylase-oxygenase (RuBisCO) in the Calvin cycle?",
    options: ["Catalyzes the fixation of atmospheric CO2 onto ribulose-1,5-bisphosphate (RuBP) to form 3-PGA","Splits water molecules during photolysis in photosystem II","Pumps protons across the thylakoid membrane into the lumen","Phosphorylates ADP into ATP in cyclic photophosphorylation"],
    correct: 0,
    explain: "RuBisCO fixes carbon dioxide onto the 5-carbon sugar RuBP, generating an unstable 6-carbon intermediate that cleaves into two molecules of 3-phosphoglycerate (3-PGA)."
  },
  {
    id: "tcat-bio-330",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Medium",
    q: "What acts as the terminal electron acceptor in the aerobic mitochondrial electron transport chain?",
    options: ["Molecular oxygen (O2)","NAD+","Cytochrome c","Pyruvate"],
    correct: 0,
    explain: "Molecular oxygen serves as the final electron acceptor in complex IV, combining with electrons and protons to form water (H2O)."
  },
  {
    id: "tcat-bio-331",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Medium",
    q: "During the transition step linking glycolysis to the Krebs cycle, pyruvate is converted into what key 2-carbon molecule within the mitochondrial matrix?",
    options: ["Acetyl-CoA","Citrate","Oxaloacetate","Lactate"],
    correct: 0,
    explain: "Pyruvate dehydrogenase decarboxylates 3-carbon pyruvate to form 2-carbon Acetyl-CoA, releasing CO2 and reducing NAD+ to NADH."
  },
  {
    id: "tcat-bio-332",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Medium",
    q: "How does Peter Mitchell's Chemiosmotic Hypothesis explain ATP generation during oxidative phosphorylation?",
    options: ["An electrochemical proton gradient generated across the inner mitochondrial membrane drives rotary catalysis in ATP synthase (F0F1 complex)","Substrate-level phosphorylation transfers high-energy phosphates directly to ADP","Thermal fluctuations in the matrix fuse ADP with free orthophosphate","Active transport of sodium ions across the outer membrane triggers ATP release"],
    correct: 0,
    explain: "The electron transport chain pumps protons from the matrix into the intermembrane space; the resulting proton-motive force drives proton influx through ATP synthase to generate ATP."
  },
  {
    id: "tcat-bio-333",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "What distinguishes non-cyclic photophosphorylation from cyclic photophosphorylation in photosynthetic thylakoid membranes?",
    options: ["Non-cyclic photophosphorylation involves both PS II and PS I and generates both ATP and NADPH, whereas cyclic involves only PS I and produces ATP alone","Cyclic photophosphorylation splits water to evolve oxygen","Non-cyclic photophosphorylation operates without sunlight","Cyclic photophosphorylation consumes glucose directly"],
    correct: 0,
    explain: "Non-cyclic electron flow utilizes PS II and PS I, oxidizes H2O to release O2, and generates both ATP and NADPH. Cyclic flow shunts electrons through PS I and cytochrome b6f, generating only ATP."
  },
  {
    id: "tcat-bio-334",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "How do C4 plants like maize minimize photorespiration caused by the oxygenase activity of RuBisCO?",
    options: ["By spatially segregating initial carbon fixation via PEP carboxylase in mesophyll cells from the Calvin cycle in bundle sheath cells","By closing stomata exclusively during daylight hours","By eliminating RuBisCO completely from their genome","By converting all carbohydrates into starch inside epidermal vacuoles"],
    correct: 0,
    explain: "C4 plants spatially separate PEP carboxylase (which has no affinity for oxygen) in mesophyll cells, releasing concentrated CO2 to RuBisCO in specialized bundle-sheath cells."
  },
  {
    id: "tcat-bio-335",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "In the mitochondrial electron transport chain, which enzyme complex does NOT pump protons across the inner mitochondrial membrane into the intermembrane space?",
    options: ["Complex II (Succinate dehydrogenase)","Complex I (NADH dehydrogenase)","Complex III (Cytochrome bc1 complex)","Complex IV (Cytochrome c oxidase)"],
    correct: 0,
    explain: "Complex II (succinate dehydrogenase) transfers electrons from FADH2 to ubiquinone without pumping any protons across the inner mitochondrial membrane."
  },
  {
    id: "tcat-bio-336",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "What type of chemical bond links individual amino acid monomers together to form a polypeptide protein chain?",
    options: ["Peptide bond","Glycosidic bond","Phosphodiester bond","Ester bond"],
    correct: 0,
    explain: "Amino acids are joined via covalent peptide bonds formed between the alpha-carboxyl group of one amino acid and the alpha-amino group of another."
  },
  {
    id: "tcat-bio-337",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "Which nitrogenous base is present in RNA but absent in DNA, where it is replaced by thymine?",
    options: ["Uracil","Guanine","Cytosine","Adenine"],
    correct: 0,
    explain: "RNA contains uracil (U) which base-pairs with adenine, whereas DNA contains thymine (T)."
  },
  {
    id: "tcat-bio-338",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "What is the principal storage polysaccharide found in animals, stored predominantly in the liver and skeletal muscles?",
    options: ["Glycogen","Starch","Cellulose","Chitin"],
    correct: 0,
    explain: "Glycogen is a highly branched alpha-glucose polymer serving as the secondary energy storage macromolecule in animal tissues."
  },
  {
    id: "tcat-bio-339",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "Which class of biomolecules is composed of glycerol esterified with three fatty acid chains?",
    options: ["Triglycerides (Triacylglycerols)","Phospholipids","Steroids","Polypeptides"],
    correct: 0,
    explain: "Triglycerides consist of three fatty acid molecules covalently bound to a single glycerol backbone via ester linkages."
  },
  {
    id: "tcat-bio-340",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "What structural interactions primarily stabilize the secondary structures of proteins, such as alpha-helices and beta-pleated sheets?",
    options: ["Hydrogen bonds between carbonyl oxygens and amide hydrogens of the polypeptide backbone","Disulfide covalent linkages between cysteine residues","Hydrophobic interactions among non-polar side chains","Ionic salt bridges between acidic and basic R-groups"],
    correct: 0,
    explain: "Secondary structure (alpha-helix and beta-sheet) is formed and stabilized by hydrogen bonding between the peptide backbone C=O and N-H groups."
  },
  {
    id: "tcat-bio-341",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "How does a competitive enzyme inhibitor affect the kinetic parameters Vmax and Km of an enzymatic reaction?",
    options: ["Km increases while Vmax remains unchanged","Vmax decreases while Km remains unchanged","Both Vmax and Km decrease","Both Vmax and Km increase"],
    correct: 0,
    explain: "Competitive inhibitors compete with the substrate for the active site, increasing the apparent Km (lowering affinity) while Vmax can still be reached at high substrate concentrations."
  },
  {
    id: "tcat-bio-342",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "Which glycosidic linkage is present in linear amylose chains of plant starch, permitting digestion by human salivary amylase?",
    options: ["alpha-1,4-glycosidic bond","beta-1,4-glycosidic bond","alpha-1,6-glycosidic bond","beta-1,6-glycosidic bond"],
    correct: 0,
    explain: "Amylose consists of unbranched D-glucose units joined by alpha-1,4-glycosidic bonds, which are hydrolyzed by alpha-amylases."
  },
  {
    id: "tcat-bio-343",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "In allosteric enzyme regulation, what type of curve is generated when reaction velocity (v) is plotted against substrate concentration [S]?",
    options: ["Sigmoidal curve","Hyperbolic curve","Linear straight line","Parabolic curve"],
    correct: 0,
    explain: "Allosteric enzymes with cooperative multi-subunit binding display sigmoidal (S-shaped) velocity curves, reflecting positive cooperativity described by the Hill equation."
  },
  {
    id: "tcat-bio-344",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "What is the structural basis for the mechanical rigidity of cellulose microfibrils in plant cell walls compared to starch?",
    options: ["Beta-1,4-glycosidic bonds produce linear, uncoiled chains that pack into paracrystalline fibrils via extensive inter- and intra-chain hydrogen bonding","Cellulose contains sulfur crosslinks absent in starch","Cellulose is synthesized from L-glucose monomers","Starch contains alternating amino sugar residues"],
    correct: 0,
    explain: "The beta-1,4 linkage forces glucose residues into alternating 180-degree rotations, forming straight ribbons that crosslink with adjacent chains via hydrogen bonds into rigid microfibrils."
  },
  {
    id: "tcat-bio-345",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "In the Lineweaver-Burk double-reciprocal plot (1/v vs 1/[S]), what do the y-intercept and x-intercept represent respectively?",
    options: ["y-intercept = 1/Vmax, x-intercept = -1/Km","y-intercept = 1/Km, x-intercept = -1/Vmax","y-intercept = Vmax, x-intercept = Km","y-intercept = Km/Vmax, x-intercept = 0"],
    correct: 0,
    explain: "The Lineweaver-Burk equation is 1/v = (Km/Vmax)*(1/[S]) + 1/Vmax. Setting 1/[S] = 0 gives y-intercept = 1/Vmax; setting 1/v = 0 gives x-intercept = -1/Km."
  },
  {
    id: "tcat-bio-346",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "In the human heart, which chamber has the thickest muscular myocardium to pump oxygenated blood throughout the systemic circulation?",
    options: ["Left ventricle","Right ventricle","Left atrium","Right atrium"],
    correct: 0,
    explain: "The left ventricle pumps oxygenated blood against high systemic arterial resistance into the aorta, requiring a thick muscular wall."
  },
  {
    id: "tcat-bio-347",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "What is the primary anatomical site of gas exchange (O2 and CO2 diffusion) in the human respiratory tract?",
    options: ["Alveoli","Bronchioles","Trachea","Larynx"],
    correct: 0,
    explain: "Alveoli are thin-walled, spherical capillary-rich sacs that provide a massive surface area for pulmonary gas diffusion."
  },
  {
    id: "tcat-bio-348",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "What is the basic functional microscopic filtration and excretory unit of the human kidney?",
    options: ["Nephron","Glomerulus","Renal pelvis","Alveolus"],
    correct: 0,
    explain: "Each human kidney contains approximately 1 million nephrons responsible for ultrafiltration, selective reabsorption, and tubular secretion."
  },
  {
    id: "tcat-bio-349",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "How does the Bohr effect facilitate oxygen delivery to metabolically active peripheral tissues?",
    options: ["Elevated PCO2 and lower pH (increased H+) decrease hemoglobin's affinity for O2, shifting the dissociation curve to the right","High PO2 increases hemoglobin affinity for CO2","Alkaline pH prompts hemoglobin to release O2 prematurely in the lungs","Carbonic anhydrase inhibits iron binding in heme"],
    correct: 0,
    explain: "Active tissues produce CO2 and lactic acid, lowering pH. Protons bind to hemoglobin, stabilizing its T (tense) deoxy-state and shifting the curve rightward (Bohr effect)."
  },
  {
    id: "tcat-bio-350",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "What enzyme secreted by gastric chief cells is activated by hydrochloric acid (HCl) to initiate protein digestion in the human stomach?",
    options: ["Pepsin (from pepsinogen)","Trypsin","Chymotrypsin","Pancreatic amylase"],
    correct: 0,
    explain: "Gastric chief cells secrete inactive pepsinogen, which is cleaved into active pepsin by HCl secreted by parietal cells to hydrolyze proteins."
  },
  {
    id: "tcat-bio-351",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "In the nephron, what is the physiological role of the countercurrent multiplier mechanism established by the Loop of Henle?",
    options: ["Builds a hyperosmotic medullary concentration gradient that enables concentrated urine production via water reabsorption in the collecting duct","Directly filters erythrocytes from the glomerulus","Synthesizes aldosterone in response to low blood pressure","Secretes potassium into the proximal convoluted tubule"],
    correct: 0,
    explain: "The countercurrent multiplier of Henle's loop establishes a vertical osmotic gradient (300 to 1200 mOsm/L) in the renal medulla, facilitating water conservation under ADH action."
  },
  {
    id: "tcat-bio-352",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "What specialized pacemaker cells in the right atrium generate the rhythmic electrical impulses that initiate the cardiac cycle?",
    options: ["Sinoatrial (SA) node","Atrioventricular (AV) node","Bundle of His","Purkinje fibers"],
    correct: 0,
    explain: "The sinoatrial (SA) node exhibits spontaneous rhythmic depolarization, acting as the primary intrinsic physiological pacemaker of the human heart."
  },
  {
    id: "tcat-bio-353",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "In the regulation of glomerular filtration rate (GFR), what triggers the release of renin by the juxtaglomerular apparatus?",
    options: ["Decreased renal perfusion pressure in afferent arterioles and decreased NaCl delivery to the macula densa","Elevated systemic mean arterial pressure above 180 mmHg","Excessive secretion of Atrial Natriuretic Peptide (ANP)","Hypercalcemia in the proximal convoluted tubule"],
    correct: 0,
    explain: "Juxtaglomerular granular cells secrete renin in response to decreased renal arterial perfusion pressure, sympathetic stimulation, or decreased NaCl flux sensed by macula densa cells."
  },
  {
    id: "tcat-bio-354",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "How does the Haldane effect describe the interaction between oxygenation of hemoglobin and carbon dioxide transport?",
    options: ["Deoxygenation of hemoglobin increases its capacity to carry CO2, while oxygenation in the lungs promotes CO2 unloading","CO2 competes directly with O2 for the central ferrous iron (Fe2+) binding site","Oxygenation locks carbon dioxide permanently into carbaminohemoglobin","Deoxygenation decreases blood bicarbonate buffer capacity"],
    correct: 0,
    explain: "The Haldane effect states that deoxygenated hemoglobin has a higher affinity for CO2 and protons than oxyhemoglobin, facilitating CO2 uptake in tissues and its discharge in pulmonary capillaries."
  },
  {
    id: "tcat-bio-355",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "What is the precise physiological consequence of the absence of vasopressin (Antidiuretic Hormone, ADH) on the collecting ducts of the human kidney?",
    options: ["Aquaporin-2 water channels are endocytosed, rendering the luminal membrane impermeable to water and resulting in copious dilute urine (diabetes insipidus)","Massive reabsorption of urea into the cortex","Complete cessation of glomerular filtration","Excessive glucose spilling into the tubular lumen"],
    correct: 0,
    explain: "ADH binds V2 receptors to trigger exocytosis of aquaporin-2 channels. Without ADH, collecting duct apical membranes remain impermeable to water, leading to severe polyuria."
  },
  {
    id: "tcat-bio-356",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "According to Mendel's Law of Segregation, how many alleles for a single given gene are carried into an individual gamete during meiosis?",
    options: ["One allele","Two alleles","Four alleles","Variable depending on chromosome number"],
    correct: 0,
    explain: "During meiosis, the two homologous alleles for each gene segregate so that each gamete receives only one allele."
  },
  {
    id: "tcat-bio-357",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "What enzyme synthesizes a complementary DNA strand by adding deoxyribonucleotides during DNA replication in a 5' to 3' direction?",
    options: ["DNA polymerase","RNA primase","DNA helicase","DNA ligase"],
    correct: 0,
    explain: "DNA polymerase synthesizes nascent DNA by catalyzing phosphodiester bond formation between 5'-phosphate and 3'-OH groups."
  },
  {
    id: "tcat-bio-358",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "What laboratory technique is used to amplify billions of copies of a specific targeted DNA sequence in vitro within hours?",
    options: ["Polymerase Chain Reaction (PCR)","Gel electrophoresis","Western blot","Flow cytometry"],
    correct: 0,
    explain: "PCR uses thermal cycling (denaturation, annealing, extension) and thermostable Taq polymerase to exponentially amplify targeted DNA sequences."
  },
  {
    id: "tcat-bio-359",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "In a dihybrid cross (AaBb x AaBb) involving two unlinked independently assorting autosomal genes, what is the expected phenotypic ratio in the F2 generation?",
    options: ["9 : 3 : 3 : 1","1 : 2 : 1","3 : 1","1 : 1 : 1 : 1"],
    correct: 0,
    explain: "Independent assortment of two heterozygous gene pairs produces the classic Mendelian dihybrid phenotypic ratio of 9 (dominant/dominant) : 3 : 3 : 1 (recessive/recessive)."
  },
  {
    id: "tcat-bio-360",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "What is the function of restriction endonucleases (restriction enzymes) in recombinant DNA technology?",
    options: ["Cleave double-stranded DNA at specific palindromic nucleotide recognition sequences","Ligate broken sugar-phosphate backbones in cloning vectors","Remove introns from eukaryotic pre-mRNA transcripts","Add a poly-A tail to the 3' end of nascent mRNA"],
    correct: 0,
    explain: "Restriction enzymes recognize specific palindromic sequences (e.g., EcoRI at GAATTC) and cleave phosphodiester bonds to create sticky or blunt ends for molecular cloning."
  },
  {
    id: "tcat-bio-361",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "Why are X-linked recessive genetic disorders (such as hemophilia A and red-green color blindness) observed far more frequently in biological males than in females?",
    options: ["Males are hemizygous (XY) and express the recessive phenotype from a single mutant maternal X chromosome","The Y chromosome suppresses all clotting factors","Females inactivate both X chromosomes simultaneously","Testosterone mutates the clotting gene directly"],
    correct: 0,
    explain: "Males have only one X chromosome (XY). A single recessive mutant allele on their X chromosome will be expressed because there is no homologous X chromosome to mask it."
  },
  {
    id: "tcat-bio-362",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "In the E. coli lac operon, how does the presence of lactose coupled with low glucose levels induce transcription of the lac structural genes?",
    options: ["Allolactose binds the lac repressor to relieve inhibition, while elevated cAMP activates CAP to recruit RNA polymerase","Glucose binds directly to the lac operator as a promoter","Allolactose degrades the beta-galactosidase mRNA transcript","Lactose acts as a corepressor on the trp promoter"],
    correct: 0,
    explain: "Allolactose binds the repressor protein to release it from the operator. Concurrently, low glucose elevates cAMP, which complexes with CAP (Catabolite Activator Protein) to strongly recruit RNA polymerase."
  },
  {
    id: "tcat-bio-363",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "What molecular mechanism accounts for the generation of multiple distinct functional protein isoforms from a single eukaryotic pre-mRNA gene transcript?",
    options: ["Alternative pre-mRNA splicing","Reverse transcription of repetitive pseudogenes","Somatic hypermutation in non-coding exons","Telomeric end-replication attrition"],
    correct: 0,
    explain: "Alternative splicing selectively includes or excludes specific exons or introns from the pre-mRNA transcript, allowing a single gene to encode diverse protein isoforms."
  },
  {
    id: "tcat-bio-364",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "In CRISPR-Cas9 genome editing, what guides the Cas9 endonuclease to its exact genomic cleavage target site?",
    options: ["A single guide RNA (sgRNA) complementary to the target DNA sequence adjacent to a Protospacer Adjacent Motif (PAM)","A zinc finger DNA-binding protein array","A synthetic DNA primer labeled with radioactive phosphorus","Direct electrostatic recognition by the Cas9 catalytic core"],
    correct: 0,
    explain: "Cas9 is targeted to specific DNA loci by base pairing with a synthetic guide RNA (sgRNA), provided that the adjacent 5'-NGG-3' Protospacer Adjacent Motif (PAM) is present."
  },
  {
    id: "tcat-bio-365",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "How does the Sanger dideoxy chain-termination method achieve sequence-specific termination of DNA elongation?",
    options: ["Dideoxynucleotides (ddNTPs) lack the 3'-OH group required for phosphodiester bond formation with subsequent incoming nucleotides","ddNTPs lack the 5'-triphosphate group required for energy","ddNTPs degrade the DNA polymerase enzyme upon incorporation","ddNTPs induce double-stranded DNA crosslinking"],
    correct: 0,
    explain: "Dideoxynucleoside triphosphates (ddNTPs) lack a 3'-hydroxyl group (-OH). Once incorporated into a growing chain, no further phosphodiester bond can form, terminating elongation."
  },
  {
    id: "tcat-bio-366",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "What is the functional contractile unit of skeletal muscle tissue bounded between two successive Z-discs called?",
    options: ["Sarcomere","Myofibril","Sarcolemma","Sarcoplasmic reticulum"],
    correct: 0,
    explain: "The sarcomere is the basic repeating contractile unit of striated muscle, delimited at each end by a Z-line."
  },
  {
    id: "tcat-bio-367",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "Which type of freely movable synovial joint is exemplified by the human shoulder and hip joints?",
    options: ["Ball-and-socket joint","Hinge joint","Pivot joint","Suture joint"],
    correct: 0,
    explain: "Ball-and-socket joints permit multi-axial movement across all three planes, as seen in the glenohumeral (shoulder) and acetabulofemoral (hip) joints."
  },
  {
    id: "tcat-bio-368",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "What mineral salt forms the primary inorganic crystalline matrix (hydroxyapatite) imparting hardness to human bone tissue?",
    options: ["Calcium phosphate","Sodium chloride","Potassium chloride","Iron oxide"],
    correct: 0,
    explain: "Bone matrix consists primarily of calcium phosphate crystals deposited as hydroxyapatite [Ca10(PO4)6(OH)2] within collagen fiber scaffolds."
  },
  {
    id: "tcat-bio-369",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "According to the Sliding Filament Theory of muscle contraction, which zone or band narrows and disappears upon complete sarcomere shortening?",
    options: ["H-zone and I-band","A-band","Z-line","M-line"],
    correct: 0,
    explain: "During contraction, actin filaments slide past myosin toward the M-line. The H-zone (myosin only) and I-band (actin only) shorten/disappear, whereas the A-band length remains constant."
  },
  {
    id: "tcat-bio-370",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "What is the specific role of calcium ions (Ca2+) released from the sarcoplasmic reticulum during excitation-contraction coupling?",
    options: ["Binds troponin C to induce a conformational shift in tropomyosin, exposing myosin-binding sites on actin filaments","Hydrolyzes ATP directly at the myosin hinge region","Pumps sodium out of the sarcolemma via T-tubules","Forms cross-bridges between collagen and elastin"],
    correct: 0,
    explain: "Intracellular Ca2+ binds troponin C, shifting the troponin-tropomyosin complex away from myosin-binding sites on actin so cross-bridge cycling can proceed."
  },
  {
    id: "tcat-bio-371",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "What connective tissue structure attaches skeletal muscle directly to bone periosteum?",
    options: ["Tendon","Ligament","Cartilage","Synovial capsule"],
    correct: 0,
    explain: "Tendons are dense regular fibrous connective tissues connecting muscles to bones, whereas ligaments connect bones to other bones."
  },
  {
    id: "tcat-bio-372",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "What causes rigor mortis (stiffening of skeletal muscles) following clinical death?",
    options: ["Cessation of ATP synthesis prevents ATP from binding to myosin heads to detach cross-bridges from actin","Excessive accumulation of lactic acid destroys myofibrils","Rapid degradation of troponin by intracellular proteases","Irreversible hyperpolarization of the motor endplate"],
    correct: 0,
    explain: "ATP binding is required to break the actin-myosin cross-bridge. Post-mortem depletion of ATP leaves cross-bridges locked in place, producing muscular rigidity (rigor mortis)."
  },
  {
    id: "tcat-bio-373",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "What is the role of osteoclasts in continuous human bone remodeling?",
    options: ["Secrete lysosomal enzymes and hydrochloric acid into Howship's lacunae to resorb mineralized bone matrix","Synthesize osteoid collagen scaffolding","Differentiate into mature quiescent osteocytes","Produce calcitonin in response to hypocalcemia"],
    correct: 0,
    explain: "Osteoclasts are multinucleated macrophage-lineage cells that adhere to bone and secrete H+ and cathepsin K to demineralize and digest organic bone matrix."
  },
  {
    id: "tcat-bio-374",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "In skeletal muscle biomechanics, what metabolic distinction characterizes slow-twitch Type I muscle fibers compared to fast-twitch Type IIb fibers?",
    options: ["Type I fibers possess high myoglobin content, abundant mitochondria, and rely primarily on oxidative phosphorylation for fatigue-resistant aerobic contraction","Type I fibers fatigue rapidly and utilize anaerobic glycolysis","Type I fibers have low vascular capillary density","Type I fibers lack sarcoplasmic reticulum"],
    correct: 0,
    explain: "Type I (red) fibers have high concentrations of myoglobin and mitochondria, high capillary density, and rely on oxidative metabolism for sustained, fatigue-resistant contractions."
  },
  {
    id: "tcat-bio-375",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "What is the typical resting membrane potential of a mammalian neuron?",
    options: ["Approximately -70 mV","Approximately +30 mV","0 mV","Approximately -120 mV"],
    correct: 0,
    explain: "The resting membrane potential of a typical mammalian neuron is around -70 mV, maintained by Na+/K+ ATPase and potassium leak channels."
  },
  {
    id: "tcat-bio-376",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "Which endocrine hormone produced by the beta cells of the islets of Langerhans in the pancreas lowers blood glucose levels?",
    options: ["Insulin","Glucagon","Epinephrine","Cortisol"],
    correct: 0,
    explain: "Insulin facilitates glucose uptake into muscle and adipose cells via GLUT4 translocation, lowering blood glucose concentration."
  },
  {
    id: "tcat-bio-377",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "What lipid-rich insulating sheath surrounds neuronal axons in the peripheral nervous system, synthesized by Schwann cells to accelerate nerve impulses?",
    options: ["Myelin sheath","Perineurium","Sarcolemma","Endoneurium"],
    correct: 0,
    explain: "The myelin sheath is an electrical insulator formed by Schwann cells in the PNS and oligodendrocytes in the CNS, speeding conduction via nodes of Ranvier."
  },
  {
    id: "tcat-bio-378",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "What rapid ionic movement across the axonal plasma membrane causes the depolarization phase of an action potential?",
    options: ["Rapid influx of Na+ through voltage-gated sodium channels","Efflux of K+ through voltage-gated potassium channels","Efflux of Ca2+ into the extracellular fluid","Active pumping of 3 Na+ out by the Na+/K+ pump"],
    correct: 0,
    explain: "Depolarization occurs when the threshold potential (-55 mV) opens voltage-gated Na+ channels, allowing rapid Na+ influx driven by electrochemical gradients."
  },
  {
    id: "tcat-bio-379",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "What neurotransmitter is released at neuromuscular junctions to stimulate skeletal muscle contraction?",
    options: ["Acetylcholine (ACh)","Dopamine","Serotonin","GABA"],
    correct: 0,
    explain: "Motor neurons release acetylcholine into the synaptic cleft, where it binds nicotinic ACh receptors on the motor endplate to evoke muscle depolarization."
  },
  {
    id: "tcat-bio-380",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "How does saltatory conduction propagate an action potential along a myelinated nerve axon?",
    options: ["Action potentials regenerate exclusively at unmyelinated nodes of Ranvier, jumping rapidly from node to node","Current travels continuously along the entire membrane surface","Neurotransmitters diffuse longitudinally through the axoplasm","Glial cells depolarize sequentially in place of the axon"],
    correct: 0,
    explain: "Because myelin prevents transmembrane ion leaks, action potentials jump between the unmyelinated nodes of Ranvier where voltage-gated channels cluster."
  },
  {
    id: "tcat-bio-381",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "What molecular event terminates the absolute refractory period in an axon after an action potential peak?",
    options: ["Transition of voltage-gated Na+ channels from the inactivated state to the closed resting state upon repolarization","Opening of ligand-gated chloride channels","Exhaustion of ATP stores in the axoplasm","Complete depolarization of neighboring astrocytes"],
    correct: 0,
    explain: "During the absolute refractory period, voltage-gated Na+ channels are inactivated by their intracellular ball-and-chain domain. They must reset to the closed state before another spike can fire."
  },
  {
    id: "tcat-bio-382",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "In the hypothalamic-pituitary-thyroid axis, what endocrine feedback mechanism maintains circulating thyroxine (T4) levels within a narrow physiological window?",
    options: ["Elevated free T3 and T4 exert negative feedback on the anterior pituitary (suppressing TSH) and hypothalamus (suppressing TRH)","High T4 stimulates further release of TSH via positive feedback","Calcitonin stimulates thyroxine synthesis in parathyroid glands","Iodine depletion activates thyrotropin-releasing hormone"],
    correct: 0,
    explain: "Thyroid hormones (T3/T4) exert classical negative feedback inhibition on both TRH release from the hypothalamus and TSH release from the anterior pituitary."
  },
  {
    id: "tcat-bio-383",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "How does the second messenger cyclic AMP (cAMP) propagate intracellular signaling initiated by epinephrine binding to beta-adrenergic G protein-coupled receptors?",
    options: ["Activated Gs alpha subunit stimulates adenylyl cyclase to convert ATP to cAMP, which then activates Protein Kinase A (PKA)","cAMP binds directly to chromatin to transcribe glycolytic enzymes","cAMP opens nuclear pore complexes to admit extracellular calcium","cAMP degrades phosphodiesterase enzymes to prevent signaling"],
    correct: 0,
    explain: "Binding to beta-adrenergic receptors activates Gs alpha, stimulating adenylyl cyclase to synthesize cAMP from ATP. cAMP allosterically activates PKA to phosphorylate target metabolic enzymes."
  },
  {
    id: "tcat-bio-384",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "In human female gametogenesis, where does fertilization of the secondary oocyte by a sperm cell normally occur?",
    options: ["Fallopian tube (Ampulla of the oviduct)","Uterine endometrium","Cervix","Ovarian follicle"],
    correct: 0,
    explain: "Fertilization normally takes place within the ampulla of the fallopian tube (oviduct)."
  },
  {
    id: "tcat-bio-385",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "Which pituitary gonadotropic hormone surges abruptly around day 14 of the typical 28-day menstrual cycle to trigger ovulation?",
    options: ["Luteinizing Hormone (LH)","Prolactin","Oxytocin","Thyroid-Stimulating Hormone (TSH)"],
    correct: 0,
    explain: "A massive mid-cycle surge of Luteinizing Hormone (LH), provoked by sustained high estrogen levels, triggers rupture of the mature Graafian follicle and ovulation."
  },
  {
    id: "tcat-bio-386",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "What is the hollow sphere of cells formed during early human embryonic development called, consisting of an inner cell mass and an outer trophoblast?",
    options: ["Blastocyst","Morula","Gastrula","Neurula"],
    correct: 0,
    explain: "Following cleavage, the solid morula forms a fluid-filled blastocoel cavity to become a blastocyst (~day 5), which implants into the uterine endometrium."
  },
  {
    id: "tcat-bio-387",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "What hormone secreted by the developing syncytiotrophoblast maintains the corpus luteum in the ovary following successful embryonic implantation?",
    options: ["Human Chorionic Gonadotropin (hCG)","Estrogen","Luteinizing Hormone (LH)","Relaxin"],
    correct: 0,
    explain: "The trophoblast secretes hCG, which acts like LH to sustain the corpus luteum so it continues producing progesterone, preventing menstruation."
  },
  {
    id: "tcat-bio-388",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "What key morphogenetic process during gastrulation reorganizes the single-layered blastula into an embryo with three primary germ layers?",
    options: ["Gastrulation forming ectoderm, mesoderm, and endoderm","Neurulation forming the neural tube","Cleavage without cell growth","Capacitation of trophoblastic syncytia"],
    correct: 0,
    explain: "Gastrulation involves extensive cellular migration (invagination, epiboly) through the primitive streak to establish the three primary germ layers: ectoderm, mesoderm, and endoderm."
  },
  {
    id: "tcat-bio-389",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "In male spermatogenesis, what specialized cells within the seminiferous tubules provide essential mechanical support and metabolic nourishment to developing spermatids?",
    options: ["Sertoli cells","Leydig cells","Granulosa cells","Spermatogonia type A"],
    correct: 0,
    explain: "Sertoli cells (nurse cells) line the seminiferous tubules, forming the blood-testis barrier and providing trophic and physical support during spermatogenesis."
  },
  {
    id: "tcat-bio-390",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "How does the cortical reaction establish a permanent slow block to polyspermy upon fertilization of an egg?",
    options: ["Intracellular Ca2+ wave triggers exocytosis of cortical granules, whose proteases cleave ZP receptors and harden the zona pellucida into a fertilization envelope","Instantaneous influx of Na+ hyperpolarizes the egg membrane","Sperm flagellum plugs the micropyle permanently","Acidification of the perivitelline space denatures paternal mitochondria"],
    correct: 0,
    explain: "Sperm-egg fusion triggers a cytosolic Ca2+ wave that releases cortical granule enzymes via exocytosis; these cleave ZP3 receptors and crosslink the zona pellucida to prevent polyspermy."
  },
  {
    id: "tcat-bio-391",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "Which primary germ layer gives rise to the central nervous system (brain and spinal cord) and epidermis of the skin in vertebrate embryology?",
    options: ["Ectoderm","Mesoderm","Endoderm","Trophoblast"],
    correct: 0,
    explain: "The ectoderm differentiates into surface ectoderm (epidermis, hair, nails) and neuroectoderm (neural tube yielding brain and spinal cord, neural crest)."
  },
  {
    id: "tcat-bio-392",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "At what precise stage of meiotic cell division is a human primary oocyte arrested from fetal development until puberty?",
    options: ["Prophase I (Diplotene stage)","Metaphase II","Anaphase I","Telophase II"],
    correct: 0,
    explain: "Primary oocytes begin meiosis during embryonic life but arrest in the diplotene stage of Prophase I, resuming meiosis only upon LH stimulation at ovulation."
  },
  {
    id: "tcat-bio-393",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "What is the primary mechanism of evolution proposed by Charles Darwin and Alfred Russel Wallace?",
    options: ["Natural selection","Inheritance of acquired characteristics","Genetic drift","Horizontal gene transfer"],
    correct: 0,
    explain: "Natural selection posits that organisms possessing heritable traits that enhance survival and reproduction leave more offspring, shifting allele frequencies over generations."
  },
  {
    id: "tcat-bio-394",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "In an ecological food chain, what trophic level is occupied by autotrophic green plants that convert solar energy into biochemical energy?",
    options: ["Primary producers","Primary consumers","Secondary consumers","Apex predators"],
    correct: 0,
    explain: "Autotrophs (green plants, phytoplankton) constitute the first trophic level as primary producers, synthesizing organic matter from sunlight and inorganic nutrients."
  },
  {
    id: "tcat-bio-395",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "What symbiotic relationship benefits one species while neither benefiting nor harming the other species (e.g., barnacles on a whale)?",
    options: ["Commensalism","Mutualism","Parasitism","Amensalism"],
    correct: 0,
    explain: "Commensalism is a biological interaction in which one organism benefits and the other remains unaffected (+/0 relationship)."
  },
  {
    id: "tcat-bio-396",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "What mode of speciation occurs when a physical geographic barrier (such as a mountain range or river) splits a population into isolated subpopulations?",
    options: ["Allopatric speciation","Sympatric speciation","Parapatric speciation","Peripatric speciation"],
    correct: 0,
    explain: "Allopatric speciation occurs when geographic isolation prevents gene flow, allowing evolutionary forces (mutation, drift, selection) to drive reproductive divergence."
  },
  {
    id: "tcat-bio-397",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "According to Lindeman's Efficiency (the 10% rule in ecological energetics), approximately how much energy is transferred from one trophic level to the next higher level?",
    options: ["Approximately 10%","Approximately 50%","Approximately 1%","Approximately 90%"],
    correct: 0,
    explain: "Roughly 10% of the energy stored as biomass in one trophic level is converted into biomass at the next level; ~90% is dissipated as metabolic heat and respiration."
  },
  {
    id: "tcat-bio-398",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "What five equilibrium conditions must be met for a population to strictly satisfy Hardy-Weinberg genetic equilibrium (p^2 + 2pq + q^2 = 1)?",
    options: ["No mutations, random mating, no natural selection, infinitely large population size, and no gene flow (migration)","Equal male-to-female sex ratio, non-random mating, constant mutation rate, small population size, and high migration","All individuals are heterozygous, sexual selection is present, and alleles are codominant","Genetic drift is maximized, population bottleneck occurs annually, and selection favors homozygotes"],
    correct: 0,
    explain: "Hardy-Weinberg equilibrium assumes no mutation, random mating, no gene flow, infinite (very large) population size, and no differential reproductive selection."
  },
  {
    id: "tcat-bio-399",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "What does Gause's Competitive Exclusion Principle state regarding two sympatric species competing for the exact same limiting ecological resource?",
    options: ["Two species competing for the exact same limiting resource cannot stably coexist; the slightly superior competitor will drive the other to local extinction","Both species evolve identical morphological structures","The carrying capacity of the ecosystem doubles automatically","The inferior competitor switches to autotrophic photosynthesis"],
    correct: 0,
    explain: "Competitive exclusion dictates that two species occupying identical ecological niches cannot coexist indefinitely; one will outcompete the other unless niche differentiation occurs."
  },
  {
    id: "tcat-bio-400",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "In microevolution, what distinguishes genetic drift from natural selection as a mechanism of evolutionary change?",
    options: ["Genetic drift causes non-adaptive fluctuations in allele frequencies due to random chance sampling, acting most potently in small populations","Genetic drift always increases the fitness of a species","Natural selection is driven entirely by stochastic physical mutations","Genetic drift only operates in asexual bacterial clones"],
    correct: 0,
    explain: "Genetic drift represents random stochastic fluctuations in allele frequencies independent of an allele's adaptive value, having its strongest effects in small populations (founder effect, bottlenecks)."
  },
  {
    id: "tcat-bio-401",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "Which cellular organelle is responsible for generating the majority of adenosine triphosphate (ATP) via aerobic oxidative phosphorylation?",
    options: [
      "Mitochondrion",
      "Endoplasmic Reticulum",
      "Lysosome",
      "Centrosome"
    ],
    correct: 0,
    explain: "Mitochondria are the power plants of eukaryotic cells, hosting the Krebs cycle and oxidative phosphorylation on the inner mitochondrial cristae."
  },
  {
    id: "tcat-bio-402",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "Which of the following nitrogenous bases is found exclusively in ribonucleic acid (RNA) and is absent in DNA?",
    options: [
      "Uracil",
      "Thymine",
      "Cytosine",
      "Guanine"
    ],
    correct: 0,
    explain: "Uracil replaces thymine in RNA and forms complementary base pairs with adenine via two hydrogen bonds."
  },
  {
    id: "tcat-bio-403",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Easy",
    q: "In the human circulatory system, which anatomical chamber of the heart pumps oxygenated blood into the aorta for systemic distribution?",
    options: [
      "Left ventricle",
      "Right ventricle",
      "Left atrium",
      "Right atrium"
    ],
    correct: 0,
    explain: "The left ventricle possesses thick muscular walls to generate high hydrostatic pressure, propelling oxygenated blood through the systemic aorta."
  },
  {
    id: "tcat-bio-404",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Easy",
    q: "What type of connective tissue connects skeletal muscle directly to bone?",
    options: [
      "Tendon",
      "Ligament",
      "Cartilage",
      "Synovial capsule"
    ],
    correct: 0,
    explain: "Tendons are dense fibrous bands connecting muscles to bones; ligaments connect bone to bone across articular joints."
  },
  {
    id: "tcat-bio-405",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Easy",
    q: "Which hormone synthesized by the beta cells of pancreatic islets lowers blood glucose concentration by stimulating cellular uptake and glycogen synthesis?",
    options: [
      "Insulin",
      "Glucagon",
      "Epinephrine",
      "Cortisol"
    ],
    correct: 0,
    explain: "Insulin facilitates glucose transport into skeletal myocytes and adipocytes while activating hepatic glycogenesis, lowering serum glucose."
  },
  {
    id: "tcat-bio-406",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Easy",
    q: "In humans, fertilization of the ovum by a spermatozoon typically takes place in which region of the female reproductive tract?",
    options: [
      "Ampulla of the Fallopian tube (oviduct)",
      "Uterine cavity",
      "Cervix",
      "Ovarian cortex"
    ],
    correct: 0,
    explain: "Fertilization normally occurs within the ampullary region of the Fallopian tube (oviduct)."
  },
  {
    id: "tcat-bio-407",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Easy",
    q: "What ecological term designates the specific functional role and trophic position occupied by an organism within its community?",
    options: [
      "Ecological niche",
      "Habitat",
      "Biome",
      "Ecosystem boundary"
    ],
    correct: 0,
    explain: "An ecological niche encompasses all biotic and abiotic resources used by an organism, including its trophic interactions and functional role."
  },
  {
    id: "tcat-bio-408",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Easy",
    q: "What is the net gain of ATP molecules produced per molecule of glucose metabolized exclusively during anaerobic glycolysis?",
    options: [
      "2 ATP",
      "4 ATP",
      "36 ATP",
      "38 ATP"
    ],
    correct: 0,
    explain: "Glycolysis consumes 2 ATP in the preparatory phase and generates 4 ATP in the payoff phase, yielding a net gain of 2 ATP per glucose."
  },
  {
    id: "tcat-bio-409",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Easy",
    q: "Enzymes accelerate biochemical reactions by directly:",
    options: [
      "Decreasing the activation energy barrier of the reaction",
      "Altering the overall equilibrium constant K_eq",
      "Increasing the total free energy change ΔG",
      "Increasing system temperature"
    ],
    correct: 0,
    explain: "Enzymes function as biocatalysts by stabilizing transition states, thereby reducing the activation energy required for the reaction."
  },
  {
    id: "tcat-bio-410",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Easy",
    q: "According to Mendel's Law of Segregation, during gametogenesis, the two alleles of a gene:",
    options: [
      "Separate into distinct gametes so that each gamete carries only one allele",
      "Blend permanently into an intermediate phenotype",
      "Replicate into polyploid homologous clusters",
      "Transmit together exclusively on the Y chromosome"
    ],
    correct: 0,
    explain: "Mendel's First Law states that paired alleles segregate during anaphase of meiosis, ensuring each haploid gamete receives only one allele."
  },
  {
    id: "tcat-bio-411",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Medium",
    q: "During the light-dependent reactions of photosynthesis in chloroplast thylakoids, photolysis of water produces molecular oxygen, electrons, and protons at which complex?",
    options: [
      "Photosystem II (P680 reaction center)",
      "Photosystem I (P700 reaction center)",
      "Cytochrome b6f complex",
      "ATP synthase (CF0-CF1)"
    ],
    correct: 0,
    explain: "Water-splitting enzyme (oxygen-evolving complex) resides on the luminal side of Photosystem II (P680), extracting electrons from H2O to replace photo-excited electrons."
  },
  {
    id: "tcat-bio-412",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Medium",
    q: "Which structural level of protein organization is defined primarily by alpha-helices and beta-pleated sheets formed by hydrogen bonds between peptide backbone atoms?",
    options: [
      "Secondary structure",
      "Primary structure",
      "Tertiary structure",
      "Quaternary structure"
    ],
    correct: 0,
    explain: "Secondary structure consists of local repeating conformations (alpha-helices and beta-sheets) stabilized by hydrogen bonds between backbone C=O and N-H groups."
  },
  {
    id: "tcat-bio-413",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Medium",
    q: "In the mammalian nephron, where does the majority of water and essential solute (glucose, amino acids) reabsorption occur?",
    options: [
      "Proximal Convoluted Tubule (PCT)",
      "Loop of Henle ascending limb",
      "Distal Convoluted Tubule (DCT)",
      "Collecting Duct"
    ],
    correct: 0,
    explain: "The proximal convoluted tubule (PCT) reabsorbs approximately 65-70% of filtered water and sodium, and nearly 100% of filtered glucose and amino acids."
  },
  {
    id: "tcat-bio-414",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Medium",
    q: "According to the sliding filament theory of muscle contraction, which band or zone within the sarcomere narrows and disappears during maximal muscular shortening?",
    options: [
      "H zone and I band",
      "A band exclusively",
      "M line",
      "Z disc width"
    ],
    correct: 0,
    explain: "During cross-bridge cycling, thin actin filaments slide past thick myosin filaments toward the M line; the H zone (myosin only) and I band (actin only) narrow and vanish, while the A band remains constant."
  },
  {
    id: "tcat-bio-415",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "During the depolarization phase of a neuronal action potential, which ion channels open rapidly to alter membrane potential toward +30 mV?",
    options: [
      "Voltage-gated sodium (Na+) channels",
      "Voltage-gated potassium (K+) channels",
      "Ligand-gated chloride (Cl-) channels",
      "Calcium-ATPase pumps"
    ],
    correct: 0,
    explain: "Threshold depolarization triggers rapid opening of voltage-gated Na+ activation gates, allowing massive influx of Na+ into the axon, driving depolarization."
  },
  {
    id: "tcat-bio-416",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Medium",
    q: "Which extra-embryonic membrane forms the primary fetal contribution to the mammalian placenta for maternal-fetal metabolic exchange?",
    options: [
      "Chorion",
      "Amnion",
      "Yolk sac",
      "Allantois"
    ],
    correct: 0,
    explain: "The chorion develops chorionic villi that interdigitate with maternal endometrium, establishing the maternal-fetal placental exchange surface."
  },
  {
    id: "tcat-bio-417",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "Under the Hardy-Weinberg equilibrium principle for a two-allele locus (p + q = 1), what expression predicts the expected frequency of heterozygous individuals?",
    options: [
      "2pq",
      "p^2",
      "q^2",
      "p^2 + q^2"
    ],
    correct: 0,
    explain: "The Hardy-Weinberg binomial expansion is p^2 + 2pq + q^2 = 1, where 2pq represents the theoretical frequency of heterozygous genotypes."
  },
  {
    id: "tcat-bio-418",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Medium",
    q: "In molecular genetics, what is the role of the enzyme DNA ligase in recombinant DNA technology and lagging strand DNA replication?",
    options: [
      "Catalyzing the formation of phosphodiester bonds to join adjacent Okazaki fragments or DNA fragments",
      "Unwinding the double-stranded DNA helix at replication forks",
      "Synthesizing RNA primers complementary to template DNA",
      "Removing nucleotide mismatches via 3'-to-5' exonuclease proofreading"
    ],
    correct: 0,
    explain: "DNA ligase catalyzes the synthesis of covalent phosphodiester bonds between adjacent 3'-OH and 5'-phosphate ends of DNA fragments."
  },
  {
    id: "tcat-bio-419",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Medium",
    q: "Which autonomic division prepares the human body for stressful emergencies by accelerating heart rate, dilating bronchioles, and inhibiting peristalsis?",
    options: [
      "Sympathetic nervous system",
      "Parasympathetic nervous system",
      "Enteric nervous system",
      "Somatic sensory system"
    ],
    correct: 0,
    explain: "The sympathetic division mediates the fight-or-flight response via noradrenaline and adrenaline, increasing cardiovascular and respiratory throughput."
  },
  {
    id: "tcat-bio-420",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Medium",
    q: "What ecological principle dictates that two competing species with identical ecological niches cannot stably coexist indefinitely in the same habitat?",
    options: [
      "Gause's Competitive Exclusion Principle",
      "Bergmann's Ecological Rule",
      "Allen's Morphological Law",
      "Liebig's Law of the Minimum"
    ],
    correct: 0,
    explain: "Gause's Principle asserts that complete competitors cannot coexist; the species with even a slight ecological advantage will outcompete and exclude the other."
  },
  {
    id: "tcat-bio-421",
    subject: "Biology",
    topic: "Cell Biology & Bioenergetics",
    difficulty: "Hard",
    q: "In the mitochondrial electron transport chain, how many protons are pumped across the inner mitochondrial membrane into the intermembrane space per pair of electrons transferred from NADH to molecular oxygen?",
    options: [
      "10 protons (4 via Complex I, 4 via Complex III, 2 via Complex IV)",
      "6 protons",
      "12 protons",
      "4 protons"
    ],
    correct: 0,
    explain: "Electron transfer from NADH pumps 4 protons at Complex I, 4 protons at Complex III (Q-cycle), and 2 protons at Complex IV, totaling 10 protons per NADH pair."
  },
  {
    id: "tcat-bio-422",
    subject: "Biology",
    topic: "Biological Molecules",
    difficulty: "Hard",
    q: "In enzyme kinetics governed by the Michaelis-Menten model, what effect does a reversible competitive inhibitor exert on the kinetic parameters V_max and K_m?",
    options: [
      "K_m increases (apparent affinity decreases) while V_max remains unaltered",
      "V_max decreases while K_m remains unaltered",
      "Both V_max and K_m decrease proportionally",
      "Both V_max and K_m increase simultaneously"
    ],
    correct: 0,
    explain: "Competitive inhibitors compete directly with substrate for the active site; high substrate concentration overcomes inhibition, preserving V_max but elevating apparent K_m."
  },
  {
    id: "tcat-bio-423",
    subject: "Biology",
    topic: "Human Physiology",
    difficulty: "Hard",
    q: "What is the physiological role of the countercurrent multiplier mechanism established by the juxtamedullary nephron loops of Henle?",
    options: [
      "Establishing a hyperosmotic medullary concentration gradient enabling water reabsorption under vasopressin control",
      "Directly excreting urea into the renal pelvis via active transport",
      "Filtering high-molecular-weight plasma globulins into Bowman's space",
      "Regulating systemic arterial pressure through aldosterone degradation"
    ],
    correct: 0,
    explain: "The differential permeabilities of the descending and ascending limbs generate an osmotic medullary gradient up to 1200 mOsm/L, driving urine concentration."
  },
  {
    id: "tcat-bio-424",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "What event triggers the release of the myosin head from the actin binding site during the cross-bridge cycle in skeletal muscle contraction?",
    options: [
      "Binding of a fresh ATP molecule to the nucleotide pocket on the myosin head",
      "Hydrolysis of ATP into ADP and inorganic phosphate (Pi)",
      "Release of inorganic phosphate (Pi) triggering the power stroke",
      "Sequestration of calcium ions into the sarcoplasmic reticulum"
    ],
    correct: 0,
    explain: "ATP binding causes detachment of the myosin head from actin. In the absence of ATP, cross-bridges remain locked in the rigor state (rigor mortis)."
  },
  {
    id: "tcat-bio-425",
    subject: "Biology",
    topic: "Coordination & Control",
    difficulty: "Hard",
    q: "In the visual phototransduction cascade in retinal rod photoreceptor cells, what occurs upon photon absorption by rhodopsin?",
    options: [
      "11-cis-retinal photoisomerizes to all-trans-retinal, activating transducin, which activates phosphodiesterase to hydrolyze cGMP and hyperpolarize the rod",
      "Rhodopsin opens cGMP-gated sodium channels, causing depolarization",
      "Intracellular calcium rises, triggering immediate exocytosis of glutamate",
      "Transducin phosphorylates arrestin to open potassium leak channels"
    ],
    correct: 0,
    explain: "Light activates rhodopsin, triggering G-protein transducin to activate cGMP phosphodiesterase. Falling cGMP closes cGMP-gated Na+ channels, hyperpolarizing the cell."
  },
  {
    id: "tcat-bio-426",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "During mammalian embryonic development, what structure arises from the epiblast during gastrulation and secretes sonic hedgehog to induce neural tube formation from the overlying ectoderm?",
    options: [
      "Notochord",
      "Hypoblast",
      "Trophoblast",
      "Somitocoele"
    ],
    correct: 0,
    explain: "The notochord acts as the primary embryonic organizer, signaling the overlying neural plate ectoderm to fold into the neural tube."
  },
  {
    id: "tcat-bio-427",
    subject: "Biology",
    topic: "Genetics & Biotechnology",
    difficulty: "Hard",
    q: "Which bacterial defense endonuclease system produces blunt ends when cleaving double-stranded DNA?",
    options: [
      "SmaI (cleaving CCC^GGG)",
      "EcoRI (cleaving G^AATTC)",
      "HindIII (cleaving A^AGCTT)",
      "BamHI (cleaving G^GATCC)"
    ],
    correct: 0,
    explain: "SmaI recognizes the 5'-CCCGGG-3' hexanucleotide sequence and cleaves straight between the central C and G, producing blunt non-overhanging termini."
  },
  {
    id: "tcat-bio-428",
    subject: "Biology",
    topic: "Evolution & Ecology",
    difficulty: "Hard",
    q: "In population genetics, what phenomenon describes the dramatic reduction in genetic diversity when a small group of emigrants establishes a new colony isolated from the parent population?",
    options: [
      "Founder effect",
      "Balancing selection",
      "Sympatric reinforcement",
      "Frequency-dependent selection"
    ],
    correct: 0,
    explain: "The founder effect is an extreme form of genetic drift that occurs when a new colony is initiated by a few individuals, skewing allele frequencies."
  },
  {
    id: "tcat-bio-429",
    subject: "Biology",
    topic: "Support & Movement",
    difficulty: "Hard",
    q: "What is the functional biological role of the Haversian (osteon) canal system in dense mammalian compact bone?",
    options: [
      "Housing longitudinal blood vessels, lymphatics, and nerve fibers to nourish osteocytes trapped in lacunae",
      "Storing yellow adipose tissue exclusively",
      "Synthesizing synovial lubricating fluid",
      "Providing an elastic matrix for cartilage regeneration"
    ],
    correct: 0,
    explain: "Haversian canals are neurovascular conduits that deliver capillary blood, nutrients, and autonomic innervation to osteocytes through radiating canaliculi."
  },
  {
    id: "tcat-bio-430",
    subject: "Biology",
    topic: "Reproduction & Development",
    difficulty: "Hard",
    q: "In the human ovarian cycle, what hormonal surge triggers the final resumption of meiosis I and the rupture of the Graafian follicle during ovulation?",
    options: [
      "Luteinizing Hormone (LH) surge",
      "Progesterone peak",
      "Human Chorionic Gonadotropin (hCG) surge",
      "Prolactin surge"
    ],
    correct: 0,
    explain: "Sustained high estradiol levels from the mature follicle switch from negative to positive feedback on the pituitary, generating an LH surge that induces ovulation."
  }
];
