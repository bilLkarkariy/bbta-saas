// Vertical Beauté Configuration
// For salons, spas, coiffeurs, esthéticiennes

import type { VerticalConfig, VerticalTemplate, VerticalFlow, FAQPreset, ServiceDefinition } from "./types";
import { baseConfig } from "./base";

const beauteTemplates: VerticalTemplate[] = [
  // Greeting templates
  {
    id: "beaute-greeting-1",
    name: "Accueil salon",
    category: "greeting",
    content: "Bonjour ! Bienvenue chez {{salon_name}} ✨ Comment puis-je vous aider ?",
    variables: ["salon_name"],
    description: "Message d'accueil chaleureux pour salon",
  },
  {
    id: "beaute-greeting-2",
    name: "Accueil avec RDV",
    category: "greeting",
    content: "Bonjour ! Merci de nous contacter. Souhaitez-vous prendre rendez-vous ?",
    variables: [],
    description: "Message orientant vers la prise de RDV",
  },
  // Booking templates
  {
    id: "beaute-booking-1",
    name: "Question service",
    category: "booking",
    content: "Parfait ! Pour quel service souhaitez-vous prendre rendez-vous ?\n\n💇 Coupe\n💆 Soin\n💅 Manucure\n🎨 Couleur",
    variables: [],
    description: "Demande du type de service",
  },
  {
    id: "beaute-booking-2",
    name: "Confirmation RDV",
    category: "booking",
    content: "✅ Votre RDV est confirmé !\n\n📅 {{date}}\n⏰ {{time}}\n💇 {{service}}\n📍 {{address}}\n\nÀ bientôt chez {{salon_name}} !",
    variables: ["date", "time", "service", "address", "salon_name"],
    description: "Confirmation de rendez-vous",
  },
  {
    id: "beaute-booking-3",
    name: "Créneaux disponibles",
    category: "booking",
    content: "Voici les créneaux disponibles pour {{service}} :\n\n{{slots}}\n\nLequel vous convient ?",
    variables: ["service", "slots"],
    description: "Présentation des créneaux",
  },
  // Reminder templates
  {
    id: "beaute-reminder-1",
    name: "Rappel J-1",
    category: "reminder",
    content: "📅 Rappel : Votre RDV {{service}} est demain à {{time}}.\n\nConfirmez avec 'OK' ou répondez pour modifier.",
    variables: ["service", "time"],
    description: "Rappel la veille du RDV",
  },
  {
    id: "beaute-reminder-2",
    name: "Rappel H-1",
    category: "reminder",
    content: "⏰ Votre RDV est dans 1h !\n\n{{service}} à {{time}}\nN'oubliez pas de venir 5 min en avance 😊",
    variables: ["service", "time"],
    description: "Rappel une heure avant",
  },
  // Follow-up templates
  {
    id: "beaute-followup-1",
    name: "Satisfaction post-visite",
    category: "followup",
    content: "Merci pour votre visite ! 💕 Comment s'est passée votre {{service}} ?",
    variables: ["service"],
    description: "Demande de feedback",
  },
  {
    id: "beaute-followup-2",
    name: "Demande avis",
    category: "followup",
    content: "Merci pour votre confiance ! ⭐\n\nSi vous êtes satisfait(e), un petit avis Google nous aiderait beaucoup :\n{{review_link}}",
    variables: ["review_link"],
    description: "Demande d'avis Google",
  },
  {
    id: "beaute-followup-3",
    name: "Relance rendez-vous",
    category: "followup",
    content: "Bonjour {{customer_name}} ! Cela fait un moment que nous ne vous avons pas vu(e). Envie d'un nouveau {{service}} ? 💇",
    variables: ["customer_name", "service"],
    description: "Relance pour reprise de RDV",
  },
  // Promotional templates
  {
    id: "beaute-promo-1",
    name: "Offre découverte",
    category: "promotional",
    content: "🎁 Offre spéciale : -{{discount}}% sur votre premier {{service}} !\n\nCode : {{promo_code}}\nValable jusqu'au {{expiry_date}}",
    variables: ["discount", "service", "promo_code", "expiry_date"],
    description: "Promotion première visite",
  },
  {
    id: "beaute-promo-2",
    name: "Happy Hour",
    category: "promotional",
    content: "☀️ Happy Hour chez {{salon_name}} !\n\n-20% sur toutes les prestations entre 14h et 16h.\nRéservez vite !",
    variables: ["salon_name"],
    description: "Promotion heures creuses",
  },
];

