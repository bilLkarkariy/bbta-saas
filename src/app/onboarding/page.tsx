import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingFlow } from "@/components/onboarding";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user exists (created by webhook)
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });

  if (!user) {
    // User not yet created by webhook - show waiting state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="text-gray-600">Configuration de votre compte...</p>
          <p className="text-sm text-gray-400">
            Rechargez la page dans quelques secondes
          </p>
        </div>
      </div>
    );
  }

  // If onboarding already completed, go to dashboard
  if (user.tenant?.onboardingCompleted) {
    redirect("/dashboard");
  }

  // Show onboarding flow
  return <OnboardingFlow tenantId={user.tenantId} />;
}
