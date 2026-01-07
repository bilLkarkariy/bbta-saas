// Vertical E-commerce Configuration
// For online stores using Shopify, WooCommerce, etc.

import type { VerticalConfig, VerticalTemplate, VerticalFlow, FAQPreset } from "./types";
import { baseConfig } from "./base";

const ecommerceTemplates: VerticalTemplate[] = [
  // Greeting templates
  {
    id: "ecom-greeting-1",
    name: "Accueil boutique",
    category: "greeting",
    content: "Bonjour ! Bienvenue chez {{store_name}} 🛍️ Comment puis-je vous aider ?",
    variables: ["store_name"],
    description: "Message d'accueil boutique en ligne",
  },
  {
    id: "ecom-greeting-2",
    name: "Accueil avec promo",
    category: "greeting",
    content: "Bonjour ! {{store_name}} vous souhaite la bienvenue ✨\n\n🎁 Profitez de -{{discount}}% avec le code {{promo_code}}",
    variables: ["store_name", "discount", "promo_code"],
    description: "Message d'accueil avec promotion",
  },
  // Order status templates
  {
    id: "ecom-order-1",
    name: "Statut commande",
    category: "order",
    content: "📦 Commande #{{order_id}}\n\nStatut : {{status}}\n{{tracking_info}}\n\nBesoin d'aide ? Répondez à ce message.",
    variables: ["order_id", "status", "tracking_info"],
    description: "Statut de commande",
  },
  {
    id: "ecom-order-2",
    name: "Commande confirmée",
    category: "order",
    content: "✅ Commande #{{order_id}} confirmée !\n\nMerci {{customer_name}} ! Votre commande est en cours de préparation.\n\nSuivi : {{tracking_url}}",
    variables: ["order_id", "customer_name", "tracking_url"],
    description: "Confirmation de commande",
  },
  {
    id: "ecom-order-3",
    name: "Commande expédiée",
    category: "order",
    content: "🚚 Bonne nouvelle !\n\nVotre commande #{{order_id}} a été expédiée.\n\n📍 Suivez votre colis : {{tracking_url}}\n📅 Livraison prévue : {{delivery_date}}",
    variables: ["order_id", "tracking_url", "delivery_date"],
    description: "Notification d'expédition",
  },
  {
    id: "ecom-order-4",
    name: "Livraison demain",
    category: "order",
    content: "📦 Votre colis arrive demain !\n\nCommande #{{order_id}}\nLivraison prévue entre {{time_range}}\n\nPréparez-vous à recevoir votre commande !",
    variables: ["order_id", "time_range"],
    description: "Rappel livraison J-1",
  },
  // Product templates
  {
    id: "ecom-product-1",
    name: "Info disponibilité",
    category: "support",
    content: "Ce produit est disponible en :\n{{variants}}\n\nLequel vous intéresse ?",
    variables: ["variants"],
    description: "Disponibilité produit",
  },
  {
    id: "ecom-product-2",
    name: "Stock limité",
    category: "promotional",
    content: "⚠️ Stock limité !\n\nPlus que {{quantity}} {{product_name}} disponibles.\n\nCommandez vite : {{product_url}}",
    variables: ["quantity", "product_name", "product_url"],
    description: "Alerte stock faible",
  },
  {
    id: "ecom-product-3",
    name: "Retour en stock",
    category: "promotional",
    content: "🎉 Bonne nouvelle !\n\n{{product_name}} est de retour en stock !\n\nCommandez maintenant : {{product_url}}",
    variables: ["product_name", "product_url"],
    description: "Notification retour en stock",
  },
  // Return templates
  {
    id: "ecom-return-1",
    name: "Procédure retour",
    category: "return",
    content: "Pour retourner un article :\n\n1️⃣ Préparez le colis\n2️⃣ Imprimez l'étiquette : {{return_label_url}}\n3️⃣ Déposez en point relais\n\nRemboursement sous 5 jours ouvrés après réception.",
    variables: ["return_label_url"],
    description: "Instructions de retour",
  },
  {
    id: "ecom-return-2",
    name: "Confirmation retour",
    category: "return",
    content: "✅ Retour enregistré !\n\nCommande #{{order_id}}\nArticle : {{product_name}}\n\nVotre remboursement sera traité sous 5 jours ouvrés après réception du colis.",
    variables: ["order_id", "product_name"],
    description: "Confirmation de demande de retour",
  },
  // Payment templates
  {
    id: "ecom-payment-1",
    name: "Paiement échoué",
    category: "payment",
    content: "⚠️ Paiement non abouti\n\nVotre commande #{{order_id}} n'a pas pu être finalisée.\n\nRetentez le paiement : {{payment_url}}\n\nBesoin d'aide ? On est là !",
    variables: ["order_id", "payment_url"],
    description: "Notification paiement échoué",
  },
  {
    id: "ecom-payment-2",
    name: "Panier abandonné",
    category: "promotional",
    content: "Vous avez oublié quelque chose ? 🛒\n\nVotre panier vous attend :\n{{cart_items}}\n\n🎁 -10% avec le code RETOUR10\n\n👉 {{cart_url}}",
    variables: ["cart_items", "cart_url"],
    description: "Relance panier abandonné",
  },
  // Follow-up templates
  {
    id: "ecom-followup-1",
    name: "Satisfaction livraison",
    category: "followup",
    content: "📦 Votre commande a été livrée !\n\nTout s'est bien passé ? Répondez :\n👍 Parfait\n👎 Problème\n\nVotre avis compte pour nous !",
    variables: [],
    description: "Suivi post-livraison",
  },
  {
    id: "ecom-followup-2",
    name: "Demande avis produit",
    category: "followup",
    content: "Que pensez-vous de votre {{product_name}} ? ⭐\n\nLaissez un avis et recevez {{reward}} sur votre prochaine commande !\n\n👉 {{review_url}}",
    variables: ["product_name", "reward", "review_url"],
    description: "Demande d'avis produit",
  },
  // Promotional templates
  {
    id: "ecom-promo-1",
    name: "Vente flash",
    category: "promotional",
    content: "⚡ VENTE FLASH !\n\n-{{discount}}% sur {{category}}\n\nCode : {{promo_code}}\nValable jusqu'à minuit !\n\n👉 {{shop_url}}",
    variables: ["discount", "category", "promo_code", "shop_url"],
    description: "Annonce vente flash",
  },
  {
    id: "ecom-promo-2",
    name: "Anniversaire client",
    category: "promotional",
    content: "🎂 Joyeux anniversaire {{customer_name}} !\n\n{{store_name}} vous offre -{{discount}}% sur tout le site !\n\nCode : ANNIV{{year}}\nValable 7 jours",
    variables: ["customer_name", "store_name", "discount", "year"],
    description: "Offre anniversaire",
  },
];

