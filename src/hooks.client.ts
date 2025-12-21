import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: import.meta.env.VITE_PUBLIC_SENTRY_DSN,
	environment: import.meta.env.MODE,
	tracesSampleRate: 1.0,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	integrations: [replayIntegration()],
	ignoreErrors: [
		'ResizeObserver loop limit exceeded',
		'Non-Error promise rejection captured',
		'NetworkError',
		'Failed to fetch'
	],
	beforeSend(event, hint) {
		if (import.meta.env.MODE === 'development') {
			console.error('Sentry captured error:', hint.originalException || hint.syntheticException);
			return null;
		}
		return event;
	}
});

export const handleError = handleErrorWithSentry();
