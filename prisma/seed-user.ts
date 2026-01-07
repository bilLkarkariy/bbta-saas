import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";

config();

async function seedForUser(email: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");

  const url = new URL(connectionString);
  const pool = new Pool({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
  if (!user) {
    console.log("User not found:", email);
    await pool.end();
    return;
  }

  const tenantId = user.tenantId;
  console.log("Seeding for:", user.email, "-> tenant:", user.tenant.name);

  // Tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { tenantId_name: { tenantId, name: "VIP" } }, update: {}, create: { tenantId, name: "VIP", color: "#F59E0B" } }),
    prisma.tag.upsert({ where: { tenantId_name: { tenantId, name: "Lead" } }, update: {}, create: { tenantId, name: "Lead", color: "#10B981" } }),
    prisma.tag.upsert({ where: { tenantId_name: { tenantId, name: "Client" } }, update: {}, create: { tenantId, name: "Client", color: "#3B82F6" } }),
    prisma.tag.upsert({ where: { tenantId_name: { tenantId, name: "Prospect" } }, update: {}, create: { tenantId, name: "Prospect", color: "#8B5CF6" } }),
  ]);
  console.log("  Tags:", tags.length);

  // Contacts
  const contacts = [
    { phone: "+33612345678", name: "Marie Dupont", email: "marie@example.com", company: "Dupont & Co", tagNames: ["VIP", "Client"] },
    { phone: "+33623456789", name: "Jean Martin", email: "jean.martin@email.fr", company: "Martin SARL", tagNames: ["Client"] },
    { phone: "+33634567890", name: "Sophie Bernard", email: "sophie.b@gmail.com", company: null, tagNames: ["Lead"] },
    { phone: "+33645678901", name: "Pierre Durand", email: "p.durand@entreprise.fr", company: "Durand Industries", tagNames: ["VIP", "Client"] },
    { phone: "+33656789012", name: "Claire Petit", email: "claire.petit@hotmail.fr", company: null, tagNames: ["Prospect"] },
  ];

  for (const c of contacts) {
    const tagIds = tags.filter((t) => c.tagNames.includes(t.name)).map((t) => ({ id: t.id }));
    await prisma.contact.upsert({
      where: { tenantId_phone: { tenantId, phone: c.phone } },
      update: { name: c.name, email: c.email, company: c.company, tags: { set: tagIds } },
      create: { tenantId, phone: c.phone, name: c.name, email: c.email, company: c.company, source: "import", tags: { connect: tagIds } },
    });
  }
  console.log("  Contacts:", contacts.length);

  // Templates
  const templates = [
    { name: "Bienvenue", content: "Bonjour {{name}} ! Bienvenue chez nous.", category: "general", variables: ["name"] },
    { name: "Rappel RDV", content: "Rappel: RDV le {{date}} à {{time}}.", category: "utility", variables: ["date", "time"] },
    { name: "Promotion", content: "{{name}}, -{{discount}}% jusqu'au {{endDate}} !", category: "marketing", variables: ["name", "discount", "endDate"] },
  ];

  for (const t of templates) {
    await prisma.messageTemplate.upsert({
      where: { tenantId_name: { tenantId, name: t.name } },
      update: {},
      create: { tenantId, ...t, whatsappStatus: "approved", usageCount: Math.floor(Math.random() * 30) },
    });
  }
  console.log("  Templates:", templates.length);

  // FAQs
  const faqs = [
    { question: "Quels sont vos horaires ?", answer: "Lundi-Vendredi 9h-18h", category: "horaires", keywords: ["horaires", "heures"] },
    { question: "Comment réserver ?", answer: "Par WhatsApp ou téléphone", category: "services", keywords: ["réserver", "rdv"] },
    { question: "Quels sont vos tarifs ?", answer: "À partir de 50€", category: "tarifs", keywords: ["prix", "tarif"] },
  ];

  for (const f of faqs) {
    await prisma.fAQ.create({ data: { tenantId, ...f, usageCount: Math.floor(Math.random() * 50) } });
  }
  console.log("  FAQs:", faqs.length);

  // Campaigns
  await prisma.campaign.create({ data: { tenantId, name: "Promo Hiver", status: "sent", sentCount: 85, deliveredCount: 80, readCount: 45 } });
  await prisma.campaign.create({ data: { tenantId, name: "Newsletter", status: "draft" } });
  console.log("  Campaigns: 2");

  console.log("Done!");
  await prisma.$disconnect();
  await pool.end();
}

const email = process.argv[2] || "billelhel@gmail.com";
seedForUser(email).catch(console.error);
