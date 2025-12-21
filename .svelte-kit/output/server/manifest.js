export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.mUEobZnG.js",app:"_app/immutable/entry/app.DhhJXFyc.js",imports:["_app/immutable/entry/start.mUEobZnG.js","_app/immutable/chunks/CzxsKxIF.js","_app/immutable/chunks/BrIXjfFn.js","_app/immutable/chunks/DCMERdpK.js","_app/immutable/chunks/8jpNibKI.js","_app/immutable/chunks/BpdVmXgk.js","_app/immutable/chunks/Bqkp701z.js","_app/immutable/entry/app.DhhJXFyc.js","_app/immutable/chunks/DCMERdpK.js","_app/immutable/chunks/8jpNibKI.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BrIXjfFn.js","_app/immutable/chunks/BpdVmXgk.js","_app/immutable/chunks/CXnZBGaQ.js","_app/immutable/chunks/D-d23D4K.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js')),
			__memo(() => import('./nodes/12.js')),
			__memo(() => import('./nodes/13.js')),
			__memo(() => import('./nodes/14.js')),
			__memo(() => import('./nodes/15.js')),
			__memo(() => import('./nodes/16.js')),
			__memo(() => import('./nodes/17.js')),
			__memo(() => import('./nodes/18.js')),
			__memo(() => import('./nodes/19.js')),
			__memo(() => import('./nodes/20.js')),
			__memo(() => import('./nodes/21.js')),
			__memo(() => import('./nodes/22.js')),
			__memo(() => import('./nodes/23.js')),
			__memo(() => import('./nodes/24.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/api/webhooks/colectiva",
				pattern: /^\/api\/webhooks\/colectiva\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/webhooks/colectiva/_server.ts.js'))
			},
			{
				id: "/(app)/bookings",
				pattern: /^\/bookings\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/(app)/booking/new",
				pattern: /^\/booking\/new\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/(app)/booking/[id]/confirmation",
				pattern: /^\/booking\/([^/]+?)\/confirmation\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/(app)/booking/[id]/review",
				pattern: /^\/booking\/([^/]+?)\/review\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/(auth)/callback",
				pattern: /^\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/(auth)/callback/_server.ts.js'))
			},
			{
				id: "/(app)/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/(app)/favorites",
				pattern: /^\/favorites\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/(auth)/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/(app)/referrals",
				pattern: /^\/referrals\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/(auth)/register",
				pattern: /^\/register\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/(auth)/register/confirm",
				pattern: /^\/register\/confirm\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/(app)/therapists",
				pattern: /^\/therapists\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/(app)/therapists/[id]",
				pattern: /^\/therapists\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/(app)/therapist",
				pattern: /^\/therapist\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/(app)/therapist/availability",
				pattern: /^\/therapist\/availability\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/(app)/therapist/bookings",
				pattern: /^\/therapist\/bookings\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/(app)/therapist/earnings",
				pattern: /^\/therapist\/earnings\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/(app)/therapist/profile",
				pattern: /^\/therapist\/profile\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/(app)/therapist/services",
				pattern: /^\/therapist\/services\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/(app)/therapist/subscription",
				pattern: /^\/therapist\/subscription\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 19 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
