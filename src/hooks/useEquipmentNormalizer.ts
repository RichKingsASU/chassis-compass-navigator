import { useMemo } from 'react';
import { normalizeEquipmentId, NormalizationResult } from '@/lib/equipmentNormalizer';

export interface NormalizedSearchResult {
  result: NormalizationResult;
  normalized: string | null;
  matchKey: string | null;
  looseKey: string | null;
  confidence: number;
  warnings: string[];
  hasLowConfidence: boolean;
}

export function useNormalizedSearch(rawInput: string): NormalizedSearchResult {
  return useMemo(() => {
    const result = normalizeEquipmentId(rawInput || '');
    return {
      result,
      normalized: result.normalized,
      matchKey: result.matchKey,
      looseKey: result.looseKey,
      confidence: result.confidence,
      warnings: result.warnings,
      hasLowConfidence: !!rawInput && result.confidence > 0 && result.confidence < 0.7,
    };
  }, [rawInput]);
}
