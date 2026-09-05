// High-Performance Client-Side City Vector Search Engine
// Combines Semantic Concept Embeddings, Character Trigram TF-IDF Vectors, and Cosine Similarity

import { LocationSuggestion } from '../data/locations';

export interface VectorMatchResult {
  location: LocationSuggestion;
  similarity: number; // 0 to 1
  matchPercentage: number; // 0 to 100%
  isDirectMatch: boolean;
  matchReason?: string;
  matchedTags?: string[];
}

// Semantic theme clusters for intuitive conceptual vector matching
export const SEMANTIC_THEME_VECTORS: Record<string, string[]> = {
  beach_coastal: [
    'beach', 'coastal', 'sea', 'ocean', 'coast', 'waterfront', 'marine', 'scuba', 'surfing', 'island',
    'goa', 'mumbai', 'chennai', 'kochi', 'puri', 'visakhapatnam', 'alibaug', 'daman', 'diu', 'port blair',
    'havelock', 'andaman', 'pondicherry', 'maldives', 'mauritius', 'seychelles', 'bali', 'phuket', 'miami',
    'sydney', 'barcelona', 'nice', 'dubai', 'kannur', 'mangalore', 'kovalam', 'varkala', 'gokarna'
  ],
  mountain_snow_hill: [
    'mountain', 'snow', 'hill', 'himalaya', 'cold', 'winter', 'skiing', 'trekking', 'valley', 'altitude',
    'manali', 'shimla', 'dharamshala', 'srinagar', 'gulmarg', 'leh', 'ladakh', 'ooty', 'kodaikanal',
    'munnar', 'darjeeling', 'gangtok', 'mussoorie', 'nainital', 'kullu', 'zurich', 'interlaken', 'geneva',
    'innsbruck', 'kasol', 'spiti', 'dalhousie', 'coorg', 'wayanad', 'shillong', 'tawang'
  ],
  spiritual_pilgrimage_temple: [
    'spiritual', 'pilgrimage', 'temple', 'holy', 'ganga', 'ghats', 'sacred', 'puja', 'devotional', 'divine',
    'varanasi', 'ayodhya', 'prayagraj', 'haridwar', 'rishikesh', 'tirupati', 'madurai', 'shirdi', 'ujjain',
    'somnath', 'amritsar', 'puri', 'dwarka', 'rameswaram', 'kedarnath', 'badrinath', 'pushkar', 'bodh gaya',
    'deoghar', 'mathura', 'vrindavan', 'katra', 'vaishno devi', 'guwahati', 'kamakhya', 'trimbakeshwar'
  ],
  heritage_palace_royal: [
    'heritage', 'palace', 'fort', 'royal', 'historical', 'monument', 'unesco', 'architecture', 'ancient',
    'jaipur', 'udaipur', 'jodhpur', 'agra', 'mysore', 'hampi', 'khajuraho', 'gwalior', 'bikaner', 'jaisalmer',
    'delhi', 'rome', 'paris', 'vienna', 'prague', 'athens', 'cairo', 'london', 'madrid', 'florence'
  ],
  tech_it_modern: [
    'tech', 'technology', 'it', 'software', 'startups', 'silicon', 'cyber', 'innovation', 'engineering',
    'bengaluru', 'bangalore', 'hyderabad', 'pune', 'gurgaon', 'noida', 'chennai', 'san francisco', 'tokyo',
    'seoul', 'singapore', 'seattle', 'austin', 'tel aviv'
  ],
  metropolis_skyline_luxury: [
    'metropolis', 'skyline', 'luxury', 'finance', 'shopping', 'nightlife', 'cosmopolitan', 'business', 'urban',
    'mumbai', 'new delhi', 'dubai', 'new york', 'london', 'singapore', 'tokyo', 'paris', 'hong kong',
    'frankfurt', 'chicago', 'toronto', 'los angeles', 'sydney', 'doha', 'abu dhabi'
  ],
  wildlife_nature_safari: [
    'wildlife', 'safari', 'nature', 'tiger', 'forest', 'national park', 'jungle', 'fauna', 'flora',
    'corbett', 'ranthambore', 'kaziranga', 'bandhavgarh', 'gir', 'kanha', 'tadoba', 'wayanad', 'periyar',
    'cape town', 'nairobi', 'maasai mara', 'kruger'
  ],
  desert_dunes_oasis: [
    'desert', 'dunes', 'sand', 'safari', 'camel', 'arid', 'oasis',
    'jaisalmer', 'bikaner', 'jodhpur', 'dubai', 'doha', 'abu dhabi', 'cairo', 'riyadh'
  ],
  tea_coffee_backwaters: [
    'tea', 'coffee', 'plantation', 'backwaters', 'houseboat', 'lagoon', 'rainforest', 'scenic',
    'munnar', 'alleppey', 'alappuzha', 'kumarakom', 'coorg', 'chikmagalur', 'wayanad', 'darjeeling', 'valparai'
  ]
};

