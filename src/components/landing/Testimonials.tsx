"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import Image from "next/image";

const testimonials = [
    {
        name: "DAF, Daspren",
        role: "Industrie",
        content: "Avant, ma responsable administrative passait ses vendredis à vérifier les factures. Lumelia a détecté une hausse tarifaire de 15% non contractuelle dès la première semaine.",
        avatar: "/testimonials/avatar-thomas.png",
    },
    {
        name: "Sébastien Bireaud",
        role: "Directeur, Olife",
        content: "Mon expert-comptable ne me relance plus pour les pièces manquantes. L'IA harcèle gentiment les managers pour valider leurs achats. Je gagne 4h par semaine.",
        avatar: "/testimonials/avatar-marc.png",
    },
];

export function Testimonials() {
    return (
        <section className="py-32 bg-black relative overflow-hidden">
            <div className="container px-4 mx-auto max-w-7xl relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
                        Ils nous font confiance.
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Découvrez comment Lumelia sécurise la rentabilité des PME et libère leurs équipes administratives.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm relative group hover:bg-white/10 transition-all duration-300"
                        >
                            <div className="absolute -top-4 -left-4 p-3 rounded-2xl bg-primary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Quote className="w-5 h-5 text-white" />
                            </div>

                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                ))}
                            </div>

                            <p className="text-lg text-foreground leading-relaxed mb-8 italic">
                                &quot;{t.content}&quot;
                            </p>

                            <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                                    <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{t.name}</h4>
                                    <p className="text-sm text-muted-foreground">{t.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
