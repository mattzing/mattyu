// Shared AES-GCM + PBKDF2 encryption for password-protecting a static page.
// Uses the SAME WebCrypto primitives the browser uses, so this build-time
// encryptor and the in-browser decryptor in assets/locked-template.html
// interoperate exactly. Keep the parameters here and in that template in sync.
//
// Security note: this is client-side encryption — the ciphertext is shipped to
// every visitor. It keeps casual visitors and crawlers out, but is only as
// strong as the password (offline brute-forceable). See
// references/password-protection.md before relying on it.

export const ITERATIONS = 220000; // PBKDF2-SHA256 rounds; must match the template
const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (bytes) => Buffer.from(bytes).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));

async function deriveKey(password, salt, usages) {
  const baseKey = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usages,
  );
}

export async function encryptHtml(html, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ['encrypt']);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(html)));
  return { saltB64: b64(salt), ivB64: b64(iv), ctB64: b64(ct), iterations: ITERATIONS };
}

export async function decryptHtml({ saltB64, ivB64, ctB64 }, password) {
  const key = await deriveKey(password, unb64(saltB64), ['decrypt']);
  const buf = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(ivB64) }, key, unb64(ctB64));
  return dec.decode(buf); // throws if the password is wrong (GCM auth tag fails)
}
