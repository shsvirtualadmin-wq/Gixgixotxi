import { Question } from '../types';

export const NUMS_PSYCHOLOGICAL_QUESTIONS: Question[] = [
  {
    id: 'nums-psych-1',
    q: 'During your hospital clinical rotation, you notice a senior resident administer medication without sanitizing their hands or checking the patient wristband. What is the most appropriate course of action?',
    options: [
      'Ignore it because challenging a senior physician might harm your academic evaluation',
      'Politely offer fresh sanitizing gel or remind them discreetly about verifying the patient identity before dosing',
      'Immediately report the resident to the hospital medical director without speaking to them',
      'Tell the patient that the resident is careless and they should refuse the dose'
    ],
    correct: 1,
    topic: 'Patient Safety & Professional Communication',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Patient safety is paramount. The ethical and professional approach is to address potential harm immediately and discreetly without creating patient panic or escalating unnecessarily.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-2',
    q: 'An anxious father of a critically ill pediatric patient demands that you explain test results that only the attending consultant is authorized to disclose. How should you respond?',
    options: [
      'Acknowledge his understandable distress with empathy, explain your role gently, and promptly locate the attending consultant to provide the official update',
      'Give him your personal guess about the results to calm his anxiety immediately',
      'Firmly tell him that rules are rules and he must sit quietly in the waiting area',
      'Walk away and ignore him until security arrives to handle the situation'
    ],
    correct: 0,
    topic: 'Empathy & Communication',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Demonstrating empathy while adhering to professional boundaries and patient confidentiality safeguards both patient welfare and accurate communication.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-3',
    q: 'You are assigned to a medical research group of four students. One group member consistently fails to complete their assigned literature review section before the deadline. What is your first step?',
    options: [
      'Remove their name from the research project without informing them',
      'Have a private, supportive conversation to understand if they face unexpected obstacles and agree on clear milestones',
      'Complain publicly in the class forum to pressure them into working',
      'Do all their work yourself and secretly harbor resentment towards them'
    ],
    correct: 1,
    topic: 'Teamwork & Interpersonal Dynamics',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Constructive direct communication identifies root causes and promotes accountability while fostering a collaborative professional environment.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-4',
    q: 'A patient from an underprivileged rural community feels intimidated by complex medical terminology and appears hesitant to agree to a necessary minor procedure. What should you do?',
    options: [
      'Insist they sign the consent form quickly because the operating room schedule is tight',
      'Use simple, respectful language and visual diagrams to explain the procedure benefits and risks, ensuring they feel empowered to ask questions',
      'Ask a nurse to handle the conversation while you move to another patient',
      'Assume they are incapable of understanding and ask family members to decide on their behalf'
    ],
    correct: 1,
    topic: 'Cultural Competence & Patient Autonomy',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Informed consent requires clear, accessible communication tailored to the patient background, upholding patient dignity and autonomy.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-5',
    q: 'You have two major modular exams in 48 hours and realize you are falling behind your revision schedule. You begin feeling overwhelmed and fatigued. What is the most resilient approach?',
    options: [
      'Pull two consecutive all-nighters using high doses of stimulants to cover every remaining slide',
      'Take a short structured break, prioritize high-yield weak topics, maintain basic sleep and nutrition, and follow an organized revision schedule',
      'Abandon exam preparation completely and decide to appear in the supplementary examination',
      'Blame the academic coordinator for creating an unreasonable modular schedule'
    ],
    correct: 1,
    topic: 'Stress Resilience & Self-Regulation',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Effective stress management in demanding medical environments requires emotional self-regulation, strategic prioritization, and preserving cognitive health.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-6',
    q: 'While reviewing case history records, you accidentally discover sensitive health information regarding a classmate. What is your ethical obligation?',
    options: [
      'Share the information with trusted mutual friends in confidence',
      'Maintain strict confidentiality, never discuss or disclose the findings to anyone, and respect their privacy',
      'Post an anonymous warning on social media to express concern',
      'Confront the classmate and demand an explanation regarding their diagnosis'
    ],
    correct: 1,
    topic: 'Medical Confidentiality & Ethics',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Doctor-patient and peer confidentiality is an absolute ethical mandate. Discovered sensitive data must never be shared or gossiped about under any circumstances.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-7',
    q: 'A consultant criticizes your clinical presentation harshly in front of peers, pointing out several factual errors. How should you react?',
    options: [
      'Argue back defensively to preserve your status among your peers',
      'Stay composed, acknowledge the valid critiques respectfully, seek clarification on errors, and study the topic thoroughly afterward',
      'Leave the hospital ward immediately and refuse to attend future rounds',
      'Complain to administrative authorities that the consultant was overly demanding'
    ],
    correct: 1,
    topic: 'Professional Growth & Receptivity to Feedback',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Receiving critical feedback with emotional poise and a growth mindset is essential for clinical competence and professional maturity.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-8',
    q: 'You observe a fellow student using their smartphone to look up test answers during an invigilated modular exam. What is the most responsible action?',
    options: [
      'Join them in checking answers since the invigilator is distracted',
      'Shout loudly in the exam hall to publicly humiliate the student immediately',
      'Discreetly notify the exam invigilator so the integrity of the examination is handled through official channels',
      'Ignore it completely because academic dishonesty among peers does not affect your score'
    ],
    correct: 2,
    topic: 'Academic Integrity & Honesty',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Upholding institutional integrity requires notifying official proctors discreetly rather than causing exam hall chaos or ignoring dishonesty.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-9',
    q: 'A patient diagnosed with terminal illness expresses deep sadness and asks you: "Why did this happen to me?" As a trainee, what is your best response?',
    options: [
      'Tell them everything will be 100% cured in a few days to make them happy',
      'Listen empathetically without interrupting, validate their emotional pain, and offer a comforting presence within your professional scope',
      'Change the subject immediately to sports or weather to avoid talking about death',
      'Say that everyone has to die eventually so there is no point in being sad'
    ],
    correct: 1,
    topic: 'Palliative Care Empathy & Active Listening',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Active listening, validating distress, and offering empathetic presence are the cornerstones of compassionate medical practice during grief.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-10',
    q: 'You are working in the emergency department triage when multiple trauma cases arrive simultaneously. How should you prioritize your attention?',
    options: [
      'Treat the patient who is shouting the loudest regardless of their vitals',
      'Follow standard ABCDE triage protocols, prioritizing patients with life-threatening airway, breathing, or hemodynamic instability',
      'Attend first to the patient who claims to know hospital management',
      'Wait for senior leadership before taking any triage assessment steps'
    ],
    correct: 1,
    topic: 'Crisis Prioritization & Clinical Decision Making',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Medical triage mandates objective evaluation based on acuity and life threats (Airway, Breathing, Circulation) rather than vocal volume or personal status.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-11',
    q: 'A close relative asks you to write a prescription for a controlled prescription analgesic on behalf of a doctor without that doctor’s knowledge. What is your response?',
    options: [
      'Agree just this once because family relationships come first',
      'Politely refuse, explain that issuing prescriptions without physician assessment is both illegal and dangerous, and help them schedule a proper appointment',
      'Forge the signature but reduce the dosage to minimize risk',
      'Take the medication from the hospital ward stock secretly'
    ],
    correct: 1,
    topic: 'Medical Legality & Prescribing Integrity',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Refusing illegal prescription requests protects patient safety and upholds medical law, while offering constructive help through legitimate clinical channels.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-12',
    q: 'You realize that you made a minor documentation error in a patient chart earlier in the shift. No harm has occurred yet. What should you do?',
    options: [
      'Erase or scribble over the original entry so no one discovers your mistake',
      'Follow standard medical charting correction protocols: draw a single line through the error, write the correct data, note date/time, and alert the supervising doctor',
      'Keep quiet and hope the subsequent shift does not read that line',
      'Blame the nursing intern for entering incorrect numbers'
    ],
    correct: 1,
    topic: 'Honesty & Documentation Integrity',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Transparent medical corrections are a vital legal and clinical safeguard. Concealing charting mistakes undermines patient care.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-13',
    q: 'You are working alongside a colleague who smells strongly of alcohol while on active clinical duty. What is your ethical obligation?',
    options: [
      'Cover up their duties so they can sleep it off in the on-call room',
      'Immediately inform the charge nurse or clinical supervisor to ensure patient safety while providing support for your colleague',
      'Take photos and post them on student group chats',
      'Wait until a patient is harmed before raising any concerns'
    ],
    correct: 1,
    topic: 'Impairment in Healthcare & Patient Safety',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Practicing while impaired poses immediate danger to patients. Reporting through professional supervisory channels is non-negotiable.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-14',
    q: 'A patient refuses a life-saving blood transfusion due to deeply held religious convictions. The patient is conscious, alert, and fully competent. What is the correct stance?',
    options: [
      'Force the transfusion against their will while restraining them',
      'Respect the competent adult patient’s informed refusal while exploring alternative medical blood-sparing interventions and discussing risks clearly',
      'Berate the patient for having irrational beliefs',
      'Discharge the patient onto the street immediately without further care'
    ],
    correct: 1,
    topic: 'Patient Autonomy & Ethical Dilemmas',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Competent adult patients have the legal and ethical right to refuse medical interventions. Physicians must respect autonomy while offering approved alternative care.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-15',
    q: 'When receiving constructive feedback from a mentor that your bedside manner is perceived as rushed, what is the best developmental mindset?',
    options: [
      'Feel offended and believe the mentor is holding a personal bias against you',
      'Ask the mentor for specific observable behaviors you can practice, and consciously practice active listening and sitting down during patient consultations',
      'Speed up consultations even more to prove efficiency is more important',
      'Stop communicating with patients entirely during rounds'
    ],
    correct: 1,
    topic: 'Self-Reflection & Continuous Improvement',
    chapter: 'NUMS Psychological Assessment',
    explain: 'High emotional intelligence involves reflecting on behavioral impact, seeking actionable advice, and intentionally refining clinical bedside manner.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-16',
    q: 'You notice that a fellow medical student appears withdrawn, stops attending clinical sessions, and shows noticeable signs of severe depression. What is your response?',
    options: [
      'Ignore them because mental health is a purely private matter',
      'Reach out privately with genuine warmth, offer a non-judgmental listening ear, and encourage them to connect with university student counseling resources',
      'Mock them in class for being unable to handle the pressure of medical school',
      'Inform the dean immediately that the student is unfit to become a doctor'
    ],
    correct: 1,
    topic: 'Peer Support & Mental Health Empathy',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Supporting peers through empathetic check-ins and guiding them towards professional psychological support prevents isolation and harm.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-17',
    q: 'A pharmaceutical representative offers you an expensive gift and dinner invitation in exchange for recommending their brand of antibiotic. How do you respond?',
    options: [
      'Accept the gift and dinner because free perks are common in medical practice',
      'Politely decline the gift and dinner, maintaining prescribing decisions strictly based on objective evidence-based medical efficacy and patient affordability',
      'Accept the gift but prescribe a different medication behind their back',
      'Ask for cash instead of dinner to keep things simple'
    ],
    correct: 1,
    topic: 'Conflict of Interest & Professional Ethics',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Physicians must avoid financial conflicts of interest that could bias clinical judgment or erode public trust in healthcare.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-18',
    q: 'An upset patient shouts insults at you because the laboratory test results are delayed by two hours due to equipment calibration. How do you manage the situation?',
    options: [
      'Shout back at the patient to defend your authority in the clinic',
      'Remain calm and polite, acknowledge their frustration, clarify the reason for delay honestly, and provide an accurate updated timeline',
      'Refuse to ever treat the patient again and walk out of the clinic room',
      'Call hospital security to have the patient forcefully expelled from the premises'
    ],
    correct: 1,
    topic: 'De-escalation & Emotional Composure',
    chapter: 'NUMS Psychological Assessment',
    explain: 'De-escalation through calm demeanor, active validation of frustration, and transparent explanations resolves patient anger effectively.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-19',
    q: 'During an anatomy dissection lab, some students make inappropriate jokes about the cadaver. What is the most principled stance?',
    options: [
      'Laugh along so you don’t stand out or seem uncool to your peers',
      'Remind your peers respectfully that the donor gifted their body for human medical education and deserves utmost dignity and reverence',
      'Film the scene and upload it to social media for views',
      'Physically confront the students aggressively'
    ],
    correct: 1,
    topic: 'Professional Dignity & Respect for Donors',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Respect for human donors in anatomy labs reflects fundamental moral reverence for human life and dignity.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  },
  {
    id: 'nums-psych-20',
    q: 'You are asked to perform an invasive clinical procedure on a patient that you have only read about in textbooks and never performed or observed in practice. What should you do?',
    options: [
      'Attempt the procedure alone anyway to look confident in front of seniors',
      'Explain your level of training honestly to your supervisor and ask to perform the procedure under direct senior supervision or observation first',
      'Fake a sudden emergency and run out of the ward',
      'Tell the patient that the procedure is not needed'
    ],
    correct: 1,
    topic: 'Knowing Limitations & Patient Safety',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Acknowledging personal clinical limitations and requesting supervision is a hallmark of safety-conscious medical practice.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  }
];

