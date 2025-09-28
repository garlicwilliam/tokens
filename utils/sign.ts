import { verifyMessage } from 'ethers';
import { isSameAddress } from './address';
import { SIGN_MSG_PREFIX } from '../const/res-msg';

export function verifySignature(message: string, signature: string, address: string): boolean {
  const recoveredAddress: string = verifyMessage(message, signature);

  return isSameAddress(recoveredAddress, address);
}

export function genMessage(challenge: string): string {
  return SIGN_MSG_PREFIX + challenge;
}
