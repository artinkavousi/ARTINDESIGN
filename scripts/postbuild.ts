#!/usr/bin/env node

/**
 * Post-build script for Engine-First WebGPU Site
 * - Runs Pagefind indexing for search functionality
 * - Optimizes static export for Cloudflare Pages
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const OUT_DIR = join(process.cwd(), 'out')
const PAGEFIND_DIR = join(OUT_DIR, 'pagefind')

console.log('🔧 Running post-build tasks...')

// Ensure out directory exists
if (!existsSync(OUT_DIR)) {
  console.error('❌ Error: out directory not found. Run `npm run build` first.')
  process.exit(1)
}

// Run Pagefind indexing
console.log('🔍 Indexing site with Pagefind...')
try {
  execSync(
    `npx pagefind --site ${OUT_DIR} --output-path ${PAGEFIND_DIR}`,
    { stdio: 'inherit' }
  )
  console.log('✅ Pagefind indexing complete!')
} catch (error) {
  console.error('❌ Pagefind indexing failed:', error)
  process.exit(1)
}

// Additional optimizations can be added here
console.log('✅ Post-build tasks complete!')

