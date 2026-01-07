import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageSquare, Calendar, UserPlus } from "lucide-react";

interface ActivityItem {
    id: string;
    type: "message" | "booking" | "contact";
    user: {
        name: string;
        avatar?: string;
        initials: string;
    };
    content: string;
    time: string;
}

const activities: ActivityItem[] = [
    {
        id: "1",
        type: "message",
        user: { name: "Marie Dupont", initials: "MD" },
        content: "Bonjour, avez-vous des disponibilités pour...",
        time: "il y a 2 min"
    },
    {
        id: "2",
        type: "booking",
        user: { name: "Jean Pierre", initials: "JP" },
        content: "Nouveau rendez-vous pour Consultation...",
        time: "il y a 15 min"
    },
    {
        id: "3",
        type: "contact",
        user: { name: "Sophie Martin", initials: "SM" },
        content: "Nouveau lead ajouté depuis le Site Web",
        time: "il y a 1h"
    },
    {
        id: "4",
        type: "message",
        user: { name: "Paul Rogers", initials: "PR" },
        content: "Merci pour votre réponse rapide!",
        time: "il y a 2h"
    },
];

export function RecentActivity() {
    return (
        <Card className="glass-card flex-1 min-h-[300px] border-white/10 dark:border-white/5">
            <CardHeader>
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    Activité Récente
                    <span className="text-xs text-primary cursor-pointer hover:underline">Voir tout</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 group cursor-pointer">
                        <Avatar className="h-8 w-8 border border-white/10 mt-0.5">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{activity.user.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{activity.user.name}</p>
                                <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{activity.content}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
