
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/(auth)" | "/(app)" | "/" | "/api" | "/api/webhooks" | "/api/webhooks/colectiva" | "/(app)/bookings" | "/(app)/booking" | "/(app)/booking/new" | "/(app)/booking/[id]" | "/(app)/booking/[id]/confirmation" | "/(app)/booking/[id]/review" | "/(auth)/callback" | "/(app)/dashboard" | "/(app)/favorites" | "/(auth)/login" | "/(app)/referrals" | "/(auth)/register" | "/(auth)/register/confirm" | "/(app)/therapists" | "/(app)/therapists/[id]" | "/(app)/therapist" | "/(app)/therapist/availability" | "/(app)/therapist/bookings" | "/(app)/therapist/earnings" | "/(app)/therapist/profile" | "/(app)/therapist/services" | "/(app)/therapist/subscription";
		RouteParams(): {
			"/(app)/booking/[id]": { id: string };
			"/(app)/booking/[id]/confirmation": { id: string };
			"/(app)/booking/[id]/review": { id: string };
			"/(app)/therapists/[id]": { id: string }
		};
		LayoutParams(): {
			"/(auth)": Record<string, never>;
			"/(app)": { id?: string };
			"/": { id?: string };
			"/api": Record<string, never>;
			"/api/webhooks": Record<string, never>;
			"/api/webhooks/colectiva": Record<string, never>;
			"/(app)/bookings": Record<string, never>;
			"/(app)/booking": { id?: string };
			"/(app)/booking/new": Record<string, never>;
			"/(app)/booking/[id]": { id: string };
			"/(app)/booking/[id]/confirmation": { id: string };
			"/(app)/booking/[id]/review": { id: string };
			"/(auth)/callback": Record<string, never>;
			"/(app)/dashboard": Record<string, never>;
			"/(app)/favorites": Record<string, never>;
			"/(auth)/login": Record<string, never>;
			"/(app)/referrals": Record<string, never>;
			"/(auth)/register": Record<string, never>;
			"/(auth)/register/confirm": Record<string, never>;
			"/(app)/therapists": { id?: string };
			"/(app)/therapists/[id]": { id: string };
			"/(app)/therapist": { id?: string };
			"/(app)/therapist/availability": Record<string, never>;
			"/(app)/therapist/bookings": Record<string, never>;
			"/(app)/therapist/earnings": Record<string, never>;
			"/(app)/therapist/profile": Record<string, never>;
			"/(app)/therapist/services": Record<string, never>;
			"/(app)/therapist/subscription": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/webhooks" | "/api/webhooks/" | "/api/webhooks/colectiva" | "/api/webhooks/colectiva/" | "/bookings" | "/bookings/" | "/booking" | "/booking/" | "/booking/new" | "/booking/new/" | `/booking/${string}` & {} | `/booking/${string}/` & {} | `/booking/${string}/confirmation` & {} | `/booking/${string}/confirmation/` & {} | `/booking/${string}/review` & {} | `/booking/${string}/review/` & {} | "/callback" | "/callback/" | "/dashboard" | "/dashboard/" | "/favorites" | "/favorites/" | "/login" | "/login/" | "/referrals" | "/referrals/" | "/register" | "/register/" | "/register/confirm" | "/register/confirm/" | "/therapists" | "/therapists/" | `/therapists/${string}` & {} | `/therapists/${string}/` & {} | "/therapist" | "/therapist/" | "/therapist/availability" | "/therapist/availability/" | "/therapist/bookings" | "/therapist/bookings/" | "/therapist/earnings" | "/therapist/earnings/" | "/therapist/profile" | "/therapist/profile/" | "/therapist/services" | "/therapist/services/" | "/therapist/subscription" | "/therapist/subscription/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}