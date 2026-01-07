// Vertical Configuration Types
// Each vertical specializes the core platform for a specific business type

/**
 * Business vertical types supported by Lumelia
 */
export type BusinessVertical = "beaute" | "services" | "ecommerce" | "generic";

/**
 * Template category for organizing templates by use case
 */
export type TemplateCategory =
  | "greeting"
  | "booking"
  | "reminder"
  | "followup"
  | "promotional"
  | "quote"
  | "order"
  | "payment"
  | "return"
  | "support";

/**
 * A pre-defined message template for a vertical
 */
export interface VerticalTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  content: string;
  variables: string[]; // e.g., ["salon_name", "date", "time"]
  description?: string;
}

/**
 * A flow step in a conversational flow
 */
export interface FlowStep {
  id: string;
  type: "question" | "options" | "confirmation" | "action";
  prompt?: string;
  options?: string[];
  variable?: string; // Variable to store the response
  validation?: "date" | "time" | "email" | "phone" | "text" | "selection";
  nextStep?: string; // ID of next step, or null for end
  conditionalNext?: Record<string, string>; // { "option_value": "step_id" }
  action?: "create_booking" | "create_lead" | "send_notification" | "lookup_order";
}

/**
 * A complete conversational flow
 */
export interface VerticalFlow {
  id: string;
  name: string;
  description: string;
  triggerIntent: string; // Intent that triggers this flow
  steps: FlowStep[];
  onComplete?: {
    action: string;
    template?: string; // Template to send on completion
  };
  onCancel?: {
    template?: string; // Template to send on cancellation
  };
}

/**
 * Integration configuration for a vertical
 */
export interface VerticalIntegration {
  id: string;
  name: string;
  type: "calendar" | "booking" | "crm" | "payment" | "shipping" | "ecommerce";
  provider: string; // e.g., "planity", "shopify", "stripe"
  description: string;
  configFields: {
    key: string;
    label: string;
    type: "text" | "password" | "url" | "select";
    required: boolean;
    options?: string[];
  }[];
}

/**
 * Onboarding step for vertical-specific setup
 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: "form" | "list" | "connect" | "import";
  fields?: {
    key: string;
    label: string;
    type: "text" | "textarea" | "select" | "multiselect" | "time" | "file";
    placeholder?: string;
    options?: { value: string; label: string }[];
    required?: boolean;
  }[];
  prefilledOptions?: { value: string; label: string }[]; // For list types
}

/**
 * FAQ preset for a vertical
 */
export interface FAQPreset {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

/**
 * Service definition for service-based verticals
 */
export interface ServiceDefinition {
  id: string;
  name: string;
  duration?: number; // minutes
  price?: number;
  description?: string;
}

/**
 * Branding configuration for a vertical
 */
export interface VerticalBranding {
  accentColor: string;
  icon: string; // Lucide icon name
  tagline: string;
  welcomeMessage: string;
}

/**
 * Complete vertical configuration
 */
export interface VerticalConfig {
  id: BusinessVertical;
  name: string;
  description: string;
  branding: VerticalBranding;

  // Templates
  templates: VerticalTemplate[];

  // Flows
  flows: VerticalFlow[];

  // Integrations
  integrations: VerticalIntegration[];

  // Onboarding
  onboarding: OnboardingStep[];

  // FAQs
  faqPresets: FAQPreset[];

  // Services (for service-based verticals)
  servicePresets?: ServiceDefinition[];

  // Navigation customization
  hiddenNavItems?: string[]; // hrefs to hide
  navBadges?: Record<string, string>; // { href: badge_label }

  // Feature flags
  features: {
    booking: boolean;
    leadCapture: boolean;
    orderTracking: boolean;
    quoteRequests: boolean;
    calendar: boolean;
  };
}

/**
 * Tenant-specific overrides for vertical config
 */
export interface TenantVerticalOverrides {
  templates?: {
    add?: VerticalTemplate[];
    remove?: string[]; // IDs to remove
  };
  flows?: {
    disable?: string[]; // Flow IDs to disable
  };
  onboarding?: {
    skip?: string[]; // Step IDs to skip
  };
  branding?: Partial<VerticalBranding>;
  features?: Partial<VerticalConfig["features"]>;
}
