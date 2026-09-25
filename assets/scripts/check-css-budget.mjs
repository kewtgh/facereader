import fs from 'node:fs';
import zlib from 'node:zlib';

const cssPath = '_site/assets/css/main.css';
const maxGzipBytes = 36 * 1024;
const css = fs.readFileSync(cssPath);
const gzipBytes = zlib.gzipSync(css).length;
const brotliBytes = zlib.brotliCompressSync(css).length;

console.log(`CSS bundle: ${css.length} raw / ${gzipBytes} gzip / ${brotliBytes} brotli bytes.`);
if (gzipBytes > maxGzipBytes) {
  console.error(`CSS gzip budget exceeded: ${gzipBytes} > ${maxGzipBytes} bytes.`);
  process.exitCode = 1;
}
