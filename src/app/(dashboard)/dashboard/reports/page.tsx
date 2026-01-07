import { LineChart } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Rapports</h1>
      <Card className="p-12 text-center">
        <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Bientôt disponible</h2>
        <p className="text-muted-foreground">
          Générez des rapports personnalisés sur vos campagnes et conversations.
        </p>
      </Card>
    </div>
  );
}
