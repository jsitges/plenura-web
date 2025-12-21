import * as server from '../entries/pages/(app)/_layout.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/(app)/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/(app)/+layout.server.ts";
export const imports = ["_app/immutable/nodes/2.CA_JlbqI.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BrIXjfFn.js","_app/immutable/chunks/DCMERdpK.js","_app/immutable/chunks/8jpNibKI.js","_app/immutable/chunks/BpdVmXgk.js","_app/immutable/chunks/CXnZBGaQ.js","_app/immutable/chunks/B1_jHp8y.js","_app/immutable/chunks/DDc__TWD.js","_app/immutable/chunks/D-d23D4K.js","_app/immutable/chunks/DQ5x3iEO.js","_app/immutable/chunks/CzxsKxIF.js","_app/immutable/chunks/Bqkp701z.js","_app/immutable/chunks/CfUxREeX.js"];
export const stylesheets = [];
export const fonts = [];
