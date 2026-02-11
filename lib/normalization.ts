export function normalizeCode(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '_');
}

export function normalizeUid(input: string): string {
  return input.trim();
}

export function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isBtcLike(address: string): boolean {
  // Basic BTC/LTC validation (not cryptographic)
  return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
}

export function isLtcAddress(address: string): boolean {
  return /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
}

export function isTrxAddress(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}
