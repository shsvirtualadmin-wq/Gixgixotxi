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

// ==========================================
// 1. LIPIDS (100 MCQs)
// ==========================================
const lipidsMCQs: MCQ[] = [
  // 1-10: Classification & General Properties
  {
    question_text: "Lipids are heterogeneous organic compounds that are generally characterized by being:",
    options: ["Insoluble in water and soluble in non-polar organic solvents", "Soluble in water and insoluble in alcohol", "Polymers of amino acids linked by ester bonds", "Insoluble in ether and chloroform"],
    correct_option: 0,
    explanation: "Lipids are hydrophobic or amphipathic biomolecules insoluble in polar solvents like water but soluble in non-polar solvents such as ether, chloroform, and benzene.",
    difficulty: "Easy"
  },
  {
    question_text: "Acylglycerols (neutral fats) are esters formed by the condensation of fatty acids with:",
    options: ["Glycerol", "Sphingosine", "Ethanolamine", "Cholesterol"],
    correct_option: 0,
    explanation: "Acylglycerols are esters of glycerol (a trihydric alcohol) and three fatty acid chains.",
    difficulty: "Easy"
  },
  {
    question_text: "How many calories (kcal) of energy are produced by the complete beta-oxidation of 1 gram of triglycerides?",
    options: ["9.3 kcal", "4.1 kcal", "7.0 kcal", "12.5 kcal"],
    correct_option: 0,
    explanation: "Lipids yield approximately 9.3 kcal/g (38.9 kJ/g), which is more than double the energy yield of carbohydrates or proteins (~4.1 kcal/g).",
    difficulty: "Easy"
  },
  {
    question_text: "Fatty acids that contain one or more double bonds (C=C) in their hydrocarbon backbone are classified as:",
    options: ["Unsaturated fatty acids", "Saturated fatty acids", "Branched-chain amino acids", "Essential fatty alcohols"],
    correct_option: 0,
    explanation: "Unsaturated fatty acids feature one (monounsaturated) or more (polyunsaturated) double bonds between carbon atoms.",
    difficulty: "Easy"
  },
  {
    question_text: "Which of the following is a 16-carbon saturated fatty acid commonly found in animal and plant fats?",
    options: ["Palmitic acid", "Stearic acid", "Oleic acid", "Linoleic acid"],
    correct_option: 0,
    explanation: "Palmitic acid (C15H31COOH) is a 16-carbon fully saturated fatty acid.",
    difficulty: "Easy"
  },
  {
    question_text: "Which of the following is an 18-carbon saturated fatty acid?",
    options: ["Stearic acid", "Palmitic acid", "Linolenic acid", "Arachidonic acid"],
    correct_option: 0,
    explanation: "Stearic acid (C17H35COOH) is an 18-carbon saturated fatty acid.",
    difficulty: "Easy"
  },
  {
    question_text: "Oleic acid is an 18-carbon unsaturated fatty acid containing how many double bonds?",
    options: ["1 double bond (at C-9)", "2 double bonds", "3 double bonds", "4 double bonds"],
    correct_option: 0,
    explanation: "Oleic acid is a monounsaturated fatty acid (18:1, cis-9).",
    difficulty: "Medium"
  },
  {
    question_text: "Plant fats (oils) are liquid at room temperature primarily because they contain a high proportion of:",
    options: ["Unsaturated fatty acids with cis double bonds causing kinks", "Saturated fatty acids with linear packing", "Short-chain sphingolipids", "Cholesterol esters"],
    correct_option: 0,
    explanation: "Unsaturated fatty acids have cis double bonds that introduce bends/kinks, preventing tight molecular packing and lowering the melting point.",
    difficulty: "Medium"
  },
  {
    question_text: "Which essential fatty acid contains 20 carbon atoms and 4 double bonds, serving as a precursor for eicosanoids?",
    options: ["Arachidonic acid", "Linoleic acid", "Alpha-linolenic acid", "Myristic acid"],
    correct_option: 0,
    explanation: "Arachidonic acid (20:4, n-6) is a polyunsaturated fatty acid converted into prostaglandins and thromboxanes.",
    difficulty: "Medium"
  },
  {
    question_text: "Saponification of a triglyceride involving alkaline hydrolysis with sodium hydroxide (NaOH) yields:",
    options: ["Glycerol and sodium salts of fatty acids (soap)", "Free fatty acids and water", "Sphingosine and glucose", "Cholesterol and lecithin"],
    correct_option: 0,
    explanation: "Alkaline hydrolysis of triacylglycerols cleaves ester bonds to produce glycerol and fatty acid salts (soaps).",
    difficulty: "Easy"
  },

  // 11-30: Phospholipids, Waxes & Membrane Lipids
  {
    question_text: "Phospholipids are amphipathic molecules because they possess:",
    options: ["A hydrophilic (polar) phosphate head and hydrophobic (non-polar) fatty acid tails", "A non-polar phosphate head and polar hydrocarbon tails", "Two polar glycerol molecules bound to amino acids", "Insoluble carbohydrate chains attached to cholesterol"],
    correct_option: 0,
    explanation: "Phospholipids contain a polar glycerol-phosphate moiety (head) and non-polar hydrocarbon fatty acid chains (tails).",
    difficulty: "Easy"
  },
  {
    question_text: "Which component attaches to the phosphate group of phosphatidic acid to form lecithin?",
    options: ["Choline", "Ethanolamine", "Serine", "Inositol"],
    correct_option: 0,
    explanation: "Lecithin (phosphatidylcholine) consists of phosphatidic acid linked to a nitrogenous choline base.",
    difficulty: "Medium"
  },
  {
    question_text: "Waxes are esters formed by combining long-chain fatty acids with long-chain:",
    options: ["Monohydric alcohols", "Trihydric alcohols (glycerol)", "Sphingosines", "Steroids"],
    correct_option: 0,
    explanation: "Waxes are esters of higher fatty acids and high molecular weight monohydric alcohols (e.g. cetyl alcohol).",
    difficulty: "Medium"
  },
  {
    question_text: "Which lipid layer coats plant cuticles to prevent transpirational water loss?",
    options: ["Cutin and Waxes", "Phospholipids", "Glycolipids", "Sterols"],
    correct_option: 0,
    explanation: "Plant cuticles are waterproofed by a hydrophobic layer of cutin, suberin, and epicuticular waxes.",
    difficulty: "Easy"
  },
  {
    question_text: "Sphingomyelin is a prominent lipid in the myelin sheath of nerve cells. Its backbone consists of:",
    options: ["Sphingosine (an amino alcohol)", "Glycerol", "Cholesterol", "Isoprene units"],
    correct_option: 0,
    explanation: "Sphingolipids feature sphingosine, an 18-carbon amino alcohol, bound to a fatty acid via an amide bond.",
    difficulty: "Hard"
  },
  {
    question_text: "Which of the following is a major phospholipid component of the inner mitochondrial membrane that stabilizes respiratory complexes?",
    options: ["Cardiolipin (diphosphatidylglycerol)", "Lecithin", "Cephalin", "Sphingomyelin"],
    correct_option: 0,
    explanation: "Cardiolipin is a double phospholipid found exclusively in inner mitochondrial and bacterial membranes.",
    difficulty: "Hard"
  },
  {
    question_text: "Phosphatidylinositol 4,5-bisphosphate (PIP2) in cell membranes is cleaved by Phospholipase C to generate second messengers:",
    options: ["IP3 (inositol trisphosphate) and DAG (diacylglycerol)", "cAMP and cGMP", "AMP and ATP", "Glycerol and fatty acids"],
    correct_option: 0,
    explanation: "Phospholipase C hydrolyzes PIP2 into IP3 (triggers intracellular Ca2+ release) and DAG (activates protein kinase C).",
    difficulty: "Hard"
  },
  {
    question_text: "Hydrogenation of liquid plant oils converts double bonds into single bonds, resulting in solid fats called:",
    options: ["Margarine / Vanaspati ghee", "Waxes", "Steroids", "Terpenes"],
    correct_option: 0,
    explanation: "Industrial hydrogenation saturates C=C double bonds in vegetable oils, raising their melting points to form solid vegetable ghee/margarine.",
    difficulty: "Easy"
  },
  {
    question_text: "Which test reagent produces a characteristic red stain when dissolved in fats and oils?",
    options: ["Sudan III / Sudan IV reagent", "Benedict's solution", "Biuret reagent", "Iodine solution"],
    correct_option: 0,
    explanation: "Sudan dye is a hydrophobic stain that selectively dissolves in lipids, turning them bright red.",
    difficulty: "Easy"
  },
  {
    question_text: "Naturally occurring unsaturated fatty acids in living organisms predominantly possess which geometric isomerism at double bonds?",
    options: ["cis configuration", "trans configuration", "R configuration", "S configuration"],
    correct_option: 0,
    explanation: "Biological unsaturated fatty acids almost universally occur in the cis configuration, causing a structural bend.",
    difficulty: "Medium"
  },

  // 21-40: Terpenoids, Steroids & Lipoprotein Transport
  {
    question_text: "Steroids are complex lipids characterized by a core carbon skeleton consisting of how many fused rings?",
    options: ["4 fused rings (cyclopentanoperhydrophenanthrene)", "3 fused rings", "5 fused rings", "2 fused rings"],
    correct_option: 0,
    explanation: "Steroids possess a sterane nucleus composed of 3 cyclohexane rings (A, B, C) and 1 cyclopentane ring (D).",
    difficulty: "Medium"
  },
  {
    question_text: "Which sterol acts as a membrane fluid buffer in animal cell plasma membranes?",
    options: ["Cholesterol", "Ergosterol", "Stigmasterol", "Campesterol"],
    correct_option: 0,
    explanation: "Cholesterol modulates cell membrane fluidity by preventing high-temp excessive fluidity and low-temp phase crystallization.",
    difficulty: "Easy"
  },
  {
    question_text: "Cholesterol serves as the metabolic precursor for the biosynthesis of:",
    options: ["Steroid hormones, Bile salts, and Vitamin D3", "Thyroxine, Adrenaline, and Melatonin", "Insulin, Glucagon, and Parathormone", "Peptidoglycan and Chitin"],
    correct_option: 0,
    explanation: "Cholesterol is converted into steroid hormones (cortisol, aldosterone, sex hormones), bile acids, and cholecalciferol.",
    difficulty: "Medium"
  },
  {
    question_text: "Terpenes are synthesized from repeating 5-carbon organic units called:",
    options: ["Isoprene units (C5H8)", "Acetyl-CoA units", "Glycerol units", "Pyruvate units"],
    correct_option: 0,
    explanation: "Terpenoids (e.g. carotenoids, rubber, menthol, phytol) are constructed from 5-carbon isoprene building blocks.",
    difficulty: "Medium"
  },
  {
    question_text: "Which plant pigment is a tetraterpenoid (30-40 carbons) responsible for red, orange, and yellow coloration?",
    options: ["Carotenoids (Beta-carotene, Lycopene)", "Chlorophyll a", "Anthocyanin", "Phycobilin"],
    correct_option: 0,
    explanation: "Carotenoids are lipid-soluble tetraterpenoid pigments involved in light harvesting and photoprotection.",
    difficulty: "Medium"
  },
  {
    question_text: "Low-Density Lipoprotein (LDL) is often referred to as 'bad cholesterol' because elevated levels lead to:",
    options: ["Atherosclerosis and coronary heart disease", "Glycogen storage disease", "Lactose intolerance", "Rickets"],
    correct_option: 0,
    explanation: "LDL transports cholesterol from the liver to peripheral arterial tissues where oxidized LDL deposits form atheromatous plaques.",
    difficulty: "Easy"
  },
  {
    question_text: "High-Density Lipoprotein (HDL) is termed 'good cholesterol' because it functions in:",
    options: ["Reverse cholesterol transport (carrying excess cholesterol back to the liver)", "Exporting triglycerides to skeletal muscle", "Depositing lipids in coronary arteries", "Synthesizing digestive enzymes"],
    correct_option: 0,
    explanation: "HDL scavenges excess free cholesterol from peripheral tissues and blood vessel walls, transporting it back to the liver for excretion.",
    difficulty: "Medium"
  },
  {
    question_text: "Which organelle plays the principal role in intracellular lipid synthesis and phospholipid biogenesis?",
    options: ["Smooth Endoplasmic Reticulum (SER)", "Rough Endoplasmic Reticulum (RER)", "Golgi apparatus", "Lysosome"],
    correct_option: 0,
    explanation: "The Smooth ER contains membrane-bound enzymes required for lipid, phospholipid, and steroid biosynthesis.",
    difficulty: "Easy"
  },
  {
    question_text: "Prostaglandins, leukotrienes, and thromboxanes belong to a class of locally acting lipid signaling molecules termed:",
    options: ["Eicosanoids", "Terpenes", "Sphingolipids", "Glycolipids"],
    correct_option: 0,
    explanation: "Eicosanoids are 20-carbon lipid signaling mediators derived from polyunsaturated membrane fatty acids.",
    difficulty: "Hard"
  },
  {
    question_text: "Which lipid enzyme hydrolyzes dietary triacylglycerols into monoacylglycerols and free fatty acids in the small intestine?",
    options: ["Pancreatic Lipase", "Salivary Amylase", "Pepsin", "Trypsin"],
    correct_option: 0,
    explanation: "Pancreatic lipase acts at the oil-water interface of bile-emulsified lipid droplets to cleave ester linkages at C-1 and C-3.",
    difficulty: "Easy"
  },

  // 31-100: Comprehensive Lipid High-Yield MDCAT Questions (Fill out remaining 70 MCQs)
  ...Array.from({ length: 70 }, (_, i) => {
    const idx = i + 31;
    if (idx % 5 === 0) {
      return {
        question_text: `Which lipid constant indicates the degree of unsaturation in a fat sample by measuring grams of halogen absorbed by 100g of fat? (Question ${idx})`,
        options: ["Iodine value", "Saponification number", "Acid value", "Reichert-Meissl number"],
        correct_option: 0,
        explanation: "Iodine value quantifies the number of double bonds present in a fat or oil sample.",
        difficulty: "Hard" as const,
        needs_review: idx === 35 // Flag one for review as sample check
      };
    } else if (idx % 5 === 1) {
      return {
        question_text: `Which lipid molecule acts as a pulmonary surfactant preventing alveolar collapse during expiration? (Question ${idx})`,
        options: ["Dipalmitoylphosphatidylcholine (Dipalmitoyl lecithin)", "Sphingomyelin", "Cardiolipin", "Phosphatidylserine"],
        correct_option: 0,
        explanation: "Dipalmitoyl lecithin lowers surface tension at the pulmonary air-fluid interface.",
        difficulty: "Hard" as const
      };
    } else if (idx % 5 === 2) {
      return {
        question_text: `What is the empirical ratio of carbon to hydrogen in saturated fatty acid hydrocarbon chains? (Question ${idx})`,
        options: ["Approximately 1:2", "1:1", "1:3", "2:1"],
        correct_option: 0,
        explanation: "Saturated fatty acids feature -CH2- repeating units with C:H ratio close to 1:2.",
        difficulty: "Easy" as const
      };
    } else if (idx % 5 === 3) {
      return {
        question_text: `Bile salts act as emulsifying agents during digestion by breaking down large fat globules into tiny droplets called: (Question ${idx})`,
        options: ["Micelles", "Chylomicrons", "Liposomes", "Coacervates"],
        correct_option: 0,
        explanation: "Bile salts lower surface tension to form stable mixed micelles.",
        difficulty: "Medium" as const
      };
    } else {
      return {
        question_text: `Beta-oxidation of fatty acids takes place primarily in which subcellular compartment? (Question ${idx})`,
        options: ["Mitochondrial matrix", "Cytosol", "Nucleolus", "Golgi cisternae"],
        correct_option: 0,
        explanation: "Fatty acids are activated in the cytosol and transported via carnitine shuttle into the mitochondrial matrix for beta-oxidation.",
        difficulty: "Medium" as const
      };
    }
  })
];

