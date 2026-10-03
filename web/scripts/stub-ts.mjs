// Prints a copy of a .ts/.tsx module with every function body replaced by
// `throw new Error("not implemented")`. Used by scripts/prove_red_green.py to
// prove that a module's tests fail without its implementation.
// Uses Vite's own parser (rolldown) so no extra dependency is needed.
import { readFileSync } from 'node:fs';
import { parseAst } from 'rolldown/parseAst';

const file = process.argv[2];
const src = readFileSync(file, 'utf8');
const ast = parseAst(src, { lang: file.endsWith('.tsx') ? 'tsx' : 'ts' });
const THROW = '{ throw new Error("not implemented"); }';
const edits = [];

function visit(node, insideFunction) {
  if (!node || typeof node.type !== 'string') return;
  const isFn = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type);
  if (isFn && !insideFunction && node.body) {
    const body = node.body;
    edits.push([body.start, body.end, body.type === 'BlockStatement' ? THROW : `(() => ${THROW})()`]);
    return; // outermost functions only
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((v) => visit(v, insideFunction));
    else if (value && typeof value === 'object') visit(value, insideFunction);
  }
}

visit(ast, false);
let out = src;
for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) out = out.slice(0, start) + text + out.slice(end);
process.stdout.write(out);
