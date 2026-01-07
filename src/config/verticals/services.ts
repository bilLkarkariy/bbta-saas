// Vertical Services Configuration
// For artisans, consultants, plumbers, electricians, etc.

import type { VerticalConfig, VerticalTemplate, VerticalFlow, FAQPreset, ServiceDefinition } from "./types";
import { baseConfig } from "./base";

const servicesTemplates: VerticalTemplate[] = [
  // Greeting templates
  {
    id: "services-greeting-1",
    name: "Accueil artisan",
    category: "greeting",
    content: "Bonjour ! {{company_name}}, artisan {{metier}} à votre service. Comment puis-je vous aider ?",
    variables: ["company_name", "metier"],
    description: "Message d'accueil professionnel",
  },
  {
    id: "services-greeting-2",
    name: "Accueil consultant",
    category: "greeting",
    content: "Bonjour ! {{name}} à votre écoute. Décrivez-moi votre projet et je vous accompagne.",
    variables: ["name"],
    description: "Message d'accueil consultant",
  },
  // Quote templates
  {
    id: "services-quote-1",
    name: "Demande devis",
    category: "quote",
    content: "Je peux vous établir un devis gratuit. Pouvez-vous me décrire les travaux souhaités ?",
    variables: [],
    description: "Initialisation demande de devis",
  },
  {
    id: "services-quote-2",
    name: "Confirmation devis",
    category: "quote",
    content: "Parfait ! J'ai bien noté votre demande :\n\n📝 {{description}}\n📍 {{address}}\n\nJe vous envoie un devis détaillé par email sous 24h.",
    variables: ["description", "address"],
    description: "Confirmation de demande de devis",
  },
  {
    id: "services-quote-3",
    name: "Demande photos",
    category: "quote",
    content: "Pour affiner mon devis, pourriez-vous m'envoyer quelques photos de la situation actuelle ?",
    variables: [],
    description: "Demande de photos pour devis",
  },
  // Intervention templates
  {
    id: "services-intervention-1",
    name: "Confirmation intervention",
    category: "booking",
    content: "✅ Intervention confirmée !\n\n📅 {{date}}\n⏰ {{time_range}}\n🔧 {{service}}\n📍 {{address}}\n\nJe vous rappelle la veille pour confirmer.",
    variables: ["date", "time_range", "service", "address"],
    description: "Confirmation d'intervention",
  },
  {
    id: "services-intervention-2",
    name: "En route",
    category: "booking",
    content: "🚗 Je suis en route ! J'arrive dans environ {{eta}} minutes.\n\nÀ tout de suite !",
    variables: ["eta"],
    description: "Notification de départ",
  },
  {
    id: "services-intervention-3",
    name: "Retard",
    category: "booking",
    content: "Bonjour, je suis désolé mais j'aurai environ {{delay}} minutes de retard sur notre RDV. Je vous tiens informé(e).",
    variables: ["delay"],
    description: "Notification de retard",
  },
  // Payment templates
  {
    id: "services-payment-1",
    name: "Facture intervention",
    category: "payment",
    content: "Travaux terminés ! ✅\n\nTotal : {{amount}}€\n\nPaiement possible par : CB, chèque, virement\n\nMerci pour votre confiance !",
    variables: ["amount"],
    description: "Envoi de facture",
  },
  {
    id: "services-payment-2",
    name: "Demande acompte",
    category: "payment",
    content: "Pour confirmer l'intervention, un acompte de {{amount}}€ est demandé.\n\nPaiement en ligne : {{payment_link}}",
    variables: ["amount", "payment_link"],
    description: "Demande d'acompte",
  },
  // Follow-up templates
  {
    id: "services-followup-1",
    name: "Satisfaction post-intervention",
    category: "followup",
    content: "Bonjour {{customer_name}} ! L'intervention s'est-elle bien passée ? N'hésitez pas si vous avez des questions.",
    variables: ["customer_name"],
    description: "Suivi post-intervention",
  },
  {
    id: "services-followup-2",
    name: "Demande avis",
    category: "followup",
    content: "Merci pour votre confiance ! ⭐\n\nVotre avis compte beaucoup pour moi. Si vous êtes satisfait(e), un petit commentaire sur Google m'aiderait :\n{{review_link}}",
    variables: ["review_link"],
    description: "Demande d'avis Google",
  },
  // Promotional templates
  {
    id: "services-promo-1",
    name: "Offre parrainage",
    category: "promotional",
    content: "🎁 Programme parrainage !\n\nParrainez un ami et recevez {{amount}}€ de réduction sur votre prochaine intervention.\n\nVotre code : {{referral_code}}",
    variables: ["amount", "referral_code"],
    description: "Programme de parrainage",
  },
];