const ecommerceFlows: VerticalFlow[] = [
  {
    id: "ecom-order-tracking",
    name: "Suivi de commande",
    description: "Flow de suivi de commande pour e-commerce",
    triggerIntent: "ORDER_TRACKING",
    steps: [
      {
        id: "order_id",
        type: "question",
        prompt: "Quel est votre numéro de commande ?\n(Ex: #12345 ou 12345)",
        variable: "order_id",
        validation: "text",
        nextStep: "order_lookup",
      },
      {
        id: "order_lookup",
        type: "action",
        action: "lookup_order",
        conditionalNext: {
          found: "order_status",
          not_found: "order_not_found",
        },
      },
      {
        id: "order_status",
        type: "confirmation",
        prompt: "📦 Commande #{{order_id}}\n\nStatut : {{order_status}}\n{{tracking_details}}\n\nBesoin d'autre chose ?",
      },
      {
        id: "order_not_found",
        type: "options",
        prompt: "Je n'ai pas trouvé cette commande. Vérifiez le numéro ou :\n\n",
        options: ["Réessayer avec un autre numéro", "Contacter le support"],
        variable: "retry_choice",
        validation: "selection",
        conditionalNext: {
          "Réessayer avec un autre numéro": "order_id",
          "Contacter le support": "escalate",
        },
      },
      {
        id: "escalate",
        type: "confirmation",
        prompt: "Je transfère votre demande à notre équipe. Vous serez recontacté(e) sous 24h.",
        action: "send_notification",
      },
    ],
    onComplete: {
      action: "lookup_order",
      template: "ecom-order-1",
    },
  },
  {
    id: "ecom-return-request",
    name: "Demande de retour",
    description: "Flow de demande de retour produit",
    triggerIntent: "RETURN_REQUEST",
    steps: [
      {
        id: "order_id",
        type: "question",
        prompt: "Quel est le numéro de la commande concernée ?",
        variable: "order_id",
        validation: "text",
        nextStep: "product_selection",
      },
      {
        id: "product_selection",
        type: "question",
        prompt: "Quel article souhaitez-vous retourner ?\n\n{{order_items}}",
        variable: "return_item",
        validation: "text",
        nextStep: "return_reason",
      },
      {
        id: "return_reason",
        type: "options",
        prompt: "Pour quelle raison souhaitez-vous le retourner ?",
        options: ["Ne correspond pas à la description", "Taille incorrecte", "Défectueux/Endommagé", "Changement d'avis", "Autre"],
        variable: "return_reason",
        validation: "selection",
        conditionalNext: {
          "Défectueux/Endommagé": "photos_request",
          default: "confirmation",
        },
      },
      {
        id: "photos_request",
        type: "question",
        prompt: "Pouvez-vous nous envoyer des photos du produit défectueux ?",
        variable: "photos",
        validation: "text",
        nextStep: "confirmation",
      },
      {
        id: "confirmation",
        type: "confirmation",
        prompt: "✅ Demande de retour enregistrée !\n\nCommande #{{order_id}}\nArticle : {{return_item}}\nRaison : {{return_reason}}\n\nVous recevrez l'étiquette de retour par email sous 24h.",
        action: "create_lead",
      },
    ],
    onComplete: {
      action: "create_lead",
      template: "ecom-return-2",
    },
  },
  {
    id: "ecom-product-question",
    name: "Question produit",
    description: "Flow pour répondre aux questions sur les produits",
    triggerIntent: "PRODUCT_QUESTION",
    steps: [
      {
        id: "product_identification",
        type: "question",
        prompt: "De quel produit souhaitez-vous des informations ?\n(Nom ou référence)",
        variable: "product",
        validation: "text",
        nextStep: "question_type",
      },
      {
        id: "question_type",
        type: "options",
        prompt: "Que souhaitez-vous savoir ?",
        options: ["Disponibilité", "Tailles/Couleurs", "Composition/Matière", "Livraison", "Autre question"],
        variable: "question_type",
        validation: "selection",
        nextStep: "answer",
      },
      {
        id: "answer",
        type: "confirmation",
        prompt: "{{product_answer}}\n\nAutre question ?",
      },
    ],
  },
];

