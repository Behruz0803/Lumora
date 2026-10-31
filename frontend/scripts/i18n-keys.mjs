/** Extracts every tr('…') source string used by the UI (dictionary key list). */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = path.resolve(process.cwd(), 'src')
const files = []
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const f = path.join(d, e.name)
  if (e.isDirectory()) walk(f)
  else if (/\.tsx?$/.test(f) && !f.includes('/i18n/') && !f.includes('/test/')) files.push(f)
})
walk(ROOT)

const keys = new Map()
for (const file of files) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(sf) === 'tr' && node.arguments[0]) {
      const arg = node.arguments[0]
      if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
        keys.set(arg.text, (keys.get(arg.text) ?? 0) + 1)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}
const sorted = [...keys.keys()].sort((a, b) => a.localeCompare(b))
fs.writeFileSync('src/i18n/keys.json', JSON.stringify(sorted, null, 2) + '\n')
console.log('unique keys:', sorted.length)
