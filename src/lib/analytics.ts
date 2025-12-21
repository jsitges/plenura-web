// PostHog Analytics - Event tracking and user analytics
import posthog from 'posthog-js';
import { browser } from '$app/environment';

let initialized = false;

export function initAnalytics() {
	if (!browser || initialized) return;

	const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
	const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

	if (!posthogKey) {
		console.warn('PostHog not configured - analytics disabled');
		return;
	}

	posthog.init(posthogKey, {
		api_host: posthogHost,
		loaded: (posthog) => {
			if (import.meta.env.MODE === 'development') {
				posthog.debug();
			}
		},
		capture_pageview: false,
		capture_pageleave: true
	});

	initialized = true;
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
	if (!browser || !initialized) return;
	posthog.identify(userId, properties);
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
	if (!browser || !initialized) return;
	posthog.capture(eventName, properties);
}

export function trackPageView(path?: string) {
	if (!browser || !initialized) return;
	posthog.capture('$pageview', {
		$current_url: path || window.location.href
	});
}

export function resetAnalytics() {
	if (!browser || !initialized) return;
	posthog.reset();
}

// Plenura-specific event helpers
export const analytics = {
	// Booking events
	bookingCreated: (bookingId: string, serviceId: string, priceCents: number) => {
		trackEvent('booking_created', { booking_id: bookingId, service_id: serviceId, price_cents: priceCents });
	},
	bookingConfirmed: (bookingId: string) => {
		trackEvent('booking_confirmed', { booking_id: bookingId });
	},
	bookingCompleted: (bookingId: string, rating?: number) => {
		trackEvent('booking_completed', { booking_id: bookingId, rating });
	},
	bookingCancelled: (bookingId: string, cancelledBy: string) => {
		trackEvent('booking_cancelled', { booking_id: bookingId, cancelled_by: cancelledBy });
	},

	// Therapist events
	therapistViewed: (therapistId: string) => {
		trackEvent('therapist_viewed', { therapist_id: therapistId });
	},
	therapistFavorited: (therapistId: string) => {
		trackEvent('therapist_favorited', { therapist_id: therapistId });
	},
	therapistContacted: (therapistId: string) => {
		trackEvent('therapist_contacted', { therapist_id: therapistId });
	},

	// Search events
	searchPerformed: (query: string, filters: Record<string, unknown>, resultsCount: number) => {
		trackEvent('search_performed', { query, filters, results_count: resultsCount });
	},

	// Payment events
	paymentInitiated: (bookingId: string, amountCents: number) => {
		trackEvent('payment_initiated', { booking_id: bookingId, amount_cents: amountCents });
	},
	tipSent: (bookingId: string, amountCents: number) => {
		trackEvent('tip_sent', { booking_id: bookingId, amount_cents: amountCents });
	},

	// Subscription events
	subscriptionUpgraded: (fromTier: string, toTier: string) => {
		trackEvent('subscription_upgraded', { from_tier: fromTier, to_tier: toTier });
	},
	featuredPurchased: (packageId: string, days: number) => {
		trackEvent('featured_purchased', { package_id: packageId, days });
	},

	// Referral events
	referralCodeShared: (code: string, method: string) => {
		trackEvent('referral_code_shared', { code, method });
	},
	referralCompleted: (code: string) => {
		trackEvent('referral_completed', { code });
	},

	// Review events
	reviewSubmitted: (bookingId: string, rating: number) => {
		trackEvent('review_submitted', { booking_id: bookingId, rating });
	},

	// Auth events
	userSignup: (method: string, role: string) => {
		trackEvent('user_signup', { method, role });
	},
	userLogin: (method: string) => {
		trackEvent('user_login', { method });
	},
	userLogout: () => {
		trackEvent('user_logout');
	}
};
