"use client";

import { motion } from "framer-motion";

const companies = [
    { name: "DataFlow", logo: "/logos/dataflow.svg" },
    { name: "SalesHub", logo: "/logos/saleshub.svg" },
    { name: "LeadGen Pro", logo: "/logos/leadgen.svg" },
    { name: "NexTrade", logo: "/logos/nextrade.svg" },
    { name: "GrowthLog", logo: "/logos/growthlog.svg" },
    { name: "PulseKit", logo: "/logos/pulsekit.svg" },
];

export function SocialProof() {
    return (
        <section className="py-20 bg-black border-y border-white/5 relative overflow-hidden">
            <div className="container px-4 mx-auto max-w-7xl relative z-10 flex flex-col items-center">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground mb-12 animate-pulse">
                    LA FIN DE LA &quot;BOÎTE À CHAUSSURES&quot; NUMÉRIQUE.
                </p>

                <div className="w-full relative">
                    {/* Gradient Overlays */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-20" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-20" />

                    <motion.div
                        className="flex gap-24 items-center whitespace-nowrap"
                        animate={{ x: [0, -1035] }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        {[...companies, ...companies, ...companies].map((c, i) => (
                            <div key={i} className="flex items-center gap-3 group opacity-50 hover:opacity-100 transition-all duration-500 hover:scale-110">
                                <img
                                    src={c.logo}
                                    alt={c.name}
                                    className="h-8 w-auto opacity-70 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
