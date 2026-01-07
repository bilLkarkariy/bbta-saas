"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { PricingSection } from "@/components/landing/PricingSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Testimonials } from "@/components/landing/Testimonials";

export default function LandingPage() {
  return (
    <div className="dark">
      <main className="min-h-screen bg-black text-foreground relative selection:bg-primary/30 font-sans">
        <SiteHeader />
        <HeroSection />
        <SocialProof />
        <ProblemSolution />
        <FeatureBento />
        <InteractiveDemo />
        <Testimonials />
        <PricingSection />
        <SiteFooter />
      </main>
    </div>
  );
}
