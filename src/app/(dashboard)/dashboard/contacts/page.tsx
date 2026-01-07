import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { ContactsPage } from "@/components/dashboard/contacts/ContactsPage";

export default async function ContactsRoute() {
  const { tenantId } = await getCurrentTenant();

  const [contacts, tags, totalCount] = await Promise.all([
    db.contact.findMany({
      where: { tenantId },
      include: { tags: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.tag.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    }),
    db.contact.count({ where: { tenantId } }),
  ]);

  return (
    <ContactsPage
      initialContacts={contacts}
      tags={tags}
      totalCount={totalCount}
    />
  );
}
