// src/lib/api/profile.ts
import { TravellerProfile } from '../../types/profile';

export interface ProfileResponse {
  success: boolean;
  isComplete: boolean;
  profile?: TravellerProfile;
  message?: string;
  error?: string;
}

export async function fetchTravellerProfile(uid: string, email?: string): Promise<ProfileResponse> {
  try {
    const res = await fetch(`/api/profile?uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(email || '')}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-firebase-uid': uid,
        'x-firebase-email': email || '',
      },
    });

    if (res.status === 404) {
      return { success: false, isComplete: false };
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch profile: ${res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('[Profile API] fetch error:', err);
    return { success: false, isComplete: false, error: err.message };
  }
}

export async function saveTravellerProfile(uid: string, email: string, profile: TravellerProfile): Promise<ProfileResponse> {
  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-firebase-uid': uid,
        'x-firebase-email': email,
      },
      body: JSON.stringify({
        userId: uid,
        email,
        profile,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error('[Profile API] save error:', err);
    return { success: false, isComplete: false, error: err.message };
  }
}
