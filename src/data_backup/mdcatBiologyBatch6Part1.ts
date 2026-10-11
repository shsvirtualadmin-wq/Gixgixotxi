import { Question } from '../types';

export const MDCAT_BIOLOGY_BATCH6_PART1: Question[] = [
  // --- Bio Molecules (8 MCQs: mdcat-b6-bio-1 to 8) ---
  {
    id: 'mdcat-b6-bio-1',
    q: 'In the structure of triacylglycerols (triglycerides), which functional bond links the three fatty acid molecules to the glycerol backbone?',
    options: ['Ester bond', 'Peptide bond', 'Glycosidic bond', 'Phosphodiester bond'],
    correct: 0,
    topic: 'Lipids',
    chapter: 'Bio Molecules',
    explain: 'Triglycerides are esters composed of a single glycerol molecule esterified with three fatty acid hydrocarbon chains through dehydration condensation forming ester bonds (-COO-).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-2',
    q: 'Which of the following amino acids contains a secondary amine group where the side chain cycles back and bonds directly to the nitrogen atom of the amino backbone, imparting rigidity to polypeptide folds?',
    options: ['Proline', 'Histidine', 'Tryptophan', 'Glycine'],
    correct: 0,
    topic: 'Proteins and Amino Acids',
    chapter: 'Bio Molecules',
    explain: 'Proline is unique among standard proteinogenic amino acids because its aliphatic side chain forms a pyrrolidine ring by re-attaching to the main-chain nitrogen atom, creating an imino structure that restricts peptide backbone flexibility.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-3',
    q: 'D-Glucose and D-Galactose differ in configuration exclusively at which chiral carbon atom, classifying them as C-epimers?',
    options: ['Carbon-4 (C-4)', 'Carbon-1 (C-1)', 'Carbon-2 (C-2)', 'Carbon-3 (C-3)'],
    correct: 0,
    topic: 'Carbohydrates',
    chapter: 'Bio Molecules',
    explain: 'D-Glucose and D-Galactose are stereoisomers that differ exclusively in the steric spatial configuration of the hydroxyl (-OH) group around carbon-4 (C-4), making them C-4 epimers.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-4',
    q: 'Which nitrogenous base is methylated at position 5 of its pyrimidine ring to form thymine, the pyrimidine base characteristic of DNA?',
    options: ['Uracil', 'Cytosine', 'Guanine', 'Adenine'],
    correct: 0,
    topic: 'Nucleic Acids',
    chapter: 'Bio Molecules',
    explain: 'Thymine is chemically known as 5-methyluracil; adding a methyl group (-CH3) at carbon-5 of the uracil ring yields thymine.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-5',
    q: 'Which class of conjugated molecules consists of a protein covalent complex associated with a non-protein prosthetic carbohydrate moiety found in cell surface receptors and immunoglobulins?',
    options: ['Glycoproteins', 'Lipoproteins', 'Nucleoproteins', 'Chromoproteins'],
    correct: 0,
    topic: 'Conjugated Molecules',
    chapter: 'Bio Molecules',
    explain: 'Glycoproteins are conjugated proteins in which oligosaccharide chains (glycans) are covalently bonded to polypeptide side chains (N-linked via asparagine or O-linked via serine/threonine).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-6',
    q: 'In the double-helical B-DNA model deduced by Watson and Crick, the axial distance between two adjacent nucleotide base pairs measured along the helical axis is:',
    options: ['0.34 nm (3.4 Å)', '3.4 nm (34 Å)', '2.0 nm (20 Å)', '0.15 nm (1.5 Å)'],
    correct: 0,
    topic: 'Nucleic Acids',
    chapter: 'Bio Molecules',
    explain: 'In standard B-DNA, each helical turn contains 10 base pairs spanning a pitch of 3.4 nm (34 Å), meaning the rise per base pair along the central axis is 0.34 nm (3.4 Å).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-7',
    q: 'Amylose and amylopectin both make up plant starch. How does the macromolecular structure of amylopectin fundamentally differ from amylose?',
    options: [
      'Amylopectin contains α-(1→6) branch linkages in addition to linear α-(1→4) glycosidic chains',
      'Amylopectin is completely unbranched and composed entirely of β-(1→4) bonds',
      'Amylose contains galactose units whereas amylopectin is pure fructose',
      'Amylose has higher water insolubility because it contains nitrogenous substituents'
    ],
    correct: 0,
    topic: 'Carbohydrates',
    chapter: 'Bio Molecules',
    explain: 'Amylose is an unbranched polymer of α-D-glucose joined solely by α-(1→4) glycosidic bonds, while amylopectin is highly branched, possessing α-(1→6) branch linkages every 24–30 glucose units.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-8',
    q: 'A patient with an inborn metabolic error exhibits deficiency of sphingomyelinase, leading to toxic accumulation of sphingolipids in reticuloendothelial tissues. What core organic structural component is common to all sphingolipids instead of glycerol?',
    options: ['Sphingosine (an 18-carbon amino alcohol)', 'Cholesterol steroid nucleus', 'Inositol hexaphosphate', 'Phosphatidic acid'],
    correct: 0,
    topic: 'Lipids',
    chapter: 'Bio Molecules',
    explain: 'Sphingolipids possess an 18-carbon aliphatic amino alcohol backbone known as sphingosine (or sphinganine), rather than the three-carbon trihydric glycerol found in glycerophospholipids.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Cell Structure and Function (8 MCQs: mdcat-b6-bio-9 to 16) ---
  {
    id: 'mdcat-b6-bio-9',
    q: 'Which cellular organelle is the primary site of fatty acid beta-oxidation in germinating oilseeds, converting stored lipids into succinate via the glyoxylate cycle?',
    options: ['Glyoxysomes', 'Peroxisomes', 'Golgi complex', 'Smooth endoplasmic reticulum'],
    correct: 0,
    topic: 'Organelles',
    chapter: 'Cell Structure and Function',
    explain: 'Glyoxysomes are specialized plant microbodies found in fat-storing tissues of germinating seeds containing enzymes of the glyoxylate cycle (e.g., isocitrate lyase and malate synthase) to convert stored fats into carbohydrates.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-10',
    q: 'The nucleolus is a dense non-membrane-bound nuclear substructure dedicated principally to:',
    options: [
      'Transcription of precursor rRNA and assembly of ribosomal subunits',
      'Translation of secretory proteins by free polyribosomes',
      'Replication of linear chromatin DNA during S phase',
      'Polyadenylation and capping of cytoplasmic messenger RNA'
    ],
    correct: 0,
    topic: 'Nucleus',
    chapter: 'Cell Structure and Function',
    explain: 'The nucleolus transcribes precursor ribosomal RNA (rRNA) using RNA polymerase I, processes the transcripts, and associates them with imported ribosomal proteins to assemble 40S and 60S eukaryotic ribosomal subunits.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-11',
    q: 'In eukaryotic cilia and flagella, the typical internal axonemal arrangement of microtubules viewed in cross-section consists of:',
    options: ['9 doublet microtubules surrounding 2 central singlet microtubules (9+2 pattern)', '9 triplet microtubules with no central singlet (9+0 pattern)', '8 doublet microtubules arranged in a hexagonal lattice', 'Central triplet microtubules surrounded by 12 peripheral singlets'],
    correct: 0,
    topic: 'Cytoskeleton and Cilia',
    chapter: 'Cell Structure and Function',
    explain: 'Motile eukaryotic cilia and flagella contain an axoneme with nine peripheral doublet microtubules surrounding two central single microtubules (the classic 9+2 arrangement), interconnected by dynein arms and nexin links.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-12',
    q: 'Which class of cell junction provides direct cytoplasmic continuity between adjacent animal cells, permitting the passive passage of ions, second messengers, and small metabolites below 1 kDa?',
    options: ['Gap junctions', 'Tight junctions (zonula occludens)', 'Desmosomes (macula adherens)', 'Hemidesmosomes'],
    correct: 0,
    topic: 'Cell Membrane and Junctions',
    chapter: 'Cell Structure and Function',
    explain: 'Gap junctions consist of hexameric rings of transmembrane connexin proteins forming connexons that align between neighboring cells to create open aqueous channels for direct electrical and chemical coupling.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-13',
    q: 'Rough endoplasmic reticulum is particularly abundant and structurally prominent in which of the following human cell types due to their physiological specialization?',
    options: ['Pancreatic acinar cells', 'Adipose tissue lipocytes', 'Mature biconcave erythrocytes', 'Skeletal muscle fast-twitch myocytes'],
    correct: 0,
    topic: 'Endomembrane System',
    chapter: 'Cell Structure and Function',
    explain: 'Pancreatic acinar cells continuously synthesize and secrete large quantities of digestive zymogens and enzymes into the pancreatic duct, requiring dense arrays of rough endoplasmic reticulum and Golgi stacks.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-14',
    q: 'The inner membrane of mitochondria is selectively impermeable to most ions and polar molecules, a property largely attributed to its high concentration of which unique diphosphatidylglycerol lipid?',
    options: ['Cardiolipin', 'Phosphatidylserine', 'Cerebroside', 'Cholesterol'],
    correct: 0,
    topic: 'Mitochondria',
    chapter: 'Cell Structure and Function',
    explain: 'Cardiolipin (diphosphatidylglycerol) constitutes roughly 20% of total lipid content in the inner mitochondrial membrane, sealing it against proton leakage and maintaining the proton electrochemical gradient.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-15',
    q: 'Which component of the eukaryotic cytoskeleton has a diameter of approximately 7 nm and is composed of globular G-actin monomers polymerizing into helical filamentous F-actin?',
    options: ['Microfilaments', 'Intermediate filaments', 'Microtubules', 'Collagen fibrils'],
    correct: 0,
    topic: 'Cytoskeleton',
    chapter: 'Cell Structure and Function',
    explain: 'Microfilaments (actin filaments) are the thinnest cytoskeletal fibers (~7 nm diameter), consisting of polymerized actin chains essential for amoeboid movement, cytokinesis, and muscle contraction.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-16',
    q: 'During receptor-mediated endocytosis, invaginating plasma membrane pits are coated on their cytosolic face by a triskelion protein scaffold known as:',
    options: ['Clathrin', 'Tubulin', 'Dystrophin', 'Spectrin'],
    correct: 0,
    topic: 'Transport across Membranes',
    chapter: 'Cell Structure and Function',
    explain: 'Clathrin molecules assemble into three-legged triskelion structures that polymerize into a geodesic polygonal cage around the cytosolic surface of budding transport vesicles during endocytosis.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Enzymes (8 MCQs: mdcat-b6-bio-17 to 24) ---
  {
    id: 'mdcat-b6-bio-17',
    q: 'In Michaelis-Menten enzyme kinetics, the Michaelis constant (Km) represents:',
    options: [
      'The substrate concentration at which the reaction velocity is half of its maximum velocity (Vmax / 2)',
      'The maximum rate of substrate turnover when enzyme active sites are saturated',
      'The thermodynamic equilibrium constant for reversible product formation',
      'The energy of activation required to reach the transition state'
    ],
    correct: 0,
    topic: 'Enzyme Kinetics',
    chapter: 'Enzymes',
    explain: 'By definition, Km is the specific substrate concentration [S] at which the initial reaction velocity (v) equals half of the maximal velocity (Vmax/2); an inverse reflection of enzyme affinity.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-18',
    q: 'How does an uncompetitive inhibitor affect the kinetic parameters Vmax and Km of an enzyme-catalyzed reaction?',
    options: [
      'Both Vmax and Km decrease by an identical factor',
      'Vmax decreases while Km remains unchanged',
      'Km increases while Vmax remains unchanged',
      'Vmax increases while Km decreases'
    ],
    correct: 0,
    topic: 'Enzyme Inhibition',
    chapter: 'Enzymes',
    explain: 'Uncompetitive inhibitors bind exclusively to the enzyme-substrate (ES) complex. This removes active ES complexes (lowering Vmax) and shifts the equilibrium to favor substrate binding, lowering apparent Km by the same factor.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-19',
    q: 'Which non-protein organic molecule is tightly or covalently bound to an enzyme as an indispensable permanent component of its catalytic apparatus?',
    options: ['Prosthetic group', 'Apoenzyme', 'Coenzyme', 'Inorganic activator ion'],
    correct: 0,
    topic: 'Cofactors and Prosthetic Groups',
    chapter: 'Enzymes',
    explain: 'A prosthetic group is a non-polypeptide organic cofactor that is firmly and covalently or tightly bound to the protein component (e.g., heme in catalase/hemoglobin, FAD in succinate dehydrogenase).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-20',
    q: 'The induced fit model of enzyme-substrate interaction proposed by Daniel Koshland states that:',
    options: [
      'Substrate binding induces a conformational adjustment in the active site to optimize catalytic alignment',
      'The active site is a rigid, pre-formed geometric template complementary to the substrate before binding',
      'The enzyme covalently degrades its own active site during catalytic turnover',
      'Coenzymes must first irreversibly phosphorylate the substrate before the enzyme interacts'
    ],
    correct: 0,
    topic: 'Mechanism of Action',
    chapter: 'Enzymes',
    explain: 'Koshland\'s induced fit model posits that enzyme active sites are flexible structures that undergo precise conformational shifts upon substrate binding to wrap around and stabilize the transition state.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-21',
    q: 'Many proteolytic enzymes, such as pepsin and trypsin, are synthesized as inactive precursors to prevent cellular autolysis. These inactive precursor forms are called:',
    options: ['Zymogens (proenzymes)', 'Isoenzymes', 'Apoenzymes', 'Ribozymes'],
    correct: 0,
    topic: 'Enzyme Regulation',
    chapter: 'Enzymes',
    explain: 'Zymogens (or proenzymes) are catalytically inactive enzyme precursors (e.g., pepsinogen, trypsinogen) that require specific cleavage of an inhibitory peptide segment to become functionally active.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-22',
    q: 'In allosteric enzyme regulation, feedback inhibition (end-product inhibition) typically occurs when:',
    options: [
      'The final downstream product of a metabolic pathway binds to a regulatory allosteric site on the first commitment enzyme',
      'The initial substrate irreversibly denatures the active site of the terminal enzyme',
      'Excess ATP hydrolyzes the peptide backbone of all intermediate enzymes',
      'Product molecules compete directly with substrate for active site catalytic residues'
    ],
    correct: 0,
    topic: 'Enzyme Regulation',
    chapter: 'Enzymes',
    explain: 'Feedback inhibition involves the end-product of a multienzyme pathway reversibly binding to an allosteric site on the pathway\'s initial rate-limiting pacemaker enzyme, shutting down unnecessary biosynthesis.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-23',
    q: 'Which enzyme class catalyzes the joining of two distinct molecular substrates coupled with the concurrent hydrolysis of a high-energy phosphate bond (such as ATP)?',
    options: ['Ligases', 'Lyases', 'Hydrolases', 'Transferases'],
    correct: 0,
    topic: 'Classification of Enzymes',
    chapter: 'Enzymes',
    explain: 'Ligases (synthetases) catalyze the joining (ligation) of two chemical groups (C-C, C-S, C-O, C-N) with concomitant expenditure of ATP or another nucleoside triphosphate (e.g., DNA ligase).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-24',
    q: 'What is the turnover number (kcat) of an enzyme?',
    options: [
      'The maximum number of substrate molecules converted to product per active site per unit time at saturation',
      'The concentration of enzyme required to double the activation energy barrier',
      'The duration of time before an enzyme undergoes thermal denaturation',
      'The ratio of uncompetitive inhibitor concentration to substrate concentration'
    ],
    correct: 0,
    topic: 'Enzyme Kinetics',
    chapter: 'Enzymes',
    explain: 'The turnover number (kcat) is defined as the number of substrate molecules converted into product per catalytic site per unit time (units of s⁻¹) when the enzyme is fully saturated with substrate.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Cell Division (8 MCQs: mdcat-b6-bio-25 to 32) ---
  {
    id: 'mdcat-b6-bio-25',
    q: 'During which sub-stage of Prophase I of meiosis do homologous chromosomes undergo synapsis to assemble the proteinaceous synaptonemal complex?',
    options: ['Zygotene', 'Leptotene', 'Pachytene', 'Diplotene'],
    correct: 0,
    topic: 'Meiosis',
    chapter: 'Cell Division',
    explain: 'During the zygotene stage of Meiotic Prophase I, homologous chromosomes align side-by-side and undergo synapsis, stabilized by the zipper-like synaptonemal complex.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-26',
    q: 'At the mitotic spindle assembly checkpoint (SAC) during metaphase, transition into anaphase is delayed until all kinetochores are bioriented because unattached kinetochores inhibit:',
    options: [
      'The Anaphase-Promoting Complex/Cyclosome (APC/C)',
      'DNA Polymerase delta',
      'Nuclear envelope reassembly enzymes',
      'Phosphofructokinase-1'
    ],
    correct: 0,
    topic: 'Cell Cycle Control',
    chapter: 'Cell Division',
    explain: 'Unattached kinetochores generate the mitotic checkpoint complex (MCC), which binds to and inhibits CDC20-activated APC/C. Once all chromosomes align, APC/C is activated to degrade securin and cyclin B, triggering separase activation.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-27',
    q: 'Cytokinesis in dividing higher plant cells occurs through the formation of a phragmoplast, which develops primarily from vesicles derived from the:',
    options: ['Golgi apparatus', 'Lysosomes', 'Mitochondria', 'Centrosomes'],
    correct: 0,
    topic: 'Cytokinesis',
    chapter: 'Cell Division',
    explain: 'In plant cytokinesis, Golgi-derived vesicles carrying cell wall precursors (pectin and hemicellulose) coalesce along the equatorial plane guided by phragmoplast microtubules to build the middle lamella and primary cell plate.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-28',
    q: 'Non-disjunction during Meiosis I occurs when:',
    options: [
      'Homologous chromosome pairs fail to separate properly and segregate into the same daughter cell',
      'Sister chromatids fail to separate during mitotic metaphase',
      'Crossing over produces four recombinant sister chromatids without chiasmata',
      'Centrosomes fail to duplicate during G1 phase of interphase'
    ],
    correct: 0,
    topic: 'Abnormal Cell Division',
    chapter: 'Cell Division',
    explain: 'Non-disjunction during Meiosis I is the failure of homologous chromosome pairs to disjoin and migrate to opposite spindle poles, resulting in two n+1 and two n-1 gametes after meiosis II.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-29',
    q: 'Crossing over and reciprocal genetic recombination between non-sister chromatids of homologous pairs occurs physically during which specific stage of Meiotic Prophase I?',
    options: ['Pachytene', 'Diakinesis', 'Leptotene', 'Zygotene'],
    correct: 0,
    topic: 'Meiosis',
    chapter: 'Cell Division',
    explain: 'During the pachytene stage of prophase I, homologous non-sister chromatids exchange segments through endonuclease breakage and reciprocal recombination nodules, completing crossing over.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-30',
    q: 'Which protein complex forms a ring that physically encircles and holds sister chromatids together from S phase until anaphase onset?',
    options: ['Cohesin', 'Condensin', 'Histone H1', 'Actin contractile ring'],
    correct: 0,
    topic: 'Mitosis',
    chapter: 'Cell Division',
    explain: 'Cohesin is a multi-subunit ring-shaped protein complex (containing Smc1, Smc3, and Scc1) that entraps sister chromatid DNA duplexes together until separase cleaves Scc1 at the metaphase-to-anaphase transition.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-31',
    q: 'Apoptosis is programmed cell death characterized by all of the following morphological features EXCEPT:',
    options: [
      'Lysis of plasma membrane causing widespread local inflammatory response',
      'Cell shrinkage and nuclear chromatin condensation (pyknosis)',
      'Cleavage of chromosomal DNA into internucleosomal fragments by endonucleases',
      'Blebbing of the cell membrane into apoptotic bodies phagocytosed by macrophages'
    ],
    correct: 0,
    topic: 'Apoptosis and Necrosis',
    chapter: 'Cell Division',
    explain: 'Apoptosis is a clean, non-inflammatory programmed death involving cell shrinkage, membrane blebbing, and phagocytosis. In contrast, cell lysis with spilling of cellular contents that triggers inflammation is the hallmark of necrosis.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-32',
    q: 'In the eukaryotic cell cycle, the restriction point (G1 checkpoint) is principally governed by phosphorylation of which tumor suppressor protein by Cyclin D-CDK4/6 complexes?',
    options: ['Retinoblastoma protein (pRb)', 'p53', 'Survivin', 'Caspase-3'],
    correct: 0,
    topic: 'Cell Cycle Checkpoints',
    chapter: 'Cell Division',
    explain: 'In early G1, hypophosphorylated retinoblastoma protein (pRb) binds and inhibits E2F transcription factors. Phosphorylation of pRb by Cyclin D-CDK4/6 and Cyclin E-CDK2 releases E2F, activating genes required for S-phase entry.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Diversity Among Animals (9 MCQs: mdcat-b6-bio-33 to 41) ---
  {
    id: 'mdcat-b6-bio-33',
    q: 'In Phylum Porifera (sponges), water enters the central spongocoel through numerous microscopic incurrent pores called:',
    options: ['Ostia', 'Osculum', 'Choanocytes', 'Cnidocytes'],
    correct: 0,
    topic: 'Invertebrates',
    chapter: 'Diversity Among Animals',
    explain: 'Water carrying oxygen and food enters a sponge through thousands of minute dermal incurrent pores called ostia, flows into the spongocoel, and exits through the large excurrent opening called the osculum.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-34',
    q: 'Which of the following invertebrate phyla exhibits a pseudocoelomate body plan derived from the persistent embryonic blastocoel?',
    options: ['Nematoda (Aschelminthes)', 'Platyhelminthes', 'Annelida', 'Mollusca'],
    correct: 0,
    topic: 'Body Cavities',
    chapter: 'Diversity Among Animals',
    explain: 'Nematodes (roundworms) are pseudocoelomates; their body cavity is a fluid-filled space between the endoderm and mesoderm that is not completely lined by mesodermal peritoneum.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-35',
    q: 'Flame cells (protonephridia) with tufts of beating cilia are the characteristic excretory and osmoregulatory structures of which animal phylum?',
    options: ['Platyhelminthes (flatworms)', 'Arthropoda', 'Echinodermata', 'Porifera'],
    correct: 0,
    topic: 'Invertebrate Excretion',
    chapter: 'Diversity Among Animals',
    explain: 'Flame cells are the blind-ending, bulb-like ciliated units of the protonephridial excretory system found in planarians and other flatworms (Phylum Platyhelminthes).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-36',
    q: 'What specialized rasping, chitinous tongue-like feeding organ is unique to members of Phylum Mollusca (except bivalves)?',
    options: ['Radula', 'Mantle', 'Statocyst', 'Ctenidium'],
    correct: 0,
    topic: 'Molluscs',
    chapter: 'Diversity Among Animals',
    explain: 'The radula is a minutely toothed, chitinous ribbon present in the buccal cavity of molluscs (gastropods, cephalopods) used to scrape algae and bore through food surfaces.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-37',
    q: 'In Phylum Echinodermata, adult echinoderms exhibit secondary pentaradial symmetry, but their free-swimming ciliated larvae display:',
    options: ['Bilateral symmetry', 'Spherical symmetry', 'Asymmetry', 'Biradial symmetry'],
    correct: 0,
    topic: 'Echinoderms',
    chapter: 'Diversity Among Animals',
    explain: 'Echinoderms are bilaterally symmetrical as free-swimming, planktonic dipleurula/bipinnaria larvae, establishing their evolutionary placement among triploblastic deuterostomes before adopting pentaradial symmetry as adults.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-38',
    q: 'Metameric segmentation, paired lateral chitinous setae/parapodia for locomotion, and a closed circulatory system with multiple aortic arches are defining hallmarks of:',
    options: ['Annelida', 'Nematoda', 'Cnidaria', 'Platyhelminthes'],
    correct: 0,
    topic: 'Annelids',
    chapter: 'Diversity Among Animals',
    explain: 'Phylum Annelida (earthworms, polychaetes, leeches) is characterized by true metameric segmentation, chitinous setae, a true coelom divided by septa, and a closed blood vascular system.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-39',
    q: 'Which of the following chordate features is present in human embryos but persists throughout life in adult cephalochordates like Amphioxus (lancelet)?',
    options: ['Persistent notochord extending into the rostrum', 'Vertebral column made of spongy bone', 'Cartilaginous operculum covering gills', 'Paired pectoral and pelvic fins'],
    correct: 0,
    topic: 'Chordates',
    chapter: 'Diversity Among Animals',
    explain: 'In Cephalochordata (Amphioxus), the notochord extends from the tip of the tail to the anterior tip of the rostrum and persists throughout the entire life cycle as the primary axial support.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-40',
    q: 'The amniotic egg contains four specialized extraembryonic membranes. Which of these membranes immediately encloses the developing embryo in a fluid-filled protective shock-absorbing bath?',
    options: ['Amnion', 'Allantois', 'Chorion', 'Yolk sac'],
    correct: 0,
    topic: 'Amniotes',
    chapter: 'Diversity Among Animals',
    explain: 'The amnion is the innermost extraembryonic membrane forming an enclosed fluid-filled sac (the amniotic cavity) that protects the embryo from physical shock, mechanical compression, and desiccation.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-41',
    q: 'Which mammalian subclass comprises the monotremes (such as the duck-billed platypus and echidna) that lay shelled eggs and lack nipples, exuding milk directly from mammary glands onto belly fur?',
    options: ['Prototheria', 'Metatheria', 'Eutheria', 'Theria'],
    correct: 0,
    topic: 'Mammalian Diversity',
    chapter: 'Diversity Among Animals',
    explain: 'Subclass Prototheria (monotremes) represents the most primitive living mammals, characterized by oviparous reproduction (egg-laying), cloaca presence, and absence of nipples.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Life Processes in Animals and Plants (9 MCQs: mdcat-b6-bio-42 to 50) ---
  {
    id: 'mdcat-b6-bio-42',
    q: 'Which hormone secreted by enteroendocrine S-cells in the duodenal mucosa stimulates the exocrine pancreas to release large volumes of bicarbonate-rich watery fluid?',
    options: ['Secretin', 'Cholecystokinin (CCK)', 'Gastrin', 'Enterogastrone'],
    correct: 0,
    topic: 'Digestion Hormones',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Secretin is released in response to acidic gastric chyme (pH < 4.5) entering the duodenum, stimulating ductal pancreatic cells to secrete alkaline HCO3⁻ to neutralize stomach acid.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-43',
    q: 'In plant leaves, guttation is the exudation of xylem liquid drops from uninjured leaf margins through specialized pores called:',
    options: ['Hydathodes', 'Stomata', 'Lenticels', 'Pneumatophores'],
    correct: 0,
    topic: 'Plant Water Relations',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Guttation occurs under conditions of high soil moisture and high humidity (low transpiration) when root pressure forces water out through specialized modified vein endings called hydathodes.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-44',
    q: 'Parietal (oxyntic) cells of the gastric mucosa secrete which glycoprotein essential for the subsequent absorption of vitamin B12 in the terminal ileum?',
    options: ['Intrinsic factor', 'Pepsinogen', 'Gastric lipase', 'Mucin'],
    correct: 0,
    topic: 'Human Digestion',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Gastric parietal cells secrete hydrochloric acid (HCl) as well as gastric intrinsic factor, which binds cobalamin (vitamin B12) to protect it from degradation and allow receptor-mediated uptake in the terminal ileum.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-45',
    q: 'According to the pressure-flow hypothesis of phloem translocation, sugar loading into sieve tube elements at source leaves creates a:',
    options: [
      'Low water potential that drives osmotic water entry, creating high hydrostatic turgor pressure',
      'High water potential that drives water out, creating negative tension',
      'Direct electrical voltage gradient that pumps sucrose through companion plasmodesmata',
      'Gas bubble that propels sucrose via acoustic cavitation'
    ],
    correct: 0,
    topic: 'Phloem Translocation',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Active loading of sucrose into sieve tubes lowers the solute potential (more negative), inducing water influx from adjacent xylem. The resulting high hydrostatic turgor pressure drives mass flow toward sinks.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-46',
    q: 'The digestion of emulsified dietary triglycerides in the human small intestine into 2-monoacylglycerols and free fatty acids is primarily catalyzed by:',
    options: ['Pancreatic lipase (steapsin)', 'Salivary amylase (ptyalin)', 'Chymotrypsin', 'Enteropeptidase'],
    correct: 0,
    topic: 'Lipid Digestion',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Pancreatic lipase, acting at the oil-water interface with the aid of colipase and bile salts, hydrolyzes the primary ester bonds of triglycerides at positions 1 and 3 to yield 2-monoglycerides and two free fatty acids.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-47',
    q: 'In plant roots, the Casparian strip is an impermeable band of suberin and lignin deposited in the radial and transverse walls of which cell layer?',
    options: ['Endodermis', 'Pericycle', 'Epidermis', 'Cortex'],
    correct: 0,
    topic: 'Root Anatomy and Transport',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'The Casparian strip is a suberized thickening in endodermal cell walls that blocks the apoplastic movement of water and dissolved minerals, forcing them across the selectively permeable plasma membrane into the symplast.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-48',
    q: 'Bile salts (sodium glycocholate and sodium taurocholate) aid lipid digestion primarily through which physical mechanism?',
    options: [
      'Emulsification, reducing surface tension and creating microdroplets to increase surface area for lipase',
      'Direct hydrolytic cleavage of ester bonds in triglycerides',
      'Active carrier-mediated transport of whole fat globules into enterocytes',
      'Oxidation of unsaturated double bonds in long-chain fatty acids'
    ],
    correct: 0,
    topic: 'Liver and Bile',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Bile salts are amphipathic molecules that coat large fat globules and break them into microscopic emulsion droplets (micelles), dramatically increasing surface area for enzymatic attack by water-soluble pancreatic lipase.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-49',
    q: 'During the opening of stomata in plant guard cells, the primary ionic mechanism involves:',
    options: [
      'Active proton pumping (H+-ATPase) out of guard cells, driving massive K+ and Cl- influx into the vacuole',
      'Efflux of potassium ions accompanied by rapid water exit through aquaporins',
      'Accumulation of gaseous ethylene causing guard cell flaccidity',
      'Complete breakdown of guard cell starch into insoluble suberin'
    ],
    correct: 0,
    topic: 'Stomatal Mechanism',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Stomatal opening is initiated when blue light activates H+-ATPases on guard cell membranes, pumping H+ out. The resulting hyperpolarization opens voltage-gated inward K+ channels; K+ and anions enter, lowering water potential and causing osmotic swelling.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-50',
    q: 'Which enzyme located on the brush border microvillar membrane of intestinal enterocytes cleaves peptide bonds at the amino-terminal end of oligopeptides?',
    options: ['Aminopeptidase', 'Carboxypeptidase A', 'Pepsin', 'Chymotrypsin'],
    correct: 0,
    topic: 'Protein Digestion',
    chapter: 'Life Processes in Animals and Plants',
    explain: 'Aminopeptidase is an exopeptidase embedded in the intestinal brush border that hydrolytically removes amino acids sequentially from the free amino (N-) terminus of peptide substrates.',
    difficulty: 'Medium',
    subject: 'Biology'
  },

  // --- Bioenergetics (9 MCQs: mdcat-b6-bio-51 to 59) ---
  {
    id: 'mdcat-b6-bio-51',
    q: 'In the light reactions of photosynthesis, what is the immediate electron donor that reduces the oxidized P680+ reaction center of Photosystem II?',
    options: ['Water (H2O via the oxygen-evolving complex)', 'Plastoquinone', 'Ferredoxin', 'NADPH'],
    correct: 0,
    topic: 'Photosynthesis',
    chapter: 'Bioenergetics',
    explain: 'When P680 absorbs light and ejects an electron, its powerful oxidizing cation (P680+) extracts replacement electrons from water molecules via photolysis catalyzed by the manganese-containing oxygen-evolving complex (OEC).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-52',
    q: 'During the Calvin cycle (C3 pathway), how many ATP and NADPH molecules are consumed per molecule of CO2 fixed into carbohydrate triose phosphate?',
    options: ['3 ATP and 2 NADPH', '2 ATP and 3 NADPH', '1 ATP and 1 NADPH', '6 ATP and 4 NADPH'],
    correct: 0,
    topic: 'Calvin Cycle',
    chapter: 'Bioenergetics',
    explain: 'To fix one molecule of CO2, the Calvin cycle consumes 2 ATP and 2 NADPH during the reduction of 3-phosphoglycerate to G3P, plus 1 additional ATP during the regeneration of ribulose-1,5-bisphosphate (RuBP), totalling 3 ATP and 2 NADPH.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-53',
    q: 'During glycolysis, which reaction constitutes the sole substrate-level phosphorylation step in the preparatory (energy investment) phase?',
    options: [
      'None; substrate-level phosphorylation occurs exclusively in the payoff phase',
      'Conversion of glucose to glucose-6-phosphate by hexokinase',
      'Phosphorylation of fructose-6-phosphate by phosphofructokinase-1',
      'Cleavage of fructose-1,6-bisphosphate by aldolase'
    ],
    correct: 0,
    topic: 'Glycolysis',
    chapter: 'Bioenergetics',
    explain: 'Substrate-level phosphorylation synthesizes ATP; in glycolysis, this occurs exclusively in the payoff phase (reactions catalyzed by phosphoglycerate kinase and pyruvate kinase). The preparatory phase consumes 2 ATP.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-54',
    q: 'In the mitochondrial electron transport chain, which enzyme complex does NOT pump protons across the inner mitochondrial membrane into the intermembrane space?',
    options: ['Complex II (Succinate dehydrogenase / Succinate-CoQ reductase)', 'Complex I (NADH dehydrogenase)', 'Complex III (Cytochrome bc1 complex)', 'Complex IV (Cytochrome c oxidase)'],
    correct: 0,
    topic: 'Electron Transport Chain',
    chapter: 'Bioenergetics',
    explain: 'Complex II (succinate dehydrogenase) transfers electrons from FADH2 to ubiquinone via iron-sulfur clusters with insufficient free energy change to pump protons, so its proton pumping stoichiometry is zero.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-55',
    q: 'Photorespiration in C3 plants occurs when the active site of RuBisCO binds oxygen instead of carbon dioxide, generating 3-phosphoglycerate and a 2-carbon waste compound known as:',
    options: ['2-Phosphoglycolate', 'Oxaloacetate', 'Malate', 'Dihydroxyacetone phosphate'],
    correct: 0,
    topic: 'Photorespiration',
    chapter: 'Bioenergetics',
    explain: 'When RuBisCO functions as an oxygenase, it oxygenates RuBP (5C) to yield one molecule of 3-phosphoglycerate (3C) and one molecule of 2-phosphoglycolate (2C), which is processed via the peroxisome and mitochondria in photorespiration.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-56',
    q: 'What is the primary anatomical feature of C4 plants that prevents photorespiration by physically concentrating CO2 around RuBisCO?',
    options: ['Kranz anatomy (concentric wreath of bundle sheath cells)', 'Aerenchyma gas chambers in the cortex', 'Thick suberin layer in leaf epidermis', 'Heteromorphic stomata on adaxial surfaces'],
    correct: 0,
    topic: 'C4 Photosynthesis',
    chapter: 'Bioenergetics',
    explain: 'Kranz anatomy is characterized by a distinctive wreath-like arrangement of bundle sheath cells surrounded by mesophyll cells. Initial CO2 fixation by PEP carboxylase in mesophyll shuttles 4C malate into bundle sheath cells to flood RuBisCO with CO2.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-57',
    q: 'During the Krebs (citric acid) cycle, how many molecules of carbon dioxide (CO2) are released per turn of the cycle per molecule of acetyl-CoA oxidized?',
    options: ['2 CO2 molecules', '1 CO2 molecule', '3 CO2 molecules', '4 CO2 molecules'],
    correct: 0,
    topic: 'Citric Acid Cycle',
    chapter: 'Bioenergetics',
    explain: 'Per turn of the citric acid cycle, two oxidative decarboxylation steps occur: isocitrate dehydrogenase releases the first CO2 (forming α-ketoglutarate) and α-ketoglutarate dehydrogenase releases the second CO2 (forming succinyl-CoA).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-58',
    q: 'In the mitochondrial ATP synthase (Complex V), the rotation of which stalk subunit induces conformational changes in the catalytic β-subunits of the F1 headpiece according to Boyer\'s binding change mechanism?',
    options: ['Gamma (γ) subunit', 'Alpha (α) subunit', 'Delta (δ) subunit', 'OSCP (oligomycin sensitivity conferral protein)'],
    correct: 0,
    topic: 'Chemiosmosis',
    chapter: 'Bioenergetics',
    explain: 'Proton flow through the membrane-embedded Fo c-ring rotates the central asymmetrical gamma (γ) subunit stalk. As it turns within the stationary (αβ)3 hexamer, it sequentially alters the conformations of the three catalytic β-subunits (Open, Loose, Tight).',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-59',
    q: 'In lactic acid fermentation, pyruvate generated by glycolysis is converted to lactate by lactate dehydrogenase, primarily to achieve which essential cellular requirement?',
    options: [
      'Regenerate NAD+ from NADH so glycolysis can continue generating ATP under anaerobic conditions',
      'Produce molecular oxygen for mitochondrial oxidation',
      'Generate GTP via substrate-level phosphorylation',
      'Prevent cytoplasmic alkalosis caused by sodium accumulation'
    ],
    correct: 0,
    topic: 'Fermentation',
    chapter: 'Bioenergetics',
    explain: 'Under anaerobic conditions, pyruvate acts as an electron acceptor and is reduced to lactate by NADH, thereby regenerating NAD+ required for glyceraldehyde-3-phosphate dehydrogenase so that glycolysis can maintain ATP production.',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Transport (9 MCQs: mdcat-b6-bio-60 to 68) ---
  {
    id: 'mdcat-b6-bio-60',
    q: 'The sinoatrial (SA) node acts as the primary pacemaker of the human heart because its cells:',
    options: [
      'Possess the fastest intrinsic rate of spontaneous diastolic depolarization (automaticity)',
      'Contain the highest concentration of troponin C in cardiac muscle',
      'Are insulated by dense fibrous pericardial connective tissue',
      'Have the longest refractory period among conducting pathways'
    ],
    correct: 0,
    topic: 'Cardiac Conduction',
    chapter: 'Transport',
    explain: 'SA node nodal cells exhibit unstable resting potentials with continuous inward sodium leakage (funny current, If) and calcium influx, producing the fastest inherent spontaneous depolarization rate (~70–80 bpm).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-61',
    q: 'During the human cardiac cycle, the first heart sound (\'lub\') is produced primarily by the:',
    options: [
      'Closure of the atrioventricular (tricuspid and bicuspid/mitral) valves at the onset of ventricular systole',
      'Closure of the aortic and pulmonary semilunar valves at the onset of ventricular diastole',
      'Rapid passive rush of blood into relaxed atria during atrial diastole',
      'Contraction of the papillary muscles during late ventricular ejection'
    ],
    correct: 0,
    topic: 'Cardiac Cycle',
    chapter: 'Transport',
    explain: 'The first heart sound (S1 or \'lub\') is generated by the reverberation of blood and vibrations caused by the sudden simultaneous closure of the mitral and tricuspid atrioventricular valves at the beginning of ventricular isovolumetric contraction.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-62',
    q: 'Which component of human blood plasma maintains approximately 75–80% of total plasma colloid osmotic (oncotic) pressure, preventing fluid leakage into interstitial spaces?',
    options: ['Serum albumin', 'Fibrinogen', 'Immunoglobulin G', 'Prothrombin'],
    correct: 0,
    topic: 'Blood Components',
    chapter: 'Transport',
    explain: 'Serum albumin is the most abundant plasma protein (~4.5 g/dL) and, due to its low molecular weight (~66 kDa) and high concentration, generates roughly 80% of effective plasma oncotic pressure.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-63',
    q: 'In an electrocardiogram (ECG), the QRS complex represents the electrical vector associated with:',
    options: ['Ventricular depolarization', 'Atrial depolarization', 'Ventricular repolarization', 'Sinoatrial node firing delay'],
    correct: 0,
    topic: 'ECG',
    chapter: 'Transport',
    explain: 'The QRS complex corresponds to rapid electrical depolarization of the ventricular myocardium preceding ventricular mechanical systole (contraction).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-64',
    q: 'Erythroblastosis fetalis (hemolytic disease of the newborn) typically occurs when an:',
    options: [
      'Rh-negative mother is carrying an Rh-positive fetus after prior sensitization during a previous pregnancy',
      'Rh-positive mother is carrying an Rh-negative fetus during her first pregnancy',
      'ABO-incompatible father transmits blood type O to an Rh-negative mother',
      'Rh-negative fetus produces anti-Rh antibodies that cross the placenta into the mother'
    ],
    correct: 0,
    topic: 'Blood Groups and Rh Incompatibility',
    chapter: 'Transport',
    explain: 'When an Rh-negative woman gives birth to an Rh-positive child, feto-maternal hemorrhage sensitizes her immune system to produce anti-D IgG antibodies. In a subsequent Rh-positive pregnancy, these maternal IgG antibodies cross the placenta and lyse fetal red cells.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-65',
    q: 'Capillary fluid exchange is governed by Starling forces. What change promotes net filtration of fluid out of capillaries into surrounding interstitial tissues, causing edema?',
    options: [
      'Elevated capillary hydrostatic pressure or decreased plasma oncotic pressure',
      'Elevated plasma albumin concentration',
      'Severe systemic arteriolar vasoconstriction lowering capillary perfusion pressure',
      'Increased interstitial hydrostatic pressure exceeding venous pressure'
    ],
    correct: 0,
    topic: 'Capillary Exchange',
    chapter: 'Transport',
    explain: 'Net filtration pressure = (Pc - Pi) - (πc - πi). Increased capillary hydrostatic pressure (Pc) or decreased plasma oncotic pressure (πc, as in hypoalbuminemia) shifts fluid outward, leading to interstitial fluid accumulation (edema).',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-66',
    q: 'During blood coagulation, prothrombinase (Factor Xa complexed with Factor Va and calcium) converts inactive prothrombin into active:',
    options: ['Thrombin', 'Fibrin', 'Plasmin', 'Kallikrein'],
    correct: 0,
    topic: 'Blood Clotting',
    chapter: 'Transport',
    explain: 'The prothrombinase complex enzymatically cleaves prothrombin (Factor II) into active thrombin (Factor IIa), which in turn cleaves soluble fibrinogen into insoluble fibrin strands.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-67',
    q: 'In the lymphatic system, specialized lymphatic capillaries in the intestinal villi that absorb digested dietary lipids in the form of chylomicrons are known as:',
    options: ['Lacteals', 'Thoracic ducts', 'Cisterna chyli', 'Sinusoids'],
    correct: 0,
    topic: 'Lymphatic System',
    chapter: 'Transport',
    explain: 'Lacteals are wide, blind-ended lymphatic capillaries residing at the core of intestinal villi that take up reconstructed chylomicrons, producing milky lymph termed chyle.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b6-bio-68',
    q: 'Which intrinsic local vascular regulatory mechanism ensures that an organ automatically maintains constant blood flow despite wide fluctuations in systemic arterial blood pressure?',
    options: [
      'Myogenic autoregulation (Bayliss effect)',
      'Parasympathetic release of acetylcholine onto vascular smooth muscle',
      'Systemic epinephrine surge from the adrenal medulla',
      'Sympathetic baroreceptor discharge'
    ],
    correct: 0,
    topic: 'Circulatory Regulation',
    chapter: 'Transport',
    explain: 'The myogenic autoregulatory mechanism (Bayliss effect) is an intrinsic property of vascular smooth muscle where an increase in transmural stretch causes reflexive smooth muscle contraction (constriction), maintaining stable blood perfusion.',
    difficulty: 'Hard',
    subject: 'Biology'
  }
];
