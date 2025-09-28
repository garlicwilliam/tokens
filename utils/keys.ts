import crypto from 'crypto';

export function genPublicKey(keyString: string): string {
  return '-----BEGIN PUBLIC KEY-----\n' + keyString + '\n-----END PUBLIC KEY-----';
}

export function genPrivateKey(keyString: string): string {
  return '-----BEGIN PRIVATE KEY-----\n' + keyString + '\n-----END PRIVATE KEY-----';
}

export function verifyRsaSignature(data: string, signature: string, publicKey: string): boolean {
  const verifier: crypto.Verify = crypto.createVerify('SHA256');
  verifier.update(data);
  const publicKeyPem: string = genPublicKey(publicKey);
  return verifier.verify(publicKeyPem, signature, 'base64');
}
