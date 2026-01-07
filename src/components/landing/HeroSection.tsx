"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Play, CheckCircle, Star, Users, Zap } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LazyChartWidget } from "@/components/dashboard/charts/LazyChart";
import { IconMessages, IconContacts } from "@/components/dashboard/DashboardIcons";
import { Magnetic } from "@/components/ui/Magnetic";

export function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, -150]); // Move UP for parallax reveal
    const rotateX = useTransform(scrollYProgress, [0, 0.4], [15, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.4], [0.95, 1]);

    return (
        <section ref={containerRef} className="relative min-h-[140vh] pt-40 overflow-hidden bg-black">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        background: [
                            "radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
                            "radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
                            "radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
                        ]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                />
                <div className="absolute inset-0 bg-[url('/landing/hero-aurora.png')] bg-cover opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
            </div>

            <div className="container relative z-10 px-4 mx-auto text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-mono text-white tracking-widest uppercase">Public Beta Disponible</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 leading-[1.1]"
                >
                    Convertissez 3x plus <br /> de leads sans recruter.
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
                >
                    Automatisez vos conversations WhatsApp avec une precision chirurgicale. Repondez instantanement, qualifiez vos prospects et boostez votre ROI 24h/24.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12"
                >
                    <Magnetic>
                        <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] group relative overflow-hidden">
                            <span className="relative z-10 flex items-center">
                                Demarrer gratuitement
                                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </Button>
                    </Magnetic>
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white hover:scale-105 transition-all">
                        <Play className="mr-2 w-4 h-4 fill-white" />
                        Voir la demo
                    </Button>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap gap-8 items-center justify-center opacity-60 mb-20"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                        </div>
                        <span className="text-xs font-medium text-white tracking-wide">Sans engagement</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            ))}
                        </div>
                        <span className="text-xs font-medium text-white tracking-wide">4.9/5 sur G2</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-white tracking-wide">+2,000 equipes</span>
                    </div>
                </motion.div>

                {/* Mini Social Proof near CTAs */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs font-mono text-muted-foreground/60 tracking-[0.3em] uppercase mb-20"
                >
                    ILS ACCELERENT LEUR CROISSANCE AVEC LUMELIA
                </motion.p>

                {/* 3D Dashboard Mock - Entrance Wrapper */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    className="relative max-w-5xl mx-auto perspective-1000"
                >
                    {/* Scroll-Reactive Inner Layer */}
                    <motion.div
                        style={{
                            y,
                            rotateX,
                            scale,
                            perspective: "1000px"
                        }}
                    >
                        {/* Floating UI Elements */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-12 -right-8 z-30 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl shadow-2xl"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-emerald-400 font-mono tracking-tight cursor-default">ROI +300%</span>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute top-1/4 -left-12 z-30 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-xl shadow-2xl"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-primary" />
                                <span className="text-xs font-bold text-white font-mono tracking-tight cursor-default">Lead Qualifie</span>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                            className="absolute bottom-1/4 -right-16 z-30 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
                        >
                            <div className="flex items-center gap-2">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs font-bold text-white/80 font-mono tracking-tight cursor-default">Sync CRM</span>
                            </div>
                        </motion.div>

                        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_100px_oklch(var(--primary)/20%)] bg-zinc-900/60 backdrop-blur-3xl p-4 md:p-8">
                            {/* Device Frame Overlay (Placeholder/Faked) */}
                            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10 rounded-3xl" />

                            {/* Content - Actual Dashboard Components */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left relative z-10">
                                <div className="md:col-span-1 space-y-6">
                                    <StatsCard
                                        title="Total Messages"
                                        value="12,842"
                                        trend="12.5%"
                                        trendUp={true}
                                        icon={<IconMessages className="w-4 h-4" />}
                                        variant="glass"
                                    />
                                    <StatsCard
                                        title="Nouveaux Contacts"
                                        value="832"
                                        trend="8.2%"
                                        trendUp={true}
                                        icon={<IconContacts className="w-4 h-4" />}
                                        variant="glass"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <LazyChartWidget />
                                </div>
                            </div>
                        </div>

                        {/* Glowing Orbs around the device */}
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full" />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
