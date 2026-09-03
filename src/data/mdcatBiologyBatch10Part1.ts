import { Question } from '../types';

export const MDCAT_BIOLOGY_BATCH10_PART1: Question[] = [
  // --- Bio Molecules (8 MCQs: 1 to 8) ---
  {
    id: 'mdcat-b10-bio-1',
    q: 'In the tertiary and quaternary structure of globular proteins, which of the following covalent bonds provides the strongest stabilizing interaction against thermal denaturation?',
    options: [
      'Disulfide bridges formed between cysteine sulfhydryl (-SH) residues',
      'Hydrogen bonds between peptide backbone carbonyl and amide groups',
      'Hydrophobic interactions between non-polar aliphatic side chains',
      'Van der Waals dispersion forces between aromatic rings'
    ],
    correct: 0,
    topic: 'Proteins - Tertiary Structure and Disulfide Bonding',
    chapter: 'Bio Molecules',
    explain: 'Disulfide bonds (-S-S-) are covalent linkages formed by the oxidation of two cysteine thiol (-SH) groups. Because covalent bonds have bond dissociation energies of ~200-400 kJ/mol (compared to 10-30 kJ/mol for hydrogen or ionic bonds), they confer the highest stability against thermal denaturation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-2',
    q: 'Which monosaccharide forms the monomeric repeating unit in cellulose, and what type of glycosidic linkage connects these units in linear, unbranched fibrillar sheets?',
    options: [
      'β-D-glucose linked by β-1,4-glycosidic bonds',
      'α-D-glucose linked by α-1,4-glycosidic bonds',
      'α-D-glucose linked by α-1,6-glycosidic bonds',
      'β-D-fructose linked by β-1,2-glycosidic bonds'
    ],
    correct: 0,
    topic: 'Carbohydrates - Cellulose Structure and Glycosidic Bonds',
    chapter: 'Bio Molecules',
    explain: 'Cellulose is a linear, unbranched homopolysaccharide of β-D-glucopyranose units connected by β-1,4-glycosidic bonds. This configuration allows straight extended chains stabilized by inter- and intra-chain hydrogen bonds, creating crystalline microfibrils.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-3',
    q: 'Sphingomyelins, which form the primary lipid constituent of the myelin sheath insulating nerve axons, are composed of sphingosine, a fatty acid, and which polar head group?',
    options: [
      'Phosphocholine or phosphoethanolamine',
      'Glycerol-3-phosphate',
      'Inositol triphosphate',
      'Galactose oligosaccharide'
    ],
    correct: 0,
    topic: 'Lipids - Sphingolipids and Myelin Sheath Composition',
    chapter: 'Bio Molecules',
    explain: 'Sphingomyelins consist of an amino alcohol sphingosine backbone attached to a fatty acid via an amide linkage (forming ceramide) and a phosphocholine or phosphoethanolamine head group esterified to the terminal hydroxyl group.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-4',
    q: 'During the chemical hydrolysis of a triglyceride molecule under physiological conditions, how many ester bonds are cleaved and what are the final stoichiometric products?',
    options: [
      '3 ester bonds cleaved, yielding 1 molecule of glycerol and 3 free fatty acid molecules',
      '2 ester bonds cleaved, yielding 1 molecule of diacylglycerol and 1 free fatty acid',
      '1 ester bond cleaved, yielding 1 phosphatidic acid and 2 fatty acids',
      '4 ester bonds cleaved, yielding 2 glycerol molecules and 4 fatty acids'
    ],
    correct: 0,
    topic: 'Lipids - Triglyceride Hydrolysis and Ester Cleavage',
    chapter: 'Bio Molecules',
    explain: 'Triglycerides are triesters of glycerol and three fatty acids. Complete enzymatic hydrolysis by lipases cleaves all three ester bonds, consuming three water molecules and generating one glycerol and three free fatty acids.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-5',
    q: 'Which nitrogenous base pair in double-stranded B-DNA is stabilized by exactly three intermolecular hydrogen bonds, contributing more significantly to the thermal denaturation melting temperature (Tm)?',
    options: [
      'Guanine and Cytosine (G ≡ C)',
      'Adenine and Thymine (A = T)',
      'Adenine and Uracil (A = U)',
      'Inosine and Cytosine (I = C)'
    ],
    correct: 0,
    topic: 'Nucleic Acids - Watson-Crick Base Pairing and DNA Melting Temperature',
    chapter: 'Bio Molecules',
    explain: 'Guanine pairs with cytosine via three specific hydrogen bonds (carbonyl to amino, ring NH to ring N, amino to carbonyl), whereas adenine pairs with thymine via only two hydrogen bonds. High G-C content therefore elevates the DNA melting temperature (Tm).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-6',
    q: 'Which of the following amino acids contains a secondary α-amino group locked into a rigid five-membered pyrrolidine ring, frequently introducing steric bends or disruptions in α-helical secondary structures?',
    options: [
      'Proline',
      'Glycine',
      'Tryptophan',
      'Histidine'
    ],
    correct: 0,
    topic: 'Proteins - Amino Acid Conformations and Helix Breakers',
    chapter: 'Bio Molecules',
    explain: 'Proline has a cyclic imino acid side chain that re-enters the peptide backbone, restricting the phi (φ) dihedral angle and lacking an amide hydrogen for backbone hydrogen bonding. Thus, proline acts as a conformational "helix breaker".',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-7',
    q: 'Transfer RNA (tRNA) molecules possess a universal trinucleotide sequence at their 3\'-hydroxyl terminus to which the specific activated amino acid is covalently attached by aminoacyl-tRNA synthetase. What is this sequence?',
    options: [
      '5\'-CCA-3\'',
      '5\'-AUG-3\'',
      '5\'-UAA-3\'',
      '5\'-GCA-3\''
    ],
    correct: 0,
    topic: 'Nucleic Acids - tRNA Terminal Sequence and Amino Acid Attachment',
    chapter: 'Bio Molecules',
    explain: 'Every mature tRNA terminates with the conserved trinucleotide CCA at its 3\' end. The activated amino acid is esterified through its carboxyl group to the 2\'- or 3\'-hydroxyl group of the terminal adenosine.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-8',
    q: 'The high heat capacity and high heat of vaporization of liquid water, which enable it to act as an effective thermal buffer and evaporative coolant in living organisms, are directly attributable to:',
    options: [
      'Extensive intermolecular hydrogen bonding networks between dipolar water molecules',
      'Covalent bond cleavage between hydrogen and oxygen at room temperature',
      'High molecular weight of oxygen atoms',
      'Dipole repulsion between non-polar hydrophobic surfaces'
    ],
    correct: 0,
    topic: 'Water - Thermal Properties and Intermolecular Hydrogen Bonding',
    chapter: 'Bio Molecules',
    explain: 'Each water molecule can donate two hydrogen bonds and accept two through its lone pairs, forming dynamic tetrahedral hydrogen-bonded networks. A large amount of thermal energy is absorbed to break these bonds, producing a high specific heat capacity (4.184 J/g°C) and high heat of vaporization (~2.26 kJ/g).',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Cell Structure and Function (8 MCQs: 9 to 16) ---
  {
    id: 'mdcat-b10-bio-9',
    q: 'Which eukaryotic organelle contains acidic hydrolases maintained at an optimal internal pH of ~4.5 to 5.0 by membrane-bound vacuolar H⁺-ATPase proton pumps?',
    options: [
      'Lysosome',
      'Peroxisome',
      'Endoplasmic reticulum',
      'Golgi cisternae'
    ],
    correct: 0,
    topic: 'Cell Organelles - Lysosomal Function and Acid Hydrolases',
    chapter: 'Cell Structure and Function',
    explain: 'Lysosomes contain around 50 acid hydrolases (nucleases, proteases, lipases, glycosidases) that require an acidic lumen (~pH 4.8) maintained by an ATP-driven V-type proton pump. Peroxisomes contain catalases and oxidases at neutral pH.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-10',
    q: 'In the Singer-Nicolson fluid mosaic model of cellular membranes, what effect does cholesterol have on eukaryotic plasma membrane fluidity at physiologically elevated temperatures (e.g., 37°C)?',
    options: [
      'Decreases fluidity by immobilizing hydrocarbon chains of adjacent phospholipids',
      'Increases fluidity by promoting membrane crystallization',
      'Dissolves peripheral transmembrane proteins',
      'Cleaves unsaturated fatty acid double bonds'
    ],
    correct: 0,
    topic: 'Cell Membrane - Cholesterol and Membrane Fluidity Regulation',
    chapter: 'Cell Structure and Function',
    explain: 'Cholesterol acts as a bidirectional membrane fluidity buffer. At high temperatures (37°C), its rigid steroid planar ring system restricts the thermal motion of fatty acyl chains, decreasing fluidity. At low temperatures, it prevents tight packing, hindering phase transitions to solid gel states.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-11',
    q: 'Nuclear pore complexes (NPCs) permit selective nucleocytoplasmic transport of proteins bearing a nuclear localization signal (NLS). Which transport receptor binds the NLS and mediates transit through the pore?',
    options: [
      'Importin-α/β heterodimer',
      'Exportin-1 (CRM1)',
      'Clathrin adaptor AP-2',
      'Signal recognition particle (SRP)'
    ],
    correct: 0,
    topic: 'Nucleus - Nuclear Pore Complex and Active Nuclear Import',
    chapter: 'Cell Structure and Function',
    explain: 'Proteins destined for the nucleus possess basic nuclear localization signals (NLS) recognized by importin-α, which acts as an adaptor to bind importin-β. Importin-β interacts with phenylalanine-glycine (FG) repeats in nucleoporins to facilitate translocation across the nuclear pore complex.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-12',
    q: 'Microfilaments, which are essential for ameboid motility, cytokinesis furrowing, and microvilli core architecture, are composed of helical polymers of:',
    options: [
      'Globular actin (G-actin forming filamentous F-actin)',
      'α- and β-tubulin heterodimers',
      'Vimentin and desmin intermediate filaments',
      'Myosin heavy chain heads'
    ],
    correct: 0,
    topic: 'Cytoskeleton - Microfilaments and Actin Polymerization',
    chapter: 'Cell Structure and Function',
    explain: 'Microfilaments (~7 nm diameter) are formed by the ATP-dependent polymerization of globular monomeric G-actin into two intertwined helical strands of filamentous F-actin. Tubulin forms microtubules (~25 nm).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-13',
    q: 'Which post-translational modification and protein sorting process takes place specifically in the cis-to-trans cisternae of the Golgi apparatus?',
    options: [
      'O-linked glycosylation, modification of N-linked oligosaccharides, and sorting to lysosomes, plasma membrane, or secretory vesicles',
      'Synthesis of core lipid-linked precursor oligosaccharides on dolichol phosphate',
      'Peptide bond synthesis during mRNA translation',
      'Oxidation of long-chain fatty acids into acetyl-CoA'
    ],
    correct: 0,
    topic: 'Golgi Apparatus - Post-Translational Glycosylation and Protein Sorting',
    chapter: 'Cell Structure and Function',
    explain: 'The Golgi apparatus modifies glycoproteins delivered from the rough ER (trimming mannose residues, adding galactose, sialic acid, and O-linked sugars) and sorts them at the trans-Golgi network for targeted delivery to lysosomes, secretory granules, or the cell surface.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-14',
    q: 'Bacterial cell walls contain peptidoglycan (murein) composed of alternating units of N-acetylglucosamine (NAG) and N-acetylmuramic acid (NAM) linked by β-1,4-glycosidic bonds. Which enzyme present in human tears and saliva hydrolyzes this specific bond?',
    options: [
      'Lysozyme',
      'Pepsin',
      'Amylase',
      'Lipase'
    ],
    correct: 0,
    topic: 'Prokaryotes vs Eukaryotes - Peptidoglycan Cell Wall and Lysozyme',
    chapter: 'Cell Structure and Function',
    explain: 'Lysozyme is an innate antimicrobial enzyme that hydrolyzes the β-1,4-glycosidic linkages between NAM and NAG in bacterial peptidoglycan walls, causing osmotic lysis of Gram-positive bacteria.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-15',
    q: 'Plasmodesmata in plant tissues and gap junctions in animal tissues share which functional characteristic?',
    options: [
      'Direct symplastic/cytoplasmic intercellular communication permitting transport of small ions and signaling molecules (<1 kDa)',
      'Formation of impermeable tight seals preventing paracellular solute movement',
      'Anchoring intermediate filaments to desmosomal cadherins',
      'Exocytosis of large polypeptide hormones via clathrin-coated pits'
    ],
    correct: 0,
    topic: 'Intercellular Junctions - Plasmodesmata vs Gap Junctions',
    chapter: 'Cell Structure and Function',
    explain: 'Both plasmodesmata (in plant cells) and gap junctions (composed of connexon hexamers in animal cells) provide continuous aqueous cytoplasmic channels that allow ions, second messengers (cAMP, IP3), and metabolites to pass directly between adjacent cells.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-16',
    q: 'The primary site for non-oxidative synthesis of steroid hormones (such as testosterone and estrogen) and detoxification of lipophilic xenobiotics in hepatic cells is the:',
    options: [
      'Smooth endoplasmic reticulum (SER)',
      'Rough endoplasmic reticulum (RER)',
      'Outer mitochondrial membrane',
      'Peroxisomal matrix'
    ],
    correct: 0,
    topic: 'Endoplasmic Reticulum - Smooth ER Functions and Steroidogenesis',
    chapter: 'Cell Structure and Function',
    explain: 'The smooth endoplasmic reticulum lacks ribosomes and contains enzymes for lipid and steroid hormone biosynthesis (e.g., in Leydig cells and adrenal cortex) as well as the cytochrome P450 monooxygenase system for drug detoxification in hepatocytes.',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Enzymes (8 MCQs: 17 to 24) ---
  {
    id: 'mdcat-b10-bio-17',
    q: 'In the Michaelis-Menten kinetic model of enzyme action, the Michaelis constant (Km) physically represents:',
    options: [
      'The substrate concentration at which the reaction velocity is exactly half of the maximal velocity (1/2 Vmax)',
      'The maximal velocity attained at infinite substrate concentration',
      'The turnover number (kcat) of the catalytic active site',
      'The dissociation constant of the enzyme-inhibitor complex (Ki)'
    ],
    correct: 0,
    topic: 'Enzyme Kinetics - Michaelis Constant (Km) Definition',
    chapter: 'Enzymes',
    explain: 'By definition in the Michaelis-Menten equation v = (Vmax [S]) / (Km + [S]), when [S] = Km, v = (Vmax Km) / (2 Km) = Vmax / 2. A lower Km indicates higher affinity for substrate.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-18',
    q: 'How does a reversible competitive inhibitor affect the kinetic parameters Vmax and Km of an enzymatic reaction?',
    options: [
      'Apparent Km increases, while Vmax remains unchanged',
      'Vmax decreases, while Km remains unchanged',
      'Both Vmax and Km decrease by identical ratios',
      'Both Vmax and Km increase proportionally'
    ],
    correct: 0,
    topic: 'Enzyme Inhibition - Competitive Inhibitor Kinetics',
    chapter: 'Enzymes',
    explain: 'A competitive inhibitor competes directly with substrate for the active catalytic site. By adding excess substrate, the inhibitor can be outcompeted, so Vmax is unaffected. However, a higher substrate concentration is required to reach half Vmax, so apparent Km increases.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-19',
    q: 'Which catalytic strategy explains how enzymes accelerate chemical reaction rates by factors of 10⁶ to 10¹² without altering the overall thermodynamic equilibrium constant (Keq)?',
    options: [
      'Lowering the Gibbs free energy of activation (ΔG‡) by stabilizing the high-energy transition state',
      'Increasing the standard free energy change (ΔG°) between reactants and products',
      'Shifting the chemical equilibrium toward products by consuming reactants',
      'Raising the ambient kinetic temperature of substrate molecules'
    ],
    correct: 0,
    topic: 'Enzyme Mechanism - Lowering Activation Energy Barrier',
    chapter: 'Enzymes',
    explain: 'Enzymes bind preferentially to the transition state rather than ground-state substrates, thereby lowering the activation energy barrier (ΔG‡). Because ΔG° between initial reactants and final products remains unchanged, the equilibrium constant Keq is not altered.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-20',
    q: 'An organic non-protein cofactor that is tightly and permanently covalently bound to an enzyme molecule is formally designated as a:',
    options: [
      'Prosthetic group',
      'Coenzyme',
      'Apoenzyme',
      'Zymogen'
    ],
    correct: 0,
    topic: 'Enzymes - Cofactors, Coenzymes, and Prosthetic Groups',
    chapter: 'Enzymes',
    explain: 'A prosthetic group is a non-protein organic or organometallic cofactor (e.g., heme in hemoglobin/cytochromes, FAD in succinate dehydrogenase) that is covalently or tightly bound to the protein. Coenzymes are loosely associated organic molecules (e.g., NAD⁺).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-21',
    q: 'Feedback inhibition (end-product inhibition) of an unbranched metabolic biosynthetic pathway typically operates by which biochemical mechanism?',
    options: [
      'The final downstream product binds to an allosteric regulatory site on the first committed-step enzyme, causing an inhibitory conformational change',
      'The end-product covalently degrades the mRNA transcript of all pathway enzymes',
      'The end-product competes irreversibly for the catalytic active site of the final enzyme',
      'The end-product activates lysosomal proteolysis of pathway cofactors'
    ],
    correct: 0,
    topic: 'Enzymatic Regulation - Allosteric Feedback Inhibition',
    chapter: 'Enzymes',
    explain: 'Feedback inhibition occurs when the ultimate pathway product accumulates and binds to a specific allosteric site (distinct from the active site) on the first pace-making enzyme (e.g., threonine deaminase inhibited by isoleucine), downregulating flux without wasting intermediates.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-22',
    q: 'What happens to the structure and catalytic function of most human intracellular enzymes when the temperature is elevated beyond 60°C?',
    options: [
      'Thermal denaturation occurs due to disruption of non-covalent hydrogen and ionic bonds, causing irreversible loss of active-site conformation',
      'Activation energy increases, making the reaction faster',
      'The enzyme converts into a zymogen precursor',
      'Peptide bonds are cleaved into free individual amino acids'
    ],
    correct: 0,
    topic: 'Enzymes - Effect of High Temperature and Thermal Denaturation',
    chapter: 'Enzymes',
    explain: 'At high temperatures (>50-60°C for mesophilic enzymes), increased vibrational kinetic energy disrupts delicate tertiary and quaternary non-covalent interactions (hydrogen bonds, ionic attractions, hydrophobic forces), causing unfolding (denaturation) and loss of active-site geometry.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-23',
    q: 'In the induced-fit model of enzyme action proposed by Daniel Koshland, how does substrate binding occur?',
    options: [
      'Binding of the substrate induces a precise reciprocal conformational change in the enzyme active site, aligning catalytic residues optimally around the transition state',
      'The active site is a rigid, unyielding geometric lock that perfectly matches the substrate in its ground state',
      'Substrate molecules are cleaved before touching the enzyme surface',
      'The enzyme unfolds entirely into an unstructured random coil upon substrate collision'
    ],
    correct: 0,
    topic: 'Enzymes - Koshland Induced-Fit Model',
    chapter: 'Enzymes',
    explain: 'Koshland\'s induced-fit model states that the enzyme active site is flexible. Initial weak binding of the substrate triggers a conformational rearrangement of the catalytic cleft, molding the active site around the transition state to maximize catalytic efficiency.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-24',
    q: 'In an uncompetitive enzyme inhibition pattern, how do the Lineweaver-Burk double reciprocal plots (1/v vs 1/[S]) compare between the uninhibited and inhibited states?',
    options: [
      'They yield parallel lines with identical slopes (Km/Vmax) because both Vmax and apparent Km decrease by the same factor',
      'They intersect directly on the y-axis (identical Vmax)',
      'They intersect directly on the negative x-axis (identical Km)',
      'They exhibit intersecting lines in the first positive quadrant'
    ],
    correct: 0,
    topic: 'Enzyme Kinetics - Uncompetitive Inhibition and Lineweaver-Burk Plots',
    chapter: 'Enzymes',
    explain: 'An uncompetitive inhibitor binds exclusively to the enzyme-substrate complex (ES). This reduces both Vmax and apparent Km by the same factor α\', so the slope (Km/Vmax) is unchanged. On a Lineweaver-Burk plot, this produces parallel lines.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Cell Division (8 MCQs: 25 to 32) ---
  {
    id: 'mdcat-b10-bio-25',
    q: 'At which sub-stage of Prophase I in meiosis does crossing over and genetic recombination between non-sister chromatids of homologous chromosomes take place?',
    options: [
      'Pachytene',
      'Leptotene',
      'Zygotene',
      'Diakinesis'
    ],
    correct: 0,
    topic: 'Meiosis - Stages of Prophase I and Crossing Over',
    chapter: 'Cell Division',
    explain: 'Synapsis occurs in zygotene. Once the synaptonemal complex is fully formed, reciprocal genetic exchange (crossing over) mediated by recombination nodules occurs during pachytene. Chiasmata become visible in diplotene.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-26',
    q: 'The spindle assembly checkpoint (SAC) during eukaryotic mitosis monitors kinetochore attachment to prevent premature anaphase onset. What biochemical event triggers chromosome segregation once all kinetochores are under bipolar tension?',
    options: [
      'Activation of the Anaphase-Promoting Complex/Cyclosome (APC/C), leading to ubiquitination of securin and activation of separase to cleave cohesin rings',
      'Phosphorylation of nuclear lamin A to reform the nuclear envelope',
      'Inhibition of cyclin B degradation by CDK1',
      'Dephosphorylation of condensin complexes'
    ],
    correct: 0,
    topic: 'Mitosis - Spindle Assembly Checkpoint and Separase Activation',
    chapter: 'Cell Division',
    explain: 'Bipolar tension silences the SAC, enabling APC/C-Cdc20 to ubiquitinate securin. Degradation of securin releases the active protease separase, which cleaves the Scc1 subunit of cohesin complexes, allowing sister chromatids to separate toward opposite poles.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-27',
    q: 'A diploid somatic human cell in the G2 phase of the cell cycle contains how many chromatids and how many chromosomes?',
    options: [
      '46 chromosomes and 92 sister chromatids',
      '46 chromosomes and 46 chromatids',
      '23 chromosomes and 46 chromatids',
      '92 chromosomes and 92 chromatids'
    ],
    correct: 0,
    topic: 'Cell Cycle - Chromosome and Chromatid Counts in G2 Phase',
    chapter: 'Cell Division',
    explain: 'During S phase, DNA replication duplicates each of the 46 chromosomes into two identical sister chromatids joined at a common centromere. Thus, in G2 phase there remain 46 chromosomes, consisting of 92 sister chromatids (4C DNA content).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-28',
    q: 'Which tumor suppressor protein, frequently termed the "guardian of the genome," arrests the cell cycle at the G1/S restriction point in response to double-stranded DNA damage by inducing transcription of the cyclin-dependent kinase inhibitor p21?',
    options: [
      'p53',
      'pRb (Retinoblastoma protein)',
      'Myc',
      'Ras'
    ],
    correct: 0,
    topic: 'Cell Cycle Regulation - Tumor Suppressor p53 and G1/S Checkpoint',
    chapter: 'Cell Division',
    explain: 'ATM/ATR kinases activate p53 in response to DNA damage. Phosphorylated p53 tetramers bind promoter elements to transcribe p21 (CIP1/WAF1), which inhibits Cdk2-cyclin E complexes, arresting cells in G1 to permit DNA repair or initiate apoptosis if damage is irreparable.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-29',
    q: 'Colchicine and nocodazole act as antimitotic agents that arrest dividing cells in metaphase by which cellular mechanism?',
    options: [
      'Inhibiting tubulin polymerization, preventing mitotic spindle assembly',
      'Stabilizing actin filaments in the contractile ring',
      'Blocking DNA polymerase δ replication fork progression',
      'Preventing centromeric DNA methylation'
    ],
    correct: 0,
    topic: 'Cell Division - Antimitotic Drugs and Microtubule Disruption',
    chapter: 'Cell Division',
    explain: 'Colchicine binds free α/β-tubulin heterodimers, preventing their polymerization into spindle microtubules. This triggers the spindle assembly checkpoint, arresting cells in metaphase (used in karyotyping).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-30',
    q: 'Cytokinesis in higher plant cells differs fundamentally from animal cells because plant cells cannot form a cleavage furrow. Instead, they divide by constructing:',
    options: [
      'A cell plate (phragmoplast) assembled from Golgi-derived vesicles fusing along the equatorial plane',
      'An actomyosin contractile ring pinching the outer cellulose cell wall inward',
      'A septin filament bundle that invaginates the outer cuticle',
      'Spontaneous binary fission of the nuclear membrane'
    ],
    correct: 0,
    topic: 'Cell Division - Plant Cytokinesis and Phragmoplast Formation',
    chapter: 'Cell Division',
    explain: 'Because rigid plant cell walls prevent inward cleavage furrowing, plant cytokinesis proceeds centrifugally via the phragmoplast. Golgi-derived vesicles carrying cell wall precursors (pectins, hemicelluloses) fuse along the equator to form the middle lamella and primary cell plate.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-31',
    q: 'What is the developmental significance of non-disjunction occurring during Anaphase I of meiosis versus Anaphase II?',
    options: [
      'Non-disjunction in Anaphase I produces 100% abnormal gametes (two n+1 and two n-1), whereas non-disjunction in Anaphase II produces 50% normal (n, n) and 50% abnormal gametes (n+1, n-1)',
      'Non-disjunction in Anaphase I produces 50% normal gametes, while Anaphase II produces 100% aneuploid gametes',
      'Both events invariably produce 100% polyploid gametes',
      'Anaphase I non-disjunction affects only sex chromosomes, never autosomes'
    ],
    correct: 0,
    topic: 'Meiosis - Chromosomal Non-Disjunction and Aneuploidy',
    chapter: 'Cell Division',
    explain: 'In Anaphase I non-disjunction, both homologous chromosomes migrate to one pole, yielding gametes that are all abnormal (50% n+1, 50% n-1). In Anaphase II non-disjunction, one pair of sister chromatids fails to separate, yielding two normal gametes (n), one n+1, and one n-1 (50% normal, 50% aneuploid).',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-32',
    q: 'Programmed cell death (apoptosis) is biochemically executed by a specialized family of cysteine-dependent aspartate-directed proteases termed:',
    options: [
      'Caspases',
      'Matrix metalloproteinases',
      'Ubiquitin ligases',
      'Telomerases'
    ],
    correct: 0,
    topic: 'Cell Death - Apoptosis and Caspase Cascade',
    chapter: 'Cell Division',
    explain: 'Caspases (cysteine aspartic proteases) exist as inactive procaspases. Initiator caspases (caspase-8, -9) activate executioner caspases (caspase-3, -6, -7), which cleave vital cytoskeletal proteins and activate CAD endonuclease to cleave genomic DNA into nucleosomal fragments.',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Diversity Among Animals (8 MCQs: 33 to 40) ---
  {
    id: 'mdcat-b10-bio-33',
    q: 'Which animal phylum is characterized by primary radial or biradial symmetry, diploblastic tissue organization, and stinging capsules known as nematocysts housed in cnidocytes?',
    options: [
      'Cnidaria (Coelenterata)',
      'Porifera',
      'Platyhelminthes',
      'Echinodermata'
    ],
    correct: 0,
    topic: 'Invertebrate Phyla - Characteristics of Phylum Cnidaria',
    chapter: 'Diversity Among Animals',
    explain: 'Cnidarians (hydra, jellyfish, corals, sea anemones) are diploblastic (ectoderm and endoderm separated by mesoglea) with radial symmetry and specialized stinging cells (cnidocytes) containing nematocysts for prey capture and defense.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-34',
    q: 'Flame cells (protonephridia) with flickering tufts of cilia that drive osmoregulation and nitrogenous waste excretion are characteristic of which animal phylum?',
    options: [
      'Platyhelminthes (Flatworms)',
      'Nematoda (Roundworms)',
      'Annelida (Segmented worms)',
      'Arthropoda'
    ],
    correct: 0,
    topic: 'Invertebrates - Excretory Structures in Platyhelminthes',
    chapter: 'Diversity Among Animals',
    explain: 'Flatworms (such as Planaria and tapeworms) possess a protonephridial excretory system consisting of blind-ending flame cells whose beating cilia create negative pressure, drawing interstitial fluid into tubules for excretion.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-35',
    q: 'Which developmental feature distinguishes Protostomes (e.g., Mollusks, Annelids, Arthropods) from Deuterostomes (e.g., Echinoderms, Chordates)?',
    options: [
      'In protostomes, the blastopore develops into the mouth, whereas in deuterostomes, the blastopore develops into the anus',
      'Protostomes have radial indeterminate cleavage, while deuterostomes have spiral determinate cleavage',
      'Protostomes lack a true coelom, whereas deuterostomes are acoelomate',
      'Deuterostomes develop a ventral nerve cord, while protostomes have a dorsal hollow nerve cord'
    ],
    correct: 0,
    topic: 'Animal Classification - Protostomes vs Deuterostomes',
    chapter: 'Diversity Among Animals',
    explain: 'In protostomes ("first mouth"), the embryonic blastopore develops into the mouth, with spiral, determinate cleavage. In deuterostomes ("second mouth"), the blastopore becomes the anus (mouth forms secondarily), with radial, indeterminate cleavage.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-36',
    q: 'The water vascular system (ambulacral system), terminating in hydraulic tube feet used for locomotion, food handling, and respiration, is a unique anatomical feature found exclusively in:',
    options: [
      'Echinodermata',
      'Mollusca',
      'Chordata',
      'Hemichordata'
    ],
    correct: 0,
    topic: 'Invertebrates - Echinoderm Water Vascular System',
    chapter: 'Diversity Among Animals',
    explain: 'Echinoderms (starfish, sea urchins, brittle stars) possess a unique coelomic water vascular system that uses hydraulic pressure from the madreporite and ampullae to operate muscular tube feet (podia) for locomotion and prey capture.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-37',
    q: 'Which of the following is a defining diagnostic hallmark of Phylum Arthropoda that necessitates periodic physiological molting (ecdysis) for somatic growth?',
    options: [
      'A hardened, chitinous cuticle exoskeleton secreted by the underlying epidermis',
      'A fluid-filled hydrostatic pseudocoelom surrounded by longitudinal muscle',
      'A calcareous mantle shell that enlarges by continuous marginal deposition',
      'An endoskeleton composed of mesodermal ossicles'
    ],
    correct: 0,
    topic: 'Arthropoda - Chitinous Exoskeleton and Ecdysis',
    chapter: 'Diversity Among Animals',
    explain: 'Arthropods possess a rigid exoskeleton composed of chitin cross-linked with proteins (and calcium salts in crustaceans). Because this rigid coat cannot expand, arthropods must shed it through hormonally regulated molting (ecdysis) to accommodate growth.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-38',
    q: 'All chordates, at some stage in their ontogenetic development, share four definitive morphological synapomorphies. Which group of structures accurately lists these four features?',
    options: [
      'Notochord, dorsal hollow nerve cord, pharyngeal gill slits, and post-anal tail',
      'Ventral solid nerve cord, notochord, open circulatory system, and radula',
      'Vertebral column, jaws, mammary glands, and closed circulatory system',
      'Hemocoel, dorsal heart, mantle cavity, and opercular gills'
    ],
    correct: 0,
    topic: 'Chordata - Diagnostic Synapomorphic Hallmarks',
    chapter: 'Diversity Among Animals',
    explain: 'The four universal chordate diagnostic traits present at some life stage are: (1) a supportive flexible notochord, (2) a dorsal tubular hollow nerve cord, (3) pharyngeal slits or pouches, and (4) a muscular post-anal tail.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-39',
    q: 'Which subclass of mammals lays shelled cleidoic eggs (oviparous), incubates them, and nurses the hatched young with milk secreted onto specialized abdominal skin patches lacking true nipples?',
    options: [
      'Prototheria (Monotremes, e.g., Duck-billed platypus and Echidna)',
      'Metatheria (Marsupials, e.g., Kangaroo and Opossum)',
      'Eutheria (Placental mammals, e.g., Human and Whale)',
      'Cetacea'
    ],
    correct: 0,
    topic: 'Vertebrates - Mammalian Subclasses (Prototheria / Monotremata)',
    chapter: 'Diversity Among Animals',
    explain: 'Prototherians (monotremes) are egg-laying oviparous mammals found in Australasia. They possess mammary glands but lack teats or nipples; milk is secreted directly onto the fur of the mother\'s abdomen where the hatchlings lap it up.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-40',
    q: 'What is the primary evolutionary advantage of the amniotic egg with its four extraembryonic membranes (amnion, chorion, allantois, yolk sac) in reptiles, birds, and mammals?',
    options: [
      'Complete liberation of embryonic development from an aquatic environment to dry terrestrial habitats',
      'Ability to produce diploid parthenogenetic clones without fertilization',
      'Direct maternal blood exchange without relying on stored yolk proteins',
      'Rapid metamorphosis through free-swimming ciliated larval stages'
    ],
    correct: 0,
    topic: 'Vertebrates - Amniotic Egg and Terrestrial Adaptation',
    chapter: 'Diversity Among Animals',
    explain: 'The amniotic egg provides a self-contained aquatic microenvironment (amnion cushioning the embryo, allantois storing nitrogenous wastes, yolk sac nourishing, and chorion exchanging O2/CO2) encased within a desiccation-resistant shell, allowing fully terrestrial reproduction.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Life Processes in Animals and Plants (8 MCQs: 41 to 48) ---
  {
    id: 'mdcat-b10-bio-41',
    q: 'In human gastric juice, hydrochloric acid (HCl) secreted by parietal (oxyntic) cells serves which crucial physiological functions?',
    options: [
      'Converts inactive pepsinogen into active pepsin and kills ingested microorganisms by maintaining a gastric lumen pH of 1.5 to 2.0',
      'Directly emulsifies dietary triglycerides into micelles',
      'Neutralizes duodenal chyme to protect pancreatic enzymes',
      'Cleaves maltose into two molecules of D-glucose'
    ],
    correct: 0,
    topic: 'Human Digestion - Parietal Cells and Hydrochloric Acid Functions',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Gastric parietal cells secrete HCl (via an apical H⁺/K⁺ ATPase proton pump), reducing gastric pH to 1.5-2.0. This acidity denatures dietary proteins, hydrolyzes the inhibitory peptide from pepsinogen to generate active pepsin, and acts as an innate antimicrobial barrier.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-42',
    q: 'Enteropeptidase (enterokinase), an enzyme localized on the apical brush-border membrane of duodenal enterocytes, initiates the cascade of pancreatic proteolysis by converting:',
    options: [
      'Trypsinogen into active trypsin',
      'Pepsinogen into active pepsin',
      'Procarboxypeptidase into carboxypeptidase',
      'Chymotrypsinogen into chymotrypsin'
    ],
    correct: 0,
    topic: 'Human Digestion - Enteropeptidase and Trypsinogen Activation',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Enteropeptidase cleaves a hexapeptide from the N-terminus of trypsinogen, converting it to active trypsin. Trypsin then autocatalytically activates more trypsinogen as well as chymotrypsinogen, proelastase, and procarboxypeptidases.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-43',
    q: 'Which of the following gastrointestinal hormones is released by duodenal S-cells in response to acidic chyme entering from the stomach, stimulating the secretion of bicarbonate-rich fluid from pancreatic ductal cells?',
    options: [
      'Secretin',
      'Cholecystokinin (CCK)',
      'Gastrin',
      'Ghrelin'
    ],
    correct: 0,
    topic: 'Digestive Hormones - Secretin and Bicarbonate Secretion',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Secretin is released by duodenal S-cells when luminal pH drops below 4.5. It travels via the bloodstream to pancreatic duct cells, stimulating them to secrete a watery, bicarbonate-rich (HCO3⁻) fluid that neutralizes gastric acid in the duodenum.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-44',
    q: 'In the mammalian nephron, what is the countercurrent multiplier mechanism that establishes the osmotic hypertonicity of the renal medullary interstitium?',
    options: [
      'The active transport of Na⁺ and Cl⁻ out of the water-impermeable thick ascending limb, accompanied by water reabsorption from the descending limb of the Loop of Henle',
      'The active secretion of potassium ions in the proximal convoluted tubule',
      'Ultrafiltration across the fenestrated glomerulus driven by hydrostatic pressure',
      'Countercurrent exchange in the peritubular capillary plexus of cortical nephrons'
    ],
    correct: 0,
    topic: 'Renal Physiology - Countercurrent Multiplier in Loop of Henle',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'The descending limb is permeable to water but impermeable to solutes, whereas the thick ascending limb actively pumps NaCl out via the Na⁺-K⁺-2Cl⁻ cotransporter and is impermeable to water. This creates a vertical corticomedullary osmotic gradient (from 300 to 1200 mOsm/L).',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-45',
    q: 'During the cardiac cycle, the second heart sound (S2, "dub") is generated primarily by the mechanical vibration and acoustic turbulence associated with:',
    options: [
      'The sudden closure of the aortic and pulmonary semilunar valves at the onset of ventricular diastole',
      'The closure of the tricuspid and bicuspid (mitral) atrioventricular valves',
      'The rapid inflow of blood into the ventricles during atrial systole',
      'Turbulent blood jetting across stenotic coronary arteries'
    ],
    correct: 0,
    topic: 'Cardiovascular Physiology - Cardiac Cycle and Heart Sounds (S1 vs S2)',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'The first heart sound (S1, "lub") marks the closure of the atrioventricular (mitral and tricuspid) valves at the onset of ventricular systole. The second heart sound (S2, "dub") is caused by the closure of the aortic and pulmonary semilunar valves at the onset of ventricular diastole (isovolumetric relaxation).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-46',
    q: 'Which vitamin is an indispensable fat-soluble cofactor for the hepatic γ-glutamyl carboxylase enzyme that post-translationally modifies clotting factors II (prothrombin), VII, IX, and X?',
    options: [
      'Vitamin K',
      'Vitamin D',
      'Vitamin C',
      'Vitamin B12'
    ],
    correct: 0,
    topic: 'Blood and Hemostasis - Vitamin K-Dependent Coagulation Factors',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Vitamin K is required as a cofactor for the post-translational γ-carboxylation of glutamic acid residues on factors II, VII, IX, and X, as well as proteins C and S. These γ-carboxyglutamate residues bind Ca²⁺ to anchor the clotting factors to platelet phospholipid surfaces.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-47',
    q: 'In plant nutrition, the Casparian strip in the root endodermis forces water and dissolved mineral ions arriving through the apoplast to cross the plasma membrane into which pathway?',
    options: [
      'Symplastic pathway',
      'Transpirational air spaces',
      'Phloem sieve tubes',
      'Cuticular stomatal pores'
    ],
    correct: 0,
    topic: 'Plant Transport - Casparian Strip and Endodermal Symplast',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'The Casparian strip is a band of suberin and lignin deposited in the radial and transverse walls of root endodermal cells. It acts as an impermeable hydrophobic barrier that blocks apoplastic diffusion, forcing water and solutes through selectively permeable membranes into the symplast.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-48',
    q: 'Which plant hormone stimulates the elongation of coleoptiles and stems by activating plasma membrane proton (H⁺) pumps, acidifying the cell wall and activating expansins according to the acid-growth hypothesis?',
    options: [
      'Auxin (Indole-3-acetic acid, IAA)',
      'Abscisic acid (ABA)',
      'Cytokinin (Zeatin)',
      'Ethylene'
    ],
    correct: 0,
    topic: 'Plant Hormones - Auxin and the Acid-Growth Hypothesis',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'According to the acid-growth hypothesis, auxin (IAA) stimulates H⁺-ATPases in the plasma membrane, lowering the apoplastic pH to ~4.5. This activates expansin enzymes that loosen non-covalent bonds between cellulose microfibrils, allowing turgor pressure to drive cell elongation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },

  // --- Bioenergetics (9 MCQs: 49 to 57) ---
  {
    id: 'mdcat-b10-bio-49',
    q: 'In the light-dependent reactions of oxygenic photosynthesis, the photolysis of water molecules (Hill reaction) takes place at the water-splitting oxygen-evolving manganese complex associated with:',
    options: [
      'The lumenal side of Photosystem II (P680)',
      'The stromal side of Photosystem I (P700)',
      'The cytochrome b6f complex core',
      'The CF0 subunit of ATP synthase'
    ],
    correct: 0,
    topic: 'Photosynthesis - Photolysis of Water and Photosystem II',
    chapter: 'Bioenergetics',
    explain: 'Photolysis occurs at the lumenal surface of Photosystem II (PSII, reaction center P680), driven by the oxygen-evolving Mn4CaO5 cluster. Two water molecules are oxidized to yield four protons (released into the thylakoid lumen), four electrons (reducing P680⁺), and one molecule of molecular O2.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-50',
    q: 'During non-cyclic photophosphorylation, what is the terminal electron acceptor that captures electrons flowing from Photosystem I via ferredoxin?',
    options: [
      'NADP⁺ (reduced to NADPH by ferredoxin-NADP⁺ reductase)',
      'Molecular oxygen (reduced to H2O)',
      'Plastoquinone (reduced to plastoquinol)',
      'Cytochrome c'
    ],
    correct: 0,
    topic: 'Photosynthesis - Non-Cyclic Electron Transport and NADP⁺ Reduction',
    chapter: 'Bioenergetics',
    explain: 'Electrons energized at PSI (P700) pass through primary acceptors A0, A1, and iron-sulfur centers to ferredoxin (Fd). The enzyme ferredoxin-NADP⁺ reductase (FNR) on the stromal face catalyzes the transfer of two electrons and one proton to NADP⁺, forming NADPH.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-51',
    q: 'In the Calvin cycle (light-independent reactions) of C3 plants, how many molecules of ATP and NADPH are consumed to fix 6 molecules of CO2 to produce one net molecule of hexose (glucose)?',
    options: [
      '18 ATP and 12 NADPH',
      '12 ATP and 12 NADPH',
      '36 ATP and 24 NADPH',
      '6 ATP and 6 NADPH'
    ],
    correct: 0,
    topic: 'Calvin Cycle - Stoichiometry of ATP and NADPH Consumption',
    chapter: 'Bioenergetics',
    explain: 'Fixing one CO2 requires 2 NADPH and 2 ATP for reduction of 3-PGA to G3P, plus 1 ATP for the regeneration of RuBP (total 3 ATP and 2 NADPH per CO2). For net synthesis of one 6-carbon glucose (6 CO2 fixed), 6 × 3 = 18 ATP and 6 × 2 = 12 NADPH are consumed.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-52',
    q: 'Under conditions of high oxygen and low carbon dioxide concentration, RuBisCO acts as an oxygenase, catalyzing the reaction between RuBP and O2 to produce:',
    options: [
      'One molecule of 3-phosphoglycerate (3-PGA) and one molecule of 2-phosphoglycolate (photorespiration)',
      'Two molecules of 3-phosphoglycerate',
      'One molecule of oxaloacetate and one molecule of malate',
      'Two molecules of phosphoenolpyruvate'
    ],
    correct: 0,
    topic: 'Photorespiration - RuBisCO Oxygenase Activity and Phosphoglycolate',
    chapter: 'Bioenergetics',
    explain: 'RuBisCO has both carboxylase and oxygenase activity. When O2 competes at the active site, RuBisCO oxygenates RuBP (5 carbons) into one 3-carbon molecule (3-PGA) and one 2-carbon molecule (2-phosphoglycolate), initiating the energy-wasteful photorespiratory C2 cycle.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-53',
    q: 'In aerobic cellular respiration, which step represents the committed "transition reaction" (link reaction) connecting cytoplasmic glycolysis to the mitochondrial Krebs cycle?',
    options: [
      'Oxidative decarboxylation of pyruvate to acetyl-CoA by the pyruvate dehydrogenase multienzyme complex in the mitochondrial matrix',
      'Phosphorylation of fructose-6-phosphate to fructose-1,6-bisphosphate by phosphofructokinase-1',
      'Condensation of acetyl-CoA with oxaloacetate to form citrate',
      'Oxidation of malate to oxaloacetate by malate dehydrogenase'
    ],
    correct: 0,
    topic: 'Cellular Respiration - Link Reaction and Pyruvate Dehydrogenase',
    chapter: 'Bioenergetics',
    explain: 'Pyruvate enters the mitochondrial matrix via a H⁺/pyruvate symporter. The pyruvate dehydrogenase complex (PDC) catalyzes oxidative decarboxylation: Pyruvate + CoA + NAD⁺ → Acetyl-CoA + CO2 + NADH + H⁺. This irreversible reaction links glycolysis to the Krebs cycle.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-54',
    q: 'For each turn of the citric acid (Krebs) cycle utilizing one molecule of acetyl-CoA, how many molecules of NADH, FADH2, and GTP (or ATP) are produced by substrate-level phosphorylation and redox steps?',
    options: [
      '3 NADH, 1 FADH2, and 1 GTP (or ATP)',
      '2 NADH, 2 FADH2, and 2 ATP',
      '4 NADH, 0 FADH2, and 1 ATP',
      '6 NADH, 2 FADH2, and 2 GTP'
    ],
    correct: 0,
    topic: 'Krebs Cycle - Yield of High-Energy Electron Carriers per Acetyl-CoA',
    chapter: 'Bioenergetics',
    explain: 'One acetyl-CoA (2 carbons) undergoing a complete turn of the Krebs cycle yields 2 CO2, 3 NADH (at isocitrate dehydrogenase, α-ketoglutarate dehydrogenase, and malate dehydrogenase), 1 FADH2 (at succinate dehydrogenase), and 1 GTP/ATP via succinyl-CoA synthetase.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-55',
    q: 'In the mitochondrial electron transport chain (ETC), Complex IV (Cytochrome c oxidase) transfers electrons to which terminal electron acceptor, driving the formation of metabolic water?',
    options: [
      'Molecular oxygen (O2)',
      'Cytochrome c',
      'Ubiquinone (Coenzyme Q)',
      'Nicotinamide adenine dinucleotide (NAD⁺)'
    ],
    correct: 0,
    topic: 'Mitochondrial ETC - Complex IV and Terminal Oxygen Reduction',
    chapter: 'Bioenergetics',
    explain: 'Cytochrome c oxidase (Complex IV) contains heme a, heme a3, and copper centers (CuA, CuB). It receives electrons one by one from reduced cytochrome c and transfers them to molecular oxygen: O2 + 4 e⁻ + 4 H⁺ → 2 H2O.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-56',
    q: 'According to Peter Mitchell\'s chemiosmotic hypothesis, how does the electrochemical proton gradient across the inner mitochondrial membrane drive ATP synthesis by ATP synthase (F0F1 complex)?',
    options: [
      'Protons flow down their electrochemical gradient from the intermembrane space back into the matrix through the F0 proton channel, driving rotary conformational changes in the F1 catalytic head',
      'Protons are actively pumped into the matrix by ATP hydrolysis',
      'Electrons bind directly to the β-subunits of F1 to phosphorylate ADP',
      'Phosphate ions are pumped into the intermembrane space through porins'
    ],
    correct: 0,
    topic: 'Chemiosmosis - Mitchell Hypothesis and ATP Synthase Rotary Catalysis',
    chapter: 'Bioenergetics',
    explain: 'Proton pumping by Complexes I, III, and IV generates a proton motive force across the inner membrane (positive and acidic in the intermembrane space). Protons flow back into the matrix via the F0 c-ring of ATP synthase, causing mechanical rotation of the γ-stalk, which changes β-subunit conformations in F1 to synthesize ATP from ADP and Pi.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-57',
    q: 'In human skeletal muscle during intense anaerobic exertion when oxygen supply is insufficient, what is the physiological purpose of converting pyruvate to lactate via lactate dehydrogenase (LDH)?',
    options: [
      'Regeneration of NAD⁺ from NADH to maintain a continuous supply of NAD⁺ required for the glyceraldehyde-3-phosphate dehydrogenase step of glycolysis',
      'Direct production of two additional ATP molecules per lactate formed',
      'Preventing cellular acidification by trapping hydrogen ions in glycogen',
      'Facilitating oxygen unloading from myoglobin'
    ],
    correct: 0,
    topic: 'Fermentation - Lactate Dehydrogenase and NAD⁺ Regeneration',
    chapter: 'Bioenergetics',
    explain: 'Glycolysis requires oxidized NAD⁺ at the glyceraldehyde-3-phosphate dehydrogenase (GAPDH) step. Under anaerobic conditions, the electron transport chain cannot reoxidize NADH. Lactate dehydrogenase reduces pyruvate to lactate while oxidizing NADH to NAD⁺, allowing glycolysis to continue producing 2 ATP per glucose.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Transport (9 MCQs: 58 to 66) ---
  {
    id: 'mdcat-b10-bio-58',
    q: 'According to the Münch pressure-flow (mass flow) hypothesis, what drives the long-distance translocation of photoassimilates (sucrose) in phloem sieve tubes from source to sink?',
    options: [
      'A turgor (hydrostatic) pressure gradient established between the loading site (source, high turgor) and unloading site (sink, low turgor)',
      'Capillary action inside lignified dead vessel elements',
      'Transpirational pull generated by negative hydrostatic water potential in leaf stomata',
      'Active flagellar streaming along phloem parenchyma cells'
    ],
    correct: 0,
    topic: 'Phloem Translocation - Münch Pressure-Flow Hypothesis',
    chapter: 'Transport',
    explain: 'Active loading of sucrose at the source reduces water potential in sieve tubes, causing water to enter by osmosis from the xylem and creating high hydrostatic pressure. At the sink, sucrose is unloaded and water exits, creating low pressure. This hydrostatic pressure differential drives mass bulk flow.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-59',
    q: 'The cohesion-tension theory (Dixon and Joly) explains the upward ascent of sap in tall xylem vessels without energy expenditure by relying on:',
    options: [
      'Transpirational pull creating negative water potential tension, transmitted down unbroken water columns through strong intermolecular hydrogen-bonded cohesion',
      'Positive hydrostatic pressure generated exclusively by root endodermal pumps',
      'Active peristaltic contractions of companion cell walls',
      'Atmospheric pressure pushing water upward into a Torricellian vacuum'
    ],
    correct: 0,
    topic: 'Xylem Transport - Cohesion-Tension Theory of Dixon and Joly',
    chapter: 'Transport',
    explain: 'Evaporation of water from leaf mesophyll cell walls creates negative surface tension (transpirational pull). Because water molecules exhibit strong mutual cohesion (via hydrogen bonds) and adhesion to hydrophilic xylem walls, a continuous, unbroken tension column is pulled upward from roots to leaves.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-60',
    q: 'During environmental water stress, which phytohormone synthesized in mesophyll and root cells acts rapidly to trigger stomatal closure by inducing K⁺ and Cl⁻ efflux from guard cells?',
    options: [
      'Abscisic acid (ABA)',
      'Gibberellin (GA3)',
      'Cytokinin (Kinetin)',
      'Brassinolide'
    ],
    correct: 0,
    topic: 'Plant Water Regulation - Abscisic Acid and Stomatal Closure',
    chapter: 'Transport',
    explain: 'Under drought stress, roots and leaves synthesize abscisic acid (ABA). ABA binds receptors on guard cell membranes, stimulating cytosolic Ca²⁺ influx and opening outward-rectifying K⁺ and Cl⁻ anion channels. The resulting loss of ions lowers turgor, causing guard cells to become flaccid and close the stomatal pore.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-61',
    q: 'In the human circulatory system, which anatomical blood vessel possesses the highest total cross-sectional area and the lowest velocity of blood flow, facilitating microvascular exchange of gases and nutrients?',
    options: [
      'Systemic capillaries',
      'Aorta',
      'Vena cava',
      'Arterioles'
    ],
    correct: 0,
    topic: 'Human Circulatory System - Microcirculation and Flow Velocity',
    chapter: 'Transport',
    explain: 'Although individual capillaries are microscopic (~8 μm diameter), their parallel branching yields a vast combined cross-sectional area (~4500 cm² vs ~4.5 cm² for the aorta). Because velocity v = Flow Rate (Q) / Area (A), blood velocity drops to its minimum (~0.03 cm/s), allowing time for diffusion of gases and solutes.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-62',
    q: 'What is the primary electrical function of the atrioventricular (AV) node in delaying cardiac impulse propagation by approximately 0.09 to 0.12 seconds before conducting through the Bundle of His?',
    options: [
      'It allows complete atrial contraction and ventricular filling (atrial kick) before ventricular systole begins',
      'It prevents backwards regurgitation of venous blood into the superior vena cava',
      'It ensures both atria and ventricles contract simultaneously',
      'It generates the primary resting heart rate of 100 beats per minute'
    ],
    correct: 0,
    topic: 'Cardiac Conduction - AV Nodal Delay and Ventricular Filling',
    chapter: 'Transport',
    explain: 'Impulses initiated by the SA node reach the AV node, where slow conduction velocity (~0.05 m/s, due to smaller fibers and fewer gap junctions) delays excitation by ~0.1 s. This delay allows atrial systole to completely fill the ventricles before ventricular contraction begins.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-63',
    q: 'According to Starling\'s forces governing fluid filtration across capillary walls, what primary inward force opposes filtration and pulls interstitial fluid back into the venous end of the capillary?',
    options: [
      'Plasma colloid osmotic (oncotic) pressure exerted by plasma albumin (π_c)',
      'Capillary hydrostatic pressure (P_c)',
      'Interstitial fluid hydrostatic pressure (P_if)',
      'Gravitational venous pressure'
    ],
    correct: 0,
    topic: 'Hemodynamics - Starling Forces and Capillary Fluid Exchange',
    chapter: 'Transport',
    explain: 'Plasma colloid osmotic pressure (~25-28 mmHg), predominantly generated by serum albumin that cannot cross the capillary endothelium, pulls water from the interstitium into the vascular lumen. At the venous end, capillary hydrostatic pressure drops (~15 mmHg), so oncotic pressure dominates, driving reabsorption.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-64',
    q: 'In the lymphatic system, dietary long-chain triglycerides and fat-soluble vitamins packaged into chylomicrons by intestinal enterocytes enter which specialized lymphatic vessels?',
    options: [
      'Lacteals located within intestinal villi',
      'Hepatic portal venules',
      'Cisterna chyli capillaries',
      'Splenic sinusoids'
    ],
    correct: 0,
    topic: 'Lymphatic System - Lacteals and Chylomicron Absorption',
    chapter: 'Transport',
    explain: 'Chylomicrons (diameter 75-1200 nm) are too large to penetrate the continuous basement membrane of blood capillaries. Instead, they enter wide, permeable lymphatic capillaries called lacteals in intestinal villi, forming milky chyle that drains via the thoracic duct into the left subclavian vein.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-65',
    q: 'In ABO and Rh blood grouping, an individual with blood type O-negative is classified as a "universal red blood cell donor" because their erythrocytes:',
    options: [
      'Lack A, B, and Rh (D) antigens on their plasma membrane surface, preventing recognition by recipient isoantibodies',
      'Contain neither anti-A nor anti-B antibodies in their circulating plasma',
      'Possess both A and B antigens alongside high levels of Rh factor',
      'Have nucleated erythrocytes that resist phagocytic clearance'
    ],
    correct: 0,
    topic: 'Immunohematology - ABO/Rh Blood Types and Universal Donors',
    chapter: 'Transport',
    explain: 'Type O-negative RBCs lack A, B, and Rh(D) surface antigens. When transfused into any ABO/Rh recipient, their erythrocytes will not be cross-linked or lysed by recipient anti-A, anti-B, or anti-D agglutinins.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-66',
    q: 'Erythroblastosis fetalis (hemolytic disease of the newborn) typically occurs under which parental and fetal Rh immunological combination?',
    options: [
      'An Rh-negative mother sensitized by a previous Rh-positive fetus carrying a subsequent Rh-positive fetus',
      'An Rh-positive mother carrying an Rh-negative fetus',
      'An Rh-positive mother and an Rh-positive father carrying an Rh-positive fetus',
      'An Rh-negative mother carrying an Rh-negative fetus'
    ],
    correct: 0,
    topic: 'Immunohematology - Erythroblastosis Fetalis and Rh Incompatibility',
    chapter: 'Transport',
    explain: 'When an Rh-negative mother carries an Rh-positive fetus, fetal-maternal hemorrhage during delivery sensitizes the mother to produce anti-Rh (anti-D) IgG antibodies. In a subsequent Rh-positive pregnancy, maternal anti-D IgG crosses the placenta and lyses fetal red blood cells.',
    difficulty: 'Medium',
    subject: 'Biology'
  }
];