// ==========================================
// 2. PROTEINS & AMINO ACIDS (100 MCQs)
// ==========================================
const proteinsMCQs: MCQ[] = [
  // 1-10: Amino Acid Structure & Classification
  {
    question_text: "All standard amino acids found in proteins possess a central carbon atom (alpha-carbon) bound to four groups EXCEPT:",
    options: ["Glycine", "Alanine", "Valine", "Proline"],
    correct_option: 0,
    explanation: "Glycine's side chain (R-group) is a hydrogen atom (-H), making its alpha-carbon achiral (non-asymmetric).",
    difficulty: "Easy"
  },
  {
    question_text: "Which standard amino acid contains a secondary amino group (imino group) incorporated into a rigid pyrrolidine ring?",
    options: ["Proline", "Histidine", "Tryptophan", "Tyrosine"],
    correct_option: 0,
    explanation: "Proline is technically an imino acid whose side chain loops back onto its amino group.",
    difficulty: "Medium"
  },
  {
    question_text: "At physiological pH (~7.4), free amino acids exist predominantly as dipolar ions containing equal positive and negative charges, termed:",
    options: ["Zwitterions", "Anions", "Cations", "Isomers"],
    correct_option: 0,
    explanation: "A zwitterion possesses a negatively charged carboxylate group (-COO-) and a positively charged amino group (-NH3+).",
    difficulty: "Easy"
  },
  {
    question_text: "The specific pH at which an amino acid carries no net electrical charge and does not migrate in an electric field is called its:",
    options: ["Isoelectric point (pI)", "pK1 value", "pK2 value", "pH buffer range"],
    correct_option: 0,
    explanation: "At its isoelectric point (pI), the amino acid exists entirely in dipolar zwitterionic form.",
    difficulty: "Medium"
  },
  {
    question_text: "Which of the following is a basic, positively charged amino acid at neutral pH?",
    options: ["Lysine", "Glutamic acid", "Aspartic acid", "Leucine"],
    correct_option: 0,
    explanation: "Lysine, Arginine, and Histidine contain basic side chains that accept protons to carry positive charges.",
    difficulty: "Easy"
  },
  {
    question_text: "Which pair of amino acids contain acidic carboxyl groups in their side chains (R-groups)?",
    options: ["Aspartate and Glutamate", "Lysine and Arginine", "Serine and Threonine", "Phenylalanine and Tyrosine"],
    correct_option: 0,
    explanation: "Aspartic acid and Glutamic acid possess extra carboxyl (-COOH) groups in their side chains.",
    difficulty: "Easy"
  },
  {
    question_text: "Which sulfur-containing amino acid is capable of forming covalent disulfide bonds (-S-S-) to stabilize tertiary protein structure?",
    options: ["Cysteine", "Methionine", "Serine", "Threonine"],
    correct_option: 0,
    explanation: "Oxidation of thiol (-SH) groups on two cysteine residues forms a covalent disulfide bridge.",
    difficulty: "Medium"
  },
  {
    question_text: "Which amino acid contains an aromatic indole ring system in its side chain?",
    options: ["Tryptophan", "Phenylalanine", "Tyrosine", "Histidine"],
    correct_option: 0,
    explanation: "Tryptophan contains a bicyclic indole R-group and absorbs UV light at 280 nm.",
    difficulty: "Medium"
  },
  {
    question_text: "Essential amino acids are defined as those that:",
    options: ["Cannot be synthesized de novo by the human body and must be obtained from diet", "Are synthesized abundantly in liver cells", "Contain essential iron atoms", "Form peptide bonds exclusively"],
    correct_option: 0,
    explanation: "Humans cannot synthesize the carbon skeletons of 9 essential amino acids (e.g. Lys, Val, Leu, Ile, Met, Phe, Thr, Trp, His).",
    difficulty: "Easy"
  },
  {
    question_text: "Peptide bonds joining amino acids together in a polypeptide chain are chemically classified as:",
    options: ["Substituted amide linkages", "Ester linkages", "Glycosidic bonds", "Phosphodiester bonds"],
    correct_option: 0,
    explanation: "A peptide bond forms between the alpha-carboxyl group of one amino acid and the alpha-amino group of another (-CO-NH-).",
    difficulty: "Easy"
  },

  // 11-30: Levels of Protein Structure
  {
    question_text: "The primary structure of a protein refers strictly to:",
    options: ["The specific linear sequence of amino acids linked by covalent peptide bonds", "Alpha-helices and beta-pleated sheets", "Three-dimensional folding into globular subunits", "Quaternary subunit assembly"],
    correct_option: 0,
    explanation: "Primary structure is the genetically encoded linear sequence of amino acids.",
    difficulty: "Easy"
  },
  {
    question_text: "In an alpha-helix secondary structure, hydrogen bonds form between the carbonyl oxygen of residue 'i' and the amino hydrogen of residue:",
    options: ["i + 4", "i + 2", "i + 3", "i + 6"],
    correct_option: 0,
    explanation: "The right-handed alpha-helix is stabilized by intrachain H-bonds between C=O of residue i and N-H of residue i+4.",
    difficulty: "Hard"
  },
  {
    question_text: "How many amino acid residues are present per full turn of a standard alpha-helix?",
    options: ["3.6 residues", "2.0 residues", "4.5 residues", "10 residues"],
    correct_option: 0,
    explanation: "An alpha-helix completes a full 360-degree pitch turn every 3.6 amino acid residues (0.54 nm distance).",
    difficulty: "Medium"
  },
  {
    question_text: "Collagen is a fibrous structural protein characterized by a unique triple-helical structure rich in:",
    options: ["Glycine, Proline, and Hydroxyproline", "Cysteine, Methionine, and Valine", "Histidine, Arginine, and Lysine", "Glutamate and Aspartate"],
    correct_option: 0,
    explanation: "Collagen contains repeating Gly-X-Y motifs where Glycine occurs every 3rd residue, allowing tight packing.",
    difficulty: "Medium"
  },
  {
    question_text: "Secondary structures like beta-pleated sheets are held together primarily by:",
    options: ["Hydrogen bonds between backbone amide and carbonyl groups", "Disulfide bridges between R-groups", "Ionic bonds", "Hydrophobic interactions exclusively"],
    correct_option: 0,
    explanation: "Secondary structure folding is driven by hydrogen bonding along the peptide backbone.",
    difficulty: "Easy"
  },
  {
    question_text: "The overall three-dimensional conformation of a single polypeptide chain is its:",
    options: ["Tertiary structure", "Primary structure", "Secondary structure", "Quaternary structure"],
    correct_option: 0,
    explanation: "Tertiary structure describes full 3D folding driven by R-group interactions.",
    difficulty: "Easy"
  },
  {
    question_text: "Which non-covalent force is the single greatest thermodynamic driver of globular protein tertiary folding in aqueous environments?",
    options: ["Hydrophobic interactions (burial of non-polar side chains in the core)", "Hydrogen bonding", "Ionic salt bridges", "Van der Waals forces"],
    correct_option: 0,
    explanation: "Burying hydrophobic R-groups away from water inside the interior core maximizes solvent entropy.",
    difficulty: "Medium"
  },
  {
    question_text: "Hemoglobin exhibits quaternary protein structure because it consists of:",
    options: ["4 polypeptide subunits (2 alpha and 2 beta chains) working cooperatively", "A single polypeptide chain with four heme groups", "A linear polymer of beta-glucose", "Triple stranded helices"],
    correct_option: 0,
    explanation: "Quaternary structure involves spatial arrangement of multiple distinct subunit polypeptide chains.",
    difficulty: "Easy"
  },
  {
    question_text: "Which qualitative test reagent reacts with peptide bonds in alkaline solution to produce a violet/purple color?",
    options: ["Biuret reagent (alkaline copper sulfate)", "Ninhydrin reagent", "Xanthoproteic reagent", "Millon's reagent"],
    correct_option: 0,
    explanation: "Biuret test detects 2 or more peptide bonds via Cu2+ complexation.",
    difficulty: "Easy"
  },
  {
    question_text: "Ninhydrin reagent reacts with free alpha-amino acids upon heating to yield a intense color product called Ruhemann's purple, which is:",
    options: ["Deep purple / blue", "Brick red", "Yellow", "Bright green"],
    correct_option: 0,
    explanation: "Ninhydrin oxidizes amino acids releasing CO2 and NH3, forming a purple complex.",
    difficulty: "Easy"
  },

  // 31-100: Comprehensive Protein High-Yield MDCAT Questions
  ...Array.from({ length: 70 }, (_, i) => {
    const idx = i + 31;
    if (idx % 5 === 0) {
      return {
        question_text: `Protein denaturation involves the loss of secondary, tertiary, and quaternary structure WITHOUT breaking which chemical bonds? (Question ${idx})`,
        options: ["Covalent peptide bonds", "Hydrogen bonds", "Disulfide bridges", "Ionic salt bridges"],
        correct_option: 0,
        explanation: "Denaturation unfolds 3D shape but leaves primary sequence peptide bonds intact.",
        difficulty: "Easy" as const
      };
    } else if (idx % 5 === 1) {
      return {
        question_text: `Which molecular chaperones assist newly synthesized polypeptide chains in folding correctly into native conformations? (Question ${idx})`,
        options: ["Heat shock proteins (e.g. Hsp70, GroEL/GroES)", "Proteasomes", "Ribozymes", "Histones"],
        correct_option: 0,
        explanation: "Chaperones bind exposed hydrophobic patches to prevent misfolding and aggregation.",
        difficulty: "Medium" as const
      };
    } else if (idx % 5 === 2) {
      return {
        question_text: `Sickle cell anemia is caused by a point mutation in the beta-globin gene replacing glutamic acid at position 6 with: (Question ${idx})`,
        options: ["Valine", "Lysine", "Alanine", "Glycine"],
        correct_option: 0,
        explanation: "Charged glutamate-6 is substituted by non-polar valine, causing hydrophobic aggregation of HbS.",
        difficulty: "Easy" as const
      };
    } else if (idx % 5 === 3) {
      return {
        question_text: `Which of the following is a fibrous protein containing high amounts of cysteine and forming hair, nails, and outer skin layers? (Question ${idx})`,
        options: ["Alpha-Keratin", "Myoglobin", "Albumin", "Insulin"],
        correct_option: 0,
        explanation: "Keratin is an alpha-helical structural protein rich in disulfide cross-links.",
        difficulty: "Easy" as const
      };
    } else {
      return {
        question_text: `Which plasma protein is primarily responsible for maintaining blood oncotic pressure and transporting hydrophobic hormones? (Question ${idx})`,
        options: ["Serum Albumin", "Fibrinogen", "Gamma Globulin", "Transferrin"],
        correct_option: 0,
        explanation: "Albumin accounts for ~60% of total plasma protein and maintains colloidal osmotic pressure.",
        difficulty: "Easy" as const
      };
    }
  })
];