const servicesFlows: VerticalFlow[] = [
  {
    id: "services-quote-request",
    name: "Demande de devis",
    description: "Flow complet de demande de devis pour artisans et prestataires",
    triggerIntent: "QUOTE_REQUEST",
    steps: [
      {
        id: "service_type",
        type: "options",
        prompt: "Quel type d'intervention souhaitez-vous ?",
        options: ["Dépannage urgent", "Installation neuve", "Rénovation", "Entretien", "Conseil/Diagnostic"],
        variable: "service_type",
        validation: "selection",
        nextStep: "description",
      },
      {
        id: "description",
        type: "question",
        prompt: "Décrivez-moi votre besoin en quelques mots :",
        variable: "description",
        validation: "text",
        nextStep: "photos",
      },
      {
        id: "photos",
        type: "options",
        prompt: "Avez-vous des photos à m'envoyer pour mieux comprendre la situation ?",
        options: ["Oui, je vous envoie des photos", "Non, pas de photos"],
        variable: "has_photos",
        validation: "selection",
        conditionalNext: {
          "Oui, je vous envoie des photos": "wait_photos",
          "Non, pas de photos": "location",
        },
      },
      {
        id: "wait_photos",
        type: "question",
        prompt: "Parfait, envoyez-moi les photos et je vous réponds.",
        variable: "photos",
        validation: "text",
        nextStep: "location",
      },
      {
        id: "location",
        type: "question",
        prompt: "Quelle est l'adresse de l'intervention ?",
        variable: "address",
        validation: "text",
        nextStep: "urgency",
      },
      {
        id: "urgency",
        type: "options",
        prompt: "C'est urgent ou planifiable ?",
        options: ["Urgent (sous 24h)", "Cette semaine", "Ce mois-ci", "Pas pressé"],
        variable: "urgency",
        validation: "selection",
        nextStep: "contact",
      },
      {
        id: "contact",
        type: "question",
        prompt: "Votre nom et email pour vous envoyer le devis ?",
        variable: "contact_info",
        validation: "text",
        nextStep: "confirmation",
      },
      {
        id: "confirmation",
        type: "confirmation",
        prompt: "Parfait ! J'ai bien reçu votre demande de devis.\n\n📝 {{service_type}} - {{description}}\n📍 {{address}}\n⏰ {{urgency}}\n\nJe vous envoie un devis détaillé par email sous 24h.",
        action: "create_lead",
      },
    ],
    onComplete: {
      action: "create_lead",
      template: "services-quote-2",
    },
    onCancel: {
      template: "generic-support-1",
    },
  },
  {
    id: "services-booking",
    name: "Prise de RDV intervention",
    description: "Flow de prise de rendez-vous pour intervention",
    triggerIntent: "BOOKING",
    steps: [
      {
        id: "date_selection",
        type: "question",
        prompt: "Quelle date vous conviendrait pour l'intervention ?\n(ex: demain, lundi, 15 janvier)",
        variable: "date",
        validation: "date",
        nextStep: "time_preference",
      },
      {
        id: "time_preference",
        type: "options",
        prompt: "Préférez-vous matin ou après-midi ?",
        options: ["Matin (8h-12h)", "Après-midi (14h-18h)", "Pas de préférence"],
        variable: "time_preference",
        validation: "selection",
        nextStep: "address_confirm",
      },
      {
        id: "address_confirm",
        type: "question",
        prompt: "Confirmez l'adresse d'intervention :",
        variable: "address",
        validation: "text",
        nextStep: "confirmation",
      },
      {
        id: "confirmation",
        type: "confirmation",
        prompt: "✅ Intervention planifiée !\n\n📅 {{date}}\n⏰ {{time_preference}}\n📍 {{address}}\n\nJe vous recontacterai la veille pour confirmer l'heure exacte.",
        action: "create_booking",
      },
    ],
    onComplete: {
      action: "create_booking",
      template: "services-intervention-1",
    },
  },
];

