import { getAIClient, MODELS } from "@/lib/ai";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface FAQMatchResult {
  faq: {
    id: string;
    question: string;
    answer: string;
  };
  similarity: number;
  matchType: "exact" | "keyword" | "semantic";
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate keyword overlap score between query and FAQ keywords
 */
function calculateKeywordOverlap(query: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;

  const normalizedQuery = normalizeText(query);
  const queryWords = new Set(normalizedQuery.split(" ").filter((w) => w.length > 2));

  let matches = 0;
  let partialMatches = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);

    // Exact word match
    if (queryWords.has(normalizedKeyword)) {
      matches++;
      continue;
    }

    // Partial match (keyword contained in query)
    if (normalizedQuery.includes(normalizedKeyword)) {
      partialMatches += 0.5;
      continue;
    }

    // Check if any query word contains the keyword or vice versa
    for (const queryWord of queryWords) {
      if (queryWord.includes(normalizedKeyword) || normalizedKeyword.includes(queryWord)) {
        partialMatches += 0.3;
        break;
      }
    }
  }

  const totalScore = matches + partialMatches;
  return Math.min(1, totalScore / Math.max(3, keywords.length * 0.3));
}

/**
 * Check for exact or near-exact question match
 */
function checkExactMatch(query: string, faqQuestion: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedQuestion = normalizeText(faqQuestion);

  // Exact match
  if (normalizedQuery === normalizedQuestion) {
    return 1.0;
  }

  // Query is contained in question or vice versa
  if (normalizedQuestion.includes(normalizedQuery)) {
    return 0.95;
  }
  if (normalizedQuery.includes(normalizedQuestion)) {
    return 0.9;
  }

  // Levenshtein-like similarity for short queries
  if (normalizedQuery.length < 50 && normalizedQuestion.length < 50) {
    const queryWords = new Set(normalizedQuery.split(" "));
    const questionWords = new Set(normalizedQuestion.split(" "));

    const intersection = [...queryWords].filter((w) => questionWords.has(w)).length;
    const union = new Set([...queryWords, ...questionWords]).size;

    const jaccard = intersection / union;
    if (jaccard > 0.7) {
      return jaccard;
    }
  }

  return 0;
}

/**
 * Match a query against FAQs using multiple strategies
 *
 * Strategy order (fastest to slowest):
 * 1. Exact match - O(n) string comparison
 * 2. Keyword overlap - O(n*k) where k = keywords
 * 3. Semantic similarity (AI) - Only if no good match found
 */
export async function matchFAQ(
  query: string,
  faqs: FAQItem[],
  threshold: number = 0.6
): Promise<FAQMatchResult | null> {
  if (faqs.length === 0) return null;

  // 1. Try exact match first (fastest)
  for (const faq of faqs) {
    const exactScore = checkExactMatch(query, faq.question);
    if (exactScore >= 0.9) {
      return {
        faq: { id: faq.id, question: faq.question, answer: faq.answer },
        similarity: exactScore,
        matchType: "exact",
      };
    }
  }

  // 2. Keyword overlap matching (medium)
  const keywordScores = faqs.map((faq) => ({
    faq,
    similarity: calculateKeywordOverlap(query, faq.keywords),
    matchType: "keyword" as const,
  }));

  const bestKeyword = keywordScores.sort((a, b) => b.similarity - a.similarity)[0];
  if (bestKeyword && bestKeyword.similarity >= threshold) {
    return {
      faq: {
        id: bestKeyword.faq.id,
        question: bestKeyword.faq.question,
        answer: bestKeyword.faq.answer,
      },
      similarity: bestKeyword.similarity,
      matchType: "keyword",
    };
  }

  // 3. Semantic similarity via AI (slowest, last resort)
  // Only use for smaller FAQ sets to control costs
  if (faqs.length <= 20 && bestKeyword && bestKeyword.similarity > 0.3) {
    const semanticResult = await semanticMatch(query, faqs, threshold);
    if (semanticResult) {
      return semanticResult;
    }
  }

  // Return best keyword match if above a lower threshold
  if (bestKeyword && bestKeyword.similarity >= threshold * 0.7) {
    return {
      faq: {
        id: bestKeyword.faq.id,
        question: bestKeyword.faq.question,
        answer: bestKeyword.faq.answer,
      },
      similarity: bestKeyword.similarity,
      matchType: "keyword",
    };
  }

  return null;
}

/**
 * Semantic matching using AI
 */
async function semanticMatch(
  query: string,
  faqs: FAQItem[],
  threshold: number
): Promise<FAQMatchResult | null> {
  const ai = getAIClient();

  const faqList = faqs
    .map((f, i) => `${i + 1}. ${f.question}`)
    .join("\n");

  try {
    const response = await ai.chat.completions.create({
      model: MODELS.TIER_1,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en matching sémantique.

TÂCHE: Compare la question du client avec les FAQs disponibles.

RÈGLES:
- Ne match que si la question est vraiment similaire en sens
- La similarité doit être basée sur l'intention, pas juste les mots
- Sois strict: 0.9+ = quasi identique, 0.7-0.9 = très similaire, 0.5-0.7 = similaire, <0.5 = pas de match

Retourne un JSON:
{
  "matched_index": number | null,  // 1-based index ou null si pas de match
  "similarity": number,            // 0-1
  "reasoning": "courte explication"
}`,
        },
        {
          role: "user",
          content: `Question client: "${query}"

FAQs disponibles:
${faqList}`,
        },
      ],
      temperature: 0,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);

    if (
      result.matched_index &&
      typeof result.similarity === "number" &&
      result.similarity >= threshold
    ) {
      const matchedFaq = faqs[result.matched_index - 1];
      if (matchedFaq) {
        return {
          faq: {
            id: matchedFaq.id,
            question: matchedFaq.question,
            answer: matchedFaq.answer,
          },
          similarity: result.similarity,
          matchType: "semantic",
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[FAQ Matcher] Semantic match error:", error);
    return null;
  }
}

/**
 * Find multiple FAQ matches (for suggestions)
 */
export async function findTopMatches(
  query: string,
  faqs: FAQItem[],
  limit: number = 3
): Promise<FAQMatchResult[]> {
  const results: FAQMatchResult[] = [];

  for (const faq of faqs) {
    const exactScore = checkExactMatch(query, faq.question);
    const keywordScore = calculateKeywordOverlap(query, faq.keywords);
    const bestScore = Math.max(exactScore, keywordScore);

    if (bestScore > 0.3) {
      results.push({
        faq: { id: faq.id, question: faq.question, answer: faq.answer },
        similarity: bestScore,
        matchType: exactScore > keywordScore ? "exact" : "keyword",
      });
    }
  }

  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
