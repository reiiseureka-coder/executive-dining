// Bounded read-only candidate acquisition; never imports into a live database.
import { writeFile } from 'node:fs/promises';
import { OpenPoiProvider } from '../src/data/providers/openPoi.ts';
const [query, output] = process.argv.slice(2);
if (!query || !output) throw new Error('Usage: node scripts/acquire-nagoya.mjs "日本料理" /path/to/candidates.json');
const batch = await new OpenPoiProvider().search(query);
await writeFile(output, JSON.stringify(batch, null, 2) + '\n', { flag: 'wx' });
console.log(`${batch.candidates.length} candidates, ${batch.skipped} skipped. Truncated: ${batch.possiblyTruncated}. No records published.`);
