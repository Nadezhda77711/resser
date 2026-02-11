import { z } from 'zod';
import { isBtcLike, isEvmAddress, isLtcAddress, isTrxAddress, normalizeUid } from './normalization';

export const entitySchema = z.object({
  entity_uid: z.string().min(1).transform(normalizeUid),
  entity_name: z.string().min(1),
  entity_type_code: z.string().min(1),
  parent_entity_uid: z.string().nullable().optional(),
  entity_description: z.string().nullable().optional(),
  entity_country: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  flags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

export const affiliationSchema = z.object({
  folder_id: z.number().int(),
  network_code: z.string().min(1),
  address: z.string().min(1),
  entity_uid: z.string().nullable().optional(),
  address_role_code: z.string().nullable().optional(),
  source: z.string().min(1),
  analyst: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  ext_name: z.string().nullable().optional(),
  ext_category: z.string().nullable().optional(),
  ext_wallet_name: z.string().nullable().optional(),
  ext_label: z.string().nullable().optional(),
  is_hidden: z.boolean().optional(),
});

export const incidentSchema = z.object({
  file_id: z.number().int(),
  network_code: z.string().min(1),
  address: z.string().min(1),
  entity_uid: z.string().nullable().optional(),
  incident_type_code: z.string().min(1),
  incident_date: z.string().min(1),
  source: z.string().min(1),
  wallet_role: z.string().nullable().optional(),
  analyst: z.string().nullable().optional(),
  tx_hashes: z.string().nullable().optional(),
});

export function validateAddressByNetwork(network: string, address: string): string | null {
  const n = network.toUpperCase();
  if (n === 'EVM') return isEvmAddress(address) ? null : 'EVM address must start with 0x and be 42 chars.';
  if (n === 'BTC') return isBtcLike(address) ? null : 'BTC address format looks invalid.';
  if (n === 'LTC') return isLtcAddress(address) ? null : 'LTC address format looks invalid.';
  if (n === 'TRX' || n === 'TRON') return isTrxAddress(address) ? null : 'TRX address format looks invalid.';
  return null;
}