const ecommerceFaqPresets: FAQPreset[] = [
  {
    question: "Où est ma commande ?",
    answer: "Pour suivre votre commande, donnez-moi votre numéro de commande (ex: #12345) et je vous donne le statut en temps réel !",
    category: "commande",
    keywords: ["commande", "où", "suivi", "tracking", "colis", "livraison", "statut"],
  },
  {
    question: "Quels sont les délais de livraison ?",
    answer: "Nos délais de livraison :\n- Standard : 3-5 jours ouvrés\n- Express : 24-48h\n- Point relais : 4-6 jours ouvrés\n\nLivraison gratuite dès {{free_shipping_threshold}}€ d'achat !",
    category: "livraison",
    keywords: ["délai", "livraison", "combien", "temps", "jours", "quand"],
  },
  {
    question: "Comment retourner un article ?",
    answer: "Vous avez 30 jours pour retourner un article :\n1. Contactez-nous avec votre n° de commande\n2. Recevez l'étiquette retour par email\n3. Déposez le colis en point relais\n\nRemboursement sous 5 jours après réception.",
    category: "retour",
    keywords: ["retour", "retourner", "rembourser", "échanger", "renvoyer"],
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "Nous acceptons :\n💳 Carte bancaire (Visa, Mastercard)\n🍎 Apple Pay / Google Pay\n🏦 PayPal\n🔄 Paiement en 3x sans frais (dès 100€)\n\nTous les paiements sont 100% sécurisés.",
    category: "paiement",
    keywords: ["paiement", "payer", "carte", "paypal", "3x", "sécurisé"],
  },
  {
    question: "Comment utiliser un code promo ?",
    answer: "Entrez votre code promo dans le champ dédié au moment du paiement. La réduction s'applique automatiquement si le code est valide !",
    category: "promo",
    keywords: ["code", "promo", "réduction", "coupon", "remise"],
  },
  {
    question: "Livrez-vous à l'international ?",
    answer: "Oui ! Nous livrons dans toute l'Europe. Les frais et délais varient selon le pays. Consultez notre page livraison pour les détails.",
    category: "livraison",
    keywords: ["international", "étranger", "europe", "belgique", "suisse"],
  },
  {
    question: "Ma commande est incomplète",
    answer: "Oh non ! Donnez-moi votre numéro de commande et je vérifie immédiatement ce qui s'est passé. Nous résoudrons cela au plus vite.",
    category: "problème",
    keywords: ["incomplet", "manque", "manquant", "erreur", "oublié"],
  },
  {
    question: "Comment modifier ma commande ?",
    answer: "Vous pouvez modifier votre commande tant qu'elle n'est pas expédiée. Donnez-moi votre numéro de commande et ce que vous souhaitez changer.",
    category: "commande",
    keywords: ["modifier", "changer", "annuler", "adresse", "produit"],
  },
  {
    question: "Avez-vous ce produit en stock ?",
    answer: "Dites-moi quel produit vous intéresse (nom ou référence) et je vérifie la disponibilité pour vous !",
    category: "stock",
    keywords: ["stock", "disponible", "rupture", "dispo", "avoir"],
  },
  {
    question: "Comment suivre mon colis ?",
    answer: "Vous avez reçu un email avec le lien de suivi à l'expédition. Si vous ne le trouvez pas, donnez-moi votre n° de commande et je vous envoie le lien !",
    category: "livraison",
    keywords: ["suivre", "suivi", "tracking", "colis", "où"],
  },
];

