"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { QrCode, Settings, DollarSign, type LucideIcon } from "lucide-react";

interface Step {
    id: number;
    title: string;
    description: string;
    icon: LucideIcon;
}

const steps = [
    {
        id: 1,
        title: "Connexion (Jours 1-5)",
        description: "Connexion sécurisée à vos boîtes mails facturation, Drive et outils bancaires. Analyse de l'historique pour détecter les récurrences.",
        icon: QrCode,
    },
    {
        id: 2,
        title: "Règles de Gestion (Jours 6-15)",
        description: "Définition des seuils : Qui valide quoi ? À partir de quel montant ? Quels écarts de prix sont tolérés ?",
        icon: Settings,
    },
    {
        id: 3,
        title: "Pilotage Automatique (Jours 16+)",
        description: "L'IA intercepte, contrôle et prépare. Vous ne gérez plus que les exceptions et le clic final de paiement.",
        icon: DollarSign,
    },
];

export function InteractiveDemo() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    return (
        <section ref={containerRef} className="bg-black py-32 relative overflow-hidden">
            {/* Background Decorative Blur */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container px-4 mx-auto max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-32">

                    {/* Left Content */}
                    <div className="lg:w-1/2">
                        <div className="sticky top-32 space-y-12">
                            <div className="mb-12">
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
                                    PAS DE PROJET IT COMPLEXE. JUSTE DES RÉSULTATS.
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Compatible avec votre banque, vos mails et votre expert-comptable.
                                </p>
                            </div>

                            <div className="relative space-y-32 pl-12">
                                {/* Vertical Progress Line */}
                                <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-white/10 overflow-hidden">
                                    <motion.div
                                        className="bg-primary w-full origin-top h-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                        style={{ scaleY: scrollYProgress }}
                                    />
                                </div>

                                {steps.map((step, index) => (
                                    <StepText key={step.id} step={step} index={index + 1} scrollProgress={scrollYProgress} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Visuals */}
                    <div className="lg:w-1/2 pt-32 lg:pt-0">
                        <div className="sticky top-32 h-[500px] w-full bg-gradient-to-br from-white/5 to-white/0 rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden flex items-center justify-center p-8 shadow-2xl">
                            {/* Dynamic Visual Content */}
                            <Visuals index={scrollYProgress} />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

function StepText({ step, index, scrollProgress }: { step: Step, index: number, scrollProgress: MotionValue<number> }) {
    // Calculate if this step is "active" based on scroll progress
    const threshold = (index - 1) / 3;
    const opacity = useTransform(scrollProgress, [threshold - 0.1, threshold, threshold + 0.3, threshold + 0.4], [0.3, 1, 1, 0.3]);
    const scale = useTransform(scrollProgress, [threshold - 0.1, threshold, threshold + 0.3, threshold + 0.4], [0.95, 1, 1, 0.95]);

    return (
        <motion.div style={{ opacity, scale }} className="flex gap-8 relative">
            <div className="absolute -left-12 w-12 h-12 rounded-full bg-black border-2 border-primary/20 flex items-center justify-center text-lg font-mono font-bold text-white z-10 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                {index}
            </div>
            <div>
                <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{step.description}</p>
            </div>
        </motion.div>
    )
}

function Visuals({ index }: { index: MotionValue<number> }) {
    const opacity1 = useTransform(index, [0, 0.2, 0.38], [1, 1, 0]);
    const opacity2 = useTransform(index, [0.32, 0.45, 0.65, 0.78], [0, 1, 1, 0]);
    const opacity3 = useTransform(index, [0.72, 0.85, 1], [0, 1, 1]);

    const scale1 = useTransform(index, [0, 0.38], [1, 0.8]);
    const scale2 = useTransform(index, [0.32, 0.45, 0.65, 0.78], [0.8, 1, 1, 0.8]);
    const scale3 = useTransform(index, [0.72, 1], [0.8, 1]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">

            {/* Slide 1: Connection */}
            <motion.div style={{ opacity: opacity1, scale: scale1 }} className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="w-56 h-56 bg-white p-6 rounded-2xl mb-8 shadow-[0_0_60px_rgba(255,255,255,0.1)] relative group flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                            <span className="text-blue-600 font-bold">@</span>
                        </div>
                        <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                            <span className="text-emerald-600 font-bold">€</span>
                        </div>
                        <div className="w-16 h-16 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shadow-sm">
                            <span className="text-purple-600 font-bold">📂</span>
                        </div>
                        <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm">
                            <span className="text-amber-600 font-bold">🏦</span>
                        </div>
                    </div>
                </div>
                <h4 className="text-2xl font-bold text-white">Flux Sécurisés</h4>
                <div className="mt-6 flex items-center gap-3 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono font-black tracking-widest uppercase">SYNCHRONISATION EN COURS...</span>
                </div>
            </motion.div>

            {/* Slide 2: Rules Config */}
            <motion.div style={{ opacity: opacity2, scale: scale2 }} className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm space-y-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white">Seuil de Validation</span>
                            <div className="text-primary text-sm font-black tracking-widest px-2 py-1 bg-primary/10 rounded">&gt; 500€</div>
                        </div>
                        <p className="text-xs text-muted-foreground">Approbation DG requise automatiquement.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white">Écart de Prix Toléré</span>
                            <span className="text-emerald-400 text-sm font-black uppercase tracking-widest px-2 py-1 bg-emerald-400/10 rounded">2% Max</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Alerte immédiate si &gt; 2% vs Devis.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white">Catégorisation Analytique</span>
                            <div className="w-12 h-6 rounded-full bg-emerald-500 p-1 flex justify-end">
                                <div className="w-4 h-4 rounded-full bg-white shadow-lg shadow-white/30" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Imputation automatique par dossier.</p>
                    </div>
                </div>
            </motion.div>

            {/* Slide 3: Growth */}
            <motion.div style={{ opacity: opacity3, scale: scale3 }} className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        className="text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 mb-4 tracking-tighter"
                    >
                        -80%
                    </motion.div>
                    <p className="text-xl font-bold text-white mb-12">Temps de Traitement Admin</p>

                    {/* Simulated Graph */}
                    <div className="flex items-end gap-3 h-40">
                        {[40, 60, 45, 75, 85, 95, 110, 130, 150].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                whileInView={{ height: `${(h / 150) * 100}%` }}
                                transition={{ delay: i * 0.1, duration: 0.8 }}
                                className="w-8 bg-gradient-to-t from-emerald-500/10 via-emerald-500/40 to-emerald-500 rounded-t-lg relative"
                            >
                                {i === 8 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-400">ROI</div>}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

        </div>
    )
}
