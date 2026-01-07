// Shopify Integration Provider
// Syncs orders, products, and customers from Shopify stores

import type {
  EcommerceIntegration,
  IntegrationCredentials,
  HealthCheckResult,
} from "../types";

interface ShopifyCredentials extends IntegrationCredentials {
  shopDomain?: string;
  accessToken?: string;
  apiVersion?: string;
}

// Note: ShopifyConfig interface (syncOrders, syncProducts, webhookEnabled)
// will be added when settings UI is implemented

/**
 * Shopify integration for e-commerce businesses
 */
export const shopifyProvider: EcommerceIntegration = {
  type: "shopify",
  category: "ecommerce",
  name: "Shopify",
  description: "Synchronisez commandes, produits et clients depuis Shopify",
  icon: "ShoppingBag",

  credentialFields: [
    {
      key: "shopDomain",
      label: "Domaine de la boutique",
      type: "text",
      placeholder: "ma-boutique.myshopify.com",
      required: true,
      helpText: "Le domaine de votre boutique Shopify (sans https://)",
    },
    {
      key: "accessToken",
      label: "Token d'accès API",
      type: "password",
      placeholder: "shpat_xxxxxxxxxx",
      required: true,
      helpText: "Créez une app privée dans Shopify Admin > Apps > Develop apps",
    },
  ],

  configFields: [
    {
      key: "syncOrders",
      label: "Synchroniser les commandes",
      type: "checkbox",
      defaultValue: true,
    },
    {
      key: "syncProducts",
      label: "Synchroniser les produits",
      type: "checkbox",
      defaultValue: true,
    },
    {
      key: "webhookEnabled",
      label: "Activer les webhooks",
      type: "checkbox",
      defaultValue: false,
    },
  ],

  async validateCredentials(credentials: ShopifyCredentials) {
    if (!credentials.shopDomain) {
      return { valid: false, error: "Le domaine de la boutique est requis" };
    }

    if (!credentials.accessToken) {
      return { valid: false, error: "Le token d'accès est requis" };
    }

    // Validate domain format
    const domainRegex = /^[\w-]+\.myshopify\.com$/;
    if (!domainRegex.test(credentials.shopDomain)) {
      return {
        valid: false,
        error: "Format de domaine invalide. Utilisez: ma-boutique.myshopify.com",
      };
    }

    return { valid: true };
  },

  async healthCheck(credentials: ShopifyCredentials): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      if (!credentials.shopDomain || !credentials.accessToken) {
        return {
          healthy: false,
          message: "Identifiants manquants",
        };
      }

      // Make a test API call to Shopify
      const response = await fetch(
        `https://${credentials.shopDomain}/admin/api/2024-01/shop.json`,
        {
          headers: {
            "X-Shopify-Access-Token": credentials.accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        return {
          healthy: false,
          message: `Erreur Shopify: ${response.status} ${response.statusText}`,
          latencyMs,
        };
      }

      const data = await response.json();

      return {
        healthy: true,
        message: `Connecté à ${data.shop?.name || credentials.shopDomain}`,
        latencyMs,
        details: {
          shopName: data.shop?.name,
          email: data.shop?.email,
          domain: data.shop?.domain,
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

  async getOrder(credentials: ShopifyCredentials, orderId: string) {
    if (!credentials.shopDomain || !credentials.accessToken) {
      return null;
    }

    try {
      // Clean up order ID (remove # prefix if present)
      const cleanOrderId = orderId.replace(/^#/, "");

      // Try to find order by order number first
      const searchResponse = await fetch(
        `https://${credentials.shopDomain}/admin/api/2024-01/orders.json?name=${cleanOrderId}&status=any`,
        {
          headers: {
            "X-Shopify-Access-Token": credentials.accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!searchResponse.ok) {
        console.error("[Shopify] Order search failed:", searchResponse.status);
        return null;
      }

      const searchData = await searchResponse.json();
      const order = searchData.orders?.[0];

      if (!order) {
        return null;
      }

      // Map Shopify status to friendly labels
      const statusMap: Record<string, string> = {
        pending: "⏳ En attente",
        authorized: "💳 Autorisé",
        partially_paid: "💰 Partiellement payé",
        paid: "✅ Payé",
        partially_refunded: "↩️ Partiellement remboursé",
        refunded: "↩️ Remboursé",
        voided: "❌ Annulé",
      };

      const fulfillmentStatusMap: Record<string, string> = {
        fulfilled: "📦 Expédié",
        partial: "📦 Partiellement expédié",
        unfulfilled: "🔄 En préparation",
        restocked: "↩️ Retourné",
      };

      // Get tracking info from fulfillments
      let trackingNumber: string | undefined;
      let trackingUrl: string | undefined;

      if (order.fulfillments?.length > 0) {
        const fulfillment = order.fulfillments[0];
        trackingNumber = fulfillment.tracking_number;
        trackingUrl = fulfillment.tracking_url;
      }

      return {
        id: order.name || order.id.toString(),
        status: order.fulfillment_status || "unfulfilled",
        statusLabel:
          fulfillmentStatusMap[order.fulfillment_status || "unfulfilled"] ||
          statusMap[order.financial_status] ||
          order.fulfillment_status ||
          "En cours",
        items: order.line_items.map((item: { name: string; quantity: number; price: string }) => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        total: parseFloat(order.total_price),
        trackingNumber,
        trackingUrl,
        estimatedDelivery: undefined, // Shopify doesn't provide this directly
      };
    } catch (error) {
      console.error("[Shopify] Error fetching order:", error);
      return null;
    }
  },

  async getCustomerOrders(
    credentials: ShopifyCredentials,
    customerEmail?: string,
    customerPhone?: string,
    limit = 10
  ) {
    if (!credentials.shopDomain || !credentials.accessToken) {
      return [];
    }

    try {
      // Build query params
      const params = new URLSearchParams({
        status: "any",
        limit: limit.toString(),
      });

      // Note: Shopify API doesn't support direct email/phone search on orders
      // In production, you'd first search customers, then get their orders
      const response = await fetch(
        `https://${credentials.shopDomain}/admin/api/2024-01/orders.json?${params}`,
        {
          headers: {
            "X-Shopify-Access-Token": credentials.accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      // Filter by email/phone if provided
      let orders = data.orders || [];

      if (customerEmail) {
        orders = orders.filter(
          (o: { email?: string }) => o.email?.toLowerCase() === customerEmail.toLowerCase()
        );
      }

      if (customerPhone) {
        const cleanPhone = customerPhone.replace(/\D/g, "");
        orders = orders.filter((o: { phone?: string }) => o.phone?.replace(/\D/g, "").includes(cleanPhone));
      }

      return orders.map((order: { name: string; id: number; fulfillment_status?: string; created_at: string; total_price: string }) => ({
        id: order.name || order.id.toString(),
        status: order.fulfillment_status || "unfulfilled",
        createdAt: new Date(order.created_at),
        total: parseFloat(order.total_price),
      }));
    } catch (error) {
      console.error("[Shopify] Error fetching customer orders:", error);
      return [];
    }
  },

  async getProduct(credentials: ShopifyCredentials, productId: string) {
    if (!credentials.shopDomain || !credentials.accessToken) {
      return null;
    }

    try {
      const response = await fetch(
        `https://${credentials.shopDomain}/admin/api/2024-01/products/${productId}.json`,
        {
          headers: {
            "X-Shopify-Access-Token": credentials.accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const product = data.product;

      if (!product) {
        return null;
      }

      // Check if any variant is in stock
      const inStock = product.variants.some(
        (v: { inventory_quantity?: number }) => (v.inventory_quantity || 0) > 0
      );

      return {
        id: product.id.toString(),
        name: product.title,
        price: parseFloat(product.variants[0]?.price || "0"),
        inStock,
        variants: product.variants.map((v: { id: number; title: string; inventory_quantity?: number }) => ({
          id: v.id.toString(),
          name: v.title,
          available: (v.inventory_quantity || 0) > 0,
        })),
      };
    } catch (error) {
      console.error("[Shopify] Error fetching product:", error);
      return null;
    }
  },

  async checkStock(credentials: ShopifyCredentials, productId: string, variantId?: string) {
    if (!credentials.shopDomain || !credentials.accessToken) {
      return { available: false };
    }

    try {
      const product = await this.getProduct(credentials, productId);

      if (!product) {
        return { available: false };
      }

      if (variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === variantId);
        return { available: variant?.available || false };
      }

      return { available: product.inStock };
    } catch {
      return { available: false };
    }
  },
};
