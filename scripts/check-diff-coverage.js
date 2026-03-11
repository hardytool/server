#!/usr/bin/env node
'use strict'

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const THRESHOLD = 70
const BASE_BRANCH = process.env.DIFF_BASE || 'origin/trunk'

const ELIGIBLE_PREFIXES = [
  'src/lib/',
  'src/repos/',
  'src/api/',
]

const ELIGIBLE_EXACT = [
  'src/config.ts',
  'src/seed-data.ts',
]

const EXCLUDED = [
  'src/repos/migration.ts',
]

function isCoverageEligible(filePath) {
  if (EXCLUDED.includes(filePath)) return false
  if (ELIGIBLE_EXACT.includes(filePath)) return true
  return ELIGIBLE_PREFIXES.some(prefix => filePath.startsWith(prefix))
}

function getChangedFiles() {
  try {
    const output = execSync(`git diff --name-only ${BASE_BRANCH}...HEAD`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return output.trim().split('\n').filter(f => f.endsWith('.ts'))
  } catch {
    console.error(`Failed to get changed files (base: ${BASE_BRANCH}).`)
    console.error('Set DIFF_BASE env var to override the base branch.')
    process.exit(1)
  }
}

function computeCoverage(entry) {
  const stmts = Object.values(entry.s)
  const total = stmts.length
  if (total === 0) return 100
  const covered = stmts.filter(n => n > 0).length
  return (covered / total) * 100
}

// Main
const changedFiles = getChangedFiles()
const eligibleFiles = changedFiles.filter(isCoverageEligible)

if (eligibleFiles.length === 0) {
  console.log('No coverage-eligible files changed. Skipping diff coverage check.')
  process.exit(0)
}

const coveragePath = path.resolve('coverage', 'coverage-final.json')
if (!fs.existsSync(coveragePath)) {
  console.error(`Coverage file not found: ${coveragePath}`)
  console.error('Run "npm run test:coverage" first.')
  process.exit(1)
}

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'))
const root = process.cwd()

const results = []
for (const file of eligibleFiles) {
  const absPath = path.resolve(root, file)
  const entry = coverage[absPath]
  const pct = entry ? computeCoverage(entry) : 0
  const pass = pct >= THRESHOLD
  results.push({ file, pct, pass })
}

// Print summary
console.log('\nDiff Coverage Report')
console.log('='.repeat(60))
console.log(`Threshold: ${THRESHOLD}%\n`)

const maxLen = Math.max(...results.map(r => r.file.length))
for (const r of results) {
  const status = r.pass ? 'PASS' : 'FAIL'
  console.log(`  ${r.file.padEnd(maxLen)}  ${r.pct.toFixed(1).padStart(5)}%  ${status}`)
}

const failures = results.filter(r => !r.pass)
if (failures.length > 0) {
  console.log(`\n${failures.length} file(s) below ${THRESHOLD}% coverage threshold.`)
  process.exit(1)
}

console.log('\nAll changed files meet the coverage threshold.')
