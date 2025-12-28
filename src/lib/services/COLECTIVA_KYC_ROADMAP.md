# Colectiva KYC Implementation Roadmap

## Overview

This document outlines the phased implementation plan for migrating Plenura's KYC verification from local storage (Phase 1) to Colectiva's centralized KYC platform (Phase 2).

---

## Current State (Phase 1)

### Architecture
```
┌─────────────┐     Upload      ┌─────────────┐
│  Therapist  │ ───────────────►│   Plenura   │
│             │                 │   Server    │
└─────────────┘                 └──────┬──────┘
                                       │
                                       ▼
                               ┌─────────────┐
                               │  Supabase   │
                               │  Storage    │
                               └─────────────┘
```

### Components
- [kyc-provider.ts](../server/kyc-provider.ts) - Abstraction layer with `LocalKYCProvider`
- [verification.service.ts](../server/verification.service.ts) - Status calculation logic
- Supabase `verification-documents` storage bucket
- `therapists.verification_documents` JSONB field
- Admin API endpoints for document review

### Document Types
1. `government_id` - Official government-issued ID
2. `selfie` - Selfie holding ID for liveness check
3. `professional_license` - Cedula profesional
4. `degree_certificate` - Academic credentials

### Verification Tiers
- `unverified` - No documents submitted
- `pending` - Documents submitted, awaiting review
- `identity_verified` - ID + selfie approved
- `credential_verified` - Professional docs approved (rare without identity)
- `fully_verified` - All documents approved

---

## Phase 2: Colectiva Integration

### Target Architecture
```
┌─────────────┐                    ┌─────────────┐
│  Therapist  │ ──── Redirect ────►│  Colectiva  │
│             │                    │  KYC Portal │
└─────────────┘                    └──────┬──────┘
       ▲                                  │
       │ Callback                         │
       │                                  ▼
┌──────┴──────┐     Webhook        ┌─────────────┐
│   Plenura   │◄───────────────────│  Colectiva  │
│   Server    │                    │     API     │
└─────────────┘                    └─────────────┘
```

### Implementation Steps

#### Step 1: Colectiva API Specification
Define the API contract between Plenura and Colectiva.

**Required Endpoints (Colectiva side)**:
```typescript
// Start KYC flow
POST /kyc/sessions
Request: { user_id, email, name, app: 'plenura', return_url }
Response: { session_id, portal_url }

// Get verification status
GET /kyc/users/:user_id/status
Response: {
  status: 'unverified' | 'pending' | 'identity_verified' | 'fully_verified',
  documents: [{
    type: string,
    status: 'pending' | 'approved' | 'rejected',
    uploaded_at: string,
    reviewed_at?: string
  }],
  identity_verified_at?: string,
  credential_verified_at?: string
}

// Webhook: Status changed
POST {plenura_webhook_url}/api/webhooks/colectiva/kyc
Payload: {
  event: 'kyc.status_changed',
  user_id: string,
  new_status: VerificationStatus,
  timestamp: string
}
```

#### Step 2: Webhook Handler
Create webhook endpoint in Plenura.

**File**: `src/routes/api/webhooks/colectiva/kyc/+server.ts`
```typescript
// Verify webhook signature
// Update therapist verification_status
// Trigger notifications if newly verified
```

#### Step 3: Update ColectivaKYCProvider
Complete the implementation in [kyc-provider.ts](../server/kyc-provider.ts):

```typescript
export class ColectivaKYCProvider implements KYCProvider {
  async initiateKYC(userId: string, returnUrl: string): Promise<string> {
    // POST to Colectiva /kyc/sessions
    // Return portal_url for redirect
  }

  async getVerificationStatus(userId: string): Promise<KYCVerificationResult> {
    // GET from Colectiva /kyc/users/:user_id/status
    // Map to Plenura status format
  }

  // Admin functions delegate to Colectiva admin panel
}
```

#### Step 4: UI Updates
Modify verification page to redirect instead of upload:

```svelte
{#if useColectivaKYC}
  <Button onclick={() => window.location.href = colectivaPortalUrl}>
    Complete Verification on Colectiva
  </Button>
{:else}
  <!-- Current file upload UI -->
{/if}
```

#### Step 5: Status Sync Mechanism
Background job to sync statuses for edge cases:

```typescript
// Cron job or Supabase Edge Function
async function syncKYCStatuses() {
  // Get all therapists with pending status
  // Query Colectiva for current status
  // Update any that have changed
}
```

---

## Migration Strategy

### Parallel Operation Period
1. Enable `USE_COLECTIVA_KYC=true` for new registrations only
2. Existing verified therapists keep their status
3. Existing pending therapists can choose to re-verify via Colectiva

### Data Migration
```sql
-- No data migration needed for verification status
-- Existing documents remain in Supabase storage
-- Colectiva will have new documents only
```

### Rollback Plan
1. Set `USE_COLECTIVA_KYC=false`
2. Revert UI changes
3. Continue with local verification

---

## Environment Configuration

### Phase 1 (Current)
```env
USE_COLECTIVA_KYC=false
```

### Phase 2 (Colectiva)
```env
USE_COLECTIVA_KYC=true
COLECTIVA_KYC_PORTAL_URL=https://colectiva.rbs.mx/kyc
COLECTIVA_WEBHOOK_SECRET=xxx
```

---

## Testing Checklist

### Phase 2 Pre-Launch
- [ ] Colectiva KYC portal accessible
- [ ] Redirect flow works end-to-end
- [ ] Webhook signature verification
- [ ] Status sync after completion
- [ ] Error handling for Colectiva downtime
- [ ] Fallback to local provider if Colectiva unavailable

### User Flows
- [ ] New therapist registration → Colectiva KYC
- [ ] Returning therapist with incomplete KYC
- [ ] Status page shows Colectiva verification
- [ ] Admin can view verification status

---

## Timeline Dependencies

1. **Colectiva KYC API ready** - API must be deployed and documented
2. **Webhook infrastructure** - Colectiva must support webhook delivery
3. **Admin panel** - Colectiva admin must support Plenura user management
4. **SSO integration** - Shared identity between Plenura and Colectiva

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/server/kyc-provider.ts` | Complete ColectivaKYCProvider implementation |
| `src/routes/api/webhooks/colectiva/kyc/+server.ts` | New: Webhook handler |
| `src/routes/(app)/therapist/verification/+page.svelte` | Add Colectiva redirect option |
| `src/routes/(app)/therapist/verification/+page.server.ts` | Add Colectiva portal URL |
| `src/lib/services/payment.service.ts` | Already has Colectiva env vars |

---

## Security Considerations

1. **Webhook Verification**: HMAC signature validation using `COLECTIVA_WEBHOOK_SECRET`
2. **User Binding**: Verify user_id in webhook matches authenticated session
3. **PII Handling**: Documents stored in Colectiva, not Plenura (reduces liability)
4. **Rate Limiting**: Protect webhook endpoint from abuse