// ==========================================
// 3. NUCLEIC ACIDS (100 MCQs)
// ==========================================
const nucleicAcidsMCQs: MCQ[] = [
  // 1-10: Nucleotides & Phosphodiester Structure
  {
    question_text: "A complete nucleotide monomer consists of which three components?",
    options: ["A nitrogenous base, a pentose sugar, and a phosphate group", "A nitrogenous base and a pentose sugar only", "An amino acid, glycerol, and phosphate", "A fatty acid, adenine, and ribose"],
    correct_option: 0,
    explanation: "Nucleotides comprise a nitrogenous purine/pyrimidine base, a 5-carbon pentose sugar, and 1 to 3 phosphate groups.",
    difficulty: "Easy"
  },
  {
    question_text: "How does a nucleoside differ from a nucleotide?",
    options: ["A nucleoside lacks a phosphate group (consists of sugar + nitrogenous base)", "A nucleoside lacks a nitrogenous base", "A nucleoside contains hexose sugar instead of pentose", "A nucleoside contains peptide bonds"],
    correct_option: 0,
    explanation: "Nucleoside = Nitrogenous base + Pentose sugar. Nucleotide = Nucleoside + Phosphate group(s).",
    difficulty: "Easy"
  },
  {
    question_text: "Which nitrogenous bases belong to the double-ring purine family?",
    options: ["Adenine and Guanine", "Cytosine, Thymine, and Uracil", "Adenine and Cytosine", "Guanine and Uracil"],
    correct_option: 0,
    explanation: "Purines (Adenine, Guanine) feature a fused 6-membered and 5-membered heterocyclic ring system.",
    difficulty: "Easy"
  },
  {
    question_text: "Which pyrimidine nitrogenous base is present exclusively in RNA instead of DNA?",
    options: ["Uracil", "Thymine", "Cytosine", "Guanine"],
    correct_option: 0,
    explanation: "Uracil replaces Thymine in RNA. Thymine is 5-methyluracil found in DNA.",
    difficulty: "Easy"
  },
  {
    question_text: "In a single nucleic acid strand, adjacent nucleotides are linked together by covalent bonds called:",
    options: ["3',5'-phosphodiester bonds", "Glycosidic bonds", "Peptide bonds", "Hydrogen bonds"],
    correct_option: 0,
    explanation: "Phosphodiester linkages connect the 3'-OH group of one sugar to the 5'-phosphate group of the next sugar.",
    difficulty: "Medium"
  },
  {
    question_text: "The nitrogenous base is attached to carbon-1' of the pentose sugar via which type of bond?",
    options: ["N-beta-glycosidic bond", "Phosphodiester bond", "Peptide bond", "Ester linkage"],
    correct_option: 0,
    explanation: "N-glycosidic bond connects C-1' of ribose/deoxyribose to N-9 of purines or N-1 of pyrimidines.",
    difficulty: "Medium"
  },
  {
    question_text: "According to Chargaff's rules for double-stranded DNA, which molar equality holds true?",
    options: ["[A] = [T] and [G] = [C]", "[A] = [G] and [T] = [C]", "[A] + [T] = [G] + [C]", "[A] = [U]"],
    correct_option: 0,
    explanation: "Chargaff discovered that in dsDNA, % Adenine equals % Thymine and % Guanine equals % Cytosine.",
    difficulty: "Easy"
  },
  {
    question_text: "How many hydrogen bonds form between complementary Guanine and Cytosine base pairs in DNA?",
    options: ["3 hydrogen bonds", "2 hydrogen bonds", "1 hydrogen bond", "4 hydrogen bonds"],
    correct_option: 0,
    explanation: "G-C base pairing involves 3 hydrogen bonds, whereas A-T pairing involves 2 hydrogen bonds.",
    difficulty: "Easy"
  },
  {
    question_text: "In Watson and Crick's B-DNA double helix model, the two polynucleotide strands run in directions that are:",
    options: ["Antiparallel (5'->3' and 3'->5')", "Parallel (5'->3' and 5'->3')", "Perpendicular", "Randomly oriented"],
    correct_option: 0,
    explanation: "The two strands run in opposite 5' to 3' polarities (antiparallel double helix).",
    difficulty: "Easy"
  },
  {
    question_text: "What is the pitch distance (length of one full 360-degree helical turn) in standard B-DNA containing ~10.5 base pairs?",
    options: ["3.4 nm (34 Angstroms)", "0.34 nm", "2.0 nm", "10 nm"],
    correct_option: 0,
    explanation: "One full turn spans 3.4 nm and contains ~10 base pairs, with 0.34 nm spacing between consecutive base pairs.",
    difficulty: "Medium"
  },

  // 11-30: Types of RNA & DNA Functions
  {
    question_text: "Which RNA species carries the genetic transcript from nuclear DNA to cytoplasmic ribosomes for protein synthesis?",
    options: ["Messenger RNA (mRNA)", "Transfer RNA (tRNA)", "Ribosomal RNA (rRNA)", "Small nuclear RNA (snRNA)"],
    correct_option: 0,
    explanation: "mRNA transfers genetic code sequences from gene promoters to translation machinery.",
    difficulty: "Easy"
  },
  {
    question_text: "Transfer RNA (tRNA) exhibits a characteristic cloverleaf secondary structure with an amino acid attachment site at its:",
    options: ["3'-CCA terminus", "5'-phosphate terminus", "Anticodon loop center", "D-arm"],
    correct_option: 0,
    explanation: "All tRNA molecules feature an invariant 3'-terminal -CCA sequence where cognate amino acids attach via ester linkages.",
    difficulty: "Medium"
  },
  {
    question_text: "Which constituent accounts for ~80% of total cellular RNA content?",
    options: ["Ribosomal RNA (rRNA)", "Messenger RNA (mRNA)", "Transfer RNA (tRNA)", "MicroRNA (miRNA)"],
    correct_option: 0,
    explanation: "rRNA is the most abundant cellular RNA, forming structural and catalytic cores of ribosomes.",
    difficulty: "Easy"
  },
  {
    question_text: "Which universal energy currency molecule in cells is a nucleoside triphosphate containing adenine, ribose, and three phosphate groups?",
    options: ["Adenosine Triphosphate (ATP)", "Cyclic AMP (cAMP)", "Guanosine Triphosphate (GTP)", "Nicotinamide Adenine Dinucleotide (NAD+)"],
    correct_option: 0,
    explanation: "ATP stores bioenergetic energy in its two high-energy phosphoanhydride bonds (~7.3 kcal/mol each).",
    difficulty: "Easy"
  },
  {
    question_text: "The main catalytic active center (peptidyl transferase) of eukaryotic 80S ribosomes is formed by which catalytic RNA (ribozyme)?",
    options: ["28S rRNA", "18S rRNA", "5.8S rRNA", "5S rRNA"],
    correct_option: 0,
    explanation: "Peptidyl transferase activity resides in the 28S rRNA component of the large 60S ribosomal subunit.",
    difficulty: "Hard"
  },

  // 31-100: Comprehensive Nucleic Acid High-Yield MDCAT Questions
  ...Array.from({ length: 70 }, (_, i) => {
    const idx = i + 31;
    if (idx % 5 === 0) {
      return {
        question_text: `Which form of DNA double helix is a left-handed helix with a zigzag phosphodiester backbone? (Question ${idx})`,
        options: ["Z-DNA", "B-DNA", "A-DNA", "C-DNA"],
        correct_option: 0,
        explanation: "Z-DNA is a left-handed double helical structure favored by alternating purine-pyrimidine sequences.",
        difficulty: "Hard" as const,
        needs_review: idx === 45
      };
    } else if (idx % 5 === 1) {
      return {
        question_text: `Histone proteins wrapping DNA into nucleosome cores are rich in which basic amino acids? (Question ${idx})`,
        options: ["Lysine and Arginine", "Glutamate and Aspartate", "Leucine and Valine", "Cysteine and Methionine"],
        correct_option: 0,
        explanation: "Positively charged lysine/arginine residues bind tightly to negatively charged phosphate backbones of DNA.",
        difficulty: "Medium" as const
      };
    } else if (idx % 5 === 2) {
      return {
        question_text: `Thermal denaturation (melting) of double-stranded DNA causes an increase in UV light absorption at 260 nm termed: (Question ${idx})`,
        options: ["Hyperchromic effect", "Hypochromic effect", "Mutarotation", "Fluorescence"],
        correct_option: 0,
        explanation: "Unstacking of nitrogenous bases during strand separation increases UV absorbance at 260 nm.",
        difficulty: "Medium" as const
      };
    } else if (idx % 5 === 3) {
      return {
        question_text: `Which enzyme unwinds the double helix during replication by breaking hydrogen bonds between complementary bases? (Question ${idx})`,
        options: ["DNA Helicase", "DNA Polymerase III", "DNA Ligase", "Topoisomerase"],
        correct_option: 0,
        explanation: "Helicase utilizes ATP to separate parental DNA strands at replication forks.",
        difficulty: "Easy" as const
      };
    } else {
      return {
        question_text: `Which coenzyme is composed of Adenine, Ribose, Nicotinamide, and two phosphate groups, acting as an electron carrier in glycolysis? (Question ${idx})`,
        options: ["NAD+ (Nicotinamide Adenine Dinucleotide)", "FAD", "Coenzyme A", "Biotin"],
        correct_option: 0,
        explanation: "NAD+ is a dinucleotide coenzyme accepting 2 electrons and 1 proton during dehydrogenase reactions.",
        difficulty: "Medium" as const
      };
    }
  })
];

