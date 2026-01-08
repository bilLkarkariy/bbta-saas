"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import Image from "next/image";

export function FounderVision() {
    return (
        <section id="about" className="py-32 bg-black relative overflow-hidden">
            <div className="container px-4 mx-auto max-w-7xl relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Founder Profile Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="lg:w-1/3 relative"
                    >
                        <div className="aspect-[4/5] relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                            {/* Placeholder for Founder Photo - Using a stylistic representation or actual photo if available */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                <span className="text-white/20 font-bold text-4xl">Billel Helali</span>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
                        <div className="absolute -top-6 -left-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
                            <span className="text-xs font-mono text-white/60">Fondateur de Lumelia</span>
                        </div>
                    </motion.div>

                    {/* Content */}
                    <div className="lg:w-2/3">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white leading-tight">
                                POURQUOI L&apos;IA EST MEILLEURE QUE L&apos;HUMAIN POUR LE CONTRÔLE ?
                            </h2>

                            <div className="relative">
                                <Quote className="absolute -top-8 -left-8 w-16 h-16 text-primary/10 -rotate-12" />
                                <p className="text-2xl md:text-3xl font-medium text-white/90 italic leading-relaxed relative z-10">
                                    &quot;Personne n&apos;aime vérifier des factures ligne par ligne. C&apos;est répétitif, c&apos;est ingrat, et c&apos;est là qu&apos;on fait des erreurs. Pour une IA, c&apos;est le travail parfait.&quot;
                                </p>
                            </div>

                            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                                <p>
                                    En tant que père de deux garçons autistes, j&apos;ai appris que la force réside dans la <strong className="text-white">rigueur absolue</strong> et l&apos;absence de jugement.
                                </p>
                                <p>
                                    Clarté. Patience infinie. Précision au centime près.
                                </p>
                                <p>
                                    Ce ne sont pas juste des valeurs. C&apos;est l&apos;ADN de l&apos;agent Lumelia qui protège votre trésorerie. Il ne se fatigue jamais, ne laisse rien passer, et ne se plaint pas.
                                </p>
                            </div>

                            <div className="pt-8 flex items-center gap-4">
                                <div className="h-px w-12 bg-primary/30" />
                                <span className="text-white font-bold tracking-widest uppercase text-sm">Billel Helali, Fondateur</span>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
