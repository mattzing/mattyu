#!/usr/bin/env node
// Wrap a finished HTML page in a client-side password gate (AES-256-GCM + PBKDF2).
// The page's real content is encrypted at build time; visitors must enter the
// password to decrypt and view it in the browser. Nothing readable is served
// without the password — but read references/password-protection.md for what
// this does and does NOT protect.
//
// Usage:
//   MAKE_SITE_PASSWORD='a-long-random-password' \
//     node protect-page.mjs <input.html> <output.html> [--title "Protected"]
//
// Pass the password via the env var, never as an argument (args leak into shell
// history and process listings). Deploy ONLY the output file — never leave the
// unprotected input in the published folder, or it's reachable directly.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { encryptHtml } from './lib-crypto.mjs';

const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [input, output] = positional;
const titleIdx = process.argv.indexOf('--title');
const title = titleIdx > -1 ? process.argv[titleIdx + 1] : 'Protected';
const password = process.env.MAKE_SITE_PASSWORD;

function die(msg) { console.error(msg); process.exit(1); }
if (!input || !output) die('usage: MAKE_SITE_PASSWORD=... node protect-page.mjs <in.html> <out.html> [--title "Protected"]');
if (!password) die('Set MAKE_SITE_PASSWORD (the page password) in the environment.');
if (password.length < 8) die('Refusing: password must be at least 8 characters. A long, random passphrase is much safer.');

const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(here, '..', 'assets', 'locked-template.html'), 'utf8');
const html = readFileSync(input, 'utf8');

const { saltB64, ivB64, ctB64, iterations } = await encryptHtml(html, password);
const out = template
  .replaceAll('__TITLE__', String(title).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])))
  .replaceAll('__SALT__', saltB64)
  .replaceAll('__IV__', ivB64)
  .replaceAll('__CT__', ctB64)
  .replaceAll('__ITER__', String(iterations));
writeFileSync(output, out);

const ctBytes = Math.round((ctB64.length * 3) / 4);
console.error(`Protected ${input} -> ${output}  (ciphertext ~${ctBytes} bytes, ${password.length}-char password).`);
console.error('Deploy ONLY the output. Do not publish the unprotected source alongside it.');
