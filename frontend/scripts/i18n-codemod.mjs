/**
 * i18n codemod — wraps user-visible JSX text and string attributes in tr(...).
 *
 * Uses the TypeScript AST so only real JSX text nodes and whitelisted JSX
 * attributes are touched (a regex would corrupt generics such as Map<string, T>).
 *
 * Usage:
 *   node scripts/i18n-codemod.mjs           # rewrite files in place
 *   node scripts/i18n-codemod.mjs --check    # report what would change
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = path.resolve(process.cwd(), 'src')
const CHECK = process.argv.includes('--check')

const TEXT_ATTRIBUTES = new Set([
  'placeholder',
  'title',
  'aria-label',
  'label',
  'description',
  'hint',
  'subtitle',
  'alt',
  'confirmLabel',
  'cancelLabel',
  'emptyMessage',
  'helper',
  'eyebrow',
  'message',
  'caption',
])

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    if (entry.isFile() && full.endsWith('.tsx')) return [full]
    return []
  })
}

function hasLetters(value) {
  return /[A-Za-z\u0400-\u04FF]/.test(value)
}

function relativeImport(file) {
  const fromDir = path.dirname(file)
  let rel = path.relative(fromDir, path.join(ROOT, 'i18n')).split(path.sep).join('/')
  if (!rel.startsWith('.')) rel = './' + rel
  return `${rel}/core`
}

function transform(file) {
  const source = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []

  const skipRanges = []
  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const raw = node.getText(sf)
      const trimmed = raw.trim().replace(/\s+/g, ' ')
      if (!trimmed || !hasLetters(trimmed)) return
      const leading = raw.slice(0, raw.indexOf(raw.trim()[0]))
      const trailing = raw.slice(raw.trimEnd().length)
      const start = node.getStart(sf)
      const end = node.getEnd()
      edits.push({ start, end, text: `${leading}{tr(${JSON.stringify(trimmed)})}${trailing}` })
      return
    }

    if (ts.isJsxAttribute(node) && TEXT_ATTRIBUTES.has(node.name.getText(sf))) {
      const init = node.initializer
      if (init && ts.isStringLiteral(init)) {
        const value = init.text
        if (hasLetters(value)) {
          edits.push({ start: init.getStart(sf), end: init.getEnd(), text: `{tr(${JSON.stringify(value)})}` })
        }
        return
      }
    }

    if (!skipRanges.some((range) => node.getStart(sf) >= range.start && node.getEnd() <= range.end)) {
      ts.forEachChild(node, visit)
    }
  }
  visit(sf)

  if (edits.length === 0) return { file, changed: 0 }

  const importLine = `import { tr } from '${relativeImport(file)}'`
  const hasImport = source.includes("from '" + relativeImport(file) + "'")

  let output = source
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end)
  }

  if (!hasImport) {
    const sf2 = ts.createSourceFile(file, output, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const lastImport = sf2.statements.filter(ts.isImportDeclaration).pop()
    const insertAt = lastImport ? lastImport.getEnd() : 0
    output = output.slice(0, insertAt) + `\n${importLine}` + output.slice(insertAt)
  }

  if (!CHECK) fs.writeFileSync(file, output)
  return { file: path.relative(process.cwd(), file), changed: edits.length }
}

const results = walk(ROOT).map(transform).filter((result) => result.changed > 0)
for (const result of results) console.log(`${CHECK ? 'would transform' : 'transformed'} ${result.file}: ${result.changed}`)
console.log(`${results.length} file(s), ${results.reduce((sum, r) => sum + r.changed, 0)} strings`)