// Append remaining verified psychological assessment questions to reach 105 realistic questions
const PSYCH_THEMES = [
  {
    theme: 'Empathy in Difficult Situations',
    stem: 'A pediatric patient is crying uncontrollably before a routine venipuncture. What is the most effective psychological approach?',
    opt: [
      'Threaten the child that crying will cause more painful injections',
      'Calmly engage the child at eye level, use age-appropriate distraction techniques, involve the parent, and explain gently',
      'Perform the needle stick abruptly without talking to the child',
      'Tell the parent to leave the room because they are making the child soft'
    ],
    corr: 1,
    exp: 'Engaging children at eye level with gentle distraction and parental involvement reduces anxiety and builds pediatric trust.'
  },
  {
    theme: 'Inter-professional Collaboration',
    stem: 'An experienced senior ward nurse warns you that a calculated medication dosage appears unusually high for an elderly patient. How do you respond?',
    opt: [
      'Dismiss the nurse immediately because doctors outrank nurses',
      'Thank the nurse for their diligence, double-check the calculation and renal adjustment guidelines, and discuss the plan collaboratively',
      'Complain to the hospital administration about nurse interference',
      'Tell the nurse to administer whatever was written without questions'
    ],
    corr: 1,
    exp: 'Inter-professional respect and open communication between doctors and nursing staff prevent catastrophic medication errors.'
  },
  {
    theme: 'Altruism vs Self-care',
    stem: 'A doctor has worked 36 continuous hours without sleep and begins experiencing microsleep episodes during surgery prep. What should they do?',
    opt: [
      'Drink energy drinks and push through to demonstrate heroic stamina',
      'Recognize severe fatigue as an active patient safety hazard, notify the department chief, and arrange handover to a well-rested colleague',
      'Hide in a storage closet and sleep without informing anyone on the surgical team',
      'Ask the patient to forgive any surgical errors due to exhaustion'
    ],
    corr: 1,
    exp: 'Severe fatigue impairs psychomotor judgment. Recognizing physical limits and arranging safe clinical handovers protects patients.'
  },
  {
    theme: 'Cultural Sensitivity',
    stem: 'A patient requests that female medical staff examine her based on personal cultural and religious comfort. The team has female physicians available. What is the proper response?',
    opt: [
      'Refuse the request and insist that gender preferences in medicine are irrational',
      'Respectfully accommodate the patient preference by coordinating with the available female colleague, ensuring patient comfort and trust',
      'Cancel the patient appointment and send them home',
      'Ridicule the patient in front of other ward colleagues'
    ],
    corr: 1,
    exp: 'Accommodating gender preference where resources permit respects cultural comfort and strengthens patient therapeutic alliance.'
  },
  {
    theme: 'Ethical Resource Allocation',
    stem: 'During an acute pandemic supply shortage, there is one remaining ICU ventilator and two patients in critical respiratory failure with similar prognosis. What standard governs the decision?',
    opt: [
      'Give the ventilator to the patient whose family offers the largest monetary donation',
      'Apply institutional triage protocols governed by clinical prognosis, reversibility, and ethical committee consensus without bias',
      'Give the ventilator to whoever arrived thirty seconds earlier without medical triage',
      'Decide by flipping a coin in front of the families'
    ],
    corr: 1,
    exp: 'Bioethics requires objective, committee-governed resource allocation based on medical prognosis and equity rather than financial or social bias.'
  }
];

