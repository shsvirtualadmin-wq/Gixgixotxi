import { Question } from '../types';

export const FAST_BASIC_MATH_QUESTIONS: Question[] = [
  {
    id: 'fast-bm-1',
    q: 'If 15 workers can build a wall in 8 days, how many days will it take 12 workers to build the same wall working at the same rate?',
    options: ['10 days', '9.6 days', '12 days', '6.4 days'],
    correct: 0,
    topic: 'Time and Work',
    chapter: 'Quantitative Reasoning',
    explain: 'Using the inverse variation formula: W1 * D1 = W2 * D2. (15 * 8) = (12 * D2) => 120 = 12 * D2 => D2 = 10 days.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-2',
    q: 'A shopkeeper marks an article 25% above cost price and then offers a 10% discount. What is the net percentage profit?',
    options: ['12.5%', '15%', '10%', '13.75%'],
    correct: 0,
    topic: 'Profit and Loss',
    chapter: 'Arithmetic',
    explain: 'Let Cost Price = 100. Marked Price = 125. Selling Price with 10% discount = 125 - 12.5 = 112.5. Profit = 112.5 - 100 = 12.5%.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-3',
    q: 'A train traveling at 72 km/h crosses a 200-meter long platform in 20 seconds. What is the length of the train?',
    options: ['200 meters', '160 meters', '240 meters', '180 meters'],
    correct: 0,
    topic: 'Speed, Time and Distance',
    chapter: 'Kinematics & Motion',
    explain: 'Speed = 72 * (5/18) = 20 m/s. Total distance crossed in 20 s = 20 * 20 = 400 m. Length of train = 400 - 200 = 200 meters.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-4',
    q: 'The ratio of the ages of two brothers is 4 : 5. Six years ago, their age ratio was 3 : 4. What is the current age of the elder brother?',
    options: ['30 years', '25 years', '24 years', '36 years'],
    correct: 0,
    topic: 'Ratio and Proportion',
    chapter: 'Algebraic Word Problems',
    explain: 'Let their ages be 4x and 5x. Six years ago: (4x - 6)/(5x - 6) = 3/4. 4(4x - 6) = 3(5x - 6) => 16x - 24 = 15x - 18 => x = 6. Elder brother = 5x = 30 years.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-5',
    q: 'Find the simple interest on Rs. 8,000 invested at 7.5% per annum for 4 years.',
    options: ['Rs. 2,400', 'Rs. 2,200', 'Rs. 2,600', 'Rs. 1,800'],
    correct: 0,
    topic: 'Simple and Compound Interest',
    chapter: 'Financial Math',
    explain: 'SI = (P * R * T) / 100 = (8000 * 7.5 * 4) / 100 = 8000 * 0.30 = Rs. 2,400.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-6',
    q: 'The average of 5 consecutive odd numbers is 27. What is the product of the first and last of these numbers?',
    options: ['713', '675', '759', '693'],
    correct: 0,
    topic: 'Averages and Sequences',
    chapter: 'Arithmetic',
    explain: 'For 5 consecutive odd numbers, the average is the middle number: 27. The numbers are 23, 25, 27, 29, 31. Product of first and last = 23 * 31 = 713.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-7',
    q: 'Two pipes A and B can fill a tank in 12 hours and 18 hours respectively. If both pipes are opened together, how long will it take to fill the tank?',
    options: ['7.2 hours', '6.5 hours', '8.0 hours', '7.5 hours'],
    correct: 0,
    topic: 'Pipes and Cisterns',
    chapter: 'Work Rate',
    explain: 'Combined rate = 1/12 + 1/18 = (3 + 2)/36 = 5/36 per hour. Time taken = 36/5 = 7.2 hours (7 hours 12 minutes).',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-8',
    q: 'If the radius of a circle is increased by 20%, by what percentage does its area increase?',
    options: ['44%', '40%', '20%', '48%'],
    correct: 0,
    topic: 'Geometry and Mensuration',
    chapter: 'Areas and Volumes',
    explain: 'Area is proportional to r^2. New area = (1.20)^2 = 1.44 of original area, which is a 44% increase.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-9',
    q: 'The perimeter of a rectangle is 64 cm and its length is 6 cm greater than its width. What is the area of the rectangle?',
    options: ['247 cm²', '256 cm²', '240 cm²', '260 cm²'],
    correct: 0,
    topic: 'Mensuration and Perimeter',
    chapter: 'Geometry',
    explain: '2(L + W) = 64 => L + W = 32. Given L = W + 6 => 2W + 6 = 32 => 2W = 26 => W = 13 cm, L = 19 cm. Area = 19 * 13 = 247 cm².',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-10',
    q: 'In how many different ways can the letters of the word "ENGINE" be arranged?',
    options: ['180', '360', '720', '120'],
    correct: 0,
    topic: 'Permutations and Combinations',
    chapter: 'Combinatorics',
    explain: 'Total letters = 6. E appears 2 times, N appears 2 times, G appears 1 time, I appears 1 time. Arrangements = 6! / (2! * 2!) = 720 / 4 = 180.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-11',
    q: 'What is the greatest common divisor (HCF) of 84 and 126?',
    options: ['42', '21', '14', '28'],
    correct: 0,
    topic: 'HCF and LCM',
    chapter: 'Number Systems',
    explain: '84 = 2^2 * 3 * 7. 126 = 2 * 3^2 * 7. HCF = 2^1 * 3^1 * 7^1 = 42.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-12',
    q: 'A bag contains 5 red, 4 blue, and 3 green marbles. If one marble is drawn at random, what is the probability that it is NOT blue?',
    options: ['2/3', '1/3', '3/4', '7/12'],
    correct: 0,
    topic: 'Probability Basics',
    chapter: 'Statistics and Probability',
    explain: 'Total marbles = 5 + 4 + 3 = 12. Non-blue marbles = 5 red + 3 green = 8. Probability = 8/12 = 2/3.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-13',
    q: 'If 3x + 2y = 19 and 2x + 3y = 21, what is the value of x + y?',
    options: ['8', '7', '9', '10'],
    correct: 0,
    topic: 'Linear Equations',
    chapter: 'Algebra',
    explain: 'Add both equations: (3x + 2y) + (2x + 3y) = 19 + 21 => 5x + 5y = 40 => 5(x + y) = 40 => x + y = 8.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-14',
    q: 'A sum of money doubles itself in 8 years under simple interest. What is the annual rate of interest?',
    options: ['12.5%', '10%', '15%', '8.5%'],
    correct: 0,
    topic: 'Simple Interest',
    chapter: 'Financial Math',
    explain: 'If money doubles, Interest = Principal P. P = (P * R * 8) / 100 => 8R = 100 => R = 12.5% per annum.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-15',
    q: 'The price of sugar rises by 25%. By what percentage must a household reduce its consumption to keep expenditure constant?',
    options: ['20%', '25%', '15%', '18.75%'],
    correct: 0,
    topic: 'Percentage and Consumption',
    chapter: 'Arithmetic',
    explain: 'Reduction percentage = [R / (100 + R)] * 100 = [25 / 125] * 100 = 1/5 * 100 = 20%.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-16',
    q: 'A cyclist covers 45 km at a speed of 15 km/h and the next 45 km at 30 km/h. What is the average speed for the entire journey?',
    options: ['20 km/h', '22.5 km/h', '21 km/h', '18 km/h'],
    correct: 0,
    topic: 'Harmonic Mean / Average Speed',
    chapter: 'Kinematics',
    explain: 'Time 1 = 45/15 = 3 h. Time 2 = 45/30 = 1.5 h. Total distance = 90 km, total time = 4.5 h. Average speed = 90 / 4.5 = 20 km/h (or 2xy/(x+y) = 2*15*30 / 45 = 20 km/h).',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-17',
    q: 'What is the sum of all interior angles of a regular hexagon?',
    options: ['720°', '540°', '900°', '1080°'],
    correct: 0,
    topic: 'Polygons and Angles',
    chapter: 'Geometry',
    explain: 'Sum of interior angles = (n - 2) * 180°. For a hexagon (n = 6): (6 - 2) * 180° = 4 * 180° = 720°.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-18',
    q: 'In a class of 40 students, 24 like cricket, 18 like football, and 6 like neither. How many students like both sports?',
    options: ['8', '10', '12', '6'],
    correct: 0,
    topic: 'Set Theory and Venn Diagrams',
    chapter: 'Sets and Logic',
    explain: 'Students liking at least one sport = 40 - 6 = 34. n(A U B) = n(A) + n(B) - n(A ∩ B) => 34 = 24 + 18 - n(Both) => 34 = 42 - n(Both) => n(Both) = 8.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-19',
    q: 'A mixture of 60 liters contains milk and water in the ratio 2 : 1. How much water must be added to make the ratio 1 : 2?',
    options: ['60 liters', '40 liters', '50 liters', '30 liters'],
    correct: 0,
    topic: 'Mixtures and Alligations',
    chapter: 'Arithmetic',
    explain: 'Initial milk = 40 L, water = 20 L. Let x liters of water be added: 40 / (20 + x) = 1/2 => 20 + x = 80 => x = 60 liters.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  },
  {
    id: 'fast-bm-20',
    q: 'If log₁₀(x) = 3 and log₁₀(y) = -1, what is the value of log₁₀(x² / y)?',
    options: ['7', '5', '6', '8'],
    correct: 0,
    topic: 'Logarithms',
    chapter: 'Algebra',
    explain: 'log₁₀(x² / y) = 2 log₁₀(x) - log₁₀(y) = 2(3) - (-1) = 6 + 1 = 7.',
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  }
];

// Generate authentic, syllabus-accurate mathematical problems up to 105 total
const MATH_TOPIC_TEMPLATES = [
  {
    topic: 'Ratio and Mixture',
    stemGen: (idx: number) => {
      const a = 2 + (idx % 4);
      const b = 3 + (idx % 3);
      const total = (a + b) * (10 + idx);
      const shareA = (a / (a + b)) * total;
      return {
        q: `Two partners divide a profit of Rs. ${total.toLocaleString()} in the ratio of ${a} : ${b}. What is the share of the first partner?`,
        correct: `Rs. ${shareA.toLocaleString()}`,
        distractors: [
          `Rs. ${(shareA + 500).toLocaleString()}`,
          `Rs. ${(shareA - 400).toLocaleString()}`,
          `Rs. ${Math.round(total / 2).toLocaleString()}`
        ],
        exp: `Total ratio parts = ${a} + ${b} = ${a + b}. First partner share = (${a}/${a + b}) * ${total} = Rs. ${shareA}.`
      };
    }
  },
  {
    topic: 'Percentages and Discounts',
    stemGen: (idx: number) => {
      const base = 200 + idx * 25;
      const pct = 10 + (idx % 5) * 5; // 10, 15, 20, 25, 30
      const discount = (base * pct) / 100;
      const finalPrice = base - discount;
      return {
        q: `An item priced at Rs. ${base} is offered at a ${pct}% discount. What is the final selling price?`,
        correct: `Rs. ${finalPrice}`,
        distractors: [`Rs. ${finalPrice + 15}`, `Rs. ${finalPrice - 20}`, `Rs. ${base - pct}`],
        exp: `Discount = ${pct}% of ${base} = Rs. ${discount}. Final Price = ${base} - ${discount} = Rs. ${finalPrice}.`
      };
    }
  },
  {
    topic: 'Speed and Time',
    stemGen: (idx: number) => {
      const speed = 40 + (idx % 6) * 10;
      const timeHrs = 2 + (idx % 3);
      const distance = speed * timeHrs;
      return {
        q: `A car travels at an average speed of ${speed} km/h for ${timeHrs} hours. What total distance does it cover?`,
        correct: `${distance} km`,
        distractors: [`${distance + 25} km`, `${distance - 20} km`, `${distance + 15} km`],
        exp: `Distance = Speed * Time = ${speed} * ${timeHrs} = ${distance} km.`
      };
    }
  },
  {
    topic: 'Geometry and Mensuration',
    stemGen: (idx: number) => {
      const side = 6 + (idx % 8);
      const area = side * side;
      return {
        q: `What is the area of a square whose perimeter is ${side * 4} cm?`,
        correct: `${area} cm²`,
        distractors: [`${area + 12} cm²`, `${side * 4} cm²`, `${area - 8} cm²`],
        exp: `Side = Perimeter / 4 = ${side * 4} / 4 = ${side} cm. Area = Side² = ${side}² = ${area} cm².`
      };
    }
  },
  {
    topic: 'Simple Interest',
    stemGen: (idx: number) => {
      const p = 5000 + (idx % 5) * 1000;
      const r = 5 + (idx % 4);
      const t = 2 + (idx % 3);
      const si = (p * r * t) / 100;
      return {
        q: `Calculate the simple interest on a principal of Rs. ${p.toLocaleString()} at ${r}% per annum for ${t} years.`,
        correct: `Rs. ${si}`,
        distractors: [`Rs. ${si + 100}`, `Rs. ${si - 50}`, `Rs. ${si + 200}`],
        exp: `SI = (P * R * T) / 100 = (${p} * ${r} * ${t}) / 100 = Rs. ${si}.`
      };
    }
  }
];

for (let i = 21; i <= 105; i++) {
  const template = MATH_TOPIC_TEMPLATES[(i - 21) % MATH_TOPIC_TEMPLATES.length];
  const item = template.stemGen(i);

  FAST_BASIC_MATH_QUESTIONS.push({
    id: `fast-bm-${i}`,
    q: item.q,
    options: [item.correct, ...item.distractors],
    correct: 0,
    topic: template.topic,
    chapter: 'FAST Quantitative & Basic Math',
    explain: item.exp,
    difficulty: 'Exam Standard',
    subject: 'Basic Mathematics'
  });
}
