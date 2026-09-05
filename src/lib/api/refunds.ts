// src/lib/api/refunds.ts

export interface CancelBookingParams {
  bookingId: string;
  reason?: string;
}

export interface ModifyBookingParams {
  bookingId: string;
  newDate?: string;
  newCabinClass?: string;
  notes?: string;
}

export interface FileRefundClaimParams {
  bookingId: string;
  segmentId?: string;
  provider: string;
  providerReference: string;
  originalAmount: number;
  expectedRefund: number;
  reason: string;
  ruleId?: string;
  policyVersion?: string;
}

export async function cancelBooking(
  params: CancelBookingParams,
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; bookingId: string; cancellationStatus: string; refundCase?: any; message: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch(`/api/bookings/${params.bookingId}/cancel`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to cancel booking (${res.status})`);
  }

  return res.json();
}

export async function modifyBooking(
  params: ModifyBookingParams,
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; bookingId: string; modificationStatus: string; updatedBooking: any; message: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch(`/api/bookings/${params.bookingId}/modify`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to modify booking (${res.status})`);
  }

  return res.json();
}

export async function fetchBookingStatus(
  bookingId: string,
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; bookingId: string; status: string; booking: any }> {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch(`/api/bookings/${bookingId}/status`, {
    headers,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to fetch booking status (${res.status})`);
  }

  return res.json();
}

export async function fetchUserRefunds(
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; refunds: any[]; count: number }> {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch('/api/refunds', {
    headers,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to fetch refunds (${res.status})`);
  }

  return res.json();
}

export async function fetchRefundById(
  id: string,
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; refund: any }> {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch(`/api/refunds/${id}`, {
    headers,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to fetch refund case ${id} (${res.status})`);
  }

  return res.json();
}

export async function fileRefundClaim(
  params: FileRefundClaimParams,
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; refundCase: any; message: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch('/api/refunds', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to file refund claim (${res.status})`);
  }

  return res.json();
}
