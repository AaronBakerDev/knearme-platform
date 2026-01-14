import { webcrypto } from 'node:crypto';

const globalCrypto = globalThis as typeof globalThis & { crypto?: Crypto };

if (!globalCrypto.crypto) {
  globalCrypto.crypto = webcrypto as Crypto;
}
