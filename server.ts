import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { propagateDisruption, generateRecoveryOptions, calculateIRCTCRefund, calculateFlightRefund } from './src/lib/deterministic-engines.js';

import { ProfileStore, ProviderConnectionStore, BookingIntentStore, BookingVaultStore, DisruptionStore, RecoveryStore, RefundStore } from './src/lib/db.js';
import { CORE_PROVIDERS } from './src/lib/providers/registry.js';
import { providerAdaptersMap } from './src/lib/providers/index.js';
import { planJourneys } from './src/lib/journey/planner.js';
import { encryptToken, decryptToken, maskSecret } from './src/lib/security.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to extract UID from request
function getRequestUid(req: express.Request): { uid: string; email: string } | null {
  const headerUid = req.headers['x-firebase-uid'] as string;
  const headerEmail = (req.headers['x-firebase-email'] as string) || '';
  if (headerUid) {
    return { uid: headerUid, email: headerEmail };
  }
  const bodyUid = req.body?.userId || req.body?.uid;
  const bodyEmail = req.body?.email || '';
  if (bodyUid) {
    return { uid: bodyUid, email: bodyEmail };
  }
  const queryUid = req.query.uid as string;
  const queryEmail = (req.query.email as string) || '';
  if (queryUid) {
    return { uid: queryUid, email: queryEmail };
  }
  return null;
}

