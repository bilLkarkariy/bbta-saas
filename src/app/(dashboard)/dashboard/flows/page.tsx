import { Zap, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FlowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Flows</h1>
        <Badge variant="secondary" className="gap-1">
          <Lock className="h-3 w-3" />
          Pro
        </Badge>
      </div>
      <Card className="p-12 text-center">
        <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Fonctionnalité Pro</h2>
        <p className="text-muted-foreground">
          Créez des automatisations avancées avec notre éditeur visuel de workflows.
        </p>
      </Card>
    </div>
  );
}
