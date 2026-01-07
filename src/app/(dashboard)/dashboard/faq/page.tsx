import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { FAQList } from "@/components/dashboard/faq-list";

export default async function FAQPage() {
  const { tenantId } = await getCurrentTenant();

  const faqs = await db.fAQ.findMany({
    where: { tenantId },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">FAQ</h2>
        <p className="text-gray-500">
          Gérez les questions fréquentes pour les réponses automatiques
        </p>
      </div>

      <FAQList faqs={faqs} tenantId={tenantId} />
    </div>
  );
}
