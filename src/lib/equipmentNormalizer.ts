// Equipment ID normalization utility for chassis & container numbers.

export type EquipmentType = 'container' | 'chassis' | 'unknown';

export interface NormalizationResult {
  raw: string;
  cleaned: string;
  equipmentType: EquipmentType;
  normalized: string | null;
  matchKey: string | null;
  looseKey: string | null;
  digitsKey: string | null;
  confidence: number;
  warnings: string[];
  components: Record<string, string | null>;
}

export interface CompareResult {
  left: NormalizationResult;
  right: NormalizationResult;
  score: number;
  reason: string;
  isMatch: boolean;
}

const KNOWN_CHASSIS_PREFIXES = new Set([
  'APMZ', 'DCLI', 'TRAC', 'UCLI', 'CCLU', 'FVCZ', 'MGSU', 'NACS',
  'OESZ', 'GACP', 'DCLZ', 'DCYZ', 'TRTN', 'TTIU', 'SCGD', 'UASC',
]);

const PREFIX_ALIASES: Record<string, string> = {
  APM: 'APMZ',
  TRAC: 'TRAC',
  DCLI: 'DCLI',
};

const NOISE_WORDS = [
  'CHASSIS', 'CHAS', 'CONTAINER', 'CONT', 'CNTR', 'EQUIPMENT', 'EQ', 'NUMBER', 'NO',
];

const SEPARATORS_RE = /[#:./\\,_-]/g;
const CONTAINER_FULL_RE = /^[A-Z]{4}\d{6,7}$/;
const CONTAINER_SHORT_RE = /^[A-Z]{3}\d{6,7}$/;
const CHASSIS_GENERIC_RE = /^[A-Z]{2,5}\d{4,8}$/;

function clean(raw: string): string {
  let s = (raw || '').toUpperCase().trim();
  for (const word of NOISE_WORDS) {
    s = s.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
  }
  s = s.replace(SEPARATORS_RE, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function ocrFixDigits(s: string): string {
  // Apply only to digit zone after a leading letter prefix.
  const m = s.match(/^([A-Z]+)(.*)$/);
  if (!m) return s;
  const prefix = m[1];
  const rest = m[2]
    .replace(/O/g, '0')
    .replace(/I/g, '1')
    .replace(/L/g, '1')
    .replace(/S/g, '5')
    .replace(/B/g, '8');
  return prefix + rest;
}

function emptyResult(raw: string, cleaned: string, warnings: string[] = []): NormalizationResult {
  return {
    raw,
    cleaned,
    equipmentType: 'unknown',
    normalized: null,
    matchKey: null,
    looseKey: null,
    digitsKey: null,
    confidence: 0,
    warnings,
    components: { prefix: null, serial: null },
  };
}

export function normalizeEquipmentId(raw: string): NormalizationResult {
  if (!raw) return emptyResult(raw || '', '');

  const cleaned = clean(raw);
  const compact = cleaned.replace(/\s+/g, '');
  const fixed = ocrFixDigits(compact);
  const warnings: string[] = [];

  // Try container 4+7
  if (CONTAINER_FULL_RE.test(fixed)) {
    const prefix = fixed.slice(0, 4);
    const serial = fixed.slice(4);
    const normalized = prefix + serial;
    return {
      raw,
      cleaned,
      equipmentType: 'container',
      normalized,
      matchKey: normalized,
      looseKey: prefix + serial.slice(0, 6),
      digitsKey: serial,
      confidence: serial.length === 7 ? 0.95 : 0.85,
      warnings: serial.length === 6 ? ['check digit missing'] : [],
      components: { prefix, serial },
    };
  }

  if (CONTAINER_SHORT_RE.test(fixed)) {
    const prefix = fixed.slice(0, 3);
    const serial = fixed.slice(3);
    const normalized = prefix + serial;
    return {
      raw,
      cleaned,
      equipmentType: 'container',
      normalized,
      matchKey: normalized,
      looseKey: prefix + serial.slice(0, 6),
      digitsKey: serial,
      confidence: 0.55,
      warnings: ['short prefix'],
      components: { prefix, serial },
    };
  }

  // Chassis
  const chassisMatch = fixed.match(/^([A-Z]{2,5})(\d{4,8})$/);
  if (chassisMatch) {
    let prefix = chassisMatch[1];
    const serial = chassisMatch[2];
    if (PREFIX_ALIASES[prefix]) prefix = PREFIX_ALIASES[prefix];
    const known = KNOWN_CHASSIS_PREFIXES.has(prefix);
    if (!known) warnings.push('unknown chassis prefix');
    const normalized = prefix + serial;
    return {
      raw,
      cleaned,
      equipmentType: 'chassis',
      normalized,
      matchKey: normalized,
      looseKey: normalized,
      digitsKey: serial,
      confidence: known ? 0.9 : 0.75,
      warnings,
      components: { prefix, serial },
    };
  }

  // Digits only -> low-confidence chassis
  if (/^\d{4,8}$/.test(fixed)) {
    return {
      raw,
      cleaned,
      equipmentType: 'chassis',
      normalized: fixed,
      matchKey: fixed,
      looseKey: fixed,
      digitsKey: fixed,
      confidence: 0.4,
      warnings: ['missing prefix'],
      components: { prefix: null, serial: fixed },
    };
  }

  return emptyResult(raw, cleaned, ['unrecognized format']);
}

export function compareEquipmentIds(a: string, b: string): CompareResult {
  const left = normalizeEquipmentId(a);
  const right = normalizeEquipmentId(b);

  let score = 0;
  let reason = 'no_match';

  if (left.equipmentType !== 'unknown' && left.equipmentType === right.equipmentType) {
    if (left.matchKey && left.matchKey === right.matchKey) {
      score = 100;
      reason = 'exact_normalized_match';
    } else if (left.looseKey && left.looseKey === right.looseKey) {
      score = 95;
      reason = 'loose_key_match';
    } else if (left.digitsKey && left.digitsKey === right.digitsKey) {
      score = 60;
      reason = 'digits_only_match';
    }
  } else if (left.digitsKey && left.digitsKey === right.digitsKey) {
    score = 40;
    reason = 'digits_match_but_type_unclear';
  }

  return { left, right, score, reason, isMatch: score >= 95 };
}
