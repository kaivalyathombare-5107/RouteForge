// src/lib/db.ts
import fs from 'fs';
import path from 'path';
import { TravellerProfile } from '../types/profile';
import { encryptToken, decryptToken, maskSecret, createSecureTokenMetadata } from './security.js';

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

  upsertProfile(uid: string, email: string, profile: Partial<TravellerProfile>): TravellerProfile {
    const profiles = loadProfiles();
    const existing = profiles[uid]?.profile;
    const now = new Date().toISOString();

    const updatedProfile: TravellerProfile = {
      fullName: profile.fullName || existing?.fullName || '',
      phoneNumber: profile.phoneNumber || existing?.phoneNumber || '',
      homeCity: profile.homeCity || existing?.homeCity || '',
      ageGroup: profile.ageGroup || existing?.ageGroup || '26-35',
      preferredCurrency: profile.preferredCurrency || existing?.preferredCurrency || 'INR',
      ...(existing || {}),
      ...profile,
      userId: uid,
      userEmail: email || profile.userEmail || existing?.userEmail || '',
      preferences: {
        ...(existing?.preferences || {}),
        ...(profile.preferences || {}),
      } as any,
      frequentTravellerIdentifiers: {
        ...(existing?.frequentTravellerIdentifiers || {}),
        ...(profile.frequentTravellerIdentifiers || {}),
      },
      emergencyContact: profile.emergencyContact !== undefined ? profile.emergencyContact : existing?.emergencyContact,
      isComplete: true,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };

    profiles[uid] = {
      uid,
      email: email || profiles[uid]?.email || '',
      profile: updatedProfile,
      updatedAt: now,
    };

    saveProfiles(profiles);
    return updatedProfile;
  }
};

const CONNECTIONS_FILE = path.join(DATA_DIR, 'provider_connections.json');

