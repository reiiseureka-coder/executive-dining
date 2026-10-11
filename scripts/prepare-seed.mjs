// Converts a reviewed research file into a candidate-only import SQL FILE.
// Does not connect to Supabase, apply SQL, grant roles, or approve publication.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node scripts/prepare-seed.mjs data/research/.../verified-seed.json /tmp/candidates.sql');
const seed = JSON.parse(await readFile(input, 'utf8'));
if (seed.schema_version !== '1.0' || !Array.isArray(seed.venues) || seed.venues.length > 200 || !Array.isArray(seed.sources) || !Number.isFinite(Date.parse(seed.prepared_at))) throw new Error('Unsupported seed input');
const quote = value => value === null ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
// App-owned deterministic identity, explicitly unrelated to provider IDs.
const id = key => {
  const hex = createHash('sha256').update(`ExecutiveDining seed v1:${key}`).digest('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
};
const lines = [
  '-- CANDIDATES ONLY. Review and obtain approval before executing against the confirmed project.',
  '-- No public facts, roles, settings, grants or existing records are modified.',
  'begin;',
];
for (const venue of seed.venues) {
  if (typeof venue.id !== 'string' || typeof venue.name !== 'string' || typeof venue.address !== 'string' || !venue.address.includes('名古屋市')) throw new Error('Malformed or out-of-scope venue');
  const key = `research:${seed.verification_date}:${venue.id}`;
  const venueId = id(key);
  lines.push(`insert into dining_private.restaurants(id, import_key, candidate_name, candidate_address, city) values (${quote(venueId)},${quote(key)},${quote(venue.name)},${quote(venue.address)},'名古屋市') on conflict (import_key) do nothing;`);
  // Retain the complete structured research as private evidence, not an approved fact.
  const records = [{
    provider: 'official-research', source_url: venue.official_url, fetched_at: seed.prepared_at,
    raw_record: { venue, sources: seed.sources }, licenses: [], attributions: [],
  }, ...(venue.openpoi_matches ?? []).map(match => ({
    provider: `openpoi:${match.raw_record.source || 'unknown'}`, source_url: match.request_url,
    fetched_at: match.fetched_at, raw_record: match.raw_record,
    licenses: match.raw_record.licenses ?? [], attributions: match.raw_record.attributions ?? [],
  }))];
  for (const [index, record] of records.entries()) {
    const sourceId = id(`${key}:source:${index}`);
    lines.push(`insert into dining_private.restaurant_sources(id, restaurant_id, provider, source_url, licenses, attributions, fetched_at, raw_record) values (${quote(sourceId)},(select id from dining_private.restaurants where import_key=${quote(key)}),${quote(record.provider)},${quote(record.source_url)},array(select jsonb_array_elements_text(${quote(JSON.stringify(record.licenses))}::jsonb)),array(select jsonb_array_elements_text(${quote(JSON.stringify(record.attributions))}::jsonb)),${quote(record.fetched_at)},${quote(JSON.stringify(record.raw_record))}::jsonb) on conflict (id) do nothing;`);
  }
}
lines.push('commit;', '');
await writeFile(output, lines.join('\n'), { flag: 'wx' });
console.log(`Prepared ${seed.venues.length} candidate records at ${output}. Nothing applied or published.`);
