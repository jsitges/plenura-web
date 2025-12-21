import { h as head, a as attr_class, s as stringify, b as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { p as page } from "../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import { e as escape_html } from "../../../chunks/context.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import { c as createClient } from "../../../chunks/client.js";
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children, data } = $$props;
    createClient();
    function getInitials(name) {
      if (!name) return "?";
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    head("1v2axqk", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Dashboard - Plenura</title>`);
      });
    });
    if (data.session) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="min-h-screen bg-gray-50"><nav class="bg-white border-b border-gray-200 sticky top-0 z-50"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="flex justify-between h-16"><div class="flex items-center"><a href="/" class="flex items-center gap-2"><div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center"><span class="text-white text-lg">🌿</span></div> <span class="text-xl font-bold text-gray-900">Plenura</span></a></div> <div class="hidden md:flex items-center gap-6"><a href="/dashboard"${attr_class(`text-gray-600 hover:text-primary-600 font-medium transition-colors ${stringify(store_get($$store_subs ??= {}, "$page", page).url.pathname === "/dashboard" ? "text-primary-600" : "")}`)}>Inicio</a> <a href="/bookings"${attr_class(`text-gray-600 hover:text-primary-600 font-medium transition-colors ${stringify(store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith("/bookings") ? "text-primary-600" : "")}`)}>Mis Citas</a> <a href="/therapists"${attr_class(`text-gray-600 hover:text-primary-600 font-medium transition-colors ${stringify(store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith("/therapists") ? "text-primary-600" : "")}`)}>Buscar</a> <a href="/favorites"${attr_class(`text-gray-600 hover:text-primary-600 font-medium transition-colors ${stringify(store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith("/favorites") ? "text-primary-600" : "")}`)}>Favoritos</a> <a href="/referrals"${attr_class(`text-gray-600 hover:text-primary-600 font-medium transition-colors ${stringify(store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith("/referrals") ? "text-primary-600" : "")}`)}>Referidos</a> `);
      if (data.therapistProfile) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<a href="/therapist"${attr_class(`bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-primary-100 ${stringify(store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith("/therapist") ? "bg-primary-100" : "")}`)}>Mi Consultorio</a>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-4"><div class="relative"><button type="button" class="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"><div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><span class="text-primary-700 text-sm font-medium">${escape_html(getInitials(data.userProfile?.full_name ?? data.user?.email))}</span></div> <svg class="w-4 h-4 text-gray-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <button type="button" class="md:hidden p-2 rounded-lg hover:bg-gray-100"><svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>`);
      }
      $$renderer2.push(`<!--]--></svg></button></div></div></div> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></nav> <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`);
      children($$renderer2);
      $$renderer2.push(`<!----></main></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="min-h-screen bg-gray-50 flex items-center justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
