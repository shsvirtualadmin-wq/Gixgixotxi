import { BoardClass } from '../types';

export interface FBISEChapter {
  id: string;
  name: string;
  subtopics: string;
  isHighYield?: boolean;
}

export interface FBISESubjectConfig {
  id: string;
  name: string;
  classNum: BoardClass;
  description?: string;
  chapters: FBISEChapter[];
}

export const FBISE_SYLLABUS_DATA: FBISESubjectConfig[] = [
  // ==================== CLASS 9 ====================
  {
    id: '9-bio',
    name: 'Biology',
    classNum: 9,
    description: 'FBISE Class 9 Biology Textbook Curriculum',
    chapters: [
      { id: '9-bio-1', name: 'The Science of Biology', subtopics: 'branches of biology, scientific method, career fields', isHighYield: true },
      { id: '9-bio-2', name: 'Molecular Biology', subtopics: 'biomolecules, nucleic acids (DNA/RNA), proteins, enzymes', isHighYield: true },
      { id: '9-bio-3', name: 'The Cell', subtopics: 'cell theory, cell structure, prokaryotic vs eukaryotic cells, cell organelles', isHighYield: true },
      { id: '9-bio-4', name: 'Tissues, Organs and Organ Systems', subtopics: 'plant tissues, animal tissues, organ systems overview' },
      { id: '9-bio-5', name: 'Cell Cycle', subtopics: 'mitosis, meiosis, cell division stages', isHighYield: true },
      { id: '9-bio-6', name: 'Biodiversity', subtopics: 'five kingdom classification, biological classification, binomial nomenclature' },
      { id: '9-bio-7', name: 'Metabolism', subtopics: 'enzymes, photosynthesis, respiration', isHighYield: true },
      { id: '9-bio-8', name: 'Plant Physiology', subtopics: 'transport in plants, transpiration, plant nutrition' },
      { id: '9-bio-9', name: 'Plant Reproduction', subtopics: 'asexual/sexual reproduction, pollination, seed formation' },
      { id: '9-bio-10', name: 'Evolution', subtopics: 'theories of evolution, natural selection, evidence of evolution', isHighYield: true },
    ]
  },
  {
    id: '9-chem',
    name: 'Chemistry',
    classNum: 9,
    description: 'FBISE Class 9 Chemistry Textbook Curriculum',
    chapters: [
      { id: '9-chem-1', name: 'Nature of Science in Chemistry', subtopics: 'scientific method, branches of chemistry, chemistry in daily life' },
      { id: '9-chem-2', name: 'Matter', subtopics: 'states of matter, physical/chemical changes, classification of matter' },
      { id: '9-chem-3', name: 'Atomic Structure', subtopics: 'atomic models, subatomic particles, isotopes, electronic configuration', isHighYield: true },
      { id: '9-chem-4', name: 'Periodic Table and Periodicity of Properties', subtopics: 'history, groups/periods, trends (atomic radius, ionization energy, etc.)', isHighYield: true },
      { id: '9-chem-5', name: 'Chemical Bonding', subtopics: 'ionic, covalent, metallic bonding, shapes of molecules', isHighYield: true },
      { id: '9-chem-6', name: 'Stoichiometry', subtopics: 'Avogadro\'s number, mole concept, chemical equations, empirical/molecular formula', isHighYield: true },
      { id: '9-chem-7', name: 'Electrochemistry', subtopics: 'oxidation-reduction, electrolysis, electrochemical cells', isHighYield: true },
      { id: '9-chem-8', name: 'Energetics', subtopics: 'exothermic/endothermic reactions, enthalpy, energy diagrams' },
      { id: '9-chem-9', name: 'Chemical Equilibrium', subtopics: 'reversible reactions, Le Chatelier\'s principle, equilibrium constant', isHighYield: true },
      { id: '9-chem-10', name: 'Acids, Bases, and Salts', subtopics: 'properties, pH scale, indicators, neutralization' },
      { id: '9-chem-11', name: 'Environmental Chemistry – Air', subtopics: 'composition, air pollution, greenhouse effect' },
      { id: '9-chem-12', name: 'Environmental Chemistry – Water', subtopics: 'water cycle, water pollution, purification methods' },
      { id: '9-chem-13', name: 'Organic Chemistry', subtopics: 'carbon compounds, functional groups, nomenclature basics', isHighYield: true },
      { id: '9-chem-14', name: 'Hydrocarbons', subtopics: 'alkanes, alkenes, alkynes, saturated/unsaturated compounds', isHighYield: true },
      { id: '9-chem-15', name: 'Biochemistry', subtopics: 'carbohydrates, proteins, lipids, nucleic acids' },
      { id: '9-chem-16', name: 'Empirical Data Collection and Analysis', subtopics: 'experimental design, data recording, graphs' },
      { id: '9-chem-17', name: 'Separation Techniques', subtopics: 'filtration, distillation, crystallization, sublimation' },
      { id: '9-chem-18', name: 'Qualitative Analysis', subtopics: 'testing for ions, flame tests' },
      { id: '9-chem-19', name: 'Chromatography', subtopics: 'paper chromatography, principles and applications' },
    ]
  },
  {
    id: '9-phy',
    name: 'Physics',
    classNum: 9,
    description: 'FBISE Class 9 Physics Textbook Curriculum',
    chapters: [
      { id: '9-phy-1', name: 'Chapter 1: Physical Quantities and Measurement', subtopics: 'Physics and its Importance; Physical Quantities; International System of Units; Prefixes; Scientific Notation; Significant Figures; Precision and Accuracy; Measuring Instruments; Uncertainty in Measurements' },
      { id: '9-phy-2', name: 'Chapter 2: Kinematics', subtopics: 'Rest and Motion; Types of Motion; Scalars and Vectors; Displacement and Distance; Speed and Velocity; Acceleration; Equations of Motion; Motion Under Gravity; Graphical Analysis of Motion', isHighYield: true },
      { id: '9-phy-3', name: 'Chapter 3: Dynamics - I', subtopics: 'Force and its Types; Newton\'s First Law of Motion; Newton\'s Second Law of Motion; Newton\'s Third Law of Motion; Momentum; Law of Conservation of Momentum; Friction', isHighYield: true },
      { id: '9-phy-4', name: 'Chapter 4: Dynamics - II', subtopics: 'Circular Motion; Centripetal Force; Moment of a Force (Torque); Principle of Moments; Centre of Mass and Centre of Gravity; Stability and Equilibrium', isHighYield: true },
      { id: '9-phy-5', name: 'Chapter 5: Pressure and Deformation in Solids', subtopics: 'Pressure and its Units; Pressure in Liquids; Atmospheric Pressure; Pascal\'s Law; Archimedes\' Principle; Elasticity and Hooke\'s Law; Stress and Strain' },
      { id: '9-phy-6', name: 'Chapter 6: Work and Energy', subtopics: 'Work and its Units; Energy and its Forms; Kinetic Energy; Potential Energy; Law of Conservation of Energy; Power; Efficiency', isHighYield: true },
      { id: '9-phy-7', name: 'Chapter 7: Density and Temperature', subtopics: 'Density and Relative Density; Temperature and its Measurement; Thermometers and Scales; Heat vs Temperature; Thermal Equilibrium' },
      { id: '9-phy-8', name: 'Chapter 8: Magnetism', subtopics: 'Magnets and Magnetic Materials; Magnetic Field and Field Lines; Earth as a Magnet; Magnetic Induction; Uses of Magnets' },
      { id: '9-phy-9', name: 'Chapter 9: Nature of Science and Physics', subtopics: 'What is Physics; Branches of Physics; Scientific Method; Physics and Technology; Careers in Physics' },
    ]
  },
  {
    id: '9-math',
    name: 'Mathematics',
    classNum: 9,
    description: 'FBISE Class 9 Mathematics Curriculum',
    chapters: [
      { id: '9-math-1', name: 'Real Numbers', subtopics: 'number systems, rational/irrational numbers, radicals, laws of exponents', isHighYield: true },
      { id: '9-math-2', name: 'Logarithms', subtopics: 'laws of logarithms, common logarithms, applications', isHighYield: true },
      { id: '9-math-3', name: 'Sets and Relations', subtopics: 'set operations, Venn diagrams, relations and functions' },
      { id: '9-math-4', name: 'Factorization and Algebraic Manipulation', subtopics: 'algebraic identities, factorization techniques, HCF/LCM', isHighYield: true },
      { id: '9-math-5', name: 'Linear Equations and Inequalities', subtopics: 'solving linear equations, simultaneous equations, inequalities' },
      { id: '9-math-6', name: 'Trigonometry and Bearing', subtopics: 'trigonometric ratios, angles, bearing problems', isHighYield: true },
      { id: '9-math-7', name: 'Coordinate Geometry', subtopics: 'Cartesian plane, distance formula, midpoint formula' },
      { id: '9-math-8', name: 'Geometry of Straight Lines', subtopics: 'slope, equation of a line, parallel/perpendicular lines' },
      { id: '9-math-9', name: 'Geometry and Polygons', subtopics: 'properties of polygons, congruence, similarity' },
      { id: '9-math-10', name: 'Practical Geometry', subtopics: 'construction of triangles, quadrilaterals' },
      { id: '9-math-11', name: 'Basic Statistics', subtopics: 'data representation, mean/median/mode, frequency distribution' },
    ]
  },
  {
    id: '9-cs',
    name: 'Computer Science',
    classNum: 9,
    description: 'FBISE Class 9 Computer Science Curriculum',
    chapters: [
      { id: '9-cs-1', name: 'Problem Solving', subtopics: 'Problem solving steps, Flowcharts, Symbols, Algorithms, Test data & Verification', isHighYield: true },
      { id: '9-cs-2', name: 'Fundamentals of Operating System', subtopics: 'OS functions, Types of OS (GUI vs CLI), File management, Windows OS utilities', isHighYield: true },
      { id: '9-cs-3', name: 'Office Automation', subtopics: 'Word processing features, Formatting, Tables, Spreadsheet formulas, Slide presentations' },
      { id: '9-cs-4', name: 'Data Communication and Networks', subtopics: 'Transmission media (Guided & Unguided), Network topologies (Star, Bus, Ring), LAN/WAN, Routers', isHighYield: true },
      { id: '9-cs-5', name: 'Computer Security and Ethics', subtopics: 'Malware (Viruses, Worms, Trojan), Cybercrime, Hacking, Authentication, Data privacy & Ethics' },
    ]
  },
  {
    id: '9-eng',
    name: 'English',
    classNum: 9,
    description: 'FBISE Class 9 English Curriculum',
    chapters: [
      { id: '9-eng-1', name: 'Textual Reading & Comprehension', subtopics: 'Short stories, Essays, Main idea extraction, Contextual inference, Vocabulary' },
      { id: '9-eng-2', name: 'Poetry Analysis', subtopics: 'Theme, Paraphrasing, Figures of speech (Metaphor, Simile, Personification), Rhyme scheme' },
      { id: '9-eng-3', name: 'Grammar & Parts of Speech', subtopics: 'Nouns, Pronouns, Verbs, Adjectives, Adverbs, Prepositions, Conjunctions, Articles', isHighYield: true },
      { id: '9-eng-4', name: 'Sentence Structure & Tenses', subtopics: 'Simple, Continuous, Perfect tenses, Conditional sentences, Sentence correction', isHighYield: true },
      { id: '9-eng-5', name: 'Direct/Indirect Speech & Voice', subtopics: 'Active and Passive voice, Direct to Indirect narration transformation rules', isHighYield: true },
      { id: '9-eng-6', name: 'Writing Skills & Composition', subtopics: 'Formal and Informal letters, Applications, Story writing, Paragraph construction' },
    ]
  },
  {
    id: '9-urd',
    name: 'Urdu',
    classNum: 9,
    description: 'FBISE Class 9 Urdu Curriculum',
    chapters: [
      { id: '9-urd-1', name: 'Nasr (Prose)', subtopics: 'Akhlaq-e-Husna (Seerat Nigari), Kahani, Afsana, Drama, Novel/Novel Excerpt, Khaka, Tazkira/Mazah, Safarnama, Mazmoon' },
      { id: '9-urd-2', name: 'Nazm (Poetry)', subtopics: 'Hamd, Naat, Manqabat, Mehnat ki Barkat, Kirkit aur Muzahiya, Sindhi Zaban ki Shayeri (Tarjuma)' },
      { id: '9-urd-3', name: 'Ghazal', subtopics: 'selected poets\' work (Mir Taqi Mir, Khwaja Haider Ali Aatish, Nasir Kazmi, Parveen Fana Syed, etc.)' },
    ]
  },
  {
    id: '9-isl',
    name: 'Islamiat',
    classNum: 9,
    description: 'FBISE Class 9 Islamiat Curriculum',
    chapters: [
      { id: '9-isl-1', name: 'Quran Majeed ki Hadith Nabvi ke Sath Hifazat aur Tadween-e-Hadith', subtopics: 'Hifazat-e-Quran, tadween ke marahil, Ahadith-e-Nabaviya' },
      { id: '9-isl-2', name: 'Eimaniyat wa Ibadaat', subtopics: 'Aqeeda-e-Risalat, Aqeeda-e-Tauheed, Malaika (farishte), Aqeeda-e-Akhirat' },
      { id: '9-isl-3', name: 'Ibadaat', subtopics: 'Roza, Namaz, Hajj aur Qurbani, Zakat' },
      { id: '9-isl-4', name: 'Seerat-un-Nabi (Ahad-e-Nabvi ke Maasi Saal)', subtopics: 'Fatah-e-Makkah, Ghazwat-e-Khandaq, Aam-ul-Wufood, Ghazwa-e-Tabook, Hajjatul Wida, Wisaal-e-Nabvi' },
      { id: '9-isl-5', name: 'Uswa-e-Rasool aur Hamari Zindagi', subtopics: 'bachpan aur jawani, ibadat, khidmat-e-khalq wa isaar, sila-e-rahmi, khawateen ke sath husn-e-sulook, andaz-e-tarbiyat' },
      { id: '9-isl-6', name: 'Ittiba-e-Adaab', subtopics: 'Shukr wa Qanaat, Ikhlaas wa Taqwa, buri aadaat se ijtinaab (takabbur, jhoot, jaadu/faal wa tawahhum parasti)' },
      { id: '9-isl-7', name: 'Husn-e-Muamlaat wa Muashrat', subtopics: 'qasam ke ahkaam, gawahi ke ahkaam, sood ki hurmat, huqooq-ul-ibaad, jihad fi sabeelillah, islami riyasat' },
      { id: '9-isl-8', name: 'Hidayat ke Chashme aur Mashaheer-e-Islam', subtopics: 'Ahl-e-Bait-e-Athaar, Sahaba-e-Kiram, Tabiyaat, ulama wa mufakkireen' },
      { id: '9-isl-9', name: 'Islami Taleemaat aur Asr-e-Hazir ke Taqaze', subtopics: 'khud-e-etimadi wa khud-e-inhisari, mustaqbil mein islam ki ahmiyat' },
    ]
  },
  {
    id: '9-pak',
    name: 'Pakistan Studies',
    classNum: 9,
    description: 'FBISE Class 9 Pakistan Studies Curriculum',
    chapters: [
      { id: '9-pak-1', name: 'Ideological Basis of Pakistan', subtopics: 'Two-Nation Theory, Quaid-e-Azam statements, Allama Iqbal vision', isHighYield: true },
      { id: '9-pak-2', name: 'Making of Pakistan', subtopics: 'Pakistan Movement (1906-1947), Lahore Resolution 1940, Independence 1947' },
      { id: '9-pak-3', name: 'Land, Climate and Environment', subtopics: 'Geographical location of Pakistan, Relief features, Climate zones, Environmental issues' },
      { id: '9-pak-4', name: 'Women Empowerment in Pakistan', subtopics: 'Role of women in Pakistan movement, Legal protection, Socio-economic contribution' },
    ]
  },

  // ==================== CLASS 10 ====================
  {
    id: '10-bio',
    name: 'Biology',
    classNum: 10,
    description: 'FBISE Class 10 Biology Textbook Curriculum',
    chapters: [
      { id: '10-bio-1', name: 'Gaseous Exchange', subtopics: 'Gaseous exchange in plants, Human respiratory system, Lungs & Alveoli, Respiratory disorders (Bronchitis, Emphysema, Asthma)', isHighYield: true },
      { id: '10-bio-2', name: 'Homeostasis', subtopics: 'Homeostasis in plants, Human urinary system, Kidney structure & Nephron, Osmoregulation, Kidney stones, Dialysis & Transplant', isHighYield: true },
      { id: '10-bio-3', name: 'Coordination and Control', subtopics: 'Human nervous system, Brain & Spinal cord, Neurons, Reflex arc, Sense organs (Eye & Ear), Endocrine system & Hormones', isHighYield: true },
      { id: '10-bio-4', name: 'Support and Movement', subtopics: 'Human skeleton (Axial & Appendicular), Joints & types, Muscles & Tendons, Sliding filament theory, Bone disorders' },
      { id: '10-bio-5', name: 'Reproduction', subtopics: 'Asexual reproduction methods, Pollination in plants, Human reproductive system, Menstrual cycle, STDs (AIDS)', isHighYield: true },
      { id: '10-bio-6', name: 'Inheritance', subtopics: 'Mendel laws of inheritance, Chromosomes and Genes, DNA structure & Replication, Co-dominance, Variation & Natural Selection', isHighYield: true },
      { id: '10-bio-7', name: 'Man and His Environment', subtopics: 'Ecosystem components, Food chain & Food web, Biogeochemical cycles (Carbon & Nitrogen), Pollution & Conservation' },
      { id: '10-bio-8', name: 'Biotechnology', subtopics: 'Fermentation and industrial fermenters, Genetic engineering techniques, Single cell protein, Applications in medicine & agriculture' },
      { id: '10-bio-9', name: 'Pharmacology', subtopics: 'Medicinal drugs, Addictive drugs (Narcotics, Hallucinogens), Antibiotics and Vaccines, Drug resistance' },
    ]
  },
  {
    id: '10-chem',
    name: 'Chemistry',
    classNum: 10,
    description: 'FBISE Class 10 Chemistry Textbook Curriculum',
    chapters: [
      { id: '10-chem-1', name: 'Chemical Equilibrium', subtopics: 'Reversible reactions, Dynamic equilibrium, Law of Mass Action, Equilibrium constant Kc, Factors affecting equilibrium', isHighYield: true },
      { id: '10-chem-2', name: 'Acids, Bases and Salts', subtopics: 'Arrhenius, Bronsted-Lowry & Lewis concepts, pH scale & calculations, Indicators, Salts preparation and uses', isHighYield: true },
      { id: '10-chem-3', name: 'Organic Chemistry', subtopics: 'Organic compounds features, Functional groups, Classification of hydrocarbons, Homologous series, Isomerism', isHighYield: true },
      { id: '10-chem-4', name: 'Hydrocarbons', subtopics: 'Alkanes (Substitution reactions), Alkenes (Addition reactions), Alkynes (Hydrogenation/Halogenation), Uses', isHighYield: true },
      { id: '10-chem-5', name: 'Biochemistry', subtopics: 'Carbohydrates (Monosaccharides, Polysaccharides), Proteins & Amino acids, Lipids & Fatty acids, Nucleic acids (DNA/RNA), Vitamins' },
      { id: '10-chem-6', name: 'The Atmosphere', subtopics: 'Atmospheric layers, Air pollutants (CO, SO2, NOx), Greenhouse effect & Global warming, Acid rain, Ozone depletion' },
      { id: '10-chem-7', name: 'Water', subtopics: 'Properties of water, Water hardness (Temporary & Permanent), Softening methods, Water pollution & Waterborne diseases' },
      { id: '10-chem-8', name: 'Chemical Industries', subtopics: 'Metallurgy of Copper, Solvay process for Sodium Carbonate, Urea manufacturing plant, Petroleum refining fractions', isHighYield: true },
    ]
  },
  {
    id: '10-phy',
    name: 'Physics',
    classNum: 10,
    description: 'FBISE Class 10 Physics Textbook Curriculum',
    chapters: [
      { id: '10-phy-10', name: 'Unit 10: Heat Capacity and Modes of Heat Transfer', subtopics: 'Specific Heat Capacity; Transfer of Heat; Applications of Heat Transfer; Green House Effect and Global Warming; Flow of Heat in Geothermal Activities' },
      { id: '10-phy-11', name: 'Unit 11: Thermal Expansion and Change of State', subtopics: 'Kinetic Theory of Matter; Thermal Expansion; Evaporation; Latent Heat; Pressure Exerted by Gas Particles; Superconductivity' },
      { id: '10-phy-12', name: 'Unit 12: Waves', subtopics: 'Wave Motion; Wave Propagation; Characteristic Wave Parameters; Waves and their Types; Types of Waves on the Basis of Medium; Types of Waves on the Basis of Propagation; Wave Characteristics; Properties of Waves; Tsunamis', isHighYield: true },
      { id: '10-phy-13', name: 'Unit 13: Sound', subtopics: 'Source of Sound; Nature of Sound Waves; Ultrasound; Infrasound; Characteristics of Sound Waves; Analysing Sound Waves; Speed of Sound; Noise; Reflection, Refraction and Diffraction of Sound Waves; Echo; Acoustics; Human Hearing System', isHighYield: true },
      { id: '10-phy-14', name: 'Unit 14: Optics', subtopics: 'Reflection of Light; Refraction of Light; Total Internal Reflection; Thin Lenses; Application of Lenses; Visible Spectrum; Human Eye and Colour Perception; Gravitational Lensing; Acoustic Lenses', isHighYield: true },
      { id: '10-phy-15', name: 'Unit 15: Electrostatics', subtopics: 'Static Charge; Conductors and Insulators; Charging and Discharging; Electroscope; Electric Field; Applications of Electrostatics; Electrical Breakdown', isHighYield: true },
      { id: '10-phy-16', name: 'Unit 16: Current Electricity', subtopics: 'Electric Current; Alternating and Direct Current; Potential Difference; Emf; Ohm\'s Law; Resistance; Resistivity; Electrical Measuring Instruments; Experiment for Demonstration of Resistance', isHighYield: true },
      { id: '10-phy-17', name: 'Unit 17: Electric Circuits', subtopics: 'Circuit Elements and Diagram; Resistors; Types of Resistors; Combination of Resistors; Combination of EMF Sources; Electricity and its Uses; Electrical Energy; Electric Power; Household Circuits and Electric Safety', isHighYield: true },
      { id: '10-phy-18', name: 'Unit 18: Electronics', subtopics: 'Semiconductors; N and P Type Semiconductors; PN Junction; Characteristics of Diode Under Biasing; Light Emitting Diode; Transistor; Relays and Switching Circuits; Transistor as a Switch; Digital Electronics; Fundamental Logic Gates; Universal Logic Gates; Uses of Logic Gates; Analogue and Digital Electronics; Quantum Computers' },
      { id: '10-phy-19', name: 'Unit 19: Electromagnetism', subtopics: 'Magnetic Field Due to Current Carrying Wire; Magnetic Field Due to Current Carrying Solenoid; Earth\'s Magnetic Field; Application of Magnetic Effect of Current; Force on a Current Carrying Conductor Placed in a Magnetic Field; Current Carrying Coil in a Magnetic Field; Electric Motor; Electromagnetic Induction; Lenz\'s Law; Electric Generator; Transformer; Deflection of Electron Beam; Cathode Ray Oscilloscope', isHighYield: true },
      { id: '10-phy-20', name: 'Unit 20: Electromagnetic Waves', subtopics: 'Electromagnetic Spectrum; Applications of Electromagnetic Waves; Risks Associated with Electromagnetic Waves; Scattering of Light; Nature of Light' },
      { id: '10-phy-21', name: 'Unit 21: Nuclear Physics', subtopics: 'Discovery of Nucleus; Nuclear Representations; Isotopes and Radioisotopes; Radioactivity; Nuclear Decay; Half-Life; Ionizing Nuclear Radiations; Applications of Radiation; Background Radiation; Nuclear Fission; Nuclear Fusion; Dark Matter; Falsibility' },
    ]
  },
  {
    id: '10-math',
    name: 'Mathematics',
    classNum: 10,
    description: 'FBISE Class 10 Mathematics Curriculum',
    chapters: [
      { id: '10-math-1', name: 'Quadratic Equations', subtopics: 'Solution by factorization, Completing square, Quadratic formula, Reducible equations', isHighYield: true },
      { id: '10-math-2', name: 'Theory of Quadratic Equations', subtopics: 'Discriminant & nature of roots, Cube roots of unity, Synthetic division, Simultaneous quadratic equations', isHighYield: true },
      { id: '10-math-3', name: 'Variations', subtopics: 'Ratio and Proportion, Direct and Inverse variation, Theorems on proportions (Componendo-Dividendo)', isHighYield: true },
      { id: '10-math-4', name: 'Partial Fractions', subtopics: 'Proper & Improper rational fractions, Resolving into partial fractions (Linear & Quadratic factors)' },
      { id: '10-math-5', name: 'Sets and Functions', subtopics: 'Operations on sets, Venn diagrams, Binary relations, Domain & Range, Types of functions (Injective, Surjective, Bijective)' },
      { id: '10-math-6', name: 'Basic Statistics', subtopics: 'Frequency distribution, Histograms, Measures of central tendency (Mean, Median, Mode), Standard deviation & Variance' },
      { id: '10-math-7', name: 'Introduction to Trigonometry', subtopics: 'Measurement of angles, Sexagesimal & Circular, Trigonometric ratios & identities, Angle of elevation & depression', isHighYield: true },
      { id: '10-math-8', name: 'Projection of a Side of a Triangle', subtopics: 'Obtuse and Acute angle triangle projection theorems' },
      { id: '10-math-9', name: 'Chords of a Circle', subtopics: 'Perpendicular from center to chord, Equal chords & distance from center theorems' },
      { id: '10-math-10', name: 'Tangent to a Circle', subtopics: 'Tangent perpendicular to radius, Common tangents, Inscribed and circumscribed circles' },
      { id: '10-math-11', name: 'Chord and Arc', subtopics: 'Equal arcs & subtended angles, Cyclic quadrilaterals' },
      { id: '10-math-12', name: 'Angle in a Segment of a Circle', subtopics: 'Inscribed angle theorem, Angles in same segment of circle' },
      { id: '10-math-13', name: 'Practical Geometry - Circles', subtopics: 'Construction of circles, Tangents to circles, Inscribed and Circumscribed polygons' },
    ]
  },
  {
    id: '10-cs',
    name: 'Computer Science',
    classNum: 10,
    description: 'FBISE Class 10 Computer Science Curriculum',
    chapters: [
      { id: '10-cs-1', name: 'Programming in C / Python', subtopics: 'Programming environment, Data types, Variables, Constants, Input/Output functions (printf, scanf / print, input)', isHighYield: true },
      { id: '10-cs-2', name: 'User-Defined Control Structures', subtopics: 'If statement, If-else, Else-if ladder, Switch statement, Conditional operators', isHighYield: true },
      { id: '10-cs-3', name: 'Loop Control Structures', subtopics: 'For loop, While loop, Do-while loop, Nested loops, Break and Continue statements', isHighYield: true },
      { id: '10-cs-4', name: 'Arrays and Functions', subtopics: '1D and 2D Arrays, Declaration & Initialization, Built-in functions, User-defined functions', isHighYield: true },
      { id: '10-cs-5', name: 'Web Development Basics', subtopics: 'HTML fundamentals, Tags, Attributes, Headings, Paragraphs, Lists, Tables, Forms, CSS styling' },
    ]
  },
  {
    id: '10-eng',
    name: 'English',
    classNum: 10,
    description: 'FBISE Class 10 English Curriculum',
    chapters: [
      { id: '10-eng-1', name: 'Textual Lessons & Comprehension', subtopics: 'Biographies, Moral stories, Historical essays, Contextual vocabulary, Inference questions' },
      { id: '10-eng-2', name: 'Poem Analysis & Paraphrasing', subtopics: 'Poetic devices, Theme, Stanza paraphrasing, Rhyme scheme' },
      { id: '10-eng-3', name: 'Advanced Grammar', subtopics: 'Gerunds, Participles, Infinitives, Modal auxiliaries, Prepositional phrases', isHighYield: true },
      { id: '10-eng-4', name: 'Direct/Indirect Narration & Voice', subtopics: 'Reporting imperatives, interrogatives & exclamations, Complex passive voice sentences', isHighYield: true },
      { id: '10-eng-5', name: 'Composition & Essay Writing', subtopics: 'Argumentative essays, Descriptive essays, Formal letters, Newspaper report writing' },
    ]
  },
  {
    id: '10-urd',
    name: 'Urdu',
    classNum: 10,
    description: 'FBISE Class 10 Urdu Curriculum',
    chapters: [
      { id: '10-urd-1', name: 'Hissa-e-Nasr (Sabaq)', subtopics: 'Sabaq Khulasa, Contextual Tashreeh, Character studies' },
      { id: '10-urd-2', name: 'Hissa-e-Nazam', subtopics: 'Nazam Ash\'ar Tashreeh, Central idea, Poet style' },
      { id: '10-urd-3', name: 'Hissa-e-Ghazal', subtopics: 'Ghazaliat Tashreeh, Technical poetic terms' },
      { id: '10-urd-4', name: 'Qawaid-o-Insha', subtopics: 'Mazmoon Nigarai, Khat/Darkhwast, Muhawray, Asnaaf-e-Adab' },
    ]
  },
  {
    id: '10-isl',
    name: 'Islamiat',
    classNum: 10,
    description: 'FBISE Class 10 Islamiat Curriculum',
    chapters: [
      { id: '10-isl-1', name: 'Surah Ahzab & Quranic Verses', subtopics: 'Translation, Historical background, Moral and social guidelines' },
      { id: '10-isl-2', name: 'Ahadith-e-Mubaraka', subtopics: 'Translation, Explanation, Character building principles' },
      { id: '10-isl-3', name: 'Seerat-un-Nabi (PBUH) & Sahaba', subtopics: 'Treaty of Hudaibiya, Conquest of Makkah, Farewell Sermon, Life of Sahaba' },
    ]
  },
  {
    id: '10-pak',
    name: 'Pakistan Studies',
    classNum: 10,
    description: 'FBISE Class 10 Pakistan Studies Curriculum',
    chapters: [
      { id: '10-pak-1', name: 'History of Pakistan (1947 to Present)', subtopics: 'Constitutional developments (1956, 1962, 1973), Political eras, Atomic power milestone', isHighYield: true },
      { id: '10-pak-2', name: 'Foreign Relations of Pakistan', subtopics: 'Foreign policy objectives, Relations with neighbors, UN role, OIC & SAARC' },
      { id: '10-pak-3', name: 'Economic Development', subtopics: 'Agriculture sector, Industrial growth, Energy resources, Trade & Commerce' },
      { id: '10-pak-4', name: 'Population, Society and Culture', subtopics: 'Cultural heritage, Languages of Pakistan, Educational setup, Social issues' },
    ]
  },

  // ==================== CLASS 11 ====================
  {
    id: '11-bio',
    name: 'Biology',
    classNum: 11,
    description: 'FBISE Class 11 Biology Textbook (1st Year HSSC 1)',
    chapters: [
      { id: '11-bio-1', name: 'Biological Molecules', subtopics: 'Water properties, Carbohydrates, Lipids & Fatty acids, Proteins & Amino acids, Nucleic acids (DNA & RNA structure)', isHighYield: true },
      { id: '11-bio-2', name: 'Enzymes', subtopics: 'Structure of enzymes, Mechanism of enzyme action, Factors affecting activity, Enzyme inhibitors (Competitive & Non-competitive)', isHighYield: true },
      { id: '11-bio-3', name: 'Cell Structure and Function', subtopics: 'Microscopy, Fluid mosaic model of plasma membrane, Organelles (ER, Golgi, Ribosomes, Lysosomes, Mitochondria, Nucleus), Cytoskeleton', isHighYield: true },
      { id: '11-bio-4', name: 'Variety of Life / Viruses', subtopics: 'Five kingdom system, Virus structure & classification, Bacteriophages lytic & lysogenic cycles, HIV, Prions & Viroids' },
      { id: '11-bio-5', name: 'Kingdom Prokaryotae (Bacteria)', subtopics: 'Bacterial structure, Cell wall (Gram +ve vs Gram -ve), Bacterial nutrition, Reproduction, Economic importance & Control' },
      { id: '11-bio-6', name: 'Kingdom Protista & Fungi', subtopics: 'Protozoa, Algae, Fungi structure, Hyphae, Fungal reproduction, Mycorrhizae & Lichens' },
      { id: '11-bio-7', name: 'Kingdom Plantae', subtopics: 'Bryophytes, Tracheophytes, Ferns, Gymnosperms, Angiosperms, Alternation of generations', isHighYield: true },
      { id: '11-bio-8', name: 'Kingdom Animalia', subtopics: 'Acoelomate, Pseudocoelomate & Coelomate phyla (Porifera to Chordata), Body symmetry & Evolutionary trends', isHighYield: true },
      { id: '11-bio-9', name: 'Bioenergetics', subtopics: 'Photosynthetic pigments, Light dependent reactions, Calvin cycle, Glycolysis, Krebs cycle, Electron Transport Chain, ATP yield', isHighYield: true },
      { id: '11-bio-10', name: 'Nutrition', subtopics: 'Autotrophic & Heterotrophic nutrition, Human digestive system, Enzymes of digestion, Absorption & Digestive disorders' },
      { id: '11-bio-11', name: 'Gaseous Exchange', subtopics: 'Respiration in plants & animals, Human respiratory system, Hemoglobin & Oxygen/CO2 transport, Respiratory disorders' },
      { id: '11-bio-12', name: 'Transport', subtopics: 'Xylem & Phloem transport, Transpiration pull theory, Human heart structure & Cardiac cycle, Blood pressure, Lymphatic system', isHighYield: true },
      { id: '11-bio-13', name: 'Immunity', subtopics: 'Innate & Adaptive immunity, B-cells & T-cells, Antibodies structure & function, Vaccines & Immunization' },
    ]
  },
  {
    id: '11-chem',
    name: 'Chemistry',
    classNum: 11,
    description: 'FBISE Class 11 Chemistry Textbook (1st Year HSSC 1)',
    chapters: [
      { id: '11-chem-1', name: 'Stoichiometry', subtopics: 'Mole concept, Avogadro number, Empirical & Molecular formulas, Stoichiometric calculations, Limiting reactant, Yield', isHighYield: true },
      { id: '11-chem-2', name: 'Atomic Structure', subtopics: 'Discovery of electron/proton/neutron, Planck quantum theory, Bohr model, Quantum numbers, Aufbau/Hund/Pauli principles, Electronic configuration', isHighYield: true },
      { id: '11-chem-3', name: 'Theories of Covalent Bonding', subtopics: 'VSEPR theory, Valence Bond Theory (VBT), Hybridization (sp, sp2, sp3), Molecular Orbital Theory (MOT), Bond dipole moment', isHighYield: true },
      { id: '11-chem-4', name: 'States of Matter I: Gases', subtopics: 'Gas laws (Boyle, Charles, Avogadro), Ideal gas equation, Dalton law of partial pressure, Graham law of diffusion, Kinetic molecular theory, Real gases', isHighYield: true },
      { id: '11-chem-5', name: 'States of Matter II: Liquids & Solids', subtopics: 'Intermolecular forces, Hydrogen bonding, Vapor pressure & Boiling point, Liquid crystals, Crystalline solids & Crystal lattice energy' },
      { id: '11-chem-6', name: 'Chemical Equilibrium', subtopics: 'Reversible reactions, Law of mass action, Kc and Kp relations, Le Chatelier principle, Haber process, pH & Buffer solutions', isHighYield: true },
      { id: '11-chem-7', name: 'Reaction Kinetics', subtopics: 'Rate of reaction, Order of reaction, Rate law, Activation energy, Arrhenius equation, Catalysis', isHighYield: true },
      { id: '11-chem-8', name: 'Thermochemistry', subtopics: 'Enthalpy changes, Standard enthalpy of formation/combustion, Hess law, Born-Haber cycle, Calorimetry' },
      { id: '11-chem-9', name: 'Solutions & Colloids', subtopics: 'Concentration units (Molarity, Molality, Mole fraction), Raoult law, Colligative properties, Colloids' },
      { id: '11-chem-10', name: 'Electrochemistry', subtopics: 'Oxidation numbers, Balancing redox equations, Galvanic & Electrolytic cells, Standard electrode potential, Fuel cells', isHighYield: true },
    ]
  },
  {
    id: '11-phy',
    name: 'Physics',
    classNum: 11,
    description: 'FBISE Class 11 Physics Textbook (1st Year HSSC 1)',
    chapters: [
      { id: '11-phy-1', name: 'Measurements', subtopics: 'SI units, Systematic & Random errors, Uncertainty calculations, Significant figures, Precision & Accuracy, Dimensions', isHighYield: true },
      { id: '11-phy-2', name: 'Vectors and Equilibrium', subtopics: 'Vector addition by rectangular components, Scalar dot product, Vector cross product, Torque & Moment arm, Equilibrium conditions', isHighYield: true },
      { id: '11-phy-3', name: 'Motion and Force', subtopics: 'Displacement-time & Velocity-time graphs, Newton laws, Momentum & Impulse, Elastic collisions in 1D & 2D, Projectile motion', isHighYield: true },
      { id: '11-phy-4', name: 'Work and Energy', subtopics: 'Work done by constant & variable force, Work-energy principle, Conservative & Non-conservative forces, Power, Escape velocity', isHighYield: true },
      { id: '11-phy-5', name: 'Rotational & Circular Motion', subtopics: 'Angular velocity & acceleration, Centripetal acceleration, Moment of inertia, Angular momentum conservation, Orbital satellites' },
      { id: '11-phy-6', name: 'Fluid Dynamics', subtopics: 'Viscosity & Drag force, Terminal velocity, Stokes law, Equation of continuity, Bernoulli equation & applications', isHighYield: true },
      { id: '11-phy-7', name: 'Oscillations', subtopics: 'Simple Harmonic Motion (SHM), SHM equations, Simple pendulum, Energy in SHM, Damped oscillations, Resonance', isHighYield: true },
      { id: '11-phy-8', name: 'Waves', subtopics: 'Progressive wave types, Speed of sound & Laplace correction, Superposition principle, Interference, Stationary waves in pipes, Doppler effect', isHighYield: true },
      { id: '11-phy-9', name: 'Physical Optics', subtopics: 'Wavefronts, Huygens principle, Young double slit experiment, Thin film interference, Diffraction grating, Polarization of light', isHighYield: true },
      { id: '11-phy-10', name: 'Thermodynamics', subtopics: 'Kinetic theory of gases, First law of thermodynamics, Isothermal & Adiabatic processes, Heat engines, Carnot cycle & Second law, Entropy' },
    ]
  },
  {
    id: '11-math',
    name: 'Mathematics',
    classNum: 11,
    description: 'FBISE Class 11 Mathematics Curriculum (1st Year HSSC 1)',
    chapters: [
      { id: '11-math-1', name: 'Number Systems', subtopics: 'Real numbers properties, Complex numbers algebra, Modulus and Argument, De Moivre theorem', isHighYield: true },
      { id: '11-math-2', name: 'Sets, Functions and Groups', subtopics: 'Operations on sets, Venn diagrams, Binary relations, Types of functions, Group theory fundamentals', isHighYield: true },
      { id: '11-math-3', name: 'Matrices and Determinants', subtopics: 'Matrix algebra, Inverse of 3x3 matrix, Determinant properties, Cramer rule, System of linear equations, Echelon form', isHighYield: true },
      { id: '11-math-4', name: 'Quadratic Equations', subtopics: 'Factorization, Quadratic formula, Synthetic division, Roots & Coefficients relation, Cube roots of unity', isHighYield: true },
      { id: '11-math-5', name: 'Partial Fractions', subtopics: 'Resolving proper and improper rational fractions into partial fractions' },
      { id: '11-math-6', name: 'Sequences and Series', subtopics: 'Arithmetic Progression (AP), Geometric Progression (GP), Harmonic Progression (HP), Sum formulas, Sigma notation', isHighYield: true },
      { id: '11-math-7', name: 'Permutation, Combination & Probability', subtopics: 'Factorials, nPr and nCr formulas, Sample space, Addition and Multiplication laws of probability', isHighYield: true },
      { id: '11-math-8', name: 'Mathematical Induction & Binomial Theorem', subtopics: 'Principle of mathematical induction, Binomial expansion for positive & rational index', isHighYield: true },
      { id: '11-math-9', name: 'Fundamentals of Trigonometry', subtopics: 'Radian & Sexagesimal units, Arc length formula, Area of sector, Fundamental trigonometric identities', isHighYield: true },
      { id: '11-math-10', name: 'Trigonometric Identities', subtopics: 'Deduction of fundamental law, Distance formula, Addition and Subtraction formulas, Double & Half angle identities', isHighYield: true },
      { id: '11-math-11', name: 'Trigonometric Functions & Graphs', subtopics: 'Domain, Range and Periodicity of trigonometric functions, Graphs of sin, cos, tan' },
      { id: '11-math-12', name: 'Applications of Trigonometry', subtopics: 'Law of Sines, Law of Cosines, Law of Tangents, Inradius, Circumradius, Ex-radii of triangles', isHighYield: true },
      { id: '11-math-13', name: 'Inverse Trigonometric Functions', subtopics: 'Domain and Range of inverse trig functions, Inverse trigonometric identities' },
      { id: '11-math-14', name: 'Trigonometric Equations', subtopics: 'General solutions of simple trigonometric equations' },
    ]
  },
  {
    id: '11-cs',
    name: 'Computer Science',
    classNum: 11,
    description: 'FBISE Class 11 Computer Science Curriculum (1st Year HSSC 1)',
    chapters: [
      { id: '11-cs-1', name: 'Basics of Information Technology', subtopics: 'Data vs Information, Hardware components, Software classification, System bus, Memory hierarchy', isHighYield: true },
      { id: '11-cs-2', name: 'Computer Architecture', subtopics: 'CPU components (ALU, CU, Registers), Instruction cycle, Fetch-Decode-Execute, Ports & Expansion slots', isHighYield: true },
      { id: '11-cs-3', name: 'Data Communication', subtopics: 'Communication signals (Analog & Digital), Bandwidth, Transmission modes, Guided & Unguided media', isHighYield: true },
      { id: '11-cs-4', name: 'Applications and Uses of Computers', subtopics: 'Computers in business, Education, Healthcare, E-commerce, Computer-aided design (CAD)' },
      { id: '11-cs-5', name: 'Computer Security & Ethics', subtopics: 'Malware types, Antivirus, Data backup, Encryption, Cybercrime laws, Intellectual property' },
      { id: '11-cs-6', name: 'Operating System Environment', subtopics: 'OS functions, User interfaces, Process management, File allocation table, Disk management' },
      { id: '11-cs-7', name: 'Fundamentals of C++ Programming', subtopics: 'C++ program structure, Tokens, Data types, Variables, Operators, Input/Output streams', isHighYield: true },
      { id: '11-cs-8', name: 'Control Structures in C++', subtopics: 'Sequential, Selection (If-Else, Switch), Iterative (For, While, Do-While loops)', isHighYield: true },
    ]
  },
  {
    id: '11-eng',
    name: 'English',
    classNum: 11,
    description: 'FBISE Class 11 English Curriculum (1st Year HSSC 1)',
    chapters: [
      { id: '11-eng-1', name: 'Prose & Textual Analysis', subtopics: 'Short stories, Historical speeches, Essays, Vocabulary in context, Comprehension questions' },
      { id: '11-eng-2', name: 'Poetry & Literary Devices', subtopics: 'Poetic devices (Metaphor, Imagery, Alliteration), Stanza analysis, Paraphrasing, Theme' },
      { id: '11-eng-3', name: 'Play / Drama Reading', subtopics: 'Character analysis, Dramatic dialogue, Conflict, Theme of the play' },
      { id: '11-eng-4', name: 'Advanced Grammar & Mechanics', subtopics: 'Subject-verb agreement, Dangling modifiers, Parallel structure, Punctuation', isHighYield: true },
      { id: '11-eng-5', name: 'Direct/Indirect & Voice Transformations', subtopics: 'Complex reporting transformations, Passive voice in formal writing', isHighYield: true },
      { id: '11-eng-6', name: 'Essay & Report Composition', subtopics: 'Expository & Narrative essays, Official reports, Curriculum Vitae (CV) & Job Applications' },
    ]
  },
  {
    id: '11-urd',
    name: 'Urdu',
    classNum: 11,
    description: 'FBISE Class 11 Urdu Curriculum (1st Year HSSC 1)',
    chapters: [
      { id: '11-urd-1', name: 'Hissa-e-Nasr (Sabaq)', subtopics: 'Sabaq Khulasa, Contextual Tashreeh, Character sketches' },
      { id: '11-urd-2', name: 'Hissa-e-Nazam', subtopics: 'Nazam Tashreeh, Central idea, Poet bio' },
      { id: '11-urd-3', name: 'Hissa-e-Ghazal', subtopics: 'Ghazal Tashreeh, Poetic terminology' },
      { id: '11-urd-4', name: 'Qawaid-o-Insha', subtopics: 'Mazmoon Writing, Letters, Telegrams/Applications, Idioms' },
    ]
  },
  {
    id: '11-isl',
    name: 'Islamiat',
    classNum: 11,
    description: 'FBISE Class 11 Islamiat Curriculum (1st Year HSSC 1)',
    chapters: [
      { id: '11-isl-1', name: 'Quranic Verses & Translation', subtopics: 'Surah translation, Context, Moral guidelines' },
      { id: '11-isl-2', name: 'Ahadith-e-Nabvi (PBUH)', subtopics: 'Translation, Explanation, Character development' },
      { id: '11-isl-3', name: 'Islamic Culture & Heritage', subtopics: 'Islamic values, Brotherhood, Equality, Justice' },
    ]
  },

  // ==================== CLASS 12 ====================
  {
    id: '12-bio',
    name: 'Biology',
    classNum: 12,
    description: 'FBISE Class 12 Biology Textbook (2nd Year HSSC 2)',
    chapters: [
      { id: '12-bio-1', name: 'Homeostasis', subtopics: 'Osmoregulation in plants & animals, Human excretory system, Kidney structure & Nephron, Dialysis & Transplant, Thermoregulation', isHighYield: true },
      { id: '12-bio-2', name: 'Support and Movement', subtopics: 'Human skeleton structure, Bone & Cartilage, Joints, Sliding filament theory of muscle contraction, Muscle disorders', isHighYield: true },
      { id: '12-bio-3', name: 'Coordination and Control', subtopics: 'Nervous system, Neurons & Nerve impulse transmission, Brain & Spinal cord, Endocrine glands & Hormones, Feedback mechanisms', isHighYield: true },
      { id: '12-bio-4', name: 'Reproduction', subtopics: 'Human reproductive system, Spermatogenesis & Oogenesis, Menstrual cycle, Infertility, IVF, Sexually transmitted diseases', isHighYield: true },
      { id: '12-bio-5', name: 'Growth and Development', subtopics: 'Embryonic development stages, Cleavage, Blastula, Gastrula, Neurulation, Regeneration & Abnormal development' },
      { id: '12-bio-6', name: 'Chromosomes and DNA', subtopics: 'DNA as genetic material, DNA replication mechanisms, Gene expression (Transcription & Translation), Genetic code, Mutations', isHighYield: true },
      { id: '12-bio-7', name: 'Cell Cycle & Inheritance', subtopics: 'Cell cycle regulation, Mendel laws, Incomplete dominance, Co-dominance, Sex-linked inheritance, Chromosomal aberrations', isHighYield: true },
      { id: '12-bio-8', name: 'Biotechnology', subtopics: 'Recombinant DNA technology, PCR, Gel electrophoresis, Gene therapy, Transgenic plants & animals, Human Genome Project', isHighYield: true },
      { id: '12-bio-9', name: 'Ecosystems and Environment', subtopics: 'Ecosystem structure, Energy flow, Ecological pyramids, Biogeochemical cycles, Succession, Environmental pollution & Conservation' },
      { id: '12-bio-10', name: 'Evolution', subtopics: 'Darwin theory of natural selection, Evidence for evolution, Hardy-Weinberg law, Speciation & Extinction' },
    ]
  },
  {
    id: '12-chem',
    name: 'Chemistry',
    classNum: 12,
    description: 'FBISE Class 12 Chemistry Textbook (2nd Year HSSC 2)',
    chapters: [
      { id: '12-chem-1', name: 'Periodic Periodicity', subtopics: 'Periodic classification, Atomic properties trends, s-Block & p-Block elements, Hydrides, Oxides & Halides reactivity', isHighYield: true },
      { id: '12-chem-2', name: 's-Block Elements', subtopics: 'Group IA and IIA metals, Chemical properties, Diagonal relationships, Commercial uses of Sodium & Calcium compounds' },
      { id: '12-chem-3', name: 'Group IIIA and IVA Elements', subtopics: 'Boron, Aluminum, Carbon, Silicon, Semiconductors, Borax, Silicates and Silicone polymers' },
      { id: '12-chem-4', name: 'Group VA and VIA Elements', subtopics: 'Nitrogen compounds (Ammonia, Nitric acid), Phosphorus allotropes, Sulfur compounds (Sulfuric acid contact process)' },
      { id: '12-chem-5', name: 'Halogens & Noble Gases', subtopics: 'Group VIIA properties, Bleaching powder, Commercial applications, Noble gases compounds' },
      { id: '12-chem-6', name: 'Transition Elements', subtopics: 'd-Block electron configurations, Variable oxidation states, Coordination complexes, Nomenclature, Catalytic properties', isHighYield: true },
      { id: '12-chem-7', name: 'Fundamental Principles of Organic Chemistry', subtopics: 'Organic compounds, Functional groups, Isomerism (Structural & Cis-Trans), Cracking, Reforming, Hybridization', isHighYield: true },
      { id: '12-chem-8', name: 'Hydrocarbons', subtopics: 'Alkanes, Alkenes, Alkynes, Benzene structure, Electrophilic substitution mechanisms (Nitration, Halogenation, Sulfonation)', isHighYield: true },
      { id: '12-chem-9', name: 'Alkyl Halides', subtopics: 'SN1 and SN2 nucleophilic substitution mechanisms, E1 and E2 elimination reactions, Grignard reagent synthesis & reactions', isHighYield: true },
      { id: '12-chem-10', name: 'Alcohols, Phenols and Ethers', subtopics: 'Preparation methods, Hydrogen bonding, Lucas test, Phenol acidic nature, Esterification, Ether synthesis', isHighYield: true },
      { id: '12-chem-11', name: 'Aldehydes and Ketones', subtopics: 'Nucleophilic addition reactions, Tollens & Fehling tests, Aldol condensation, Cannizzaro reaction, Reduction', isHighYield: true },
      { id: '12-chem-12', name: 'Carboxylic Acids & Derivatives', subtopics: 'Acidity factors, Esterification, Acid chlorides, Acid anhydrides, Amides, Decarboxylation' },
      { id: '12-chem-13', name: 'Biochemistry & Polymers', subtopics: 'Macromolecules, Proteins, Carbohydrates, DNA/RNA, Addition & Condensation polymers, Synthetic fibers' },
    ]
  },
  {
    id: '12-phy',
    name: 'Physics',
    classNum: 12,
    description: 'FBISE Class 12 Physics Textbook (2nd Year HSSC 2)',
    chapters: [
      { id: '12-phy-1', name: 'Electrostatics', subtopics: 'Coulomb law, Electric field intensity, Gauss law applications, Electric potential, Parallel plate capacitors, Dielectric effect', isHighYield: true },
      { id: '12-phy-2', name: 'Current Electricity', subtopics: 'Ohm law, Resistivity & Temperature coefficient, Kirchhoff laws (KVL & KCL), Wheatstone bridge, Potentiometer', isHighYield: true },
      { id: '12-phy-3', name: 'Electromagnetism', subtopics: 'Magnetic force on moving charge/current wire, Ampere law, Lorentz force, e/m ratio of electron, Galvanometer conversion to Ammeter/Voltmeter', isHighYield: true },
      { id: '12-phy-4', name: 'Electromagnetic Induction', subtopics: 'Faraday law, Lenz law, Induced EMF, Self & Mutual induction, AC Generator, Step-up & Step-down Transformers', isHighYield: true },
      { id: '12-phy-5', name: 'Alternating Current', subtopics: 'Peak and RMS values, AC through Resistor, Inductor & Capacitor, RLC series resonance circuit, Power factor & Choke', isHighYield: true },
      { id: '12-phy-6', name: 'Physics of Solids', subtopics: 'Classification of solids, Elasticity, Stress-strain curve, Strain energy, Energy band theory, Superconductors', isHighYield: true },
      { id: '12-phy-7', name: 'Electronics', subtopics: 'p-n junction diode, Rectification (Half & Full wave), Transistor biasing & Amplifier, Operational Amplifier (Inverting & Non-inverting)', isHighYield: true },
      { id: '12-phy-8', name: 'Dawn of Modern Physics', subtopics: 'Inertial & Non-inertial frames, Special relativity postulates, Quantum theory, Photoelectric effect, Compton effect, De Broglie hypothesis', isHighYield: true },
      { id: '12-phy-9', name: 'Atomic Spectra', subtopics: 'Bohr hydrogen atom model, Spectral series (Lyman, Balmer, Paschen), De Broglie interpretation, X-ray production & Lasers', isHighYield: true },
      { id: '12-phy-10', name: 'Nuclear Physics', subtopics: 'Atomic nucleus composition, Mass defect & Binding energy, Radioactivity decay law, Half-life, Nuclear fission and fusion reactors', isHighYield: true },
    ]
  },
  {
    id: '12-math',
    name: 'Mathematics',
    classNum: 12,
    description: 'FBISE Class 12 Mathematics Curriculum (2nd Year HSSC 2)',
    chapters: [
      { id: '12-math-1', name: 'Functions and Limits', subtopics: 'Types of functions, Domain & Range, Limits of functions, Sandwich theorem, Continuity & Discontinuity', isHighYield: true },
      { id: '12-math-2', name: 'Differentiation', subtopics: 'Derivatives definition, Power rule, Product & Quotient rules, Chain rule, Implicit differentiation, Derivatives of Trig & Inverse Trig functions', isHighYield: true },
      { id: '12-math-3', name: 'Integration', subtopics: 'Indefinite integrals, Integration formulas, Integration by substitution, Integration by parts, Partial fractions integration, Definite integrals & Area', isHighYield: true },
      { id: '12-math-4', name: 'Introduction to Analytic Geometry', subtopics: 'Distance formula, Slope of line, Equations of straight line, Parallel & Perpendicular lines, Distance of point from line', isHighYield: true },
      { id: '12-math-5', name: 'Linear Inequalities & Linear Programming', subtopics: 'Linear inequalities in two variables, Feasible region, Corner points, Maximization & Minimization', isHighYield: true },
      { id: '12-math-6', name: 'Conic Sections', subtopics: 'Circle equation, Parabola, Ellipse, Hyperbola standard equations, Foci, Directrix, Tangents & Normals', isHighYield: true },
      { id: '12-math-7', name: 'Vectors', subtopics: '3D Vector algebra, Direction cosines, Scalar dot product, Vector cross product, Scalar triple product, Work done & Torque', isHighYield: true },
    ]
  },
  {
    id: '12-cs',
    name: 'Computer Science',
    classNum: 12,
    description: 'FBISE Class 12 Computer Science Curriculum (2nd Year HSSC 2)',
    chapters: [
      { id: '12-cs-1', name: 'Data Structures', subtopics: 'Arrays, Stacks (Push/Pop), Queues (Enqueue/Dequeue), Linked lists, Trees, Searching & Sorting algorithms', isHighYield: true },
      { id: '12-cs-2', name: 'Object-Oriented Programming (OOP)', subtopics: 'Classes & Objects, Constructors & Destructors, Encapsulation, Inheritance, Polymorphism', isHighYield: true },
      { id: '12-cs-3', name: 'Database Management Systems (DBMS)', subtopics: 'DBMS concepts, Relational model, Entity-Relationship (ER) diagrams, Normalization (1NF, 2NF, 3NF)', isHighYield: true },
      { id: '12-cs-4', name: 'Structured Query Language (SQL)', subtopics: 'SQL data types, DDL commands (CREATE, ALTER), DML commands (SELECT, INSERT, UPDATE, DELETE), Joins & Clauses', isHighYield: true },
      { id: '12-cs-5', name: 'Computer Networks and Security', subtopics: 'OSI 7-Layer model, TCP/IP protocol suite, IP addressing & Subnetting, Network security, Cryptography, Firewalls', isHighYield: true },
    ]
  },
  {
    id: '12-eng',
    name: 'English',
    classNum: 12,
    description: 'FBISE Class 12 English Curriculum (2nd Year HSSC 2)',
    chapters: [
      { id: '12-eng-1', name: 'Prose & Modern Essays', subtopics: 'Modern essays, Scientific perspectives, Biographies, Critical comprehension, Vocabulary' },
      { id: '12-eng-2', name: 'Poetry & Literary Criticism', subtopics: 'Modern poems, Paraphrasing, Tone & Mood analysis, Figurative language' },
      { id: '12-eng-3', name: 'Novel / Drama', subtopics: 'Novel plot analysis, Major character developments, Themes, Setting & Conflict' },
      { id: '12-eng-4', name: 'Advanced Grammar & Error Correction', subtopics: 'Sentence error spotting, Parallelism, Dangling modifiers, Punctuation rules', isHighYield: true },
      { id: '12-eng-5', name: 'Direct/Indirect Speech & Active/Passive', subtopics: 'Advanced narration transformation, Complex sentence passivization', isHighYield: true },
      { id: '12-eng-6', name: 'Essay Writing & Official Communication', subtopics: 'Discursive & Persuasive essays, Official letters, Press releases, Proposals' },
    ]
  },
  {
    id: '12-urd',
    name: 'Urdu',
    classNum: 12,
    description: 'FBISE Class 12 Urdu Curriculum (2nd Year HSSC 2)',
    chapters: [
      { id: '12-urd-1', name: 'Hissa-e-Nasr (Sabaq)', subtopics: 'Sabaq Khulasa, Contextual Tashreeh, Character studies' },
      { id: '12-urd-2', name: 'Hissa-e-Nazam', subtopics: 'Nazam Ash\'ar Tashreeh, Markazi Khayal, Poet style' },
      { id: '12-urd-3', name: 'Hissa-e-Ghazal', subtopics: 'Ghazaliat Tashreeh, Poetic terms' },
      { id: '12-urd-4', name: 'Qawaid-o-Insha', subtopics: 'Mazmoon Nigarai, Khat/Darkhwast, Khutoot, Ap-Beeti' },
    ]
  },
  {
    id: '12-isl',
    name: 'Islamiat',
    classNum: 12,
    description: 'FBISE Class 12 Islamiat Curriculum (2nd Year HSSC 2)',
    chapters: [
      { id: '12-isl-1', name: 'Selected Surahs & Verses', subtopics: 'Translation, Context, Social and moral laws' },
      { id: '12-isl-2', name: 'Ahadith-e-Nabvi (PBUH)', subtopics: 'Translation, Practical life guidance' },
      { id: '12-isl-3', name: 'Islam and Science / Modern World', subtopics: 'Scientific outlook of Islam, Human rights, Environmental care' },
    ]
  }
];

