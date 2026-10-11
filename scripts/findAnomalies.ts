import fs from 'fs';
import path from 'path';

async function scanAnomalies() {
  const dir = path.join(process.cwd(), 'src/data');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !f.includes('types'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Look for (1, ., ..^2) or variations
    const omegaMatches = content.match(/\(1,\s*[\.\,\s]+\^?2?\)/g);
    if (omegaMatches) {
      console.log(`[${file}] Omega anomalies:`, omegaMatches);
    }
    
    // Look for "For -3" or "For -[0-9]"
    const forMatches = content.match(/For\s+-[0-9]/g);
    if (forMatches) {
      console.log(`[${file}] For -[0-9] anomalies:`, forMatches);
    }

    // Look for weird dots or lost square roots
    const rootMatches = content.match(/(?:√|\\sqrt)[^a-zA-Z0-9{\(\[]/g);
    if (rootMatches) {
      console.log(`[${file}] Root anomalies:`, rootMatches);
    }
  }
}

scanAnomalies().catch(console.error);
