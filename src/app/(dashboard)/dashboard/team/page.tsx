import { UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Équipe</h1>
      <Card className="p-12 text-center">
        <UsersRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Bientôt disponible</h2>
        <p className="text-muted-foreground">
          Invitez des membres de votre équipe et gérez les permissions.
        </p>
      </Card>
    </div>
  );
}