// Generates character trigram frequency map
function generateTrigrams(text: string): Map<string, number> {
  const trigrams = new Map<string, number>();
  const normalized = `  ${text.toLowerCase().trim()}  `;
  for (let i = 0; i <= normalized.length - 3; i++) {
    const gram = normalized.substring(i, i + 3);
    trigrams.set(gram, (trigrams.get(gram) || 0) + 1);
  }
  return trigrams;
}

// Compute cosine similarity between two vector maps
function computeCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [, val] of vecA) {
    normA += val * val;
  }
  for (const [, val] of vecB) {
    normB += val * val;
  }

  if (normA === 0 || normB === 0) return 0;

  for (const [key, valA] of vecA) {
    const valB = vecB.get(key);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Cache for pre-computed city vectors to guarantee ultra-fast <1ms lookups
interface CityVectorProfile {
  locationId: string;
  trigramVec: Map<string, number>;
  semanticTags: string[];
  fullText: string;
}

const cityVectorCache = new Map<string, CityVectorProfile>();

export function buildCityVectorIndex(locations: LocationSuggestion[]): void {
  if (cityVectorCache.size === locations.length && cityVectorCache.size > 0) return;

  for (const loc of locations) {
    // Derive semantic tags
    const tags: string[] = [];
    const fullText = `${loc.code} ${loc.city} ${loc.state || ''} ${loc.country} ${loc.terminal} ${loc.region || ''}`.toLowerCase();

    for (const [theme, keywords] of Object.entries(SEMANTIC_THEME_VECTORS)) {
      if (keywords.some((kw) => fullText.includes(kw))) {
        tags.push(theme.replace(/_/g, ' '));
      }
    }

    const trigramVec = generateTrigrams(fullText);
    cityVectorCache.set(loc.id, {
      locationId: loc.id,
      trigramVec,
      semanticTags: tags,
      fullText,
    });
  }
}

/**
 * Executes vector search across all locations.
 * Separates matches into:
 * 1. directMatches (Matched in Search)
 * 2. otherSuggestions (The remaining cities for explore / discovery)
 */
export function executeVectorCitySearch(
  query: string,
  locations: LocationSuggestion[],
  similarityThreshold: number = 0.22
): {
  matchedResults: VectorMatchResult[];
  otherSuggestions: LocationSuggestion[];
} {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return {
      matchedResults: [],
      otherSuggestions: locations,
    };
  }

  // Ensure index is built
  buildCityVectorIndex(locations);

  const queryTrigrams = generateTrigrams(trimmed);
  const matchedList: VectorMatchResult[] = [];
  const otherList: LocationSuggestion[] = [];

  // Check if query matches any semantic themes directly (e.g. "beaches", "snow", "temple", "safari")
  // Only match semantic themes if query is at least 3 characters and specifically targets the theme
  const activeThemes: string[] = [];
  if (trimmed.length >= 3) {
    for (const [theme, keywords] of Object.entries(SEMANTIC_THEME_VECTORS)) {
      if (
        keywords.some(
          (kw) =>
            kw === trimmed ||
            (trimmed.length >= 4 && (kw.startsWith(trimmed) || trimmed.includes(kw)))
        )
      ) {
        activeThemes.push(theme);
      }
    }
  }

  for (const loc of locations) {
    const profile = cityVectorCache.get(loc.id);
    if (!profile) {
      otherList.push(loc);
      continue;
    }

    const { trigramVec, semanticTags, fullText } = profile;

    // 1. Precise Text & Code Matching
    const codeExact = loc.code.toLowerCase() === trimmed;
    const codePrefix = loc.code.toLowerCase().startsWith(trimmed);
    const cityExact = loc.city.toLowerCase() === trimmed;
    const cityPrefix = loc.city.toLowerCase().startsWith(trimmed);
    
    // Word boundary matching (e.g. "Delhi" in "New Delhi", "Kashi" in "Varanasi (Kashi)")
    const cityWords = loc.city.toLowerCase().split(/[\s\-()&,/]+/);
    const wordPrefix = cityWords.some((w) => w.length > 0 && w.startsWith(trimmed));
    
    // Substring matching (only for queries with at least 3 characters)
    const cityIncludes = trimmed.length >= 3 && loc.city.toLowerCase().includes(trimmed);
    const stateMatch = trimmed.length >= 3 && !!loc.state?.toLowerCase().includes(trimmed);
    const terminalMatch = trimmed.length >= 3 && loc.terminal.toLowerCase().includes(trimmed);

    // 2. Vector Cosine Similarity
    const cosineSim = computeCosineSimilarity(queryTrigrams, trigramVec);

    // 3. Semantic Theme Matching
    let themeBonus = 0;
    let matchedThemeName: string | undefined;
    if (activeThemes.length > 0) {
      for (const t of activeThemes) {
        const themeKeywords = SEMANTIC_THEME_VECTORS[t];
        if (themeKeywords.some((kw) => fullText.includes(kw))) {
          themeBonus = 0.45;
          matchedThemeName = t.replace(/_/g, ' ');
          break;
        }
      }
    }

    // High-precision weighted score
    let score = 0;
    let matchReason = 'Vector Match';
    let isDirectMatch = false;

    if (cityExact) {
      score = 1.0;
      matchReason = 'Exact City Match';
      isDirectMatch = true;
    } else if (codeExact) {
      score = 0.98;
      matchReason = 'Exact Code Match';
      isDirectMatch = true;
    } else if (cityPrefix) {
      score = 0.92;
      matchReason = 'Direct City Match';
      isDirectMatch = true;
    } else if (codePrefix) {
      score = 0.88;
      matchReason = 'Direct Code Match';
      isDirectMatch = true;
    } else if (wordPrefix) {
      score = 0.82;
      matchReason = 'Direct City Match';
      isDirectMatch = true;
    } else if (cityIncludes) {
      score = 0.72;
      matchReason = 'City Name Match';
      isDirectMatch = true;
    } else if (stateMatch) {
      score = 0.60;
      matchReason = `State Match: ${loc.state}`;
      isDirectMatch = true;
    } else if (terminalMatch) {
      score = 0.55;
      matchReason = 'Airport / Station Match';
      isDirectMatch = true;
    } else if (themeBonus > 0) {
      score = 0.50 + cosineSim * 0.35;
      matchReason = `Theme: ${matchedThemeName}`;
    } else if (trimmed.length >= 3 && cosineSim >= 0.42) {
      score = cosineSim * 0.75;
      matchReason = `${Math.round(cosineSim * 100)}% Vector Similarity`;
    }

    const finalSim = Math.min(score, 1);
    const matchPercentage = Math.round(finalSim * 100);

    const isMatched = score > 0;

    if (isMatched) {
      matchedList.push({
        location: loc,
        similarity: finalSim,
        matchPercentage,
        isDirectMatch,
        matchReason,
        matchedTags: semanticTags,
      });
    } else {
      otherList.push(loc);
    }
  }

  // Sort matched list strictly: exact matches top, followed by prefix matches, then highest score
  matchedList.sort((a, b) => {
    if (a.similarity !== b.similarity) {
      return b.similarity - a.similarity;
    }
    // Tie-breaker: prefer shorter city names or higher popularity
    if (a.location.popular && !b.location.popular) return -1;
    if (!a.location.popular && b.location.popular) return 1;
    return a.location.city.length - b.location.city.length;
  });

  return {
    matchedResults: matchedList,
    otherSuggestions: otherList,
  };
}
