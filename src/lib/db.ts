// src/lib/db.ts
import fs from 'fs';
import path from 'path';
import { TravellerProfile } from '../types/profile';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoredProfileRecord {
  uid: string;
  email?: string;
  profile: TravellerProfile;
  updatedAt: string;
}

function loadProfiles(): Record<string, StoredProfileRecord> {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const content = fs.readFileSync(PROFILES_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[DB] Failed reading profiles file, initializing empty:', err);
  }
  return {};
}

function saveProfiles(data: Record<string, StoredProfileRecord>) {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed writing to profiles file:', err);
  }
}

export const ProfileStore = {
  getProfileByUid(uid: string): TravellerProfile | null {
    const profiles = loadProfiles();
    const record = profiles[uid];
    return record ? record.profile : null;
  },

  upsertProfile(uid: string, email: string, profile: TravellerProfile): TravellerProfile {
    const profiles = loadProfiles();
    const now = new Date().toISOString();

    const updatedProfile: TravellerProfile = {
      ...profile,
      userId: uid,
      isComplete: true,
      updatedAt: now,
      createdAt: profiles[uid]?.profile.createdAt || now,
    };

    profiles[uid] = {
      uid,
      email,
      profile: updatedProfile,
      updatedAt: now,
    };

    saveProfiles(profiles);
    return updatedProfile;
  }
};
