"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
    {
        label: "Économisées / semaine",
        value: 10,
        suffix: "H",
        description: "Temps administratif libéré",
    },
    {
        label: "Factures auditées",
        value: 100,
        suffix: "%",
        description: "Contrôle total sur vos achats",
    },
    {
        label: "Payé en trop",
        value: 0,
        prefix: "€",
        description: "Grâce à une détection proactive",
    },
    {
        label: "Visibilité Trésorerie",
        value: 1,
        prefix: "J+",
        description: "Anticipation des décaissements",
    },
];

export function StatsSection() {
    return (
        <section id="roi" className="py-24 bg-black relative overflow-hidden">
            <div className="container px-4 mx-auto max-w-7xl relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <StatCard key={i} stat={stat} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatCard({ stat, index }: { stat: typeof stats[0], index: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (isInView) {
            const duration = 2000;
            const steps = 60;
            const stepValue = stat.value / steps;
            let current = 0;
            const timer = setInterval(() => {
                current += stepValue;
                if (current >= stat.value) {
                    setCount(stat.value);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(current));
                }
            }, duration / steps);
            return () => clearInterval(timer);
        }
    }, [isInView, stat.value]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm text-center group hover:bg-white/10 transition-all duration-500"
        >
            <div className="text-4xl md:text-5xl font-black text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                {stat.prefix}{count}{stat.suffix}
            </div>
            <div className="text-sm font-bold text-primary uppercase tracking-widest mb-2">
                {stat.label}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
                {stat.description}
            </p>
        </motion.div>
    );
}
