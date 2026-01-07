// Integration Provider Types
// Defines the interface for all third-party integrations

export type IntegrationType =
  | "twilio"
  | "whatsapp_business"
  | "webhook"
  | "google_calendar"
  | "planity"
  | "treatwell"
  | "calendly"
  | "google_maps"
  | "notion"
  | "shopify"
  | "woocommerce"
  | "colissimo"
  | "chronopost"
  | "mondial_relay"
  | "stripe";

export type IntegrationCategory =
  | "messaging"
  | "calendar"
  | "booking"
  | "crm"
  | "payment"
  | "shipping"
  | "ecommerce"
  | "maps";

export interface IntegrationCredentials {
  [key: string]: string | undefined;
}

export interface IntegrationConfig {
  [key: string]: unknown;
}

/**
 * Result of an integration health check
 */
export interface HealthCheckResult {
  healthy: boolean;
  message?: string;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

/**
 * Base interface for all integration providers
 */
export interface IntegrationProvider<
  TCredentials extends IntegrationCredentials = IntegrationCredentials,
  TConfig extends IntegrationConfig = IntegrationConfig
> {
  type: IntegrationType;
  category: IntegrationCategory;
  name: string;
  description: string;
  icon: string; // Lucide icon name

  // Credential fields required for this integration
  credentialFields: {
    key: keyof TCredentials;
    label: string;
    type: "text" | "password" | "url";
    placeholder?: string;
    required: boolean;
    helpText?: string;
  }[];

  // Configuration fields (optional settings)
  configFields?: {
    key: keyof TConfig;
    label: string;
    type: "text" | "select" | "checkbox" | "number";
    options?: { value: string; label: string }[];
    defaultValue?: unknown;
  }[];

  // Validate credentials before saving
  validateCredentials(credentials: TCredentials): Promise<{ valid: boolean; error?: string }>;

  // Check integration health
  healthCheck(credentials: TCredentials, config?: TConfig): Promise<HealthCheckResult>;

  // Get OAuth URL if this integration uses OAuth
  getOAuthUrl?(redirectUri: string, state: string): string;

  // Handle OAuth callback
  handleOAuthCallback?(code: string, state: string): Promise<TCredentials>;
}

/**
 * Calendar Integration - for syncing appointments
 */
export interface CalendarIntegration extends IntegrationProvider {
  category: "calendar";

  // Get available slots for a date range
  getAvailableSlots(
    credentials: IntegrationCredentials,
    startDate: Date,
    endDate: Date,
    duration: number // minutes
  ): Promise<{ start: Date; end: Date }[]>;

  // Create a calendar event
  createEvent(
    credentials: IntegrationCredentials,
    event: {
      title: string;
      description?: string;
      start: Date;
      end: Date;
      attendeeEmail?: string;
    }
  ): Promise<{ eventId: string; eventUrl?: string }>;

  // Cancel/delete an event
  cancelEvent(credentials: IntegrationCredentials, eventId: string): Promise<void>;
}

/**
 * Booking Integration - for syncing with booking platforms
 */
export interface BookingIntegration extends IntegrationProvider {
  category: "booking";

  // Sync services from the booking platform
  syncServices(credentials: IntegrationCredentials): Promise<{
    id: string;
    name: string;
    duration: number;
    price?: number;
  }[]>;

  // Get available slots
  getAvailableSlots(
    credentials: IntegrationCredentials,
    serviceId: string,
    date: Date,
    staffId?: string
  ): Promise<{ time: string; staffId?: string; staffName?: string }[]>;

  // Create a booking
  createBooking(
    credentials: IntegrationCredentials,
    booking: {
      serviceId: string;
      staffId?: string;
      date: string;
      time: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
    }
  ): Promise<{ bookingId: string; confirmationCode?: string }>;

  // Cancel a booking
  cancelBooking(credentials: IntegrationCredentials, bookingId: string): Promise<void>;
}

/**
 * E-commerce Integration - for syncing orders and products
 */
export interface EcommerceIntegration extends IntegrationProvider {
  category: "ecommerce";

  // Get order by ID
  getOrder(credentials: IntegrationCredentials, orderId: string): Promise<{
    id: string;
    status: string;
    statusLabel: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: Date;
  } | null>;

  // Get customer orders
  getCustomerOrders(
    credentials: IntegrationCredentials,
    customerEmail?: string,
    customerPhone?: string,
    limit?: number
  ): Promise<{ id: string; status: string; createdAt: Date; total: number }[]>;

  // Get product info
  getProduct(credentials: IntegrationCredentials, productId: string): Promise<{
    id: string;
    name: string;
    price: number;
    inStock: boolean;
    variants?: { id: string; name: string; available: boolean }[];
  } | null>;

  // Check product availability
  checkStock(credentials: IntegrationCredentials, productId: string, variantId?: string): Promise<{
    available: boolean;
    quantity?: number;
  }>;
}

/**
 * Shipping Integration - for tracking packages
 */
export interface ShippingIntegration extends IntegrationProvider {
  category: "shipping";

  // Track a package
  trackPackage(credentials: IntegrationCredentials, trackingNumber: string): Promise<{
    status: string;
    statusLabel: string;
    events: { date: Date; description: string; location?: string }[];
    estimatedDelivery?: Date;
    delivered: boolean;
    deliveredAt?: Date;
  } | null>;

  // Get tracking URL
  getTrackingUrl(trackingNumber: string): string;
}

/**
 * Maps Integration - for location and routing
 */
export interface MapsIntegration extends IntegrationProvider {
  category: "maps";

  // Calculate distance and travel time
  calculateRoute(
    credentials: IntegrationCredentials,
    origin: string,
    destination: string
  ): Promise<{
    distanceKm: number;
    durationMinutes: number;
    durationText: string;
  }>;

  // Validate and geocode an address
  geocodeAddress(credentials: IntegrationCredentials, address: string): Promise<{
    valid: boolean;
    formattedAddress?: string;
    lat?: number;
    lng?: number;
    city?: string;
    postalCode?: string;
  }>;

  // Check if address is within service area
  isInServiceArea(
    credentials: IntegrationCredentials,
    address: string,
    baseAddress: string,
    radiusKm: number
  ): Promise<boolean>;
}
