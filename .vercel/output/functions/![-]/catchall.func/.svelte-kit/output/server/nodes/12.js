import * as server from '../entries/pages/(app)/referrals/_page.server.ts.js';

export const index = 12;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/(app)/referrals/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/(app)/referrals/+page.server.ts";
export const imports = ["_app/immutable/nodes/12.DidT950S.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DCMERdpK.js","_app/immutable/chunks/8jpNibKI.js","_app/immutable/chunks/CXnZBGaQ.js","_app/immutable/chunks/Bl9qzA8i.js","_app/immutable/chunks/B1_jHp8y.js"];
export const stylesheets = [];
export const fonts = [];
