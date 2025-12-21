import { e as ensure_array_like, c as attr, a as attr_class, s as stringify, b as store_get, u as unsubscribe_stores } from "../../../../chunks/index2.js";
import { p as page } from "../../../../chunks/stores.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children, data } = $$props;
    const navItems = [
      { href: "/therapist", label: "Dashboard", icon: "home" },
      {
        href: "/therapist/bookings",
        label: "Citas",
        icon: "calendar"
      },
      {
        href: "/therapist/availability",
        label: "Disponibilidad",
        icon: "clock"
      },
      {
        href: "/therapist/services",
        label: "Servicios",
        icon: "briefcase"
      },
      {
        href: "/therapist/earnings",
        label: "Ganancias",
        icon: "dollar"
      },
      {
        href: "/therapist/subscription",
        label: "Mi Plan",
        icon: "star"
      },
      { href: "/therapist/profile", label: "Mi Perfil", icon: "user" }
    ];
    function isActive(href) {
      if (href === "/therapist") {
        return store_get($$store_subs ??= {}, "$page", page).url.pathname === "/therapist";
      }
      return store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith(href);
    }
    $$renderer2.push(`<div class="flex flex-col lg:flex-row gap-6"><aside class="lg:w-64 flex-shrink-0"><div class="bg-white rounded-xl border border-gray-100 p-4 sticky top-24"><div class="mb-6 pb-4 border-b border-gray-100"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center"><span class="text-primary-700 font-medium">${escape_html((data.userProfile?.full_name ?? "?")[0].toUpperCase())}</span></div> <div class="flex-1 min-w-0"><p class="font-medium text-gray-900 truncate">${escape_html(data.userProfile?.full_name ?? "Terapeuta")}</p> <div class="flex items-center gap-1.5">`);
    if (data.therapistProfile?.vetting_status === "approved") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="w-2 h-2 bg-green-500 rounded-full"></span> <span class="text-xs text-green-600">Verificado</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (data.therapistProfile?.vetting_status === "pending") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="w-2 h-2 bg-amber-500 rounded-full"></span> <span class="text-xs text-amber-600">Pendiente</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="w-2 h-2 bg-red-500 rounded-full"></span> <span class="text-xs text-red-600">Rechazado</span>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div> <nav class="space-y-1"><!--[-->`);
    const each_array = ensure_array_like(navItems);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<a${attr("href", item.href)}${attr_class(`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${stringify(isActive(item.href) ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50")}`)}>`);
      if (item.icon === "home") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (item.icon === "calendar") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (item.icon === "clock") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
          } else {
            $$renderer2.push("<!--[!-->");
            if (item.icon === "briefcase") {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`);
            } else {
              $$renderer2.push("<!--[!-->");
              if (item.icon === "dollar") {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
              } else {
                $$renderer2.push("<!--[!-->");
                if (item.icon === "star") {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`);
                } else {
                  $$renderer2.push("<!--[!-->");
                  if (item.icon === "user") {
                    $$renderer2.push("<!--[-->");
                    $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`);
                  } else {
                    $$renderer2.push("<!--[!-->");
                  }
                  $$renderer2.push(`<!--]-->`);
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--> <span class="font-medium">${escape_html(item.label)}</span></a>`);
    }
    $$renderer2.push(`<!--]--></nav> <div class="mt-6 pt-4 border-t border-gray-100"><div class="flex items-center justify-between"><span class="text-sm text-gray-600">Disponible</span> <button type="button"${attr_class(`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${stringify(data.therapistProfile?.is_available ? "bg-primary-600" : "bg-gray-200")}`)} role="switch"${attr("aria-checked", data.therapistProfile?.is_available)}><span${attr_class(`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${stringify(data.therapistProfile?.is_available ? "translate-x-5" : "translate-x-0")}`)}></span></button></div></div></div></aside> <main class="flex-1 min-w-0">`);
    children($$renderer2);
    $$renderer2.push(`<!----></main></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
