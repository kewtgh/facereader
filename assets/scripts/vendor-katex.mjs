import fs from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('node_modules/katex');
const destination = path.resolve('assets/math/katex');
const pkg = JSON.parse(await fs.readFile(path.join(source, 'package.json'), 'utf8'));
await fs.mkdir(destination, { recursive: true });
for (const file of ['katex.min.js', 'katex.min.css', 'contrib/auto-render.min.js']) {
  await fs.copyFile(path.join(source, 'dist', file), path.join(destination, path.basename(file)));
}
await fs.cp(path.join(source, 'dist/fonts'), path.join(destination, 'fonts'), { recursive: true });
await fs.copyFile(path.join(source, 'LICENSE'), path.join(destination, 'LICENSE.txt'));
await fs.writeFile(path.join(destination, 'version.txt'), `${pkg.version}\n`);
console.log(`Copied KaTeX ${pkg.version} scripts, CSS, fonts and license.`);