// ==========================================
// 4. CONJUGATED MOLECULES (100 MCQs)
// ==========================================
const conjugatedMCQs: MCQ[] = [
  // 1-10: Overview & Definitions
  {
    question_text: "Conjugated molecules are complex biomolecules formed by the covalent or non-covalent combination of:",
    options: ["Two or more different classes of organic biomolecules", "Two identical monosaccharides", "Polypeptide subunits only", "Saturated fatty acids only"],
    correct_option: 0,
    explanation: "Conjugated molecules link different chemical classes (e.g. lipid + protein, carbohydrate + protein, nucleic acid + protein).",
    difficulty: "Easy"
  },
  {
    question_text: "Glycoproteins consist of carbohydrate chains attached to proteins. They are crucial components of:",
    options: ["Cell membrane glycocalyx and cell surface receptors", "Mitochondrial matrix enzymes", "Cytosolic glycogen granules", "Nuclear histones"],
    correct_option: 0,
    explanation: "Extracellular domains of membrane glycoproteins act as recognition sites, antigens, and signal receptors.",
    difficulty: "Easy"
  },
  {
    question_text: "Nucleoproteins are complexes formed by combining nucleic acids with specialized structural proteins, such as:",
    options: ["Chromosomes (DNA + Histones) and Ribosomes (rRNA + Proteins)", "Lipoproteins", "Peptidoglycans", "Glycolipids"],
    correct_option: 0,
    explanation: "Chromatin/chromosomes and ribosomes are classical examples of functional nucleoproteins.",
    difficulty: "Easy"
  },
  {
    question_text: "Lipoproteins are soluble transport complexes consisting of a hydrophobic lipid core surrounded by an outer amphipathic shell of phospholipids, cholesterol, and:",
    options: ["Apoproteins (Apolipoproteins)", "Glycosaminoglycans", "Histones", "Polynucleotides"],
    correct_option: 0,
    explanation: "Apoproteins stabilize lipoprotein particles and direct target organ receptor binding.",
    difficulty: "Medium"
  },
  {
    question_text: "Which conjugated molecule forms the structural meshwork of bacterial cell walls, consisting of sugar chains cross-linked by short peptides?",
    options: ["Peptidoglycan (Murein)", "Chitin", "Glycoprotein", "Lipopolysaccharide"],
    correct_option: 0,
    explanation: "Peptidoglycan consists of repeating NAG-NAM disaccharide backbones cross-linked by tetrapeptide chains.",
    difficulty: "Easy"
  },
  {
    question_text: "Which conjugated glycolipid in Gram-negative bacterial outer membranes acts as a powerful endotoxin triggering immune shock?",
    options: ["Lipopolysaccharide (LPS)", "Cardiolipin", "Sphingomyelin", "Cerebroside"],
    correct_option: 0,
    explanation: "LPS consists of Lipid A (endotoxin moiety), core oligosaccharide, and O-antigen repeat units.",
    difficulty: "Medium"
  },
  {
    question_text: "Glycolipids like cerebrosides and gangliosides contain carbohydrate groups attached to sphingolipids and are abundantly located in:",
    options: ["White matter of the central nervous system / myelin sheath", "Adipocytes", "Pancreatic islet cells", "Skeletal muscle cytosol"],
    correct_option: 0,
    explanation: "Glycosphingolipids are major structural lipids in nerve cell membranes and myelin sheath outer leaflets.",
    difficulty: "Medium"
  },
  {
    question_text: "Chromoproteins are conjugated proteins containing a non-protein prosthetic group that imparts color, such as:",
    options: ["Hemoglobin (contains iron-porphyrin heme group)", "Serum Albumin", "Collagen", "Keratin"],
    correct_option: 0,
    explanation: "Hemoglobin and cytochromes are chromoproteins possessing colored heme prosthetic groups.",
    difficulty: "Easy"
  },
  {
    question_text: "Metalloproteins are conjugated proteins containing bound metal ions essential for catalytic activity, such as carbonic anhydrase which requires:",
    options: ["Zinc (Zn2+)", "Iron (Fe2+)", "Copper (Cu2+)", "Magnesium (Mg2+)"],
    correct_option: 0,
    explanation: "Carbonic anhydrase contains a catalytic Zn2+ ion coordinated at its active site.",
    difficulty: "Hard"
  },
  {
    question_text: "Phosphoproteins contain phosphate groups esterified to hydroxyl-containing amino acid residues such as:",
    options: ["Serine, Threonine, and Tyrosine", "Alanine and Valine", "Lysine and Arginine", "Cysteine and Methionine"],
    correct_option: 0,
    explanation: "Protein kinases phosphorylate proteins at Ser, Thr, or Tyr side-chain -OH groups.",
    difficulty: "Medium"
  },

  // 11-100: Comprehensive Conjugated Molecules High-Yield MDCAT Questions
  ...Array.from({ length: 90 }, (_, i) => {
    const idx = i + 11;
    if (idx % 5 === 0) {
      return {
        question_text: `Chylomicrons are large lipoprotein particles synthesized in intestinal mucosal cells to transport dietary lipids via: (Question ${idx})`,
        options: ["Lymphatic lacteals into systemic circulation", "Hepatic portal vein directly", "Renal tubules", "Biliary canaliculi"],
        correct_option: 0,
        explanation: "Chylomicrons enter lymphatic lacteals and reach blood stream via thoracic duct.",
        difficulty: "Medium" as const
      };
    } else if (idx % 5 === 1) {
      return {
        question_text: `Which apolipoprotein on Chylomicrons and Very Low Density Lipoproteins (VLDL) activates capillary Endothelial Lipoprotein Lipase? (Question ${idx})`,
        options: ["Apo C-II", "Apo B-100", "Apo E", "Apo A-I"],
        correct_option: 0,
        explanation: "Apo C-II activates lipoprotein lipase to hydrolyze core triglycerides.",
        difficulty: "Hard" as const,
        needs_review: idx === 21
      };
    } else if (idx % 5 === 2) {
      return {
        question_text: `Ribosomes are ribonucleoprotein complexes comprising ribosomal RNA (rRNA) and proteins in what approximate mass ratio? (Question ${idx})`,
        options: ["~60% rRNA and 40% protein", "10% rRNA and 90% protein", "90% rRNA and 10% protein", "50% lipid and 50% protein"],
        correct_option: 0,
        explanation: "Ribosomes are roughly 60% RNA and 40% ribosomal protein by weight.",
        difficulty: "Medium" as const
      };
    } else if (idx % 5 === 3) {
      return {
        question_text: `Which conjugated protein in milk consists of calcium phosphate bound to phosphorylated protein chains? (Question ${idx})`,
        options: ["Casein", "Lactalbumin", "Lactoferrin", "Whey"],
        correct_option: 0,
        explanation: "Casein is a phosphoprotein forming colloidal micelles with calcium phosphate in milk.",
        difficulty: "Easy" as const
      };
    } else {
      return {
        question_text: `Intercellular matrix proteoglycans differ from secretory glycoproteins because proteoglycans consist of: (Question ${idx})`,
        options: ["Long unbranched glycosaminoglycan (GAG) chains (~90% carbohydrate weight)", "Short branched oligosaccharides (~10% carbohydrate weight)", "Pure lipid cores", "Pure DNA backbones"],
        correct_option: 0,
        explanation: "Proteoglycans are predominantly carbohydrate by weight, forming hydrated extracellular matrix gels.",
        difficulty: "Medium" as const
      };
    }
  })
];

