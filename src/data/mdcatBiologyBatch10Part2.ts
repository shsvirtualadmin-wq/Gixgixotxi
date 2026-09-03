import { Question } from '../types';

export const MDCAT_BIOLOGY_BATCH10_PART2: Question[] = [
  // --- Homeostasis (9 MCQs: 67 to 75) ---
  {
    id: 'mdcat-b10-bio-67',
    q: 'In the mammalian liver, the urea cycle (ornithine cycle) disposes of toxic free ammonia derived from amino acid deamination by condensing it with carbon dioxide into urea. What is the initial rate-limiting enzyme localized in the mitochondrial matrix?',
    options: [
      'Carbamoyl phosphate synthetase I (CPS-I)',
      'Ornithine transcarbamylase',
      'Argininosuccinate synthetase',
      'Arginase'
    ],
    correct: 0,
    topic: 'Excretion - Urea Cycle and Carbamoyl Phosphate Synthetase I',
    chapter: 'Homeostasis',
    explain: 'CPS-I catalyzes the condensation of NH4⁺ and HCO3⁻ using 2 ATP to form carbamoyl phosphate inside liver mitochondria. It is allosterically activated by N-acetylglutamate (NAG) and represents the obligatory rate-limiting pace-maker of the urea cycle.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-68',
    q: 'Antidiuretic hormone (ADH / vasopressin), synthesized in the hypothalamus and secreted by the posterior pituitary, promotes water reabsorption in the renal collecting ducts primarily by:',
    options: [
      'Inducing the exocytic insertion of Aquaporin-2 (AQP2) water channels into the apical membrane of principal cells',
      'Directly opening sodium-potassium ATPases in the loop of Henle',
      'Constricting the afferent glomerular arterioles to reduce filtration',
      'Inhibiting aldosterone synthesis in the adrenal cortex'
    ],
    correct: 0,
    topic: 'Osmoregulation - Mechanism of Action of ADH and Aquaporin-2',
    chapter: 'Homeostasis',
    explain: 'ADH binds to basolateral V2 G-protein coupled receptors on principal cells, activating adenylyl cyclase to increase cAMP. Protein kinase A then phosphorylates vesicular Aquaporin-2 channels, mobilizing them to fuse with the apical membrane and increasing water permeability.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-69',
    q: 'Which physiological homeostatic response is triggered in human cutaneous circulation when the core body temperature drops below 36.5°C?',
    options: [
      'Sympathetic vasoconstriction of precapillary dermal arterioles and arteriovenous anastomoses, shunting blood to deep core vessels',
      'Direct vasodilation of superficial dermal capillary loops to maximize convective heat loss',
      'Inhibition of piloerection muscles to flatten body hair',
      'Activation of eccrine sweat glands to lower peripheral skin temperature'
    ],
    correct: 0,
    topic: 'Thermoregulation - Cutaneous Vasoconstriction during Cold Stress',
    chapter: 'Homeostasis',
    explain: 'Cold stress stimulates posterior hypothalamic thermoregulatory centers, increasing sympathetic α1-adrenergic outflow to dermal arterioles and AV shunts. Vasoconstriction reduces skin blood flow from ~2.5 L/min down to ~50 mL/min, minimizing radiant and convective heat dissipation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-70',
    q: 'Marine bony fishes (teleosts) maintain internal osmolarity hypotonic to seawater (~300 mOsm/L vs ~1000 mOsm/L). How do they prevent severe dehydration?',
    options: [
      'Drinking large quantities of seawater and actively eliminating excess monovalent ions (Na⁺, Cl⁻) through chloride cells in their gills',
      'Retaining high concentrations of urea and TMAO in their blood like marine elasmobranchs',
      'Producing voluminous dilute urine to flush out dietary salts',
      'Absorbing pure water by active osmosis across their impermeable scales'
    ],
    correct: 0,
    topic: 'Osmoregulation - Marine Teleosts vs Freshwater Teleosts',
    chapter: 'Homeostasis',
    explain: 'Marine teleosts drink seawater to replace osmotic water lost across gills and body surfaces. Specialized gill chloride cells (mitochondria-rich cells) actively secrete excess Na⁺ and Cl⁻ into seawater, while their kidneys excrete divalent ions (Mg²⁺, SO4²⁻) in minimal, highly concentrated urine.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-71',
    q: 'In the juxtaglomerular apparatus of the kidney, what stimulus triggers the granular (juxtaglomerular) cells of the afferent arteriole to release the proteolytic enzyme renin?',
    options: [
      'Decreased renal perfusion pressure and diminished NaCl delivery sensed by the macula densa',
      'Elevated mean systemic arterial blood pressure exceeding 150 mmHg',
      'High extracellular sodium concentration in the distal convoluted tubule',
      'Excessive expansion of intravascular circulating plasma volume'
    ],
    correct: 0,
    topic: 'Renal Homeostasis - Renin-Angiotensin-Aldosterone System (RAAS) Activation',
    chapter: 'Homeostasis',
    explain: 'Renin release is stimulated by: (1) decreased stretch in afferent arteriolar baroreceptors, (2) decreased NaCl delivery sensed by macula densa cells in the early distal tubule, and (3) increased sympathetic β1-adrenergic stimulation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-72',
    q: 'What is the primary nitrogenous excretory end-product in terrestrial birds, reptiles, and insects, and why is this an evolutionary adaptation for arid terrestrial life?',
    options: [
      'Uric acid; it is almost insoluble in water, non-toxic, and excreted as a semi-solid paste with minimal water loss',
      'Ammonia; it requires the least metabolic ATP to synthesize',
      'Urea; it can be stored indefinitely in tissues without altering osmotic balance',
      'Creatinine; it is rapidly filtered across the glomerulus without requiring reabsorption'
    ],
    correct: 0,
    topic: 'Excretion - Uricotelic Adaptation in Birds and Reptiles',
    chapter: 'Homeostasis',
    explain: 'Uricotelic animals (birds, reptiles, terrestrial snails, insects) convert toxic ammonia into uric acid. Because uric acid has low water solubility (~0.06 g/L), it precipitates out of solution and is eliminated as a paste with negligible water loss (saving ~400 mL water per gram of nitrogen compared to ammonia).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-73',
    q: 'In human thermoregulation, non-shivering thermogenesis in brown adipose tissue (BAT) generates heat without producing ATP through the uncoupling action of which mitochondrial inner membrane protein?',
    options: [
      'Thermogenin (Uncoupling Protein 1, UCP-1)',
      'Cytochrome c oxidase',
      'ATP synthase F1 headpiece',
      'Voltage-gated potassium channel'
    ],
    correct: 0,
    topic: 'Thermoregulation - Brown Adipose Tissue and Thermogenin (UCP-1)',
    chapter: 'Homeostasis',
    explain: 'Brown adipocytes express thermogenin (UCP-1) in their inner mitochondrial membrane. UCP-1 provides an alternate pathway for protons to re-enter the matrix, dissipating the proton electrochemical gradient directly as heat instead of driving ATP synthase.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-74',
    q: 'The proximal convoluted tubule (PCT) of the human nephron is responsible for obligate reabsorption of what percentage of filtered glucose and amino acids under normal physiological conditions?',
    options: [
      '100% of filtered glucose and amino acids (via Na⁺-dependent secondary active cotransporters like SGLT2)',
      'Exactly 50%, with the remainder reabsorbed in the collecting duct',
      'Only 25%, since glucose is predominantly metabolized by podocytes',
      '0%, because glucose is too large to cross the glomerular filtration barrier'
    ],
    correct: 0,
    topic: 'Renal Physiology - Tubular Reabsorption of Glucose and SGLT2 in PCT',
    chapter: 'Homeostasis',
    explain: 'In healthy individuals, 100% of filtered glucose is actively reabsorbed in the proximal convoluted tubule via sodium-glucose cotransporters (SGLT2 in early PCT, SGLT1 in late PCT) paired with basolateral GLUT2 uniporters, unless blood glucose exceeds the renal threshold (~180-200 mg/dL).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-75',
    q: 'Aldosterone, secreted by the zona glomerulosa of the adrenal cortex in response to angiotensin II or hyperkalemia, acts on renal principal cells to:',
    options: [
      'Increase apical Na⁺ reabsorption via ENaC channels and stimulate basolateral Na⁺/K⁺-ATPase pumps, coupled to K⁺ excretion',
      'Promote massive calcium excretion in the loop of Henle',
      'Inhibit aquaporin synthesis to dilute the urine',
      'Stimulate glucose excretion in distal tubules'
    ],
    correct: 0,
    topic: 'Endocrine Osmoregulation - Aldosterone Action on Principal Cells',
    chapter: 'Homeostasis',
    explain: 'Aldosterone binds intracellular mineralocorticoid receptors in principal cells, upregulating epithelial sodium channels (ENaC) on the apical membrane and Na⁺/K⁺-ATPases on the basolateral membrane. This drives sodium retention (and secondary water reabsorption) while enhancing potassium excretion.',
    difficulty: 'Medium',
    subject: 'Biology'
  },

  // --- Gaseous Exchange (9 MCQs: 76 to 84) ---
  {
    id: 'mdcat-b10-bio-76',
    q: 'What is the primary physical mechanism of gas exchange across the alveolar-capillary respiratory membrane in the human lungs?',
    options: [
      'Simple passive diffusion driven by partial pressure gradients according to Fick\'s law of diffusion',
      'Active transport mediated by ATP-driven gas permeases',
      'Facilitated diffusion through clathrin-mediated endocytic vesicles',
      'Bulk convective solvent drag through tight junctions'
    ],
    correct: 0,
    topic: 'Gas Exchange - Fick\'s Law of Passive Diffusion across Alveolar Membrane',
    chapter: 'Gaseous Exchange',
    explain: 'Respiratory gas exchange (O2 and CO2) occurs strictly by simple passive diffusion down partial pressure differentials across the ultra-thin alveolar-capillary barrier (~0.2 to 0.5 μm), as governed by Fick\'s law of diffusion (Rate = D × A × ΔP / T).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-77',
    q: 'Pulmonary surfactant, secreted by alveolar type II epithelial cells (pneumocytes), prevents alveolar atelectasis (end-expiratory collapse) primarily by:',
    options: [
      'Lowering the surface tension of the aqueous alveolar lining fluid proportionally as alveolar radius decreases (Laplace\'s law)',
      'Generating an osmotic pressure gradient that draws air into the alveoli',
      'Digesting foreign bacterial proteins in the alveolar lumen',
      'Acting as a sticky adhesive that binds hemoglobin molecules'
    ],
    correct: 0,
    topic: 'Respiratory Physiology - Pulmonary Surfactant and Laplace\'s Law',
    chapter: 'Gaseous Exchange',
    explain: 'According to Laplace\'s law for spheres, P = 2T / r. Without surfactant, smaller alveoli would experience higher collapsing pressure than larger ones. Surfactant (dipalmitoylphosphatidylcholine, DPPC) concentrates more densely in smaller alveoli, lowering surface tension T and stabilizing alveolar volumes.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-78',
    q: 'How is the majority (~70%) of carbon dioxide transported from peripheral tissues back to the pulmonary capillaries in human venous blood?',
    options: [
      'As bicarbonate ions (HCO3⁻) dissolved in blood plasma following conversion by intra-erythrocytic carbonic anhydrase',
      'Directly dissolved as molecular CO2 gas bubbles in plasma',
      'As carbaminohemoglobin bound to heme iron atoms',
      'Chemically esterified to plasma cholesterol molecules'
    ],
    correct: 0,
    topic: 'Gas Transport - Carbon Dioxide Transport Mechanisms in Blood',
    chapter: 'Gaseous Exchange',
    explain: 'Approximately 70% of CO2 is carried as bicarbonate (HCO3⁻) ions. In RBCs, carbonic anhydrase hydrates CO2: CO2 + H2O ⇌ H2CO3 ⇌ H⁺ + HCO3⁻. Bicarbonate is transported into plasma via the AE1 anion exchanger (chloride shift). 23% is bound as carbaminohemoglobin, and 7% is physically dissolved.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-79',
    q: 'The "chloride shift" (Hamburger phenomenon) occurs in erythrocytes traversing systemic capillary beds in order to:',
    options: [
      'Maintain electrical neutrality across the erythrocyte membrane when HCO3⁻ diffuses out into the plasma in exchange for Cl⁻',
      'Promote the binding of oxygen to deoxyhemoglobin',
      'Neutralize lactic acid produced by anaerobic skeletal muscle',
      'Prevent erythrocyte swelling in hypotonic venous plasma'
    ],
    correct: 0,
    topic: 'Gas Transport - Chloride Shift (Hamburger Phenomenon)',
    chapter: 'Gaseous Exchange',
    explain: 'As bicarbonate (HCO3⁻) ions accumulate inside erythrocytes in peripheral capillaries, they diffuse out into plasma down their concentration gradient via the AE1 band 3 antiporter. To maintain electrical neutrality, chloride ions (Cl⁻) move from the plasma into the erythrocyte.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-80',
    q: 'A rightward shift of the oxyhemoglobin dissociation curve (the Bohr effect) signifies reduced affinity of hemoglobin for oxygen, facilitating O2 unloading to metabolically active tissues. Which combination of physiological factors produces this rightward shift?',
    options: [
      'Increased partial pressure of CO2 (PCO2), increased [H⁺] (decreased pH), elevated temperature, and increased 2,3-BPG concentration',
      'Decreased PCO2, increased pH, decreased temperature, and reduced 2,3-BPG',
      'Decreased PCO2 and hypothermia during resting sleep',
      'Hyperventilation-induced respiratory alkalosis'
    ],
    correct: 0,
    topic: 'Oxygen Dissociation Curve - Bohr Effect and Rightward Shift Factors',
    chapter: 'Gaseous Exchange',
    explain: 'A rightward shift (Bohr effect) lowers Hb affinity for O2, promoting oxygen delivery to tissues. Factors causing this include: elevated PCO2, increased [H⁺] (lower pH), elevated temperature, and increased 2,3-bisphosphoglycerate (2,3-BPG), all of which stabilize the T (taut/deoxygenated) conformation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-81',
    q: 'Under normal resting conditions at sea level, the central chemoreceptors located on the ventrolateral surface of the medulla oblongata regulate the primary respiratory drive by responding to changes in:',
    options: [
      'The hydrogen ion concentration [H⁺] of the cerebrospinal fluid (CSF) generated by CO2 diffusing across the blood-brain barrier',
      'Arterial oxygen partial pressure (PaO2) below 95 mmHg',
      'Blood hemoglobin saturation percentage in systemic veins',
      'Atmospheric humidity detected in the nasal mucosa'
    ],
    correct: 0,
    topic: 'Respiratory Control - Central Chemoreceptors and Arterial PCO2 Regulation',
    chapter: 'Gaseous Exchange',
    explain: 'Central chemoreceptors in the medulla are sensitive to [H⁺] in brain interstitial fluid and CSF. Because the blood-brain barrier is impermeable to H⁺ but freely permeable to lipophilic CO2, arterial CO2 diffuses across, forming carbonic acid and protons that stimulate chemoreceptors to increase ventilation.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-82',
    q: 'In the human respiratory tree, which structural zone represents the transition from the purely conducting anatomical dead space to the actual gas-exchanging respiratory zone?',
    options: [
      'Respiratory bronchioles (where alveoli first appear budding along the wall)',
      'Terminal bronchioles',
      'Secondary (lobar) bronchi',
      'Segmental tertiary bronchi'
    ],
    correct: 0,
    topic: 'Respiratory Anatomy - Conducting Zone vs Respiratory Zone',
    chapter: 'Gaseous Exchange',
    explain: 'The conducting zone terminates at the terminal bronchioles (generations 0 to 16, anatomical dead space ~150 mL). The respiratory zone begins at generation 17 with the respiratory bronchioles, which feature outpocketing alveoli and transition into alveolar ducts and alveolar sacs.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-83',
    q: 'Carbon monoxide (CO) inhalation is lethal even at low concentrations because its affinity for hemoglobin is approximately 200-250 times greater than that of oxygen, forming:',
    options: [
      'Carboxyhemoglobin, which blocks O2 binding and shifts the remaining oxyhemoglobin curve to the left, preventing tissue O2 release',
      'Methemoglobin, which oxidizes ferrous iron to ferric iron',
      'Carbaminohemoglobin, which permanently precipitates in renal tubules',
      'Sulfhemoglobin, which causes erythrocyte hemolysis'
    ],
    correct: 0,
    topic: 'Respiratory Pathology - Carbon Monoxide Poisoning and Carboxyhemoglobin',
    chapter: 'Gaseous Exchange',
    explain: 'CO binds with ~240-fold greater affinity than O2 to heme iron, forming carboxyhemoglobin (COHb). This locks bound subunits in the relaxed R-state, shifting the remaining O2 dissociation curve sharply to the left and severely impairing tissue oxygen release (cellular hypoxia).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-84',
    q: 'During quiet resting inhalation in humans, which active muscular contraction is responsible for approximately 75% of the inspiratory air volume entering the lungs?',
    options: [
      'Contraction and downward flattening of the dome-shaped diaphragm',
      'Contraction of the internal intercostal muscles',
      'Contraction of the rectus abdominis muscles',
      'Relaxation of the sternocleidomastoid muscles'
    ],
    correct: 0,
    topic: 'Respiratory Mechanics - Muscles of Normal Quiet Inhalation',
    chapter: 'Gaseous Exchange',
    explain: 'Normal resting inspiration is an active process driven predominantly (~75%) by contraction of the diaphragm, which flattens downward by 1-2 cm, expanding the vertical dimension of the thoracic cavity. Contraction of the external intercostal muscles accounts for the remaining ~25%.',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Coordination and Control (9 MCQs: 85 to 93) ---
  {
    id: 'mdcat-b10-bio-85',
    q: 'What is the molecular basis of the resting membrane potential (approximately -70 mV) in a mammalian myelinated axon?',
    options: [
      'High resting membrane permeability to K⁺ via non-gated leak channels, combined with the electrogenic action of the 3 Na⁺ out / 2 K⁺ in ATPase pump',
      'Continuous influx of sodium ions through open voltage-gated Na⁺ channels',
      'Active extrusion of intracellular proteins into the extracellular fluid',
      'Complete impermeability of the plasma membrane to all inorganic ions'
    ],
    correct: 0,
    topic: 'Nerve Impulse - Molecular Basis of Resting Membrane Potential',
    chapter: 'Coordination and Control',
    explain: 'The neuronal resting potential (-70 mV) is established predominantly by K⁺ leak channels, allowing K⁺ to diffuse down its chemical gradient out of the cell until its electrical gradient balances it (Goldman equation). The electrogenic Na⁺/K⁺-ATPase (3 Na⁺ pumped out for 2 K⁺ pumped in) maintains these ion gradients.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-86',
    q: 'During the depolarizing upstroke of a neuronal action potential, what event is responsible for the rapid, regenerative reversal of membrane polarity toward +35 mV?',
    options: [
      'The opening of voltage-gated Na⁺ channels, permitting a massive influx of Na⁺ down its electrochemical gradient',
      'The opening of voltage-gated K⁺ channels, driving rapid K⁺ influx',
      'Active pumping of Ca²⁺ out of the axon into the synaptic cleft',
      'The opening of ligand-gated chloride channels causing hyperpolarization'
    ],
    correct: 0,
    topic: 'Nerve Impulse - Action Potential Depolarization Phase',
    chapter: 'Coordination and Control',
    explain: 'Depolarization beyond threshold (~ -55 mV) causes rapid opening of m-activation gates on voltage-gated Na⁺ channels. This positive feedback loop (Hodgkin cycle) leads to massive inward Na⁺ current until membrane potential approaches the sodium equilibrium potential (~+35 to +40 mV).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-87',
    q: 'Saltatory conduction in myelinated axons increases the velocity of action potential propagation by factors of 10-100 because action potentials:',
    options: [
      'Regenerate exclusively at unmyelinated nodes of Ranvier where voltage-gated Na⁺ channels are densely clustered',
      'Travel continuously through the insulating lipid bilayer of the myelin sheath',
      'Skip across synaptic junctions without requiring neurotransmitter vesicle release',
      'Rely exclusively on passive electron flow along the external myelin wrap'
    ],
    correct: 0,
    topic: 'Nerve Impulse - Saltatory Conduction and Nodes of Ranvier',
    chapter: 'Coordination and Control',
    explain: 'Myelin acts as an electrical insulator that increases membrane resistance and decreases capacitance. Electrotonic current spreads rapidly beneath the myelin sheath, depolarizing the membrane only at the unmyelinated nodes of Ranvier, where voltage-gated Na⁺ channels are clustered at high density (~10,000/μm²).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-88',
    q: 'At a chemical synapse, the arrival of an action potential at the presynaptic terminal triggers neurotransmitter exocytosis by directly opening:',
    options: [
      'Voltage-gated calcium (Ca²⁺) channels, allowing Ca²⁺ influx that interacts with synaptotagmin on SNARE vesicle complexes',
      'Voltage-gated chloride channels causing terminal repolarization',
      'Ligand-gated sodium channels on the presynaptic terminal',
      'Proton pumps that acidify the synaptic cleft'
    ],
    correct: 0,
    topic: 'Synaptic Transmission - Role of Voltage-Gated Calcium Channels and Exocytosis',
    chapter: 'Coordination and Control',
    explain: 'Terminal depolarization opens N- and P/Q-type voltage-gated Ca²⁺ channels. Calcium rushes inward down its 10,000-fold concentration gradient, binding to the vesicle sensor synaptotagmin. This triggers SNARE complexes (synaptobrevin, syntaxin, SNAP-25) to fuse vesicles with the presynaptic membrane, releasing neurotransmitter.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-89',
    q: 'Which lobe of the human cerebral cortex houses the primary motor cortex (precentral gyrus) and Broca\'s motor speech area?',
    options: [
      'Frontal lobe',
      'Parietal lobe',
      'Temporal lobe',
      'Occipital lobe'
    ],
    correct: 0,
    topic: 'Central Nervous System - Functional Localization in Cerebral Cortex',
    chapter: 'Coordination and Control',
    explain: 'The frontal lobe contains the precentral gyrus (primary motor cortex, Brodmann area 4), the premotor cortex, the prefrontal association cortex (executive function), and Broca\'s motor speech area (Brodmann areas 44 and 45 in the dominant hemisphere).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-90',
    q: 'The hypothalamus exerts master neuroendocrine control over the anterior pituitary gland (adenohypophysis) via which vascular transport route?',
    options: [
      'The hypophyseal portal system of capillaries',
      'Unbroken continuous nerve tract axons extending into the infundibular stalk',
      'The systemic circle of Willis arterial circulation',
      'Direct lymphatic drainage channels'
    ],
    correct: 0,
    topic: 'Endocrine System - Hypothalamic-Hypophyseal Portal System',
    chapter: 'Coordination and Control',
    explain: 'Hypothalamic neurosecretory neurons release releasing and inhibiting hormones (e.g., TRH, CRH, GnRH, GHRH) into the primary capillary plexus in the median eminence. These hormones travel via the hypophyseal portal venules directly to the secondary capillary plexus in the anterior pituitary.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-91',
    q: 'Which endocrine hormone produced by the parafollicular (C-cells) of the thyroid gland acts to decrease blood calcium levels by inhibiting osteoclastic bone resorption?',
    options: [
      'Calcitonin',
      'Parathyroid hormone (PTH)',
      '1,25-dihydroxycholecalciferol (Calcitriol)',
      'Thyroxine (T4)'
    ],
    correct: 0,
    topic: 'Endocrine Regulation - Calcitonin vs Parathyroid Hormone',
    chapter: 'Coordination and Control',
    explain: 'Calcitonin is a 32-amino acid peptide hormone secreted by thyroid parafollicular C-cells in response to hypercalcemia. It lowers blood Ca²⁺ levels by inhibiting osteoclast activity and stimulating renal calcium clearance, opposing the actions of parathyroid hormone (PTH).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-92',
    q: 'In the mechanism of action of peptide and catecholamine hormones (e.g., epinephrine, glucagon), which intracellular second messenger is generated when the Gs protein α-subunit stimulates adenylyl cyclase?',
    options: [
      'Cyclic adenosine monophosphate (cAMP)',
      'Inositol 1,4,5-trisphosphate (IP3)',
      'Diacylglycerol (DAG)',
      'Cyclic guanosine monophosphate (cGMP)'
    ],
    correct: 0,
    topic: 'Hormone Action - G-Protein Coupled Receptor and cAMP Second Messenger',
    chapter: 'Coordination and Control',
    explain: 'Binding of hydrophilic peptide hormones or epinephrine to Gs-coupled receptors induces GTP binding to Gαs, activating membrane-bound adenylyl cyclase. Adenylyl cyclase converts ATP into cAMP, which allosterically activates Protein Kinase A (PKA) to phosphorylate metabolic enzymes.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-93',
    q: 'A patient presents with persistent hyperglycemia, central truncal obesity, "moon face", abdominal purple striae, and muscle wasting. Serum testing demonstrates chronically elevated cortisol levels that fail to suppress with low-dose dexamethasone. What is the clinical diagnosis?',
    options: [
      'Cushing\'s syndrome',
      'Addison\'s disease',
      'Graves\' disease',
      'Hashimoto\'s thyroiditis'
    ],
    correct: 0,
    topic: 'Endocrine Pathology - Cushing\'s Syndrome vs Addison\'s Disease',
    chapter: 'Coordination and Control',
    explain: 'Cushing\'s syndrome results from chronic glucocorticoid (cortisol) excess. Clinical signs include truncal adiposity, moon facies, buffalo hump, purple striae (due to collagen degradation), and hyperglycemia. Addison\'s disease is primary adrenal insufficiency (hypocortisolism).',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Support and Movement (9 MCQs: 94 to 102) ---
  {
    id: 'mdcat-b10-bio-94',
    q: 'According to the sliding filament theory of skeletal muscle contraction, what morphological change occurs to the sarcomere during active muscular shortening?',
    options: [
      'The I-band and H-zone narrow or disappear, while the width of the A-band remains strictly constant',
      'The A-band narrows, while the I-band remains constant',
      'Both the A-band and I-band lengthen significantly',
      'The Z-lines move further apart from each other'
    ],
    correct: 0,
    topic: 'Muscle Contraction - Sliding Filament Theory and Banding Patterns',
    chapter: 'Support and Movement',
    explain: 'During contraction, thin (actin) filaments slide over thick (myosin) filaments toward the M-line. Consequently, the distance between adjacent Z-lines decreases, the I-bands (actin only) and H-zones (myosin only) narrow or disappear, while the A-band (length of thick filaments) remains constant.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-95',
    q: 'In skeletal muscle, action potentials propagating down transverse tubules (T-tubules) trigger calcium release from the terminal cisternae of the sarcoplasmic reticulum by mechanical coupling between:',
    options: [
      'Dihydropyridine receptors (DHPR) in the T-tubule and Ryanodine receptors (RyR1) in the sarcoplasmic reticulum membrane',
      'Acetylcholine receptors and actin microfilaments',
      'Troponin C and calmodulin molecules',
      'Myosin light chain kinase and titin filaments'
    ],
    correct: 0,
    topic: 'Excitation-Contraction Coupling - DHPR and Ryanodine Receptors (RyR1)',
    chapter: 'Support and Movement',
    explain: 'Action potentials traversing T-tubules induce conformational changes in voltage-sensing L-type calcium channels (dihydropyridine receptors, DHPR). In skeletal muscle, DHPR is mechanically coupled directly to the ryanodine receptor (RyR1) Ca²⁺-release channel on the terminal cisternae, causing rapid Ca²⁺ efflux.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-96',
    q: 'During the cross-bridge power stroke of skeletal muscle contraction, what precise biochemical event triggers the pivoting of the myosin head and mechanical displacement of the actin filament?',
    options: [
      'The release of inorganic phosphate (Pi) from the myosin head',
      'The binding of a new ATP molecule to the empty nucleotide site',
      'The hydrolysis of ATP into ADP and inorganic phosphate',
      'The binding of calcium ions directly to the myosin neck region'
    ],
    correct: 0,
    topic: 'Cross-Bridge Cycle - Power Stroke Mechanism and Phosphate Release',
    chapter: 'Support and Movement',
    explain: 'After the energized myosin head (bearing ADP and Pi) binds actin, the release of inorganic phosphate (Pi) triggers the conformational power stroke, pulling the actin filament ~10 nm toward the M-line. ADP is subsequently released. Binding of a fresh ATP is required to dissociate the cross-bridge.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-97',
    q: 'Why does rigor mortis develop in skeletal muscles several hours following somatic death?',
    options: [
      'Intracellular ATP is completely depleted, preventing the detachment of myosin cross-bridge heads from actin active sites',
      'Lactic acid overproduction permanently lyses troponin complexes',
      'Calcium is actively sequestered back into the sarcoplasmic reticulum',
      'Myosin filaments are enzymatically degraded by lysosomal proteases'
    ],
    correct: 0,
    topic: 'Muscle Physiology - Rigor Mortis and ATP Depletion',
    chapter: 'Support and Movement',
    explain: 'Cross-bridge detachment requires the binding of a fresh ATP molecule to the myosin ATPase site. Following death, cellular ATP synthesis ceases while membrane permeability allows Ca²⁺ to diffuse into the sarcoplasm, forming cross-bridges. Lacking ATP to detach, muscles remain in a rigid state (rigor mortis).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-98',
    q: 'In the microscopic architecture of compact mammalian bone, concentric cylindrical layers of calcified bone matrix termed lamellae surround a central neurovascular channel known as the:',
    options: [
      'Haversian canal (osteon center)',
      'Volkmann\'s canal',
      'Trabecular canaliculus',
      'Epiphyseal plate'
    ],
    correct: 0,
    topic: 'Bone Histology - Compact Bone and Haversian System (Osteon)',
    chapter: 'Support and Movement',
    explain: 'The structural unit of compact bone is the osteon (Haversian system). It consists of concentric lamellae of mineralized matrix surrounding a longitudinal central Haversian canal containing blood vessels and nerve fibers. Perforating Volkmann canals run perpendicular to connect osteons.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-99',
    q: 'Which of the following bones belongs strictly to the axial skeleton of the human body rather than the appendicular skeleton?',
    options: [
      'Sternum',
      'Clavicle',
      'Scapula',
      'Pelvic ischium'
    ],
    correct: 0,
    topic: 'Skeletal System - Axial vs Appendicular Skeleton Classification',
    chapter: 'Support and Movement',
    explain: 'The human axial skeleton (80 bones) consists of the skull, vertebral column, ribs, sternum, and hyoid bone. The pectoral girdle (clavicle and scapula) and pelvic girdle (ilium, ischium, pubis) belong to the appendicular skeleton (126 bones).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-100',
    q: 'The shoulder (glenohumeral) joint and the hip joint are functional and structural examples of which class of synovial joint?',
    options: [
      'Ball-and-socket joint (permitting multiaxial rotation in all planes)',
      'Hinge joint (permitting uniaxal flexion and extension)',
      'Pivot joint (permitting pure axial rotation)',
      'Saddle joint (permitting biaxial opposition)'
    ],
    correct: 0,
    topic: 'Joints - Classification of Synovial Joints (Ball-and-Socket)',
    chapter: 'Support and Movement',
    explain: 'Ball-and-socket (spheroidal) joints consist of a globular head fitting into a cup-like socket. They are multiaxial/triaxial joints allowing flexion, extension, abduction, adduction, circumduction, and medial/lateral rotation (e.g., glenohumeral and acetabulofemoral joints).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-101',
    q: 'Tetanus toxin (tetanospasmin), produced by Clostridium tetani, induces sustained, spastic muscular contractions and lockjaw by which specific neurological mechanism?',
    options: [
      'Retrograde axonal transport to spinal motor interneurons, where it cleaves synaptobrevin to block the release of inhibitory neurotransmitters (GABA and glycine)',
      'Directly stimulating excessive acetylcholine synthesis at neuromuscular junctions',
      'Inhibiting acetylcholinesterase in the synaptic cleft',
      'Blocking voltage-gated potassium channels along motor axons'
    ],
    correct: 0,
    topic: 'Neuromuscular Pathology - Tetanospasmin and Disinhibition of Motor Neurons',
    chapter: 'Support and Movement',
    explain: 'Tetanospasmin undergoes retrograde transport into spinal cord inhibitory Renshaw interneurons. Its zinc endopeptidase light chain cleaves synaptobrevin (VAMP), blocking the exocytosis of inhibitory neurotransmitters GABA and glycine. Without inhibition, α-motor neurons fire uncontrollably, causing spastic paralysis.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-102',
    q: 'In the structure of a skeletal muscle thin filament, which protein subunit directly binds Ca²⁺ ions to initiate the conformational movement of tropomyosin away from myosin-binding sites on actin?',
    options: [
      'Troponin C (TnC)',
      'Troponin T (TnT)',
      'Troponin I (TnI)',
      'Tropomyosin'
    ],
    correct: 0,
    topic: 'Muscle Contraction - Troponin Complex Subunits (TnC, TnI, TnT)',
    chapter: 'Support and Movement',
    explain: 'The troponin complex contains three subunits: Troponin T (binds tropomyosin), Troponin I (inhibits actin-myosin interaction), and Troponin C (binds Ca²⁺). When Ca²⁺ binds to TnC, a conformational change pulls tropomyosin into the actin groove, exposing myosin-binding sites.',
    difficulty: 'Medium',
    subject: 'Biology'
  },

  // --- Reproduction (8 MCQs: 103 to 110) ---
  {
    id: 'mdcat-b10-bio-103',
    q: 'In the human female menstrual cycle, the mid-cycle surge of which pituitary gonadotropic hormone directly induces final follicular maturation and ovulation?',
    options: [
      'Luteinizing hormone (LH surge)',
      'Follicle-stimulating hormone (FSH)',
      'Human chorionic gonadotropin (hCG)',
      'Prolactin'
    ],
    correct: 0,
    topic: 'Female Reproductive System - Menstrual Cycle and the LH Surge',
    chapter: 'Reproduction',
    explain: 'Sustained high estradiol levels (>200 pg/mL for ~50 hours) from the mature Graafian follicle switch estrogen feedback from negative to positive at the hypothalamus and anterior pituitary. This triggers a massive LH surge, causing resumption of meiosis I, follicular rupture, and ovulation ~24-36 hours later.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-104',
    q: 'Spermatogenesis in the human testes occurs within the seminiferous tubules. Which somatic cells support, nourish developing germ cells, and form the blood-testis barrier via tight junctions?',
    options: [
      'Sertoli cells (sustentacular cells)',
      'Leydig cells (interstitial cells)',
      'Myoid peritubular cells',
      'Primary spermatocytes'
    ],
    correct: 0,
    topic: 'Male Reproductive System - Sertoli Cells and Blood-Testis Barrier',
    chapter: 'Reproduction',
    explain: 'Sertoli cells span from the basement membrane to the lumen of seminiferous tubules. Their continuous tight junctions form the blood-testis barrier, isolating post-meiotic haploid germ cells from the systemic immune system. Leydig cells reside in the interstitial space and produce testosterone.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-105',
    q: 'At the time of ovulation, the secondary oocyte released into the fallopian tube (oviduct) is arrested at which stage of cell division, resuming only upon fertilization by a spermatozoon?',
    options: [
      'Metaphase of Meiosis II',
      'Prophase of Meiosis I',
      'Anaphase of Meiosis I',
      'Telophase of Meiosis II'
    ],
    correct: 0,
    topic: 'Oogenesis - Meiotic Arrest at Metaphase II until Fertilization',
    chapter: 'Reproduction',
    explain: 'Human oogenesis completes meiosis I just prior to ovulation, extruding the first polar body. The secondary oocyte promptly begins meiosis II but arrests at metaphase II under the influence of cytostatic factor (CSF). Entry of a fertilizing sperm induces a Ca²⁺ wave that triggers completion of meiosis II.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-106',
    q: 'During fertilization, the cortical reaction in the oocyte prevents polyspermy (fertilization by multiple sperm) primarily by which mechanism?',
    options: [
      'Exocytosis of cortical granules releasing ovastacin and proteases that cleave ZP2 and harden the zona pellucida (slow block to polyspermy)',
      'Immediate shedding of the entire plasma membrane',
      'Rapid influx of magnesium ions that denatures sperm flagella',
      'Hyperpolarization of the vitelline envelope to -100 mV'
    ],
    correct: 0,
    topic: 'Fertilization - Cortical Reaction and Prevention of Polyspermy',
    chapter: 'Reproduction',
    explain: 'Sperm-egg fusion triggers IP3-mediated oscillatory release of intracellular Ca²⁺, stimulating exocytosis of cortical granules beneath the oolemma. Cortical enzymes cleave ZP2 and alter ZP3, hardening the zona pellucida and preventing additional spermatozoa from binding (slow block to polyspermy).',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-107',
    q: 'In human early embryogenesis, the blastocyst consists of an outer cell layer that develops into the embryonic portion of the placenta. What is this outer epithelial layer called?',
    options: [
      'Trophoblast (trophectoderm)',
      'Inner cell mass (embryoblast)',
      'Epiblast',
      'Hypoblast'
    ],
    correct: 0,
    topic: 'Embryology - Blastocyst Structure and Trophoblast',
    chapter: 'Reproduction',
    explain: 'At day 5-6 post-fertilization, the blastocyst comprises an inner cell mass (which forms the embryo proper) and an outer monolayer of trophoblast cells. The trophoblast differentiates into the syncytiotrophoblast and cytotrophoblast, which invade the endometrium to form the placenta and secrete hCG.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-108',
    q: 'Human chorionic gonadotropin (hCG) is secreted by the syncytiotrophoblast during early pregnancy. What is its primary physiological function during the first trimester?',
    options: [
      'Maintaining the corpus luteum so it continues secreting progesterone and estrogen to prevent menstruation',
      'Directly stimulating fetal lung surfactant production',
      'Triggering maternal milk ejection from alveolar mammary glands',
      'Inhibiting fetal thyroid hormone synthesis'
    ],
    correct: 0,
    topic: 'Reproductive Endocrinology - Human Chorionic Gonadotropin (hCG) Role',
    chapter: 'Reproduction',
    explain: 'hCG binds LH receptors on the corpus luteum, preventing its involution during the first 8-10 weeks of pregnancy. This ensures sustained secretion of progesterone and estrogens, maintaining the decidualized endometrium until the placenta assumes endocrine autonomy (luteal-placental shift).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-109',
    q: 'In angiosperms (flowering plants), double fertilization involves two separate nuclear fusion events. What are these two events and their respective products?',
    options: [
      'One sperm nucleus fuses with the egg cell to form a diploid zygote (2n), while the second sperm fuses with the diploid central cell secondary nucleus to form a triploid endosperm (3n)',
      'Two sperm nuclei fuse with two separate eggs to form fraternal twin embryos',
      'One sperm nucleus fuses with a synergid to form the seed coat, and one fuses with the antipodal cell',
      'One sperm nucleus fertilizes the stigma, while the other fertilizes the style'
    ],
    correct: 0,
    topic: 'Plant Reproduction - Double Fertilization and Triploid Endosperm Formation',
    chapter: 'Reproduction',
    explain: 'Double fertilization is unique to angiosperms. The pollen tube delivers two haploid sperm: one fertilizes the haploid egg to form the diploid zygote (2n), while the second fertilizes the binucleate central cell (polar nuclei) to generate the triploid nutritive endosperm tissue (3n).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-110',
    q: 'Which sexually transmitted infection (STI) is caused by the spirochete bacterium Treponema pallidum, initially presenting with a painless genital ulcer (chancre) during its primary stage?',
    options: [
      'Syphilis',
      'Gonorrhea',
      'Chlamydia trachomatis',
      'Genital herpes (HSV-2)'
    ],
    correct: 0,
    topic: 'Sexually Transmitted Infections - Syphilis (Treponema pallidum)',
    chapter: 'Reproduction',
    explain: 'Syphilis is caused by Treponema pallidum. Primary syphilis presents with a solitary, painless, indurated ulcer (chancre) at the inoculation site. Secondary syphilis presents with a diffuse maculopapular rash (including palms/soles) and condyloma lata, while tertiary syphilis can involve neurosyphilis and gummas.',
    difficulty: 'Medium',
    subject: 'Biology'
  },

  // --- Genetics (8 MCQs: 111 to 118) ---
  {
    id: 'mdcat-b10-bio-111',
    q: 'In a classical Mendelian dihybrid cross between two individuals heterozygous for two independently assorting unlinked genes (AaBb × AaBb), what is the expected phenotypic ratio in the F2 progeny assuming complete dominance?',
    options: [
      '9 : 3 : 3 : 1',
      '1 : 2 : 1',
      '3 : 1',
      '12 : 3 : 1'
    ],
    correct: 0,
    topic: 'Mendelian Genetics - Dihybrid Cross and Independent Assortment',
    chapter: 'Genetics',
    explain: 'By Mendel\'s law of independent assortment, combining the two independent monohybrid 3:1 phenotypic ratios (3/4 dominant, 1/4 recessive) yields: (3/4 A + 1/4 a)(3/4 B + 1/4 b) = 9/16 A_B_ : 3/16 A_bb : 3/16 aaB_ : 1/16 aabb (a 9:3:3:1 phenotypic ratio).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-112',
    q: 'The ABO blood group system in humans exhibits which genetic phenomenon when an individual inherits the IA allele from one parent and the IB allele from the other parent?',
    options: [
      'Codominance (both A and B antigens are simultaneously and fully expressed on the red blood cell surface)',
      'Incomplete dominance (yielding an intermediate hybrid antigen)',
      'Recessive epistasis',
      'Pleiotropy'
    ],
    correct: 0,
    topic: 'Non-Mendelian Genetics - Codominance in ABO Blood Groups',
    chapter: 'Genetics',
    explain: 'In codominance, both alleles are fully and independently expressed in the heterozygote without blending. An IAIB individual produces both A transferase (adding N-acetylgalactosamine) and B transferase (adding D-galactose), expressing both intact antigens on the RBC surface.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-113',
    q: 'Hemophilia A is an X-linked recessive coagulopathy. If a carrier female (X^H X^h) has children with a normal male (X^H Y), what is the probability that their first son will be affected by hemophilia A?',
    options: [
      '50% (1/2)',
      '100% (1/1)',
      '25% (1/4)',
      '0%'
    ],
    correct: 0,
    topic: 'Human Genetics - X-Linked Recessive Inheritance of Hemophilia A',
    chapter: 'Genetics',
    explain: 'The mother contributes either X^H (normal) or X^h (hemophilia) with equal 50% probability to male offspring, who always receive the Y chromosome from their father. Thus, among sons, 50% will inherit X^h Y (affected) and 50% will inherit X^H Y (unaffected).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-114',
    q: 'Which human genetic syndrome is caused by chromosomal non-disjunction producing a 47,XXY karyotype in phenotypic males, characterized by tall stature, testicular atrophy, gynecomastia, and azoospermia?',
    options: [
      'Klinefelter syndrome',
      'Turner syndrome (45,XO)',
      'Down syndrome (Trisomy 21)',
      'Cri-du-chat syndrome'
    ],
    correct: 0,
    topic: 'Chromosomal Abnormalities - Klinefelter Syndrome (47,XXY)',
    chapter: 'Genetics',
    explain: 'Klinefelter syndrome is characterized by a 47,XXY chromosomal constitution. Presence of the Y chromosome guides male phenotypic differentiation, but the extra X chromosome causes dysgenesis of seminiferous tubules, hypergonadotropic hypogonadism, small firm testes, azoospermia, and elevated gonadotropins.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-115',
    q: 'In human molecular genetics, the molecular basis of sickle-cell anemia is a point mutation in the β-globin gene (HBB) resulting in which specific single amino acid substitution at position 6 of the polypeptide chain?',
    options: [
      'Glutamic acid is replaced by Valine (Glu6Val)',
      'Valine is replaced by Glutamic acid (Val6Glu)',
      'Lysine is replaced by Alanine',
      'Glycine is replaced by Arginine'
    ],
    correct: 0,
    topic: 'Molecular Genetics - Sickle-Cell Anemia Single Base Mutation (Glu6Val)',
    chapter: 'Genetics',
    explain: 'Sickle cell disease is caused by a single nucleotide transversion (GAG to GTG in codon 6 of the β-globin gene on chromosome 11). This substitutes a negatively charged hydrophilic glutamic acid with a non-polar hydrophobic valine residue, causing HbS polymerization under hypoxia.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-116',
    q: 'According to the operon model of prokaryotic gene regulation proposed by Jacob and Monod, the lac repressor protein encoded by the lacI gene shuts off transcription of the lactose operon by binding to which DNA element?',
    options: [
      'Operator (lacO)',
      'Promoter (lacP)',
      'CAP-binding site',
      'lacZ structural gene start codon'
    ],
    correct: 0,
    topic: 'Gene Expression - Lac Operon Structure and Operator Binding',
    chapter: 'Genetics',
    explain: 'In the absence of allolactose (inducer), the lac repressor homotetramer binds tightly to the palindromic lac operator sequence (lacO). This sterically prevents RNA polymerase from binding to the promoter and transcribing the polycistronic structural genes (lacZ, lacY, lacA).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-117',
    q: 'In eukaryotic pre-mRNA processing, the ribonucleoprotein molecular machine responsible for recognizing consensus 5\' splice sites, branch-point adenosines, and 3\' splice sites to excise introns is the:',
    options: [
      'Spliceosome (composed of snRNAs U1, U2, U4, U5, U6 and associated proteins)',
      'Proteasome (26S complex)',
      'Ribosome (80S complex)',
      'RNA-induced silencing complex (RISC)'
    ],
    correct: 0,
    topic: 'Molecular Biology - Pre-mRNA Splicing and Spliceosome Machinery',
    chapter: 'Genetics',
    explain: 'The spliceosome is a large dynamic ribonucleoprotein (RNP) complex consisting of five small nuclear RNAs (U1, U2, U4, U5, U6) complexed with proteins (forming snRNPs). It catalyzes two transesterification reactions that excise non-coding introns as a lariat and ligate coding exons.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-118',
    q: 'Polygenic inheritance, where multiple additive genes influence a single continuous quantitative phenotypic trait, typically produces which type of phenotypic distribution in a large population?',
    options: [
      'A bell-shaped Gaussian normal distribution curve',
      'A bimodal discontinuous 3:1 Mendelian ratio',
      'A discrete 1:1 ratio with no intermediate phenotypes',
      'An asymmetric inverted exponential distribution'
    ],
    correct: 0,
    topic: 'Quantitative Genetics - Polygenic Inheritance and Continuous Variation',
    chapter: 'Genetics',
    explain: 'Continuous variation in quantitative traits (such as human height, skin color, and blood pressure) results from polygenic inheritance involving multiple additive gene loci. In a large population, environmental influences and multiple alleles combine to yield a continuous bell-shaped Gaussian distribution.',
    difficulty: 'Medium',
    subject: 'Biology'
  },

  // --- Biotechnology (8 MCQs: 119 to 126) ---
  {
    id: 'mdcat-b10-bio-119',
    q: 'Type II restriction endonucleases (such as EcoRI) widely utilized in recombinant DNA technology are characterized by their ability to recognize and cleave which specific DNA sequences?',
    options: [
      'Palindromic sequences (symmetrical 4-8 base-pair sequences reading identically in the 5\' to 3\' direction on both complementary strands)',
      'Single-stranded poly-A tails',
      'Unmethylated repetitive telomeric repeats',
      'Random GC-rich promoter regions'
    ],
    correct: 0,
    topic: 'Recombinant DNA - Type II Restriction Enzymes and Palindromes',
    chapter: 'Biotechnology',
    explain: 'Type II restriction endonucleases recognize specific inverted palindromic sequences (e.g., EcoRI recognizes 5\'-GAATTC-3\') and cleave both phosphodiester backbones at precise positions, often leaving sticky cohesive staggered ends that facilitate molecular ligation.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-120',
    q: 'In the polymerase chain reaction (PCR), what is the role of the high-temperature incubation step (typically 94-96°C) at the beginning of each cyclic round?',
    options: [
      'Thermal denaturation of double-stranded template DNA into separate single strands by breaking hydrogen bonds between base pairs',
      'Hybridization (annealing) of short oligonucleotide primers',
      'Enzymatic extension by thermostable Taq DNA polymerase',
      'Covalent ligation of Okazaki fragments'
    ],
    correct: 0,
    topic: 'PCR - Thermal Denaturation Step and Principle',
    chapter: 'Biotechnology',
    explain: 'Each PCR cycle begins with a denaturation step (94-96°C for 20-30 seconds). High thermal energy disrupts the hydrogen bonds between complementary base pairs without breaking covalent phosphodiester bonds, yielding two single-stranded DNA templates.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-121',
    q: 'Why is Taq polymerase, isolated from the thermophilic bacterium Thermus aquaticus, uniquely suited for automated PCR amplification?',
    options: [
      'It remains enzymatic and structurally stable at the 95°C denaturation temperature without needing replenishment after each cycle',
      'It possesses a 3\' to 5\' proofreading exonuclease activity 100 times higher than mammalian polymerases',
      'It synthesizes RNA primers de novo without requiring free 3\'-OH groups',
      'It cleaves restriction sites directly during extension'
    ],
    correct: 0,
    topic: 'PCR - Thermostable Taq DNA Polymerase from Thermus aquaticus',
    chapter: 'Biotechnology',
    explain: 'Traditional DNA polymerases (e.g., E. coli DNA Pol I) denature irreversibly at 95°C and had to be added manually after every cycle. Taq polymerase is thermophilic and retains catalytic activity through multiple high-temperature cycles (optimal extension at 72°C).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-122',
    q: 'In agarose gel electrophoresis of nucleic acids, DNA fragments migrate toward the positive electrode (anode) at rates inversely proportional to the log of their molecular weight because:',
    options: [
      'DNA molecules possess a constant negative charge-to-mass ratio due to their phosphate-sugar backbone, migrating through molecular sieve pores',
      'DNA is positively charged due to basic purine rings',
      'Larger DNA molecules experience less frictional drag through agarose polymer fibers',
      'Ethidium bromide pushes smaller fragments toward the cathode'
    ],
    correct: 0,
    topic: 'Gel Electrophoresis - Principles of DNA Separation by Charge and Molecular Sieve',
    chapter: 'Biotechnology',
    explain: 'The repeating phosphate groups in DNA confer a uniform negative charge at neutral pH, giving all DNA fragments an identical charge-to-mass ratio. Migration through the porous agarose gel matrix acts as a molecular sieve; smaller fragments encounter less resistance and migrate faster toward the positive anode (+).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-123',
    q: 'In molecular cloning vectors such as pUC19, what is the biochemical principle underlying blue-white colony screening on X-gal plates?',
    options: [
      'Insertion of foreign DNA into the multiple cloning site (MCS) disrupts the lacZ\' gene, preventing α-complementation of β-galactosidase and leaving recombinant colonies white',
      'Foreign DNA insertion activates the ampicillin-resistance gene, producing blue pigments',
      'Recombinant plasmids produce GFP, causing colonies to fluoresce blue under ultraviolet light',
      'Uncut plasmids kill host bacteria, leaving only white recombinant survivors'
    ],
    correct: 0,
    topic: 'Recombinant DNA - Blue-White Screening and LacZ α-Complementation',
    chapter: 'Biotechnology',
    explain: 'Non-recombinant plasmids express the intact lacZ\' α-peptide, which complements the host bacterium\'s defective β-galactosidase. The active enzyme hydrolyzes X-gal to form a blue 5,5\'-dibromo-4,4\'-dichloro-indigo precipitate. Insertion of foreign DNA disrupts the reading frame (insertional inactivation), so recombinant colonies remain white.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-124',
    q: 'Reverse transcriptase, an enzyme isolated from retroviruses and used in cDNA library construction and RT-qPCR, catalyzes which enzymatic reaction?',
    options: [
      'Synthesis of complementary DNA (cDNA) from a single-stranded RNA template',
      'Direct degradation of viral DNA in host ribosomes',
      'Ligation of blunt-ended double-stranded DNA plasmids',
      'Phosphorylation of ribonucleoside triphosphates'
    ],
    correct: 0,
    topic: 'Genetic Engineering - Reverse Transcriptase and cDNA Synthesis',
    chapter: 'Biotechnology',
    explain: 'Reverse transcriptase is an RNA-dependent DNA polymerase. It reads an mRNA template in the 3\' to 5\' direction and synthesizes a complementary DNA strand (cDNA) in the 5\' to 3\' direction, enabling cloning and quantification of eukaryotic expressed genes lacking introns.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-125',
    q: 'Sanger dideoxy DNA sequencing relies on the incorporation of 2\',3\'-dideoxynucleoside triphosphates (ddNTPs). What feature of ddNTPs causes chain termination during DNA synthesis?',
    options: [
      'They lack the 3\'-hydroxyl (-OH) group necessary for phosphodiester bond formation with the next incoming nucleotide',
      'They contain an extra phosphate group on the purine ring',
      'They bind irreversibly to the active site of DNA polymerase',
      'They hydrolyze the template strand upon incorporation'
    ],
    correct: 0,
    topic: 'DNA Sequencing - Sanger Dideoxy Method and 3\'-OH Absence',
    chapter: 'Biotechnology',
    explain: 'Normal dNTPs possess a 3\'-OH group on the deoxyribose ring to which the 5\'-phosphate of the incoming nucleotide is covalently linked by DNA polymerase. Dideoxynucleotides (ddNTPs) lack this 3\'-OH (possessing only 3\'-H), terminating chain extension once incorporated.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-126',
    q: 'Totipotency in plant tissue culture refers to the biological capacity of:',
    options: [
      'A single living differentiated plant cell to regenerate into an entire fertile, multicellular plant under appropriate auxin/cytokinin hormonal conditions',
      'A plant seed to remain dormant for multiple decades in dry soil',
      'Chloroplasts to undergo autonomous division outside the host cell',
      'Guard cells to open and close in response to humidity'
    ],
    correct: 0,
    topic: 'Plant Biotechnology - Cellular Totipotency and Micropropagation',
    chapter: 'Biotechnology',
    explain: 'Cellular totipotency, demonstrated by F.C. Steward, is the ability of an isolated somatic plant cell (e.g., carrot phloem explant) to dedifferentiate into an unorganized callus and subsequently regenerate all organ systems into a complete, fertile plant under proper nutrient and hormonal cues.',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Evolution (9 MCQs: 127 to 135) ---
  {
    id: 'mdcat-b10-bio-127',
    q: 'According to the Hardy-Weinberg equilibrium principle, what are the conditions required for allele and genotype frequencies in a Mendelian population to remain constant from generation to generation?',
    options: [
      'Infinitely large population size, random mating, no mutation, no gene flow (migration), and no natural selection',
      'Small population size, non-random assortative mating, and high mutation rate',
      'Continuous directional natural selection favoring heterozygotes',
      'Periodic genetic bottlenecks and strong founder effects'
    ],
    correct: 0,
    topic: 'Population Genetics - Hardy-Weinberg Equilibrium Conditions',
    chapter: 'Evolution',
    explain: 'The Hardy-Weinberg law states that allele frequencies (p + q = 1) and genotype frequencies (p² + 2pq + q² = 1) remain stable across generations in the absence of evolutionary forces: (1) no natural selection, (2) no mutation, (3) no gene flow/migration, (4) infinitely large population (no genetic drift), and (5) completely random mating.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-128',
    q: 'In a population adhering to Hardy-Weinberg equilibrium, the frequency of individuals homozygous for a recessive autosomal disorder (q²) is 0.04 (4%). What is the frequency of heterozygous carriers (2pq) in this population?',
    options: [
      '0.32 (32%)',
      '0.16 (16%)',
      '0.64 (64%)',
      '0.08 (8%)'
    ],
    correct: 0,
    topic: 'Population Genetics - Hardy-Weinberg Carrier Frequency Calculation',
    chapter: 'Evolution',
    explain: 'q² = 0.04 → q = √0.04 = 0.2. Since p + q = 1, p = 1 - 0.2 = 0.8. The carrier frequency is the heterozygous genotype frequency: 2pq = 2 × (0.8) × (0.2) = 0.32 (32%).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-129',
    q: 'Homologous anatomical structures, such as the pentadactyl forelimb skeleton of a human, a bat, a whale, and a cat, provide evolutionary evidence of:',
    options: [
      'Divergent evolution from a common ancestral tetrapod blueprint',
      'Convergent evolution driven by identical ecological selective pressures',
      'Independent de novo parallel origin without phylogenetic relatedness',
      'Purely vestigial non-functional degenerative morphology'
    ],
    correct: 0,
    topic: 'Evidence for Evolution - Homologous Structures and Divergent Evolution',
    chapter: 'Evolution',
    explain: 'Homologous structures share a common anatomical framework and embryonic origin derived from a common ancestor, but have diverged in function (e.g., grasping, flying, swimming, running) to adapt to different ecological niches. Analogous structures share function but not origin.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-130',
    q: 'Analogous anatomical structures, such as the wings of insects and the wings of birds, demonstrate which evolutionary phenomenon?',
    options: [
      'Convergent evolution resulting from similar aerodynamic selective pressures acting on unrelated ancestral lineages',
      'Divergent evolution from a winged common ancestor',
      'Macromutational saltation',
      'Chromosomal polyploidy'
    ],
    correct: 0,
    topic: 'Evidence for Evolution - Analogous Structures and Convergent Evolution',
    chapter: 'Evolution',
    explain: 'Analogous organs have different fundamental anatomical architectures and embryological origins (cuticular chitinous folds in insects vs modified tetrapod forelimbs in birds) but have evolved similar forms and functions in response to similar environmental demands (convergent evolution).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-131',
    q: 'In modern evolutionary synthesis, random fluctuations in allele frequencies from generation to generation occurring purely by chance in small populations are termed:',
    options: [
      'Genetic drift',
      'Directional selection',
      'Adaptive radiation',
      'Artificial selection'
    ],
    correct: 0,
    topic: 'Mechanism of Evolution - Genetic Drift in Small Populations',
    chapter: 'Evolution',
    explain: 'Genetic drift refers to random changes in allele frequencies caused by sampling error across generations. It operates independently of natural selection and is particularly pronounced in small populations, potentially leading to the fixation or total loss of alleles (e.g., bottleneck and founder effects).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-132',
    q: 'In the classic Miller-Urey experiment (1953) simulating the prebiotic reducing atmosphere of early Earth, which mixture of gases was subjected to continuous electrical spark discharge to synthesize organic amino acids?',
    options: [
      'Methane (CH4), ammonia (NH3), hydrogen (H2), and water vapor (H2O)',
      'Carbon dioxide (CO2), nitrogen (N2), and molecular oxygen (O2)',
      'Sulfur dioxide (SO2), helium (He), and ozone (O3)',
      'Carbon monoxide (CO) and chlorine gas (Cl2)'
    ],
    correct: 0,
    topic: 'Origin of Life - Miller-Urey Prebiotic Synthesis Experiment',
    chapter: 'Evolution',
    explain: 'Stanley Miller and Harold Urey simulated Oparin-Haldane\'s reducing primordial atmosphere using CH4, NH3, H2, and H2O vapor in a closed circulating apparatus. Continuous electrical discharge for one week yielded diverse organic molecules, including amino acids (glycine, alanine, aspartic acid).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-133',
    q: 'The evolutionary persistence of the sickle-cell hemoglobin allele (HbS) at unusually high frequencies in malaria-endemic regions of sub-Saharan Africa is a classic textbook example of:',
    options: [
      'Heterozygote advantage (balanced polymorphism / overdominance)',
      'Disruptive selection against both homozygotes',
      'Neutral non-Darwinian genetic drift',
      'Gametic reproductive isolation'
    ],
    correct: 0,
    topic: 'Natural Selection - Balanced Polymorphism and Heterozygote Advantage',
    chapter: 'Evolution',
    explain: 'Heterozygotes (HbA/HbS) have sickle-cell trait: they exhibit only mild clinical symptoms under severe hypoxia, but their red blood cells resist intracellular replication and severe pathogenesis of Plasmodium falciparum malaria. This confers a selective survival advantage that maintains the mutant allele in the population.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-134',
    q: 'The endosymbiotic theory (championed by Lynn Margulis) for the origin of eukaryotic mitochondria and plastids is supported by which empirical cellular evidence?',
    options: [
      'Mitochondria and chloroplasts possess circular double-stranded DNA, 70S ribosomes, and divide autonomously by binary fission similar to prokaryotes',
      'They are synthesized de novo in the nucleus during mitosis',
      'They have cell walls composed of thick peptidoglycan layers',
      'Their respiratory enzymes are encoded entirely on nuclear chromosomes'
    ],
    correct: 0,
    topic: 'Endosymbiotic Theory - Origin of Mitochondria and Chloroplasts',
    chapter: 'Evolution',
    explain: 'Mitochondria (derived from α-proteobacteria) and chloroplasts (derived from cyanobacteria) retain distinct prokaryotic hallmarks: circular naked genomes, bacterial-like 70S ribosomes sensitive to chloramphenicol, an inner membrane containing cardiolipin, and division by binary fission.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b10-bio-135',
    q: 'Allopatric speciation, the most prevalent mode of speciation in multicellular animals, initiates when two populations of an ancestral species become separated by:',
    options: [
      'A physical geographic barrier (e.g., mountain uplift, river channel, or ocean formation) that halts gene flow',
      'A sudden autopolyploid whole-genome duplication event',
      'Behavioral divergence occurring within a shared continuous microhabitat',
      'Seasonal difference in flowering times in sympatric plants'
    ],
    correct: 0,
    topic: 'Speciation - Allopatric Speciation and Geographic Isolation',
    chapter: 'Evolution',
    explain: 'Allopatric ("other country") speciation begins when a physical geographic barrier divides a parental population, preventing gene flow. Over time, independent mutations, natural selection, and genetic drift cause reproductive isolation to evolve between the separated populations.',
    difficulty: 'Easy',
    subject: 'Biology'
  }
];
