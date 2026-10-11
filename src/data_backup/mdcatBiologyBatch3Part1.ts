import { Question } from '../types';

export const MDCAT_BIOLOGY_BATCH3_PART1: Question[] = [
  // --- Biotechnology (9 MCQs: 3 Easy, 3 Medium, 3 Hard) ---
  {
    id: 'mdcat-b3-bio-1',
    q: 'Which molecular enzyme is used in genetic engineering to covalently join the phosphodiester backbones of DNA fragments with cohesive sticky ends?',
    options: ['DNA ligase', 'DNA polymerase I', 'Restriction endonuclease', 'Reverse transcriptase'],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'DNA ligase catalyzes the synthesis of phosphodiester bonds between adjacent 3\'-OH and 5\'-phosphate groups, sealing nicks and joining DNA fragments.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-2',
    q: 'In polymerase chain reaction (PCR), what is the primary reason why Taq polymerase from Thermus aquaticus is utilized?',
    options: [
      'It is thermostable and does not denature during the 94–96 °C DNA strand separation step',
      'It synthesizes RNA primers de novo',
      'It possesses high-fidelity 3\' to 5\' exonuclease proofreading activity',
      'It operates optimally at room temperature (25 °C)'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Taq polymerase is an extremophile enzyme that withstands repetitive high-temperature denaturation cycles (95 °C) without losing enzymatic activity.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-3',
    q: 'What is a recombinant DNA molecule?',
    options: [
      'A DNA molecule created by combining genetic material from two different biological sources in vitro',
      'A native plasmid extracted directly from wild-type Escherichia coli',
      'A single-stranded RNA molecule undergoing reverse transcription',
      'A fragment of chromosomal DNA degraded by exonucleases'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Recombinant DNA (rDNA) is constructed laboratory-wide by ligating a gene of interest from a donor organism into a suitable cloning vector (e.g., plasmid).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-4',
    q: 'In agarose gel electrophoresis of DNA, what factor determines the migration rate of linear double-stranded DNA fragments towards the positive anode?',
    options: [
      'Fragment length (base pairs); smaller fragments migrate faster through gel pores due to uniform negative charge-to-mass ratio',
      'Base composition; fragments with higher GC content migrate faster',
      'Charge alone; positively charged DNA molecules migrate towards the cathode',
      'Tertiary folding of DNA irrespective of molecular weight'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Because DNA has a constant negative charge-to-mass ratio (from phosphate backbones), sieving by the agarose polymer matrix separates fragments strictly on the basis of molecular size (base pairs).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-5',
    q: 'What is the biological function of restriction endonucleases in their native bacterial host cells?',
    options: [
      'To cleave and degrade foreign bacteriophage DNA, conferring bacterial immunity',
      'To replicate bacterial genomic DNA prior to binary fission',
      'To repair pyrimidine dimers caused by ultraviolet irradiation',
      'To translate messenger RNA into antimicrobial peptides'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Bacteria use restriction enzymes to destroy invading viral (bacteriophage) DNA by cleaving specific palindromic recognition sequences, protecting their own genome via DNA methylation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-6',
    q: 'In Sanger dideoxy sequencing, what structural feature of 2\',3\'-dideoxynucleotide triphosphates (ddNTPs) causes termination of DNA strand elongation?',
    options: [
      'Lack of a 3\'-OH group required for nucleophilic attack on the next incoming dNTP α-phosphate',
      'Presence of an extra phosphate group at the 2\' position',
      'Removal of the purine or pyrimidine nitrogenous base',
      'Inability to form Watson-Crick hydrogen bonds with the template'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'ddNTPs lack the 3\'-hydroxyl (-OH) group on the ribose ring. When incorporated by DNA polymerase, no phosphodiester bond can be formed with subsequent nucleotides, halting chain elongation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-7',
    q: 'In blue-white screening of bacterial transformants using pUC plasmids containing the lacZ gene, what does the formation of white colonies signify?',
    options: [
      'Successful insertion of foreign DNA into the multiple cloning site, disrupting the lacZ α-peptide and preventing β-galactosidase activity',
      'Recircularization of the non-recombinant plasmid expressing active β-galactosidase',
      'Failure of bacteria to take up any plasmid containing ampicillin resistance',
      'Lethal chromosomal mutation in the bacterial host strain'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Insertional inactivation of the lacZ α-peptide by foreign DNA prevents functional β-galactosidase assembly. Colonies cannot hydrolyze X-gal to produce blue dye, remaining white (recombinants).',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-8',
    q: 'How does the CRISPR-Cas9 genome editing complex achieve site-specific double-strand endonuclease cleavage in eukaryotic genomes?',
    options: [
      'A single-guide RNA (sgRNA) base-pairs with a 20-nucleotide target sequence adjacent to a 5\'-NGG protospacer adjacent motif (PAM)',
      'Cas9 recognizes specific methylated cytosine palindromes without RNA guides',
      'Reverse transcriptase synthesizes a complementary DNA fragment that integrates via homologous recombination',
      'Cas9 randomly digests single-stranded DNA loops during transcription'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Cas9 is targeted to target genomic loci by a 20-nt guide RNA complementary to the genomic target, provided the adjacent DNA sequence contains a specific 5\'-NGG PAM required for Cas9 activation and cleavage.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-9',
    q: 'In retroviral-mediated gene therapy for severe combined immunodeficiency (SCID-X1), what major oncogenic risk arose in early clinical trials?',
    options: [
      'Insertional mutagenesis due to retroviral integration near the LMO2 proto-oncogene promoter, causing T-cell acute lymphoblastic leukemia',
      'Formation of high-titer replication-competent human immunodeficiency virus',
      'Autoimmune destruction of erythrocyte membrane glycoproteins',
      'Degradation of endogenous adenosine deaminase mRNA'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Gamma-retroviral vectors tend to integrate near cellular transcription start sites. In several SCID-X1 patients, integration activated the LMO2 oncogene, inducing clonal T-cell lymphoproliferative leukemia.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Evolution (9 MCQs: 3 Easy, 3 Medium, 3 Hard) ---
  {
    id: 'mdcat-b3-bio-10',
    q: 'According to Darwin\'s theory of evolution by natural selection, what is the fundamental driving force of evolutionary change within populations?',
    options: [
      'Differential reproductive success of individuals carrying heritable phenotypic variations suited to their environment',
      'Inheritance of acquired somatic characteristics during an individual\'s lifetime',
      'Spontaneous generation of new organs under teleological demand',
      'Uniform survival of all offspring without resource competition'
    ],
    correct: 0,
    topic: 'Evolution',
    explain: 'Natural selection acts on heritable variations; individuals with adaptations conferring higher fitness survive and reproduce more successfully, shifting allele frequencies over generations.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-11',
    q: 'Structures that share a common ancestral embryological origin and anatomical plan but perform different functions in diverse species (such as the forelimb bones of humans, bats, and whales) are called:',
    options: ['Homologous structures', 'Analogous structures', 'Vestigial structures', 'Atavistic structures'],
    correct: 0,
    topic: 'Evolution',
    explain: 'Homologous structures reflect divergent evolution from a common ancestor, retaining identical skeletal architecture (humerus, radius, ulna, carpals) despite divergent adaptive functions.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-12',
    q: 'What type of natural selection favors individuals at one extreme of a phenotypic distribution, shifting the population mean over time?',
    options: ['Directional selection', 'Stabilizing selection', 'Disruptive selection', 'Balancing selection'],
    correct: 0,
    topic: 'Evolution',
    explain: 'Directional selection favors one extreme phenotype over intermediate and opposite phenotypes (e.g., evolution of antibiotic resistance or industrial melanism in peppered moths).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-13',
    q: 'Which evolutionary phenomenon describes random fluctuations in allele frequencies from generation to generation due to chance events, especially in small populations?',
    options: ['Genetic drift', 'Gene flow', 'Balancing selection', 'Adaptive radiation'],
    correct: 0,
    topic: 'Evolution',
    explain: 'Genetic drift refers to random non-adaptive changes in allele frequencies occurring purely by stochastic sampling error in gamete transmission, most pronounced in small populations (bottleneck, founder effect).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-14',
    q: 'In a population at Hardy-Weinberg equilibrium, the frequency of an autosomal recessive allele (q) is 0.2. What is the expected frequency of heterozygous carriers (2pq) in this population?',
    options: ['0.32 (32%)', '0.64 (64%)', '0.04 (4%)', '0.16 (16%)'],
    correct: 0,
    topic: 'Evolution',
    explain: 'p + q = 1 => p = 1 - 0.2 = 0.8. Heterozygous carrier frequency = 2pq = 2 * (0.8) * (0.2) = 0.32 (32%).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-15',
    q: 'What is the evolutionary mechanism termed "convergent evolution"?',
    options: [
      'Unrelated organisms independently evolve similar superficial adaptations due to similar ecological niches and selective pressures',
      'Related organisms diverge into multiple morphological forms following colonizing an archipelago',
      'Two mutualistic species evolve complementary reproductive traits simultaneously',
      'A diploid species hybridizes with another to produce an allotetraploid offspring'
    ],
    correct: 0,
    topic: 'Evolution',
    explain: 'Convergent evolution yields analogous structures (like wings of insects and birds, or streamlined shapes of sharks and dolphins) through independent adaptations to similar environmental challenges.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-16',
    q: 'Under the Hardy-Weinberg principle, which condition is essential for maintaining constant allele and genotype frequencies over generations?',
    options: [
      'Infinitely large population size, absence of natural selection, no gene mutation, no gene flow, and random mating',
      'Small isolated population size with severe sexual selection',
      'High rate of unidirectional mutation from dominant to recessive alleles',
      'Assortative non-random mating favoring rare phenotypes'
    ],
    correct: 0,
    topic: 'Evolution',
    explain: 'Hardy-Weinberg genetic equilibrium requires 5 theoretical assumptions: very large population size, no gene flow/migration, no net mutation, completely random mating, and no differential natural selection.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-17',
    q: 'The evolutionary persistence of the sickle-cell hemoglobin allele (HbS) at high frequencies in sub-Saharan African human populations exemplifies which population genetics phenomenon?',
    options: [
      'Heterozygote advantage (balanced polymorphism conferring resistance to Plasmodium falciparum malaria)',
      'Genetic bottleneck caused by population decimation',
      'Directional selection favoring homozygous sickle-cell disease patients',
      'Non-random positive assortative mating'
    ],
    correct: 0,
    topic: 'Evolution',
    explain: 'Heterozygotes (HbA/HbS) have sickle-cell trait without severe vaso-occlusive crises and exhibit resistance to lethal severe falciparum malaria, maintaining the lethal recessive allele via balancing selection.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-18',
    q: 'What speciation model occurs when a single ancestral species rapidly diversifies into a multitude of ecologically distinct descendant species exploiting unexploited resource niches?',
    options: ['Adaptive radiation (e.g., Darwin\'s Galápagos finches)', 'Sympatric polyploidization', 'Allopatric vicariance', 'Stasipatric speciation'],
    correct: 0,
    topic: 'Evolution',
    explain: 'Adaptive radiation is the rapid evolutionary diversification of a single lineage into a wide variety of ecological morphotypes (such as Galápagos finch beak morphology adapted to distinct food sources).',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Bio Molecules (8 MCQs: 3 Easy, 3 Medium, 2 Hard) ---
  {
    id: 'mdcat-b3-bio-19',
    q: 'Which covalent linkage joins monosaccharide units together to form disaccharides and polysaccharides?',
    options: ['Glycosidic bond', 'Peptide bond', 'Phosphodiester bond', 'Ester bond'],
    correct: 0,
    topic: 'Bio Molecules',
    explain: 'A glycosidic bond is a covalent ether linkage formed between the hemiacetal or hemiketal group of a saccharide and the hydroxyl group of another compound via condensation.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-20',
    q: 'What are the three chemical components of an individual nucleotide monomer?',
    options: [
      'A nitrogenous base, a pentose sugar, and one or more phosphate groups',
      'A glycerol molecule, a fatty acid, and a phosphate group',
      'An amino group, a carboxyl group, and a variable R-side chain',
      'A hexose sugar, a fatty acyl chain, and a sphingosine base'
    ],
    correct: 0,
    topic: 'Bio Molecules',
    explain: 'A nucleotide consists of a heterocyclic nitrogenous base (purine/pyrimidine), a five-carbon pentose sugar (ribose or deoxyribose), and 1–3 phosphate groups.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-21',
    q: 'Which structural polysaccharide composed of β-1,4-glycosidic linked D-glucose chains constitutes the primary tensile framework of plant cell walls?',
    options: ['Cellulose', 'Amylose', 'Glycogen', 'Amylopectin'],
    correct: 0,
    topic: 'Bio Molecules',
    explain: 'Cellulose is an unbranched polymer of glucose units linked by β-1,4-glycosidic bonds, organized into crystalline microfibrils reinforced by interchain hydrogen bonding.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-22',
    q: 'Why are saturated fatty acids typically solid fats at room temperature, whereas unsaturated fatty acids are liquid oils?',
    options: [
      'Saturated fatty acids have straight hydrocarbon tails that pack tightly together, maximizing van der Waals attractions',
      'Saturated fatty acids contain cis-double bonds creating rigid kinks in the chain',
      'Unsaturated fatty acids have higher molecular weights and melting points',
      'Saturated fatty acids contain polar ionic carboxyl groups throughout their length'
    ],
    correct: 0,
    topic: 'Bio Molecules',
    explain: 'Saturated fatty acids have no C=C double bonds, allowing flexible zigzag aliphatic chains to pack closely with high van der Waals forces and high melting points. Cis double bonds introduce kinks that disrupt packing.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-23',
    q: 'What is the characteristic primary structure of an adult hemoglobin molecule (HbA)?',
    options: [
      'A tetramer composed of two α-globin chains and two β-globin chains, each associated with an iron-protoporphyrin IX heme group',
      'A single polypeptide chain with high oxygen affinity (myoglobin)',
      'Two α-globin chains and two γ-globin chains',
      'Four identical polypeptide chains without prosthetic groups'
    ],
    correct: 0,
    topic: 'Bio Molecules',
    explain: 'Adult hemoglobin (HbA) has a quaternary structure of two α-subunits (141 amino acids each) and two β-subunits (146 amino acids each), each coordinating one heme-Fe²⁺ prosthetic moiety.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-24',
    q: 'Which phospholipid is the major amphipathic structural component of eukaryotic plasma membranes and pulmonary surfactant?',
    options: ['Phosphatidylcholine (Lecithin)', 'Triacylglycerol', 'Cholesterol ester', 'Prostaglandin E2'],
    correct: 0,
    topic: 'Bio Molecules',
    explain: 'Phosphatidylcholine (lecithin), specifically dipalmitoylphosphatidylcholine (DPPC), is the predominant membrane glycerophospholipid and the essential tension-reducing component of pulmonary surfactant.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-25',
    q: 'Which pair of amino acids possess positively charged (basic) side chains at physiological pH (7.4)?',
    options: ['Lysine and Arginine', 'Aspartate and Glutamate', 'Valine and Isoleucine', 'Serine and Threonine'],
    correct: 0,
    topic: 'Bio Molecules',
    explain: 'Lysine (ε-amino group, pKa ~10.5) and Arginine (guanidinium group, pKa ~12.5) are fully protonated and positively charged at pH 7.4. Aspartate and glutamate are negatively charged acidic amino acids.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-26',
    q: 'What specific thermodynamic force primarily drives the spontaneous tertiary folding of globular proteins in an aqueous cytosolic environment?',
    options: [
      'The hydrophobic effect (increase in solvent water entropy as non-polar aliphatic side chains are sequestered into the protein core)',
      'Formation of covalent peptide bonds between distant amino acid residues',
      'Electrostatic repulsion between similarly charged surface acidic residues',
      'Disruption of backbone alpha-helical hydrogen bonding'
    ],
    correct: 0,
    topic: 'Bio Molecules',
    explain: 'Folding buries hydrophobic side chains inside the interior core, releasing ordered clathrate water cages back into bulk solvent, which produces a large favorable gain in solvent entropy (hydrophobic effect).',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Bioenergetics (8 MCQs: 3 Easy, 3 Medium, 2 Hard) ---
  {
    id: 'mdcat-b3-bio-27',
    q: 'Where do the light-dependent reactions of photosynthesis occur inside plant chloroplasts?',
    options: ['Thylakoid membranes', 'Stroma matrix', 'Outer chloroplast membrane', 'Intermembrane space'],
    correct: 0,
    topic: 'Bioenergetics',
    explain: 'Photosystems I and II, the electron transport chain, and ATP synthase are embedded within the thylakoid membrane bilayers of chloroplasts.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-28',
    q: 'What is the net ATP yield produced per molecule of glucose during anaerobic glycolysis (substrate-level phosphorylation)?',
    options: ['2 ATP molecules', '4 ATP molecules', '36 ATP molecules', '0 ATP molecules'],
    correct: 0,
    topic: 'Bioenergetics',
    explain: 'Glycolysis consumes 2 ATP in the preparatory phase and generates 4 ATP in the payoff phase via substrate-level phosphorylation, yielding a net gain of 2 ATP per glucose.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-29',
    q: 'In the light reactions of photosynthesis, what is the ultimate biological source of electrons and protons used to reduce NADP⁺ to NADPH?',
    options: ['Water (H₂O) via photolysis at the oxygen-evolving complex', 'Carbon dioxide (CO₂)', 'Glucose', 'Atmospheric oxygen (O₂)'],
    correct: 0,
    topic: 'Bioenergetics',
    explain: 'Photosystem II extracts electrons by photolysis of water: 2 H₂O → O₂ + 4 H⁺ + 4 e⁻. The electrons replace those excited in P680 and are transferred down the Z-scheme to reduce NADP⁺.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-30',
    q: 'Which enzyme catalyzes the primary carbon fixation reaction in the Calvin cycle by carboxylating ribulose-1,5-bisphosphate (RuBP)?',
    options: ['RuBisCO (Ribulose-1,5-bisphosphate carboxylase/oxygenase)', 'Phosphofructokinase-1', 'PEP carboxylase', 'ATP synthase'],
    correct: 0,
    topic: 'Bioenergetics',
    explain: 'RuBisCO fixes atmospheric CO₂ onto 5-carbon RuBP to generate an unstable 6-carbon intermediate that immediately cleaves into two molecules of 3-phosphoglycerate (3-PGA).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-31',
    q: 'What is the role of molecular oxygen (O₂) in mitochondrial cellular respiration?',
    options: [
      'Terminal electron acceptor of the electron transport chain at Complex IV (cytochrome c oxidase), being reduced to water',
      'Direct oxidant of glucose during glycolysis',
      'Allosteric activator of the pyruvate dehydrogenase complex',
      'Carrier of acetyl groups into the citric acid cycle'
    ],
    correct: 0,
    topic: 'Bioenergetics',
    explain: 'Complex IV transfers four electrons from reduced cytochrome c to molecular oxygen, reducing it to two water molecules: O₂ + 4 H⁺ + 4 e⁻ → 2 H₂O. Without O₂, the ETC backs up.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-32',
    q: 'According to Peter Mitchell\'s chemiosmotic hypothesis, how is the proton electrochemical gradient (proton-motive force) used to synthesize ATP?',
    options: [
      'Protons flow down their electrochemical gradient from the intermembrane space back into the mitochondrial matrix through the F₀ rotor of ATP synthase',
      'Protons are pumped by ATP synthase into the cytosol',
      'Protons directly phosphorylate ADP without enzymatic catalysis',
      'Protons convert NADH directly into FADH₂'
    ],
    correct: 0,
    topic: 'Bioenergetics',
    explain: 'Proton-motive force drives protons across the inner mitochondrial membrane through the F₀ subunit of ATP synthase, rotating the stalk and driving conformational changes in the F₁ catalytic head to synthesize ATP.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-33',
    q: 'Why do C4 plants (like maize and sugarcane) exhibit significantly higher photosynthetic efficiency in hot, arid climates compared to C3 plants?',
    options: [
      'They physically separate initial CO₂ capture (by PEP carboxylase in mesophyll cells) from the Calvin cycle (in bundle sheath cells), suppressing RuBisCO oxygenase activity and photorespiration',
      'They do not utilize RuBisCO or the Calvin cycle for sugar synthesis',
      'Their stomata remain wide open at noon without transpirational water loss',
      'They produce ATP directly from solar radiation without photosystems'
    ],
    correct: 0,
    topic: 'Bioenergetics',
    explain: 'PEP carboxylase has no oxygenase activity. It fixes CO₂ into 4-carbon oxaloacetate/malate, which is pumped into bundle sheath cells where CO₂ is concentrated around RuBisCO, eliminating photorespiration.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-34',
    q: 'In the Krebs citric acid cycle, which single reaction generates high-energy nucleotide triphosphate by substrate-level phosphorylation?',
    options: [
      'Conversion of succinyl-CoA to succinate by succinyl-CoA synthetase (generating GTP or ATP)',
      'Oxidation of isocitrate to α-ketoglutarate',
      'Condensation of acetyl-CoA with oxaloacetate to form citrate',
      'Hydration of fumarate to L-malate'
    ],
    correct: 0,
    topic: 'Bioenergetics',
    explain: 'Succinyl-CoA synthetase cleaves the high-energy thioester bond of succinyl-CoA to produce succinate, coupling the exergonic energy to phosphorylate GDP to GTP (or ADP to ATP).',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Cell Division (8 MCQs: 3 Easy, 3 Medium, 2 Hard) ---
  {
    id: 'mdcat-b3-bio-35',
    q: 'During which phase of the eukaryotic cell cycle does semi-conservative replication of genomic DNA occur?',
    options: ['S phase (Synthesis phase)', 'G1 phase', 'G2 phase', 'M phase (Mitosis)'],
    correct: 0,
    topic: 'Cell Division',
    explain: 'The S phase (Synthesis phase) of interphase is dedicated to duplicating cellular DNA and synthesizing histones, ensuring sister chromatids are ready for mitosis.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-36',
    q: 'In which stage of meiosis do homologous chromosome pairs align along the equatorial metaphase plate as bivalents (tetrads)?',
    options: ['Metaphase I', 'Metaphase II', 'Anaphase I', 'Prophase II'],
    correct: 0,
    topic: 'Cell Division',
    explain: 'During Metaphase I of meiosis, paired homologous chromosomes (bivalents/tetrads) align at the spindle equator, with kinetochores of sister chromatids attached to the same pole.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-37',
    q: 'What is the term for the failure of homologous chromosomes or sister chromatids to separate properly during meiotic cell division?',
    options: ['Nondisjunction', 'Crossing over', 'Synapsis', 'Cytokinesis'],
    correct: 0,
    topic: 'Cell Division',
    explain: 'Nondisjunction is the failure of homologous pairs (in anaphase I) or sister chromatids (in anaphase II) to segregate, producing aneuploid gametes (monosomy or trisomy).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-38',
    q: 'During which sub-stage of Prophase I does genetic crossing over (reciprocal exchange of non-sister chromatid segments) take place?',
    options: ['Pachytene', 'Leptotene', 'Zygotene', 'Diplotene'],
    correct: 0,
    topic: 'Cell Division',
    explain: 'Prophase I stages: Leptotene (condensation), Zygotene (synapsis begins), Pachytene (crossing over occurs at recombination nodules), Diplotene (chiasmata visible), Diakinesis (terminalization).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-39',
    q: 'What is the biological function of the spindle assembly checkpoint (SAC) during eukaryotic mitotic cell division?',
    options: [
      'To prevent the onset of anaphase until all kinetochores are properly attached to microtubules and tension is established',
      'To initiate nuclear envelope breakdown during early prophase',
      'To trigger DNA replication during G1 phase',
      'To phosphorylate histone H1 for chromosome condensation'
    ],
    correct: 0,
    topic: 'Cell Division',
    explain: 'The SAC inhibits the anaphase-promoting complex/cyclosome (APC/C) via the mitotic checkpoint complex (Mad2/BubR1) until every kinetochore achieves bi-orientation on the spindle.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-40',
    q: 'How does cytokinesis in dividing plant cells fundamentally differ from cytokinesis in animal cells?',
    options: [
      'Plant cells construct a centrifugal cell plate via Golgi-derived vesicles fusing from the center outwards, whereas animal cells form a centripetal cleavage furrow via an actomyosin contractile ring',
      'Plant cells pinch from the outside in using microfilaments',
      'Plant cells do not divide their cytoplasm following mitosis',
      'Plant cells dissolve the outer wall entirely prior to furrowing'
    ],
    correct: 0,
    topic: 'Cell Division',
    explain: 'Rigid plant walls prevent furrowing; instead, phragmoplast microtubules guide Golgi vesicles carrying pectins to the center to form a centrifugal cell plate. Animals use a contractile actin-myosin ring.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-41',
    q: 'Which molecular complex is ubiquitinated and degraded by the anaphase-promoting complex (APC/C) to trigger sister chromatid separation at anaphase onset?',
    options: ['Securin (releasing active separase to cleave cohesin)', 'Cyclin D', 'p53 transcription factor', 'Tubulin heterodimer'],
    correct: 0,
    topic: 'Cell Division',
    explain: 'APC/C targets securin for proteasomal degradation. Destruction of securin liberates active separase, an endopeptidase that cleaves the Scc1 subunit of cohesin complexes holding sister chromatids together.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-42',
    q: 'In human female oogenesis, at which developmental meiotic stage are primary oocytes arrested from late fetal gestation until puberty?',
    options: ['Diplotene stage of Prophase I (Dictyate stage)', 'Metaphase II', 'Pachytene stage of Prophase I', 'Anaphase II'],
    correct: 0,
    topic: 'Cell Division',
    explain: 'Primary oocytes begin meiosis during fetal life and arrest at the diplotene stage of Prophase I (the prolonged dictyate stage). Meiosis I resumes under the LH surge immediately prior to ovulation.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Cell Structure and Function (8 MCQs: 3 Easy, 3 Medium, 2 Hard) ---
  {
    id: 'mdcat-b3-bio-43',
    q: 'Which cellular organelle is responsible for synthesizing ribosomal RNA (rRNA) and assembling ribosomal subunit complexes in eukaryotes?',
    options: ['Nucleolus', 'Golgi apparatus', 'Peroxisome', 'Centrosome'],
    correct: 0,
    topic: 'Cell Structure and Function',
    explain: 'The nucleolus is the dense non-membrane-bound nuclear structure where rRNA genes are transcribed by RNA polymerase I and processed, assembling with ribosomal proteins into 40S and 60S subunits.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-44',
    q: 'Which membrane-bound organelle contains acid hydrolase enzymes operating at pH ~4.5–5.0 to degrade endocytosed macromolecules and cellular debris?',
    options: ['Lysosome', 'Mitochondrion', 'Rough endoplasmic reticulum', 'Chloroplast'],
    correct: 0,
    topic: 'Cell Structure and Function',
    explain: 'Lysosomes contain over 50 acidic hydrolytic enzymes (proteases, nucleases, lipases, phosphatases) maintained at acidic pH by vacuolar H⁺-ATPases in their limiting membrane.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-45',
    q: 'According to the fluid mosaic model proposed by Singer and Nicolson, what is the fundamental organization of the plasma membrane?',
    options: [
      'A fluid lipid bilayer of amphipathic phospholipids with integral proteins embedded within and peripheral proteins loosely attached to the surface',
      'A rigid solid sandwich of phospholipids enclosed on both sides by continuous protein sheets',
      'A monolayer of neutral triacylglycerols covered by carbohydrate polymers',
      'A static meshwork of cholesterol molecules lacking mobile proteins'
    ],
    correct: 0,
    topic: 'Cell Structure and Function',
    explain: 'The fluid mosaic model describes membranes as a 2D fluid lipid bilayer with polar head groups facing aqueous environments and hydrophobic tails sequestered inside, with proteins floating dynamically like a mosaic.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-46',
    q: 'Which cytoskeletal filament system composed of tubulin heterodimers forms the internal 9+2 axonemal architecture of eukaryotic cilia and flagella?',
    options: ['Microtubules', 'Microfilaments (actin)', 'Intermediate filaments (keratin)', 'Neurofilaments'],
    correct: 0,
    topic: 'Cell Structure and Function',
    explain: 'Microtubules (composed of α- and β-tubulin heterodimers) form the 9+2 doublet axoneme of motile cilia and flagella, powered by ciliary dynein motor arms.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-47',
    q: 'What is the primary function of the rough endoplasmic reticulum (RER) in eukaryotic cells?',
    options: [
      'Synthesis, co-translational translocation, and folding of secretory, lysosomal, and integral membrane proteins',
      'Detoxification of lipid-soluble drugs and synthesis of steroid hormones',
      'Generation of ATP via oxidative phosphorylation',
      'Synthesis of cellulose for the cell wall'
    ],
    correct: 0,
    topic: 'Cell Structure and Function',
    explain: 'The RER is studded with ribosomes on its cytosolic face, directing nascent polypeptides containing N-terminal signal peptides into its lumen for folding, glycosylation, and transport to the Golgi.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-48',
    q: 'Which organelle houses catalase to decompose potentially cytotoxic hydrogen peroxide (H₂O₂) generated during the β-oxidation of very long chain fatty acids?',
    options: ['Peroxisome', 'Lysosome', 'Centriole', 'Spliceosome'],
    correct: 0,
    topic: 'Cell Structure and Function',
    explain: 'Peroxisomes contain flavin oxidases that produce H₂O₂ as a byproduct of oxidative catabolism, and abundant catalase which converts 2 H₂O₂ into 2 H₂O and O₂.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-49',
    q: 'Which intercellular junction provides direct electrical and metabolic coupling between neighboring animal cells via hexameric connexon channels?',
    options: ['Gap junctions', 'Tight junctions (zonula occludens)', 'Desmosomes (macula adherens)', 'Hemidesmosomes'],
    correct: 0,
    topic: 'Cell Structure and Function',
    explain: 'Gap junctions consist of transmembrane protein complexes called connexons (composed of 6 connexin subunits) that align across extracellular space to form aqueous pores permitting ions and small metabolites (<1 kDa) to pass.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-50',
    q: 'In eukaryotic vesicular trafficking, which coat protein complex mediates retrograde transport of vesicles from the cis-Golgi back to the rough endoplasmic reticulum?',
    options: ['COPI coat protein', 'COPII coat protein', 'Clathrin', 'Caveolin'],
    correct: 0,
    topic: 'Cell Structure and Function',
    explain: 'COPI-coated vesicles transport escaped ER resident proteins (bearing KDEL signals) and recycling membrane components backwards from the Golgi to the ER (retrograde pathway). COPII mediates anterograde ER-to-Golgi transport.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Coordination and Control (9 MCQs: 3 Easy, 3 Medium, 3 Hard) ---
  {
    id: 'mdcat-b3-bio-51',
    q: 'What is the standard resting membrane potential of a typical mammalian giant axon?',
    options: ['Approximately -70 mV', 'Approximately +30 mV', 'Approximately 0 mV', 'Approximately -120 mV'],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'The typical neuronal resting membrane potential is around -70 mV, maintained predominantly by high resting permeability to K⁺ via leak channels and the electrogenic Na⁺/K⁺-ATPase pump.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-52',
    q: 'Which endocrine hormone produced by the posterior pituitary (neurohypophysis) stimulates uterine contractions during labor and milk ejection during lactation?',
    options: ['Oxytocin', 'Prolactin', 'Luteinizing hormone (LH)', 'Progesterone'],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Oxytocin is synthesized in the paraventricular and supraoptic nuclei of the hypothalamus, stored and released by the posterior pituitary, stimulating myometrial contractions and myoepithelial milk letdown.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-53',
    q: 'Which division of the autonomic nervous system mediates the catabolic "fight-or-flight" physiological response during acute emergencies?',
    options: ['Sympathetic nervous system', 'Parasympathetic nervous system', 'Enteric nervous system', 'Somatic sensory system'],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'The sympathetic nervous system triggers tachycardia, bronchodilation, pupillary mydriasis, glycogenolysis, and redistribution of blood flow to skeletal musculature during acute stress.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-54',
    q: 'During the rapid depolarization phase of a neuronal action potential, which ion channels open?',
    options: [
      'Voltage-gated sodium (Na⁺) channels open, causing rapid influx of Na⁺ down its electrochemical gradient',
      'Voltage-gated potassium (K⁺) channels open, causing K⁺ influx',
      'Chloride (Cl⁻) channels open, causing hyperpolarization',
      'Calcium (Ca²⁺) pumps pump Ca²⁺ into the extracellular fluid'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Depolarization above threshold triggers rapid activation of m-gates in voltage-gated Na⁺ channels, driving an explosive influx of Na⁺ that drives membrane potential toward the sodium equilibrium potential (+60 mV).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-55',
    q: 'How does saltatory conduction in myelinated nerve axons accelerate action potential propagation speed?',
    options: [
      'The insulating myelin sheath forces action potentials to electrotonically jump between unmyelinated nodes of Ranvier',
      'Myelin generates extra ATP along the axonal membrane',
      'Myelin increases the total number of open potassium channels under the sheath',
      'Action potentials travel through the interior core of the myelin sheath itself'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Myelin acts as an electrical insulator with low capacitance and high resistance. Local currents spread rapidly beneath the internode, regenerating action potentials only at the clustered Na⁺ channels of nodes of Ranvier.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-56',
    q: 'What is the endocrine role of calcitonin secreted by the parafollicular (C-cells) of the thyroid gland?',
    options: [
      'It lowers elevated blood calcium levels by inhibiting osteoclastic bone resorption and promoting renal calcium excretion',
      'It elevates blood calcium levels by activating osteoclasts',
      'It stimulates dietary calcium absorption in the duodenum',
      'It stimulates the synthesis of active 1,25-dihydroxycholecalciferol'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Calcitonin is released in response to hypercalcemia. It acts as an antagonist to parathyroid hormone (PTH), inhibiting osteoclast activity and reducing bone calcium mobilization.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-57',
    q: 'What is the precise molecular trigger that induces exocytic fusion of synaptic vesicles with the presynaptic active zone membrane?',
    options: [
      'Influx of extracellular Ca²⁺ through voltage-gated calcium channels upon action potential arrival, binding to synaptotagmin-1',
      'Efflux of intracellular K⁺ through delayed rectifier channels',
      'Direct electrical spark across the synaptic cleft',
      'Depletion of presynaptic neurotransmitter reuptake transporters'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Depolarization opens presynaptic voltage-gated N- or P/Q-type Ca²⁺ channels. Calcium binds to the calcium-sensor synaptotagmin, triggering complete zippering of the SNARE complex (syntaxin, SNAP-25, synaptobrevin) and neurotransmitter exocytosis.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-58',
    q: 'In the molecular mechanism of steroid hormone signaling, where do steroid receptors predominantly reside and how do they alter cellular physiology?',
    options: [
      'Inside the cytoplasm or nucleus; the hormone-receptor complex acts as a ligand-activated transcription factor binding hormone response elements (HREs) on genomic DNA',
      'On the outer surface of plasma membranes as G-protein coupled receptors activating cAMP',
      'Inside lysosomes where they digest ingested proteins',
      'Inside the mitochondrial matrix activating electron transport enzymes directly'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Lipophilic steroids diffuse across the plasma membrane, bind intracellular nuclear receptors, dimerize, translocate to the nucleus, and bind specific HREs on DNA to regulate mRNA transcription.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-59',
    q: 'Which hypothalamic nuclei synthesize antidiuretic hormone (vasopressin) and monitor plasma osmolality via central osmoreceptors?',
    options: ['Supraoptic and paraventricular nuclei', 'Arcuate nucleus', 'Suprachiasmatic nucleus', 'Ventromedial nucleus'],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Magnocellular neurosecretory cells in the supraoptic and paraventricular nuclei of the hypothalamus synthesize ADH and oxytocin. ADH is transported via axonal tracts down the infundibulum to the posterior pituitary.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Diversity Among Animals (9 MCQs: 3 Easy, 3 Medium, 3 Hard) ---
  {
    id: 'mdcat-b3-bio-60',
    q: 'Which animal phylum is characterized by a water vascular (ambulacral) system, pentaradial symmetry in adults, and tube feet?',
    options: ['Echinodermata', 'Mollusca', 'Arthropoda', 'Cnidaria'],
    correct: 0,
    topic: 'Diversity Among Animals',
    explain: 'Echinoderms (e.g., starfish, sea urchins) feature a water vascular system operating hydraulic tube feet, a mesodermal calcified endoskeleton, and secondary pentaradial symmetry.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-61',
    q: 'Which phylum possesses a metamerically segmented chitinous exoskeleton that must be periodically shed by ecdysis (molting)?',
    options: ['Arthropoda', 'Annelida', 'Nematoda', 'Platyhelminthes'],
    correct: 0,
    topic: 'Diversity Among Animals',
    explain: 'Arthropoda is the largest phylum, characterized by a rigid chitinous exoskeleton, jointed appendages, and ecdysis controlled by hormones such as ecdysone.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-62',
    q: 'Which class of chordates is characterized by possessing mammary glands, hair (fur), and three middle ear ossicles (malleus, incus, and stapes)?',
    options: ['Mammalia', 'Aves', 'Reptilia', 'Amphibia'],
    correct: 0,
    topic: 'Diversity Among Animals',
    explain: 'Mammals are unique in possessing milk-producing mammary glands, keratinaceous body hair, three middle ear ossicles derived from ancestral jaw bones, and a muscular diaphragm.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-63',
    q: 'How does an acoelomate animal (such as a flatworm of Phylum Platyhelminthes) differ anatomically from a coelomate animal?',
    options: [
      'It completely lacks a secondary fluid-filled body cavity between the gut and body wall, with the intervening space filled with mesodermal parenchyma tissue',
      'It has a body cavity completely lined by mesodermal peritoneum',
      'It possesses a pseudocoel derived from the persistent embryonic blastocoel',
      'It has an open circulatory system with a hemocoel'
    ],
    correct: 0,
    topic: 'Diversity Among Animals',
    explain: 'Acoelomates (Platyhelminthes) have no true body cavity (coelom); solid mesodermal parenchyma tissue fills the space between the ectoderm and endoderm.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-64',
    q: 'What is the diagnostic anatomical characteristic of Phylum Cnidaria used for prey capture and defense?',
    options: [
      'Cnidocytes containing specialized stinging organelles called nematocysts',
      'Colloblasts secreting adhesive glue',
      'Radula with chitinous teeth',
      'Flame cells with beating flagella'
    ],
    correct: 0,
    topic: 'Diversity Among Animals',
    explain: 'Cnidarians (hydra, jellyfish, corals) possess cnidocytes containing barbed, venom-filled stinging capsules called nematocysts that discharge upon tactile stimulation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-65',
    q: 'Which of the following is a key developmental feature distinguishing deuterostomes (e.g., Chordates, Echinoderms) from protostomes (e.g., Arthropods, Mollusks)?',
    options: [
      'In deuterostomes, the embryonic blastopore develops into the anus, and cleavage is radial and indeterminate',
      'In deuterostomes, the blastopore develops directly into the mouth',
      'Deuterostomes exhibit spiral, determinate embryonic cleavage',
      'Deuterostomes form their coelom exclusively by schizocoely'
    ],
    correct: 0,
    topic: 'Diversity Among Animals',
    explain: 'In deuterostomes ("second mouth"), the blastopore becomes the anus while the mouth forms secondarily, accompanied by radial indeterminate cleavage and enterocoelous coelom development.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-66',
    q: 'What anatomical adaptation in birds (Class Aves) allows continuous, unidirectional airflow through the parabronchial lungs during both inhalation and exhalation?',
    options: [
      'An interconnected system of anterior and posterior air sacs functioning as bellows',
      'A muscular diaphragm that pulls the lung bases downwards',
      'Blind-ended alveoli that expand during inspiration',
      'Spiracles connecting directly to systemic blood vessels'
    ],
    correct: 0,
    topic: 'Diversity Among Animals',
    explain: 'Avian respiratory anatomy includes non-vascular air sacs acting as bellows, moving air unidirectionally through rigid, tubular parabronchi in a two-cycle flow that enables continuous countercurrent gas exchange.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-67',
    q: 'Which larval form with bilateral symmetry provides crucial phylogenetic evidence linking non-chordate Echinoderms to primitive Hemichordates and Chordates?',
    options: ['Tornaria larva (and dipleurula-type larva)', 'Trochophore larva', 'Veliger larva', 'Nauplius larva'],
    correct: 0,
    topic: 'Diversity Among Animals',
    explain: 'The tornaria larva of hemichordates closely resembles the bipinnaria/dipleurula larva of echinoderms, exhibiting ciliated bands and enterocoely that affirm their common deuterostome ancestry.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b3-bio-68',
    q: 'Which primitive egg-laying (oviparous) mammalian order includes the platypus and echidna, retaining reptilian-like cloacal anatomy?',
    options: ['Monotremata (Prototheria)', 'Marsupialia (Metatheria)', 'Placentalia (Eutheria)', 'Rodentia'],
    correct: 0,
    topic: 'Diversity Among Animals',
    explain: 'Monotremes are primitive prototherian mammals that lay leathery eggs, possess a cloaca, lack teats (milk secretes onto abdominal fur), but possess hair and produce milk.',
    difficulty: 'Hard',
    subject: 'Biology'
  }
];
