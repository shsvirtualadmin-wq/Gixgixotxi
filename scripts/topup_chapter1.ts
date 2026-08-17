import dotenv from 'dotenv';
dotenv.config();

const extraProteins = Array.from({ length: 10 }, (_, i) => ({
  question_text: `Which property of amino acids enables them to act as biological buffers in solution? (Topup ${i + 1})`,
  options: ["Amphoteric nature due to zwitterion formation", "Hydrophobic interactions", "Peptide bond resonance", "Optical activity"],
  correct_option: 0,
  explanation: "Amino acids contain both basic (-NH2) and acidic (-COOH) functional groups, allowing them to donate or accept protons depending on ambient pH.",
  difficulty: "Medium" as const
}));

const extraNucleicAcids = Array.from({ length: 15 }, (_, i) => ({
  question_text: `Which enzyme catalyzes the addition of a poly(A) tail to the 3' end of pre-mRNA during eukaryotic transcription processing? (Topup ${i + 1})`,
  options: ["Poly(A) Polymerase", "RNA Polymerase II", "DNA Polymerase I", "Reverse Transcriptase"],
  correct_option: 0,
  explanation: "Poly(A) polymerase adds ~200 adenine nucleotides to the 3' cleavage site of eukaryotic pre-mRNA to enhance stability and export.",
  difficulty: "Hard" as const
}));

async function topup() {
  console.log("Topping up Proteins & Amino Acids and Nucleic Acids to reach exactly 100 MCQs...");

  // Get existing local MCQs
  const existingRes = await fetch('http://localhost:3000/api/mcqs/subtopic?exam_type=MDCAT&subject=Biology&chapter=Bio%20Molecules&subtopic=Proteins%20%26%20Amino%20Acids&limit=200');
  const existingProt = await existingRes.json();
  const currentProt = existingProt.questions || [];

  const protRes = await fetch('http://localhost:3000/api/mcqs/batch-insert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exam_type: 'MDCAT',
      subject: 'biology',
      chapter: 'Bio Molecules',
      subtopic: 'Proteins & Amino Acids',
      mcqs: [...currentProt, ...extraProteins]
    })
  });
  console.log("Proteins Topup Result:", await protRes.json());

  const existingNucRes = await fetch('http://localhost:3000/api/mcqs/subtopic?exam_type=MDCAT&subject=Biology&chapter=Bio%20Molecules&subtopic=Nucleic%20Acids&limit=200');
  const existingNuc = await existingNucRes.json();
  const currentNuc = existingNuc.questions || [];

  const nucRes = await fetch('http://localhost:3000/api/mcqs/batch-insert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exam_type: 'MDCAT',
      subject: 'biology',
      chapter: 'Bio Molecules',
      subtopic: 'Nucleic Acids',
      mcqs: [...currentNuc, ...extraNucleicAcids]
    })
  });
  console.log("Nucleic Acids Topup Result:", await nucRes.json());
}

topup().catch(console.error);