export const ecommerceConfig: VerticalConfig = {
  ...baseConfig,
  id: "ecommerce",
  name: "E-commerce",
  description: "Configuration pour boutiques en ligne (Shopify, WooCommerce, etc.)",

  branding: {
    accentColor: "#10B981", // Emerald
    icon: "ShoppingBag",
    tagline: "Automatisez votre service client e-commerce",
    welcomeMessage: "Bonjour ! Comment puis-je vous aider avec votre commande ? 📦",
  },

  templates: [...baseConfig.templates, ...ecommerceTemplates],
  flows: [...baseConfig.flows, ...ecommerceFlows],
  faqPresets: ecommerceFaqPresets,

  integrations: [
    ...baseConfig.integrations,
    {
      id: "shopify",
      name: "Shopify",
      type: "ecommerce",
      provider: "shopify",
      description: "Synchronisez commandes, produits et clients depuis Shopify",
      configFields: [
        { key: "shopDomain", label: "Domaine de la boutique", type: "text", required: true },
        { key: "accessToken", label: "Token d'accès API", type: "password", required: true },
        { key: "webhookSecret", label: "Secret webhook", type: "password", required: false },
      ],
    },
    {
      id: "woocommerce",
      name: "WooCommerce",
      type: "ecommerce",
      provider: "woocommerce",
      description: "Connectez votre boutique WooCommerce",
      configFields: [
        { key: "siteUrl", label: "URL du site", type: "url", required: true },
        { key: "consumerKey", label: "Consumer Key", type: "password", required: true },
        { key: "consumerSecret", label: "Consumer Secret", type: "password", required: true },
      ],
    },
    {
      id: "colissimo",
      name: "Colissimo",
      type: "shipping",
      provider: "colissimo",
      description: "Suivi des colis Colissimo en temps réel",
      configFields: [
        { key: "contractNumber", label: "Numéro de contrat", type: "text", required: true },
        { key: "password", label: "Mot de passe", type: "password", required: true },
      ],
    },
    {
      id: "chronopost",
      name: "Chronopost",
      type: "shipping",
      provider: "chronopost",
      description: "Suivi des colis Chronopost",
      configFields: [
        { key: "accountNumber", label: "Numéro de compte", type: "text", required: true },
        { key: "password", label: "Mot de passe", type: "password", required: true },
      ],
    },
    {
      id: "mondial-relay",
      name: "Mondial Relay",
      type: "shipping",
      provider: "mondial-relay",
      description: "Suivi des colis Mondial Relay",
      configFields: [
        { key: "customerId", label: "ID client", type: "text", required: true },
        { key: "webServiceKey", label: "Clé webservice", type: "password", required: true },
      ],
    },
  ],

  onboarding: [
    {
      id: "store-info",
      title: "Informations de la boutique",
      description: "Configurez les informations de base de votre boutique",
      type: "form",
      fields: [
        {
          key: "storeName",
          label: "Nom de la boutique",
          type: "text",
          placeholder: "Ma Boutique",
          required: true,
        },
        {
          key: "storeUrl",
          label: "URL du site",
          type: "text",
          placeholder: "https://maboutique.com",
          required: true,
        },
        {
          key: "platform",
          label: "Plateforme e-commerce",
          type: "select",
          options: [
            { value: "shopify", label: "Shopify" },
            { value: "woocommerce", label: "WooCommerce" },
            { value: "prestashop", label: "PrestaShop" },
            { value: "magento", label: "Magento" },
            { value: "other", label: "Autre" },
          ],
          required: true,
        },
      ],
    },
    {
      id: "platform-connect",
      title: "Connexion à la plateforme",
      description: "Connectez votre boutique pour synchroniser les commandes",
      type: "connect",
    },
    {
      id: "shipping-setup",
      title: "Transporteurs",
      description: "Configurez vos transporteurs pour le suivi automatique",
      type: "list",
      prefilledOptions: [
        { value: "colissimo", label: "Colissimo" },
        { value: "chronopost", label: "Chronopost" },
        { value: "mondial-relay", label: "Mondial Relay" },
        { value: "ups", label: "UPS" },
        { value: "dpd", label: "DPD" },
        { value: "gls", label: "GLS" },
      ],
    },
    {
      id: "notifications-setup",
      title: "Notifications automatiques",
      description: "Choisissez quand notifier vos clients",
      type: "list",
      prefilledOptions: [
        { value: "order_confirmed", label: "Commande confirmée" },
        { value: "order_shipped", label: "Commande expédiée" },
        { value: "delivery_tomorrow", label: "Livraison demain" },
        { value: "delivered", label: "Livraison effectuée" },
        { value: "review_request", label: "Demande d'avis (J+7)" },
      ],
    },
    {
      id: "faq-setup",
      title: "Questions fréquentes",
      description: "Personnalisez les réponses automatiques",
      type: "list",
      prefilledOptions: ecommerceFaqPresets.slice(0, 5).map((faq) => ({
        value: faq.question,
        label: faq.question,
      })),
    },
    {
      id: "whatsapp-connect",
      title: "Connexion WhatsApp",
      description: "Connectez votre numéro WhatsApp Business",
      type: "connect",
    },
  ],

  features: {
    booking: false,
    leadCapture: true,
    orderTracking: true,
    quoteRequests: false,
    calendar: false,
  },

  // E-commerce hides booking-related nav items
  hiddenNavItems: ["/dashboard/booking", "/dashboard/pipeline"],
};

export default ecommerceConfig;
