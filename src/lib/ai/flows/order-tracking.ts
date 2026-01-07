// Order Tracking Flow - For e-commerce businesses
// Helps customers track their order status

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { FlowDefinition, FlowContext, ValidationResult } from "./types";

// Extract order ID from message
const extractOrderId = (text: string): string | null => {
  // Match patterns like #12345, 12345, ABC-12345
  const patterns = [
    /#?(\d{4,10})/,           // #12345 or 12345
    /([A-Z]{2,4}-?\d{4,8})/i, // ABC-12345 or ABC12345
    /commande\s*:?\s*#?(\d+)/i, // commande: 12345
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
};

// Mock order lookup (in production, this would query Shopify/WooCommerce)
interface OrderInfo {
  id: string;
  status: string;
  statusLabel: string;
  trackingUrl?: string;
  deliveryDate?: string;
  items?: string[];
}

const lookupOrder = async (_tenantId: string, orderId: string): Promise<OrderInfo | null> => {
  // In production, this would:
  // 1. Check tenant's e-commerce integration (Shopify, WooCommerce)
  // 2. Query the order from their API
  // 3. Return real order data

  // For demo purposes, return mock data based on order ID pattern
  const lastDigit = parseInt(orderId.slice(-1), 10);

  if (lastDigit === 0) {
    return null; // Order not found for IDs ending in 0
  }

  const statuses: Array<{ status: string; statusLabel: string; emoji: string }> = [
    { status: "pending", statusLabel: "En attente de paiement", emoji: "⏳" },
    { status: "processing", statusLabel: "En préparation", emoji: "📦" },
    { status: "shipped", statusLabel: "Expédiée", emoji: "🚚" },
    { status: "delivered", statusLabel: "Livrée", emoji: "✅" },
    { status: "cancelled", statusLabel: "Annulée", emoji: "❌" },
  ];

  const statusIndex = lastDigit % statuses.length;
  const orderStatus = statuses[statusIndex];

  return {
    id: orderId,
    status: orderStatus.status,
    statusLabel: `${orderStatus.emoji} ${orderStatus.statusLabel}`,
    trackingUrl: orderStatus.status === "shipped" ? `https://tracking.example.com/${orderId}` : undefined,
    deliveryDate: orderStatus.status === "shipped" ? "15 janvier 2026" : undefined,
    items: ["Article 1 x1", "Article 2 x2"],
  };
};

export const ORDER_TRACKING_FLOW: FlowDefinition = {
  type: "order_tracking",
  maxAttempts: 3,

  steps: {
    ask_order_id: {
      id: "ask_order_id",
      prompt: () => `Quel est votre numéro de commande ? 📦

(Ex: #12345 ou 12345)`,
      validate: (response: string): ValidationResult => {
        const orderId = extractOrderId(response);

        if (!orderId) {
          return {
            valid: false,
            errorMessage: "Je n'ai pas trouvé de numéro de commande. Pouvez-vous me le donner ? (ex: #12345)",
          };
        }

        return { valid: true, extractedValue: orderId };
      },
      next: () => "lookup_order",
    },

    lookup_order: {
      id: "lookup_order",
      prompt: async (ctx: FlowContext) => {
        const orderId = ctx.currentData.order_id as string;
        const order = await lookupOrder(ctx.tenant.id, orderId);

        if (!order) {
          // Store that order was not found
          return `Je n'ai pas trouvé la commande #${orderId}. 🔍

Vérifiez le numéro et réessayez, ou choisissez :
• Réessayer avec un autre numéro
• Contacter le support`;
        }

        // Build status message
        let message = `📦 Commande #${order.id}\n\nStatut : ${order.statusLabel}`;

        if (order.trackingUrl) {
          message += `\n📍 Suivi : ${order.trackingUrl}`;
        }

        if (order.deliveryDate) {
          message += `\n📅 Livraison prévue : ${order.deliveryDate}`;
        }

        message += "\n\nBesoin d'autre chose ?";

        return message;
      },
      validate: (response: string, _ctx: FlowContext): ValidationResult => {
        const lower = response.toLowerCase();

        // Check if they want to retry
        if (lower.includes("autre numéro") || lower.includes("réessayer") || lower.includes("reessayer")) {
          return { valid: true, extractedValue: "retry" };
        }

        // Check if they want support
        if (lower.includes("support") || lower.includes("aide") || lower.includes("contact")) {
          return { valid: true, extractedValue: "support" };
        }

        // Check if they're satisfied
        if (lower.includes("non") || lower.includes("merci") || lower.includes("ok") || lower.includes("parfait")) {
          return { valid: true, extractedValue: "done" };
        }

        // Any other response
        return { valid: true, extractedValue: "other" };
      },
      next: (data) => {
        const choice = data.lookup_order as string;

        if (choice === "retry") {
          return "ask_order_id"; // Go back to asking for order ID
        }

        if (choice === "support") {
          return "escalate";
        }

        // Done or other - end flow
        return null;
      },
    },

    escalate: {
      id: "escalate",
      prompt: () => "Je transfère votre demande à notre équipe. Vous serez recontacté(e) sous 24h. 🙋‍♂️",
      validate: (): ValidationResult => {
        return { valid: true, extractedValue: true };
      },
      next: () => null,
    },
  },

  onComplete: async (data: Record<string, unknown>, ctx: FlowContext): Promise<string> => {
    // Clear flow state
    await db.conversation.update({
      where: { id: ctx.conversation.id },
      data: {
        currentFlow: null,
        flowData: Prisma.JsonNull,
      },
    });

    const lookup = data.lookup_order as string;

    if (lookup === "support") {
      // Mark for escalation
      await db.conversation.update({
        where: { id: ctx.conversation.id },
        data: {
          status: "escalated",
          priority: "high",
        },
      });

      return "Un membre de notre équipe vous contactera très bientôt. Merci de votre patience ! 🙏";
    }

    return "N'hésitez pas si vous avez d'autres questions ! 😊";
  },

  onCancel: async (ctx: FlowContext): Promise<string> => {
    // Clear flow state
    await db.conversation.update({
      where: { id: ctx.conversation.id },
      data: {
        currentFlow: null,
        flowData: Prisma.JsonNull,
      },
    });

    return "Pas de souci ! N'hésitez pas si vous avez besoin de suivre une commande. 👋";
  },
};
