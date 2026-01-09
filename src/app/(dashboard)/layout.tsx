import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/lib/auth";
import { SidebarWrapper } from "@/components/dashboard/sidebar/SidebarWrapper";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let tenant;
  let user;

  try {
    const result = await getCurrentTenant();
    tenant = result.tenant;
    user = result.user;
  } catch {
    redirect("/onboarding");
  }

  // Get user initials
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E6EE] relative grain w-full overflow-hidden">
      {/* Ambient Lighting - Atmospheric haze */}
      <div className="absolute top-[20%] right-[5%] w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Main Layout Content - Floating Sidebar and Main Canvas */}
      <div className="flex w-full h-full max-w-[1600px] mx-auto z-10 relative gap-4 md:gap-6 lg:gap-8">
        <SidebarWrapper
          user={{
            name: user.name || "User",
            email: user.email,
            initials,
            superAdmin: user.superAdmin,
          }}
          workspace={{
            name: tenant.name,
            plan: tenant.plan === "starter" ? "Starter" : tenant.plan === "pro" ? "Pro" : "Enterprise",
            initial: tenant.name.charAt(0).toUpperCase(),
          }}
          usage={{
            current: 1200, // TODO: fetch from DB
            limit: 2000,
            label: "Messages",
          }}
        />
        {/* Main content - add left padding on mobile for hamburger button */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden scrollbar-thin p-4 md:p-6 lg:p-8 pt-14 md:pt-6 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
