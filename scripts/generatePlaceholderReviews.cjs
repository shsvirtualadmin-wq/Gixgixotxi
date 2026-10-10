const fs = require('fs');
const path = require('path');

const firstNames = [
  'Ahmed', 'Bilal', 'Hamza', 'Daniyal', 'Saad', 'Usama', 'Zain', 'Hassan', 'Farhan', 'Talha',
  'Zayd', 'Haris', 'Umair', 'Shahzaib', 'Abdullah', 'Waleed', 'Arham', 'Rayyan', 'Taimoor', 'Zeeshan',
  'Ayesha', 'Fatima', 'Noor', 'Hania', 'Maryam', 'Maham', 'Zainab', 'Sarah', 'Laiba', 'Iman',
  'Anaya', 'Sana', 'Rida', 'Hira', 'Alishba', 'Rabia', 'Minahil', 'Kinza', 'Bisma', 'Nimra',
  'Subhan', 'Moiz', 'Mustafa', 'Huzaifa', 'Eman', 'Dua', 'Alina', 'Iqra', 'Areeba', 'Khaled'
];

const lastNames = [
  'Khan', 'Ahmed', 'Malik', 'Chaudhry', 'Shah', 'Butt', 'Siddiqui', 'Qureshi', 'Tariq', 'Javed',
  'Raza', 'Baig', 'Farooq', 'Rehman', 'Aslam', 'Cheema', 'Abbasi', 'Yousaf', 'Dar', 'Hashmi',
  'Mirza', 'Bhatti', 'Akhtar', 'Nawaz', 'Gondal', 'Gillani', 'Qazi', 'Mughal', 'Saeed', 'Rasheed'
];

const roles = [
  'Entry test aspirant',
  'FSc Pre-Engineering student',
  'Matric student',
  'FSc Pre-Medical student',
  'ICS student',
  'Business & Finance aspirant',
];

const cities = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Hyderabad', 'Abbottabad',
  'Bahawalpur', 'Sargodha', 'Sukkur', 'Mirpur (AJK)', 'Wah Cantt', 'Gujrat',
  'Sheikhupura', 'Jhelum', 'Mardan', 'Swat', 'Muzaffarabad'
];

const avatarColors = [
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
  'bg-rose-500', 'bg-amber-500'
];

// Openers (16)
const openers = [
  "Boardy explanations make tricky numerical problems much easier to break down.",
  "The timed mock tests really helped me build exam pacing and composure.",
  "Practicing chapter-wise questions on my phone made my daily revision consistent.",
  "The Merit Meter aggregate calculator gave me total clarity on where I stood.",
  "Boardly Blitz live drills on weekends are so engaging and fast-paced.",
  "Whenever I got stuck on a physics derivation, Boardy walked me through each step.",
  "The sectional mock tests simulate real board and entrance test pressure accurately.",
  "The question explanations are detailed instead of just showing the correct letter option.",
  "Solving 20 practice questions every evening helped me spot repeated errors in algebra.",
  "The daily free allowance was enough for me to verify the question quality before upgrading.",
  "Boardy kay derivations bohat clear aur to-the-point hain.",
  "The national leaderboard during weekend Arena tournaments gives genuine motivation.",
  "Tracking weak topics directly on the overview tab kept my revision targeted.",
  "Having authentic past paper patterns with instant solutions saved so much study time.",
  "The formula derivations in chemistry and physics are explained without skipping steps.",
  "Practicing with negative marking bounds taught me disciplined question selection."
];

// Mid sentences (16)
const mids = [
  "I liked that the derivations do not skip intermediate algebra steps.",
  "The timer bounds showed me exactly where I was spending too many minutes.",
  "Chapter-wise filters make it easy to focus solely on difficult units.",
  "Seeing my aggregate change with each target score in Merit Meter kept me focused.",
  "Competing against candidates from all provinces gives a realistic benchmark.",
  "Late night doubts were answered in seconds without having to wait for the morning.",
  "The interface runs smoothly on mobile with zero clutter or distracting popups.",
  "Formula sheets in the More section are super handy for quick morning revisions.",
  "Har test ke baad pata chalta hai kis topic par mazeed practice ki zaroorat hai.",
  "The pricing is very reasonable compared to expensive physical academies.",
  "Step-by-step hints guide your thinking without spoiling the answer right away.",
  "The test history breakdown highlights accuracy rates per subject clearly.",
  "Questions cover both conceptual theory and tricky numerical calculations.",
  "Boardy explains the logic behind why distractors are incorrect as well.",
  "Timed sprint drills of 30 questions in 10 minutes are great for daily warmup.",
  "The aggregate weightage formulas match the official university criteria accurately."
];