// Traveller Profile API Endpoints
app.get('/api/profile', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    if (!userAuth || !userAuth.uid) {
      return res.status(401).json({ success: false, error: 'Authentication required. Pass x-firebase-uid or uid query parameter.' });
    }

    const profile = ProfileStore.getProfileByUid(userAuth.uid);
    if (!profile || !profile.isComplete) {
      return res.status(404).json({ success: false, isComplete: false, message: 'Traveller profile not yet completed' });
    }

    res.json({ success: true, isComplete: true, profile });
  } catch (error: any) {
    console.error('[API] Error fetching profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/profile', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid || req.body?.profile?.userId;
    const email = userAuth?.email || req.body?.email || '';

    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to save profile.' });
    }

    const profileData = req.body?.profile || req.body;
    if (!profileData || !profileData.fullName || !profileData.phoneNumber) {
      return res.status(400).json({ success: false, error: 'Missing required profile fields (fullName, phoneNumber, etc.)' });
    }

    const savedProfile = ProfileStore.upsertProfile(uid, email, profileData);
    res.json({ success: true, isComplete: true, profile: savedProfile });
  } catch (error: any) {
    console.error('[API] Error saving profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Provider Connection Center API Endpoints
app.get('/api/providers', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const userConnections = userAuth?.uid ? ProviderConnectionStore.getConnectionsByUid(userAuth.uid) : {};

    const providers = CORE_PROVIDERS.map((provider) => {
      const conn = userConnections[provider.id];
      return {
        ...provider,
        connectionState: conn?.state || 'NOT_CONNECTED',
        accountIdentifier: conn?.accountIdentifier || null,
        lastSyncAt: conn?.lastSyncAt || null,
      };
    });

    res.json({ success: true, providers });
  } catch (error: any) {
    console.error('[API] Error fetching providers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/providers/:provider/connect', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid || req.body?.userId;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to connect provider.' });
    }

    const providerId = req.params.provider.toLowerCase();
    const providerMeta = CORE_PROVIDERS.find(p => p.id === providerId);
    if (!providerMeta) {
      return res.status(404).json({ success: false, error: `Provider '${providerId}' not found.` });
    }

    const accountIdentifier = req.body?.accountIdentifier;
    const tokenOrSecret = req.body?.apiSecret || req.body?.token;
    const connection = ProviderConnectionStore.connect(uid, providerId, accountIdentifier, tokenOrSecret);

    res.json({
      success: true,
      providerId,
      state: 'CONNECTED',
      connection,
      message: `Successfully connected ${providerMeta.name}`,
    });
  } catch (error: any) {
    console.error('[API] Error connecting provider:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/providers/:provider/disconnect', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid || (req.query.uid as string) || req.body?.userId;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to disconnect provider.' });
    }

    const providerId = req.params.provider.toLowerCase();
    ProviderConnectionStore.disconnect(uid, providerId);

    res.json({
      success: true,
      providerId,
      state: 'NOT_CONNECTED',
      message: `Disconnected ${providerId}`,
    });
  } catch (error: any) {
    console.error('[API] Error disconnecting provider:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multi-Modal Journey Search & Normalization Endpoint (Sections 5, 6, 7)
app.post('/api/journeys/search', async (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const userProfile = userAuth?.uid ? ProfileStore.getProfileByUid(userAuth.uid) : null;
    const searchParams = req.body || {};

    const searchResponse = await planJourneys(searchParams, userProfile);
    res.json(searchResponse);
  } catch (error: any) {
    console.error('[API] Error searching journeys:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Booking Intent & Booking Vault API Endpoints (Sections 8, 9, 10, 13)
app.post('/api/bookings/intent', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid || req.body?.userId;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to initiate booking.' });
    }

    const { journeyId, provider, selectedOption, providerReference, bookingMethod, requestedParameters } = req.body;
    if (!provider || !selectedOption) {
      return res.status(400).json({ success: false, error: 'Missing provider or selectedOption payload.' });
    }

    // Resolve adapter deep-link if official deep-link is supported
    let deepLinkUrl: string | undefined = undefined;
    const adapter = providerAdaptersMap[provider.toLowerCase()];
    if (adapter?.generateDeepLink) {
      deepLinkUrl = adapter.generateDeepLink(requestedParameters || {});
    }

    const intent = BookingIntentStore.createIntent({
      userId: uid,
      journeyId,
      provider: provider.toLowerCase(),
      selectedOption,
      providerReference: providerReference || selectedOption.id || selectedOption.serviceNumber,
      bookingMethod: bookingMethod || 'OFFICIAL_PARTNER',
      deepLinkUrl,
      requestedParameters,
    });

    res.json({
      success: true,
      intentId: intent.id,
      provider: intent.provider,
      bookingMethod: intent.bookingMethod,
      deepLinkUrl: intent.deepLinkUrl,
      status: intent.status,
      createdAt: intent.createdAt,
    });
  } catch (error: any) {
    console.error('[API] Error creating booking intent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/bookings', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid || req.body?.userId;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to create booking.' });
    }

    const {
      provider,
      title,
      totalPrice,
      currency,
      passengers,
      legs,
      segments,
      cancellationPolicy,
      modificationPolicy,
      disruptionShield,
      provenance,
      intentId,
    } = req.body;

    if (!provider || !title || !totalPrice) {
      return res.status(400).json({ success: false, error: 'Missing required booking fields (provider, title, totalPrice).' });
    }

    const booking = BookingVaultStore.createBooking({
      userId: uid,
      provider: provider.toLowerCase(),
      title,
      totalPrice,
      currency: currency || 'INR',
      passengers: passengers || [{ name: userAuth?.email || 'Primary Traveler' }],
      legs,
      segments,
      cancellationPolicy,
      modificationPolicy,
      disruptionShield,
      provenance,
      intentId,
    });

    res.json({
      success: true,
      booking,
      message: `Booking successfully confirmed in Vault with PNR ${booking.bookingReference}`,
    });
  } catch (error: any) {
    console.error('[API] Error creating booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/bookings', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to fetch bookings.' });
    }

    const bookings = BookingVaultStore.getBookingsByUid(uid);
    res.json({ success: true, bookings, count: bookings.length });
  } catch (error: any) {
    console.error('[API] Error fetching bookings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/bookings/:id', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to fetch booking details.' });
    }

    const bookingId = req.params.id;
    const booking = BookingVaultStore.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: `Booking ${bookingId} not found.` });
    }

    // Tenant Isolation Check (Section 13 & 24: verify one user cannot access another user's bookings)
    if (booking.userId !== uid) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to view this booking.' });
    }

    res.json({ success: true, booking });
  } catch (error: any) {
    console.error('[API] Error fetching booking by ID:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Session Validation & Provisioning Endpoint (Section 1, 20)
app.post('/api/auth/session', (req, res) => {
  try {
    const { idToken, uid, email, displayName } = req.body;
    const userAuth = getRequestUid(req);
    const effectiveUid = uid || userAuth?.uid;
    const effectiveEmail = email || userAuth?.email || '';

    if (!effectiveUid) {
      return res.status(401).json({ success: false, error: 'Authentication required. Missing uid or token.' });
    }

    let profile = ProfileStore.getProfileByUid(effectiveUid);
    if (!profile) {
      ProfileStore.upsertProfile(effectiveUid, effectiveEmail, {
        fullName: displayName || effectiveEmail.split('@')[0] || 'Authenticated Traveler',
        phoneNumber: '',
        emergencyContact: { name: '', phone: '', relation: '' },
        preferredTravelClass: 'economy',
        dietaryPreference: 'standard',
        wheelchairAssistance: false,
        frequentFlyerPrograms: [],
        loyaltyAccounts: [],
      });
      profile = ProfileStore.getProfileByUid(effectiveUid);
    }

    res.json({
      success: true,
      authenticated: true,
      uid: effectiveUid,
      email: effectiveEmail,
      profile,
      sessionValidUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Error verifying session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Official Cancellation API Endpoint (Section 16, 17, 20)
app.post('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to cancel booking.' });
    }

    const bookingId = req.params.id;
    const booking = BookingVaultStore.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: `Booking ${bookingId} not found.` });
    }

    // Tenant Isolation Check (Section 13, 24)
    if (booking.userId !== uid) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to cancel this booking.' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Booking is already cancelled.' });
    }

    const reason = req.body?.reason || 'Passenger voluntary cancellation';

    // 1. Invoke Provider Cancellation
    const adapter = providerAdaptersMap[booking.provider] as any;
    let providerCancellationResult: any = null;
    if (adapter && typeof adapter.cancel === 'function') {
      try {
        providerCancellationResult = await adapter.cancel(booking.bookingReference, reason);
      } catch (err: any) {
        console.warn(`[API] Provider adapter cancellation failed for ${booking.provider}:`, err);
      }
    }

    // 2. Compute Deterministic Statutory Refund (Section 17)
    const isCarrierFault = reason.toLowerCase().includes('flight cancel') || 
                           reason.toLowerCase().includes('airline cancel') || 
                           reason.toLowerCase().includes('delay') || 
                           reason.toLowerCase().includes('schedule change') ||
                           booking.status === 'DISRUPTED';
    
    let refundAmount = 0;
    let ruleId = 'STATUTORY_REFUND';
    let policyCitation = 'Consumer Protection Regulation';

    const hasFlight = booking.provider === 'makemytrip' || booking.segments?.some((s: any) => s.transportType === 'flight');
    const hasTrain = booking.provider === 'irctc' || booking.segments?.some((s: any) => s.transportType === 'train');

    if (hasFlight) {
      const flightScenario = isCarrierFault ? 'AIRLINE_CANCELLED' : 'VOLUNTARY_CANCEL_GT_24H';
      const dgcaRefund = calculateFlightRefund(booking.totalPrice, flightScenario);
      refundAmount = dgcaRefund.estimatedRefund;
      ruleId = dgcaRefund.ruleId;
      policyCitation = dgcaRefund.policyVersion;
    } else if (hasTrain) {
      const trainScenario = isCarrierFault ? 'FULL_TRAIN_CANCELLED' : 'CONFIRMED_MORE_THAN_48H';
      const irctcRefund = calculateIRCTCRefund(booking.totalPrice, '2A', trainScenario, 48);
      refundAmount = irctcRefund.estimatedRefund;
      ruleId = irctcRefund.ruleId;
      policyCitation = irctcRefund.policyVersion;
    } else {
      refundAmount = Math.max(0, Math.round(booking.totalPrice * 0.9));
      ruleId = 'COMMERCIAL_CANCELLATION_POLICY';
      policyCitation = 'Standard partner cancellation policy';
    }

    // 3. Mark booking as CANCELLED in Vault
    BookingVaultStore.updateBookingStatus(bookingId, 'CANCELLED', {
      cancelledAt: new Date().toISOString(),
      reason,
      refundEligible: refundAmount > 0,
      expectedRefund: refundAmount,
    });

    // 4. Create statutory refund case in RefundStore
    const refundCase = RefundStore.createRefundCase({
      userId: uid,
      bookingId: booking.id,
      segmentId: booking.segments?.[0]?.id,
      provider: booking.provider,
      providerReference: booking.bookingReference,
      originalAmount: booking.totalPrice,
      expectedRefund: refundAmount,
      actualRefund: providerCancellationResult?.refundAmount || (isCarrierFault ? refundAmount : 0),
      status: (providerCancellationResult?.refundAmount || isCarrierFault) ? 'PROCESSING' : 'REQUESTED',
      reason,
      ruleId,
      policyVersion: policyCitation,
      tdrReference: hasTrain ? `TDR-${Date.now().toString().slice(-8)}` : undefined,
    });

    res.json({
      success: true,
      bookingId: booking.id,
      cancellationStatus: 'CANCELLED',
      refundCase,
      providerCancellationResult,
      message: `Booking ${booking.bookingReference} successfully cancelled. Statutory refund claim ${refundCase.id} registered.`,
    });
  } catch (error: any) {
    console.error('[API] Error cancelling booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Official Modification API Endpoint (Section 16, 20)
app.post('/api/bookings/:id/modify', async (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to modify booking.' });
    }

    const bookingId = req.params.id;
    const booking = BookingVaultStore.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: `Booking ${bookingId} not found.` });
    }

    // Tenant Isolation Check
    if (booking.userId !== uid) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to modify this booking.' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Cannot modify a cancelled booking.' });
    }

    if (booking.modificationPolicy?.allowed === false) {
      return res.status(400).json({ success: false, error: 'This booking fare rules do not permit modification.' });
    }

    const { newDate, newCabinClass, segments, notes } = req.body;

    const updatedBooking = BookingVaultStore.modifyBooking(bookingId, {
      newDate,
      newCabinClass,
      segments,
      notes,
    });

    res.json({
      success: true,
      bookingId,
      modificationStatus: 'MODIFIED',
      updatedBooking,
      message: `Booking ${booking.bookingReference} successfully modified.`,
    });
  } catch (error: any) {
    console.error('[API] Error modifying booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Booking Live Status Endpoint (Section 16, 20)
app.get('/api/bookings/:id/status', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to fetch booking status.' });
    }

    const bookingId = req.params.id;
    const booking = BookingVaultStore.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: `Booking ${bookingId} not found.` });
    }

    // Tenant Isolation Check
    if (booking.userId !== uid) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to access this booking.' });
    }

    const allDisruptions = DisruptionStore.getDisruptionsByUid(uid);
    const bookingDisruptions = allDisruptions.filter((d: any) => d.bookingId === bookingId);

    const allRefunds = RefundStore.getRefundsByUid(uid);
    const bookingRefunds = allRefunds.filter((r: any) => r.bookingId === bookingId);

    res.json({
      success: true,
      bookingId,
      status: booking.status,
      booking,
      disruptions: bookingDisruptions,
      refunds: bookingRefunds,
    });
  } catch (error: any) {
    console.error('[API] Error fetching booking status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Statutory Refund Engine Endpoints (Section 17, 20)
app.get('/api/refunds', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to fetch refunds.' });
    }

    const refunds = RefundStore.getRefundsByUid(uid);
    res.json({ success: true, refunds, count: refunds.length });
  } catch (error: any) {
    console.error('[API] Error fetching refunds:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/refunds/:id', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to fetch refund details.' });
    }

    const refundId = req.params.id;
    const refund = RefundStore.getRefundById(refundId, uid);
    if (!refund) {
      return res.status(404).json({ success: false, error: `Refund record ${refundId} not found or access denied.` });
    }

    res.json({ success: true, refund });
  } catch (error: any) {
    console.error('[API] Error fetching refund by ID:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/refunds', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid || req.body?.userId;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to file a refund claim.' });
    }

    const {
      bookingId,
      segmentId,
      provider,
      providerReference,
      originalAmount,
      expectedRefund,
      reason,
      ruleId,
      policyVersion,
      tdrReference,
    } = req.body;

    if (!bookingId || !provider || !originalAmount) {
      return res.status(400).json({ success: false, error: 'bookingId, provider, and originalAmount are required.' });
    }

    const booking = BookingVaultStore.getBookingById(bookingId, uid);
    if (!booking) {
      return res.status(404).json({ success: false, error: `Booking ${bookingId} not found or access denied.` });
    }

    const refundCase = RefundStore.createRefundCase({
      userId: uid,
      bookingId,
      segmentId,
      provider,
      providerReference: providerReference || booking.bookingReference,
      originalAmount,
      expectedRefund: expectedRefund || originalAmount,
      reason: reason || 'Statutory refund claim filed by passenger',
      ruleId: ruleId || (provider === 'irctc' ? 'IRCTC-RULE-73A-TDR' : 'DGCA-CAR-SEC3-SERIES-M-PART-IV'),
      policyVersion: policyVersion || 'Statutory Consumer Protection Regulation',
      tdrReference: tdrReference || (provider === 'irctc' ? `TDR-${Date.now().toString().slice(-8)}` : undefined),
    });

    res.json({
      success: true,
      refundCase,
      message: `Refund claim registered successfully under reference ${refundCase.id}.`,
    });
  } catch (error: any) {
    console.error('[API] Error filing refund claim:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Initialize Google GenAI client lazily & securely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'JOURNEY//X Travel Orchestration Command Center',
    version: '3.0.0-celestial',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Disruption Ingestion & Propagation Engine (Sections 14, 20)
app.post('/api/disruptions', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid || req.body?.userId || 'usr_kaivalya_default';
    const { 
      bookingId, 
      segmentId, 
      provider, 
      disruptionType, 
      delayMinutes, 
      rootCause, 
      affectedSegmentIds, 
      source, 
      trip, 
      bookings, 
      edges 
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'bookingId is required to report disruption.' });
    }

    // 1. Run graph propagation across trip bookings & edges
    const effectiveBookings = bookings || trip?.bookings || [];
    const effectiveEdges = edges || trip?.edges || [];
    
    let propagationResult: any = { updatedBookings: effectiveBookings, updatedEdges: effectiveEdges, affectedIds: [bookingId] };
    if (effectiveBookings.length > 0) {
      propagationResult = propagateDisruption(
        effectiveBookings,
        effectiveEdges,
        bookingId,
        disruptionType || 'cancellation',
        delayMinutes || 0
      );
    }

    // 2. Persist disruption in DisruptionStore
    const disruption = DisruptionStore.createDisruption({
      userId: uid,
      bookingId,
      segmentId,
      provider: provider || 'makemytrip',
      disruptionType: disruptionType || 'cancellation',
      delayMinutes: delayMinutes || (disruptionType === 'cancellation' ? 180 : 90),
      rootCause: rootCause || 'Operational disruption reported by provider telemetry',
      affectedSegmentIds: propagationResult.affectedIds || affectedSegmentIds || [],
      cascadeSummary: `${disruptionType === 'cancellation' ? 'Cancellation' : 'Delay'} propagated to ${propagationResult.affectedIds.length} connected travel segments.`,
      source: source || 'PROVIDER_TELEMETRY',
    });

    // 3. Compute deterministic recovery options
    const targetBooking = (propagationResult.updatedBookings || []).find((b: any) => b.id === bookingId) || { id: bookingId, title: 'Disrupted Service' };
    const recoveryOptions = generateRecoveryOptions(targetBooking, {
      ...(trip || {}),
      bookings: propagationResult.updatedBookings,
      edges: propagationResult.updatedEdges,
    });

    res.json({
      success: true,
      disruption,
      affectedBookings: propagationResult.updatedBookings,
      updatedEdges: propagationResult.updatedEdges,
      affectedIds: propagationResult.affectedIds,
      recoveryOptions,
      message: `Disruption recorded and cascade propagated successfully. Generated ${recoveryOptions.length} recovery solutions.`,
    });
  } catch (error: any) {
    console.error('[API] Error ingesting disruption:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/disruptions', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to fetch disruptions.' });
    }

    const disruptions = DisruptionStore.getDisruptionsByUid(uid);
    res.json({ success: true, disruptions, count: disruptions.length });
  } catch (error: any) {
    console.error('[API] Error fetching disruptions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deterministic Recovery Solver Endpoints (Sections 15, 20)
app.post('/api/recovery/options', (req, res) => {
  try {
    const { disruptedBooking, trip } = req.body;
    const recoveryPlans = generateRecoveryOptions(disruptedBooking, trip);
    res.json({ success: true, recoveryPlans, count: recoveryPlans.length });
  } catch (error: any) {
    console.error('[API] Error generating recovery options:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/recovery/execute', (req, res) => {
  try {
    const userAuth = getRequestUid(req);
    const uid = userAuth?.uid || req.body?.userId;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Authentication required to execute recovery.' });
    }

    const {
      disruptionId,
      bookingId,
      selectedOptionId,
      optionTitle,
      strategy,
      netFinancialImpact,
      additionalCost,
      refundRecoveryAmount,
      newSegments,
      providerReference,
    } = req.body;

    if (!bookingId || !optionTitle) {
      return res.status(400).json({ success: false, error: 'bookingId and optionTitle are required.' });
    }

    const execution = RecoveryStore.createRecoveryExecution({
      userId: uid,
      disruptionId,
      bookingId,
      selectedOptionId: selectedOptionId || 'opt_fastest',
      optionTitle,
      strategy: strategy || 'FASTEST',
      netFinancialImpact: netFinancialImpact || 0,
      additionalCost: additionalCost || 0,
      refundRecoveryAmount: refundRecoveryAmount || 0,
      newSegments,
      providerReference,
    });

    res.json({
      success: true,
      execution,
      status: 'RECOVERED',
      message: `Recovery plan '${optionTitle}' successfully executed and persisted. Booking Vault updated.`,
    });
  } catch (error: any) {
    console.error('[API] Error executing recovery plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Provider Ingestion Webhook Endpoint (Section 14, 20)
app.post('/api/webhooks/:provider', (req, res) => {
  try {
    const providerId = req.params.provider.toLowerCase();
    const payload = req.body || {};
    console.log(`[Webhook Received] Provider: ${providerId}`, payload);

    const delayMinutes = payload.delayMinutes || (payload.eventType?.includes('CANCEL') ? 180 : 60);
    const disruptionType = payload.eventType?.includes('CANCEL') ? 'cancellation' : 'delay';
    const rootCause = payload.reason || payload.message || `Provider ${providerId.toUpperCase()} schedule telemetry event`;

    const userBookings = BookingVaultStore.getBookingsByUid('usr_kaivalya_default');
    const matchingBooking = userBookings[0] || { id: 'bk_flight_1', bookingReference: 'RF-MMT-88231' };

    const disruption = DisruptionStore.createDisruption({
      userId: matchingBooking.userId || 'usr_kaivalya_default',
      bookingId: matchingBooking.id,
      provider: providerId,
      disruptionType,
      delayMinutes,
      rootCause,
      source: 'PROVIDER_WEBHOOK',
    });

    res.json({
      success: true,
      provider: providerId,
      message: `Webhook successfully ingested for provider ${providerId}`,
      matchedBooking: matchingBooking.bookingReference,
      disruption,
    });
  } catch (error: any) {
    console.error('[API] Webhook processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Legacy aliases for backward compatibility
app.post('/api/trip/disrupt', (req, res) => {
  try {
    const { bookings, edges, disruptedBookingId, disruptionType, delayMinutes } = req.body;
    const result = propagateDisruption(bookings, edges, disruptedBookingId, disruptionType, delayMinutes || 0);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/trip/recover', (req, res) => {
  try {
    const { disruptedBooking, trip } = req.body;
    const recoveryPlans = generateRecoveryOptions(disruptedBooking, trip);
    res.json({ success: true, recoveryPlans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deterministic Refund Calculator Endpoint
app.post('/api/refund/calculate', (req, res) => {
  try {
    const { type, ticketAmount, ticketClass, scenario, hoursBeforeDeparture } = req.body;
    if (type === 'flight') {
      const result = calculateFlightRefund(ticketAmount, scenario);
      return res.json({ success: true, result });
    } else {
      const result = calculateIRCTCRefund(ticketAmount, ticketClass || '2A', scenario, hoursBeforeDeparture || 24);
      return res.json({ success: true, result });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Explanation & Disruption Analysis Endpoint (Powered by Gemini)
app.post('/api/gemini/explain', async (req, res) => {
  try {
    const { trip, disruptedBooking, affectedBookings, recoveryOptions, refundCases } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback deterministic structured explanation if API key is not yet set
      return res.json({
        success: true,
        source: 'DETERMINISTIC_FALLBACK',
        explanation: `Flight ${disruptedBooking?.providerCode || '6E-204'} was cancelled by the carrier. Because the Delhi-Jaipur Train (12952) departs at 13:00 with only an 80-minute transfer window, the connection is physically broken. Downstream, your ITC Rajputana hotel check-in is at risk of no-show, and the 20:00 HackCelestial Keynote cannot be reached without executing an immediate re-routing plan.`,
        recoverySummary: 'Option A (Fastest) replaces the flight with Air India AI-864 arriving at 12:20 IST, safely preserving your train connection with a 40-minute metro transfer.',
        refundAdvice: 'Under DGCA Civil Aviation Charter Section 3, you are entitled to a 100% full refund of ₹5,200 from IndiGo. Indian Railways will issue a 100% refund for Train 12952 upon online TDR submission citing connecting carrier failure.',
      });
    }

    const systemPrompt = `You are JOURNEY//X AI, an expert aviation & multimodal travel recovery intelligence engine.
CRITICAL SAFETY RULES:
1. AI is NOT the authoritative source of truth for refund amounts, availability, or prices.
2. Ground all explanations strictly on the provided deterministic structured trip data.
3. Keep answers compact, authoritative, tactical, and clear. Avoid fluffy SaaS buzzwords.`;

    const prompt = `Analyze this travel disruption and synthesize a high-conviction mission briefing:
Trip: ${trip?.name || 'Mumbai to Jaipur'}
Disrupted Segment: ${disruptedBooking?.title} (${disruptedBooking?.status} - ${disruptedBooking?.cancellationReason || 'Carrier cancellation'})
Downstream Affected: ${affectedBookings?.map((b: any) => `${b.title} [Status: ${b.status}]`).join(', ')}
Deterministic Refund Total: ₹${refundCases?.reduce((acc: number, c: any) => acc + (c.estimatedRefund || 0), 0) || 7060}
Top Recovery Option: ${recoveryOptions?.[0]?.title} (${recoveryOptions?.[0]?.strategy}) - Net Financial Impact: ₹${recoveryOptions?.[0]?.netFinancialImpact}

Provide a concise 3-part briefing:
1. Impact Analysis: Exact reason downstream connections fail.
2. Recommended Recovery Strategy: Why the top ranked option is best.
3. Refund & Legal Protection: Clear statement of DGCA/IRCTC rules protecting the passenger.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    res.json({
      success: true,
      source: 'GEMINI_AI_REASONING',
      explanation: response.text || 'Analysis complete.',
    });
  } catch (error: any) {
    console.error('Gemini explanation error:', error);
    res.json({
      success: true,
      source: 'DETERMINISTIC_FALLBACK',
      explanation: 'IndiGo flight cancellation breaks the 80-minute transfer window to Delhi-Jaipur Train 12952. Recovery Option A provides the earliest arrival at 12:20 IST via Air India with ₹5,200 automatic carrier refund.',
    });
  }
});

// Grounded Contextual AI Assistant Chat Endpoint
app.post('/api/gemini/assist', async (req, res) => {
  try {
    const { message, tripContext } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Intelligent rule-based contextual responses if Gemini key is pending
      const lower = (message || '').toLowerCase();
      let reply = "I'm monitoring your trip graph in real-time. All 4 bookings and 3 dependency edges are actively tracked.";
      let suggestedActions = ['SHOW RECOVERY OPTIONS', 'CHECK REFUND BREAKDOWN', 'EXPLAIN IMPACT'];

      if (lower.includes('hotel') || lower.includes('what happens')) {
        reply = "Your ITC Rajputana booking remains valid, but your current missed train will delay arrival past the 18:15 check-in window. I have generated 3 recovery options that either preserve check-in or send an automated late-arrival hold to the front desk.";
      } else if (lower.includes('refund') || lower.includes('money') || lower.includes('tdr') || lower.includes('cost')) {
        reply = "Under DGCA Section 3 and IRCTC Rule 73A, you are eligible for ₹7,060 in total refunds (₹5,200 full flight refund + ₹1,860 train refund via TDR).";
        suggestedActions = ['VIEW REFUND CENTER', 'AUTO-FILE TDR', 'APPLY TO RECOVERY'];
      } else if (lower.includes('option') || lower.includes('fast') || lower.includes('recover')) {
        reply = "Option A (Fastest) switches to Air India AI-864, arriving at 12:20 IST. It completely preserves your downstream train and hotel schedule with a net ₹400 refund surplus.";
        suggestedActions = ['CONFIRM OPTION A', 'COMPARE ALL 3 OPTIONS', '3D GRAPH PREVIEW'];
      }

      return res.json({
        success: true,
        source: 'STRUCTURED_CONTEXTUAL_ASSISTANT',
        reply,
        suggestedActions,
      });
    }

    const systemPrompt = `You are JOURNEY//X Copilot, a high-precision travel recovery assistant.
Canonical Data:
- Trip: Mumbai -> Delhi -> Jaipur
- Bookings: 
  1. Flight 6E-204 (Mumbai -> Delhi, 09:30-11:40, ₹5,200)
  2. Train 12952 Superfast (Delhi -> Jaipur, 13:00-17:30, ₹1,860)
  3. Hotel ITC Rajputana Jaipur (Check-in 18:15, ₹8,400)
  4. Event HackCelestial 3.0 Keynote (20:00, ₹2,500)
- Policy Rules: DGCA CAR Sec 3 gives 100% flight refund on airline cancellation. IRCTC Rule 73A allows 100% refund via TDR for missed connection.
- Top Recovery Option: Air India AI-864 (Dep 10:15, Arr 12:20, ₹4,800).

RULES:
- Answer directly and authoritatively in 2-4 sentences.
- Never invent prices, availability, or policies.
- Always offer concrete next action buttons.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      source: 'GEMINI_AI_CHAT',
      reply: response.text || 'Here is what you need to know about your journey.',
      suggestedActions: ['SHOW OPTIONS', 'CHECK REFUND', 'EXPLAIN IMPACT'],
    });
  } catch (error: any) {
    console.error('AI assistant error:', error);
    res.json({
      success: true,
      source: 'STRUCTURED_CONTEXTUAL_ASSISTANT',
      reply: "Your hotel is still valid, but your current arrival time violates the planned check-in window. I found 3 recovery options.",
      suggestedActions: ['SHOW OPTIONS', 'CHECK REFUND', 'EXPLAIN IMPACT'],
    });
  }
});

// Deterministic Translation Dictionary & Heuristic Fallback
const DICTIONARY_MAP: Record<string, Record<string, string>> = {
  'hi-en': {
    'नमस्ते': 'Hello',
    'मेरी ट्रेन लेट हो गई है': 'My train is delayed',
    'मेरी ट्रेन लेट है': 'My train is running late',
    'मेरी फ्लाइट कैंसिल हो गई है': 'My flight has been cancelled',
    'मेरी फ्लाइट रद्द हो गई है': 'My flight has been cancelled',
    'क्या मुझे रिफंड मिलेगा': 'Will I receive a statutory refund?',
    'रिफंड कैसे मिलेगा': 'How will I receive the refund under IRCTC Rule 73A?',
    'होटल चेक-इन का क्या होगा': 'What will happen to my hotel check-in at ITC Rajputana?',
    'मुझे कार या टैक्सी चाहिए': 'I need a royal chauffeur or transfer car',
    'एयरपोर्ट ट्रांसफर कहां है': 'Where is the airport transfer arranged?',
    'उदयपुर पैलेस का रास्ता क्या है': 'What is the fastest route to Udaipur Palace?',
    'मेरी मदद कीजिए': 'Please assist me with my disrupted travel itinerary',
  },
  'en-hi': {
    'hello': 'नमस्ते',
    'my flight is cancelled': 'मेरी उड़ान रद्द हो गई है',
    'my train is delayed': 'मेरी ट्रेन में देरी हो गई है',
    'how much refund will i get': 'मुझे कितना रिफंड मिलेगा?',
    'what about my hotel': 'मेरे होटल का क्या होगा?',
    'i need a taxi': 'मुझे एक टैक्सी की आवश्यकता है',
  },
  'fr-en': {
    'bonjour': 'Hello',
    'mon vol est annulé': 'My flight is cancelled',
    'mon train a du retard': 'My train is delayed',
    'où est mon chauffeur': 'Where is my chauffeur?',
    'aidez-moi s\'il vous plaît': 'Please assist me with my travel recovery',
  },
  'es-en': {
    'hola': 'Hello',
    'mi vuelo está cancelado': 'My flight is cancelled',
    'mi tren tiene retraso': 'My train is delayed',
    'dónde está el hotel': 'Where is the hotel?',
    'necesito ayuda con mi viaje': 'I need help with my journey',
  }
};

// Fast Multilingual Translation Service (Gemini with Public Translation Fallback)
async function fetchPublicTranslation(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  const normText = (text || '').trim();
  if (!normText) return '';

  const src = (sourceLang || 'auto').toLowerCase().slice(0, 2);
  const tgt = (targetLang || 'en').toLowerCase().slice(0, 2);

  if (src === tgt) return normText;

  const pairKey = `${src === 'au' ? 'auto' : src}|${tgt}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(normText)}&langpair=${pairKey}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const result = data.responseData.translatedText.trim();
        // Ignore automated warning text from MyMemory if any
        if (!result.toLowerCase().startsWith('warning:') && !result.toLowerCase().includes('quota exceeded')) {
          return result;
        }
      }
    }
  } catch (err: any) {
    console.warn('[Translate] Public translation service unreachable:', err?.message || err);
  }
  return null;
}

function detectScriptLanguage(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) return 'ja';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  return 'en';
}

function fallbackDictionaryLookup(text: string, sourceLang: string, targetLang: string): string {
  const norm = (text || '').trim().toLowerCase();
  const src = sourceLang.toLowerCase().slice(0, 2);
  const tgt = targetLang.toLowerCase().slice(0, 2);
  const key = `${src}-${tgt}`;

  if (DICTIONARY_MAP[key]) {
    for (const [phrase, translated] of Object.entries(DICTIONARY_MAP[key])) {
      if (norm.includes(phrase.toLowerCase()) || phrase.toLowerCase().includes(norm)) {
        return translated;
      }
    }
  }

  // Common travel responses in target languages
  const TRAVEL_TRANSLATIONS: Record<string, string> = {
    'hi': 'मेरी यात्रा में व्यवधान आया है, कृपया तत्काल सहायता करें।',
    'fr': 'Mon voyage est interrompu, veuillez m’aider immédiatement.',
    'es': 'Mi viaje está interrumpido, por favor ayúdenme de inmediato.',
    'de': 'Meine Reise ist unterbrochen, bitte helfen Sie mir sofort.',
    'ja': '旅行に支障が生じました。至急ご対応をお願いいたします。',
    'it': 'Il mio viaggio è interrotto, vi prego di assistermi immediatamente.',
    'ar': 'لقد تعطلت رحلتي، يرجى تقديم المساعدة العاجلة.',
    'ru': 'Моя поездка нарушена, пожалуйста, помогите немедленно.',
    'ta': 'எனது பயணம் தடைபட்டுள்ளது, தயவுசெய்து உடனே உதவவும்.',
    'en': 'My travel has been disrupted, please assist me immediately.'
  };

  return TRAVEL_TRANSLATIONS[tgt] || text;
}

// Live Travel Speech & Text Translation Endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLanguage = 'auto', targetLanguage = 'en' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required for translation' });
    }

    const detected = sourceLanguage === 'auto' ? detectScriptLanguage(text) : sourceLanguage;
    const src = detected.toLowerCase().slice(0, 2);
    const tgt = (targetLanguage || 'en').toLowerCase().slice(0, 2);

    if (src === tgt) {
      return res.json({
        success: true,
        source: 'IDENTITY',
        originalText: text,
        translatedText: text,
        detectedSource: detected,
        targetLanguage,
      });
    }

    // Try Gemini model first if client is configured
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are a real-time, high-precision travel translator.
Translate the following travel speech or inquiry accurately into the target language (${targetLanguage}).
Ensure the translated output is ONLY in the target language (${targetLanguage}), maintaining all flight numbers, train codes, times, and amounts.

Input: "${text.replace(/"/g, '\\"')}"

Respond STRICTLY with valid JSON:
{
  "translatedText": "the translation strictly in ${targetLanguage}",
  "detectedSource": "${detected}",
  "phoneticOrNotes": "pronunciation or notes if useful"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed && parsed.translatedText && parsed.translatedText.trim()) {
            return res.json({
              success: true,
              source: 'GEMINI_TRANSLATION',
              originalText: text,
              translatedText: parsed.translatedText.trim(),
              detectedSource: parsed.detectedSource || detected,
              phoneticOrNotes: parsed.phoneticOrNotes || '',
              targetLanguage,
            });
          }
        }
      } catch (geminiErr: any) {
        // Log brief notice without flooding the console with 429 quota traces
        console.warn(`[Translate] Gemini rate limit/unavailable (${geminiErr?.status || geminiErr?.code || 'quota'}), switching to high-speed public translation engine.`);
      }
    }

    // High-speed public translation engine (MyMemory) fallback
    const publicResult = await fetchPublicTranslation(text, src, tgt);
    if (publicResult) {
      return res.json({
        success: true,
        source: 'HIGH_SPEED_MULTILINGUAL_ENGINE',
        originalText: text,
        translatedText: publicResult,
        detectedSource: detected,
        targetLanguage,
      });
    }

    // Dictionary / Phrasebook fallback
    const dictResult = fallbackDictionaryLookup(text, src, tgt);
    return res.json({
      success: true,
      source: 'OFFLINE_TRAVEL_DICTIONARY',
      originalText: text,
      translatedText: dictResult,
      detectedSource: detected,
      targetLanguage,
    });
  } catch (error: any) {
    console.warn('[Translate] Unexpected translation issue, using fallback:', error?.message);
    const fallbackText = fallbackDictionaryLookup(req.body?.text, req.body?.sourceLanguage || 'en', req.body?.targetLanguage || 'en');
    return res.json({
      success: true,
      source: 'EMERGENCY_FALLBACK',
      originalText: req.body?.text || '',
      translatedText: fallbackText,
      detectedSource: req.body?.sourceLanguage || 'auto',
      targetLanguage: req.body?.targetLanguage || 'en',
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/data/**',
            '**/data/*.json',
            '**/.git/**',
            '**/scratch/**',
            '**/dist/**',
            '**/*.log',
            /[/\\]data[/\\].*/,
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JOURNEY//X Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