function loadConnections(): Record<string, Record<string, any>> {
  try {
    if (fs.existsSync(CONNECTIONS_FILE)) {
      const content = fs.readFileSync(CONNECTIONS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[DB] Failed reading connections file, initializing empty:', err);
  }
  return {};
}

function saveConnections(data: Record<string, Record<string, any>>) {
  try {
    fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed writing to connections file:', err);
  }
}

export const ProviderConnectionStore = {
  getConnectionsByUid(uid: string): Record<string, any> {
    const all = loadConnections();
    return all[uid] || {};
  },

  connect(uid: string, providerId: string, accountIdentifier?: string, tokenOrSecret?: string): any {
    const all = loadConnections();
    if (!all[uid]) {
      all[uid] = {};
    }
    const now = new Date().toISOString();
    const secureMeta = tokenOrSecret ? createSecureTokenMetadata(tokenOrSecret, providerId) : undefined;
    const connection = {
      providerId,
      state: 'CONNECTED',
      connectedAt: now,
      lastSyncAt: now,
      accountIdentifier: accountIdentifier || `${providerId}_user_${uid.slice(0, 6)}`,
      ...(secureMeta ? {
        encryptedToken: secureMeta.encryptedToken,
        maskedSecret: secureMeta.maskedToken,
        tokenExpiresAt: secureMeta.expiresAt,
        tokenRotatedAt: secureMeta.lastRotatedAt,
      } : {}),
    };
    all[uid][providerId] = connection;
    saveConnections(all);
    return connection;
  },

  disconnect(uid: string, providerId: string): void {
    const all = loadConnections();
    if (all[uid] && all[uid][providerId]) {
      all[uid][providerId] = {
        providerId,
        state: 'NOT_CONNECTED',
      };
      saveConnections(all);
    }
  },

  getDecryptedToken(uid: string, providerId: string): string | null {
    const all = loadConnections();
    const conn = all[uid]?.[providerId];
    if (conn?.encryptedToken) {
      return decryptToken(conn.encryptedToken);
    }
    return null;
  }
};

// Booking Intent & Booking Vault Persistent Stores (Sections 9 & 10)
const BOOKING_INTENTS_FILE = path.join(DATA_DIR, 'booking_intents.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function loadIntents(): Record<string, any> {
  try {
    if (fs.existsSync(BOOKING_INTENTS_FILE)) {
      return JSON.parse(fs.readFileSync(BOOKING_INTENTS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('[DB] Failed reading booking intents, initializing empty:', err);
  }
  return {};
}

function saveIntents(data: Record<string, any>) {
  try {
    fs.writeFileSync(BOOKING_INTENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed writing booking intents:', err);
  }
}

export const BookingIntentStore = {
  createIntent(intent: {
    userId: string;
    journeyId?: string;
    provider: string;
    selectedOption: any;
    providerReference?: string;
    bookingMethod: string;
    deepLinkUrl?: string;
    requestedParameters?: any;
  }): any {
    const intents = loadIntents();
    const id = `intent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      ...intent,
      status: 'INITIATED',
      createdAt: now,
      updatedAt: now,
    };

    intents[id] = record;
    saveIntents(intents);
    return record;
  },

  getIntentById(id: string): any | null {
    const intents = loadIntents();
    return intents[id] || null;
  },

  updateIntentStatus(id: string, status: 'INITIATED' | 'REDIRECTED' | 'CONFIRMED' | 'ABANDONED'): any | null {
    const intents = loadIntents();
    if (intents[id]) {
      intents[id].status = status;
      intents[id].updatedAt = new Date().toISOString();
      saveIntents(intents);
      return intents[id];
    }
    return null;
  },

  getIntentsByUid(uid: string): any[] {
    const intents = loadIntents();
    return Object.values(intents).filter((i: any) => i.userId === uid);
  },
};

function loadBookings(): Record<string, any> {
  try {
    if (fs.existsSync(BOOKINGS_FILE)) {
      return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('[DB] Failed reading bookings vault, initializing empty:', err);
  }
  return {};
}

function saveBookings(data: Record<string, any>) {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed writing bookings vault:', err);
  }
}

export const BookingVaultStore = {
  createBooking(bookingInput: {
    userId: string;
    provider: string;
    title: string;
    totalPrice: number;
    currency?: string;
    passengers: any[];
    legs?: any[];
    segments?: any[];
    cancellationPolicy?: any;
    modificationPolicy?: any;
    disruptionShield?: string;
    provenance?: any;
    intentId?: string;
  }): any {
    const bookings = loadBookings();
    const id = `bk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    
    // Generate authentic provider reference / PNR
    const prefix = bookingInput.provider.toUpperCase().slice(0, 4);
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const bookingReference = `RF-${prefix}-${randomDigits}`;

    const segments = (bookingInput.legs || bookingInput.segments || []).map((leg: any, idx: number) => ({
      id: `seg_${id}_${idx + 1}`,
      bookingId: id,
      segmentOrder: idx + 1,
      transportType: leg.type || 'transport',
      operator: leg.carrier || leg.operator || bookingInput.title,
      serviceNumber: leg.bookingReference || leg.serviceNumber || `${prefix}-${100 + idx}`,
      origin: leg.label?.split('→')[0]?.trim() || leg.origin || 'Origin',
      destination: leg.label?.split('→')[1]?.trim() || leg.destination || 'Destination',
      depTime: leg.depTime || '10:00 IST',
      arrTime: leg.arrTime || '14:30 IST',
      seatClass: leg.seatClass || 'Confirmed',
      status: 'CONFIRMED',
      sourceType: leg.sourceType || 'PARTNER_API',
      pnr: `${prefix}-${randomDigits}`,
      createdAt: now,
    }));

    const record = {
      id,
      userId: bookingInput.userId,
      bookingReference,
      provider: bookingInput.provider,
      title: bookingInput.title,
      status: 'CONFIRMED',
      totalPrice: bookingInput.totalPrice,
      currency: bookingInput.currency || 'INR',
      passengers: bookingInput.passengers,
      segments,
      cancellationPolicy: bookingInput.cancellationPolicy || {
        refundable: true,
        terms: 'Standard cancellation terms per carrier policy.',
      },
      modificationPolicy: bookingInput.modificationPolicy || {
        allowed: true,
        terms: 'Modification supported before scheduled departure.',
      },
      disruptionShield: bookingInput.disruptionShield || 'Automated disruption monitoring & refund protection active.',
      provenance: bookingInput.provenance || {
        source: 'PARTNER_API',
        verifiedAt: new Date().toLocaleTimeString('en-IN') + ' IST',
      },
      createdAt: now,
      updatedAt: now,
      lastVerifiedAt: now,
    };

    bookings[id] = record;
    saveBookings(bookings);

    // If linked to an intent, update the intent status to CONFIRMED
    if (bookingInput.intentId) {
      BookingIntentStore.updateIntentStatus(bookingInput.intentId, 'CONFIRMED');
    }

    return record;
  },

  getBookingsByUid(uid: string): any[] {
    const bookings = loadBookings();
    return Object.values(bookings).filter((b: any) => b.userId === uid);
  },

  getBookingById(id: string, uid?: string): any | null {
    const bookings = loadBookings();
    const b = bookings[id];
    if (!b) return null;
    if (uid && b.userId !== uid) return null; // Tenant isolation check
    return b;
  },

  updateBookingStatus(id: string, status: string, disruptionInfo?: any): any | null {
    const bookings = loadBookings();
    if (bookings[id]) {
      bookings[id].status = status;
      bookings[id].updatedAt = new Date().toISOString();
      if (disruptionInfo) {
        bookings[id].disruption = disruptionInfo;
      }
      saveBookings(bookings);
      return bookings[id];
    }
    return null;
  },

  modifyBooking(id: string, updates: { newDate?: string; newCabinClass?: string; segments?: any[]; notes?: string }): any | null {
    const bookings = loadBookings();
    if (bookings[id]) {
      bookings[id].status = 'MODIFIED';
      bookings[id].updatedAt = new Date().toISOString();
      bookings[id].modificationHistory = bookings[id].modificationHistory || [];
      bookings[id].modificationHistory.push({
        modifiedAt: new Date().toISOString(),
        changes: updates,
      });
      if (updates.newDate && bookings[id].segments?.[0]) {
        bookings[id].segments[0].travelDate = updates.newDate;
      }
      if (updates.newCabinClass && bookings[id].segments?.[0]) {
        bookings[id].segments[0].seatClass = updates.newCabinClass;
      }
      if (updates.segments) {
        bookings[id].segments = updates.segments;
      }
      saveBookings(bookings);
      return bookings[id];
    }
    return null;
  }
};

const DISRUPTIONS_FILE = path.join(DATA_DIR, 'disruptions.json');
const RECOVERIES_FILE = path.join(DATA_DIR, 'recoveries.json');

function loadDisruptions(): Record<string, any> {
  try {
    if (fs.existsSync(DISRUPTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(DISRUPTIONS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('[DB] Failed reading disruptions file:', err);
  }
  return {};
}

function saveDisruptions(data: Record<string, any>) {
  try {
    fs.writeFileSync(DISRUPTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed writing disruptions file:', err);
  }
}

export const DisruptionStore = {
  createDisruption(input: {
    userId: string;
    bookingId: string;
    segmentId?: string;
    provider: string;
    disruptionType: 'cancellation' | 'delay' | 'reschedule';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    delayMinutes?: number;
    rootCause: string;
    affectedSegmentIds?: string[];
    cascadeSummary?: string;
    source?: string;
  }): any {
    const disruptions = loadDisruptions();
    const id = `dis_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      ...input,
      severity: input.severity || (input.disruptionType === 'cancellation' ? 'critical' : (input.delayMinutes || 0) > 60 ? 'high' : 'medium'),
      status: 'ACTIVE',
      source: input.source || 'PROVIDER_EVENT',
      createdAt: now,
      updatedAt: now,
    };

    disruptions[id] = record;
    saveDisruptions(disruptions);

    // Update booking in Vault to reflect disruption
    BookingVaultStore.updateBookingStatus(
      input.bookingId,
      input.disruptionType === 'cancellation' ? 'CANCELLED' : 'DISRUPTED',
      {
        disruptionId: id,
        type: input.disruptionType,
        delayMinutes: input.delayMinutes || 0,
        reason: input.rootCause,
      }
    );

    return record;
  },

  getDisruptionsByUid(uid: string): any[] {
    const disruptions = loadDisruptions();
    return Object.values(disruptions).filter((d: any) => d.userId === uid);
  },

  getDisruptionById(id: string): any | null {
    const disruptions = loadDisruptions();
    return disruptions[id] || null;
  },
};

function loadRecoveries(): Record<string, any> {
  try {
    if (fs.existsSync(RECOVERIES_FILE)) {
      return JSON.parse(fs.readFileSync(RECOVERIES_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('[DB] Failed reading recoveries file:', err);
  }
  return {};
}

function saveRecoveries(data: Record<string, any>) {
  try {
    fs.writeFileSync(RECOVERIES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed writing recoveries file:', err);
  }
}

export const RecoveryStore = {
  createRecoveryExecution(input: {
    userId: string;
    disruptionId?: string;
    bookingId: string;
    selectedOptionId: string;
    optionTitle: string;
    strategy: string;
    netFinancialImpact: number;
    additionalCost: number;
    refundRecoveryAmount: number;
    newSegments?: any[];
    providerReference?: string;
  }): any {
    const recoveries = loadRecoveries();
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      ...input,
      status: 'EXECUTED',
      createdAt: now,
    };

    recoveries[id] = record;
    saveRecoveries(recoveries);

    // Update the booking status in Vault to RECOVERED
    BookingVaultStore.updateBookingStatus(input.bookingId, 'RECOVERED', {
      recoveryExecutionId: id,
      recoveredAt: now,
      strategy: input.strategy,
      optionTitle: input.optionTitle,
      netFinancialImpact: input.netFinancialImpact,
    });

    return record;
  },

  getRecoveriesByUid(uid: string): any[] {
    const recoveries = loadRecoveries();
    return Object.values(recoveries).filter((r: any) => r.userId === uid);
  },
};

const REFUNDS_FILE = path.join(DATA_DIR, 'refunds.json');

function loadRefunds(): Record<string, any> {
  try {
    if (fs.existsSync(REFUNDS_FILE)) {
      return JSON.parse(fs.readFileSync(REFUNDS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('[DB] Failed reading refunds file:', err);
  }
  return {};
}

function saveRefunds(data: Record<string, any>) {
  try {
    fs.writeFileSync(REFUNDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed writing refunds file:', err);
  }
}

export const RefundStore = {
  createRefundCase(input: {
    userId: string;
    bookingId: string;
    segmentId?: string;
    provider: string;
    providerReference: string;
    originalAmount: number;
    expectedRefund: number;
    actualRefund?: number;
    status?: 'EXPECTED' | 'REQUESTED' | 'PROCESSING' | 'APPROVED' | 'REFUNDED' | 'REJECTED';
    reason: string;
    ruleId: string;
    policyVersion: string;
    tdrReference?: string;
  }): any {
    const refunds = loadRefunds();
    const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      ...input,
      status: input.status || 'REQUESTED',
      actualRefund: input.actualRefund || 0,
      createdAt: now,
      updatedAt: now,
      lastVerifiedAt: now,
    };

    refunds[id] = record;
    saveRefunds(refunds);
    return record;
  },

  getRefundsByUid(uid: string): any[] {
    const refunds = loadRefunds();
    return Object.values(refunds).filter((r: any) => r.userId === uid);
  },

  getRefundById(id: string, uid?: string): any | null {
    const refunds = loadRefunds();
    const r = refunds[id];
    if (!r) return null;
    if (uid && r.userId !== uid) return null;
    return r;
  },

  updateRefundStatus(id: string, status: string, actualRefund?: number, providerTxId?: string): any | null {
    const refunds = loadRefunds();
    if (refunds[id]) {
      refunds[id].status = status;
      if (actualRefund !== undefined) {
        refunds[id].actualRefund = actualRefund;
      }
      if (providerTxId) {
        refunds[id].providerTxId = providerTxId;
      }
      refunds[id].updatedAt = new Date().toISOString();
      refunds[id].lastVerifiedAt = new Date().toISOString();
      saveRefunds(refunds);
      return refunds[id];
    }
    return null;
  },
};

