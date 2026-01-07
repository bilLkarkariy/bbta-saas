// Base/Generic Vertical Configuration
// This serves as the foundation for all verticals

import type { VerticalConfig } from "./types";

/**
 * Base configuration shared by all verticals
 * Generic businesses use this directly
 */
export const baseConfig: VerticalConfig = {
  id: "generic",
  name: "Generic",
  description: "Configuration générique pour tous types d'entreprises",

  branding: {
    accentColor: "#6366F1", // Indigo
    icon: "Building2",
    tagline: "Automatisez vos conversations WhatsApp",
    welcomeMessage: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
  },

  templates: [
    // Greeting templates
    {
      id: "generic-greeting-1",
      name: "Accueil standard",
      category: "greeting",
      content: "Bonjour ! Bienvenue chez {{business_name}}. Comment puis-je vous aider ?",
      variables: ["business_name"],
      description: "Message d'accueil standard",
    },
    {
      id: "generic-greeting-2",
      name: "Accueil avec horaires",
      category: "greeting",
      content: "Bonjour ! {{business_name}} est ouvert {{business_hours}}. Comment puis-je vous aider ?",
      variables: ["business_name", "business_hours"],
      description: "Message d'accueil avec les horaires",
    },
    // Follow-up templates
    {
      id: "generic-followup-1",
      name: "Suivi satisfaction",
      category: "followup",
      content: "Bonjour {{customer_name}}, merci pour votre visite ! Comment s'est passée votre expérience ?",
      variables: ["customer_name"],
      description: "Demande de feedback après visite",
    },
    {
      id: "generic-followup-2",
      name: "Demande avis Google",
      category: "followup",
      content: "Merci pour votre confiance ! Si vous êtes satisfait, un avis Google nous aiderait beaucoup : {{review_link}}",
      variables: ["review_link"],
      description: "Demande d'avis Google",
    },
    // Support templates
    {
      id: "generic-support-1",
      name: "Escalade humain",
      category: "support",
      content: "Je vais transférer votre demande à un membre de notre équipe qui pourra mieux vous aider. Merci de patienter.",
      variables: [],
      description: "Message d'escalade vers un agent humain",
    },
    {
      id: "generic-support-2",
      name: "Hors horaires",
      category: "support",
      content: "Merci pour votre message ! Notre équipe est actuellement hors ligne. Nous vous répondrons dès que possible pendant nos horaires d'ouverture : {{business_hours}}.",
      variables: ["business_hours"],
      description: "Réponse automatique hors horaires",
    },
  ],

  flows: [
    {
      id: "generic-lead-capture",
      name: "Capture de lead",
      description: "Collecte les informations de contact d'un prospect",
      triggerIntent: "LEAD_CAPTURE",
      steps: [
        {
          id: "interest",
          type: "question",
          prompt: "Je serais ravi de vous aider ! Pouvez-vous me décrire votre besoin ?",
          variable: "interest",
          validation: "text",
          nextStep: "contact_method",
        },
        {
          id: "contact_method",
          type: "options",
          prompt: "Comment préférez-vous être recontacté ?",
          options: ["Par téléphone", "Par email", "Par WhatsApp"],
          variable: "contact_method",
          validation: "selection",
          conditionalNext: {
            "Par téléphone": "phone",
            "Par email": "email",
            "Par WhatsApp": "confirmation",
          },
        },
        {
          id: "phone",
          type: "question",
          prompt: "Quel est votre numéro de téléphone ?",
          variable: "phone",
          validation: "phone",
          nextStep: "name",
        },
        {
          id: "email",
          type: "question",
          prompt: "Quelle est votre adresse email ?",
          variable: "email",
          validation: "email",
          nextStep: "name",
        },
        {
          id: "name",
          type: "question",
          prompt: "À quel nom puis-je vous enregistrer ?",
          variable: "name",
          validation: "text",
          nextStep: "confirmation",
        },
        {
          id: "confirmation",
          type: "confirmation",
          prompt: "Parfait ! Votre demande a été enregistrée. Notre équipe vous recontactera très bientôt. Merci !",
          action: "create_lead",
        },
      ],
      onComplete: {
        action: "create_lead",
        template: "generic-lead-confirmation",
      },
    },
  ],

  integrations: [
    {
      id: "google-calendar",
      name: "Google Calendar",
      type: "calendar",
      provider: "google",
      description: "Synchronisez vos rendez-vous avec Google Calendar",
      configFields: [
        {
          key: "calendarId",
          label: "ID du calendrier",
          type: "text",
          required: true,
        },
      ],
    },
    {
      id: "stripe",
      name: "Stripe",
      type: "payment",
      provider: "stripe",
      description: "Acceptez les paiements en ligne",
      configFields: [
        {
          key: "apiKey",
          label: "Clé API Stripe",
          type: "password",
          required: true,
        },
        {
          key: "webhookSecret",
          label: "Secret Webhook",
          type: "password",
          required: true,
        },
      ],
    },
  ],

  onboarding: [
    {
      id: "business-info",
      title: "Informations de l'entreprise",
      description: "Configurez les informations de base de votre entreprise",
      type: "form",
      fields: [
        {
          key: "businessName",
          label: "Nom de l'entreprise",
          type: "text",
          placeholder: "Mon Entreprise",
          required: true,
        },
        {
          key: "businessType",
          label: "Type d'activité",
          type: "select",
          options: [
            { value: "retail", label: "Commerce de détail" },
            { value: "service", label: "Prestation de services" },
            { value: "restaurant", label: "Restaurant/Café" },
            { value: "other", label: "Autre" },
          ],
          required: true,
        },
        {
          key: "address",
          label: "Adresse",
          type: "text",
          placeholder: "123 rue Example, 75001 Paris",
          required: false,
        },
      ],
    },
    {
      id: "business-hours",
      title: "Horaires d'ouverture",
      description: "Définissez vos horaires pour les réponses automatiques",
      type: "form",
      fields: [
        {
          key: "weekdayHours",
          label: "Lundi - Vendredi",
          type: "text",
          placeholder: "9h - 18h",
          required: false,
        },
        {
          key: "saturdayHours",
          label: "Samedi",
          type: "text",
          placeholder: "10h - 17h",
          required: false,
        },
        {
          key: "sundayHours",
          label: "Dimanche",
          type: "text",
          placeholder: "Fermé",
          required: false,
        },
      ],
    },
    {
      id: "faq-setup",
      title: "Questions fréquentes",
      description: "Ajoutez les questions les plus posées par vos clients",
      type: "list",
      prefilledOptions: [
        { value: "hours", label: "Quels sont vos horaires ?" },
        { value: "location", label: "Où êtes-vous situés ?" },
        { value: "contact", label: "Comment vous contacter ?" },
        { value: "prices", label: "Quels sont vos tarifs ?" },
        { value: "booking", label: "Comment prendre rendez-vous ?" },
      ],
    },
    {
      id: "whatsapp-connect",
      title: "Connexion WhatsApp",
      description: "Connectez votre numéro WhatsApp Business",
      type: "connect",
    },
  ],

  faqPresets: [
    {
      question: "Quels sont vos horaires d'ouverture ?",
      answer: "Nous sommes ouverts du lundi au vendredi de 9h à 18h, et le samedi de 10h à 17h.",
      category: "horaires",
      keywords: ["horaires", "ouverture", "heures", "quand", "fermé", "ouvert"],
    },
    {
      question: "Où êtes-vous situés ?",
      answer: "Notre adresse est au {{address}}. Vous pouvez nous trouver facilement sur Google Maps.",
      category: "adresse",
      keywords: ["adresse", "où", "situé", "localisation", "trouver", "lieu"],
    },
    {
      question: "Comment vous contacter ?",
      answer: "Vous pouvez nous contacter par WhatsApp (ce numéro), par téléphone au {{phone}}, ou par email à {{email}}.",
      category: "contact",
      keywords: ["contact", "joindre", "appeler", "téléphone", "email"],
    },
  ],

  features: {
    booking: true,
    leadCapture: true,
    orderTracking: false,
    quoteRequests: false,
    calendar: true,
  },
};

export default baseConfig;
