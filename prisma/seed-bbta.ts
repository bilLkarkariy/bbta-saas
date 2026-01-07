import "dotenv/config";
import { db as prisma } from "../src/lib/db";

async function main() {
  console.log("🏪 Creating BBTA Nails demo tenant...");

  // Create or update tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: "bbta-nails-demo" },
    update: {},
    create: {
      id: "bbta-nails-demo",
      slug: "bbta-nails",
      name: "BBTA Nails",
      businessType: "beaute",
      businessName: "BBTA Nails - Salon de beauté",
      whatsappNumber: "+14155238886", // Sandbox number for demo
      plan: "pro",
      phone: "+33600000001",
      address: "142 Avenue de Saint Louis",
      city: "Marseille",
      timezone: "Europe/Paris",
      businessHours: JSON.stringify({
        monday: { open: "09:00", close: "19:00" },
        tuesday: { open: "09:00", close: "19:00" },
        wednesday: { open: "09:00", close: "19:00" },
        thursday: { open: "09:00", close: "19:00" },
        friday: { open: "09:00", close: "19:00" },
        saturday: { open: "09:00", close: "17:00" },
        sunday: null,
      }),
      services: ["Pose gel", "Semi-permanent", "Manucure", "Pédicure", "Nail art", "Dépose"],
      pricing: "Pose gel: 45€, Semi-permanent: 30€, Manucure: 20€, Pédicure: 35€, Nail art: +10€, Dépose: 15€",
      onboardingCompleted: true,
    },
  });

  console.log(`✅ Tenant created: ${tenant.id}`);

  // Create FAQs
  const faqs = [
    {
      question: "Quels sont vos horaires ?",
      answer: "Nous sommes ouverts du lundi au vendredi de 9h à 19h, et le samedi de 9h à 17h. Fermé le dimanche.",
      keywords: ["horaires", "ouverture", "heures", "quand"],
    },
    {
      question: "Où êtes-vous situés ?",
      answer: "Nous sommes au 142 Avenue de Saint Louis, 13015 Marseille. Facile d'accès en transport ou en voiture !",
      keywords: ["adresse", "où", "localisation", "situé", "trouver"],
    },
    {
      question: "Quels services proposez-vous ?",
      answer: "Nous proposons : pose de gel (45€), pose de vernis semi-permanent (30€), manucure simple (20€), pédicure (35€), nail art (+10€), et dépose (15€).",
      keywords: ["services", "prestations", "proposez", "faites"],
    },
    {
      question: "Quels sont vos tarifs ?",
      answer: "Nos tarifs : Pose gel complète 45€, Semi-permanent 30€, Manucure 20€, Pédicure 35€, Nail art à partir de 10€, Dépose 15€. Paiement CB ou espèces.",
      keywords: ["tarifs", "prix", "combien", "coûte", "coute"],
    },
    {
      question: "Comment prendre rendez-vous ?",
      answer: "Vous pouvez réserver directement ici sur WhatsApp ! Dites-moi quel service vous souhaitez et je vous propose les créneaux disponibles.",
      keywords: ["rendez-vous", "réserver", "rdv", "booking", "prendre"],
    },
    {
      question: "Acceptez-vous les paiements par carte ?",
      answer: "Oui, nous acceptons les paiements par carte bancaire et en espèces.",
      keywords: ["paiement", "carte", "cb", "espèces", "payer"],
    },
  ];

  // Delete existing FAQs for this tenant
  await prisma.fAQ.deleteMany({ where: { tenantId: tenant.id } });

  // Create new FAQs
  for (const faq of faqs) {
    await prisma.fAQ.create({
      data: {
        tenantId: tenant.id,
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords,
        isActive: true,
      },
    });
  }

  console.log(`✅ ${faqs.length} FAQs created`);

  // Create a demo contact (yourself)
  const existingContact = await prisma.contact.findFirst({
    where: { tenantId: tenant.id, phone: "+33600000002" },
  });

  const contact = existingContact || await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      phone: "+33600000002",
      name: "Billel (Test)",
    },
  });

  console.log(`✅ Contact created: ${contact.name}`);

  console.log("\n🎉 BBTA Nails demo ready!");
  console.log("\n📱 Test en envoyant un message WhatsApp au sandbox +14155238886");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
