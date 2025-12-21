import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.Fx1IIXW6.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DCMERdpK.js","_app/immutable/chunks/BpdVmXgk.js","_app/immutable/chunks/B1_jHp8y.js"];
export const stylesheets = ["_app/immutable/assets/0.Bthltv73.css"];
export const fonts = [];
