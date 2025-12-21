# Plenura Implementation Guide

A comprehensive reference for implementing a production-ready SvelteKit + Supabase marketplace application. This guide covers the patterns and implementations used in Plenura that can be reused for Blood-Donor, Puppy Love, Cookie Monster, Servilleta, and Hospitality Fiscal.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema Patterns](#database-schema-patterns)
4. [Authentication & Authorization](#authentication--authorization)
5. [Legal Pages (Terms, Privacy, Support)](#legal-pages)
6. [Social Features](#social-features)
7. [Monetization Features](#monetization-features)
8. [Notifications (Email & WhatsApp)](#notifications)
9. [Analytics & Error Tracking](#analytics--error-tracking)
10. [SEO & Meta Tags](#seo--meta-tags)
11. [Cookie Consent (GDPR/LFPDPPP)](#cookie-consent)
12. [Cron Jobs & Background Tasks](#cron-jobs)
13. [Reusable Components](#reusable-components)
14. [Environment Variables](#environment-variables)

---

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | SvelteKit 5 | Full-stack web framework with SSR |
| Language | TypeScript | Type safety |
| Database | Supabase PostgreSQL | Database with RLS, Auth, Edge Functions |
| Styling | Tailwind CSS + DaisyUI | Utility-first CSS with components |
| Auth | Supabase Auth | Email/password, OAuth, magic links |
| Payments | Colectiva API | Mexican payment processing with escrow |
| Email | Resend | Transactional emails |
| WhatsApp | Meta Cloud API | Business tier notifications |
| Analytics | PostHog | Product analytics |
| Errors | Sentry | Error tracking |
| Hosting | Vercel | Edge deployment |

---

## Project Structure

```
src/
├── routes/
│   ├── +layout.svelte          # Root layout with SEO & CookieConsent
│   ├── +page.svelte             # Landing page
│   ├── (auth)/                  # Public auth routes
│   │   ├── login/
│   │   └── register/
│   ├── (app)/                   # Authenticated routes
│   │   ├── +layout.svelte       # App layout with nav
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   └── therapist/           # Provider dashboard (nested layout)
│   ├── (admin)/                 # Admin routes (separate layout)
│   ├── api/                     # API endpoints
│   │   ├── webhooks/
│   │   └── cron/
│   ├── terms/                   # Legal: Terms & Conditions
│   ├── privacy/                 # Legal: Privacy Policy
│   ├── support/                 # Support center with FAQs
│   ├── about/                   # About page
│   ├── contact/                 # Contact page
│   └── become-therapist/        # Provider onboarding landing
├── lib/
│   ├── components/              # Reusable components
│   │   ├── SEO.svelte           # Open Graph meta tags
│   │   ├── ShareButton.svelte   # Social sharing
│   │   ├── CookieConsent.svelte # GDPR/LFPDPPP compliance
│   │   └── ...
│   ├── services/                # Business logic
│   │   ├── booking.service.ts
│   │   ├── email.service.ts
│   │   ├── whatsapp.service.ts
│   │   ├── tips.service.ts
│   │   └── support.service.ts
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   └── server.ts            # Server client with service role
│   ├── stores/                  # Svelte stores
│   ├── analytics.ts             # PostHog + Sentry init
│   └── types/
└── supabase/
    └── migrations/              # SQL migrations with RLS
```

---

## Database Schema Patterns

### Multi-tenancy with RLS

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    email_preferences JSONB DEFAULT '{"booking_reminders": true, "marketing": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only read/update their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());
```

### Provider/Service Pattern (Therapists, Donors, Restaurants, etc.)

```sql
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Status & Verification
    vetting_status TEXT DEFAULT 'pending' CHECK (vetting_status IN ('pending', 'approved', 'rejected', 'suspended')),
    is_available BOOLEAN DEFAULT true,

    -- Profile
    bio TEXT,
    years_of_experience INTEGER,
    rating_avg NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    -- Monetization
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'professional', 'business', 'enterprise')),
    is_featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMPTZ,

    -- Location (PostGIS)
    location GEOGRAPHY(POINT),
    service_radius_km INTEGER DEFAULT 15,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Booking/Transaction Pattern

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES providers(id),
    service_id UUID REFERENCES services(id),

    -- Scheduling
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),

    -- Payment
    price_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER,
    provider_amount_cents INTEGER,
    escrow_id TEXT,

    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID,
    cancellation_reason TEXT,
    refund_amount_cents INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent double-booking with exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING gist (
        provider_id WITH =,
        booking_date WITH =,
        tsrange(start_time::timestamp, end_time::timestamp) WITH &&
    )
    WHERE (status NOT IN ('cancelled', 'no_show'));
```

### Support Tickets (Camino Integration)

```sql
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',

    -- External CRM sync
    camino_ticket_id TEXT,
    camino_sync_status TEXT DEFAULT 'pending',

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Authentication & Authorization

### Server-side Auth Check

```typescript
// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';

export const handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY,
        { cookies: { get: event.cookies.get, set: event.cookies.set, remove: event.cookies.delete } }
    );

    const { data: { session } } = await event.locals.supabase.auth.getSession();
    event.locals.session = session;
    event.locals.user = session?.user;

    // Load user profile
    if (session?.user) {
        const { data } = await event.locals.supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
        event.locals.userProfile = data;
    }

    return resolve(event);
};
```

### Protected Route Pattern

```typescript
// src/routes/(app)/+layout.server.ts
export const load = async ({ locals, url }) => {
    if (!locals.session) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(url.pathname));
    }
    return { session: locals.session, user: locals.user, userProfile: locals.userProfile };
};
```

### Role-based Access

```typescript
// src/routes/(admin)/+layout.server.ts
export const load = async ({ locals }) => {
    if (!locals.session) throw redirect(302, '/login');
    if (locals.userProfile?.role !== 'admin') throw redirect(302, '/dashboard');
    return { user: locals.user };
};
```

---

## Legal Pages

### Terms & Conditions (`/terms`)

Key sections to include:
1. Acceptance of Terms
2. Definitions (User, Provider, Service, Booking)
3. Account Registration
4. Services Description
5. Payments & Fees
6. Cancellation Policy
7. Provider Verification
8. User Conduct
9. Intellectual Property
10. Limitation of Liability
11. Indemnification
12. Modifications
13. Termination
14. Governing Law (Mexico)
15. Contact Information

### Privacy Policy (`/privacy`) - LFPDPPP Compliant

Required sections for Mexican law:
1. Identity & Domicile of Responsible Party
2. Personal Data Collected (identification, contact, financial, health)
3. Purpose of Treatment (primary & secondary)
4. Data Transfers (third parties table)
5. **ARCO Rights** (Access, Rectification, Cancellation, Opposition)
6. Consent Revocation
7. Cookies & Tracking
8. Security Measures
9. Changes to Privacy Policy
10. **INAI Contact** (data protection authority)
11. Contact Information

### Support Center (`/support`)

Features:
- Category-based FAQ filtering
- Contact form with validation
- Integration with external CRM (Camino)
- Email/WhatsApp quick contact
- Ticket tracking

---

## Social Features

### ShareButton Component

```svelte
<!-- src/lib/components/ShareButton.svelte -->
<script lang="ts">
    // Native Web Share API with fallback
    const canNativeShare = browser && 'share' in navigator;

    async function handleShare() {
        if (canNativeShare) {
            await navigator.share({ title, text, url });
        } else {
            showDropdown = !showDropdown;
        }
    }

    // Social platform share URLs
    function shareToWhatsApp() {
        window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`);
    }
    function shareToFacebook() {
        window.open(`https://facebook.com/sharer/sharer.php?u=${encodedUrl}`);
    }
    // ... Twitter, LinkedIn, Email
</script>
```

### QR Code Generator

```svelte
<!-- Uses 'qrcode' package -->
<script>
    import QRCode from 'qrcode';

    async function generateQR() {
        await QRCode.toCanvas(canvas, profileUrl, {
            width: qrSize,
            color: { dark: qrColor, light: bgColor },
            errorCorrectionLevel: 'H'
        });
    }

    function downloadQR(format: 'png' | 'svg') {
        if (format === 'png') {
            link.href = canvas.toDataURL('image/png');
        } else {
            const svg = await QRCode.toString(url, { type: 'svg' });
            // ... create blob and download
        }
    }
</script>
```

---

## Monetization Features

### Subscription Tiers

```typescript
const SUBSCRIPTION_TIERS = {
    free: {
        commission: 0.10,
        monthlyBookings: 5,
        features: ['basic_profile', 'payments']
    },
    professional: {
        commission: 0.05,
        monthlyBookings: Infinity,
        features: ['featured_profile', 'analytics', 'priority_support'],
        price: 299
    },
    business: {
        commission: 0.03,
        features: ['whatsapp_notifications', 'api_access'],
        price: 699
    },
    enterprise: {
        commission: 0,
        features: ['white_label', 'dedicated_support'],
        price: 1299
    }
};
```

### Featured Listings

```sql
-- Stamp packs for featured visibility
CREATE TABLE stamp_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES providers(id),
    pack_type TEXT NOT NULL, -- 'starter', 'growth', 'professional'
    stamps_purchased INTEGER NOT NULL,
    stamps_remaining INTEGER NOT NULL,
    price_paid_cents INTEGER NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tips (100% to Provider)

```typescript
// Tips bypass platform fees
await supabase.from('tips').insert({
    booking_id,
    client_id,
    therapist_id,
    amount_cents,
    plenura_fee_cents: 0,  // No platform fee
    therapist_amount_cents: amount_cents
});
```

---

## Notifications

### Email Service (Resend)

```typescript
// src/lib/services/email.service.ts
import { Resend } from 'resend';

const resend = new Resend(RESEND_API_KEY);

export async function sendBookingConfirmation(email: string, data: BookingData) {
    await resend.emails.send({
        from: 'Plenura <reservas@plenura.com>',
        to: email,
        subject: `Reserva confirmada - ${data.serviceName}`,
        html: `...` // HTML template
    });
}
```

### WhatsApp Service (Meta Cloud API)

```typescript
// src/lib/services/whatsapp.service.ts
const WHATSAPP_ENABLED_TIERS = ['business', 'enterprise'];

export async function sendWhatsAppMessage(phone: string, template: string, params: object) {
    const response = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: { name: template, language: { code: 'es_MX' }, components: params }
            })
        }
    );
    return response.json();
}
```

---

## Analytics & Error Tracking

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';
import * as Sentry from '@sentry/sveltekit';

export function initAnalytics() {
    // PostHog
    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true,
        capture_pageview: false // Manual tracking
    });

    // Sentry
    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 0.1,
        environment: import.meta.env.MODE
    });
}

export function trackPageView(path: string) {
    posthog.capture('$pageview', { path });
}

export function trackEvent(name: string, properties?: object) {
    posthog.capture(name, properties);
}
```

---

## SEO & Meta Tags

```svelte
<!-- src/lib/components/SEO.svelte -->
<script lang="ts">
    interface Props {
        title?: string;
        description?: string;
        image?: string;
        type?: 'website' | 'article' | 'profile';
    }
</script>

<svelte:head>
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    <!-- Open Graph -->
    <meta property="og:type" content={type} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={imageUrl} />
    <meta property="og:locale" content="es_MX" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:image" content={imageUrl} />
</svelte:head>
```

---

## Cookie Consent

```svelte
<!-- src/lib/components/CookieConsent.svelte -->
<script lang="ts">
    const COOKIE_CONSENT_KEY = 'app_cookie_consent';

    type ConsentLevel = 'all' | 'necessary' | 'none';

    function saveConsent(level: ConsentLevel) {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
            level,
            version: '1.0',
            timestamp: new Date().toISOString()
        }));

        // Emit event for analytics to respond
        window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: { level } }));
    }
