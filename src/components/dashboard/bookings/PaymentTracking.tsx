"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Euro, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentTrackingProps {
  bookingId: string;
  initialAmount?: number | null;
  initialCurrency?: string | null;
  initialPaymentStatus?: string;
  initialPaymentMethod?: string | null;
  initialPaidAt?: Date | null;
}

export function PaymentTracking({
  bookingId,
  initialAmount,
  initialCurrency = "EUR",
  initialPaymentStatus = "unpaid",
  initialPaymentMethod,
  initialPaidAt,
}: PaymentTrackingProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [amount, setAmount] = useState(initialAmount?.toString() || "");
  const [currency, setCurrency] = useState(initialCurrency || "EUR");
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod || "");

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount ? parseFloat(amount) : null,
          currency,
          paymentStatus,
          paymentMethod: paymentMethod || null,
          paidAt: paymentStatus === "paid" ? new Date().toISOString() : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update payment");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating payment:", error);
      alert("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = () => {
    switch (paymentStatus) {
      case "paid":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Payé
          </Badge>
        );
      case "deposit":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Acompte
          </Badge>
        );
      case "unpaid":
      default:
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Non payé
          </Badge>
        );
    }
  };

  return (
    <Card className="glass shadow-layered">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-heading flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Paiement
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-[var(--dashboard-card-padding)] space-y-4">
        {isEditing ? (
          <>
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Montant</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                />
                <Select value={currency} onValueChange={setCurrency} disabled={loading}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label htmlFor="payment-status">Statut du paiement</Label>
              <Select
                value={paymentStatus}
                onValueChange={setPaymentStatus}
                disabled={loading}
              >
                <SelectTrigger id="payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Non payé</SelectItem>
                  <SelectItem value="deposit">Acompte versé</SelectItem>
                  <SelectItem value="paid">Payé intégralement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">Moyen de paiement</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                disabled={loading}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                  <SelectItem value="online">Paiement en ligne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form
                  setAmount(initialAmount?.toString() || "");
                  setCurrency(initialCurrency || "EUR");
                  setPaymentStatus(initialPaymentStatus);
                  setPaymentMethod(initialPaymentMethod || "");
                }}
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Display Mode */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-label">Montant</p>
              </div>
              <p className="text-body-strong">
                {initialAmount
                  ? `${initialAmount.toFixed(2)} ${initialCurrency}`
                  : "Non renseigné"}
              </p>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-label">Statut</p>
              <div>{getPaymentStatusBadge()}</div>
            </div>

            {initialPaymentMethod && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-label">Moyen de paiement</p>
                  <p className="text-body-strong">
                    {initialPaymentMethod === "cash" && "Espèces"}
                    {initialPaymentMethod === "card" && "Carte bancaire"}
                    {initialPaymentMethod === "transfer" && "Virement"}
                    {initialPaymentMethod === "online" && "Paiement en ligne"}
                  </p>
                </div>
              </>
            )}

            {initialPaidAt && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-label">Payé le</p>
                  </div>
                  <p className="text-body-strong">
                    {new Date(initialPaidAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
