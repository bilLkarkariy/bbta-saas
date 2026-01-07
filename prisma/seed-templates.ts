// Template Seeding Script
// Seeds vertical-specific templates for tenants

import { PrismaClient } from "@prisma/client";
import { getVerticalConfig, resolveVertical } from "../src/config/verticals";

const prisma = new PrismaClient();

/**
 * Seed templates for a specific tenant based on their business type
 */
async function seedTemplatesForTenant(tenantId: string, businessType: string) {
  const verticalId = resolveVertical(businessType);
  const config = getVerticalConfig(businessType);

  console.log(`Seeding templates for tenant ${tenantId} (${verticalId})...`);

  // Get existing template names for this tenant
  const existingTemplates = await prisma.messageTemplate.findMany({
    where: { tenantId },
    select: { name: true },
  });
  const existingNames = new Set(existingTemplates.map((t) => t.name));

  // Filter out templates that already exist
  const templatesToCreate = config.templates.filter(
    (t) => !existingNames.has(t.name)
  );

  if (templatesToCreate.length === 0) {
    console.log(`  No new templates to create for tenant ${tenantId}`);
    return;
  }

  // Create templates
  const createdTemplates = await prisma.messageTemplate.createMany({
    data: templatesToCreate.map((t) => ({
      tenantId,
      name: t.name,
      content: t.content,
      category: t.category,
      variables: t.variables,
      isActive: true,
      whatsappStatus: "draft",
    })),
    skipDuplicates: true,
  });

  console.log(`  Created ${createdTemplates.count} templates for tenant ${tenantId}`);
}

/**
 * Seed FAQs for a specific tenant based on their business type
 */
async function seedFaqsForTenant(tenantId: string, businessType: string) {
  const config = getVerticalConfig(businessType);

  console.log(`Seeding FAQs for tenant ${tenantId}...`);

  // Get existing FAQs for this tenant
  const existingFaqs = await prisma.fAQ.findMany({
    where: { tenantId },
    select: { question: true },
  });
  const existingQuestions = new Set(existingFaqs.map((f) => f.question));

  // Filter out FAQs that already exist
  const faqsToCreate = config.faqPresets.filter(
    (f) => !existingQuestions.has(f.question)
  );

  if (faqsToCreate.length === 0) {
    console.log(`  No new FAQs to create for tenant ${tenantId}`);
    return;
  }

  // Create FAQs
  const createdFaqs = await prisma.fAQ.createMany({
    data: faqsToCreate.map((f) => ({
      tenantId,
      question: f.question,
      answer: f.answer,
      category: f.category,
      keywords: f.keywords,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  console.log(`  Created ${createdFaqs.count} FAQs for tenant ${tenantId}`);
}

/**
 * Seed services for a specific tenant (for service-based verticals)
 */
async function seedServicesForTenant(tenantId: string, businessType: string) {
  const config = getVerticalConfig(businessType);

  if (!config.servicePresets || config.servicePresets.length === 0) {
    console.log(`  No service presets for vertical ${config.id}`);
    return;
  }

  console.log(`Seeding services for tenant ${tenantId}...`);

  // Get current services
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { services: true },
  });

  const existingServices = new Set(tenant?.services || []);

  // Get new services to add
  const newServices = config.servicePresets
    .map((s) => s.name)
    .filter((name) => !existingServices.has(name));

  if (newServices.length === 0) {
    console.log(`  No new services to add for tenant ${tenantId}`);
    return;
  }

  // Update tenant with new services
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      services: [...(tenant?.services || []), ...newServices],
    },
  });

  console.log(`  Added ${newServices.length} services for tenant ${tenantId}`);
}

/**
 * Seed all vertical-specific data for a tenant
 */
async function seedVerticalDataForTenant(tenantId: string, businessType: string) {
  console.log(`\n=== Seeding vertical data for tenant ${tenantId} ===`);
  console.log(`Business type: ${businessType} -> ${resolveVertical(businessType)}`);

  await seedTemplatesForTenant(tenantId, businessType);
  await seedFaqsForTenant(tenantId, businessType);
  await seedServicesForTenant(tenantId, businessType);

  console.log(`=== Completed seeding for tenant ${tenantId} ===\n`);
}

/**
 * Seed vertical data for all existing tenants
 */
async function seedAllTenants() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, businessType: true },
  });

  console.log(`Found ${tenants.length} tenants to seed`);

  for (const tenant of tenants) {
    await seedVerticalDataForTenant(tenant.id, tenant.businessType);
  }
}

/**
 * Create demo tenants for each vertical (for testing)
 */
async function createDemoTenants() {
  const demoTenants = [
    {
      name: "Salon Élégance",
      slug: "salon-elegance-demo",
      businessType: "beaute",
      plan: "pro",
      status: "active",
    },
    {
      name: "Dupont Plomberie",
      slug: "dupont-plomberie-demo",
      businessType: "services",
      plan: "starter",
      status: "active",
    },
    {
      name: "Mode & Style",
      slug: "mode-style-demo",
      businessType: "ecommerce",
      plan: "pro",
      status: "active",
    },
    {
      name: "Restaurant Le Gourmet",
      slug: "restaurant-gourmet-demo",
      businessType: "generic",
      plan: "starter",
      status: "trial",
    },
  ];

  for (const tenantData of demoTenants) {
    // Check if tenant already exists
    const existing = await prisma.tenant.findUnique({
      where: { slug: tenantData.slug },
    });

    if (existing) {
      console.log(`Demo tenant ${tenantData.slug} already exists, skipping...`);
      continue;
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: tenantData,
    });

    console.log(`Created demo tenant: ${tenant.name} (${tenant.id})`);

    // Seed vertical data
    await seedVerticalDataForTenant(tenant.id, tenant.businessType);
  }
}

async function main() {
  console.log("🌱 Starting template seeding...\n");

  // Parse command line args
  const args = process.argv.slice(2);
  const createDemo = args.includes("--demo");
  const tenantId = args.find((a) => a.startsWith("--tenant="))?.split("=")[1];

  if (createDemo) {
    console.log("Creating demo tenants...");
    await createDemoTenants();
  } else if (tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, businessType: true },
    });

    if (!tenant) {
      console.error(`Tenant ${tenantId} not found`);
      process.exit(1);
    }

    await seedVerticalDataForTenant(tenant.id, tenant.businessType);
  } else {
    // Seed all tenants
    await seedAllTenants();
  }

  console.log("✅ Template seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