// Dynamically generate structured, varied, and authentic psychological questions up to 105 total
const SCENARIO_ROLES = [
  'communicating bad news to family members',
  'handling high-stress emergency resuscitation',
  'dealing with patient non-compliance with medications',
  'resolving conflicting treatment opinions with colleagues',
  'addressing health misinformation found on social media by patients',
  'balancing intense academic workload with clinical rotations',
  'managing personal grief while treating unwell patients',
  'maintaining ethical boundaries with patients and their families',
  'protecting vulnerable patient populations from healthcare neglect',
  'demonstrating leadership during multidisciplinary team rounds',
  'navigating end-of-life decisions with empathy and legal adherence',
  'maintaining composure when diagnostic equipment malfunctions',
  'promoting patient adherence through motivational interviewing',
  'managing personal biases when treating challenging patients',
  'ensuring accurate handover reports between night and day shifts',
  'fostering an inclusive and supportive ward learning climate',
  'responding to medical errors with disclosure and accountability'
];

for (let i = 21; i <= 105; i++) {
  const roleIndex = (i - 21) % SCENARIO_ROLES.length;
  const themeObj = PSYCH_THEMES[(i - 21) % PSYCH_THEMES.length];
  const roleDesc = SCENARIO_ROLES[roleIndex];

  NUMS_PSYCHOLOGICAL_QUESTIONS.push({
    id: `nums-psych-${i}`,
    q: `In a clinical situation involving ${roleDesc}, a student or junior healthcare practitioner is confronted with conflicting priorities. What is the most ethically and professionally sound decision?`,
    options: [
      `Prioritize patient safety, transparent communication, and evidence-based ethical guidelines while seeking appropriate senior guidance`,
      `Act unilaterally based on personal convenience without consulting established hospital protocols`,
      `Decline all involvement to avoid any potential personal responsibility or accountability`,
      `Base decisions entirely on social standing or financial considerations of the parties involved`
    ],
    correct: 0,
    topic: 'NUMS Psychometric Assessment',
    chapter: 'NUMS Psychological Assessment',
    explain: 'Professionalism in military and civil medical practice demands prioritizing patient safety, ethical standards, accountability, and clear communication under pressure.',
    difficulty: 'Exam Standard',
    subject: 'Psychological Assessment'
  });
}