</script>

<!-- Banner with Accept All / Necessary Only / Details options -->
```

---

## Cron Jobs

### Supabase pg_cron Setup

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily booking reminders
SELECT cron.schedule(
    'send-booking-reminders',
    '0 8 * * *',  -- 8 AM daily
    $$
    SELECT net.http_post(
        url := current_setting('app.settings.app_url') || '/api/cron/booking-reminders',
        headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'))
    );
    $$
);

-- Weekly therapist reports
SELECT cron.schedule('weekly-reports', '0 9 * * 1', $$ ... $$);
```

---

## Environment Variables

```bash
# .env.example

# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payments
COLECTIVA_API_URL=https://colectiva.redbroomsoftware.com/api
COLECTIVA_API_KEY=your-api-key

# Email
RESEND_API_KEY=re_your_key

# WhatsApp (Business tier)
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_ACCESS_TOKEN=your-token

# Analytics
VITE_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
VITE_PUBLIC_POSTHOG_KEY=phc_...
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Cron Security
CRON_SECRET=your-secret

# External CRM
CAMINO_API_URL=https://camino.redbroomsoftware.com/api
CAMINO_API_KEY=your-key

# App
PUBLIC_APP_URL=https://plenura.com
```

---

## Adapting for Other Projects

### Blood-Donor
- Replace `therapists` → `donors`
- Replace `bookings` → `appointments` or `donations`
- Add blood type fields, eligibility tracking
- Focus on scheduling and reminders

