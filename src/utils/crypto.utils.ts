import nacl from 'tweetnacl';
import { randomBytes } from 'node:crypto';
import { SignedLicense, LicensePayload, Env } from '../types';

export function b64ToU8(b64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(String(b64 ?? '').trim(), 'base64'));
}

export function u8ToB64(u8: Uint8Array): string {
  return Buffer.from(u8).toString('base64');
}

export function signLicense(
  payload: LicensePayload,
  env: Pick<Env, 'LICENSE_PRIVATE_KEY_B64'>
): SignedLicense {
  const priv = String(env.LICENSE_PRIVATE_KEY_B64 || '').trim();
  if (!priv) throw new Error('Missing LICENSE_PRIVATE_KEY_B64');

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const sig = nacl.sign.detached(payloadBytes, b64ToU8(priv));

  return {
    payloadB64: u8ToB64(payloadBytes),
    sigB64: u8ToB64(sig),
  };
}

export function verifySigned(
  signed: SignedLicense,
  env: Pick<Env, 'LICENSE_PUBLIC_KEY_B64'>
): LicensePayload {
  const pub = String(env.LICENSE_PUBLIC_KEY_B64 || '').trim();
  if (!pub) throw new Error('Missing LICENSE_PUBLIC_KEY_B64');

  const msg = b64ToU8(signed.payloadB64);
  const sig = b64ToU8(signed.sigB64);
  const ok = nacl.sign.detached.verify(msg, sig, b64ToU8(pub));

  if (!ok) throw new Error('Invalid signature');

  const payloadJson = new TextDecoder().decode(msg);
  const payload = JSON.parse(payloadJson) as LicensePayload;
  if (!payload?.licenseId) throw new Error('Invalid payload');

  return payload;
}

export function randomKey(len = 24): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function formatActivationKey(raw: string): string {
  // XXXX-XXXX-XXXX-XXXX
  return raw.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}
