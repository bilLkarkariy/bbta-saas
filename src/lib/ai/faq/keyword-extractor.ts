import { getAIClient, MODELS } from "@/lib/ai";

/**
 * Extract keywords from FAQ question and answer using AI
 * These keywords are used for semantic matching
 */
export async function extractKeywords(
  question: string,
  answer: string
): Promise<string[]> {
  const ai = getAIClient();

  try {
    const response = await ai.chat.completions.create({
      model: MODELS.TIER_1,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en extraction de mots-clés pour le matching sémantique.

TÂCHE: Extrais les mots-clés pertinents à partir de la question et réponse FAQ.

INCLURE:
- Mots principaux de la question
- Synonymes courants en français
- Variantes orthographiques (avec/sans accents)
- Termes du domaine métier
- Expressions alternatives que les clients pourraient utiliser

EXCLURE:
- Mots vides (le, la, de, du, etc.)
- Mots trop génériques (chose, truc, etc.)

FORMAT: Retourne un JSON avec un tableau "keywords" contenant 10-15 mots-clés uniques.

EXEMPLE:
Q: Quels sont vos horaires d'ouverture ?
R: Nous sommes ouverts du lundi au vendredi de 9h à 18h.

{"keywords": ["horaires", "ouverture", "heure", "ouvrir", "fermer", "fermeture", "quand", "lundi", "vendredi", "semaine", "jours", "heures", "disponible", "accessible"]}`,
        },
        {
          role: "user",
          content: `Question: ${question}\nRéponse: ${answer}`,
        },
      ],
      temperature: 0,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return extractKeywordsLocal(question, answer);

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return extractKeywordsLocal(question, answer);

      const result = JSON.parse(jsonMatch[0]);
      const keywords = result.keywords;

      if (Array.isArray(keywords)) {
        return keywords
          .filter((k: unknown) => typeof k === "string" && k.length > 1)
          .map((k: string) => k.toLowerCase().trim())
          .slice(0, 20);
      }
    } catch {
      return extractKeywordsLocal(question, answer);
    }

    return extractKeywordsLocal(question, answer);
  } catch (error) {
    console.error("[Keyword Extractor] AI error, using local extraction:", error);
    return extractKeywordsLocal(question, answer);
  }
}

/**
 * Local keyword extraction fallback (no AI required)
 */
export function extractKeywordsLocal(question: string, answer: string): string[] {
  const text = `${question} ${answer}`.toLowerCase();

  // French stop words to exclude
  const stopWords = new Set([
    "le", "la", "les", "un", "une", "des", "du", "de", "à", "au", "aux",
    "et", "ou", "mais", "donc", "car", "ni", "que", "qui", "quoi",
    "ce", "ces", "cette", "cet", "mon", "ma", "mes", "ton", "ta", "tes",
    "son", "sa", "ses", "notre", "votre", "leur", "nous", "vous", "ils",
    "je", "tu", "il", "elle", "on", "elles", "en", "y", "ne", "pas",
    "plus", "moins", "très", "bien", "mal", "peu", "beaucoup", "trop",
    "pour", "par", "sur", "sous", "dans", "avec", "sans", "entre",
    "est", "sont", "être", "avoir", "fait", "faire", "peut", "pouvoir",
    "comment", "pourquoi", "quand", "combien", "quel", "quelle", "quels",
  ]);

  // Normalize and tokenize
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ")
    .trim();

  // Extract words
  const words = normalized.split(" ");

  // Filter and deduplicate
  const keywords = new Set<string>();

  for (const word of words) {
    if (word.length > 2 && !stopWords.has(word)) {
      keywords.add(word);
    }
  }

  return Array.from(keywords).slice(0, 15);
}

/**
 * Enrich a FAQ with auto-extracted keywords
 */
export async function enrichFAQ(faq: {
  question: string;
  answer: string;
  keywords?: string[];
}): Promise<{ question: string; answer: string; keywords: string[] }> {
  // If keywords already exist and are substantial, merge
  const existingKeywords = faq.keywords || [];
  const extractedKeywords = await extractKeywords(faq.question, faq.answer);

  // Merge and deduplicate
  const allKeywords = new Set([
    ...existingKeywords.map((k) => k.toLowerCase()),
    ...extractedKeywords,
  ]);

  return {
    question: faq.question,
    answer: faq.answer,
    keywords: Array.from(allKeywords).slice(0, 20),
  };
}

/**
 * Batch extract keywords for multiple FAQs
 */
export async function batchExtractKeywords(
  faqs: Array<{ question: string; answer: string }>
): Promise<string[][]> {
  // Process in parallel with concurrency limit
  const results: string[][] = [];
  const batchSize = 5;

  for (let i = 0; i < faqs.length; i += batchSize) {
    const batch = faqs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((faq) => extractKeywords(faq.question, faq.answer))
    );
    results.push(...batchResults);
  }

  return results;
}
