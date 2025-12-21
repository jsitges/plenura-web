export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24')
];

export const server_loads = [0,2,3];

export const dictionary = {
		"/": [5],
		"/(app)/bookings": [~9,[2]],
		"/(app)/booking/new": [~8,[2]],
		"/(app)/booking/[id]/confirmation": [~6,[2]],
		"/(app)/booking/[id]/review": [~7,[2]],
		"/(app)/dashboard": [10,[2]],
		"/(app)/favorites": [~11,[2]],
		"/(auth)/login": [22,[4]],
		"/(app)/referrals": [~12,[2]],
		"/(auth)/register": [23,[4]],
		"/(auth)/register/confirm": [24,[4]],
		"/(app)/therapists": [~20,[2]],
		"/(app)/therapists/[id]": [~21,[2]],
		"/(app)/therapist": [~13,[2,3]],
		"/(app)/therapist/availability": [~14,[2,3]],
		"/(app)/therapist/bookings": [~15,[2,3]],
		"/(app)/therapist/earnings": [~16,[2,3]],
		"/(app)/therapist/profile": [~17,[2,3]],
		"/(app)/therapist/services": [~18,[2,3]],
		"/(app)/therapist/subscription": [~19,[2,3]]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';