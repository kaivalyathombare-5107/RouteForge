// src/lib/api/journeys.ts
import { JourneySearchParams, JourneySearchResponse } from '../../types/journey';

export async function searchJourneys(
  params: JourneySearchParams,
  idToken?: string
): Promise<JourneySearchResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const res = await fetch('/api/journeys/search', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to search journeys (${res.status})`);
  }

  return res.json();
}