const servicesFaqPresets: FAQPreset[] = [
  {
    question: "Quelle est votre zone d'intervention ?",
    answer: "J'interviens dans un rayon de {{radius}}km autour de {{city}}. Des frais de déplacement peuvent s'appliquer au-delà de {{free_radius}}km.",
    category: "zone",
    keywords: ["zone", "secteur", "intervention", "déplacement", "ville", "région"],
  },
  {
    question: "Quels sont vos tarifs ?",
    answer: "Mes tarifs dépendent du type d'intervention. Je propose toujours un devis gratuit et sans engagement avant toute intervention. Décrivez-moi votre besoin !",
    category: "tarifs",
    keywords: ["tarif", "prix", "coût", "combien", "cher", "devis"],
  },
  {
    question: "Intervenez-vous en urgence ?",
    answer: "Oui, j'interviens en urgence 7j/7 pour les dépannages critiques. Un supplément urgence de {{emergency_fee}}€ s'applique les soirs, week-ends et jours fériés.",
    category: "urgence",
    keywords: ["urgence", "urgent", "dépannage", "rapide", "vite", "immédiat"],
  },
  {
    question: "Le devis est-il gratuit ?",
    answer: "Oui, le devis est toujours gratuit et sans engagement. Pour les gros travaux nécessitant un déplacement sur site, des frais de déplacement peuvent s'appliquer.",
    category: "devis",
    keywords: ["devis", "gratuit", "estimation", "prix", "engagement"],
  },
  {
    question: "Êtes-vous assuré ?",
    answer: "Oui, je suis assuré RC Pro et Décennale. Tous mes travaux sont garantis. Je peux vous fournir mes attestations sur demande.",
    category: "garantie",
    keywords: ["assuré", "assurance", "garantie", "décennale", "rc pro"],
  },
  {
    question: "Quels modes de paiement acceptez-vous ?",
    answer: "J'accepte les paiements par : CB, espèces, chèque, virement bancaire. Le paiement en plusieurs fois est possible pour les gros travaux.",
    category: "paiement",
    keywords: ["paiement", "payer", "carte", "espèces", "chèque", "virement"],
  },
  {
    question: "Fournissez-vous le matériel ?",
    answer: "Oui, je fournis tout le matériel nécessaire à l'intervention. Les prix indiqués dans mes devis incluent généralement fournitures et main d'œuvre.",
    category: "materiel",
    keywords: ["matériel", "fourniture", "pièces", "équipement"],
  },
  {
    question: "Combien de temps dure une intervention ?",
    answer: "La durée dépend des travaux. Un dépannage simple prend généralement 1-2h, une installation peut prendre une demi-journée à plusieurs jours selon le projet.",
    category: "duree",
    keywords: ["durée", "temps", "combien", "long", "rapide"],
  },
  {
    question: "Travaillez-vous le week-end ?",
    answer: "J'interviens du lundi au samedi. Les interventions d'urgence sont possibles le dimanche avec un supplément. N'hésitez pas à me contacter !",
    category: "horaires",
    keywords: ["weekend", "samedi", "dimanche", "horaires", "disponible"],
  },
  {
    question: "Faites-vous les petits travaux ?",
    answer: "Oui, j'accepte tous types de travaux, petits ou grands. Pas de minimum de facturation pour les clients réguliers !",
    category: "travaux",
    keywords: ["petit", "travaux", "bricolage", "minimum", "simple"],
  },
];

const servicesPresets: ServiceDefinition[] = [
  { id: "depannage", name: "Dépannage urgent", duration: 60, description: "Intervention rapide pour problème urgent" },
  { id: "diagnostic", name: "Diagnostic", duration: 45, price: 49, description: "Évaluation et devis sur place" },
  { id: "installation", name: "Installation", description: "Installation neuve ou remplacement" },
  { id: "renovation", name: "Rénovation", description: "Travaux de rénovation" },
  { id: "entretien", name: "Entretien", duration: 60, description: "Entretien préventif" },
  { id: "conseil", name: "Conseil", duration: 30, price: 0, description: "Conseil gratuit par téléphone" },
];