// Closers (16)
const closers = [
  "Consistent daily practice here made a genuine difference in my confidence.",
  "Highly recommended for students preparing on their own schedule.",
  "Bohat helpful platform hai for disciplined self-study.",
  "It made self-study feel structured and far less overwhelming.",
  "Great study partner to keep in your pocket throughout the exam season.",
  "The explanation quality is easily on par with premium prep centers.",
  "Worth every minute of revision before sitting mock exams.",
  "Concepts crystal clear ho jatay hain with regular practice.",
  "Really glad I started practicing here early in the academic session.",
  "Simple, distraction-free study environment that focuses purely on learning.",
  "Sab se achi baat timer aur instant explanations hain.",
  "A solid companion for anyone targeting high marks on their board papers.",
  "Very smooth experience on both mobile web and desktop.",
  "Helped me turn my weakest topics into solid strengths.",
  "Best value for self-paced revision in Pakistan.",
  "Definitely recommend checking out the free tests first."
];

const generated = [];
const usedTexts = new Set();
const baseDate = new Date('2026-03-28T12:00:00Z');

for (let i = 0; i < 500; i++) {
  const fName = firstNames[i % firstNames.length];
  const lName = lastNames[(i * 3 + Math.floor(i / firstNames.length)) % lastNames.length];
  const name = `${fName} ${lName[0]}.`;
  const initials = `${fName[0]}${lName[0]}`;
  const role = roles[(i * 2 + Math.floor(i / 5)) % roles.length];
  const city = cities[(i * 5 + Math.floor(i / 7)) % cities.length];
  const avatarColor = avatarColors[i % avatarColors.length];

  // Rating: mostly 4-5, a few 3 (e.g. 70% 5, 25% 4, 5% 3)
  let rating = 5;
  if (i % 19 === 0) rating = 3;
  else if (i % 4 === 0 || i % 7 === 0) rating = 4;
  else rating = 5;

  // Form a unique text
  const opIdx = i % openers.length;
  const midIdx = (Math.floor(i / openers.length) + i * 3) % mids.length;
  const closeIdx = (Math.floor(i / (openers.length * mids.length)) + i * 7) % closers.length;

  let text = '';
  // Mix lengths: some 2 sentences, some 3 sentences
  if (i % 3 === 0) {
    text = `${openers[opIdx]} ${closers[closeIdx]}`;
  } else {
    text = `${openers[opIdx]} ${mids[midIdx]} ${closers[closeIdx]}`;
  }

  // Ensure unique text
  if (usedTexts.has(text)) {
    text = `${text} (${i + 1})`;
  }
  usedTexts.add(text);

  const daysAgo = Math.floor((i * 1.3) % 150) + 1;
  const reviewDate = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const dateStr = reviewDate.toISOString().split('T')[0];

  generated.push({
    id: `rev-${String(i + 1).padStart(4, '0')}`,
    name,
    role,
    city,
    rating,
    text,
    date: dateStr,
    initials,
    avatarColor,
    isPlaceholder: true,
  });
}

const fileContent = `export interface PlaceholderReview {
  id: string;
  name: string;
  role: string;
  city: string;
  rating: number;
  text: string;
  date: string;
  initials: string;
  avatarColor: string;
  isPlaceholder: true;
}

export const PLACEHOLDER_REVIEWS: PlaceholderReview[] = ${JSON.stringify(generated, null, 2)};
`;

fs.writeFileSync(path.resolve(__dirname, '../src/data/placeholderReviews.ts'), fileContent, 'utf-8');
console.log(`Successfully generated ${generated.length} reviews in src/data/placeholderReviews.ts!`);
