#!/usr/bin/env node
'use strict'

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const MAX_ENTRIES = 100
const HISTORY_PATH = path.resolve('coverage-history.json')
const SUMMARY_PATH = path.resolve('coverage', 'coverage-summary.json')

function getCommitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'))
  } catch {
    return []
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
  if (previous === undefined) return ''
  const delta = current - previous
  const sign = delta >= 0 ? '+' : ''
  return ` (${sign}${delta.toFixed(1)}%)`
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

const history = readHistory()
history.push(entry)

// Trim to last MAX_ENTRIES
const trimmed = history.slice(-MAX_ENTRIES)
fs.writeFileSync(HISTORY_PATH, JSON.stringify(trimmed, null, 2) + '\n')

// Build summary output
const prev = history.length >= 2 ? history[history.length - 2] : null

const lines = [
  '## Coverage Report',
  '',
  '| Metric | Coverage | Delta |',
  '|--------|----------|-------|',
  `| Lines | ${entry.lines.toFixed(1)}% | ${prev ? formatDelta(entry.lines, prev.lines) : '—'} |`,
  `| Statements | ${entry.statements.toFixed(1)}% | ${prev ? formatDelta(entry.statements, prev.statements) : '—'} |`,
  `| Branches | ${entry.branches.toFixed(1)}% | ${prev ? formatDelta(entry.branches, prev.branches) : '—'} |`,
  `| Functions | ${entry.functions.toFixed(1)}% | ${prev ? formatDelta(entry.functions, prev.functions) : '—'} |`,
  '',
]

// Recent history table (last 10 runs)
const recent = trimmed.slice(-10)
if (recent.length > 1) {
  lines.push('### Recent Trend (last 10 runs)')
  lines.push('')
  lines.push('| Date | Commit | Lines | Stmts | Branch | Funcs |')
  lines.push('|------|--------|-------|-------|--------|-------|')
  for (const r of recent) {
    lines.push(
      `| ${r.date} | ${r.commit} | ${r.lines.toFixed(1)}% | ${r.statements.toFixed(1)}% | ${r.branches.toFixed(1)}% | ${r.functions.toFixed(1)}% |`
    )
  }
  lines.push('')
}

const output = lines.join('\n')

// Print to console
console.log(output)

// Write to GitHub Actions step summary if available
const summaryFile = process.env.GITHUB_STEP_SUMMARY
if (summaryFile) {
  fs.appendFileSync(summaryFile, output + '\n')
  console.log('Coverage summary written to GitHub Actions step summary.')
}
