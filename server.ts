import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { propagateDisruption, generateRecoveryOptions, calculateIRCTCRefund, calculateFlightRefund } from './src/lib/deterministic-engines.js';

import { ProfileStore, ProviderConnectionStore, BookingIntentStore, BookingVaultStore } from './src/lib/db.js';
import { CORE_PROVIDERS } from './src/lib/providers/registry.js';
import { providerAdaptersMap } from './src/lib/providers/index.js';
import { planJourneys } from './src/lib/journey/planner.js';

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
    const connection = ProviderConnectionStore.connect(uid, providerId, accountIdentifier);

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

// Deterministic Disruption Propagation Endpoint
app.post('/api/trip/disrupt', (req, res) => {
  try {
    const { bookings, edges, disruptedBookingId, disruptionType, delayMinutes } = req.body;
    const result = propagateDisruption(bookings, edges, disruptedBookingId, disruptionType, delayMinutes || 0);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deterministic Recovery Solver Endpoint
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
      model: 'gemini-3.7-flash',
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
      model: 'gemini-3.7-flash',
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

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