export const servicesConfig: VerticalConfig = {
  ...baseConfig,
  id: "services",
  name: "Services & Artisanat",
  description: "Configuration pour artisans, plombiers, électriciens, consultants",

  branding: {
    accentColor: "#F59E0B", // Amber
    icon: "Wrench",
    tagline: "Automatisez vos demandes de devis",
    welcomeMessage: "Bonjour ! Comment puis-je vous aider avec votre projet ?",
  },

  templates: [...baseConfig.templates, ...servicesTemplates],
  flows: [...baseConfig.flows, ...servicesFlows],
  faqPresets: servicesFaqPresets,
  servicePresets: servicesPresets,

  integrations: [
    ...baseConfig.integrations,
    {
      id: "google-maps",
      name: "Google Maps",
      type: "calendar",
      provider: "google-maps",
      description: "Calcul des trajets et zones d'intervention",
      configFields: [
        { key: "apiKey", label: "Clé API Google Maps", type: "password", required: true },
        { key: "baseAddress", label: "Adresse de départ", type: "text", required: true },
      ],
    },
    {
      id: "calendly",
      name: "Calendly",
      type: "booking",
      provider: "calendly",
      description: "Synchronisez vos créneaux de visite technique",
      configFields: [
        { key: "apiKey", label: "Clé API Calendly", type: "password", required: true },
        { key: "eventTypeUrl", label: "URL type d'événement", type: "url", required: true },
      ],
    },
    {
      id: "notion",
      name: "Notion",
      type: "crm",
      provider: "notion",
      description: "Suivez vos chantiers dans Notion",
      configFields: [
        { key: "apiKey", label: "Token Notion", type: "password", required: true },
        { key: "databaseId", label: "ID base de données", type: "text", required: true },
      ],
    },
  ],

  onboarding: [
    {
      id: "business-info",
      title: "Informations professionnelles",
      description: "Configurez votre profil professionnel",
      type: "form",
      fields: [
        {
          key: "companyName",
          label: "Nom de l'entreprise",
          type: "text",
          placeholder: "Dupont Plomberie",
          required: true,
        },
        {
          key: "metier",
          label: "Métier / Spécialité",
          type: "select",
          options: [
            { value: "plombier", label: "Plombier" },
            { value: "electricien", label: "Électricien" },
            { value: "chauffagiste", label: "Chauffagiste" },
            { value: "menuisier", label: "Menuisier" },
            { value: "peintre", label: "Peintre" },
            { value: "maçon", label: "Maçon" },
            { value: "couvreur", label: "Couvreur" },
            { value: "serrurier", label: "Serrurier" },
            { value: "consultant", label: "Consultant" },
            { value: "autre", label: "Autre" },
          ],
          required: true,
        },
        {
          key: "siret",
          label: "SIRET",
          type: "text",
          placeholder: "123 456 789 00012",
          required: false,
        },
      ],
    },
    {
      id: "zone-intervention",
      title: "Zone d'intervention",
      description: "Définissez votre zone géographique",
      type: "form",
      fields: [
        {
          key: "baseAddress",
          label: "Adresse de base",
          type: "text",
          placeholder: "123 rue du Commerce, 75001 Paris",
          required: true,
        },
        {
          key: "radius",
          label: "Rayon d'intervention (km)",
          type: "select",
          options: [
            { value: "10", label: "10 km" },
            { value: "20", label: "20 km" },
            { value: "30", label: "30 km" },
            { value: "50", label: "50 km" },
            { value: "100", label: "100 km" },
          ],
          required: true,
        },
        {
          key: "freeRadius",
          label: "Déplacement gratuit jusqu'à (km)",
          type: "select",
          options: [
            { value: "5", label: "5 km" },
            { value: "10", label: "10 km" },
            { value: "15", label: "15 km" },
            { value: "20", label: "20 km" },
          ],
          required: false,
        },
      ],
    },
    {
      id: "services-setup",
      title: "Vos prestations",
      description: "Sélectionnez les types d'intervention que vous proposez",
      type: "list",
      prefilledOptions: servicesPresets.map((s) => ({
        value: s.id,
        label: s.name,
      })),
    },
    {
      id: "tarifs-setup",
      title: "Tarification",
      description: "Définissez vos tarifs de base",
      type: "form",
      fields: [
        {
          key: "hourlyRate",
          label: "Taux horaire (€/h)",
          type: "text",
          placeholder: "45",
          required: false,
        },
        {
          key: "emergencyFee",
          label: "Supplément urgence (€)",
          type: "text",
          placeholder: "30",
          required: false,
        },
        {
          key: "travelFee",
          label: "Frais de déplacement (€/km)",
          type: "text",
          placeholder: "0.50",
          required: false,
        },
      ],
    },
    {
      id: "faq-setup",
      title: "Questions fréquentes",
      description: "Personnalisez les réponses aux questions courantes",
      type: "list",
      prefilledOptions: servicesFaqPresets.slice(0, 5).map((faq) => ({
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
    booking: true,
    leadCapture: true,
    orderTracking: false,
    quoteRequests: true,
    calendar: true,
  },

  // Services vertical shows pipeline for lead/quote tracking
  hiddenNavItems: [],
  navBadges: {
    "/dashboard/pipeline": "Leads",
  },
};

export default servicesConfig;
