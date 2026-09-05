// src/lib/api/bookings.ts
export interface CreateBookingIntentParams {
  journeyId?: string;
  provider: string;
  selectedOption: any;
  providerReference?: string;
  bookingMethod: 'OFFICIAL_PARTNER' | 'DIRECT_API' | 'DEEP_LINK';
  requestedParameters?: any;
}

export interface BookingIntentResponse {
  success: boolean;
  intentId: string;
  provider: string;
  bookingMethod: string;
  deepLinkUrl?: string;
  status: string;
  createdAt: string;
}

export interface CreateBookingParams {
  intentId?: string;
  provider: string;
  title: string;
  totalPrice: number;
  currency?: string;
  passengers: {
    name: string;
    age?: number;
    gender?: string;
    berthOrSeat?: string;
    mealPreference?: string;
  }[];
  legs?: any[];
  cancellationPolicy?: any;
  modificationPolicy?: any;
  disruptionShield?: string;
  provenance?: any;
}

export async function createBookingIntent(
  params: CreateBookingIntentParams,
  idToken?: string,
  uid?: string
): Promise<BookingIntentResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch('/api/bookings/intent', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to create booking intent (${res.status})`);
  }

  return res.json();
}

export async function createBooking(
  params: CreateBookingParams,
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; booking: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to create booking in vault (${res.status})`);
  }

  return res.json();
}

export async function fetchUserBookings(
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; bookings: any[] }> {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch('/api/bookings', {
    headers,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to fetch bookings (${res.status})`);
  }

  return res.json();
}

export async function fetchBookingById(
  id: string,
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; booking: any }> {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch(`/api/bookings/${id}`, {
    headers,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to fetch booking ${id} (${res.status})`);
  }

  return res.json();
}
