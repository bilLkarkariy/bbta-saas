// Colissimo Integration Provider
// Track packages shipped via Colissimo (La Poste)

import type {
  ShippingIntegration,
  IntegrationCredentials,
  HealthCheckResult,
} from "../types";

interface ColissimoCredentials extends IntegrationCredentials {
  contractNumber?: string;
  password?: string;
}

/**
 * Colissimo integration for tracking French postal packages
 */
export const colissimoProvider: ShippingIntegration = {
  type: "colissimo",
  category: "shipping",
  name: "Colissimo",
  description: "Suivi des colis Colissimo en temps réel",
  icon: "Package",

  credentialFields: [
    {
      key: "contractNumber",
      label: "Numéro de contrat",
      type: "text",
      placeholder: "123456",
      required: true,
      helpText: "Votre numéro de contrat Colissimo professionnel",
    },
    {
      key: "password",
      label: "Mot de passe",
      type: "password",
      required: true,
      helpText: "Mot de passe de votre compte Colissimo API",
    },
  ],

  async validateCredentials(credentials: ColissimoCredentials) {
    if (!credentials.contractNumber) {
      return { valid: false, error: "Le numéro de contrat est requis" };
    }

    if (!credentials.password) {
      return { valid: false, error: "Le mot de passe est requis" };
    }

    return { valid: true };
  },

  async healthCheck(credentials: ColissimoCredentials): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      if (!credentials.contractNumber || !credentials.password) {
        return {
          healthy: false,
          message: "Identifiants manquants",
        };
      }

      // In production, make a test API call to Colissimo
      // For now, simulate a health check
      const latencyMs = Date.now() - start;

      return {
        healthy: true,
        message: "Connecté à Colissimo",
        latencyMs,
        details: {
          contractNumber: credentials.contractNumber,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Erreur de connexion",
        latencyMs: Date.now() - start,
      };
    }
  },

  async trackPackage(_credentials: ColissimoCredentials, trackingNumber: string) {
    // In production, call Colissimo tracking API
    // API endpoint: https://www.coliposte.fr/tracking-chargeur/laposte/v1/parcel/track

    try {
      // For demo, return mock tracking data based on tracking number pattern
      const lastDigit = parseInt(trackingNumber.slice(-1), 10);

      // Simulate different statuses based on tracking number
      const statuses = [
        {
          status: "in_transit",
          statusLabel: "🚚 En cours de livraison",
          delivered: false,
          events: [
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: "Pris en charge par La Poste", location: "Paris" },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), description: "En cours d'acheminement", location: "Hub Île-de-France" },
            { date: new Date(), description: "Arrivé dans votre ville", location: "Bureau de poste local" },
          ],
          estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        {
          status: "delivered",
          statusLabel: "✅ Livré",
          delivered: true,
          deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          events: [
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), description: "Pris en charge par La Poste", location: "Lyon" },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: "En cours d'acheminement" },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), description: "Arrivé au bureau de poste", location: "Bureau de poste" },
            { date: new Date(Date.now() - 2 * 60 * 60 * 1000), description: "Remis au destinataire" },
          ],
        },
        {
          status: "out_for_delivery",
          statusLabel: "📦 En cours de livraison",
          delivered: false,
          events: [
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: "Pris en charge par La Poste", location: "Marseille" },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), description: "En cours d'acheminement" },
            { date: new Date(), description: "En cours de livraison par le facteur" },
          ],
          estimatedDelivery: new Date(),
        },
        {
          status: "pending_pickup",
          statusLabel: "📍 À retirer",
          delivered: false,
          events: [
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), description: "Pris en charge par La Poste", location: "Bordeaux" },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), description: "Avis de passage déposé" },
            { date: new Date(), description: "Disponible en bureau de poste", location: "Bureau de poste 33000" },
          ],
        },
        {
          status: "returned",
          statusLabel: "↩️ Retourné",
          delivered: false,
          events: [
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), description: "Pris en charge par La Poste", location: "Toulouse" },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), description: "Tentative de livraison échouée" },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), description: "Colis retourné à l'expéditeur" },
          ],
        },
      ];

      if (isNaN(lastDigit)) {
        return null; // Invalid tracking number
      }

      const statusIndex = lastDigit % statuses.length;
      return statuses[statusIndex];
    } catch (error) {
      console.error("[Colissimo] Error tracking package:", error);
      return null;
    }
  },

  getTrackingUrl(trackingNumber: string): string {
    return `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(trackingNumber)}`;
  },
};
