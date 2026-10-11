import { Question } from '../types';

export const MDCAT_BIOLOGY_BATCH9_PART2: Question[] = [
  // --- Homeostasis (9 MCQs: 68 to 76) ---
  {
    id: 'mdcat-b9-bio-68',
    q: 'In the mammalian nephron, the single-effect countercurrent multiplier mechanism that establishes the hyperosmotic corticomedullary interstitial gradient depends crucially on which property of the thick ascending limb of the loop of Henle?',
    options: [
      'Active transport of Na⁺, K⁺, and 2Cl⁻ (NKCC2 cotransporter) into the interstitium while being completely impermeable to water',
      'High passive permeability to water via aquaporin-1 channels with no active salt transport',
      'Active secretion of urea into the tubular fluid under aldosterone regulation',
      'Passive paracellular diffusion of bicarbonate coupled to glucose reabsorption'
    ],
    correct: 0,
    topic: 'Osmoregulation - Countercurrent Multiplier in Loop of Henle',
    chapter: 'Homeostasis',
    explain: 'The thick ascending limb actively reabsorbs Na⁺, K⁺, and 2Cl⁻ via the apical NKCC2 cotransporter into the medullary interstitium. Because it is strictly impermeable to water, solutes enter the interstitium without water, building a progressive osmotic gradient up to 1200 mOsm/L at the hairpin turn.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-69',
    q: 'Antidiuretic hormone (ADH / arginine vasopressin) increases the reabsorption of water in the collecting duct by binding to basolateral V2 receptors and stimulating:',
    options: [
      'cAMP-PKA pathway signaling, triggering exocytic trafficking of Aquaporin-2 (AQP2) water channels to the apical membrane',
      'Direct opening of voltage-gated potassium channels in intercalated cells',
      'Inhibition of basolateral Na⁺/K⁺-ATPase pumps in principal cells',
      'Cleavage of luminal angiotensinogen to active angiotensin II'
    ],
    correct: 0,
    topic: 'Excretion - Mechanism of ADH and Aquaporin-2 Regulation',
    chapter: 'Homeostasis',
    explain: 'ADH binds Gs-coupled V2 receptors on the basolateral surface of principal cells, elevating intracellular cyclic AMP (cAMP) and activating Protein Kinase A (PKA). This phosphorylates Aquaporin-2 (AQP2) storage vesicles, inducing their fusion with the apical plasma membrane, permitting osmotic water reabsorption.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-70',
    q: 'In the ornithine-urea cycle occurring in the human liver, which enzyme catalyzes the rate-limiting, ATP-dependent committed step inside the mitochondrial matrix?',
    options: [
      'Carbamoyl phosphate synthetase I (CPS-I)',
      'Ornithine transcarbamylase (OTC)',
      'Argininosuccinate synthetase',
      'Arginase-1'
    ],
    correct: 0,
    topic: 'Excretion - Urea Cycle and Carbamoyl Phosphate Synthetase I',
    chapter: 'Homeostasis',
    explain: 'Carbamoyl phosphate synthetase I (CPS-I) catalyzes the condensation of ammonia (NH4⁺), bicarbonate (HCO3⁻), and 2 ATP to form carbamoyl phosphate inside hepatic mitochondria. CPS-I requires N-acetylglutamate (NAG) as an obligatory allosteric activator and represents the committed pacemaker of ureagenesis.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-71',
    q: 'Juxtaglomerular granular cells located in the afferent arteriole of the renal corpuscle synthesize, store, and secrete the proteolytic enzyme renin in response to:',
    options: [
      'Decreased renal perfusion pressure, reduced NaCl delivery to the macula densa, and sympathetic beta-1 adrenergic stimulation',
      'Severe systemic hypertension and elevated atrial stretch (ANP release)',
      'Hypernatremia and acute respiratory alkalosis',
      'High hydrostatic filtration pressure across glomerular podocyte pedicels'
    ],
    correct: 0,
    topic: 'Renal Physiology - Renin Secretion and RAAS Axis',
    chapter: 'Homeostasis',
    explain: 'Renin release is triggered by: (1) decreased stretch in afferent arteriolar baroreceptors (renal hypoperfusion), (2) decreased NaCl delivery sensed by macula densa cells in the early distal tubule, and (3) increased renal sympathetic nerve activity acting via β1-adrenergic receptors.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-72',
    q: 'Freshwater bony fishes (such as carp and trout) face the constant osmotic danger of water influx and solute loss. How do they maintain homeostatic osmoregulatory balance?',
    options: [
      'Excreting large volumes of dilute hypotonic urine and actively absorbing salts (Na⁺, Cl⁻) across specialized gill chloride cells',
      'Drinking copiously from surrounding river water and actively excreting concentrated hypertonic urine',
      'Accumulating high concentrations of urea and trimethylamine oxide (TMAO) in their muscle tissues',
      'Ceasing glomerular filtration entirely through aglomerular nephrons'
    ],
    correct: 0,
    topic: 'Osmoregulation - Freshwater vs Marine Teleost Adaptations',
    chapter: 'Homeostasis',
    explain: 'Freshwater teleosts are hyperosmotic to their surrounding hypotonic medium. They actively pump Na⁺ and Cl⁻ ions inward across gill ionocytes against concentration gradients, produce copious volumes of very dilute urine, and minimize drinking to prevent internal fluid dilution.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-73',
    q: 'Which anatomical zone of the adrenal cortex synthesizes and secretes aldosterone in response to elevated extracellular potassium (K⁺) or circulating angiotensin II?',
    options: [
      'Zona glomerulosa',
      'Zona fasciculata',
      'Zona reticularis',
      'Adrenal medulla'
    ],
    correct: 0,
    topic: 'Endocrine and Homeostasis - Aldosterone and Adrenal Cortex',
    chapter: 'Homeostasis',
    explain: 'The adrenal cortex has three zones: (1) Zona glomerulosa (outermost) secretes mineralocorticoids (aldosterone); (2) Zona fasciculata secretes glucocorticoids (cortisol); (3) Zona reticularis (innermost) secretes androgens (DHEA).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-74',
    q: 'In the proximal convoluted tubule (PCT), approximately what percentage of filtered water, sodium, and chloride is isotonically reabsorbed under normal physiological conditions?',
    options: [
      '65% to 70%',
      '20% to 25%',
      '99% to 100%',
      '10% to 15%'
    ],
    correct: 0,
    topic: 'Renal Physiology - Tubular Reabsorption in Proximal Convoluted Tubule',
    chapter: 'Homeostasis',
    explain: 'The proximal convoluted tubule is the primary site of obligatory reabsorption, recovering ~65-70% of filtered water and NaCl, 100% of filtered glucose and amino acids, and ~85% of filtered bicarbonate.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-75',
    q: 'In physiological thermoregulation, non-shivering thermogenesis in brown adipose tissue (BAT) generates heat without producing ATP via which mitochondrial uncoupling protein?',
    options: [
      'Thermogenin (UCP1)',
      'Cytochrome c oxidase',
      'ATP-sensitive potassium channel',
      'Carnitine palmitoyltransferase-1'
    ],
    correct: 0,
    topic: 'Thermoregulation - Brown Adipose Tissue and UCP1',
    chapter: 'Homeostasis',
    explain: 'Thermogenin (uncoupling protein 1, UCP1) provides an alternative inner mitochondrial membrane conductance pathway that allows protons to flow back down into the matrix, bypassing ATP synthase. The free energy of the proton electrochemical gradient is dissipated directly as heat.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-76',
    q: 'Which nitrogenous waste product requires the least volume of water for safe excretion due to its extremely low water solubility and is excreted as a semisolid paste by reptiles and birds?',
    options: [
      'Uric acid (uricotelism)',
      'Ammonia (ammonotelism)',
      'Urea (ureotelism)',
      'Creatinine'
    ],
    correct: 0,
    topic: 'Excretion - Uricotelism and Evolutionary Water Conservation',
    chapter: 'Homeostasis',
    explain: 'Uric acid is virtually insoluble in water (precipitates as a crystalline paste). Uricotelic organisms (birds, terrestrial reptiles, insects) expend more ATP to synthesize uric acid from purines, saving massive amounts of body water compared to ammonotelic or ureotelic organisms.',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Gaseous Exchange (9 MCQs: 77 to 85) ---
  {
    id: 'mdcat-b9-bio-77',
    q: 'According to the Bohr effect, which set of physiological changes in metabolically active systemic tissues shifts the hemoglobin oxygen-dissociation curve to the right, promoting oxygen unloading?',
    options: [
      'Decreased pH (increased H⁺), increased PCO2, increased temperature, and elevated 2,3-BPG',
      'Increased pH, decreased PCO2, decreased temperature, and decreased 2,3-BPG',
      'Decreased PCO2 and elevated carbon monoxide concentration',
      'Complete saturation of all four heme iron centers with fetal hemoglobin'
    ],
    correct: 0,
    topic: 'Respiration - Bohr Effect and Oxygen-Hemoglobin Dissociation Curve',
    chapter: 'Gaseous Exchange',
    explain: 'A rightward shift of the oxygen-hemoglobin dissociation curve (Bohr effect) means hemoglobin has a lower affinity for O2 at any given PO2, facilitating O2 unloading to active tissues. This shift is triggered by high metabolic activity: increased [H⁺] (low pH), increased PCO2, elevated temperature, and increased 2,3-bisphosphoglycerate (2,3-BPG).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-78',
    q: 'What is the primary chemical form in which carbon dioxide (CO2) is transported in systemic venous blood from peripheral tissues to the pulmonary capillaries?',
    options: [
      'As bicarbonate ions (HCO3⁻) dissolved in blood plasma (accounting for ~70% of total CO2)',
      'As carbaminohemoglobin bound to the globin amino termini (~70%)',
      'As physically dissolved CO2 gas bubbles inside erythrocyte cytoplasm (~85%)',
      'As carbonic acid bound directly to plasma albumin (~60%)'
    ],
    correct: 0,
    topic: 'Respiration - Carbon Dioxide Transport Forms in Blood',
    chapter: 'Gaseous Exchange',
    explain: 'CO2 is transported in three forms: (1) Bicarbonate ions (HCO3⁻) in plasma (~70%), generated within RBCs by carbonic anhydrase and exported via the chloride shift; (2) Carbamino compounds bound to globin amino groups (~23%); (3) Physically dissolved gas in plasma (~7%).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-79',
    q: 'The chloride shift (Hamburger phenomenon) across the erythrocyte plasma membrane during carbon dioxide uptake in systemic capillaries involves:',
    options: [
      'Electroneutral exchange of intracellular bicarbonate (HCO3⁻) for extracellular chloride (Cl⁻) via the Band 3 (AE1) anion exchanger',
      'Active transport of Cl⁻ out of erythrocytes by an ATP-driven chloride pump',
      'Direct coupling of sodium influx with potassium efflux through open CFTR pores',
      'Precipitation of calcium chloride within the erythrocyte cytoskeleton'
    ],
    correct: 0,
    topic: 'Respiration - Chloride Shift (Hamburger Phenomenon) and Band 3',
    chapter: 'Gaseous Exchange',
    explain: 'Inside erythrocytes, carbonic anhydrase converts CO2 + H2O into H⁺ + HCO3⁻. To maintain cellular electroneutrality as accumulating HCO3⁻ diffuses down its gradient into plasma, the Band 3 anion exchanger (AE1) imports one Cl⁻ ion into the erythrocyte for every HCO3⁻ exported.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-80',
    q: 'Pulmonary surfactant, which reduces alveolar surface tension and prevents end-expiratory atelectasis (alveolar collapse), is synthesized and secreted by:',
    options: [
      'Type II alveolar epithelial pneumocytes (rich in dipalmitoylphosphatidylcholine)',
      'Type I flat squamous alveolar pneumocytes',
      'Alveolar dust cells (macrophages)',
      'Ciliated pseudostratified columnar goblet cells'
    ],
    correct: 0,
    topic: 'Respiratory Histology - Type II Pneumocytes and Pulmonary Surfactant',
    chapter: 'Gaseous Exchange',
    explain: 'Type II pneumocytes (great alveolar cells) secrete pulmonary surfactant, a complex of dipalmitoylphosphatidylcholine (DPPC) and surfactant apoproteins (SP-A, B, C, D). By disrupting hydrogen bonds between water molecules at the air-liquid interface, surfactant dramatically decreases surface tension, especially at small alveolar radii (LaPlace\'s law), preventing collapse.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-81',
    q: 'In the physiological chemical control of ventilation in a healthy human at sea level, the primary stimulus driving the central chemoreceptors located on the ventrolateral surface of the medulla oblongata is:',
    options: [
      'Elevation of arterial PCO2 which diffuses across the blood-brain barrier and lowers cerebrospinal fluid pH (increasing [H⁺])',
      'A minor drop in arterial PO2 below 95 mmHg sensed directly by the medullary respiratory center',
      'Direct contact of arterial bicarbonate ions with medullary neuronal cell bodies',
      'Afferent vagal input triggered by lung overinflation'
    ],
    correct: 0,
    topic: 'Respiratory Control - Central Chemoreceptors and Arterial PCO2',
    chapter: 'Gaseous Exchange',
    explain: 'Arterial H⁺ cannot easily cross the blood-brain barrier, but lipid-soluble CO2 diffuses readily into cerebrospinal fluid (CSF). There, carbonic anhydrase converts it into H⁺ + HCO3⁻. The resulting drop in CSF pH directly excites central chemoreceptors on the medulla, making PaCO2 the primary homeostatic driver of resting ventilation.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-82',
    q: 'In avian respiration, gas exchange occurs with exceptional efficiency through parabronchi via which anatomical mechanism?',
    options: [
      'Unidirectional airflow driven by non-vascularized air sacs, operating with a cross-current gas exchange system',
      'Bidirectional tidal alveolar ventilation identical to mammals',
      'Cutaneous diffusion through vascularized feathers',
      'Spiracular tracheal tubes pumping air directly into individual myocytes'
    ],
    correct: 0,
    topic: 'Comparative Respiration - Avian Parabronchial Cross-Current System',
    chapter: 'Gaseous Exchange',
    explain: 'Birds possess a system of anterior and posterior air sacs that act as bellows to pump air unidirectionally through rigid, tubular parabronchi over two complete respiratory cycles. Blood flows perpendicular to parabronchial airflow in a cross-current configuration, extracting substantially more oxygen than mammalian tidal lungs.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-83',
    q: 'What is the volume of air inspired or expired during each normal, quiet resting respiratory cycle in an average healthy adult human?',
    options: [
      'Tidal Volume (approximately 500 mL)',
      'Inspiratory Reserve Volume (approximately 3000 mL)',
      'Vital Capacity (approximately 4600 mL)',
      'Residual Volume (approximately 1200 mL)'
    ],
    correct: 0,
    topic: 'Spirometry - Pulmonary Volumes and Tidal Volume',
    chapter: 'Gaseous Exchange',
    explain: 'Tidal volume (TV) is the volume of air breathed in or out with each normal resting breath, averaging ~500 mL in a healthy 70 kg adult (with ~150 mL remaining in anatomical dead space).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-84',
    q: 'Why does carbon monoxide (CO) inhalation cause rapid, severe tissue hypoxia without necessarily triggering immediate respiratory distress or dyspnea in the victim?',
    options: [
      'CO binds hemoglobin with ~200-250 times greater affinity than O2 and locks it in the high-affinity R-state, while arterial PO2 and peripheral chemoreceptors remain normal',
      'CO directly destroys central chemoreceptors in the medullary reticular formation',
      'CO oxidizes all Fe²⁺ into Fe³⁺, forming green sulfhemoglobin precipitates',
      'CO instantly paralyzes the phrenic nerve and diaphragm neuromuscular junctions'
    ],
    correct: 0,
    topic: 'Respiration - Carbon Monoxide Poisoning Mechanism',
    chapter: 'Gaseous Exchange',
    explain: 'Carbon monoxide binds to Fe²⁺ of heme with ~200-250 times the affinity of O2, forming carboxyhemoglobin. It severely limits O2 content and alters hemoglobin cooperativity, shifting the curve left and preventing O2 release to tissues. Because dissolved PaO2 remains normal, peripheral chemoreceptors do not stimulate dyspnea.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-85',
    q: 'The Haldane effect describes the phenomenon wherein:',
    options: [
      'Deoxygenation of blood increases the affinity of hemoglobin for carbon dioxide and H⁺, enhancing CO2 loading at tissues',
      'Elevated oxygen levels cause vasodilation of peripheral arterioles',
      'Lower blood pH decreases the affinity of myoglobin for dissolved nitric oxide',
      'High alveolar nitrogen concentrations induce surfactant synthesis in preterm neonates'
    ],
    correct: 0,
    topic: 'Respiration - Haldane Effect vs Bohr Effect',
    chapter: 'Gaseous Exchange',
    explain: 'The Haldane effect states that deoxygenated hemoglobin has a higher affinity for CO2 (forming carbamino compounds) and binds H⁺ more readily than oxyhemoglobin. Thus, O2 unloading in tissues facilitates CO2 uptake into venous blood.',
    difficulty: 'Medium',
    subject: 'Biology'
  },

  // --- Coordination and Control (8 MCQs: 86 to 93) ---
  {
    id: 'mdcat-b9-bio-86',
    q: 'During the firing of a neuronal action potential, the rapid rising phase of depolarization from threshold (-55 mV) to +30 mV is mediated by:',
    options: [
      'Massive, rapid influx of Na⁺ through opened voltage-gated sodium channels',
      'Rapid efflux of K⁺ through opened voltage-gated potassium channels',
      'Active pumping of 3 Na⁺ outward by the Na⁺/K⁺-ATPase pump',
      'Influx of chloride ions through GABA-A receptor channels'
    ],
    correct: 0,
    topic: 'Nervous System - Action Potential Depolarization Phase',
    chapter: 'Coordination and Control',
    explain: 'When local depolarization reaches the threshold potential (~ -55 mV), activation gates (m-gates) of voltage-gated Na⁺ channels open rapidly. Driven by both concentration and electrical gradients, Na⁺ surges into the axoplasm, driving the membrane potential toward the sodium equilibrium potential (+60 mV).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-87',
    q: 'In a chemical synapse, the influx of which ion into the presynaptic terminal through voltage-gated channels is the immediate physiological trigger for synaptic vesicle exocytosis?',
    options: [
      'Calcium (Ca²⁺)',
      'Sodium (Na⁺)',
      'Chloride (Cl⁻)',
      'Magnesium (Mg²⁺)'
    ],
    correct: 0,
    topic: 'Synaptic Transmission - Calcium-Dependent Vesicle Exocytosis',
    chapter: 'Coordination and Control',
    explain: 'Depolarization of the presynaptic axon terminal opens voltage-gated Ca²⁺ channels. Calcium influx down its steep gradient activates synaptotagmin, triggering SNARE-complex-mediated fusion of neurotransmitter vesicles with the presynaptic membrane and release of neurotransmitter into the synaptic cleft.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-88',
    q: 'Saltatory conduction, which markedly increases the velocity of action potential propagation along myelinated axons, occurs because:',
    options: [
      'Voltage-gated Na⁺ and K⁺ channels are concentrated at high density exclusively at the Nodes of Ranvier, allowing the impulse to jump between nodes',
      'Myelin sheath contains electron-conducting copper ions that transmit currents at the speed of light',
      'Action potentials travel continuously through the cytoplasmic core without membrane interactions',
      'Schwann cells generate ATP that propels neurotransmitters down the axon tube'
    ],
    correct: 0,
    topic: 'Nervous System - Saltatory Conduction and Nodes of Ranvier',
    chapter: 'Coordination and Control',
    explain: 'The lipid-rich myelin sheath acts as an electrical insulator with high resistance and low capacitance, preventing current leakage along the internodes. Depolarizing ionic currents flow passively and rapidly electrotonically down the axon, regenerating action potentials only at the unmyelinated Nodes of Ranvier where voltage-gated Na⁺ channels are densely packed.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-89',
    q: 'Which endocrine hormone, synthesized in the hypothalamus and released from the posterior pituitary, stimulates forceful uterine myometrial contractions via a positive feedback loop during parturition?',
    options: [
      'Oxytocin',
      'Prolactin',
      'Progesterone',
      'Luteinizing hormone (LH)'
    ],
    correct: 0,
    topic: 'Endocrine System - Oxytocin and Ferguson Reflex',
    chapter: 'Coordination and Control',
    explain: 'Oxytocin is synthesized by magnocellular neurosecretory neurons in the paraventricular and supraoptic nuclei of the hypothalamus and stored in the posterior pituitary. During labor, cervical stretch signals hypothalamic oxytocin release (Ferguson reflex), stimulating stronger contractions in a classic positive feedback loop.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-90',
    q: 'Cushing\'s syndrome is a clinical endocrine disorder characterized by central obesity, moon facies, buffalo hump, and hypertension, caused by chronic hypersecretion of:',
    options: [
      'Cortisol (glucocorticoids)',
      'Growth hormone (GH)',
      'Parathyroid hormone (PTH)',
      'Thyroxine (T4)'
    ],
    correct: 0,
    topic: 'Endocrine Disorders - Cushing\'s Syndrome and Hypercortisolemia',
    chapter: 'Coordination and Control',
    explain: 'Cushing\'s syndrome results from prolonged exposure to excess circulating glucocorticoids (cortisol), whether from an ACTH-secreting pituitary adenoma (Cushing\'s disease), adrenal cortical adenoma, or exogenous therapeutic corticosteroid administration.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-91',
    q: 'Which plant hormone is primarily synthesized in root apical meristems and transported upward through xylem to promote cell division, shoot initiation in tissue culture, and delay leaf senescence?',
    options: [
      'Cytokinin (e.g., zeatin, kinetin)',
      'Abscisic acid (ABA)',
      'Auxin (indole-3-acetic acid)',
      'Ethylene gas'
    ],
    correct: 0,
    topic: 'Plant Hormones - Cytokinins and Antagonism of Senescence',
    chapter: 'Coordination and Control',
    explain: 'Cytokinins are adenine-derived phytohormones synthesized primarily in active root tips and translocated via xylem to shoots. They stimulate cytokinesis (cell division), promote lateral bud outgrowth by releasing apical dominance, and retard protein degradation (delaying senescence).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-92',
    q: 'In the phototropic curvature of an Avena (oat) coleoptile toward unilateral blue light, what is the underlying physiological mechanism explained by the Cholodny-Went model?',
    options: [
      'Auxin (IAA) is laterally redistributed to the shaded side, stimulating proton extrusion (acid growth) and asymmetric cell elongation on the dark side',
      'Auxin is selectively degraded on the shaded side, causing cell shrinkage',
      'Ethylene gas accumulates on the illuminated side, driving localized apical mitosis',
      'Gibberellins polymerize cellulose microfibrils exclusively toward the light vector'
    ],
    correct: 0,
    topic: 'Plant Tropisms - Cholodny-Went Model of Phototropism',
    chapter: 'Coordination and Control',
    explain: 'Unidirectional blue light is sensed by phototropin receptors, triggering lateral PIN-mediated auxin translocation to the shaded side of the shoot tip. Increased auxin on the shaded side stimulates plasma membrane H⁺-ATPases, activating expansins that loosen cell walls (acid growth hypothesis), causing the shaded side to elongate faster and bending the shoot toward light.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-93',
    q: 'Which structural region of the human brain functions as the primary autonomic, neuroendocrine, and visceral homeostatic integration center, regulating thirst, appetite, circadian rhythms, and core body temperature?',
    options: [
      'Hypothalamus',
      'Cerebellum',
      'Basal ganglia',
      'Thalamus'
    ],
    correct: 0,
    topic: 'Brain Anatomy - Hypothalamus and Visceral Homeostasis',
    chapter: 'Coordination and Control',
    explain: 'The hypothalamus lies ventral to the thalamus and forms the floor of the third ventricle. It houses specialized nuclei controlling core body temperature, water balance (osmoreceptors), food intake (arcuate and satiety centers), and circadian clock pacing (suprachiasmatic nucleus), linking the nervous and endocrine systems.',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Support and Movement (9 MCQs: 94 to 102) ---
  {
    id: 'mdcat-b9-bio-94',
    q: 'In skeletal muscle sarcomeres, which protein is a giant elastic filament that anchors the thick myosin filaments to the Z-disc, providing passive elasticity and preventing overstretching?',
    options: [
      'Titin (connectin)',
      'Nebulin',
      'Tropomyosin',
      'Alpha-actinin'
    ],
    correct: 0,
    topic: 'Muscle Architecture - Titin and Sarcomeric Elasticity',
    chapter: 'Support and Movement',
    explain: 'Titin is the largest known single polypeptide (~3-4 MDa). It spans half a sarcomere from the Z-disc to the M-line, acting as a molecular bungee cord that centers thick myosin filaments within the sarcomere and provides passive restorative tension during stretch.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-95',
    q: 'During the sliding filament cross-bridge cycle of skeletal muscle contraction, what direct biochemical event causes the myosin head to detach from the actin filament?',
    options: [
      'Binding of a new molecule of ATP to the myosin nucleotide-binding site',
      'Hydrolysis of ATP into ADP and inorganic phosphate (Pi)',
      'Release of inorganic phosphate (Pi) triggering the power stroke',
      'Sequestration of calcium back into the terminal cisternae by SERCA'
    ],
    correct: 0,
    topic: 'Muscle Contraction - Cross-Bridge Cycle and ATP Binding',
    chapter: 'Support and Movement',
    explain: 'Binding of a new ATP molecule to the myosin head induces a low-affinity conformational state, causing instantaneous dissociation of the myosin head from the actin filament. In death, depletion of ATP prevents this detachment, locking cross-bridges in the stiff state known as rigor mortis.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-96',
    q: 'The functional calcium sensor protein associated with the actin thin filament in skeletal and cardiac muscle that undergoes a conformational change upon binding Ca²⁺ to displace tropomyosin is:',
    options: [
      'Troponin C (TnC)',
      'Troponin T (TnT)',
      'Troponin I (TnI)',
      'Calmodulin'
    ],
    correct: 0,
    topic: 'Muscle Contraction - Troponin Subunits and Calcium Activation',
    chapter: 'Support and Movement',
    explain: 'The troponin complex has three subunits: Troponin C (binds up to four Ca²⁺ ions), Troponin I (inhibits actin-myosin interaction), and Troponin T (binds tropomyosin). Ca²⁺ binding to TnC induces a conformational shift that pulls tropomyosin into the actin groove, exposing myosin-binding sites on actin.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-97',
    q: 'Tetanus toxin (tetanospasmin), produced by Clostridium tetani, causes spastic muscle paralysis and lockjaw by which specific molecular neurotoxic action?',
    options: [
      'Cleaving synaptobrevin (VAMP) in inhibitory interneurons (Renshaw cells), preventing exocytosis of GABA and glycine',
      'Blocking nicotinic acetylcholine receptors at skeletal motor endplates',
      'Inhibiting the sodium-potassium ATPase pump in skeletal muscle sarcolemma',
      'Preventing calcium release from the sarcoplasmic reticulum ryanodine receptors'
    ],
    correct: 0,
    topic: 'Neuromuscular Pathology - Tetanospasmin and Spastic Paralysis',
    chapter: 'Support and Movement',
    explain: 'Tetanospasmin undergoes retrograde axonal transport to spinal motor inhibitory interneurons (Renshaw cells). Its light chain acts as a zinc endopeptidase that cleaves synaptobrevin (SNARE protein), blocking the release of inhibitory neurotransmitters glycine and GABA. This leaves alpha motor neurons persistently uninhibited, causing spastic tetanic spasms.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-98',
    q: 'In bone histology, the concentric cylindrical structural units that constitute compact (cortical) bone, consisting of central canals surrounded by concentric lamellae, are designated as:',
    options: [
      'Osteons (Haversian systems)',
      'Trabeculae',
      'Volkmann\'s perforating canals',
      'Canaliculi'
    ],
    correct: 0,
    topic: 'Skeletal Histology - Compact Bone and Osteons (Haversian Systems)',
    chapter: 'Support and Movement',
    explain: 'The structural and functional unit of compact bone is the osteon (Haversian system). Each osteon comprises concentric rings of mineralized collagenous matrix (lamellae) surrounding a central Haversian canal containing blood vessels and nerves, with osteocytes residing in lacunae interconnected by canaliculi.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-99',
    q: 'Which bone cell type is multinucleated, originates from the monocyte-macrophage hematopoietic lineage, and resides in Howship\'s lacunae to resorb bone matrix by secreting acid and cathepsin K?',
    options: [
      'Osteoclasts',
      'Osteoblasts',
      'Osteocytes',
      'Osteoprogenitor cells'
    ],
    correct: 0,
    topic: 'Bone Remodeling - Osteoclasts and Howship\'s Lacunae',
    chapter: 'Support and Movement',
    explain: 'Osteoclasts are giant multinucleated cells formed by fusion of monocyte/macrophage precursors. They adhere to the bone surface via integrins, create a sealed resorption compartment (Howship\'s lacuna), and pump H⁺ via V-ATPases and secrete cathepsin K to dissolve mineral and digest collagen.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-100',
    q: 'What type of synovial joint permits multiaxial movement across all three planes, providing the greatest range of motion among all joint classifications in the human skeleton?',
    options: [
      'Ball-and-socket joint (e.g., glenohumeral and hip joints)',
      'Hinge joint (e.g., elbow and interphalangeal joints)',
      'Pivot joint (e.g., atlantoaxial joint)',
      'Saddle joint (e.g., carpometacarpal joint of the thumb)'
    ],
    correct: 0,
    topic: 'Skeletal Articulations - Synovial Joint Classification',
    chapter: 'Support and Movement',
    explain: 'Ball-and-socket joints (spheroidal joints) consist of a globular head fitting into a cup-like cavity (e.g., shoulder and hip). They permit flexion-extension, abduction-adduction, circumduction, and rotation (multiaxial movement).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-101',
    q: 'In human skeletal muscle, the invaginations of the sarcolemma that project deep into the muscle fiber interior to conduct action potentials rapidly to every myofibril are known as:',
    options: [
      'Transverse tubules (T-tubules)',
      'Sarcoplasmic reticulum cisternae',
      'Caveolae',
      'Intercalated discs'
    ],
    correct: 0,
    topic: 'Muscle Physiology - T-Tubules and Triad Structure',
    chapter: 'Support and Movement',
    explain: 'T-tubules are deep tubular extensions of the plasma membrane (sarcolemma) running perpendicularly across myofibrils at the A-I band junctions in mammalian muscle. Together with two flanking terminal cisternae of the sarcoplasmic reticulum, they form triads that deliver depolarization instantly to dihydropyridine receptors (DHPRs).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-102',
    q: 'Which plant anatomical tissue is composed of dead, heavily lignified cells with thick secondary walls that provide rigid tensile support to non-growing, mature plant organs?',
    options: [
      'Sclerenchyma (fibers and sclereids)',
      'Collenchyma',
      'Parenchyma',
      'Aerenchyma'
    ],
    correct: 0,
    topic: 'Plant Tissues - Sclerenchyma Mechanical Support',
    chapter: 'Support and Movement',
    explain: 'Sclerenchyma cells possess thick, lignified secondary cell walls and are typically non-living at functional maturity. They occur as elongated fibers or irregular sclereids (stone cells), providing structural rigidity and resistance to compression and bending.',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Reproduction (8 MCQs: 103 to 110) ---
  {
    id: 'mdcat-b9-bio-103',
    q: 'In the human ovarian cycle, the mid-cycle surge of which pituitary gonadotropin is the direct trigger for the rupture of the mature Graafian follicle and ovulation?',
    options: [
      'Luteinizing hormone (LH surge)',
      'Follicle-stimulating hormone (FSH)',
      'Prolactin',
      'Human chorionic gonadotropin (hCG)'
    ],
    correct: 0,
    topic: 'Human Reproduction - LH Surge and Ovulation Mechanism',
    chapter: 'Reproduction',
    explain: 'High, sustained levels of estradiol produced by the dominant Graafian follicle switch estrogen feedback from negative to positive on the hypothalamus and anterior pituitary. This induces a massive preovulatory surge of LH, which activates proteolytic collagenases and prostaglandins to rupture the follicular wall within 24-36 hours.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-104',
    q: 'Following ovulation, the collapsed follicular wall transforms into the corpus luteum, which secretes high amounts of which hormone to maintain the secretory endometrium for blastocyst implantation?',
    options: [
      'Progesterone',
      'Oxytocin',
      'Inhibin B',
      'Testosterone'
    ],
    correct: 0,
    topic: 'Endocrine Reproduction - Corpus Luteum and Progesterone',
    chapter: 'Reproduction',
    explain: 'Under basal LH stimulation, luteinized granulosa and theca cells of the corpus luteum secrete large quantities of progesterone (and moderate estradiol). Progesterone converts proliferative endometrium into a vascular, tortuous secretory phase suitable for embryo implantation and suppresses new follicular recruitment.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-105',
    q: 'In human testes, which cells form the structural basis of the blood-testis barrier, phagocytose redundant spermatid cytoplasm, and secrete androgen-binding protein (ABP)?',
    options: [
      'Sertoli cells (sustentacular cells)',
      'Leydig cells (interstitial cells)',
      'Primary spermatocytes',
      'Peritubular myoid cells'
    ],
    correct: 0,
    topic: 'Male Reproduction - Sertoli Cells and Blood-Testis Barrier',
    chapter: 'Reproduction',
    explain: 'Sertoli cells line the seminiferous tubules. Their tight junctions (zonula occludens) establish the blood-testis barrier, shielding haploid developing spermatids from autoimmune destruction. Sertoli cells nourish spermatocytes, secrete androgen-binding protein (ABP) to concentrate intratesticular testosterone, and secrete inhibin.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-106',
    q: 'During mammalian fertilization, the acrosome reaction is initiated when sperm bind specifically to which glycoprotein of the oocyte zona pellucida?',
    options: [
      'ZP3 (Zona Pellucida Glycoprotein 3)',
      'ZP1',
      'Fibronectin',
      'Integrin alpha-V beta-3'
    ],
    correct: 0,
    topic: 'Fertilization - Acrosome Reaction and ZP3 Receptor Binding',
    chapter: 'Reproduction',
    explain: 'Sperm capacitation primes the sperm head. Upon encountering the oocyte, the sperm surface receptor binds to ZP3 on the zona pellucida. This triggers massive Ca²⁺ influx through CatSper channels, inducing outer acrosomal membrane fusion and exocytosis of hydrolytic enzymes (hyaluronidase and acrosin).',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-107',
    q: 'The slow block to polyspermy (cortical reaction) in mammalian fertilization is executed when sperm-egg membrane fusion triggers:',
    options: [
      'An intracellular wave of free Ca²⁺, stimulating cortical granule exocytosis that enzymatically cleaves ZP proteins and hardens the zona pellucida',
      'Rapid depolarization of the egg oolemma driven by massive sodium influx lasting only 60 seconds',
      'Immediate extrusion of all cortical mitochondria into the perivitelline space',
      'Spontaneous synthesis of a thick chitinous shell around the secondary oocyte'
    ],
    correct: 0,
    topic: 'Fertilization - Cortical Reaction and Polyspermy Prevention',
    chapter: 'Reproduction',
    explain: 'Sperm-egg fusion releases phospholipase C-zeta, triggering oscillatory intracellular Ca²⁺ waves. This causes thousands of cortical granules located just under the oolemma to fuse with the membrane, releasing ovastacin and other proteases that cleave ZP2 and ZP3 (zona reaction), permanently preventing secondary sperm entry.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-108',
    q: 'In angiosperm double fertilization, one sperm nucleus fuses with the egg nucleus to form the diploid zygote (2n), while the second sperm nucleus fuses with:',
    options: [
      'The two haploid polar nuclei of the central cell to produce the triploid endosperm (3n)',
      'The two degenerating synergids to produce the seed coat (testa)',
      'The three antipodal cells to produce the suspensor tissue',
      'The nucellus to form the fruit pericarp'
    ],
    correct: 0,
    topic: 'Plant Reproduction - Double Fertilization in Angiosperms',
    chapter: 'Reproduction',
    explain: 'Double fertilization is unique to angiosperms: of the two male gametes delivered by the pollen tube, one fertilizes the egg cell (producing the 2n zygote), and the other fuses with the diploid central cell (containing two polar nuclei), forming the primary triploid (3n) endosperm nucleus that develops into nutritive tissue.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-109',
    q: 'Syphilis is a sexually transmitted infection caused by which corkscrew-shaped spirochete bacterium, characterized in its primary stage by a painless indurated chancre?',
    options: [
      'Treponema pallidum',
      'Neisseria gonorrhoeae',
      'Chlamydia trachomatis',
      'Haemophilus ducreyi'
    ],
    correct: 0,
    topic: 'Sexually Transmitted Infections - Syphilis (Treponema pallidum)',
    chapter: 'Reproduction',
    explain: 'Treponema pallidum subspecies pallidum is a microaerophilic, motile spirochete that causes syphilis. Primary syphilis presents as a solitary, painless, indurated ulcer (chancre) at the site of inoculation, accompanied by regional lymphadenopathy.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-110',
    q: 'In the developing human blastocyst, which cell layer gives rise directly to the embryo proper, embryonic germ layers (ectoderm, mesoderm, endoderm), and extraembryonic mesoderm?',
    options: [
      'Inner cell mass (embryoblast)',
      'Trophoblast (trophectoderm)',
      'Syncytiotrophoblast',
      'Amniotic ectoderm'
    ],
    correct: 0,
    topic: 'Embryology - Blastocyst Structure (Inner Cell Mass vs Trophoblast)',
    chapter: 'Reproduction',
    explain: 'At the blastocyst stage (day 5-6 post-fertilization), cells segregate into: (1) an outer single layer of trophoblast cells (which form the embryonic portion of the placenta), and (2) an inner cell mass (embryoblast), pluripotential cells that give rise to all tissues of the embryo proper.',
    difficulty: 'Medium',
    subject: 'Biology'
  },

  // --- Genetics (8 MCQs: 111 to 118) ---
  {
    id: 'mdcat-b9-bio-111',
    q: 'In eukaryotic DNA replication, which enzyme synthesizes a short RNA primer complementary to the template DNA strand to provide a free 3\'-OH group for DNA polymerase extension?',
    options: [
      'DNA Primase (part of the Pol α-primase complex)',
      'DNA Topoisomerase I',
      'DNA Polymerase I',
      'DNA Helicase (MCM complex)'
    ],
    correct: 0,
    topic: 'Molecular Genetics - DNA Primase and Primer Synthesis',
    chapter: 'Genetics',
    explain: 'All known DNA polymerases require a pre-existing 3\'-hydroxyl (-OH) terminus to add incoming deoxyribonucleoside triphosphates (dNTPs). DNA primase (an RNA polymerase) synthesizes de novo a short (8-12 nt) RNA primer complementary to the template, enabling DNA polymerases to initiate elongation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-112',
    q: 'Meselson and Stahl demonstrated that DNA replication occurs by a semiconservative mechanism using which isotope labeling technique?',
    options: [
      'Growing E. coli in heavy ¹⁵N-ammonium chloride medium followed by density-gradient centrifugation in cesium chloride (CsCl)',
      'Labeling bacteriophage T2 proteins with radioactive ³⁵S and DNA with ³²P',
      'X-ray diffraction analysis of sodium thymonucleate crystalline fibers',
      'Incorporating tritiated thymidine into human HeLa cell chromosomes'
    ],
    correct: 0,
    topic: 'Molecular Genetics - Meselson-Stahl Experiment',
    chapter: 'Genetics',
    explain: 'Meselson and Stahl (1958) grew E. coli in ¹⁵NH4Cl (heavy nitrogen) and then shifted them to ¹⁴N medium. CsCl equilibrium density-gradient centrifugation after one generation showed a single hybrid ¹⁵N-¹⁴N band, and after two generations showed equal amounts of hybrid and pure ¹⁴N DNA, proving semiconservative replication.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-113',
    q: 'In eukaryotic pre-mRNA processing, the removal of non-coding introns and ligation of coding exons is executed by the spliceosome, which is assembled from:',
    options: [
      'Small nuclear ribonucleoproteins (snRNPs: U1, U2, U4, U5, U6) and associated proteins',
      'Cytoplasmic polyribosomes and aminoacyl-tRNA synthetases',
      'RNA Polymerase II CTD repeats and Rho termination factor',
      'DNA topoisomerase II and DNA ligase III'
    ],
    correct: 0,
    topic: 'Molecular Genetics - Pre-mRNA Splicing and snRNPs',
    chapter: 'Genetics',
    explain: 'Nuclear pre-mRNA splicing occurs via a macromolecular ribonucleoprotein complex termed the spliceosome, composed of five small nuclear RNAs (U1, U2, U4, U5, U6) complexed with proteins (snRNPs). They recognize invariant 5\' splice donor (GU), 3\' splice acceptor (AG), and branch-point adenine sequences.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-114',
    q: 'Hemophilia A is an X-linked recessive bleeding disorder caused by a deficiency of clotting Factor VIII. If a normal woman whose father had hemophilia marries a healthy man, what is the probability that their first son will be affected?',
    options: [
      '50%',
      '100%',
      '25%',
      '0%'
    ],
    correct: 0,
    topic: 'Mendelian Genetics - X-Linked Recessive Inheritance Probability',
    chapter: 'Genetics',
    explain: 'Because her father had hemophilia (XʰY), the woman must have inherited his Xʰ chromosome, making her an obligate carrier (XᴴXʰ). The husband is normal (XᴴY). Given that the child is a son (XY), he has a 50% probability of receiving the maternal Xʰ allele and being affected (XʰY).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-115',
    q: 'In transcription, which consensus hexameric sequence located approximately 10 base pairs upstream of the transcription initiation site in prokaryotic promoters is recognized by the RNA polymerase sigma factor?',
    options: [
      'Pribnow box (TATAAT at -10)',
      'TATA box (Hogness box at -25)',
      'CAAT box at -75',
      'GC box at -100'
    ],
    correct: 0,
    topic: 'Transcription - Prokaryotic Promoters and the Pribnow Box',
    chapter: 'Genetics',
    explain: 'In prokaryotes, the core RNA polymerase associates with a sigma factor (σ70) to recognize consensus promoter elements: the -35 sequence (TTGACA) and the -10 sequence (TATAAT, known as the Pribnow box), where unwinding of the DNA double helix initiates.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-116',
    q: 'Which type of gene mutation results from an insertion or deletion of a number of nucleotides that is not a multiple of three, altering the translational reading frame for all downstream codons?',
    options: [
      'Frameshift mutation',
      'Silent (synonymous) mutation',
      'Missense mutation',
      'Nonsense mutation'
    ],
    correct: 0,
    topic: 'Mutation Types - Frameshift vs Point Mutations',
    chapter: 'Genetics',
    explain: 'Because the genetic code is read in non-overlapping triplets (codons), the insertion or deletion of 1 or 2 nucleotides (or any number not divisible by 3) changes the reading frame downstream of the mutation. This frameshift usually leads to garbled peptide sequences and premature stop codons.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-117',
    q: 'According to the lac operon model formulated by Jacob and Monod, the lac repressor protein encoded by the lacI gene binds to which regulatory DNA element to prevent transcription in the absence of lactose?',
    options: [
      'The operator (lacO)',
      'The CAP/CRP-binding site',
      'The promoter (lacP)',
      'The beta-galactosidase structural gene (lacZ)'
    ],
    correct: 0,
    topic: 'Gene Regulation - Lac Operon Operator and Repressor Function',
    chapter: 'Genetics',
    explain: 'The lac repressor is a homotetramer that binds tightly to the lac operator (lacO) sequence, which physically overlaps the promoter. This sterically blocks RNA polymerase from initiating transcription of the polycistronic structural genes (lacZ, lacY, lacA) when allolactose inducer is absent.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-118',
    q: 'Which of the following describes the stop (nonsense) codons that signal the termination of translation in the standard universal genetic code?',
    options: [
      'UAA (ochre), UAG (amber), and UGA (opal)',
      'AUG, GUG, and UGG',
      'UAA, UAC, and UAU',
      'AGA, AGG, and UGG'
    ],
    correct: 0,
    topic: 'Genetic Code - Termination Codons and Release Factors',
    chapter: 'Genetics',
    explain: 'Of the 64 codons, 61 code for amino acids, while 3 (UAA, UAG, and UGA) do not specify any amino acid and are not recognized by normal tRNAs. Instead, they are bound by protein release factors (eRF1 in eukaryotes; RF1/RF2 in prokaryotes), terminating translation.',
    difficulty: 'Easy',
    subject: 'Biology'
  },

  // --- Biotechnology (9 MCQs: 119 to 127) ---
  {
    id: 'mdcat-b9-bio-119',
    q: 'In recombinant DNA technology, Type II restriction endonucleases (such as EcoRI) are widely utilized molecular tools because they cleave double-stranded DNA at:',
    options: [
      'Specific palindromic recognition sequences, often generating cohesive ("sticky") staggered single-stranded overhangs',
      'Random single-stranded pyrimidine tracts without sequence specificity',
      'Methylated cytosine residues located exclusively at telomeric ends',
      'The 5\' cap of eukaryotic mature messenger RNAs'
    ],
    correct: 0,
    topic: 'Recombinant DNA - Type II Restriction Endonucleases and EcoRI',
    chapter: 'Biotechnology',
    explain: 'Type II restriction endonucleases recognize specific palindromic sequences (e.g., EcoRI recognizes 5\'-GAATTC-3\') and cleave both strands at defined phosphodiester bonds within the sequence, producing self-complementary cohesive ("sticky") ends that can anneal with foreign fragments digested by the same enzyme.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-120',
    q: 'In the Polymerase Chain Reaction (PCR), what is the biochemical role of Taq DNA polymerase, and why is it preferred over human DNA polymerase?',
    options: [
      'It is isolated from the thermophilic bacterium Thermus aquaticus and resists thermal denaturation during the 94-95°C denaturation step',
      'It possesses 3\' to 5\' exonuclease proofreading activity that is 100 times faster than eukaryotic polymerases',
      'It can synthesize DNA directly from an RNA template without primer annealing',
      'It operates at room temperature without requiring divalent magnesium ions'
    ],
    correct: 0,
    topic: 'PCR - Taq Polymerase and Thermostability',
    chapter: 'Biotechnology',
    explain: 'Taq polymerase is extracted from Thermus aquaticus, a thermophile living in geothermal hot springs. Its optimal temperature is ~72°C, and it withstands repeated exposure to 94-95°C without denaturation, eliminating the need to add fresh enzyme after each thermal cycle.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-121',
    q: 'In blue-white colony screening of recombinant bacterial transformants using plasmids like pUC19, insertion of foreign target DNA into the multiple cloning site (MCS) results in:',
    options: [
      'Insertional inactivation of the lacZ\' gene, preventing functional beta-galactosidase production and producing white colonies on X-gal plates',
      'Activation of the lacZ\' gene, resulting in deep blue colony pigmentation on IPTG/X-gal agar',
      'Inactivation of the ampicillin resistance gene, killing recombinant bacteria',
      'Constitutive GFP fluorescence under ultraviolet excitation'
    ],
    correct: 0,
    topic: 'Cloning Vectors - Insertional Inactivation and Blue-White Screening',
    chapter: 'Biotechnology',
    explain: 'The Multiple Cloning Site (MCS) is located within the coding sequence of the lacZ\' alpha-peptide. Insertion of a foreign DNA fragment interrupts the reading frame (insertional inactivation). Recombinant bacteria cannot produce functional β-galactosidase and cannot hydrolyze X-gal (5-bromo-4-chloro-3-indolyl-β-D-galactoside), forming white colonies.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-122',
    q: 'In forensic DNA profiling, Short Tandem Repeats (STRs) are analyzed primarily by which combination of molecular techniques?',
    options: [
      'Multiplex PCR amplification using fluorescent primers followed by capillary electrophoresis',
      'Southern blotting hybridized with whole mitochondrial genome probes',
      'Direct Sanger sequencing of the entire Y chromosome',
      'Paper chromatography of radioactive nucleotide monophosphates'
    ],
    correct: 0,
    topic: 'Forensic Biotechnology - Short Tandem Repeats (STRs) and Capillary Electrophoresis',
    chapter: 'Biotechnology',
    explain: 'Modern forensic DNA profiling assesses polymorphism in length of STR loci (2-6 bp repeating core units, e.g., TH01, vWA). Flanking primers amplify the loci via multiplex fluorescent PCR, and products are resolved by high-resolution capillary electrophoresis to determine the number of repeats.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-123',
    q: 'What is the role of DNA ligase in molecular cloning?',
    options: [
      'Catalyzing the formation of covalent phosphodiester bonds between adjacent 3\'-OH and 5\'-phosphate DNA termini',
      'Cleaving interior phosphodiester bonds at specific 6-base palindromic sites',
      'Adding single adenylate nucleotides to the 3\' ends of PCR products',
      'Removing terminal phosphate groups to prevent plasmid recircularization'
    ],
    correct: 0,
    topic: 'Recombinant DNA - DNA Ligase and Phosphodiester Bond Formation',
    chapter: 'Biotechnology',
    explain: 'DNA ligase (typically from bacteriophage T4) utilizes ATP (or NAD⁺ in bacteria) to seal nicks in the double-stranded DNA backbone by forming a covalent 3\'-5\' phosphodiester linkage between juxtaposed 3\'-hydroxyl and 5\'-monophosphate ends.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-124',
    q: 'Which molecular probe technique is specifically designed for the detection and semi-quantitative analysis of specific target RNA transcripts separated by gel electrophoresis?',
    options: [
      'Northern blotting',
      'Southern blotting',
      'Western blotting',
      'Eastern blotting'
    ],
    correct: 0,
    topic: 'Biotechnological Techniques - Northern vs Southern vs Western Blotting',
    chapter: 'Biotechnology',
    explain: 'Blotting techniques: Southern blot = DNA detection; Northern blot = RNA detection (evaluating gene expression/transcripts); Western blot = protein detection using antibodies; Eastern blot = post-translational protein modifications (lipids/glycans).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-125',
    q: 'In the CRISPR-Cas9 genome-editing system derived from bacterial adaptive immune defense, what component directs the Cas9 endonuclease to introduce a double-stranded break at a specific genomic locus?',
    options: [
      'A synthetic single-guide RNA (sgRNA) whose 20-nucleotide spacer is complementary to the target protospacer sequence adjacent to a PAM motif',
      'A sequence-specific transcription factor containing zinc finger motifs',
      'A restriction methyltransferase recognizing hemimethylated CpG islands',
      'A reverse transcriptase enzyme carrying an oligo-dT primer'
    ],
    correct: 0,
    topic: 'Gene Editing - CRISPR-Cas9 Mechanism and Guide RNA',
    chapter: 'Biotechnology',
    explain: 'Cas9 is an RNA-guided DNA endonuclease. A single guide RNA (sgRNA) contains a 20-nt guide sequence that base-pairs with the target genomic DNA strand immediately adjacent to a Protospacer Adjacent Motif (PAM: 5\'-NGG-3\'). Cas9\'s RuvC and HNH nuclease domains then introduce a precise double-stranded break.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-126',
    q: 'Human insulin produced via recombinant DNA technology in E. coli (Humulin) avoided early protein misfolding and inclusion body issues by which strategy?',
    options: [
      'Expressing the A and B polypeptide chains separately as chimeric beta-galactosidase fusion proteins, purifying them, and combining them chemically with disulfide bonds',
      'Cloning the full human preproinsulin gene directly into E. coli without removing introns',
      'Synthesizing human insulin chemically using non-biological solid-phase peptide synthesizers',
      'Injecting the proinsulin plasmid directly into mammalian milk fat globule membranes'
    ],
    correct: 0,
    topic: 'Transgenic Applications - Recombinant Human Insulin (Humulin) Production',
    chapter: 'Biotechnology',
    explain: 'Genentech produced recombinant human insulin by synthesizing two separate cDNA constructs encoding the A-chain (21 amino acids) and B-chain (30 amino acids), each fused to the C-terminus of β-galactosidase in E. coli. After cyanogen bromide cleavage and purification, chains were mixed and oxidized to form native disulfide bonds.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-127',
    q: 'Which technique is employed to introduce recombinant DNA into plant cells by coating microscopic tungsten or gold microprojectiles with DNA and accelerating them into target tissues at high velocity?',
    options: [
      'Biolistics (Gene gun method)',
      'Lipofection',
      'Heat-shock transformation using CaCl2',
      'Microinjection with glass micropipettes under an inverted microscope'
    ],
    correct: 0,
    topic: 'Gene Transfer Methods - Biolistics (Gene Gun)',
    chapter: 'Biotechnology',
    explain: 'Biolistics (particle bombardment or gene gun) is a physical gene delivery method especially useful for plant cells with thick, rigid cellulose walls and for chloroplast transformation. Heavy metal particles (gold or tungsten) coated with plasmid DNA are propelled at high velocity by helium discharge.',
    difficulty: 'Medium',
    subject: 'Biology'
  },

  // --- Evolution (8 MCQs: 128 to 135) ---
  {
    id: 'mdcat-b9-bio-128',
    q: 'According to the Hardy-Weinberg equilibrium principle (p² + 2pq + q² = 1), allele and genotype frequencies in a population remain constant across generations only in the absence of which evolutionary force?',
    options: [
      'Natural selection, genetic drift, gene flow (migration), mutation, and non-random mating',
      'Independent assortment during meiotic anaphase I',
      'Random segregation of maternal and paternal chromosomes',
      'Crossing over between homologous chromatids in pachytene'
    ],
    correct: 0,
    topic: 'Population Genetics - Hardy-Weinberg Assumptions',
    chapter: 'Evolution',
    explain: 'Hardy-Weinberg equilibrium requires five strict conditions: (1) infinitely large population size (no genetic drift), (2) completely random mating (panmixia), (3) no mutations, (4) no gene flow (immigration or emigration), and (5) no natural selection. Normal meiotic segregation does not alter allele frequencies.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-129',
    q: 'In a population adhering to Hardy-Weinberg equilibrium, the incidence of an autosomal recessive metabolic disorder is 1 in 10,000 (q² = 0.0001). What is the frequency of asymptomatic heterozygous carriers (2pq) in this population?',
    options: [
      'Approximately 1.98% (or ~1 in 50 individuals)',
      'Approximately 0.01% (or 1 in 10,000 individuals)',
      'Approximately 10% (or 1 in 10 individuals)',
      'Approximately 0.5% (or 1 in 200 individuals)'
    ],
    correct: 0,
    topic: 'Population Genetics - Hardy-Weinberg Equation Calculation',
    chapter: 'Evolution',
    explain: 'q² = 0.0001 → q = √0.0001 = 0.01. Since p + q = 1, p = 1 - 0.01 = 0.99. The carrier frequency is 2pq = 2 × (0.99) × (0.01) = 0.0198 (1.98%), which is roughly 1 out of every 50 individuals.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-130',
    q: 'Homologous anatomical structures, such as the pentadactyl forelimb skeleton of humans, bats, whales, and horses, provide compelling evidence for:',
    options: [
      'Divergent evolution from a common ancestral tetrapod ancestor',
      'Convergent evolution under identical selective ecological pressures',
      'Lamarckian inheritance of acquired somatic adaptations',
      'Analogous functional adaptations without shared phylogenetic ancestry'
    ],
    correct: 0,
    topic: 'Evidence for Evolution - Homology and Divergent Evolution',
    chapter: 'Evolution',
    explain: 'Homologous structures share a common developmental and anatomical origin (e.g., the tetrapod pentadactyl limb architecture: humerus, radius, ulna, carpals, metacarpals, phalanges) despite being modified for diverse functions (grasping, flying, swimming, running), illustrating divergent evolution.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-131',
    q: 'The hydrodynamic streamlined body morphology shared by dolphins (mammals) and sharks (cartilaginous fish) is a classic example of:',
    options: [
      'Convergent evolution producing analogous structures in unrelated lineages',
      'Divergent evolution of homologous skeletal frameworks',
      'Adaptive radiation within a single monophyletic mammalian order',
      'Sympatric speciation mediated by polyploidization'
    ],
    correct: 0,
    topic: 'Evolutionary Patterns - Convergent Evolution and Analogy',
    chapter: 'Evolution',
    explain: 'Dolphins and sharks belong to separate vertebrate classes with distinct evolutionary origins (mammalian vs chondrichthyan). Their similar fusiform hydrodynamic body shapes and dorsal stabilization fins arose independently through convergent evolution in response to the physical constraints of aquatic locomotion.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-132',
    q: 'Which evolutionary mechanism leads to random fluctuations in allele frequencies between generations purely due to stochastic sampling error, exerting its most pronounced effects in small isolated populations?',
    options: [
      'Genetic drift (e.g., founder effect and population bottleneck)',
      'Directional natural selection favoring extreme phenotypes',
      'High rates of bidirectional gene flow between continents',
      'Disruptive selection promoting bimodal polymorphs'
    ],
    correct: 0,
    topic: 'Mechanisms of Evolution - Genetic Drift and Bottleneck Effect',
    chapter: 'Evolution',
    explain: 'Genetic drift refers to random changes in allele frequencies from one generation to the next due to chance events in small populations. Major mechanisms include the bottleneck effect (catastrophic reduction in population size) and the founder effect (colonization of a new area by a few individuals).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-133',
    q: 'In the endosymbiotic theory formulated by Lynn Margulis, which line of empirical evidence supports the evolutionary origin of mitochondria and chloroplasts from engulfed aerobic bacteria and photosynthetic cyanobacteria?',
    options: [
      'They contain their own circular DNA, possess 70S ribosomes, replicate by binary fission, and have an inner membrane rich in cardiolipin',
      'They possess linear chromosomes complexed with eukaryotic histone octamers and 80S ribosomes',
      'Their outer membranes contain peptidoglycan and teichoic acids identical to Gram-positive bacteria',
      'They depend entirely on nuclear transcription factors and cannot perform protein synthesis'
    ],
    correct: 0,
    topic: 'Endosymbiotic Theory - Origin of Mitochondria and Chloroplasts',
    chapter: 'Evolution',
    explain: 'Lines of evidence for endosymbiosis: (1) semi-autonomous circular double-stranded DNA without histones; (2) prokaryotic-like 70S ribosomes sensitive to bacterial antibiotics like chloramphenicol; (3) division by binary fission; (4) inner membrane containing cardiolipin and lacking cholesterol.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-134',
    q: 'Which mode of natural selection acts against phenotypic extremes and favors intermediate variants, reducing phenotypic variation in a population living in an unchanging environment?',
    options: [
      'Stabilizing selection (e.g., human birth weight)',
      'Directional selection (e.g., industrial melanism in peppered moths)',
      'Disruptive (diversifying) selection',
      'Frequency-dependent balancing selection'
    ],
    correct: 0,
    topic: 'Modes of Selection - Stabilizing vs Directional vs Disruptive',
    chapter: 'Evolution',
    explain: 'Stabilizing selection favors average or intermediate phenotypes while selecting against both extremes of the trait distribution. A classic textbook example is human birth weight: infants much lighter or much heavier than ~3.0-3.5 kg face significantly higher neonatal mortality.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-b9-bio-135',
    q: 'Allopatric speciation differs primarily from sympatric speciation because it requires:',
    options: [
      'Extrinsic geographic isolation (e.g., physical barriers like mountain ranges or rivers) preventing gene flow between divided sub-populations',
      'Polyploidization during meiosis inside a shared contiguous habitat',
      'Rapid behavioral sexual isolation without any physical geographical separation',
      'The colonization of an oceanic island by a single pregnant female without genetic divergence'
    ],
    correct: 0,
    topic: 'Speciation Mechanisms - Allopatric vs Sympatric Speciation',
    chapter: 'Evolution',
    explain: 'Allopatric speciation ("other homeland") requires geographic separation of populations by a physical barrier (vicariance or dispersal). Over time, genetic drift and divergent natural selection accumulate reproductive isolating mechanisms, so populations cannot interbreed even if reunited.',
    difficulty: 'Easy',
    subject: 'Biology'
  }
];