const beauteFlows: VerticalFlow[] = [
  {
    id: "beaute-booking",
    name: "Réservation salon",
    description: "Flow complet de prise de rendez-vous en salon de beauté",
    triggerIntent: "BOOKING",
    steps: [
      {
        id: "service_selection",
        type: "options",
        prompt: "Quel service souhaitez-vous ? ✨",
        options: ["Coupe", "Couleur", "Soin", "Manucure", "Brushing", "Autre"],
        variable: "service",
        validation: "selection",
        nextStep: "stylist_preference",
      },
      {
        id: "stylist_preference",
        type: "options",
        prompt: "Avez-vous un(e) coiffeur(se) préféré(e) ?",
        options: ["Pas de préférence", "Sarah", "Marie", "Thomas"],
        variable: "stylist",
        validation: "selection",
        nextStep: "date_selection",
      },
      {
        id: "date_selection",
        type: "question",
        prompt: "Quelle date vous conviendrait ?\n(ex: demain, lundi, 15 janvier)",
        variable: "date",
        validation: "date",
        nextStep: "time_selection",
      },
      {
        id: "time_selection",
        type: "question",
        prompt: "Voici les créneaux disponibles :\n{{available_slots}}\n\nLequel préférez-vous ?",
        variable: "time",
        validation: "time",
        nextStep: "confirmation",
      },
      {
        id: "confirmation",
        type: "confirmation",
        prompt: "✅ Parfait ! Votre RDV est confirmé :\n\n📅 {{date}}\n⏰ {{time}}\n💇 {{service}}\n\nVous recevrez un rappel la veille. À bientôt !",
        action: "create_booking",
      },
    ],
    onComplete: {
      action: "create_booking",
      template: "beaute-booking-2",
    },
    onCancel: {
      template: "generic-support-1",
    },
  },
];

const beauteFaqPresets: FAQPreset[] = [
  {
    question: "Quels sont vos horaires d'ouverture ?",
    answer: "Nous sommes ouverts du mardi au samedi de 9h à 19h. Fermé le dimanche et lundi.",
    category: "horaires",
    keywords: ["horaires", "ouverture", "heures", "quand", "fermé", "ouvert", "mardi", "samedi"],
  },
  {
    question: "Comment prendre rendez-vous ?",
    answer: "Vous pouvez prendre rendez-vous directement ici par WhatsApp, par téléphone, ou sur notre site web. Quel service vous intéresse ?",
    category: "rdv",
    keywords: ["rendez-vous", "rdv", "réserver", "prendre", "booking", "réservation"],
  },
  {
    question: "Quels sont vos tarifs ?",
    answer: "Nos tarifs varient selon le service :\n- Coupe femme : à partir de 35€\n- Coupe homme : à partir de 20€\n- Couleur : à partir de 45€\n- Balayage : à partir de 70€\n\nConsultez notre carte complète en salon.",
    category: "tarifs",
    keywords: ["tarif", "prix", "coût", "combien", "cher", "tarification"],
  },
  {
    question: "Acceptez-vous les sans rendez-vous ?",
    answer: "Nous acceptons les sans rendez-vous dans la limite des disponibilités. Pour être sûr(e) d'avoir une place, nous vous conseillons de réserver !",
    category: "rdv",
    keywords: ["sans rendez-vous", "walk-in", "spontané", "disponible", "libre"],
  },
  {
    question: "Proposez-vous des forfaits ?",
    answer: "Oui ! Nous avons des forfaits avantageux :\n- Forfait couleur + coupe : 75€\n- Forfait mariée : sur devis\n- Carte fidélité : -10% au 10ème passage\n\nDemandez à votre coiffeur(se) !",
    category: "tarifs",
    keywords: ["forfait", "pack", "offre", "réduction", "fidélité", "carte"],
  },
  {
    question: "Faites-vous les colorations végétales ?",
    answer: "Oui, nous proposons des colorations végétales et naturelles ! C'est plus doux pour vos cheveux. N'hésitez pas à demander conseil lors de votre visite.",
    category: "services",
    keywords: ["végétal", "naturel", "bio", "coloration", "henné", "plante"],
  },
  {
    question: "Puis-je venir avec mon enfant ?",
    answer: "Bien sûr ! Nous accueillons les enfants avec plaisir. Nous proposons même des coupes enfants à partir de 12€.",
    category: "services",
    keywords: ["enfant", "bébé", "petit", "kid", "fils", "fille"],
  },
  {
    question: "Avez-vous un parking ?",
    answer: "Nous disposons de 3 places de parking gratuites devant le salon. Si elles sont occupées, un parking public se trouve à 50m.",
    category: "pratique",
    keywords: ["parking", "garer", "voiture", "stationnement", "place"],
  },
  {
    question: "Comment annuler mon rendez-vous ?",
    answer: "Vous pouvez annuler ou modifier votre RDV jusqu'à 24h avant par WhatsApp ou téléphone. Au-delà, un acompte de 20€ pourrait être retenu.",
    category: "rdv",
    keywords: ["annuler", "modifier", "changer", "reporter", "annulation"],
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "Nous acceptons : CB, espèces, chèques, et tickets CESU. Apple Pay et Google Pay également disponibles.",
    category: "paiement",
    keywords: ["paiement", "payer", "carte", "espèces", "chèque", "cb"],
  },
];

