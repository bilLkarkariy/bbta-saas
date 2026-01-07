import { Target } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Pipeline</h1>
      <Card className="p-12 text-center">
        <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Bientôt disponible</h2>
        <p className="text-muted-foreground">
          Suivez vos prospects et opportunités dans un pipeline visuel.
        </p>
      </Card>
    </div>
  );
}
