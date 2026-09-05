// src/lib/api/providers.ts
import { ProviderWithStatus, ProviderId } from '../providers/types';

export interface ProvidersResponse {
  success: boolean;
  providers: ProviderWithStatus[];
  error?: string;
}

export interface ConnectProviderResponse {
  success: boolean;
  providerId: ProviderId;
  state: string;
  message?: string;
  error?: string;
}

export async function fetchProviders(uid: string): Promise<ProvidersResponse> {
  try {
    const res = await fetch(`/api/providers?uid=${encodeURIComponent(uid)}`, {
      headers: {
        'x-firebase-uid': uid,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to load providers: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error('[Provider API] fetch error:', err);
    return { success: false, providers: [], error: err.message };
  }
}

export async function connectProvider(uid: string, providerId: string, accountIdentifier?: string): Promise<ConnectProviderResponse> {
  try {
    const res = await fetch(`/api/providers/${encodeURIComponent(providerId)}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-firebase-uid': uid,
      },
      body: JSON.stringify({
        userId: uid,
        accountIdentifier,
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Failed to connect provider: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error('[Provider API] connect error:', err);
    return { success: false, providerId, state: 'NOT_CONNECTED', error: err.message };
  }
}

export async function disconnectProvider(uid: string, providerId: string): Promise<ConnectProviderResponse> {
  try {
    const res = await fetch(`/api/providers/${encodeURIComponent(providerId)}/disconnect?uid=${encodeURIComponent(uid)}`, {
      method: 'DELETE',
      headers: {
        'x-firebase-uid': uid,
      },
      body: JSON.stringify({
        userId: uid,
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Failed to disconnect provider: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error('[Provider API] disconnect error:', err);
    return { success: false, providerId, state: 'CONNECTED', error: err.message };
  }
}
