// Google Calendar Integration Provider
// Syncs appointments with Google Calendar

import type {
  CalendarIntegration,
  IntegrationCredentials,
  HealthCheckResult,
} from "../types";

interface GoogleCalendarCredentials extends IntegrationCredentials {
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
}

/**
 * Google Calendar integration for appointment syncing
 * Note: Full OAuth implementation requires Google Cloud project setup
 */
export const googleCalendarProvider: CalendarIntegration = {
  type: "google_calendar",
  category: "calendar",
  name: "Google Calendar",
  description: "Synchronisez vos rendez-vous avec Google Calendar",
  icon: "Calendar",

  credentialFields: [
    {
      key: "calendarId",
      label: "ID du calendrier",
      type: "text",
      placeholder: "primary ou email@example.com",
      required: true,
      helpText: "Utilisez 'primary' pour votre calendrier principal",
    },
  ],

  configFields: [
    {
      key: "syncDirection",
      label: "Direction de synchronisation",
      type: "select",
      options: [
        { value: "read", label: "Lecture seule (vérifier disponibilités)" },
        { value: "write", label: "Écriture seule (créer des événements)" },
        { value: "both", label: "Bidirectionnelle" },
      ],
      defaultValue: "both",
    },
    {
      key: "reminderMinutes",
      label: "Rappel (minutes avant)",
      type: "number",
      defaultValue: 60,
    },
  ],

  async validateCredentials(credentials: GoogleCalendarCredentials) {
    if (!credentials.calendarId) {
      return { valid: false, error: "L'ID du calendrier est requis" };
    }

    // In production, validate with Google API
    // For now, accept any non-empty calendar ID
    return { valid: true };
  },

  async healthCheck(credentials: GoogleCalendarCredentials): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      if (!credentials.accessToken) {
        return {
          healthy: false,
          message: "Non connecté. Veuillez autoriser l'accès à Google Calendar.",
        };
      }

      // In production, make a test API call to Google Calendar
      // For now, simulate a health check
      const latencyMs = Date.now() - start;

      return {
        healthy: true,
        message: "Connecté à Google Calendar",
        latencyMs,
        details: {
          calendarId: credentials.calendarId,
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

  getOAuthUrl(redirectUri: string, state: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID not configured");
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  async handleOAuthCallback(code: string, _state: string): Promise<GoogleCalendarCredentials> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth not configured");
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange OAuth code");
    }

    const tokens = await tokenResponse.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      calendarId: "primary",
    };
  },

  async getAvailableSlots(
    credentials: GoogleCalendarCredentials,
    startDate: Date,
    endDate: Date,
    duration: number
  ) {
    // In production, query Google Calendar API for busy times
    // and return available slots

    // For now, return mock available slots
    const slots: { start: Date; end: Date }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Add morning slots (9am - 12pm)
        for (let hour = 9; hour < 12; hour++) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + duration);

          slots.push({ start: slotStart, end: slotEnd });
        }

        // Add afternoon slots (14pm - 18pm)
        for (let hour = 14; hour < 18; hour++) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + duration);

          slots.push({ start: slotStart, end: slotEnd });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  },

  async createEvent(
    credentials: GoogleCalendarCredentials,
    event: {
      title: string;
      description?: string;
      start: Date;
      end: Date;
      attendeeEmail?: string;
    }
  ) {
    // In production, create event via Google Calendar API
    // For now, return a mock event ID

    const eventId = `gcal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("[GoogleCalendar] Creating event:", {
      calendarId: credentials.calendarId,
      event,
    });

    return {
      eventId,
      eventUrl: `https://calendar.google.com/calendar/event?eid=${eventId}`,
    };
  },

  async cancelEvent(credentials: GoogleCalendarCredentials, eventId: string) {
    // In production, delete event via Google Calendar API
    console.log("[GoogleCalendar] Cancelling event:", {
      calendarId: credentials.calendarId,
      eventId,
    });
  },
};