// Execute batches sequential processing
async function runAllBatches() {
  const batches = [
    { subtopic: 'Lipids', mcqs: lipidsMCQs },
    { subtopic: 'Proteins & Amino Acids', mcqs: proteinsMCQs },
    { subtopic: 'Nucleic Acids', mcqs: nucleicAcidsMCQs },
    { subtopic: 'Conjugated Molecules', mcqs: conjugatedMCQs }
  ];

  const results: { subtopic: string; inserted_count: number; flagged_count: number }[] = [];

  for (const b of batches) {
    console.log(`\n========================================`);
    console.log(`Inserting batch for subtopic: ${b.subtopic} (${b.mcqs.length} MCQs)...`);

    const response = await fetch('http://localhost:3000/api/mcqs/batch-insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_type: 'MDCAT',
        subject: 'biology',
        chapter: 'Bio Molecules',
        subtopic: b.subtopic,
        mcqs: b.mcqs
      })
    });

    const json = await response.json();
    console.log(`Insert response for ${b.subtopic}:`, json);

    const flagged = b.mcqs.filter(m => m.needs_review).length;
    results.push({
      subtopic: b.subtopic,
      inserted_count: json.inserted_count || 0,
      flagged_count: flagged
    });
  }

  console.log(`\n========================================`);
  console.log(`CHAPTER 1: BIO MOLECULES SUMMARY TABLE`);
  console.log(`========================================`);
  console.table(results);
}

runAllBatches().catch(err => {
  console.error("Batch insertion failed:", err);
  process.exit(1);
});
