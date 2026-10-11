import { Question } from '../types';

export const MDCAT_BIOLOGY_PART2_QUESTIONS: Question[] = [
  // --- Homeostasis (8 MCQs: 3 Easy, 2 Medium, 3 Hard) ---
  {
    id: 'mdcat-new-bio-72',
    q: 'What is the primary structural and functional microscopic unit of the mammalian kidney?',
    options: ['Nephron', 'Renal pelvis', 'Glomerulus alone', 'Ureter'],
    correct: 0,
    topic: 'Homeostasis',
    explain: 'The nephron is the basic structural and functional unit of the kidney, responsible for ultrafiltration, selective tubular reabsorption, and secretion.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-73',
    q: 'Which nitrogenous metabolic waste product is excreted primarily by birds, reptiles, and terrestrial insects to maximize water conservation?',
    options: ['Uric acid', 'Urea', 'Ammonia', 'Creatinine'],
    correct: 0,
    topic: 'Homeostasis',
    explain: 'Uric acid is virtually insoluble in water and non-toxic, requiring minimal water for excretion as a semi-solid paste, an adaptation for terrestrial and egg-laying animals.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-74',
    q: 'In the human nephron, where does non-selective ultrafiltration of blood plasma take place?',
    options: [
      'Between the glomerulus capillaries and Bowman\'s capsule',
      'Along the ascending limb of the loop of Henle',
      'In the medullary collecting duct',
      'Across the peritubular capillary network'
    ],
    correct: 0,
    topic: 'Homeostasis',
    explain: 'High hydrostatic pressure in the glomerular capillary bed forces water, ions, glucose, amino acids, and urea through fenestrations into Bowman\'s space, forming the primary glomerular filtrate.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-75',
    q: 'Which portion of the Loop of Henle is permeable to water but impermeable to sodium and chloride ions?',
    options: [
      'Thin descending limb',
      'Thick ascending limb',
      'Distal convoluted tubule',
      'Cortical collecting duct'
    ],
    correct: 0,
    topic: 'Homeostasis',
    explain: 'The descending limb is permeable to water (via aquaporins) but impermeable to solutes, concentrating filtrate as it descends into the hypertonic medullary interstitium. The ascending limb actively pumps NaCl and is impermeable to water.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-76',
    q: 'Antidiuretic hormone (ADH / vasopressin), released from the posterior pituitary in response to dehydration, acts primarily on which nephron segments?',
    options: [
      'Late distal convoluted tubules and collecting ducts to insert aquaporin-2 channels',
      'Proximal convoluted tubules to stimulate sodium reabsorption',
      'Afferent arterioles to cause systemic vasodilation',
      'Bowman\'s capsule podocytes to widen filtration slits'
    ],
    correct: 0,
    topic: 'Homeostasis',
    explain: 'ADH binds to V2 receptors in late distal tubules and collecting ducts, triggering the insertion of aquaporin-2 water channels into apical membranes, increasing water reabsorption and producing concentrated urine.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-77',
    q: 'In the renin-angiotensin-aldosterone system (RAAS), what physiological stimulus triggers the juxtaglomerular apparatus (JGA) to secrete renin into the bloodstream?',
    options: [
      'Decreased renal perfusion pressure, low circulating blood volume, or reduced NaCl delivery to the macula densa',
      'Elevated systemic blood pressure and hypervolemia',
      'High sodium concentration in the distal convoluted tubule detected by podocytes',
      'Excess secretion of atrial natriuretic peptide (ANP)'
    ],
    correct: 0,
    topic: 'Homeostasis',
    explain: 'Juxtaglomerular cells secrete renin in response to a drop in blood pressure/volume, sympathetic nerve stimulation, or decreased NaCl load arriving at the macula densa.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-78',
    q: 'How does aldosterone regulate electrolyte homeostasis in the late distal tubule and cortical collecting duct?',
    options: [
      'Increases Na⁺ reabsorption and enhances K⁺ and H⁺ secretion',
      'Inhibits Na⁺ reabsorption and causes K⁺ retention',
      'Blocks Ca²⁺ reabsorption while promoting phosphate reabsorption',
      'Suppresses all active transport across the basolateral membrane'
    ],
    correct: 0,
    topic: 'Homeostasis',
    explain: 'Aldosterone, secreted by the adrenal cortex, upregulates basolateral Na⁺/K⁺ ATPase pumps and apical epithelial Na⁺ channels (ENaC), driving Na⁺ (and water) reabsorption while secreting K⁺ into the tubular lumen.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-79',
    q: 'What is the primary physiological mechanism that maintains the hypertonic medullary osmotic gradient (up to 1200 mOsm/L) in the mammalian kidney?',
    options: [
      'Countercurrent multiplier action of the loops of Henle coupled with countercurrent exchange in the vasa recta and urea recycling',
      'Continuous active transport of glucose out of the proximal convoluted tubule',
      'Passive diffusion of proteins out of the collecting duct',
      'High hydrostatic pressure generated inside the renal pelvis'
    ],
    correct: 0,
    topic: 'Homeostasis',
    explain: 'The hypertonic medullary gradient is established by the active NaCl extrusion from ascending limbs (countercurrent multiplication), maintained by hairpin vasa recta capillaries that minimize solute washout (countercurrent exchange), and augmented by inner medullary urea recycling.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Gaseous Exchange (8 MCQs: 2 Easy, 3 Medium, 3 Hard) ---
  {
    id: 'mdcat-new-bio-80',
    q: 'What specialized phospholipid-protein mixture is secreted by Type II alveolar cells to reduce surface tension and prevent alveolar collapse during exhalation?',
    options: ['Pulmonary surfactant (dipalmitoylphosphatidylcholine)', 'Mucus glycoprotein', 'Blood plasma albumin', 'Lysozyme enzyme'],
    correct: 0,
    topic: 'Gaseous Exchange',
    explain: 'Type II alveolar pneumocytes secrete pulmonary surfactant, which reduces the surface tension of the alveolar fluid lining, preventing alveolar atelectasis (collapse) during expiration.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-81',
    q: 'How is the majority (~70%) of carbon dioxide transported in the systemic human blood from tissues to the lungs?',
    options: [
      'As bicarbonate ions (HCO₃⁻) dissolved in the blood plasma',
      'As carbaminohemoglobin bound to globin amino chains',
      'As dissolved CO₂ gas molecules in solution in plasma',
      'As carboxyhemoglobin bound to the iron heme group'
    ],
    correct: 0,
    topic: 'Gaseous Exchange',
    explain: 'Roughly 70% of CO₂ is converted inside erythrocytes by carbonic anhydrase into carbonic acid, which dissociates into H⁺ and bicarbonate (HCO₃⁻). Bicarbonate is transported in plasma via the chloride shift.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-82',
    q: 'What does the "Chloride Shift" (Hamburger phenomenon) refer to in erythrocyte physiology during gas exchange at systemic tissues?',
    options: [
      'Movement of Cl⁻ ions into red blood cells in exchange for outgoing HCO₃⁻ ions to maintain electrical neutrality',
      'Active pumping of Cl⁻ out of erythrocytes into the interstitial fluid',
      'Binding of chloride ions to heme to displace bound oxygen molecules',
      'Excretion of NaCl into the urine during hyperventilation'
    ],
    correct: 0,
    topic: 'Gaseous Exchange',
    explain: 'As bicarbonate (HCO₃⁻) diffuses out of red blood cells into plasma through an anion antiporter, chloride (Cl⁻) ions diffuse in to balance electrical charge across the erythrocyte membrane.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-83',
    q: 'How does the "Bohr Effect" facilitate oxygen release to metabolically active tissues?',
    options: [
      'Elevated CO₂ and lower pH (higher H⁺) decrease hemoglobin\'s affinity for O₂, shifting the dissociation curve to the right',
      'Decreased temperature increases hemoglobin\'s oxygen binding capacity',
      'High alveolar pO₂ forces oxygen off hemoglobin subunits',
      'Alkaline pH triggers hemoglobin denaturation'
    ],
    correct: 0,
    topic: 'Gaseous Exchange',
    explain: 'The Bohr effect describes how higher CO₂ and H⁺ concentrations (acidosis) in active tissues stabilize the deoxygenated T-state of hemoglobin, lowering its O₂ affinity and promoting O₂ unloading.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-84',
    q: 'Where is the primary involuntary respiratory control rhythmicity center located in the human brainstem?',
    options: ['Medulla oblongata and pons', 'Cerebellum and thalamus', 'Hypothalamus and frontal cortex', 'Hippocampus and basal ganglia'],
    correct: 0,
    topic: 'Gaseous Exchange',
    explain: 'The respiratory rhythmicity center is in the medulla oblongata (ventral and dorsal respiratory groups), with fine-tuning provided by the pontine respiratory group (pneumotaxic and apneustic centers).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-85',
    q: 'Why does fetal hemoglobin (HbF) have a higher oxygen binding affinity than maternal adult hemoglobin (HbA) across physiological oxygen partial pressures?',
    options: [
      'HbF possesses two gamma (γ) chains instead of beta (β) chains, giving it a much lower binding affinity for 2,3-bisphosphoglycerate (2,3-BPG)',
      'HbF contains 8 heme iron groups instead of 4',
      'HbF is completely immune to the Bohr effect',
      'Maternal blood operates at a lower pH than fetal placental capillaries'
    ],
    correct: 0,
    topic: 'Gaseous Exchange',
    explain: 'Fetal hemoglobin contains α₂γ₂ subunits. The γ globin subunit lacks a histidine residue involved in 2,3-BPG binding, reducing 2,3-BPG inhibition and giving HbF a higher O₂ affinity to extract oxygen from maternal blood.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-86',
    q: 'Central chemoreceptors located on the ventrolateral surface of the medulla oblongata respond primarily to changes in which chemical parameter in the cerebrospinal fluid (CSF)?',
    options: [
      'Hydrogen ion concentration ([H⁺]) resulting from the diffusion of arterial CO₂ across the blood-brain barrier',
      'Direct arterial partial pressure of dissolved oxygen (pO₂)',
      'Blood sodium and potassium concentrations',
      'Plasma bicarbonate concentration entering CSF through pores'
    ],
    correct: 0,
    topic: 'Gaseous Exchange',
    explain: 'Central chemoreceptors monitor CSF pH. CO₂ readily diffuses across the blood-brain barrier into CSF, where carbonic anhydrase generates carbonic acid and H⁺ ions, stimulating central chemoreceptors to drive ventilation.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-87',
    q: 'What is the "Haldane Effect" in respiratory physiology?',
    options: [
      'Deoxygenation of hemoglobin increases its affinity for carbon dioxide and H⁺, enhancing CO₂ loading at tissues',
      'Elevated oxygen levels accelerate the rate of anaerobic glycolysis in lungs',
      'Hyperventilation causes acute respiratory acidosis by retaining bicarbonate',
      'Diffusion capacity of oxygen increases as pulmonary arterial pressure falls'
    ],
    correct: 0,
    topic: 'Gaseous Exchange',
    explain: 'The Haldane effect states that oxygen release from hemoglobin increases hemoglobin\'s basicity and affinity to bind CO₂ and H⁺ at systemic tissues, while oxygenation in lungs promotes CO₂ unloading.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Coordination and Control (8 MCQs: 3 Easy, 3 Medium, 2 Hard) ---
  {
    id: 'mdcat-new-bio-88',
    q: 'What is the approximate resting membrane potential of a typical mammalian neuron, and which ion pump is primarily responsible for maintaining it?',
    options: [
      '-70 mV; maintained by the electrogenic Na⁺/K⁺ ATPase pump (pumping 3 Na⁺ out for 2 K⁺ in)',
      '+30 mV; maintained by passive calcium diffusion channels',
      '0 mV; maintained by equal distribution of chloride ions',
      '-90 mV; maintained by potassium inflow alone'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'A resting mammalian neuron has a potential of about -70 mV. The Na⁺/K⁺ ATPase pump continuously expels 3 Na⁺ for every 2 K⁺ brought in, maintaining the concentration gradient alongside K⁺ leak channels.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-89',
    q: 'During the depolarizing phase of a neuronal action potential, which event occurs across the axon membrane?',
    options: [
      'Rapid influx of Na⁺ ions through voltage-gated sodium channels',
      'Massive efflux of K⁺ ions through delayed rectifier channels',
      'Active pumping of Ca²⁺ out of the axoplasm',
      'Hyperpolarization due to chloride ion inflow'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'When threshold potential (~ -55 mV) is reached, voltage-gated Na⁺ channels open, causing a rapid influx of Na⁺ driven by its electrochemical gradient, depolarizing the membrane toward +30 mV.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-90',
    q: 'Which master endocrine gland is anatomically connected to the hypothalamus via the infundibulum and hypophyseal portal system?',
    options: ['Pituitary gland (Hypophysis)', 'Thyroid gland', 'Adrenal gland', 'Pineal gland'],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'The pituitary gland sits in the sella turcica connected to the hypothalamus by the infundibular stalk and receives hypothalamic releasing hormones through the hypophyseal portal system.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-91',
    q: 'Saltatory conduction in myelinated axons increases action potential propagation velocity because the impulse:',
    options: [
      'Jumps from one Node of Ranvier to the next where voltage-gated channels are clustered',
      'Travels through the lipid myelin sheath without involving ions',
      'Bypasses all axon terminals and flows directly into muscle fibers',
      'Relies on continuous unhindered opening of Na⁺ channels along every millimeter'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Myelin acts as an electrical insulator. Depolarization only occurs at the uninsulated gaps known as Nodes of Ranvier, allowing the action potential to "jump" rapidly via saltatory conduction.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-92',
    q: 'When an action potential arrives at a chemical presynaptic axon terminal, what triggers the exocytosis of neurotransmitter vesicles into the synaptic cleft?',
    options: [
      'Influx of extracellular Ca²⁺ through voltage-gated calcium channels',
      'Efflux of intracellular K⁺ ions through leak channels',
      'Active transport of Cl⁻ ions into the vesicle lumen',
      'Direct mechanical contact between actin filaments'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Depolarization opens voltage-gated Ca²⁺ channels. Calcium influx triggers synaptotagmin and SNARE proteins, causing synaptic vesicles to fuse with the presynaptic membrane and release neurotransmitters.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-93',
    q: 'Which hormone synthesized by the beta-cells of the islets of Langerhans lowers blood glucose concentration by promoting cellular glucose uptake and glycogen storage?',
    options: ['Insulin', 'Glucagon', 'Somatostatin', 'Epinephrine'],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Insulin stimulates target tissues (skeletal muscle, adipocytes, liver) to translocate GLUT4 transporters to cell membranes, accelerating glucose uptake and promoting glycogenesis and lipogenesis.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-94',
    q: 'What is the physiological role of the absolute refractory period in a neuron?',
    options: [
      'Ensures unidirectional forward propagation of action potentials and sets an upper limit on firing frequency',
      'Allows neurotransmitters to be recycled via retrograde axoplasmic transport',
      'Prevents K⁺ leak channels from maintaining the resting potential',
      'Causes spontaneous continuous firing of the neuron'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'During the absolute refractory period, voltage-gated Na⁺ channels are inactivated. No stimulus, regardless of strength, can trigger another action potential, ensuring unidirectional propagation and capping firing frequency.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-95',
    q: 'Graves\' disease is an autoimmune hyperthyroid condition caused by which immunopathologic mechanism?',
    options: [
      'Autoantibodies (thyroid-stimulating immunoglobulins) bind and continuously activate TSH receptors on thyroid follicular cells',
      'Autoantibodies destroy thyroid follicles causing permanent myxedema',
      'Immune complexes deposit in the anterior pituitary, destroying thyrotrophs',
      'Severe dietary iodine deficiency preventing thyroxine synthesis'
    ],
    correct: 0,
    topic: 'Coordination and Control',
    explain: 'Graves\' disease involves autoantibodies (TSI) that bind to and activate the TSH receptor, stimulating unregulated synthesis of T3 and T4, leading to hyperthyroidism, goiter, and exophthalmos.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Support and Movement (8 MCQs: 3 Easy, 2 Medium, 3 Hard) ---
  {
    id: 'mdcat-new-bio-96',
    q: 'What is the basic functional contractile unit of a myofibril bounded between two adjacent Z-lines called?',
    options: ['Sarcomere', 'Sarcolemma', 'Sarcoplasmic reticulum', 'Myofilament'],
    correct: 0,
    topic: 'Support and Movement',
    explain: 'A sarcomere is the segment of a myofibril between two consecutive Z-lines, consisting of interleaved thick (myosin) and thin (actin) filaments.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-97',
    q: 'In the sliding filament model of skeletal muscle contraction, what happens to the length of the A-band during full sarcomere contraction?',
    options: [
      'The A-band length remains constant',
      'The A-band length shortens significantly',
      'The A-band length elongates',
      'The A-band completely disappears'
    ],
    correct: 0,
    topic: 'Support and Movement',
    explain: 'The A-band corresponds to the full length of the thick myosin filaments. Because filaments slide past one another without shortening, the A-band length remains unchanged, while I-bands and the H-zone narrow.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-98',
    q: 'Which fibrous connective tissue connects skeletal muscle directly to bone?',
    options: ['Tendon', 'Ligament', 'Cartilage', 'Synovial membrane'],
    correct: 0,
    topic: 'Support and Movement',
    explain: 'Tendons are dense regular connective tissue structures that transmit tensile force from skeletal muscle to bone. Ligaments connect bone to bone.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-99',
    q: 'During excitation-contraction coupling in skeletal muscle, calcium ions (Ca²⁺) released from the terminal cisternae bind directly to which regulatory protein?',
    options: ['Troponin C', 'Tropomyosin', 'Myosin regulatory light chain', 'Actin globular monomer'],
    correct: 0,
    topic: 'Support and Movement',
    explain: 'Ca²⁺ binds to troponin C. This induces a conformational shift in the troponin-tropomyosin complex, rolling tropomyosin away from myosin-binding sites on actin and allowing cross-bridge cycling.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-100',
    q: 'What event causes the detachment of the myosin cross-bridge head from the actin filament at the conclusion of the power stroke?',
    options: [
      'Binding of a new ATP molecule to the myosin head',
      'Hydrolysis of ATP into ADP and inorganic phosphate',
      'Re-uptake of calcium ions into the sarcoplasmic reticulum',
      'Release of acetylcholine at the neuromuscular junction'
    ],
    correct: 0,
    topic: 'Support and Movement',
    explain: 'ATP binding causes cross-bridge dissociation. Without fresh ATP (as occurs post-mortem), cross-bridges remain locked in place, producing rigor mortis.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-101',
    q: 'Why does rigor mortis develop in skeletal muscles several hours following clinical death?',
    options: [
      'Cellular ATP depletion prevents cross-bridge detachment, locking myosin heads onto actin filaments',
      'Massive overproduction of lactic acid dissolves the myofilaments',
      'Excess active transport of calcium into the sarcoplasmic reticulum',
      'Rapid breakdown of troponin by autophagic enzymes'
    ],
    correct: 0,
    topic: 'Support and Movement',
    explain: 'Post-mortem ATP depletion halts the Ca²⁺ pumps, causing Ca²⁺ leakage into the sarcoplasm. Myosin heads bind actin and execute a power stroke, but cannot detach without fresh ATP, locking muscles in rigor mortis.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-102',
    q: 'What is the role of the transverse tubule (T-tubule) network in skeletal muscle fiber physiology?',
    options: [
      'Conducts surface action potentials deep into the interior of the muscle fiber to synchronize calcium release from the sarcoplasmic reticulum',
      'Synthesizes ATP molecules via anaerobic fermentation',
      'Stores glycogen reserves for emergency contractile bursts',
      'Pumps sodium ions out of the muscle fiber during relaxation'
    ],
    correct: 0,
    topic: 'Support and Movement',
    explain: 'T-tubules are invaginations of the sarcolemma that conduct electrical action potentials to the triad junctions, depolarizing dihydropyridine receptors (DHPR) to open ryanodine receptors (RyR1) and release Ca²⁺.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-103',
    q: 'Which bone cell is responsible for bone resorption and mineral demineralization through the secretion of acid and lysosomal proteases?',
    options: ['Osteoclast', 'Osteoblast', 'Osteocyte', 'Chondrocyte'],
    correct: 0,
    topic: 'Support and Movement',
    explain: 'Osteoclasts are multinucleated giant cells derived from macrophage lineages that resorb bone by secreting H⁺ (dissolving hydroxyapatite) and cathepsin K (degrading collagen). Osteoblasts lay down new bone matrix.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Reproduction (8 MCQs: 2 Easy, 3 Medium, 3 Hard) ---
  {
    id: 'mdcat-new-bio-104',
    q: 'In the male reproductive system, where does spermatogenesis (sperm development) take place?',
    options: ['Seminiferous tubules of the testes', 'Epididymis', 'Prostate gland', 'Vas deferens'],
    correct: 0,
    topic: 'Reproduction',
    explain: 'Spermatogenesis occurs in the walls of the seminiferous tubules of the testes, supported by Sertoli nurse cells. Sperm subsequently mature and acquire motility in the epididymis.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-105',
    q: 'What is the primary function of the acrosome located at the anterior tip of a mature human spermatozoon?',
    options: [
      'Contains hydrolytic enzymes (hyaluronidase and acrosin) that digest the corona radiata and zona pellucida of the ovum',
      'Generates ATP for flagellar propulsion',
      'Anchors the sperm tail to the centriole',
      'Stores paternal genetic chromosomes'
    ],
    correct: 0,
    topic: 'Reproduction',
    explain: 'The acrosome is a modified Golgi vesicle containing hydrolytic enzymes (hyaluronidase, acrosin) released during the acrosome reaction to penetrate the outer protective coats of the oocyte.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-106',
    q: 'What hormonal event directly triggers ovulation (release of the secondary oocyte from the mature Graafian follicle) around day 14 of the human menstrual cycle?',
    options: [
      'A sharp surge in Luteinizing Hormone (LH) caused by positive feedback from peak estrogen levels',
      'A sudden drop in progesterone concentration',
      'Secretion of human chorionic gonadotropin (hCG) by the unfertilized oocyte',
      'A sharp surge in prolactin from the anterior pituitary'
    ],
    correct: 0,
    topic: 'Reproduction',
    explain: 'High levels of estrogen secreted by the dominant Graafian follicle trigger positive feedback on the pituitary, causing the LH surge that induces rupture of the follicular wall and ovulation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-107',
    q: 'Following ovulation, the collapsed Graafian follicle transforms into a temporary endocrine structure known as the corpus luteum, which predominantly secretes which hormone?',
    options: ['Progesterone', 'Follicle-Stimulating Hormone (FSH)', 'Oxytocin', 'Testosterone'],
    correct: 0,
    topic: 'Reproduction',
    explain: 'The corpus luteum secretes large amounts of progesterone (and moderate estrogen) to prepare and maintain the vascular, secretory endometrium for possible embryo implantation.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-108',
    q: 'At what stage of meiosis is a human primary oocyte arrested from fetal development until puberty?',
    options: [
      'Prophase I (specifically Diplotene stage)',
      'Metaphase II',
      'Anaphase I',
      'Telophase II'
    ],
    correct: 0,
    topic: 'Reproduction',
    explain: 'Primary oocytes initiate meiosis during fetal life and arrest at Prophase I (diplotene/dictyotene) until ovulation begins at puberty, when selected oocytes resume meiosis up to Metaphase II.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-109',
    q: 'Human Chorionic Gonadotropin (hCG), detected in early clinical pregnancy tests, is produced by which embryonic structure to prevent luteal regression?',
    options: ['Syncytiotrophoblast of the blastocyst', 'Epiblast', 'Yolk sac endoderm', 'Amniotic membrane'],
    correct: 0,
    topic: 'Reproduction',
    explain: 'Syncytiotrophoblast cells of the implanting blastocyst secrete hCG, which mimics LH to rescue and maintain the corpus luteum, ensuring continued progesterone secretion during early pregnancy.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-110',
    q: 'What constitutes the fast block to polyspermy during human fertilization?',
    options: [
      'Transient electrical depolarization of the oocyte plasma membrane from -70 mV to +20 mV caused by Na⁺ influx',
      'Exocytosis of cortical granules hardening the zona pellucida',
      'Phagocytosis of superfluous sperm heads by corona radiata cells',
      'Rapid shedding of all sperm receptors on the polar body'
    ],
    correct: 0,
    topic: 'Reproduction',
    explain: 'Upon sperm-egg fusion, Na⁺ channels open, depolarizing the egg membrane (fast block). This is followed by the cortical reaction (slow block), where cortical granules exocytose enzymes that harden the zona pellucida.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-111',
    q: 'In the male reproductive tract, Leydig (interstitial) cells secrete testosterone under the direct stimulation of which pituitary gonadotropin?',
    options: ['Luteinizing Hormone (LH / ICSH)', 'Follicle-Stimulating Hormone (FSH)', 'Inhibin', 'Growth hormone'],
    correct: 0,
    topic: 'Reproduction',
    explain: 'LH (also known as Interstitial Cell-Stimulating Hormone, ICSH, in males) stimulates Leydig cells in the testicular interstitium to synthesize and secrete testosterone. FSH acts on Sertoli cells to support spermatogenesis.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Genetics (8 MCQs: 3 Easy, 3 Medium, 2 Hard) ---
  {
    id: 'mdcat-new-bio-112',
    q: 'According to Mendel\'s Law of Segregation, what happens to the two alleles of a gene during gamete formation?',
    options: [
      'They segregate from each other so that each gamete carries only one allele for that gene',
      'They blend together irreversibly to form a permanent intermediate allele',
      'Both alleles are always passed together into every gamete',
      'Dominant alleles completely destroy recessive alleles'
    ],
    correct: 0,
    topic: 'Genetics',
    explain: 'Mendel\'s First Law states that during meiosis (anaphase I), homologous chromosomes carrying alternative alleles separate, ensuring each gamete receives only one allele per locus.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-113',
    q: 'What is the expected phenotypic ratio in the F2 generation of a standard Mendelian monohybrid cross between two heterozygous individuals (Aa × Aa)?',
    options: ['3 : 1 (Dominant : Recessive)', '1 : 2 : 1', '9 : 3 : 3 : 1', '1 : 1'],
    correct: 0,
    topic: 'Genetics',
    explain: 'Crossing Aa × Aa yields genotypic ratio 1 AA : 2 Aa : 1 aa. Because A is completely dominant over a, both AA and Aa display the dominant phenotype, giving a 3:1 phenotypic ratio.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-114',
    q: 'Which human genetic inheritance pattern is exhibited by red-green color blindness and hemophilia A?',
    options: ['X-linked recessive inheritance', 'Autosomal dominant inheritance', 'Y-linked (holandric) inheritance', 'Mitochondrial maternal inheritance'],
    correct: 0,
    topic: 'Genetics',
    explain: 'Red-green color blindness and hemophilia A are X-linked recessive traits. Males (XY) express the trait with a single mutated X chromosome, while females (XX) are typically asymptomatic carriers unless homozygous.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-115',
    q: 'The ABO blood group system in humans exhibits codominance as well as multiple allelism. An individual with genotype IᴬIᴮ expresses which blood phenotype?',
    options: ['Type AB blood', 'Type A blood', 'Type B blood', 'Type O blood'],
    correct: 0,
    topic: 'Genetics',
    explain: 'Alleles Iᴬ and Iᴮ are codominant with respect to each other; both enzymes are expressed, producing both A and B antigens on erythrocyte membranes, resulting in phenotype AB.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-116',
    q: 'When a red-flowered 4 o\'clock plant (Mirabilis jalapa) is crossed with a white-flowered plant, all F1 offspring produce pink flowers. This genetic phenomenon is an example of:',
    options: ['Incomplete dominance', 'Codominance', 'Epistasis', 'Pleiotropy'],
    correct: 0,
    topic: 'Genetics',
    explain: 'Incomplete dominance occurs when neither allele is completely dominant, resulting in a heterozygous phenotype intermediate between the homozygous parental phenotypes (red + white = pink).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-117',
    q: 'A carrier woman for hemophilia (XᴴXʰ) marries a normal man (XᴴY). What is the probability that their son will be affected by hemophilia?',
    options: ['50%', '25%', '0%', '100%'],
    correct: 0,
    topic: 'Genetics',
    explain: 'Sons inherit the Y chromosome from the father and either Xᴴ or Xʰ from the mother with equal probability (50% chance of XᴴY normal, 50% chance of XʰY affected). Thus, among sons, probability is 50%.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-118',
    q: 'What is the recombinant frequency between two linked genes situated 15 centimorgans (cM) apart on the same chromosome?',
    options: ['15%', '30%', '7.5%', '50%'],
    correct: 0,
    topic: 'Genetics',
    explain: 'One map unit (centimorgan, cM) is defined as a 1% frequency of genetic recombination (crossing over) between two linked loci. Therefore, 15 cM corresponds to a 15% recombination frequency.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-119',
    q: 'Sickle cell anemia is caused by a point mutation in the beta-globin gene, resulting in which specific single amino acid substitution at position 6?',
    options: [
      'Glutamic acid replaced by Valine (GAG -> GTG)',
      'Valine replaced by Glutamic acid',
      'Lysine replaced by Arginine',
      'Glycine replaced by Alanine'
    ],
    correct: 0,
    topic: 'Genetics',
    explain: 'Sickle cell anemia is a missense mutation in codon 6 of the HBB gene, substituting hydrophobic valine for hydrophilic glutamic acid (GAG to GTG). Under hypoxia, HbS polymerizes, distorting RBCs into sickled shapes.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Biotechnology (8 MCQs: 3 Easy, 2 Medium, 3 Hard) ---
  {
    id: 'mdcat-new-bio-120',
    q: 'Which bacterial enzymes are known as "molecular scissors" because they cleave double-stranded DNA at specific palindromic recognition sequences?',
    options: ['Restriction endonucleases', 'DNA ligases', 'DNA polymerases', 'Reverse transcriptases'],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Restriction endonucleases (like EcoRI, HindIII) recognize specific 4-8 bp palindromic DNA sequences and cleave phosphodiester bonds, generating blunt or sticky cohesive ends for genetic engineering.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-121',
    q: 'Which enzyme is used in recombinant DNA technology to covalently join ("paste") DNA fragments by catalyzing phosphodiester bond formation?',
    options: ['DNA ligase', 'RNA polymerase', 'Amylase', 'Topoisomerase'],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'DNA ligase seals nicks in double-stranded DNA by forming covalent phosphodiester bonds between adjacent 3\'-hydroxyl and 5\'-phosphate ends, annealing cloned DNA into vector plasmids.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-122',
    q: 'What is the primary function of the Polymerase Chain Reaction (PCR)?',
    options: [
      'In vitro exponential amplification of a specific target DNA sequence',
      'Separation of proteins based on isoelectric point',
      'Direct degradation of viral capsids',
      'Synthesis of recombinant insulin inside yeast cultures'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'PCR (developed by Kary Mullis) uses thermal cycling (denaturation, primer annealing, and extension by thermostable Taq polymerase) to exponentially amplify specific target DNA fragments in vitro.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-123',
    q: 'Why is Taq polymerase from the bacterium Thermus aquaticus uniquely suited for the Polymerase Chain Reaction (PCR)?',
    options: [
      'It is heat-stable and withstands high temperatures (~95°C) during DNA denaturation without losing catalytic activity',
      'It synthesizes DNA without needing any oligonucleotide primers',
      'It repairs mismatched base pairs via 3\' to 5\' exonuclease proofreading',
      'It replicates RNA directly into double-stranded DNA'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Taq polymerase is isolated from the thermophilic bacterium Thermus aquaticus. Its thermostability allows it to survive repeated high-temperature denaturation steps (~94-95°C) without denaturing.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-124',
    q: 'In agarose gel electrophoresis, toward which electrode do DNA fragments migrate, and why?',
    options: [
      'Toward the positive anode, because DNA has a net negative charge due to its sugar-phosphate backbone',
      'Toward the negative cathode, because DNA carries positive amino bases',
      'Toward the positive anode, because DNA has positive histidine residues',
      'DNA does not migrate under an electric field'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Phosphate groups in the phosphodiester backbone give DNA a constant negative charge-to-mass ratio. Under an electric field, DNA fragments migrate through the agarose mesh toward the positive anode (+).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-125',
    q: 'In Sanger dideoxy DNA sequencing, why does incorporation of a 2\',3\'-dideoxynucleotide triphosphate (ddNTP) terminate elongation of the growing DNA chain?',
    options: [
      'ddNTPs lack the 3\'-hydroxyl (-OH) group required to form the next phosphodiester bond with incoming nucleotides',
      'ddNTPs degrade DNA polymerase enzyme subunits',
      'ddNTPs contain triple bonds that prevent base pairing',
      'ddNTPs bind reversibly to the template promoter sequence'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'ddNTPs lack the essential 3\'-OH group on the ribose ring. Once incorporated by DNA polymerase, no further nucleotide can be added, terminating chain elongation at that specific base.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-126',
    q: 'What is a chimeric (recombinant) plasmid vector?',
    options: [
      'A circular bacterial plasmid into which a foreign gene of interest has been stably inserted',
      'A plasmid containing only viral coat protein genes',
      'A synthetic linear chromosome constructed without an origin of replication',
      'A mutated transposon lacking antibiotic resistance markers'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'A chimeric (or recombinant) plasmid is an autonomously replicating extrachromosomal circular DNA vector that incorporates foreign donor DNA recombined into its multiple cloning site (MCS).',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-127',
    q: 'In reproductive animal cloning (such as the cloning of Dolly the sheep), what core technique is employed?',
    options: [
      'Somatic Cell Nuclear Transfer (SCNT) into an enucleated unfertilized ovum',
      'Direct microinjection of naked sperm heads into somatic liver cells',
      'Embryonic stem cell differentiation via teratoma culture',
      'CRISPR-Cas9 mediated point-mutation knock-in'
    ],
    correct: 0,
    topic: 'Biotechnology',
    explain: 'Somatic Cell Nuclear Transfer (SCNT) involves removing the nucleus from a donor somatic cell (e.g. mammary gland cell) and transferring it into an enucleated oocyte, which is then stimulated to develop into an embryo.',
    difficulty: 'Hard',
    subject: 'Biology'
  },

  // --- Evolution (8 MCQs: 2 Easy, 3 Medium, 3 Hard) ---
  {
    id: 'mdcat-new-bio-128',
    q: 'According to Charles Darwin\'s theory of evolution by natural selection, organisms that survive and reproduce in greater numbers are those that possess:',
    options: [
      'Heritable phenotypic variations best adapted to their local environmental conditions',
      'Acquired characteristics developed through use and disuse during their lifetime',
      'The largest physical body mass and strength',
      'The highest rate of deliberate purposeful mutations'
    ],
    correct: 0,
    topic: 'Evolution',
    explain: 'Darwinian natural selection posits that individuals with heritable traits conferring greater reproductive fitness in their environment leave more offspring, increasing the frequency of those adaptive alleles.',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-129',
    q: 'Homologous anatomical structures (such as the forelimbs of humans, bats, whales, and cats) provide strong comparative morphological evidence for:',
    options: ['Divergent evolution from a common ancestral origin', 'Convergent evolution from unrelated lineages', 'Spontaneous generation', 'Independent non-genetic mutation'],
    correct: 0,
    topic: 'Evolution',
    explain: 'Homologous structures share an identical basic skeletal and embryological anatomical plan inherited from a common ancestor, but have diverged to perform different functions (divergent evolution).',
    difficulty: 'Easy',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-130',
    q: 'Analogous anatomical structures (such as the wings of insects and birds) represent examples of:',
    options: [
      'Convergent evolution, where similar environmental selection pressures produce similar adaptations from distinct evolutionary lineages',
      'Divergent evolution from a close recent common ancestor',
      'Vestigial organs with no functional utility',
      'Direct chromosomal translocation between taxa'
    ],
    correct: 0,
    topic: 'Evolution',
    explain: 'Analogous structures have different embryonic origins and internal structures, but perform similar functions due to adaptation to similar environmental demands (convergent evolution).',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-131',
    q: 'According to the Hardy-Weinberg principle, allele and genotype frequencies in a Mendelian population remain constant from generation to generation provided that:',
    options: [
      'The population is large, mating is random, and there is no mutation, migration, or natural selection',
      'The population is small, mating is non-random, and genetic drift is high',
      'Individuals actively migrate between isolated geographical islands',
      'Heterozygotes are strictly selected against in each reproductive cycle'
    ],
    correct: 0,
    topic: 'Evolution',
    explain: 'Hardy-Weinberg genetic equilibrium requires five conditions: infinitely large population size, completely random mating, no net mutations, no gene flow (immigration/emigration), and no natural selection.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-132',
    q: 'In the classic Miller-Urey experiment simulating the prebiotic Earth atmosphere, which mixture of gases and energy source produced simple organic biomolecules (including amino acids)?',
    options: [
      'Methane (CH₄), Ammonia (NH₃), Hydrogen (H₂), and Water vapor (H₂O) subjected to electrical spark discharges',
      'Carbon dioxide, molecular oxygen, ozone, and ultraviolet radiation',
      'Pure nitrogen gas, oxygen gas, and geothermal volcanic heat',
      'Argon, sulfur dioxide, chlorine, and gamma radiation'
    ],
    correct: 0,
    topic: 'Evolution',
    explain: 'Miller and Urey subjected a reducing gas mixture of CH₄, NH₃, H₂, and boiling H₂O to continuous high-voltage electrical sparks, synthesizing glycine, alanine, aspartic acid, and other organic precursors.',
    difficulty: 'Medium',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-133',
    q: 'In a human population at Hardy-Weinberg equilibrium, the frequency of an autosomal recessive allele (q) is 0.2. What is the percentage of heterozygous carriers (2pq) in this population?',
    options: ['32%', '16%', '4%', '64%'],
    correct: 0,
    topic: 'Evolution',
    explain: 'Since p + q = 1, p = 1 - 0.2 = 0.8. Frequency of heterozygotes = 2pq = 2 * (0.8) * (0.2) = 0.32 = 32%.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-134',
    q: 'What is "genetic drift", and in what type of biological population does it exert the most profound evolutionary impact?',
    options: [
      'Random fluctuations in allele frequencies due to chance sampling events; most pronounced in very small populations',
      'Directional selection favoring advantageous alleles; most pronounced in massive continental populations',
      'Uniform gene flow through migration between contiguous demes',
      'Continuous mutation of dominant alleles into lethal recessives'
    ],
    correct: 0,
    topic: 'Evolution',
    explain: 'Genetic drift is the change in allele frequency in a gene pool resulting from random chance events rather than selection. Its effects (e.g. founder effect, population bottleneck) are strongest in small populations.',
    difficulty: 'Hard',
    subject: 'Biology'
  },
  {
    id: 'mdcat-new-bio-135',
    q: 'Which evolutionary mode of speciation occurs when a physical geographic barrier (such as a mountain range or ocean channel) splits a single biological population into two reproductively isolated demes?',
    options: ['Allopatric speciation', 'Sympatric speciation', 'Parapatric speciation', 'Peripatric polyploidy'],
    correct: 0,
    topic: 'Evolution',
    explain: 'Allopatric speciation occurs when geographic isolation physically divides an ancestral population, preventing gene flow and allowing independent mutations and natural selection to accumulate until reproductive isolation is established.',
    difficulty: 'Hard',
    subject: 'Biology'
  }
];
