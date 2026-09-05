// src/lib/api/disruptions.ts
import { RecoveryOption } from '../../types';

export interface CreateDisruptionParams {
  bookingId: string;
  segmentId?: string;
  provider: string;
  disruptionType: 'cancellation' | 'delay' | 'reschedule';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  delayMinutes?: number;
  rootCause: string;
  affectedSegmentIds?: string[];
  source?: string;
}

export interface ExecuteRecoveryParams {
  disruptionId?: string;
  bookingId: string;
  selectedOptionId: string;
  optionTitle: string;
  strategy: string;
  netFinancialImpact: number;
  additionalCost: number;
  refundRecoveryAmount: number;
  newSegments?: any[];
}

export async function createDisruption(
  params: CreateDisruptionParams,
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; disruption: any; recoveryOptions?: RecoveryOption[] }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch('/api/disruptions', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to report disruption (${res.status})`);
  }

  return res.json();
}

export async function fetchUserDisruptions(
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; disruptions: any[] }> {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch('/api/disruptions', {
    headers,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to fetch disruptions (${res.status})`);
  }

  return res.json();
}

export async function fetchRecoveryOptions(
  params: { bookingId?: string; trip?: any },
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; recoveryOptions: RecoveryOption[] }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch('/api/recovery/options', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to fetch recovery options (${res.status})`);
  }

  return res.json();
}

export async function executeRecovery(
  params: ExecuteRecoveryParams,
  idToken?: string,
  uid?: string
): Promise<{ success: boolean; execution: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (uid) headers['x-firebase-uid'] = uid;

  const res = await fetch('/api/recovery/execute', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to execute recovery (${res.status})`);
  }

  return res.json();
}

export async function sendProviderWebhook(
  provider: string,
  payload: any
): Promise<{ success: boolean; message: string; disruption?: any }> {
  const res = await fetch(`/api/webhooks/${provider.toLowerCase()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Webhook error (${res.status})`);
  }

  return res.json();
}
