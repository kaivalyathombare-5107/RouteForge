// scratch/test_step3_refund_cancellation.ts
import { encryptToken, decryptToken, maskSecret, createSecureTokenMetadata } from '../src/lib/security';

const BASE_URL = 'http://localhost:3000';

async function runStep3Verification() {
  console.log('===========================================================');
  console.log('  ROUTEFORGE STEP 3 — CANCELLATION, REFUND & SECURITY TEST');
  console.log('===========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // --- 1. SECTION 22: TOKEN ENCRYPTION & SECURITY AT REST ---
  console.log('--- 1. Testing Section 22: Authenticated Token Encryption (AES-256-GCM) ---');
  const secretKey = 'mmt_live_sandbox_secret_9981245781298412';
  const encrypted = encryptToken(secretKey);
  const decrypted = decryptToken(encrypted);
  const masked = maskSecret(secretKey);
  const meta = createSecureTokenMetadata(secretKey, 'makemytrip', 90);

  assert(encrypted.split(':').length === 3, 'Cipher payload adheres to format iv:authTag:ciphertext');
  assert(decrypted === secretKey, 'Decrypted token matches original secret key verbatim');
  assert(masked.startsWith('mmt_live') && masked.endsWith('8412') && masked.includes('...'), 'Masked secret formats correctly for safe display');
  assert(meta.rotationIntervalDays === 90 && !meta.isExpired, 'SecureTokenMetadata captures rotation lifecycle');
  console.log('  -> Token encryption at rest verified.\n');

  // --- 2. SECTION 1 & 20: AUTH SESSION VALIDATION ---
  console.log('--- 2. Testing Section 1 & 20: Auth Session Validation Endpoint ---');
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: 'usr_step3_traveler_01',
      email: 'traveler01@routeforge.ai',
      displayName: 'Captain Vikram Singh',
    }),
  });
  const sessionData = await sessionRes.json();
  assert(sessionRes.status === 200 && sessionData.authenticated === true, 'Session successfully verified/created');
  assert(sessionData.profile?.fullName === 'Captain Vikram Singh', 'User profile linked to session');
  console.log('  -> Auth session endpoint verified.\n');

  // --- 3. SECTION 22: CONNECT PROVIDER WITH ENCRYPTED TOKEN ---
  console.log('--- 3. Testing Section 22: Provider Connection with Encrypted Secret ---');
  const connRes = await fetch(`${BASE_URL}/api/providers/makemytrip/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-firebase-uid': 'usr_step3_traveler_01',
    },
    body: JSON.stringify({
      accountIdentifier: 'mmt_corp_singh_889',
      apiSecret: 'mmt_live_secret_corp_key_44521',
    }),
  });
  const connData = await connRes.json();
  assert(connRes.status === 200 && connData.state === 'CONNECTED', 'MakeMyTrip connected with encrypted token');
  assert(connData.connection.maskedSecret?.includes('...'), 'Response masks raw secret');
  assert(connData.connection.encryptedToken?.includes(':'), 'Connection record stores encrypted token');
  console.log('  -> Provider token encryption at rest verified.\n');

  // --- 4. SECTION 9 & 10: CREATE BOOKING IN VAULT ---
  console.log('--- 4. Creating Booking in Vault for User A ---');
  const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-firebase-uid': 'usr_step3_traveler_01',
    },
    body: JSON.stringify({
      provider: 'makemytrip',
      title: 'IndiGo 6E-204 Flight & Express Multimodal',
      totalPrice: 5120,
      currency: 'INR',
      legs: [
        {
          type: 'flight',
          carrier: 'IndiGo',
          origin: 'BOM',
          destination: 'DEL',
          depTime: '09:30 IST',
          arrTime: '11:40 IST',
          seatClass: 'Flexi Plus',
          serviceNumber: '6E-204',
        }
      ],
      cancellationPolicy: {
        refundable: true,
        terms: 'DGCA CAR Section 3 statutory refund rules apply.',
      },
      modificationPolicy: {
        allowed: true,
        terms: 'Complimentary date change allowed up to 2 hours prior.',
      },
    }),
  });
  const bookingData = await bookingRes.json();
  assert(bookingRes.status === 200 && bookingData.booking.id, 'Booking confirmed in vault');
  const bookingId = bookingData.booking.id;
  console.log(`  -> Booking ID: ${bookingId}, Ref: ${bookingData.booking.bookingReference}\n`);

  // --- 5. SECTION 13 & 24: TENANT ISOLATION CHECKS ---
  console.log('--- 5. Testing Section 13 & 24: Cross-Tenant Isolation ---');
  // Attempt to cancel User A's booking as User B
  const crossCancelRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-firebase-uid': 'usr_malicious_attacker_99',
    },
    body: JSON.stringify({ reason: 'Unauthorized cancel' }),
  });
  assert(crossCancelRes.status === 403, 'Cross-tenant cancellation rejected with HTTP 403 Forbidden');

  // Attempt to modify User A's booking as User B
  const crossModifyRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/modify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-firebase-uid': 'usr_malicious_attacker_99',
    },
    body: JSON.stringify({ newCabinClass: 'Business' }),
  });
  assert(crossModifyRes.status === 403, 'Cross-tenant modification rejected with HTTP 403 Forbidden');

  // Attempt to view User A's booking status as User B
  const crossStatusRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/status`, {
    headers: { 'x-firebase-uid': 'usr_malicious_attacker_99' },
  });
  assert(crossStatusRes.status === 403, 'Cross-tenant status lookup rejected with HTTP 403 Forbidden');
  console.log('  -> Tenant isolation verified across cancellation, modification, and status.\n');

  // --- 6. SECTION 16: MODIFICATION API ---
  console.log('--- 6. Testing Section 16: Official Modification API ---');
  const modRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/modify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-firebase-uid': 'usr_step3_traveler_01',
    },
    body: JSON.stringify({
      newDate: '2026-10-18',
      newCabinClass: 'Corporate Flexi Tier 1',
      notes: 'Rescheduled conference attendance',
    }),
  });
  const modData = await modRes.json();
  assert(modRes.status === 200 && modData.modificationStatus === 'MODIFIED', 'Booking successfully modified');
  assert(modData.updatedBooking.segments[0].seatClass === 'Corporate Flexi Tier 1', 'Updated cabin class persisted');
  assert(modData.updatedBooking.modificationHistory?.length > 0, 'Modification audit trail recorded');
  console.log('  -> Official modification API verified.\n');

  // --- 7. SECTION 16 & 17: OFFICIAL CANCELLATION & STATUTORY REFUND ENGINE ---
  console.log('--- 7. Testing Section 16 & 17: Cancellation & Statutory Refund Engine ---');
  const cancelRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-firebase-uid': 'usr_step3_traveler_01',
    },
    body: JSON.stringify({
      reason: 'Flight cancelled by carrier due to airspace restrictions',
    }),
  });
  const cancelData = await cancelRes.json();
  assert(cancelRes.status === 200 && cancelData.cancellationStatus === 'CANCELLED', 'Booking cancelled successfully');
  assert(cancelData.refundCase && cancelData.refundCase.id, 'Statutory refund case created');
  assert(cancelData.refundCase.expectedRefund === 5120, '100% full refund computed under DGCA CAR Section 3 (₹5,120)');
  assert(cancelData.refundCase.ruleId === 'DGCA_CAR_SEC3_RULE_3.2', 'Rule ID cited as DGCA_CAR_SEC3_RULE_3.2');
  const refundId = cancelData.refundCase.id;

  // Verify double-cancellation protection
  const doubleCancelRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-firebase-uid': 'usr_step3_traveler_01',
    },
    body: JSON.stringify({ reason: 'Second cancel attempt' }),
  });
  assert(doubleCancelRes.status === 400, 'Double cancellation rejected with HTTP 400');
  console.log('  -> Cancellation and statutory refund generation verified.\n');

  // --- 8. SECTION 16: BOOKING LIVE STATUS WITH LINKED REFUNDS ---
  console.log('--- 8. Testing Section 16: Booking Status Query ---');
  const statusRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/status`, {
    headers: { 'x-firebase-uid': 'usr_step3_traveler_01' },
  });
  const statusData = await statusRes.json();
  assert(statusRes.status === 200 && statusData.status === 'CANCELLED', 'Status endpoint returns CANCELLED');
  assert(statusData.refunds?.length > 0, 'Status endpoint links refund records');
  assert(statusData.refunds[0].id === refundId, 'Linked refund ID matches created case');
  console.log('  -> Live booking status verified.\n');

  // --- 9. SECTION 17: STATUTORY REFUND QUERIES & DIRECT CLAIM FILING ---
  console.log('--- 9. Testing Section 17: Statutory Refund CRUD & TDR Claim Filing ---');
  // List user refunds
  const listRefundsRes = await fetch(`${BASE_URL}/api/refunds`, {
    headers: { 'x-firebase-uid': 'usr_step3_traveler_01' },
  });
  const listRefundsData = await listRefundsRes.json();
  assert(listRefundsRes.status === 200 && listRefundsData.refunds?.length >= 1, 'Refund list contains at least 1 record');

  // Fetch specific refund by ID
  const singleRefundRes = await fetch(`${BASE_URL}/api/refunds/${refundId}`, {
    headers: { 'x-firebase-uid': 'usr_step3_traveler_01' },
  });
  const singleRefundData = await singleRefundRes.json();
  assert(singleRefundRes.status === 200 && singleRefundData.refund.id === refundId, 'Single refund query by ID matches');

  // File manual TDR claim for a train booking
  const tdrRes = await fetch(`${BASE_URL}/api/refunds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-firebase-uid': 'usr_step3_traveler_01',
    },
    body: JSON.stringify({
      bookingId: bookingId,
      provider: 'irctc',
      providerReference: '12952-PNR-883921',
      originalAmount: 1860,
      expectedRefund: 1860,
      reason: 'Missed connecting train due to preceding flight cancellation (Rule 73A)',
      ruleId: 'IRCTC-RULE-73A-TDR',
      policyVersion: 'IRCTC Coaching Tariff Rule 73A',
    }),
  });
  const tdrData = await tdrRes.json();
  assert(tdrRes.status === 200 && tdrData.refundCase.tdrReference?.startsWith('TDR-'), 'TDR reference generated');
  assert(tdrData.refundCase.expectedRefund === 1860, '100% full TDR refund registered');
  console.log('  -> Statutory refund listing and TDR filing verified.\n');

  console.log('===========================================================');
  console.log(`  ALL STEP 3 ASSERTIONS PASSED (${passed}/${total}) — 100% SUCCESS`);
  console.log('===========================================================');
}

runStep3Verification().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
