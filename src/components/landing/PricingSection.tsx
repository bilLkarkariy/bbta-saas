"use client";

import { motion } from "framer-motion";
import { Check, Info, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const plans = [
    {
        name: "Starter",
        price: "49",
        description: "Idéal pour les petites entreprises et indépendants.",
        features: ["500 messages / mois", "1 agent IA standard", "Sync WhatsApp Basic", "Support par email"],
        cta: "Commencer l'essai",
        popular: false,
    },
    {
        name: "Pro",
        price: "149",
        description: "Le choix favoris des entreprises en croissance.",
        features: ["Messages Illimités", "Agent IA Avancé (V2)", "Sync CRM native", "Support Prioritaire 24/7", "Analytiques Temps Réel"],
        cta: "Passer au Pro",
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Sur Devis",
        description: "Pour les grandes organisations avec des besoins complexes.",
        features: ["Numéros illimités", "SLA & Sécurité Personnalisée", "Account Manager Dédié", "Multi-Workspaces"],
        cta: "Contactez-nous",
        popular: false,
    },
];

const faqs = [
    { q: "Puis-je changer de plan à tout moment ?", a: "Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment depuis votre dashboard. La différence sera calculée au prorata." },
    { q: "Avez-vous besoin de mes accès WhatsApp ?", a: "Non, nous utilisons l'API officielle via un QR Code sécurisé. Nous n'avons jamais accès à vos messages personnels." },
    { q: "Comment fonctionne l'essai gratuit ?", a: "Vous bénéficiez de 14 jours complets pour tester toutes les fonctionnalités Pro, sans avoir à saisir de carte bancaire." },
];

export function PricingSection() {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

    return (
        <section id="pricing" className="py-32 bg-black relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="container px-4 mx-auto max-w-7xl relative z-10">
                <div className="text-center mb-16">
                    {/* Trial Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-black uppercase tracking-widest mb-8"
                    >
                        🔥 14 jours d'essai, sans carte bancaire
                    </motion.div>

                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 text-white">
                        Tarifs clairs. Pas de surprise.
                    </h2>

                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={cn("text-sm font-medium transition-colors", billing === "monthly" ? "text-white" : "text-muted-foreground")}>Mensuel</span>
                        <button
                            onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
                            className="w-12 h-6 rounded-full bg-white/10 p-1 relative flex items-center"
                        >
                            <motion.div
                                animate={{ x: billing === "monthly" ? 0 : 24 }}
                                className="w-4 h-4 rounded-full bg-primary"
                            />
                        </button>
                        <span className={cn("text-sm font-medium transition-colors", billing === "yearly" ? "text-white" : "text-muted-foreground")}>
                            Annuel <span className="text-emerald-400 ml-1 text-xs font-black">(-20%)</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className={cn(
                                "p-8 rounded-3xl border backdrop-blur-sm relative flex flex-col justify-between group h-full",
                                plan.popular
                                    ? "bg-white/[0.03] border-primary/50 shadow-[0_0_50px_rgba(59,130,246,0.1)] ring-1 ring-primary/20"
                                    : "bg-white/5 border-white/5"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                                    Plus Populaire
                                </div>
                            )}

                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-black text-white">{plan.price === "Sur Devis" ? "DEVIS" : billing === "monthly" ? plan.price : Math.floor(parseInt(plan.price) * 0.8)}€</span>
                                    {plan.price !== "Sur Devis" && <span className="text-muted-foreground text-sm">/mois</span>}
                                </div>
                                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                                    {plan.description}
                                </p>

                                <ul className="space-y-4 mb-10">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-sm text-foreground/80">
                                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button
                                variant={plan.popular ? "default" : "outline"}
                                className={cn(
                                    "w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300",
                                    plan.popular ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02]" : "border-white/10 hover:bg-white/5"
                                )}
                            >
                                {plan.cta}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto">
                    <h3 className="text-2xl font-bold text-white mb-12 flex items-center gap-3 justify-center">
                        <HelpCircle className="w-6 h-6 text-primary" />
                        Questions fréquentes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {faqs.map((faq, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                <h4 className="text-white font-bold mb-3">{faq.q}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            D'autres questions ? <Link href="#" className="text-primary hover:underline font-bold">Parlez-en à notre équipe</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