### Puppy Love
- Replace `therapists` → `pet_sitters` or `breeders`
- Add pet profiles, vaccination records
- Review system for pet care

### Cookie Monster
- Replace `therapists` → `bakers` or `vendors`
- Replace `bookings` → `orders`
- Add product catalog, inventory management

### Servilleta
- Replace `therapists` → `restaurants` or `chefs`
- Add menu management, table reservations
- Order tracking, delivery integration

### Hospitality Fiscal
- Focus on `invoices`, `transactions`, `fiscal_reports`
- Add SAT integration, CFDI validation
- Accounting entries (pólizas), chart of accounts

---

## Quick Start Checklist

1. [ ] Clone and install: `npx sv create my-app`
2. [ ] Configure Supabase project
3. [ ] Run migrations: `supabase db push`
4. [ ] Set environment variables
5. [ ] Customize branding (colors, logo, content)
6. [ ] Update legal pages for your business
7. [ ] Configure payment provider
8. [ ] Set up email templates
9. [ ] Configure analytics
10. [ ] Deploy to Vercel

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/routes/terms/+page.svelte` | Terms & Conditions |
| `src/routes/privacy/+page.svelte` | Privacy Policy (LFPDPPP) |
| `src/routes/support/+page.svelte` | Support center with FAQs |
| `src/routes/about/+page.svelte` | About page |
| `src/routes/contact/+page.svelte` | Contact page |
| `src/routes/become-therapist/+page.svelte` | Provider onboarding landing |
| `src/lib/components/SEO.svelte` | Open Graph meta tags |
| `src/lib/components/ShareButton.svelte` | Social sharing |
| `src/lib/components/CookieConsent.svelte` | Cookie consent banner |
| `src/lib/services/email.service.ts` | Resend email service |
| `src/lib/services/whatsapp.service.ts` | WhatsApp Business API |
| `src/lib/services/support.service.ts` | Support ticket management |
| `src/lib/analytics.ts` | PostHog + Sentry |

---

*Last updated: December 2025*
*Plenura v1.0 - Red Broom Software*
