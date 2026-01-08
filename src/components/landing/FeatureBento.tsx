"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { IconZapAnimated, IconShieldAnimated, IconUsersAnimated, IconGlobeAnimated, IconCpuAnimated } from "@/components/dashboard/DashboardIcons";
import { cn } from "@/lib/utils";
import type { ReactNode, ComponentType } from "react";

interface Feature {
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    className: string;
    visual?: ReactNode;
}

const features = [
    {
        title: "Le 3-Way Match (Contrôle Prix)",
        description: "L'IA lit la facture et la compare au Devis/Bon de Commande. Écart de prix ? Quantité non livrée ? Doublon ? Alerte avant paiement.",
        icon: IconShieldAnimated,
        className: "md:col-span-2 md:row-span-2 bg-primary/10 border-primary/20",
        visual: (
            <div className="mt-8 flex items-end gap-2 h-32">
                {[40, 70, 45, 90, 65, 100, 85].map((h, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1 }}
                        className="flex-1 bg-gradient-to-t from-primary/20 to-primary rounded-t-lg"
                    />
                ))}
            </div>
        )
    },
    {
        title: "Workflow de Validation",
        description: "L'Agent identifie l'acheteur, lui envoie la notif de validation, et relance si besoin. Le DAF ne reçoit que ce qui est validé.",
        icon: IconZapAnimated,
        className: "md:col-span-1 md:row-span-1 bg-emerald-500/5 border-emerald-500/10",
    },
    {
        title: "Préparation Comptable",
        description: "Lecture OCR, imputation analytique, nommage des fichiers. Export parfait prêt à importer dans votre logiciel.",
        icon: IconUsersAnimated,
        className: "md:col-span-1 md:row-span-1 bg-blue-500/5 border-blue-500/10",
    },
    {
        title: "Alerte Trésorerie",
        description: "Vision claire des factures engagées mais non payées. Vous savez exactement combien va sortir à la fin du mois.",
        icon: IconGlobeAnimated,
        className: "md:col-span-1 md:row-span-1 bg-purple-500/5 border-purple-500/10",
    },
    {
        title: "Contrôle Continu 24/7",
        description: "L'IA ne se fatigue jamais. Chaque centime est audité en temps réel sans erreur humaine.",
        icon: IconCpuAnimated,
        className: "md:col-span-2 md:row-span-1 bg-white/5 border-white/10",
        visual: (
            <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>Audit de Conformité</span>
                    <span className="text-emerald-400">100% Précision</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        transition={{ duration: 1, delay: 0.5 }}
                    />
                </div>
            </div>
        )
    }
];

function FeatureCard({ feature, index }: { feature: Feature, index: number }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 50 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 50 });

    const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
    const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);

    function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - rect.width / 2;
        const offsetY = event.clientY - rect.top - rect.height / 2;
        x.set(offsetX);
        y.set(offsetY);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
            }}
            whileHover={{
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 }
            }}
            className={cn(
                "p-8 rounded-3xl border backdrop-blur-sm relative group overflow-hidden flex flex-col justify-between cursor-default",
                "shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(var(--primary-rgb),0.1)] transition-shadow duration-500",
                feature.className
            )}
        >
            <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                </p>
            </div>

            {feature.visual && (
                <div className="relative z-10" style={{ transform: "translateZ(10px)" }}>
                    {feature.visual}
                </div>
            )}

            {/* Decorative Background Glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
    );
}

export function FeatureBento() {
    return (
        <section id="features" className="py-32 bg-black relative">
            <div className="container px-4 mx-auto max-w-7xl">
                <div className="mb-20 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
                        IL CONTRÔLE. IL VALIDE. IL PRÉPARE.
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Votre expert-comptable fait le bilan. Lumelia fait le ménage avant.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]" style={{ perspective: "1200px" }}>
                    {features.map((feature, i) => (
                        <FeatureCard key={i} feature={feature} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
