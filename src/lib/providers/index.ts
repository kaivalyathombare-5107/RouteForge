// src/lib/providers/index.ts
export * from './types';
export * from './base';
export * from './registry';

import { ProviderAdapter } from './base';
import { ProviderId } from './types';
import { irctcAdapter } from './irctc';
import { ixigoAdapter } from './ixigo';
import { redbusAdapter } from './redbus';
import { uberAdapter } from './uber';
import { olaAdapter } from './ola';
import { rapidoAdapter } from './rapido';
import { makemytripAdapter } from './makemytrip';
import { goibiboAdapter } from './goibibo';

export {
  irctcAdapter,
  ixigoAdapter,
  redbusAdapter,
  uberAdapter,
  olaAdapter,
  rapidoAdapter,
  makemytripAdapter,
  goibiboAdapter,
};

export const providerAdaptersMap: Record<string, ProviderAdapter> = {
  irctc: irctcAdapter,
  ixigo: ixigoAdapter,
  redbus: redbusAdapter,
  uber: uberAdapter,
  ola: olaAdapter,
  rapido: rapidoAdapter,
  makemytrip: makemytripAdapter,
  goibibo: goibiboAdapter,
};

export function getProviderAdapter(id: ProviderId): ProviderAdapter | undefined {
  return providerAdaptersMap[id.toLowerCase()];
}

export function getAllProviderAdapters(): ProviderAdapter[] {
  return Object.values(providerAdaptersMap);
}
