import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseSfc } from '@vue/compiler-sfc';
import { parse as parseTemplate } from '@vue/compiler-dom';
import postcss from 'postcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src');
const violations = [];
const appButtonPath = 'src/components/ui/AppButton.vue';
const appCardPath = 'src/components/ui/AppCard.vue';
const keypadPath = 'src/components/TecladoPesos.vue';

export function checkTemplate(source, file) {
  const { descriptor, errors } = parseSfc(source, { filename: file });
  if (errors.length) return [`${file}: no se pudo analizar el SFC`];
  if (!descriptor.template) return [];
  const findings = [];
  const ast = parseTemplate(descriptor.template.content);
  const visit = (node, inKeypad = false) => {
    if (node.type === 1) {
      const keypadScope = inKeypad || (node.tag === 'div' && node.props.some(
        (prop) => prop.type === 6 && prop.name === 'class' && prop.value?.content.split(/\s+/).includes('teclas'),
      ));
      if (node.tag.toLowerCase() === 'q-btn' && file !== appButtonPath)
        findings.push(`${file}: usa q-btn fuera de AppButton`);
      if (node.tag.toLowerCase() === 'q-card' && file !== appCardPath)
        findings.push(`${file}: usa q-card fuera de AppCard`);
      if (node.tag.toLowerCase() === 'button' && !(file === keypadPath && keypadScope))
        findings.push(`${file}: usa <button> fuera del teclado de pesos`);
      if (node.tag === 'AppButton') {
        for (const prop of node.props) {
          if (prop.type !== 6) continue;
          if (['padding', 'height', 'font-size', 'style', 'dense', 'round', 'flat', 'outline', 'color'].includes(prop.name))
            findings.push(`${file}: AppButton recibe el atributo de tamaño/estilo prohibido ${prop.name}`);
          if (prop.name === 'size' && prop.value && !['md', 'lg'].includes(prop.value.content))
            findings.push(`${file}: tamaño AppButton inválido ${prop.value.content}`);
        }
      }
      for (const child of node.children ?? []) visit(child, keypadScope);
    } else if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) visit(child, inKeypad);
    }
  };
  visit(ast);
  return findings;
}

export function checkStyles(source, file) {
  const { descriptor } = parseSfc(source, { filename: file });
  const findings = [];
  for (const style of descriptor.styles) {
    let ast;
    try { ast = postcss.parse(style.content.replace(/#\{[^}]+\}/g, '0px')); } catch { findings.push(`${file}: CSS no válido`); continue; }
    ast.walkRules((rule) => {
      const selector = rule.selector;
      const isButton = /(^|[\s>+~])button\b|\.q-btn\b|\.btn(?:-[\w-]+)?\b/.test(selector);
      if (isButton && file !== appButtonPath && file !== keypadPath)
        findings.push(`${file}: estilo de botón personalizado fuera de AppButton`);
      if (/(^|[\s>+~])\.app-button(?:$|[.#:[>+~\s])/.test(selector) && file !== appButtonPath && /\b(height|min-height|max-height|padding|font-size)\s*:/.test(rule.toString()))
        findings.push(`${file}: redefine dimensiones de AppButton fuera de su wrapper`);
      if (/(^|[\s>+~])\.app-card(?:$|[.#:[>+~\s])/.test(selector) && file !== appCardPath && /\b(border-radius|padding|box-shadow)\s*:/.test(rule.toString()))
        findings.push(`${file}: redefine la forma de AppCard fuera de su wrapper`);
    });
  }
  return findings;
}

export function checkStylesheet(source, file) {
  const findings = [];
  let ast;
  try {
    ast = postcss.parse(source);
  } catch {
    return [`${file}: CSS no válido`];
  }
  ast.walkRules((rule) => {
    if (/(^|[\s>+~])button\b|\.q-btn\b|\.btn(?:-[\w-]+)?\b/.test(rule.selector))
      findings.push(`${file}: estilo global de botón fuera de AppButton`);
    if (/(^|[\s>+~])\.app-button(?:$|[.#:[>+~\s])/.test(rule.selector) &&
      /\b(height|min-height|max-height|padding|font-size)\s*:/.test(rule.toString()))
      findings.push(`${file}: redefine dimensiones de AppButton fuera de su wrapper`);
    if (/(^|[\s>+~])\.app-card(?:$|[.#:[>+~\s])/.test(rule.selector) &&
      /\b(border-radius|padding|box-shadow)\s*:/.test(rule.toString()))
      findings.push(`${file}: redefine la forma de AppCard fuera de su wrapper`);
  });
  return findings;
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && (entry.name.endsWith('.vue') || entry.name.endsWith('.css')))
      files.push(full);
  }
  return files;
}

for (const fullPath of await walk(sourceRoot)) {
  const file = path.relative(root, fullPath).replaceAll(path.sep, '/');
  const source = await readFile(fullPath, 'utf8');
  if (file.endsWith('.vue'))
    violations.push(...checkTemplate(source, file), ...checkStyles(source, file));
  else violations.push(...checkStylesheet(source, file));
}
if (violations.length) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('UI guard: botones y cards usan sus wrappers; teclado excluido por contrato.');
}