const beauteServices: ServiceDefinition[] = [
  { id: "coupe-femme", name: "Coupe femme", duration: 45, price: 35, description: "Coupe, shampooing et coiffage" },
  { id: "coupe-homme", name: "Coupe homme", duration: 30, price: 20, description: "Coupe classique ou dégradé" },
  { id: "couleur", name: "Couleur", duration: 90, price: 45, description: "Coloration complète" },
  { id: "balayage", name: "Balayage", duration: 120, price: 70, description: "Balayage naturel" },
  { id: "meches", name: "Mèches", duration: 90, price: 55, description: "Mèches ou highlights" },
  { id: "brushing", name: "Brushing", duration: 30, price: 25, description: "Brushing simple" },
  { id: "soin", name: "Soin profond", duration: 45, price: 30, description: "Soin nourrissant" },
  { id: "manucure", name: "Manucure", duration: 45, price: 25, description: "Manucure classique" },
  { id: "pose-vernis", name: "Pose vernis", duration: 20, price: 15, description: "Vernis simple ou semi-permanent" },
];

export const beauteConfig: VerticalConfig = {
  ...baseConfig,
  id: "beaute",
  name: "Beauté & Bien-être",
  description: "Configuration pour salons de coiffure, spas, instituts de beauté",

  branding: {
    accentColor: "#EC4899", // Pink
    icon: "Scissors",
    tagline: "Automatisez vos rendez-vous beauté",
    welcomeMessage: "Bonjour ! Comment puis-je vous aider à sublimer votre journée ? ✨",
  },

  templates: [...baseConfig.templates, ...beauteTemplates],
  flows: [...baseConfig.flows, ...beauteFlows],
  faqPresets: beauteFaqPresets,
  servicePresets: beauteServices,

  integrations: [
    ...baseConfig.integrations,
    {
      id: "planity",
      name: "Planity",
      type: "booking",
      provider: "planity",
      description: "Synchronisez vos RDV avec Planity",
      configFields: [
        { key: "apiKey", label: "Clé API Planity", type: "password", required: true },
        { key: "salonId", label: "ID du salon", type: "text", required: true },
      ],
    },
    {
      id: "treatwell",
      name: "Treatwell",
      type: "booking",
      provider: "treatwell",
      description: "Importez vos RDV depuis Treatwell",
      configFields: [
        { key: "apiKey", label: "Clé API Treatwell", type: "password", required: true },
      ],
    },
  ],

  onboarding: [
    {
      id: "salon-info",
      title: "Informations du salon",
      description: "Configurez les informations de base de votre salon",
      type: "form",
      fields: [
        {
          key: "salonName",
          label: "Nom du salon",
          type: "text",
          placeholder: "Mon Salon de Coiffure",
          required: true,
        },
        {
          key: "address",
          label: "Adresse",
          type: "text",
          placeholder: "123 rue de la Beauté, 75001 Paris",
          required: true,
        },
        {
          key: "phone",
          label: "Téléphone",
          type: "text",
          placeholder: "01 23 45 67 89",
          required: false,
        },
      ],
    },
    {
      id: "services-setup",
      title: "Vos services",
      description: "Sélectionnez les services que vous proposez",
      type: "list",
      prefilledOptions: beauteServices.map((s) => ({
        value: s.id,
        label: `${s.name} (${s.duration}min - ${s.price}€)`,
      })),
    },
    {
      id: "team-setup",
      title: "Votre équipe",
      description: "Ajoutez les membres de votre équipe (coiffeurs, esthéticiennes...)",
      type: "form",
      fields: [
        {
          key: "teamMembers",
          label: "Noms des coiffeurs/esthéticiennes",
          type: "textarea",
          placeholder: "Sarah\nMarie\nThomas",
          required: false,
        },
      ],
    },
    {
      id: "business-hours",
      title: "Horaires d'ouverture",
      description: "Définissez vos horaires d'ouverture",
      type: "form",
      fields: [
        { key: "mondayHours", label: "Lundi", type: "text", placeholder: "Fermé" },
        { key: "tuesdayHours", label: "Mardi", type: "text", placeholder: "9h - 19h" },
        { key: "wednesdayHours", label: "Mercredi", type: "text", placeholder: "9h - 19h" },
        { key: "thursdayHours", label: "Jeudi", type: "text", placeholder: "9h - 19h" },
        { key: "fridayHours", label: "Vendredi", type: "text", placeholder: "9h - 19h" },
        { key: "saturdayHours", label: "Samedi", type: "text", placeholder: "9h - 18h" },
        { key: "sundayHours", label: "Dimanche", type: "text", placeholder: "Fermé" },
      ],
    },
    {
      id: "faq-setup",
      title: "Questions fréquentes",
      description: "Personnalisez les réponses automatiques aux questions courantes",
      type: "list",
      prefilledOptions: beauteFaqPresets.slice(0, 5).map((faq) => ({
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
    quoteRequests: false,
    calendar: true,
  },

  hiddenNavItems: ["/dashboard/pipeline"], // Hide pipeline for beauty salons
};

export default beauteConfig;
