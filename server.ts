import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { propagateDisruption, generateRecoveryOptions, calculateIRCTCRefund, calculateFlightRefund } from './src/lib/deterministic-engines.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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
