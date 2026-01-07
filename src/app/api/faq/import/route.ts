import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractKeywords } from "@/lib/ai/faq/keyword-extractor";
import { z } from "zod";

const FAQItemSchema = z.object({
  question: z.string().min(5, "La question doit faire au moins 5 caractères"),
  answer: z.string().min(10, "La réponse doit faire au moins 10 caractères"),
  category: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

const ImportSchema = z.object({
  faqs: z.array(FAQItemSchema).min(1, "Au moins une FAQ est requise"),
  extractKeywords: z.boolean().default(true),
});

export interface ImportResult {
  imported: number;
  failed: number;
  skipped: number;
  errors: string[];
  details: {
    question: string;
    status: "imported" | "failed" | "skipped";
    error?: string;
  }[];
}

export async function POST(req: NextRequest): Promise<NextResponse<ImportResult | { error: string }>> {
  try {
    const { tenantId } = await getCurrentTenant();
    const body = await req.json();

    // Validate input
    const validation = ImportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { faqs, extractKeywords: shouldExtractKeywords } = validation.data;

    const results: ImportResult = {
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      details: [],
    };

    // Check for existing FAQs to avoid duplicates
    const existingFaqs = await db.fAQ.findMany({
      where: { tenantId },
      select: { question: true },
    });

    const existingQuestions = new Set(
      existingFaqs.map((f) => f.question.toLowerCase().trim())
    );

    // Process each FAQ
    for (const faq of faqs) {
      const questionNormalized = faq.question.toLowerCase().trim();

      // Skip duplicates
      if (existingQuestions.has(questionNormalized)) {
        results.skipped++;
        results.details.push({
          question: faq.question,
          status: "skipped",
          error: "FAQ similaire existante",
        });
        continue;
      }

      try {
        // Extract keywords if requested and not provided
        let keywords = faq.keywords || [];
        if (shouldExtractKeywords && keywords.length === 0) {
          try {
            keywords = await extractKeywords(faq.question, faq.answer);
          } catch (keywordError) {
            console.error("[FAQ Import] Keyword extraction failed:", keywordError);
            // Continue without keywords
            keywords = [];
          }
        }

        // Create FAQ
        await db.fAQ.create({
          data: {
            tenantId,
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            category: faq.category?.trim() || null,
            keywords,
            isActive: true,
            usageCount: 0,
          },
        });

        results.imported++;
        results.details.push({
          question: faq.question,
          status: "imported",
        });

        // Add to existing set to prevent duplicates within same import
        existingQuestions.add(questionNormalized);
      } catch (e) {
        results.failed++;
        const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
        results.errors.push(`Échec pour: "${faq.question.slice(0, 50)}..." - ${errorMessage}`);
        results.details.push({
          question: faq.question,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[FAQ Import] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 400 }
    );
  }
}

// GET endpoint to provide import template/example
export async function GET(): Promise<NextResponse> {
  const template = {
    description: "Template pour l'import de FAQs",
    format: {
      faqs: [
        {
          question: "Quels sont vos horaires d'ouverture ?",
          answer: "Nous sommes ouverts du lundi au vendredi de 9h à 18h.",
          category: "Informations générales",
          keywords: ["horaires", "ouverture", "heure"], // Optionnel
        },
        {
          question: "Comment puis-je vous contacter ?",
          answer: "Vous pouvez nous joindre par téléphone au 01 23 45 67 89 ou par email à contact@example.com.",
          category: "Contact",
        },
      ],
      extractKeywords: true, // Optionnel, true par défaut
    },
    notes: [
      "question: minimum 5 caractères",
      "answer: minimum 10 caractères",
      "category: optionnel",
      "keywords: optionnel (sera généré automatiquement si extractKeywords=true)",
      "Les FAQs avec des questions identiques (ignoring case) seront ignorées",
    ],
  };

  return NextResponse.json(template);
}
