"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Clock, AlertTriangle, Frown, Zap, Target, BarChart3, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const problems = [
    {
        title: "Délai de Réponse Interminable",
        description: "En B2B, répondre en 5 minutes vs 30 minutes divise vos chances de conversion par 21.",
        icon: Clock,
        stats: "Jusqu'à 12h d'attente",
    },
    {
        title: "Leads Qualifiés Perdus",
        description: "Vos commerciaux passent 80% de leu temps à trier des curieux au lieu de closer des décideurs.",
        icon: AlertTriangle,
        stats: "73% de leads non-traités",
    },
    {
        title: "Communication Fragmentée",
        description: "Les informations sont éparpillées entre WhatsApp, emails et CRM. Personne n'a la vue d'ensemble.",
        icon: Frown,
        stats: "Zéro visibilité ROI",
    }
];

const solutions = [
    {
        title: "Réponse Instantanée 24/7",
        description: "L'IA engage la conversation en moins de 10 secondes, qualifie le besoin et propose un rendez-vous.",
        icon: Zap,
        stats: "Réponse < 10s",
    },
    {
        title: "Qualification Chirurgicale",
        description: "L'agent extrait les données clés (budget, poste, besoin) et les injecte directement dans votre CRM.",
        icon: Target,
        stats: "Leads 100% qualifiés",
    },
    {
        title: "Dashboard Centralisé",
        description: "Une vue unifiée sur toutes vos automatisations, vos taux de conversion et votre CA généré.",
        icon: BarChart3,
        stats: "ROI mesurable en €",
    }
];

function Card({ item, isSolution = false, index }: { item: any, isSolution?: boolean, index: number }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 400, damping: 40 });
    const mouseY = useSpring(y, { stiffness: 400, damping: 40 });

    const rotateX = useTransform(mouseY, [-100, 100], [8, -8]);
    const rotateY = useTransform(mouseX, [-100, 100], [-8, 8]);

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
            initial={{ opacity: 0, x: isSolution ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            whileHover={{ scale: 1.02 }}
            className={cn(
                "p-8 rounded-3xl border backdrop-blur-sm relative group overflow-hidden h-full flex flex-col",
                isSolution
                    ? "bg-emerald-500/5 border-emerald-500/10 shadow-[0_4px_30px_rgba(16,185,129,0.05)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.15)]"
                    : "bg-red-500/5 border-red-500/10 shadow-[0_4px_30px_rgba(239,68,68,0.05)] hover:shadow-[0_20px_60px_rgba(239,68,68,0.15)]"
            )}
        >
            <div className="relative z-10 space-y-4 flex-1" style={{ transform: "translateZ(30px)" }}>
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
                    isSolution ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                    <item.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white tracking-tight">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 relative z-10" style={{ transform: "translateZ(10px)" }}>
                <span className={cn(
                    "text-xs font-mono font-black tracking-widest uppercase flex items-center gap-2",
                    isSolution ? "text-emerald-400" : "text-red-400"
                )}>
                    {isSolution ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {item.stats}
                </span>
            </div>

            {/* Hover Glow */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr",
                isSolution ? "from-emerald-500/10 to-transparent" : "from-red-500/10 to-transparent"
            )} />
        </motion.div>
    );
}

export function ProblemSolution() {
    return (
        <section id="how-it-works" className="py-32 bg-black relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container px-4 mx-auto max-w-7xl relative z-10">
                {/* Header */}
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-white italic">
                        L'Ancien Monde vs <span className="text-emerald-400 not-italic">Lumelia</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Ne laissez plus la friction opérationnelle tuer votre croissance. Passez du chaos à la précision chirurgicale.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start" style={{ perspective: "2000px" }}>

                    {/* The Old Way */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-red-500/20" />
                            <span className="text-red-400 font-mono text-xs font-black tracking-[0.3em] uppercase">L'Ancienne Méthode</span>
                            <div className="h-0.5 w-12 bg-red-500/20" />
                        </div>
                        <div className="grid gap-6">
                            {problems.map((p, i) => (
                                <Card key={i} item={p} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* The Lumelia Way */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-0.5 w-12 bg-emerald-500/20" />
                            <span className="text-emerald-400 font-mono text-xs font-black tracking-[0.3em] uppercase">La Méthode Lumelia</span>
                            <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-emerald-500/20" />
                        </div>
                        <div className="grid gap-6">
                            {solutions.map((s, i) => (
                                <Card key={i} item={s} isSolution index={i} />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
