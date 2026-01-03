# Plenura - Ecosystem Context

> **Part of**: Red Broom Software S.A.S. Ecosystem
> **Last Updated**: January 2, 2026
> **Role**: Therapy & Wellness Platform

---

## Purpose in the Ecosystem

Plenura is the **therapy and wellness platform** for connecting clients with therapists (psychologists, nutritionists, etc.) for both in-person and online sessions.

**What it does**: Therapist directory, booking system, payments via escrow, video therapy sessions, client wallets
**What it doesn't do**: Accounting (Constanza), payment gateway (Colectiva), CRM communications (Camino)

---

## Position in Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                    RED BROOM SOFTWARE S.A.S.                           │
└──────────────────────┬────────────────────────────────────────────────┘
                       │
       ┌───────────────┴───────────┬──────────────┬─────────────┐
       │                           │              │             │
       ▼                           ▼              ▼             ▼
  ┌─────────┐               ┌──────────┐    ┌──────────┐   ┌─────────┐
  │COLECTIVA│──────────────►│ CAMINO   │    │CONSTANZA │   │  JAAS   │
  │(Payments)│              │(Comms Hub)│    │(Invoices)│   │(Video)  │
  └─────────┘               └──────────┘    └──────────┘   └────┬────┘
       │                         │                              │
       │ Escrow/Wallet           │ Email/WhatsApp               │ Video
       │ KYC Verification        │ Notifications                │ Therapy
       ▼                         ▼                              ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                           PLENURA                                    │
  │                    ◄── YOU ARE HERE ──►                              │
  │  Therapist Directory | Bookings | Wallets | Video Sessions          │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Upstream Dependencies

| Service | Purpose | Implementation |
|---------|---------|----------------|
| **Supabase** | Database, Auth, Realtime | PostgreSQL with RLS |
| **Camino OAuth2** | SSO identity provider | `/auth/rbs` PKCE flow |
| **Colectiva** | Payments, Escrow, Wallets | REST API + Webhooks |
| **JaaS (8x8.vc)** | Video conferencing | JWT-authenticated rooms |
| **Resend** | Transactional emails | API integration |
| **Mapbox** | Location services | Public token |

### Key Integrations

#### 1. Colectiva Payment Hub
- **Escrow System**: Payments held until session completion
- **Client Wallets**: Deposit and spend balance
- **Therapist Payouts**: Automatic release on booking completion
- **KYC**: Therapist identity verification

```typescript
// Webhook events handled
'escrow.created' | 'escrow.funded' | 'escrow.released' | 'escrow.refunded'
'wallet.created' | 'payout.completed'
'kyc.status_changed' | 'kyc.fully_verified'
```

#### 2. JaaS Video Therapy
- **Room Management**: Auto-created for `online_video` bookings
- **JWT Authentication**: RS256 signed tokens with user context
- **Session Tracking**: Join/leave times, duration, notes

```typescript
// Video session lifecycle
'scheduled' → 'waiting' → 'active' → 'completed'
                                   → 'missed' (no-show)
                                   → 'cancelled'
```

#### 3. Camino SSO
- **OAuth2 PKCE**: Secure authentication flow
- **Ecosystem Bridge**: Links Plenura users to RBS organization

---

## Core Features

### Therapist Module
- Profile management (bio, certifications, experience)
- Service offerings with pricing
- Availability scheduling (weekly calendar)
- Earnings dashboard
- Session notes (private)

### Client Module
- Therapist search with filters
- Booking flow with payment
- Wallet for deposits
- Session history
- Reviews and ratings

### Video Therapy
- Pre-session waiting room
- Jitsi Meet embed with custom branding
- Session timer
- Post-session notes (therapist only)

---

## Database Schema (Key Tables)

```
users                 # All users (clients + therapists)
therapists            # Therapist profiles (1:1 with users)
therapist_services    # Services offered by therapists
availability          # Weekly availability slots
bookings              # Session bookings with escrow
client_wallets        # Wallet balances
wallet_transactions   # Transaction history
video_sessions        # Video session metadata
reviews               # Client reviews of therapists
```

---

## Environment Variables

```bash
# Core
PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Payments
COLECTIVA_API_URL, COLECTIVA_API_KEY, COLECTIVA_WEBHOOK_SECRET

# Video
JAAS_APP_ID, JAAS_API_KEY, JAAS_PRIVATE_KEY

# SSO
RBS_CLIENT_ID, RBS_CLIENT_SECRET

# Communications
CAMINO_API_URL, CAMINO_API_KEY, RESEND_API_KEY
```

---

## API Routes

### Public
- `GET /therapists` - Browse therapists
- `GET /therapists/[id]` - Therapist profile

### Authenticated (Client)
- `POST /booking/new` - Create booking
- `GET /bookings` - My bookings
- `GET /wallet` - Wallet balance
- `POST /wallet/deposit` - Add funds

### Authenticated (Therapist)
- `GET /therapist/bookings` - My sessions
- `GET /therapist/earnings` - Earnings dashboard
- `POST /therapist/availability` - Set availability

### Video Sessions
- `GET /session/[bookingId]` - Join video session
- `POST /session/[bookingId]/join` - Get JWT token
- `POST /session/[bookingId]/end` - End session

### Webhooks
- `POST /api/webhooks/colectiva` - Payment events

---

## Cron Jobs (pg_cron)

| Job | Schedule | Purpose |
|-----|----------|---------|
| send-booking-reminders | Hourly | 24h before session |
| send-weekly-reports | Monday 3pm | Therapist summaries |
| expire-featured-therapists | Hourly | Remove expired features |
| reset-monthly-booking-counts | 1st of month | Stats reset |

---

## Current Status

**Production URL**: https://plenura.redbroomsoftware.com

### Implemented
- ✅ Therapist directory and profiles
- ✅ Booking system with escrow
- ✅ Client wallets and deposits
- ✅ Video therapy sessions (JaaS)
- ✅ Colectiva payment integration
- ✅ RBS SSO (Camino OAuth2)
- ✅ Email notifications
- ✅ Cron jobs for reminders

### Planned
- 📋 WhatsApp notifications
- 📋 Mobile app (PWA)
- 📋 Group therapy sessions
- 📋 Subscription packages

---

## Development

```bash
# Install
npm install

# Run dev server
npm run dev

# Build
npm run build

# Database migrations
npx supabase db push
```

---

*Document Owner: RBS Engineering*
