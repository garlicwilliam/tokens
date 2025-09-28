import { randomBytes } from 'crypto';

export function isValidAddress(address: string | undefined | null): boolean {
  if (!address) {
    return false;
  }
  const reg = /^0x([0-9a-fA-F]{40})$/;
  return reg.test(address!.trim());
}

export function genRandomString(length: number): string {
  const p: string = randomBytes(length).toString('hex');
  return p.slice(0, length).toUpperCase();
}

export function isSameAddress(address1: string, address2: string): boolean {
  return isValidAddress(address1) && address1.toLowerCase() === address2.toLowerCase();
}

export function isAddressIn(address: string, list: string[]): boolean {
  return list.some(one => isSameAddress(one, address))
}

export function genUserId(): string {
  return genRandomString(8);
}

export function genUserCode(): string {
  return genRandomString(5);
}

export function genUserSessionId(): string {
  return genRandomString(32);
}

export function genTwitterId(): string {
  return genRandomString(18);
}
