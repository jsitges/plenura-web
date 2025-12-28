# RBS Ecosystem Architecture

## Overview

The RBS (Red Business Solutions) ecosystem consists of four interconnected applications sharing SSO authentication:

```
                    ┌─────────────────────────────────────────────────────┐
                    │                  CAMINO (SSO Hub)                   │
                    │            Marketing CRM + Lead Generation          │
                    └──────────────────────┬──────────────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
           ┌────────▼────────┐   ┌─────────▼────────┐   ┌────────▼────────┐
           │    PLENURA      │   │    CONSTANZA     │   │   COLECTIVA     │
           │   Bookings &    │   │     Fiscal       │   │   Payments &    │
           │   Scheduling    │   │   Compliance     │   │      KYC        │
           └─────────────────┘   └──────────────────┘   └─────────────────┘
```

## Application Roles

### 1. Plenura - Booking & Practice Management
**Primary Purpose**: Therapists/practitioners organize client bookings

**Core Features**:
- Appointment scheduling and calendar management
- Client management for therapists
- Practice/clinic management (multi-therapist)
- Service catalog and pricing
- Booking commissions (tiered by subscription)

**Revenue Streams**:
- Subscription tiers: Free → Pro ($299/mo) → Business ($699/mo) → Enterprise ($1,299/mo)
- Booking commissions: 10% (free) → 5% (pro) → 3% (business) → 0% (enterprise)
- Featured listings (future)
- Tips passthrough (future)

**Ecosystem Integration**:
- Receives users via Camino SSO
- Can upsell Constanza/Camino to practitioners
- Uses Colectiva for payments internally

---

### 2. Camino - Marketing CRM
**Primary Purpose**: Lead generation for wellness/health practitioners

**Core Features**:
- Marketing automation
- Lead capture and nurturing
- Campaign management
- Client relationship tracking

**Ecosystem Role**:
- Acts as the SSO hub for RBS ecosystem
- Generates leads that can be converted to Plenura users
- Manages marketing campaigns across platforms

**Future Integration with Colectiva**:
- Premium tier subscribers can upgrade to Colectiva fintech capabilities
- Bidirectional integration for CRM + Payments

---

### 3. Constanza - Fiscal Compliance
**Primary Purpose**: Tax and regulatory compliance for businesses

**Core Features**:
- Invoice generation (CFDI for Mexico)
- Tax calculation and reporting
- Regulatory compliance tracking
- Financial documentation

**Ecosystem Integration**:
- Plenura practitioners can upsell to Constanza for invoicing
- Receives booking/transaction data from Plenura
- Generates compliant invoices for services

---

### 4. Colectiva - Payments & KYC
**Primary Purpose**: Internal payment processing and identity verification

**Core Features**:
- Escrow payments for bookings
- KYC (Know Your Customer) verification
- Wallet management for therapists
- Commission processing

**Ecosystem Role**:
- **Phase 1 (Current)**: Internal integration for Plenura payments
- **Phase 2 (Future)**: Upsell to Camino subscribers as standalone fintech

**Integration Points**:
- Creates escrows when clients book
- Releases funds when services complete
- Processes refunds for cancellations
- Verifies therapist identity (KYC)

---

## Data Flow

### Booking Flow (Plenura + Colectiva)
```
1. Client books therapist on Plenura
2. Plenura creates escrow via Colectiva
3. Client pays (held in escrow)
4. Service completed
5. Colectiva releases funds:
   - Plenura commission → Plenura
   - Practice commission → Practice (if applicable)
   - Remainder → Therapist wallet
```

### Lead Generation Flow (Camino → Plenura)
```
1. Lead captured in Camino campaign
2. Lead nurtured via Camino CRM
3. Lead converts to practitioner
4. SSO account created in Camino
5. User onboards to Plenura
6. Optional: Upsell Constanza for invoicing
```

### KYC Flow (Plenura + Colectiva)
```
Phase 1 (Local):
1. Therapist uploads documents to Plenura
2. Admin reviews and approves
3. Verification badges displayed

Phase 2 (Colectiva):
1. Therapist redirected to Colectiva KYC portal
2. Documents verified by Colectiva
3. Status synced back to Plenura via webhook
4. Verification badges displayed
```

---

## SSO Architecture

All apps share Camino SSO via OAuth2:

```
┌─────────────┐     OAuth2      ┌─────────────┐
│   Client    │ ◄─────────────► │   Camino    │
│  (Browser)  │                 │  SSO Hub    │
└─────────────┘                 └─────────────┘
       │                               │
       │ Session Token                 │
       ▼                               ▼
┌─────────────┐               ┌─────────────┐
│  Plenura    │               │ Constanza/  │
│             │               │ Colectiva   │
└─────────────┘               └─────────────┘
```

### Account Linking
When users authenticate via Camino SSO:
1. Check if email exists in target app
2. If exists: Link accounts, merge profiles
3. If new: Create profile, copy relevant data
4. SSO ID stored for future logins

---

## Revenue Attribution

| Source App | Revenue Type | Destination |
|------------|--------------|-------------|
| Plenura | Booking commissions | RBS |
| Plenura | Subscription fees | RBS |
| Constanza | Invoice service fees | RBS |
| Colectiva | Payment processing fees | RBS |
| Camino | CRM subscription | RBS |
| Camino → Colectiva | Fintech upsell | RBS |

---

## Environment Variables

```env
# Camino SSO
CAMINO_CLIENT_ID=xxx
CAMINO_CLIENT_SECRET=xxx
CAMINO_ISSUER_URL=https://camino.rbs.mx

# Colectiva Payments
COLECTIVA_API_URL=https://api.colectiva.rbs.mx
COLECTIVA_API_KEY=xxx
COLECTIVA_WEBHOOK_SECRET=xxx

# KYC Toggle
USE_COLECTIVA_KYC=false  # Set to true for Phase 2
```
