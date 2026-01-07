import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, TrendingUp, HelpCircle, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";

export default async function FAQAnalyticsPage() {
  const { tenantId } = await getCurrentTenant();

  // Calculate date range
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Run all queries in parallel for better performance
  const [faqStats, unknownMessages, totalFaqs, activeFaqs, faqMatchStats] = await Promise.all([
    // Get FAQ usage stats
    db.fAQ.findMany({
      where: { tenantId },
      orderBy: { usageCount: "desc" },
      take: 10,
    }),

    // Get unanswered questions (UNKNOWN intents from last 7 days)
    db.message.findMany({
      where: {
        conversation: { tenantId },
        direction: "inbound",
        intent: "UNKNOWN",
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    }),

    // Count total FAQs
    db.fAQ.count({ where: { tenantId } }),

    // Count active FAQs
    db.fAQ.count({ where: { tenantId, isActive: true } }),

    // Get match types breakdown
    db.message.groupBy({
      by: ["intent"],
      where: {
        conversation: { tenantId },
        direction: "outbound",
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    }),
  ]);

  // Calculate totals
  const totalUsage = faqStats.reduce((sum, f) => sum + f.usageCount, 0);

  const faqMatches = faqMatchStats.find((s) => s.intent === "FAQ")?._count.id || 0;
  const unknownCount = faqMatchStats.find((s) => s.intent === "UNKNOWN")?._count.id || 0;
  const totalResponses = faqMatchStats.reduce((sum, s) => sum + s._count.id, 0);
  const matchRate = totalResponses > 0 ? Math.round((faqMatches / totalResponses) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytiques FAQ</h1>
        <Link href="/dashboard/faq">
          <Button variant="outline">
            Retour aux FAQs
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFaqs}</div>
            <p className="text-xs text-muted-foreground">
              {activeFaqs} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisations totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              depuis le début
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de match</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchRate}%</div>
            <p className="text-xs text-muted-foreground">
              7 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sans réponse</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{unknownCount}</div>
            <p className="text-xs text-muted-foreground">
              7 derniers jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            FAQs les plus utilisées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {faqStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune FAQ utilisée pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {faqStats.map((faq, index) => {
                const maxUsage = faqStats[0]?.usageCount || 1;
                const widthPercent = (faq.usageCount / maxUsage) * 100;

                return (
                  <div key={faq.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <span className="text-sm truncate max-w-md">{faq.question}</span>
                      </div>
                      <span className="text-sm font-semibold">{faq.usageCount}</span>
                    </div>
                    <div className="ml-9 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested FAQs from unknown questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-500">
            <HelpCircle className="h-5 w-5" />
            Questions fréquentes sans réponse
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unknownMessages.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Toutes les questions ont trouvé une réponse !
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Ces questions n&apos;ont pas trouvé de FAQ correspondante. Considérez les ajouter.
              </p>
              <div className="space-y-2">
                {unknownMessages.slice(0, 10).map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">&quot;{msg.content}&quot;</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Link href={`/dashboard/faq/new?question=${encodeURIComponent(msg.content)}`}>
                      <Button size="sm" variant="outline" className="ml-3 shrink-0">
                        <Plus className="h-4 w-4 mr-1" />
                        Créer FAQ
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              {unknownMessages.length > 10 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  et {unknownMessages.length - 10} autres questions...
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Keywords Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Couverture des mots-clés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {faqStats.slice(0, 8).map((faq) => (
              <div key={faq.id} className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {faq.question.slice(0, 30)}...
                </p>
                <div className="flex flex-wrap gap-1">
                  {faq.keywords.slice(0, 5).map((keyword, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {faq.keywords.length > 5 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{faq.keywords.length - 5}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
