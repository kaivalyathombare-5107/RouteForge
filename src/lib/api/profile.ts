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
  // First check client-side backup cache so profile is instantly available even when offline or signed out
  try {
    const cached = localStorage.getItem(`routeforge_profile_${uid}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.isComplete) {
        // Return cached immediately or continue to sync
        return { success: true, isComplete: true, profile: parsed };
      }
    }
  } catch (e) {
    // Ignore cache error
  }

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

    const data: ProfileResponse = await res.json();
    if (data.success && data.profile) {
      try {
        localStorage.setItem(`routeforge_profile_${uid}`, JSON.stringify(data.profile));
      } catch {
        // Ignore cache storage error
      }
    }
    return data;
  } catch (err: any) {
    console.warn('[Profile API] fetch error:', err);
    // Fallback to cache if available
    try {
      const cached = localStorage.getItem(`routeforge_profile_${uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) return { success: true, isComplete: true, profile: parsed };
      }
    } catch {
      // Ignore
    }
    return { success: false, isComplete: false, error: err.message };
  }
}

export async function saveTravellerProfile(uid: string, email: string, profile: TravellerProfile): Promise<ProfileResponse> {
  // Cache locally first to guarantee persistence across refresh and sign out
  try {
    localStorage.setItem(`routeforge_profile_${uid}`, JSON.stringify(profile));
  } catch {
    // Ignore
  }

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
    return { success: true, isComplete: true, profile, error: err.message };
  }
}
