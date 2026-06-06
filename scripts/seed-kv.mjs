/**
 * Seed Cloudflare KV with initial navigation data.
 *
 * Reads `src/mock/mock_data.js` and writes to KV key `nav:data`.
 *
 * Usage:
 *   node scripts/seed-kv.mjs            # preview namespace (default)
 *   node scripts/seed-kv.mjs --remote   # production namespace
 *
 * Prerequisite: wrangler CLI installed and wrangler.toml has valid KV ids.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const useRemote = process.argv.includes('--remote')
const BINDING = 'NAV_KV'
const KEY = 'nav:data'

// --- 1. Read and parse mock_data.js -------------------------------------------
const mockPath = resolve(ROOT, 'src', 'mock', 'mock_data.js')
if (!existsSync(mockPath)) {
  console.error(`ERROR: mock_data.js not found at ${mockPath}`)
  process.exit(1)
}

const raw = readFileSync(mockPath, 'utf-8')
const match = raw.match(/export const mockData =\s*(\{[\s\S]*?\n\})/)
if (!match) {
  console.error('ERROR: Could not extract mockData from mock_data.js')
  process.exit(1)
}

let data
try {
  data = JSON.parse(match[1])
} catch (err) {
  console.error('ERROR: mock_data.js content is not valid JSON:', err.message)
  process.exit(1)
}

const normalized = {
  title: data.title || '猫猫导航',
  search: data.search || 'bing',
  categories: data.categories || [],
}
const serialized = JSON.stringify(normalized)

console.log(
  `Parsed: title="${normalized.title}", ${normalized.categories.length} cats, ` +
  `${normalized.categories.reduce((s, c) => s + (c.sites?.length || 0), 0)} sites`
)

// --- 2. Write payload to project root temp file --------------------------------
const payloadFile = resolve(ROOT, '.seed_payload.json')
writeFileSync(payloadFile, serialized, 'utf-8')

// --- 3. Call wrangler ---------------------------------------------------------
const flags = useRemote ? ['--remote', '--preview', 'false'] : ['--preview']
const args = ['kv', 'key', 'put', KEY, '--binding', BINDING, '--path', payloadFile, ...flags]
// Use platform-appropriate wrangler resolution
const wranglerCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'

try {
  execFileSync(wranglerCommand, ['wrangler', ...args], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'inherit',
    timeout: 30_000,
  })
  console.log('SUCCESS: nav:data seeded.')
} catch (err) {
  console.error('FAILED. Try manually:')
  console.error(`  npx wrangler ${args.join(' ')}`)
  process.exitCode = 1
} finally {
  try { unlinkSync(payloadFile) } catch { /* ok */ }
}
