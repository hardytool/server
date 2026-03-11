#!/usr/bin/env node
'use strict'

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const MAX_ENTRIES = 100
const HISTORY_PATH = path.resolve('coverage-history.json')
const SUMMARY_PATH = path.resolve('coverage', 'coverage-summary.json')
const BASELINE_PATH = path.resolve(process.env.TRUNK_BASELINE || 'trunk-baseline.json')
const REPORT_PATH = path.resolve('coverage-report.md')
const IS_TRUNK = process.env.GITHUB_REF_NAME === 'trunk'

function getCommitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function readSummary() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.error(`Coverage summary not found: ${SUMMARY_PATH}`)
    console.error('Run "npm run test:coverage" first.')
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'))
}

function formatDelta(current, previous) {
  if (previous === undefined || previous === null) return '—'
  const delta = current - previous
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}

// Main
const summary = readSummary()
const total = summary.total

const entry = {
  date: new Date().toISOString().split('T')[0],
  commit: getCommitSha(),
  lines: total.lines.pct,
  statements: total.statements.pct,
  branches: total.branches.pct,
  functions: total.functions.pct,
}

// Read trunk baseline for delta comparison
const baseline = readJson(BASELINE_PATH)

// Append to branch/trunk history
const history = readJson(HISTORY_PATH) || []
history.push(entry)
const trimmed = history.slice(-MAX_ENTRIES)
fs.writeFileSync(HISTORY_PATH, JSON.stringify(trimmed, null, 2) + '\n')

// On trunk, update the baseline file for future PR comparisons
if (IS_TRUNK) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(entry, null, 2) + '\n')
}

// Build report
const lines = [
  '## Coverage Report',
  '',
  '| Metric | Coverage | vs trunk |',
  '|--------|----------|----------|',
  `| Lines | ${entry.lines.toFixed(1)}% | ${formatDelta(entry.lines, baseline?.lines)} |`,
  `| Statements | ${entry.statements.toFixed(1)}% | ${formatDelta(entry.statements, baseline?.statements)} |`,
  `| Branches | ${entry.branches.toFixed(1)}% | ${formatDelta(entry.branches, baseline?.branches)} |`,
  `| Functions | ${entry.functions.toFixed(1)}% | ${formatDelta(entry.functions, baseline?.functions)} |`,
  '',
]

// Recent history table (last 10 runs)
const recent = trimmed.slice(-10)
if (recent.length > 1) {
  lines.push('<details>')
  lines.push('<summary>Recent trend (last 10 runs)</summary>')
  lines.push('')
  lines.push('| Date | Commit | Lines | Stmts | Branch | Funcs |')
  lines.push('|------|--------|-------|-------|--------|-------|')
  for (const r of recent) {
    lines.push(
      `| ${r.date} | ${r.commit} | ${r.lines.toFixed(1)}% | ${r.statements.toFixed(1)}% | ${r.branches.toFixed(1)}% | ${r.functions.toFixed(1)}% |`
    )
  }
  lines.push('')
  lines.push('</details>')
  lines.push('')
}

const output = lines.join('\n')

// Print to console
console.log(output)

// Write report file for PR comment step
fs.writeFileSync(REPORT_PATH, output)

// Write to GitHub Actions step summary if available
const summaryFile = process.env.GITHUB_STEP_SUMMARY
if (summaryFile) {
  fs.appendFileSync(summaryFile, output + '\n')
}