export function getFBISEChaptersForSubject(classNum: BoardClass, subjectName: string): FBISEChapter[] {
  const normSub = subjectName.toLowerCase().trim();
  const found = FBISE_SYLLABUS_DATA.find((item) => {
    if (String(item.classNum) !== String(classNum)) return false;
    const itemSub = item.name.toLowerCase().trim();
    if (itemSub === normSub) return true;
    if (normSub.includes('bio') && itemSub.includes('bio')) return true;
    if (normSub.includes('chem') && itemSub.includes('chem')) return true;
    if (normSub.includes('phys') && itemSub.includes('phys')) return true;
    if (normSub.includes('math') && itemSub.includes('math')) return true;
    if ((normSub.includes('comp') || normSub.includes('cs')) && (itemSub.includes('comp') || itemSub.includes('cs'))) return true;
    if (normSub.includes('eng') && itemSub.includes('eng')) return true;
    if (normSub.includes('urd') && itemSub.includes('urd')) return true;
    if (normSub.includes('isl') && itemSub.includes('isl')) return true;
    if (normSub.includes('pak') && itemSub.includes('pak')) return true;
    return false;
  });

  if (found) return found.chapters;

  // Fallback if specific combination not found
  return [
    { id: 'gen-1', name: `${subjectName} Chapter 1: Core Fundamentals`, subtopics: 'Fundamental concepts, Core definitions, Basic principles, Key formulas' },
    { id: 'gen-2', name: `${subjectName} Chapter 2: Theoretical Models`, subtopics: 'Theoretical structures, Applications, Key equations, Models' },
    { id: 'gen-3', name: `${subjectName} Chapter 3: Advanced Applications`, subtopics: 'Problem solving, Practical scenarios, Exam standard MCQs' },
  ];
}

export function parseSubtopicsList(subtopicsStr: string): string[] {
  if (!subtopicsStr) return [];
  const parts: string[] = [];
  let current = '';
  let parenCount = 0;
  for (let i = 0; i < subtopicsStr.length; i++) {
    const char = subtopicsStr[i];
    if (char === '(') parenCount++;
    else if (char === ')') parenCount--;

    if ((char === ',' || char === ';') && parenCount === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
