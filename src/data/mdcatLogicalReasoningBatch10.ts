import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_BATCH10: Question[] = [
  {
    "id": "mdcat-b10-lr-1",
    "q": "Statement: \"A recent regional hospital survey revealed that implementing electronic health records (EHR) led to a 30% reduction in medication prescription errors over two years.\" Which of the following, if true, most strongly strengthens the claim that EHR implementation caused the reduction in medication errors?",
    "options": [
      "Similar hospitals in the same region that did not adopt EHR systems experienced no significant change in their medication prescription error rates over the same period.",
      "The licensing cost for EHR software increased substantially over the survey period.",
      "Physicians reported spending more time documenting patient histories on desktop terminals.",
      "Several senior nurses in the hospital retired during the study."
    ],
    "correct": 0,
    "topic": "Critical Thinking - Strengthening a Causal Hypothesis",
    "chapter": "Critical Thinking",
    "explain": "Providing a control group (comparable hospitals without EHR showing zero reduction) eliminates confounding background factors (such as regional awareness campaigns or changes in drug labeling) and strongly supports that the EHR system was the causal intervention.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-2",
    "q": "Statement: \"Observational studies show that populations consuming diets rich in dietary antioxidants have significantly lower rates of colorectal cancer. Therefore, consuming daily high-dose synthetic antioxidant supplements will prevent colorectal cancer.\" Which of the following identifies the fundamental flaw in this reasoning?",
    "options": [
      "It assumes that the health benefits associated with whole food dietary nutrients can be replicated identically by isolated synthetic supplements without dietary synergy.",
      "It ignores the economic benefits of pharmaceutical supplement manufacturing.",
      "It fails to cite the exact chemical molecular weight of antioxidants.",
      "It relies on clinical data from more than one geographic region."
    ],
    "correct": 0,
    "topic": "Critical Thinking - Flawed Causal Generalization",
    "chapter": "Critical Thinking",
    "explain": "The argument makes an unwarranted inferential leap from correlations involving whole foods (which contain complex fibers, phytochemicals, and micronutrients) to an isolated synthetic chemical supplement, ignoring synergistic nutritional interactions and lifestyle confounders.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-3",
    "q": "Find the next term in the alphanumeric pattern: B2D, E4G, H8J, K16M, ?",
    "options": [
      "N32P",
      "M32P",
      "N32O",
      "O32Q"
    ],
    "correct": 0,
    "topic": "Letter and Symbol Series - Alphanumeric Progression Pattern",
    "chapter": "Letter and Symbol Series",
    "explain": "First letter advances by +3 positions: B(2) → E(5) → H(8) → K(11) → N(14). Number doubles each step: 2, 4, 8, 16, 32. Last letter advances by +3 positions: D(4) → G(7) → J(10) → M(13) → P(16). Result: N32P.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-4",
    "q": "Identify the missing term in the sequence: Z26, X24, U21, Q17, L12, ?",
    "options": [
      "F6",
      "G7",
      "E5",
      "H8"
    ],
    "correct": 0,
    "topic": "Letter and Symbol Series - Decreasing Letter-Number Sequence",
    "chapter": "Letter and Symbol Series",
    "explain": "The number corresponds to alphabetical rank: Z=26, X=24, U=21, Q=17, L=12. The decrement between consecutive terms increases by 1 each step: -2, -3, -4, -5. Next decrement is -6: 12 - 6 = 6. The 6th letter is F. Result: F6.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-5",
    "q": "Statements: 1. All surgeons are medical doctors. 2. Some medical doctors are medical researchers. Conclusions: I. Some surgeons are medical researchers. II. All medical researchers are surgeons. Which conclusion(s) logically follow(s)?",
    "options": [
      "Neither Conclusion I nor Conclusion II follows",
      "Only Conclusion I follows",
      "Only Conclusion II follows",
      "Both Conclusion I and Conclusion II follow"
    ],
    "correct": 0,
    "topic": "Syllogisms - Undistributed Middle Term Fallacy",
    "chapter": "Logical Deduction",
    "explain": "The middle term \"medical doctors\" is undistributed in both premises (All S are M; Some M are R). The subset of medical doctors who are researchers may not overlap with surgeons at all. Thus, neither conclusion follows necessarily.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-6",
    "q": "Statements: 1. No antibiotic is effective against viruses. 2. Amoxicillin is an antibiotic. Conclusion: Amoxicillin is not effective against viruses. Which of the following is correct?",
    "options": [
      "The conclusion is logically valid and follows necessarily",
      "The conclusion is invalid because amoxicillin is broad-spectrum",
      "The conclusion is indeterminate",
      "The premise contradicts pharmacology"
    ],
    "correct": 0,
    "topic": "Logical Deduction - Categorical Syllogism (Universal Negative)",
    "chapter": "Logical Deduction",
    "explain": "This is a valid universal negative categorical syllogism (Celarent / Modus Ponens): All antibiotics are non-viral agents; Amoxicillin is an antibiotic; Therefore, Amoxicillin is not effective against viruses. The deduction is logically valid and airtight.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-7",
    "q": "If it is known that: \"Either Dr. Bilal is in the emergency room or Dr. Bilal is in the pathology laboratory.\" If the statement \"Dr. Bilal is not in the emergency room\" is TRUE, what can be deduced with certainty?",
    "options": [
      "Dr. Bilal is in the pathology laboratory",
      "Dr. Bilal has left the hospital campus",
      "Dr. Bilal is in the surgical operating suite",
      "No conclusive deduction can be made"
    ],
    "correct": 0,
    "topic": "Deductive Logic - Disjunctive Syllogism Rule",
    "chapter": "Logical Deduction",
    "explain": "By the law of disjunctive syllogism (P ∨ Q, ¬P ⊢ Q): When a disjunction is established as true and one branch is negated, the remaining alternate branch must be true. Therefore, Dr. Bilal is in the pathology laboratory.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-8",
    "q": "Five medical students—Amina, Basit, Clara, Daniyal, and Emaan—sit in a row of five seats numbered 1 to 5 from left to right. 1. Clara sits at the exact center (Seat 3). 2. Amina sits to the immediate left of Clara (Seat 2). 3. Daniyal sits at the extreme right end (Seat 5). 4. Emaan sits immediately adjacent to Daniyal (Seat 4). Who sits at Seat 1 (the extreme left end)?",
    "options": [
      "Basit",
      "Emaan",
      "Amina",
      "Clara"
    ],
    "correct": 0,
    "topic": "Logical Problems - Linear Arrangement and Seating Order",
    "chapter": "Logical Problems",
    "explain": "The positions from left to right are 1, 2, 3, 4, 5. Clara is at Seat 3. Amina is at Seat 2. Daniyal is at Seat 5. Emaan is adjacent to Daniyal at Seat 4. The only remaining unoccupied seat is Seat 1, which must be occupied by Basit.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-9",
    "q": "Point Q is located 12 meters due North of Point P. Point R is located 9 meters due East of Point Q. What is the shortest straight-line distance from Point P to Point R?",
    "options": [
      "15 meters",
      "21 meters",
      "10.5 meters",
      "18 meters"
    ],
    "correct": 0,
    "topic": "Logical Problems - Direction and Distance via Pythagorean Theorem",
    "chapter": "Logical Problems",
    "explain": "The displacement vectors form a right-angled triangle with legs of length 12 m North and 9 m East. By the Pythagorean theorem: distance = $\\sqrt${$12^{2} +  9^{2}$} = $\\sqrt${144 + 81} = $\\sqrt${225} = 15 meters.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-10",
    "q": "In a medical research cohort, Dr. Farooq is older than Dr. Gohar, but younger than Dr. Haroon. Dr. Ilyas is younger than Dr. Gohar. Who is the youngest member of the research cohort?",
    "options": [
      "Dr. Ilyas",
      "Dr. Gohar",
      "Dr. Farooq",
      "Dr. Haroon"
    ],
    "correct": 0,
    "topic": "Logical Problems - Sequential Ordering and Relative Age Comparisons",
    "chapter": "Logical Problems",
    "explain": "Ranking by age from oldest to youngest: Dr. Haroon > Dr. Farooq > Dr. Gohar. Since Dr. Ilyas is younger than Dr. Gohar, the complete descending order is: Dr. Haroon > Dr. Farooq > Dr. Gohar > Dr. Ilyas. Thus, Dr. Ilyas is the youngest.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-11",
    "q": "Problem Statement: \"A tertiary care hospital experiences recurrent nocturnal electrical grid failures, during which backup diesel generators take up to 90 seconds to deliver full load, endangering mechanical ventilators in the ICU.\" Proposed Courses of Action: I. Install dedicated uninterruptible power supply (UPS) battery backup units on critical life-support devices to bridge the 90-second transition window. II. Cease admitting critically ill patients to the ICU during night shifts. Which course(s) of action should be approved?",
    "options": [
      "Only Course of Action I should be approved",
      "Only Course of Action II should be approved",
      "Both Course I and Course II should be approved",
      "Neither Course I nor Course II should be approved"
    ],
    "correct": 0,
    "topic": "Course of Action - Critical Infrastructure Risk Mitigation",
    "chapter": "Course of Action",
    "explain": "Course I is practical, feasible, and directly resolves the danger of power interruption during generator spin-up without degrading clinical care. Course II is extreme, unethical, and violates the fundamental duty of a tertiary care ICU.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-12",
    "q": "Problem Statement: \"A sudden seasonal outbreak of dengue hemorrhagic fever has severely overwhelmed the bed capacity of a municipal public hospital.\" Proposed Courses of Action: I. Establish temporary triage and hydration wards in adjacent civic centers staffed by redeployed clinical teams. II. Deploy municipal public health teams to conduct targeted indoor residual spraying and eliminate stagnant water breeding sites. Which course(s) of action is/are appropriate?",
    "options": [
      "Both Course I and Course II are appropriate",
      "Only Course I is appropriate",
      "Only Course II is appropriate",
      "Neither Course I nor Course II is appropriate"
    ],
    "correct": 0,
    "topic": "Course of Action - Outbreak Emergency Response and Vector Control",
    "chapter": "Course of Action",
    "explain": "Course I immediately relieves hospital bed strain by expanding clinical capacity for supportive rehydration. Course II attacks the vector at the community level to interrupt transmission. Both actions are synergistic and appropriate.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-13",
    "q": "Problem Statement: \"Routine quality assurance testing detected that 15% of sterile surgical glove batches delivered to a teaching hospital had microscopic perforations.\" Proposed Courses of Action: I. Immediately quarantine the entire shipment and issue a hospital-wide recall of the affected batch numbers. II. Discard all stored surgical instruments in the operating suites. Which course(s) of action should be taken?",
    "options": [
      "Only Course of Action I should be taken",
      "Only Course of Action II should be taken",
      "Both Course I and Course II should be taken",
      "Neither Course I nor Course II should be taken"
    ],
    "correct": 0,
    "topic": "Course of Action - Quality Assurance and Product Recall Protocols",
    "chapter": "Course of Action",
    "explain": "Course I directly and proportionally targets the defective batches of gloves to safeguard patient safety. Course II is an unnecessary, wasteful overreaction because instruments stored in sterile packaging are uncontaminated and can be autoclaved as standard protocol.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-14",
    "q": "Events: Statement (A): Municipal authorities repaired leaking subterranean sewer lines and heavily chlorinated municipal water supply mains across the southern district. Statement (B): The incidence of waterborne cholera and acute bacterial dysentery dropped by 85% in the southern district over the subsequent two months. What is the logical relationship between (A) and (B)?",
    "options": [
      "Statement (A) is the cause and Statement (B) is its effect",
      "Statement (B) is the cause and Statement (A) is its effect",
      "Both statements are independent causes",
      "Both statements are effects of an unrelated common cause"
    ],
    "correct": 0,
    "topic": "Cause and Effect - Direct Causal Intervention",
    "chapter": "Cause and Effect",
    "explain": "Repairing sewage leaks and chlorinating water (A) eradicates enteric bacterial contamination from drinking water, which directly produces the dramatic decline in waterborne diseases (B). Thus, (A) is the cause and (B) is the effect.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b10-lr-15",
    "q": "Events: Statement (A): The provincial transport authority made motorcycle helmet usage strictly mandatory under heavy legal penalties. Statement (B): The metropolitan trauma center documented a 45% decline in fatal traumatic brain injuries among motorcyclists. What is the logical relationship between (A) and (B)?",
    "options": [
      "Statement (A) is the cause and Statement (B) is its effect",
      "Statement (B) is the cause and Statement (A) is its effect",
      "Both statements are independent causes",
      "Statement (A) is an effect of Statement (B)"
    ],
    "correct": 0,
    "topic": "Cause and Effect - Legislative Policy Intervention and Health Outcome",
    "chapter": "Cause and Effect",
    "explain": "Mandatory helmet enforcement (A) increases rider compliance and head protection, directly leading to the reduction in severe skull fractures and fatal traumatic brain injuries (B).",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  }
];
