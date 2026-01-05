import type { TradeConfig } from '@/lib/trades/config';

const GENERIC_ACTION_TERMS = new Set([
  'installation',
  'replacement',
  'repair',
  'restoration',
  'rebuild',
  'cleaning',
  'washing',
  'sealing',
  'matching',
]);

export function buildTechniqueTerms(config: TradeConfig): Set<string> {
  const terms = new Set<string>(GENERIC_ACTION_TERMS);

  for (const technique of config.terminology.techniques) {
    const lower = technique.toLowerCase();
    terms.add(lower);
    for (const word of lower.split(/\s+/)) {
      if (word.length > 3) {
        terms.add(word);
      }
    }
  }

  return terms;
}

function isGenericOf(generic: string, specific: string): boolean {
  const g = generic.toLowerCase().trim();
  const s = specific.toLowerCase().trim();

  if (g === s) return false;

  const wordBoundaryPattern = new RegExp(`\\b${escapeRegex(g)}\\b`, 'i');
  return wordBoundaryPattern.test(s) && s.length > g.length;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deduplicateTerms(terms: string[]): string[] {
  if (terms.length <= 1) return terms;

  const result: string[] = [];

  for (const term of terms) {
    const isGenericOfAnother = terms.some(
      (other) => other !== term && isGenericOf(term, other)
    );

    if (!isGenericOfAnother) {
      result.push(term);
    }
  }

  return result;
}

export function separateMaterialsAndTechniques(
  materials: string[],
  techniques: string[],
  techniqueTerms: Set<string>
): { materials: string[]; techniques: string[] } {
  const cleanMaterials: string[] = [];
  const cleanTechniques = [...techniques];

  for (const material of materials) {
    const lowerMaterial = material.toLowerCase();

    const isTechniqueTerm = techniqueTerms.has(lowerMaterial) ||
      Array.from(techniqueTerms).some((t) => lowerMaterial.includes(t));

    if (isTechniqueTerm) {
      const alreadyInTechniques = cleanTechniques.some(
        (t) => t.toLowerCase() === lowerMaterial
      );
      if (!alreadyInTechniques) {
        cleanTechniques.push(material);
      }
    } else {
      cleanMaterials.push(material);
    }
  }

  return {
    materials: deduplicateTerms(cleanMaterials),
    techniques: deduplicateTerms(cleanTechniques),
  };
}
