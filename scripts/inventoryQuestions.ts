import fs from 'fs';
import path from 'path';

async function scanFiles() {
  const dir = path.join(process.cwd(), 'src/data');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

  const results: { file: string; count: number; exportKeys: string[] }[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    try {
      // Dynamic import
      const mod = await import(fullPath);
      let count = 0;
      const exportKeys: string[] = [];

      for (const [key, value] of Object.entries(mod)) {
        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && ('q' in value[0] || 'question' in value[0])) {
            count += value.length;
            exportKeys.push(`${key} (${value.length})`);
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Record<string, Question[]>
          let recordCount = 0;
          for (const [subKey, subVal] of Object.entries(value)) {
            if (Array.isArray(subVal) && subVal.length > 0 && typeof subVal[0] === 'object' && ('q' in subVal[0] || 'question' in subVal[0])) {
              recordCount += subVal.length;
            }
          }
          if (recordCount > 0) {
            count += recordCount;
            exportKeys.push(`${key} [dict: ${recordCount}]`);
          }
        }
      }

      if (count > 0) {
        results.push({ file: `src/data/${file}`, count, exportKeys });
      }
    } catch (e: any) {
      console.error(`Error importing ${file}:`, e.message);
    }
  }

  // Also check data/questions.cleaned.json
  const jsonPath = path.join(process.cwd(), 'data/questions.cleaned.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(data)) {
        results.push({ file: 'data/questions.cleaned.json', count: data.length, exportKeys: [`default (${data.length})`] });
      }
    } catch (e) {}
  }

  console.log('=== QUESTION BANK INVENTORY ===');
  let total = 0;
  for (const res of results) {
    console.log(`${res.file}: ${res.count} questions - exports: ${res.exportKeys.join(', ')}`);
    total += res.count;
  }
  console.log(`Total across files: ${total}`);
}

scanFiles().catch(console.error);
