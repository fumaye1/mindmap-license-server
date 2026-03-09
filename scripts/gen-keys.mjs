import nacl from 'tweetnacl';

const kp = nacl.sign.keyPair();

const b64 = (u8) => Buffer.from(u8).toString('base64');

console.log('LICENSE_PUBLIC_KEY_B64=' + b64(kp.publicKey));
console.log('LICENSE_PRIVATE_KEY_B64=' + b64(kp.secretKey));
console.log('\nNotes:');
console.log('- publicKey is 32 bytes, secretKey is 64 bytes (tweetnacl format).');
console.log('- Keep private key on server only. Put public key into the Obsidian plugin settings.');
