"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Twitter, Linkedin, Github, ShieldCheck, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const footerLinks = {
    product: [
        { name: "Fonctionnalités", href: "#features" },
        { name: "Tarifs", href: "#pricing" },
        { name: "Intégrations", href: "#" },
        { name: "Mises à jour", href: "#" },
    ],
    company: [
        { name: "À propos", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Carrières", href: "#" },
        { name: "Contact", href: "#" },
    ],
    resources: [
        { name: "Documentation", href: "#" },
        { name: "Aide", href: "#" },
        { name: "API", href: "#" },
        { name: "Statut", href: "#" },
    ],
    legal: [
        { name: "Confidentialité", href: "#" },
        { name: "Conditions", href: "#" },
        { name: "Sécurité", href: "#" },
    ],
};

export function SiteFooter() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!/\S+@\S+\.\S+/.test(email)) {
            setStatus("error");
            return;
        }
        setStatus("success");
        setTimeout(() => {
            setStatus("idle");
            setEmail("");
        }, 3000);
    };

    return (
        <footer className="bg-black border-t border-white/5 pt-24 pb-12 overflow-hidden relative">
            {/* ... Background Decorative Element ... */}
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[120%] h-48 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container px-4 mx-auto max-w-7xl relative z-10">
                {/* ... grid and brand column ... */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-20">
                    <div className="col-span-2 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform">
                                <span className="text-white font-bold text-lg">L</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                Lumelia
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                            La plateforme d'automatisation intelligente pour les entreprises qui veulent scaler leur communication WhatsApp.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                                <Twitter className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                                <Linkedin className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                                <Github className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title} className="col-span-1">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-6">
                                {title === "product" ? "Produit" : title === "company" ? "Entreprise" : title === "resources" ? "Ressources" : "Légal"}
                            </h4>
                            <ul className="space-y-4">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href} className="text-sm text-muted-foreground hover:text-white transition-colors">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-12 border-y border-white/5 items-center">
                    <div>
                        <h4 className="text-lg font-bold text-white mb-2">Restez à jour</h4>
                        <p className="text-muted-foreground text-sm mb-4">Recevez nos dernières mises à jour et conseils d'IA.</p>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    className={cn(
                                        "flex-1 bg-white/5 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all",
                                        status === "error" ? "border-red-500 focus:ring-red-500/50" : "border-white/10 focus:ring-primary/50"
                                    )}
                                />
                                <Button type="submit" size="sm" className={cn(
                                    status === "success" && "bg-emerald-500 hover:bg-emerald-600"
                                )}>
                                    {status === "success" ? "C'est prêt !" : "S'abonner"}
                                </Button>
                            </div>
                            {status === "error" && (
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">Email invalide</p>
                            )}
                        </form>
                    </div>
                    {/* ... trust indicators ... */}

                    <div className="flex flex-wrap gap-8 justify-start lg:justify-end opacity-40 grayscale hover:opacity-100 transition-all">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white">SOC2 Type II</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white">RGPD Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white">256-bit SSL</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} Lumelia SaaS. Fait avec passion pour les entreprises modernes.</p>
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Tous les systèmes sont opérationnels
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
