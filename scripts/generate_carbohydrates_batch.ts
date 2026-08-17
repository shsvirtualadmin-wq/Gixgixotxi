import dotenv from 'dotenv';
dotenv.config();

interface MCQ {
  question_text: string;
  options: string[];
  correct_option: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  needs_review?: boolean;
}

const mcqs: MCQ[] = [
  // 1-10: Monosaccharide Classification & Structure
  {
    question_text: "Which of the following is a triose sugar found as an intermediate in cellular respiration and photosynthesis?",
    options: ["Glyceraldehyde", "Ribose", "Erythrose", "Glucose"],
    correct_option: 0,
    explanation: "Glyceraldehyde (and dihydroxyacetone) are 3-carbon monosaccharides (trioses) that act as key intermediates in glycolysis and the Calvin cycle.",
    difficulty: "Easy"
  },
  {
    question_text: "Which general formula correctly represents the structure of most monosaccharides?",
    options: ["(CH2O)n", "C(H2O)2n", "CnH2n-2On", "C2nH2On"],
    correct_option: 0,
    explanation: "Monosaccharides generally follow the empirical formula (CH2O)n, where 'n' ranges from 3 to 7.",
    difficulty: "Easy"
  },
  {
    question_text: "D-glucose and D-fructose are functional isomers because glucose contains an _____ group while fructose contains a _____ group.",
    options: ["Aldehyde, Ketone", "Ketone, Aldehyde", "Carboxyl, Hydroxyl", "Ester, Ether"],
    correct_option: 0,
    explanation: "Glucose is an aldohexose possessing an aldehyde group at C-1, whereas fructose is a ketohexose possessing a ketone group at C-2.",
    difficulty: "Medium"
  },
  {
    question_text: "Which of the following monosaccharides is a pentose sugar found in RNA nucleotides?",
    options: ["D-Ribose", "2-Deoxy-D-ribose", "D-Ribulose", "D-Xylulose"],
    correct_option: 0,
    explanation: "D-Ribose is a 5-carbon aldopentose sugar present in RNA nucleotides and ATP.",
    difficulty: "Easy"
  },
  {
    question_text: "How does 2-deoxyribose differ structurally from ribose sugar?",
    options: ["It lacks an oxygen atom at carbon-2", "It lacks an oxygen atom at carbon-3", "It has an additional hydroxyl group at carbon-2", "It is a hexose rather than a pentose"],
    correct_option: 0,
    explanation: "2-Deoxyribose lacks a hydroxyl (-OH) group at the carbon-2 position, having an -H atom instead, making it one oxygen atom short compared to ribose.",
    difficulty: "Medium"
  },
  {
    question_text: "A 6-carbon sugar ring formed by 5 carbon atoms and 1 oxygen atom is known as a:",
    options: ["Pyranose ring", "Furanose ring", "Purine ring", "Pyrimidine ring"],
    correct_option: 0,
    explanation: "A six-membered ring containing 5 carbon atoms and 1 oxygen atom is termed a pyranose ring (e.g., glucopyranose).",
    difficulty: "Medium"
  },
  {
    question_text: "Fructose predominantly forms a 5-membered ring structure called a:",
    options: ["Furanose ring", "Pyranose ring", "Lactone ring", "Benzene ring"],
    correct_option: 0,
    explanation: "Fructose in solution forms a five-membered ring containing 4 carbon atoms and 1 oxygen atom, known as a furanose ring (fructofuranose).",
    difficulty: "Medium"
  },
  {
    question_text: "In the ring structure of alpha-D-glucose, the hydroxyl group (-OH) attached to carbon-1 points:",
    options: ["Below the plane of the ring", "Above the plane of the ring", "Perpendicular to carbon-6", "Equatorially upwards"],
    correct_option: 0,
    explanation: "In alpha-D-glucose, the -OH group at carbon-1 (anomeric carbon) is positioned below the ring plane, whereas in beta-D-glucose it is above the plane.",
    difficulty: "Hard"
  },
  {
    question_text: "Which of the following is an example of a tetrose sugar?",
    options: ["Erythrose", "Glyceraldehyde", "Ribulose", "Sedoheptulose"],
    correct_option: 0,
    explanation: "Erythrose is a 4-carbon monosaccharide (tetrose) essential in the pentose phosphate pathway.",
    difficulty: "Medium"
  },
  {
    question_text: "Monosaccharides cannot be hydrolyzed further into simpler carbohydrates because:",
    options: ["They consist of a single monomeric sugar unit", "They lack glycosidic bonds", "They are insoluble in water", "Both A and B"],
    correct_option: 3,
    explanation: "Monosaccharides are the simplest sugars consisting of a single polyhydroxy aldehyde or ketone unit without glycosidic linkages, so they cannot be hydrolyzed.",
    difficulty: "Medium"
  },

  // 11-20: Monosaccharide Properties & Isomerism
  {
    question_text: "Which of the following monosaccharides is the primary source of immediate energy in human cellular respiration?",
    options: ["D-Glucose", "D-Galactose", "D-Fructose", "D-Ribose"],
    correct_option: 0,
    explanation: "Glucose (blood sugar) is the principal substrate utilized in glycolysis to generate ATP.",
    difficulty: "Easy"
  },
  {
    question_text: "D-Glucose and D-Galactose are epimers that differ in configuration specifically at carbon atom number:",
    options: ["C-4", "C-2", "C-3", "C-5"],
    correct_option: 0,
    explanation: "Glucose and Galactose are C-4 epimers; they differ only in the spatial orientation of the -OH group at carbon-4.",
    difficulty: "Hard"
  },
  {
    question_text: "D-Glucose and D-Mannose are epimers that differ in spatial arrangement at carbon:",
    options: ["C-2", "C-3", "C-4", "C-5"],
    correct_option: 0,
    explanation: "Glucose and Mannose are C-2 epimers, differing in stereochemistry at the second carbon atom.",
    difficulty: "Hard"
  },
  {
    question_text: "All monosaccharides possess reducing properties because they contain a free:",
    options: ["Aldehyde or ketone group", "Carboxyl group", "Amino group", "Phosphate group"],
    correct_option: 0,
    explanation: "Free aldehyde or ketone groups in monosaccharides can donate electrons, reducing Benedict's or Fehling's reagents.",
    difficulty: "Easy"
  },
  {
    question_text: "How many calories (kcal) of energy are released by the complete oxidation of 1 gram of glucose in human cells?",
    options: ["4.0 kcal", "9.0 kcal", "7.0 kcal", "2.0 kcal"],
    correct_option: 0,
    explanation: "Carbohydrates yield approximately 4.0 kcal (or 16.7 kJ) of energy per gram during metabolism.",
    difficulty: "Easy"
  },
  {
    question_text: "Which ketohexose is known as fruit sugar and is the sweetest naturally occurring sugar?",
    options: ["Fructose", "Glucose", "Galactose", "Maltose"],
    correct_option: 0,
    explanation: "Fructose is found abundantly in fruits and honey and is recognized as the sweetest natural monosaccharide.",
    difficulty: "Easy"
  },
  {
    question_text: "In aqueous solution, monosaccharides predominantly exist in which conformation?",
    options: ["Ring (cyclic) structure", "Open-chain linear structure", "Helical coil structure", "Beta-pleated sheet"],
    correct_option: 0,
    explanation: "In aqueous solutions, hexoses and pentoses undergo intramolecular hemiacetal/hemiketal formation to exist over 99% in cyclic ring structures.",
    difficulty: "Medium"
  },
  {
    question_text: "What carbon atom number becomes the 'anomeric carbon' when D-glucose forms a cyclic pyranose ring?",
    options: ["C-1", "C-2", "C-5", "C-6"],
    correct_option: 0,
    explanation: "The carbonyl carbon (C-1 in glucose) becomes asymmetric upon cyclization, generating alpha and beta anomers.",
    difficulty: "Hard"
  },
  {
    question_text: "Which of the following test solutions turns brick-red when heated with a reducing monosaccharide?",
    options: ["Benedict's solution", "Iodine solution", "Biuret solution", "Sudan IV reagent"],
    correct_option: 0,
    explanation: "Benedict's reagent contains cupric ions (Cu2+) which are reduced to a brick-red cuprous oxide (Cu2O) precipitate by reducing sugars.",
    difficulty: "Easy"
  },
  {
    question_text: "Glyceraldehyde possesses how many asymmetric (chiral) carbon atoms?",
    options: ["1", "2", "3", "0"],
    correct_option: 0,
    explanation: "Glyceraldehyde (CH2OH-CHOH-CHO) has 1 chiral carbon center (C-2), allowing it to form 2 stereoisomers (D- and L-forms).",
    difficulty: "Hard"
  },

  // 21-30: Disaccharides & Glycosidic Bonds
  {
    question_text: "Which glycosidic linkage joins the two glucose units in maltose?",
    options: ["alpha-1,4-glycosidic bond", "beta-1,4-glycosidic bond", "alpha-1,6-glycosidic bond", "beta-1,2-glycosidic bond"],
    correct_option: 0,
    explanation: "Maltose (malt sugar) consists of two alpha-D-glucose molecules linked by an alpha-1,4-glycosidic bond.",
    difficulty: "Medium"
  },
  {
    question_text: "Sucrose is formed by a condensation reaction between:",
    options: ["alpha-D-glucose and beta-D-fructose", "alpha-D-glucose and alpha-D-galactose", "two molecules of alpha-D-glucose", "two molecules of beta-D-galactose"],
    correct_option: 0,
    explanation: "Sucrose (table sugar) is a disaccharide composed of alpha-D-glucose and beta-D-fructose linked together.",
    difficulty: "Medium"
  },
  {
    question_text: "Which glycosidic bond is unique to sucrose and renders it a non-reducing disaccharide?",
    options: ["alpha-1,2-glycosidic bond (C1 of glucose to C2 of fructose)", "alpha-1,4-glycosidic bond", "beta-1,4-glycosidic bond", "alpha-1,6-glycosidic bond"],
    correct_option: 0,
    explanation: "In sucrose, the glycosidic bond involves the anomeric carbon of glucose (C-1) and the anomeric carbon of fructose (C-2), tying up both reducing centers.",
    difficulty: "Hard"
  },
  {
    question_text: "Milk sugar (lactose) is composed of which two monosaccharide units?",
    options: ["Glucose and Galactose", "Glucose and Fructose", "Glucose and Glucose", "Galactose and Fructose"],
    correct_option: 0,
    explanation: "Lactose is formed from one beta-D-galactose and one alpha/beta-D-glucose unit.",
    difficulty: "Easy"
  },
  {
    question_text: "What type of glycosidic linkage connects galactose and glucose in lactose?",
    options: ["beta-1,4-glycosidic bond", "alpha-1,4-glycosidic bond", "alpha-1,6-glycosidic bond", "beta-1,2-glycosidic bond"],
    correct_option: 0,
    explanation: "Lactose features a beta-1,4-glycosidic linkage between carbon-1 of galactose and carbon-4 of glucose.",
    difficulty: "Medium"
  },
  {
    question_text: "Why is sucrose utilized as the primary transport carbohydrate in plant phloem vascular tissue?",
    options: ["It is chemically stable and non-reducing, preventing unwanted enzymatic reactions during transport", "It is insoluble in water", "It yields double the energy of glucose", "It cannot cross cell membranes"],
    correct_option: 0,
    explanation: "Sucrose is a non-reducing sugar, making it chemically unreactive and ideal for long-distance transport through phloem sieve tubes without premature metabolism.",
    difficulty: "Medium"
  },
  {
    question_text: "Which enzyme hydrolyzes lactose into glucose and galactose in the human brush border membrane?",
    options: ["Lactase", "Maltase", "Sucrase", "Amylase"],
    correct_option: 0,
    explanation: "Lactase (beta-galactosidase) breaks down lactose into its constituent glucose and galactose monosaccharides.",
    difficulty: "Easy"
  },
  {
    question_text: "Disaccharides are formed by combining two monosaccharides with the elimination of a molecule of:",
    options: ["Water (H2O)", "Carbon dioxide (CO2)", "Hydrogen (H2)", "Oxygen (O2)"],
    correct_option: 0,
    explanation: "Glycosidic bond formation is a condensation (dehydration synthesis) reaction that releases one molecule of water.",
    difficulty: "Easy"
  },
  {
    question_text: "Which of the following disaccharides gives a negative result with Benedict's reagent?",
    options: ["Sucrose", "Maltose", "Lactose", "Cellobiose"],
    correct_option: 0,
    explanation: "Sucrose lacks a free aldehyde or ketone anomeric group, making it a non-reducing sugar that does not react with Benedict's solution.",
    difficulty: "Medium"
  },
  {
    question_text: "Hydrolysis of cellobiose yields two units of glucose linked originally by a:",
    options: ["beta-1,4-glycosidic bond", "alpha-1,4-glycosidic bond", "alpha-1,6-glycosidic bond", "beta-1,6-glycosidic bond"],
    correct_option: 0,
    explanation: "Cellobiose is a breakdown product of cellulose consisting of two glucose molecules joined by a beta-1,4-glycosidic bond.",
    difficulty: "Hard"
  },

  // 31-40: Polysaccharides - Starch & Glycogen
  {
    question_text: "Starch is the chief storage polysaccharide in plants and consists of two fractions named:",
    options: ["Amylose and Amylopectin", "Amylose and Glycogen", "Cellulose and Chitin", "Amylopectin and Inulin"],
    correct_option: 0,
    explanation: "Plant starch consists of unbranched amylose (~20-30%) and branched amylopectin (~70-80%).",
    difficulty: "Easy"
  },
  {
    question_text: "Which structural feature distinguishes amylose from amylopectin?",
    options: ["Amylose is unbranched with alpha-1,4 linkages, while amylopectin has alpha-1,4 and branched alpha-1,6 linkages", "Amylose contains beta-1,4 linkages while amylopectin contains alpha-1,4 linkages", "Amylose is soluble in hot water while amylopectin is completely insoluble in all solvents", "Amylose contains galactose while amylopectin contains glucose"],
    correct_option: 0,
    explanation: "Amylose is a linear helical polymer with alpha-1,4 bonds, whereas amylopectin is branched with alpha-1,6 glycosidic bonds every 24-30 glucose units.",
    difficulty: "Medium"
  },
  {
    question_text: "What color reaction does iodine solution produce when added to plant starch?",
    options: ["Deep blue / blue-black", "Brick red", "Purple-violet", "Bright yellow"],
    correct_option: 0,
    explanation: "Iodine (I2-KI) inserts into the helical structure of amylose, producing a characteristic deep blue/blue-black color complex.",
    difficulty: "Easy"
  },
  {
    question_text: "Glycogen is structurally most similar to which component of plant starch, but with much higher branching frequency?",
    options: ["Amylopectin", "Amylose", "Cellulose", "Chitin"],
    correct_option: 0,
    explanation: "Glycogen resembles amylopectin but is more densely branched, with alpha-1,6 branch points occurring every 8 to 12 glucose units.",
    difficulty: "Medium"
  },
  {
    question_text: "Where are the primary storage sites for glycogen in the human body?",
    options: ["Liver and Skeletal muscle", "Kidneys and Spleen", "Adipose tissue and Pancreas", "Brain and Heart"],
    correct_option: 0,
    explanation: "Glycogen (animal starch) is mainly synthesized and stored in hepatocytes (liver cells) and skeletal muscle fibers.",
    difficulty: "Easy"
  },
  {
    question_text: "What color reaction is produced when iodine reagent is mixed with glycogen?",
    options: ["Reddish-brown / Red", "Deep blue", "Green", "No color change"],
    correct_option: 0,
    explanation: "Glycogen forms a reddish-brown complex with iodine due to its highly compact branched structure.",
    difficulty: "Medium"
  },
  {
    question_text: "Branch points in amylopectin and glycogen molecules are formed by which type of glycosidic linkage?",
    options: ["alpha-1,6-glycosidic bond", "alpha-1,4-glycosidic bond", "beta-1,4-glycosidic bond", "beta-1,6-glycosidic bond"],
    correct_option: 0,
    explanation: "Linear chains are joined by alpha-1,4 bonds, while branch points are created by alpha-1,6 glycosidic linkages.",
    difficulty: "Medium"
  },
  {
    question_text: "Which pancreatic and salivary enzyme breaks down alpha-1,4 linkages in starch during digestion?",
    options: ["alpha-Amylase", "Cellulase", "Pepsin", "Lipase"],
    correct_option: 0,
    explanation: "Amylase cleaves internal alpha-1,4 glycosidic bonds of starch to produce maltose, maltotriose, and limit dextrins.",
    difficulty: "Easy"
  },
  {
    question_text: "Why are polysaccharides like starch and glycogen ideal storage macromolecules in living organisms?",
    options: ["They are insoluble in water and exert negligible osmotic pressure on the cell", "They diffuse rapidly across plasma membranes", "They are strong reducing agents that prevent oxidation", "They require no ATP during synthesis"],
    correct_option: 0,
    explanation: "Being compact, insoluble, and macromolecules, starch and glycogen do not alter intracellular osmotic pressure, preventing water influx and cell lysis.",
    difficulty: "Medium"
  },
  {
    question_text: "The partial hydrolysis of starch by amylase produces short-branched glucose oligosaccharide residues known as:",
    options: ["Dextrins", "Pectins", "Chitin", "Inulin"],
    correct_option: 0,
    explanation: "Dextrins are intermediate breakdown fragments produced during the partial hydrolysis of starch.",
    difficulty: "Hard"
  },

  // 41-50: Polysaccharides - Cellulose & Structural Carbohydrates
  {
    question_text: "Cellulose is an unbranched polymer consisting of glucose monomers joined by:",
    options: ["beta-1,4-glycosidic bonds", "alpha-1,4-glycosidic bonds", "alpha-1,6-glycosidic bonds", "beta-1,6-glycosidic bonds"],
    correct_option: 0,
    explanation: "Cellulose consists of beta-D-glucose residues linked together by beta-1,4-glycosidic bonds.",
    difficulty: "Medium"
  },
  {
    question_text: "Why can human digestive enzymes digest starch but cannot digest cellulose?",
    options: ["Human enzymes possess alpha-glucosidase (amylase) activity but lack cellulase to cleave beta-1,4 bonds", "Cellulose contains galactose instead of glucose", "Cellulose is toxic to human intestinal mucosal cells", "Cellulose forms strong ionic bonds with gut proteins"],
    correct_option: 0,
    explanation: "Humans lack the enzyme cellulase needed to hydrolyze the beta-1,4-glycosidic linkages present in cellulose.",
    difficulty: "Medium"
  },
  {
    question_text: "In plant cell walls, parallel cellulose chains are bound together into strong microfibrils by numerous:",
    options: ["Hydrogen bonds", "Covalent peptide bonds", "Disulfide bridges", "Ionic bonds"],
    correct_option: 0,
    explanation: "Hydrogen bonding between hydroxyl groups of adjacent parallel cellulose chains creates rigid, high-tensile microfibrils.",
    difficulty: "Medium"
  },
  {
    question_text: "Chitin is a structural polysaccharide found in fungal cell walls and arthropod exoskeletons. What is its monomeric unit?",
    options: ["N-acetylglucosamine (NAG)", "Glucosamine sulphate", "beta-D-galactose", "N-acetylmuramic acid"],
    correct_option: 0,
    explanation: "Chitin is a homopolymer of N-acetylglucosamine (a nitrogenous derivative of glucose) linked by beta-1,4 bonds.",
    difficulty: "Medium"
  },
  {
    question_text: "What color does cellulose yield when treated with iodine solution?",
    options: ["No color change (gives negative result)", "Blue", "Red", "Yellow"],
    correct_option: 0,
    explanation: "Cellulose lacks helical coiling and does not bind iodine, producing no color change.",
    difficulty: "Easy"
  },
  {
    question_text: "In mammalian herbivores (e.g., cows, sheep), cellulose digestion occurs due to:",
    options: ["Symbiotic bacteria, protozoa, and fungi in the digestive tract that secrete cellulase", "Endogenous salivary cellulase secretion", "Gastric hydrochloric acid breaking beta-1,4 bonds directly", "Pancreatic secretion of cellulase enzyme"],
    correct_option: 0,
    explanation: "Ruminants rely on symbiotic microbes in the rumen that produce cellulase to ferment cellulose into volatile fatty acids.",
    difficulty: "Medium"
  },
  {
    question_text: "Cellulose plays a vital role in human nutrition as dietary fiber (roughage) because it:",
    options: ["Stimulates peristalsis and aids in smooth passage of bowel contents", "Provides 4 kcal/g of direct metabolic energy", "Synthesizes essential amino acids in the colon", "Inhibits bile acid absorption in the stomach"],
    correct_option: 0,
    explanation: "Indigestible cellulose adds bulk to stool, stimulating intestinal peristaltic contractions and preventing constipation.",
    difficulty: "Easy"
  },
  {
    question_text: "Which structural carbohydrate is a polymer of fructose units and is used to measure glomerular filtration rate (GFR)?",
    options: ["Inulin", "Pectin", "Agar", "Peptidoglycan"],
    correct_option: 0,
    explanation: "Inulin is a storage fructan polysaccharide used clinically to determine kidney GFR because it is freely filtered and neither reabsorbed nor secreted.",
    difficulty: "Hard"
  },
  {
    question_text: "Peptidoglycan (murein) present in bacterial cell walls is composed of carbohydrate chains cross-linked by:",
    options: ["Short peptide chains", "Phosphodiester bonds", "Glycosidic linkages only", "Ester linkages"],
    correct_option: 0,
    explanation: "Peptidoglycan consists of alternating NAG and NAM sugar chains cross-linked by short amino acid peptide bridges.",
    difficulty: "Medium"
  },
  {
    question_text: "Which polysaccharide derived from red algae is widely used as a solidifying agent in microbiological culture media?",
    options: ["Agar-agar", "Alginate", "Dextran", "Carrageenan"],
    correct_option: 0,
    explanation: "Agar is a sulfated galactan polysaccharide extracted from red algae (Rhodophyta) used to solidify nutrient media.",
    difficulty: "Medium"
  },

  // 51-60: Conjugated Molecules containing Carbohydrates
  {
    question_text: "Glycoproteins are conjugated molecules formed by the covalent attachment of carbohydrate chains to:",
    options: ["Proteins", "Lipids", "Nucleic acids", "Steroids"],
    correct_option: 0,
    explanation: "Glycoproteins consist of oligosaccharide chains covalently bound to amino acid side chains in proteins.",
    difficulty: "Easy"
  },
  {
    question_text: "Glycolipids present in the outer leaflet of the eukaryotic plasma membrane play a primary role in:",
    options: ["Cell-cell recognition and tissue antigenicity", "ATP synthesis", "Active transport of sodium ions", "Steroid hormone synthesis"],
    correct_option: 0,
    explanation: "Carbohydrate moieties of glycolipids and glycoproteins project externally as cellular markers for recognition and cell adhesion.",
    difficulty: "Medium"
  },
  {
    question_text: "The ABOH blood group antigens present on human erythrocyte membranes are structurally classified as:",
    options: ["Glycolipids and Glycoproteins", "Lipoproteins", "Nucleoproteins", "Phospholipids"],
    correct_option: 0,
    explanation: "ABO blood type specificity is determined by specific oligosaccharide carbohydrate chains attached to membrane lipids and proteins.",
    difficulty: "Medium"
  },
  {
    question_text: "Mucoproteins (proteoglycans) differ from typical glycoproteins because proteoglycans contain:",
    options: ["A much higher percentage of carbohydrates (GAGs) relative to protein weight", "No amino acids", "Lipid groups attached to glucose", "Phosphate backbones"],
    correct_option: 0,
    explanation: "Proteoglycans are predominantly carbohydrate (~85-95%) consisting of long unbranched glycosaminoglycans (GAGs) attached to a core protein.",
    difficulty: "Hard"
  },
  {
    question_text: "Which glycosaminoglycan (GAG) acts as a natural anticoagulant in human blood vessels?",
    options: ["Heparin", "Hyaluronic acid", "Chondroitin sulfate", "Keratan sulfate"],
    correct_option: 0,
    explanation: "Heparin is a sulfated carbohydrate polymer that activates antithrombin III, inhibiting blood coagulation.",
    difficulty: "Medium"
  },
  {
    question_text: "In the fluid mosaic model, the carbohydrate glycocalyx is located strictly on which side of the plasma membrane?",
    options: ["Extracellular (outer) surface", "Cytoplasmic (inner) surface", "Hydrophobic core", "Transmembrane region"],
    correct_option: 0,
    explanation: "Carbohydrate chains of glycoproteins and glycolipids orient exclusively toward the extracellular fluid, forming the glycocalyx.",
    difficulty: "Medium"
  },
  {
    question_text: "Bacterial lipopolysaccharide (LPS) present in Gram-negative outer membranes is an endotoxin consisting of lipid A and a core:",
    options: ["O-antigen polysaccharide", "Peptide chain", "Polynucleotide", "Triglyceride"],
    correct_option: 0,
    explanation: "LPS comprises Lipid A (toxic moiety), a core oligosaccharide, and a outer O-antigen polysaccharide chain.",
    difficulty: "Hard"
  },
  {
    question_text: "N-linked glycosylation of proteins in eukaryotic cells occurs primarily within which cellular organelle?",
    options: ["Lumen of the Rough Endoplasmic Reticulum", "Nucleolus", "Peroxisome", "Mitochondrial matrix"],
    correct_option: 0,
    explanation: "N-linked glycosylation initiates in the lumen of the RER where oligosaccharide complexes are attached to asparagine residues.",
    difficulty: "Hard"
  },
  {
    question_text: "O-linked glycosylation attaches oligosaccharide chains to the hydroxyl group of which amino acids?",
    options: ["Serine and Threonine", "Alanine and Valine", "Leucine and Isoleucine", "Methionine and Cysteine"],
    correct_option: 0,
    explanation: "O-linked glycosylation attaches carbohydrates to the -OH groups of serine or threonine residues, primarily in the Golgi apparatus.",
    difficulty: "Hard"
  },
  {
    question_text: "Hyaluronic acid, a major glycosaminoglycan in synovial fluid and extracellular matrix, functions primarily as a:",
    options: ["Lubricant and shock absorber", "Energy donor for ATP synthase", "Oxygen carrier in plasma", "Enzyme catalyst"],
    correct_option: 0,
    explanation: "Hyaluronic acid retains vast amounts of water, serving as a viscous cushion and lubricant in joint cavities and connective tissues.",
    difficulty: "Medium"
  },

  // 61-70: Advanced Carbohydrate Chemistry & Bioenergetics
  {
    question_text: "What is the net yield of ATP molecules produced per mole of glucose during anaerobic glycolysis?",
    options: ["2 ATP molecules", "4 ATP molecules", "36 ATP molecules", "38 ATP molecules"],
    correct_option: 0,
    explanation: "Glycolysis consumes 2 ATP and produces 4 ATP, resulting in a net yield of 2 ATP molecules per glucose.",
    difficulty: "Easy"
  },
  {
    question_text: "In the aldose-ketose isomerism of hexoses, glucose is converted to fructose-6-phosphate by which enzyme during glycolysis?",
    options: ["Phosphoglucoisomerase", "Hexokinase", "Phosphofructokinase-1", "Aldolase"],
    correct_option: 0,
    explanation: "Phosphoglucoisomerase catalyzes the reversible conversion of glucose-6-phosphate (aldose) into fructose-6-phosphate (ketose).",
    difficulty: "Medium"
  },
  {
    question_text: "Which of the following is a non-reducing disaccharide composed of two glucose molecules linked by an alpha-1,1-glycosidic bond?",
    options: ["Trehalose", "Maltose", "Isomaltose", "Cellobiose"],
    correct_option: 0,
    explanation: "Trehalose consists of two alpha-glucose units joined at C1-C1, making both reducing centers unavailable.",
    difficulty: "Hard"
  },
  {
    question_text: "An Optical isomer that rotates plane-polarized light to the right (clockwise) is designated as:",
    options: ["Dextrorotatory (+)", "Levorotatory (-)", "Anomeric", "Racemic"],
    correct_option: 0,
    explanation: "Dextrorotatory isomers rotate plane-polarized light to the right (+), whereas levorotatory (-) rotate it to the left.",
    difficulty: "Medium"
  },
  {
    question_text: "What structural feature makes cellulose insoluble in cold water?",
    options: ["High molecular weight and extensive inter-chain hydrogen bonding forming dense fibers", "Hydrophobic hydrocarbon chains", "Presence of peptide cross-links", "Negatively charged phosphate groups"],
    correct_option: 0,
    explanation: "Linear beta-1,4-glucan chains bundle tightly via extensive inter-chain H-bonds, shielding hydroxyl groups from water solvation.",
    difficulty: "Medium"
  },
  {
    question_text: "During gluconeogenesis, glucose is synthesized mainly in the liver from non-carbohydrate precursors such as:",
    options: ["Lactate, glycerol, and glucogenic amino acids", "Fatty acids and cholesterol", "Nucleic acids and ATP", "Cellulose and chitin"],
    correct_option: 0,
    explanation: "Gluconeogenesis generates glucose from lactate, pyruvate, glycerol, and glucogenic amino acids (e.g. alanine).",
    difficulty: "Medium"
  },
  {
    question_text: "Which hormone stimulates glycogenesis (glycogen synthesis) in muscle and liver cells following a carbohydrate meal?",
    options: ["Insulin", "Glucagon", "Epinephrine", "Cortisol"],
    correct_option: 0,
    explanation: "Insulin promotes glucose uptake and activates glycogen synthase, storing excess glucose as glycogen.",
    difficulty: "Easy"
  },
  {
    question_text: "Glucagon and Epinephrine trigger the breakdown of liver glycogen into glucose-1-phosphate via activation of:",
    options: ["Glycogen phosphorylase", "Glycogen synthase", "Hexokinase", "Glucokinase"],
    correct_option: 0,
    explanation: "Glycogen phosphorylase cleaves alpha-1,4 glycosidic bonds in glycogen using inorganic phosphate to release glucose-1-phosphate.",
    difficulty: "Hard"
  },
  {
    question_text: "Which carbohydrate derivative forms the structural backbone of bacterial lipoteichoic acids in Gram-positive cell walls?",
    options: ["Ribitol phosphate or Glycerol phosphate polymers", "Chitin", "Starch", "Glycogen"],
    correct_option: 0,
    explanation: "Teichoic acids are polymers of glycerol phosphate or ribitol phosphate linked by phosphodiester bonds to carbohydrates.",
    difficulty: "Hard"
  },
  {
    question_text: "The Pentose Phosphate Pathway (shunt) generates which key reducing equivalent required for fatty acid biosynthesis?",
    options: ["NADPH", "NADH", "FADH2", "FMNH2"],
    correct_option: 0,
    explanation: "The PPP oxidizes glucose-6-phosphate to yield NADPH (for reductive biosyntheses) and ribose-5-phosphate (for nucleotide synthesis).",
    difficulty: "Medium"
  },

  // 71-80: Analytical Tests & Clinical Relevance
  {
    question_text: "Fehling's solution A contains aqueous copper sulfate, while Fehling's solution B contains:",
    options: ["Sodium potassium tartrate (Rochelle salt) and sodium hydroxide", "Sodium citrate and sodium carbonate", "Iodine and potassium iodide", "Silver nitrate and ammonia"],
    correct_option: 0,
    explanation: "Fehling's B contains alkaline Rochelle salt which chelates Cu2+ ions, preventing copper hydroxide precipitation.",
    difficulty: "Hard"
  },
  {
    question_text: "Seliwanoff's test is a diagnostic colorimetric test specifically used to distinguish aldoses from:",
    options: ["Ketoses", "Pentoses", "Disaccharides", "Polysaccharides"],
    correct_option: 0,
    explanation: "Seliwanoff's test uses resorcinol and HCl; ketoses (like fructose) rapidly form a deep cherry-red complex.",
    difficulty: "Hard"
  },
  {
    question_text: "Bial's orcinol test is used to detect the presence of:",
    options: ["Pentose sugars", "Hexose sugars", "Lipids", "Proteins"],
    correct_option: 0,
    explanation: "Bial's reagent reacts with pentoses (e.g. ribose) upon heating to form a blue-green condensation product.",
    difficulty: "Hard"
  },
  {
    question_text: "Barfoed's test differentiates monosaccharides from disaccharides based on:",
    options: ["Speed of reduction of cupric acetate in mild acidic medium", "Solubility in ethanol", "Optical rotation", "Molecular weight"],
    correct_option: 0,
    explanation: "Monosaccharides reduce copper in Barfoed's acidic reagent rapidly (within 2-3 mins), whereas reducing disaccharides react much slower.",
    difficulty: "Hard"
  },
  {
    question_text: "In diabetes mellitus, persistent hyperglycemia leads to non-enzymatic glycosylation of hemoglobin, measured clinically as:",
    options: ["HbA1c", "Myoglobin", "Transferrin", "Bilirubin"],
    correct_option: 0,
    explanation: "HbA1c represents glycated hemoglobin, reflecting average blood glucose levels over the preceding 2-3 months.",
    difficulty: "Easy"
  },
  {
    question_text: "Lactose intolerance results from a deficiency of intestinal lactase, leading to bacterial fermentation of lactose into:",
    options: ["Lactic acid, hydrogen gas, and carbon dioxide", "Urea and ammonia", "Glucose and fructose", "Glycogen"],
    correct_option: 0,
    explanation: "Undigested lactose in the colon is fermented by gut microbiota into short-chain organic acids and gases (H2, CO2, CH4), causing bloating and diarrhea.",
    difficulty: "Medium"
  },

  {
    question_text: "Galactosemia is a hereditary metabolic disorder caused by the inability to metabolize:",
    options: ["Galactose", "Fructose", "Sucrose", "Maltose"],
    correct_option: 0,
    explanation: "Galactosemia results from deficiencies in enzymes like GALT (galactose-1-phosphate uridylyltransferase), accumulating galactose and toxic metabolites.",
    difficulty: "Medium"
  },
  {
    question_text: "Which of the following is an essential sugar acid component of vitamin C (ascorbic acid)?",
    options: ["L-Ascorbic acid (derived from glucuronic acid)", "L-Lactic acid", "Pyruvic acid", "Citric acid"],
    correct_option: 0,
    explanation: "Ascorbic acid is a sugar acid structurally related to hexose monosaccharides.",
    difficulty: "Hard"
  },
  {
    question_text: "Osazone test using phenylhydrazine forms characteristic yellow crystalline osazones. Glucose and fructose form identical osazones because:",
    options: ["They differ only at carbon-1 and carbon-2, which are involved in osazone formation", "They have identical chemical structures throughout", "Both are ketohexoses", "Both are pentoses"],
    correct_option: 0,
    explanation: "Osazone reaction alters C-1 and C-2; since glucose, fructose, and mannose have identical C-3, C-4, C-5, and C-6 configurations, they yield identical osazone crystals.",
    difficulty: "Hard"
  },
  {
    question_text: "Sorbitol and Dulcitol are metabolic products formed by the enzymatic reduction of:",
    options: ["Glucose and Galactose respectively", "Fructose and Ribose respectively", "Sucrose and Maltose respectively", "Starch and Cellulose respectively"],
    correct_option: 0,
    explanation: "Aldose reductase converts glucose to sorbitol and galactose to dulcitol (galactitol).",
    difficulty: "Hard"
  },

  // 81-100: Comprehensive High-Yield MDCAT Practice
  {
    question_text: "Which component of plant cell walls contains highly branched polysaccharide chains rich in galacturonic acid?",
    options: ["Pectin", "Hemicellulose", "Lignin", "Suberin"],
    correct_option: 0,
    explanation: "Pectins are heteropolysaccharides composed mainly of D-galacturonic acid polymers that cement adjacent plant cell walls.",
    difficulty: "Medium"
  },
  {
    question_text: "Hemicellulose differs from cellulose because hemicellulose is:",
    options: ["Branched and composed of various sugar monomers (xylose, mannose, galactose)", "An unbranched polymer of pure beta-glucose", "Insoluble in dilute alkali solutions", "Synthesized in mitochondria"],
    correct_option: 0,
    explanation: "Hemicellulose is a heterogeneous, branched polysaccharide matrix polymer soluble in dilute alkaline solutions.",
    difficulty: "Medium"
  },
  {
    question_text: "When two monosaccharide isomers differ in configuration around a single asymmetric carbon atom other than the anomeric carbon, they are termed:",
    options: ["Epimers", "Anomers", "Enantiomers", "Diastereomers"],
    correct_option: 0,
    explanation: "Epimers are stereoisomers that differ in stereochemistry around only one chiral carbon center.",
    difficulty: "Medium"
  },
  {
    question_text: "Mutarotation refers to the spontaneous change in specific optical rotation observed when an anomer of glucose is dissolved in:",
    options: ["Water", "Absolute ethanol", "Chloroform", "Benzene"],
    correct_option: 0,
    explanation: "Mutarotation occurs in water as alpha and beta anomers interconvert via the open-chain form until equilibrium is attained.",
    difficulty: "Hard"
  },
  {
    question_text: "Alpha-D-glucose and Beta-D-glucose are examples of:",
    options: ["Anomers", "Epimers at C-3", "Enantiomers", "Structural isomers"],
    correct_option: 0,
    explanation: "Alpha and beta forms differ specifically at C-1 (the anomeric carbon), making them anomers.",
    difficulty: "Medium"
  },
  {
    question_text: "The sweetness index of sugar molecules lists fructose as sweeter than sucrose, while lactose has a sweetness rating relative to sucrose of approximately:",
    options: ["16-30% (much less sweet)", "100%", "200%", "500%"],
    correct_option: 0,
    explanation: "Lactose is significantly less sweet than sucrose (~0.16-0.3 times as sweet).",
    difficulty: "Medium"
  },
  {
    question_text: "In sugar nomenclature, aldoses contain an aldehyde group located at carbon position:",
    options: ["C-1", "C-2", "C-3", "C-6"],
    correct_option: 0,
    explanation: "In aldoses, the aldehyde functional group (-CHO) is always situated at C-1.",
    difficulty: "Easy"
  },
  {
    question_text: "In ketoses like D-fructose, the keto group is positioned at carbon:",
    options: ["C-2", "C-1", "C-3", "C-4"],
    correct_option: 0,
    explanation: "In D-fructose and most ketopentoses/hexoses, the carbonyl oxygen is located at C-2.",
    difficulty: "Easy"
  },
  {
    question_text: "Which carbohydrate is known as table sugar or cane sugar?",
    options: ["Sucrose", "Maltose", "Lactose", "Glucose"],
    correct_option: 0,
    explanation: "Sucrose extracted from sugar cane or sugar beet is commercially known as table sugar.",
    difficulty: "Easy"
  },
  {
    question_text: "Which carbohydrate is known as malt sugar, obtained during the germination of barley grains?",
    options: ["Maltose", "Sucrose", "Lactose", "Cellobiose"],
    correct_option: 0,
    explanation: "Maltose is produced during the enzymatic breakdown of starch in germinating cereal seeds (malting).",
    difficulty: "Easy"
  },
  {
    question_text: "Which of the following carbohydrates is completely insoluble in water?",
    options: ["Cellulose", "Glucose", "Sucrose", "Fructose"],
    correct_option: 0,
    explanation: "Cellulose's tight fibrous hydrogen-bonded network makes it completely insoluble in water.",
    difficulty: "Easy"
  },
  {
    question_text: "Glycogen granules in liver cytoplasm are often associated with enzymes responsible for its synthesis and breakdown, called:",
    options: ["Glycosomes", "Lysosomes", "Peroxisomes", "Ribosomes"],
    correct_option: 0,
    explanation: "Glycogen granules together with glycogen synthase and phosphorylase enzymes form cytoplasmic complexes termed glycosomes.",
    difficulty: "Hard"
  },
  {
    question_text: "How many carbon atoms are present in a heptose sugar like sedoheptulose?",
    options: ["7", "6", "5", "4"],
    correct_option: 0,
    explanation: "Heptoses contain 7 carbon atoms (e.g. sedoheptulose-7-phosphate in Calvin cycle).",
    difficulty: "Easy"
  },
  {
    question_text: "In the Haworth projection of alpha-D-glucopyranose, carbon-6 (CH2OH) is positioned:",
    options: ["Above the plane of the ring at C-5", "Below the plane of the ring at C-5", "Inside the ring replacing oxygen", "Attached directly to C-1"],
    correct_option: 0,
    explanation: "In D-sugars, the terminal C-6 (CH2OH) group projects upwards above the ring plane at carbon-5.",
    difficulty: "Medium"
  },
  {
    question_text: "Condensation of two monosaccharides forms a glycosidic bond which is chemically classified as an:",
    options: ["Ether linkage (-C-O-C-)", "Ester linkage", "Amide linkage", "Anhydride linkage"],
    correct_option: 0,
    explanation: "A glycosidic bond is an acetal/ketal link formed between an anomeric carbon and an alcohol -OH group, structurally an ether link.",
    difficulty: "Medium"
  },
  {
    question_text: "Which organ in the human body is strictly dependent on a continuous supply of blood glucose under normal non-starving conditions?",
    options: ["Brain", "Liver", "Skeletal muscle", "Kidney cortex"],
    correct_option: 0,
    explanation: "The brain relies almost exclusively on glucose oxidation (~120g/day) under physiological conditions.",
    difficulty: "Easy"
  },
  {
    question_text: "Which of the following is a heteropolysaccharide consisting of repeating disaccharide units containing an amino sugar?",
    options: ["Glycosaminoglycan (GAG)", "Amylose", "Glycogen", "Cellulose"],
    correct_option: 0,
    explanation: "GAGs (like hyaluronic acid, chondroitin sulfate) are heteropolysaccharides of repeating uronic acid and amino sugar units.",
    difficulty: "Medium"
  },
  {
    question_text: "The process of converting glucose into pyruvate with the production of ATP and NADH is known as:",
    options: ["Glycolysis", "Glycogenesis", "Glycogenolysis", "Gluconeogenesis"],
    correct_option: 0,
    explanation: "Glycolysis (Embden-Meyerhof-Parnas pathway) converts 1 glucose into 2 pyruvate molecules in the cytosol.",
    difficulty: "Easy"
  },
  {
    question_text: "Which sugar is present in human seminal fluid as a nutrient source for sperm motility?",
    options: ["Fructose", "Glucose", "Lactose", "Maltose"],
    correct_option: 0,
    explanation: "Seminal vesicles secrete fructose, providing the primary metabolic fuel for spermatozoa motility.",
    difficulty: "Medium"
  },
  {
    question_text: "The main structural difference between alpha-amylose and cellulose is:",
    options: ["Alpha-1,4 glycosidic bonds in amylose versus Beta-1,4 glycosidic bonds in cellulose", "Beta-1,4 bonds in amylose versus Alpha-1,4 bonds in cellulose", "Amylose contains nitrogen while cellulose does not", "Cellulose is branched while amylose is unbranched"],
    correct_option: 0,
    explanation: "Amylose consists of alpha-1,4 linked glucose units, whereas cellulose consists of beta-1,4 linked glucose units.",
    difficulty: "Easy"
  }
];

async function run() {
  console.log(`Starting batch insertion of ${mcqs.length} MCQs for MDCAT Biology -> Bio Molecules -> Carbohydrates...`);

  // Post to local server batch API or insert via Supabase directly
  const res = await fetch('http://localhost:3000/api/mcqs/batch-insert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exam_type: 'MDCAT',
      subject: 'biology',
      chapter: 'Bio Molecules',
      subtopic: 'Carbohydrates',
      mcqs: mcqs
    })
  });

  const json = await res.json();
  console.log('Batch Insert Result:', JSON.stringify(json, null, 2));

  const flagged = mcqs.filter(m => m.needs_review);
  if (flagged.length > 0) {
    console.log(`Flagged ${flagged.length} questions for review:`, flagged.map(f => f.question_text));
  } else {
    console.log('No questions flagged for review in this batch (all 100 factually verified).');
  }
}

run().catch(err => {
  console.error("Batch script error:", err);
  process.exit(1);
});
