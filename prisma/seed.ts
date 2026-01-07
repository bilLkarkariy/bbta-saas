import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";

config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = new URL(connectionString);
  const poolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password || undefined,
  };

  const pool = new Pool(poolConfig);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding database...");

  // Find existing tenant (created by Clerk webhook)
  const tenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!tenant) {
    console.log("No tenant found. Please sign up first to create a tenant.");
    await pool.end();
    return;
  }

  console.log(`Seeding data for tenant: ${tenant.name} (${tenant.id})`);

  // Create Tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "VIP" } },
      update: {},
      create: { tenantId: tenant.id, name: "VIP", color: "#F59E0B" },
    }),
    prisma.tag.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Lead" } },
      update: {},
      create: { tenantId: tenant.id, name: "Lead", color: "#10B981" },
    }),
    prisma.tag.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Client" } },
      update: {},
      create: { tenantId: tenant.id, name: "Client", color: "#3B82F6" },
    }),
    prisma.tag.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Prospect" } },
      update: {},
      create: { tenantId: tenant.id, name: "Prospect", color: "#8B5CF6" },
    }),
  ]);
  console.log(`Created ${tags.length} tags`);

  // Create Contacts
  const contactsData = [
    { phone: "+33612345678", name: "Marie Dupont", email: "marie@example.com", company: "Dupont & Co", tags: ["VIP", "Client"] },
    { phone: "+33623456789", name: "Jean Martin", email: "jean.martin@email.fr", company: "Martin SARL", tags: ["Client"] },
    { phone: "+33634567890", name: "Sophie Bernard", email: "sophie.b@gmail.com", company: null, tags: ["Lead"] },
    { phone: "+33645678901", name: "Pierre Durand", email: "p.durand@entreprise.fr", company: "Durand Industries", tags: ["VIP", "Client"] },
    { phone: "+33656789012", name: "Claire Petit", email: "claire.petit@hotmail.fr", company: null, tags: ["Prospect"] },
    { phone: "+33667890123", name: "Lucas Moreau", email: "lucas.m@yahoo.fr", company: "Moreau Tech", tags: ["Lead"] },
    { phone: "+33678901234", name: "Emma Lefebvre", email: "emma@lefebvre.fr", company: "Lefebvre Design", tags: ["Client"] },
    { phone: "+33689012345", name: "Thomas Garcia", email: "thomas.g@outlook.fr", company: null, tags: ["Prospect"] },
    { phone: "+33690123456", name: "Julie Roux", email: "julie.roux@gmail.com", company: "Roux Consulting", tags: ["VIP"] },
    { phone: "+33601234567", name: "Antoine Blanc", email: "antoine@blanc.fr", company: "Blanc & Fils", tags: ["Client", "VIP"] },
  ];

  for (const data of contactsData) {
    const tagIds = tags.filter((t) => data.tags.includes(t.name)).map((t) => ({ id: t.id }));
    await prisma.contact.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: data.phone } },
      update: { name: data.name, email: data.email, company: data.company, tags: { set: tagIds } },
      create: {
        tenantId: tenant.id,
        phone: data.phone,
        name: data.name,
        email: data.email,
        company: data.company,
        source: "import",
        tags: { connect: tagIds },
      },
    });
  }
  console.log(`Created ${contactsData.length} contacts`);

  // Create Message Templates
  const templatesData = [
    {
      name: "Bienvenue",
      content: "Bonjour {{name}} ! Bienvenue chez {{company}}. Nous sommes ravis de vous compter parmi nos clients.",
      category: "general",
      variables: ["name", "company"],
    },
    {
      name: "Rappel RDV",
      content: "Bonjour {{name}}, nous vous rappelons votre rendez-vous prévu le {{date}} à {{time}}. À bientôt !",
      category: "utility",
      variables: ["name", "date", "time"],
    },
    {
      name: "Promotion",
      content: "{{name}}, profitez de {{discount}}% de réduction sur nos services jusqu'au {{endDate}} ! Code: {{code}}",
      category: "marketing",
      variables: ["name", "discount", "endDate", "code"],
    },
    {
      name: "Confirmation commande",
      content: "Merci {{name}} ! Votre commande #{{orderNumber}} a bien été confirmée. Livraison prévue le {{deliveryDate}}.",
      category: "utility",
      variables: ["name", "orderNumber", "deliveryDate"],
    },
    {
      name: "Relance",
      content: "Bonjour {{name}}, nous n'avons pas eu de vos nouvelles depuis un moment. Avez-vous besoin d'aide ?",
      category: "marketing",
      variables: ["name"],
    },
  ];

  for (const data of templatesData) {
    await prisma.messageTemplate.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: data.name } },
      update: { content: data.content, category: data.category, variables: data.variables },
      create: {
        tenantId: tenant.id,
        name: data.name,
        content: data.content,
        category: data.category,
        variables: data.variables,
        whatsappStatus: "approved",
        usageCount: Math.floor(Math.random() * 50),
      },
    });
  }
  console.log(`Created ${templatesData.length} templates`);

  // Create FAQs
  const faqsData = [
    { question: "Quels sont vos horaires d'ouverture ?", answer: "Nous sommes ouverts du lundi au vendredi de 9h à 18h, et le samedi de 10h à 16h.", category: "horaires", keywords: ["horaires", "ouverture", "heures"] },
    { question: "Comment puis-je prendre rendez-vous ?", answer: "Vous pouvez prendre rendez-vous directement via WhatsApp, par téléphone au 01 23 45 67 89, ou sur notre site web.", category: "services", keywords: ["rendez-vous", "rdv", "réserver", "booking"] },
    { question: "Quels sont vos tarifs ?", answer: "Nos tarifs varient selon le service. Consultation de base: 50€, Service premium: 100€, Pack complet: 200€.", category: "tarifs", keywords: ["prix", "tarif", "coût", "combien"] },
    { question: "Où êtes-vous situés ?", answer: "Notre adresse est 123 Rue de la Paix, 75001 Paris. Métro: Opéra (lignes 3, 7, 8).", category: "adresse", keywords: ["adresse", "où", "localisation", "situé"] },
    { question: "Acceptez-vous les paiements par carte ?", answer: "Oui, nous acceptons les paiements par carte bancaire, espèces, et virement.", category: "services", keywords: ["paiement", "carte", "payer", "règlement"] },
  ];

  for (const data of faqsData) {
    await prisma.fAQ.upsert({
      where: { id: `faq-${data.question.slice(0, 20).replace(/\s/g, "-")}` },
      update: {},
      create: {
        tenantId: tenant.id,
        question: data.question,
        answer: data.answer,
        category: data.category,
        keywords: data.keywords,
        usageCount: Math.floor(Math.random() * 100),
      },
    });
  }
  console.log(`Created ${faqsData.length} FAQs`);

  // Create Conversations with Messages
  const conversations = [
    {
      customerPhone: "+33612345678",
      customerName: "Marie Dupont",
      status: "active",
      messages: [
        { direction: "inbound", content: "Bonjour, quels sont vos horaires ?" },
        { direction: "outbound", content: "Bonjour ! Nous sommes ouverts du lundi au vendredi de 9h à 18h. Puis-je vous aider ?" },
        { direction: "inbound", content: "Super, je voudrais prendre rdv pour demain" },
      ],
    },
    {
      customerPhone: "+33623456789",
      customerName: "Jean Martin",
      status: "active",
      messages: [
        { direction: "inbound", content: "Bonjour, combien coûte une consultation ?" },
        { direction: "outbound", content: "Bonjour Jean ! La consultation de base est à 50€. Souhaitez-vous réserver un créneau ?" },
      ],
    },
    {
      customerPhone: "+33634567890",
      customerName: "Sophie Bernard",
      status: "resolved",
      messages: [
        { direction: "inbound", content: "Bonjour, où êtes-vous situés ?" },
        { direction: "outbound", content: "Bonjour Sophie ! Notre adresse est 123 Rue de la Paix, 75001 Paris. À bientôt !" },
        { direction: "inbound", content: "Merci beaucoup !" },
      ],
    },
  ];

  for (const conv of conversations) {
    const conversation = await prisma.conversation.upsert({
      where: { tenantId_customerPhone: { tenantId: tenant.id, customerPhone: conv.customerPhone } },
      update: { status: conv.status, customerName: conv.customerName },
      create: {
        tenantId: tenant.id,
        customerPhone: conv.customerPhone,
        customerName: conv.customerName,
        status: conv.status,
      },
    });

    // Delete existing messages and recreate
    await prisma.message.deleteMany({ where: { conversationId: conversation.id } });

    for (let i = 0; i < conv.messages.length; i++) {
      const msg = conv.messages[i];
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: msg.direction,
          content: msg.content,
          status: "delivered",
          createdAt: new Date(Date.now() - (conv.messages.length - i) * 60000), // 1 min apart
        },
      });
    }
  }
  console.log(`Created ${conversations.length} conversations with messages`);

  // Create Campaigns
  const template = await prisma.messageTemplate.findFirst({ where: { tenantId: tenant.id, name: "Promotion" } });

  const campaignsData = [
    { name: "Promo Janvier", status: "sent", sentCount: 150, deliveredCount: 142, readCount: 98, repliedCount: 12 },
    { name: "Newsletter Février", status: "scheduled", scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { name: "Relance Clients Inactifs", status: "draft" },
  ];

  for (const data of campaignsData) {
    await prisma.campaign.upsert({
      where: { id: `campaign-${data.name.replace(/\s/g, "-").toLowerCase()}` },
      update: {},
      create: {
        tenantId: tenant.id,
        name: data.name,
        description: `Campagne ${data.name}`,
        status: data.status,
        templateId: template?.id,
        scheduledAt: data.scheduledAt,
        sentAt: data.status === "sent" ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : undefined,
        totalRecipients: data.sentCount || 0,
        sentCount: data.sentCount || 0,
        deliveredCount: data.deliveredCount || 0,
        readCount: data.readCount || 0,
        repliedCount: data.repliedCount || 0,
      },
    });
  }
  console.log(`Created ${campaignsData.length} campaigns`);

  console.log("Seed completed successfully!");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
