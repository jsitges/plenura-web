import { h as head, a as attr_class, e as ensure_array_like, s as stringify, d as clsx, c as attr } from "../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let myServiceIds = new Set(data.myServices.map((s) => s.service_id));
    let selectedCategory = "all";
    let servicesByCategory = () => {
      const grouped = /* @__PURE__ */ new Map();
      for (const service of data.allServices) {
        const cat = service.categories;
        if (!grouped.has(cat.id)) {
          grouped.set(cat.id, { category: cat, services: [] });
        }
        grouped.get(cat.id).services.push(service);
      }
      return Array.from(grouped.values());
    };
    let filteredMyServices = data.myServices;
    function formatPrice(cents) {
      return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(cents / 100);
    }
    head("pvtyf9", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Mis Servicios - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6"><div><h1 class="text-2xl font-bold text-gray-900">Mis Servicios</h1> <p class="text-gray-500">Configura los servicios que ofreces y sus precios</p></div> <div class="flex gap-2 overflow-x-auto pb-2"><button${attr_class(`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${stringify(
      "bg-primary-600 text-white"
    )}`)}>Todos</button> <!--[-->`);
    const each_array = ensure_array_like(data.categories);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let category = each_array[$$index];
      $$renderer2.push(`<button${attr_class(`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${stringify(selectedCategory === category.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}`)}>${escape_html(category.name_es || category.name)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (filteredMyServices.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-white rounded-xl border border-gray-100"><div class="p-4 border-b border-gray-100"><h2 class="font-semibold text-gray-900">Servicios Activos (${escape_html(filteredMyServices.length)})</h2></div> <div class="divide-y divide-gray-100"><!--[-->`);
      const each_array_1 = ensure_array_like(filteredMyServices);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let therapistService = each_array_1[$$index_1];
        $$renderer2.push(`<div class="p-4 flex items-center gap-4"><div${attr_class(`w-10 h-10 rounded-lg flex items-center justify-center ${stringify(therapistService.is_active ? "bg-primary-100" : "bg-gray-100")}`)}><span${attr_class(clsx(therapistService.is_active ? "text-primary-600" : "text-gray-400"))}>${escape_html(therapistService.services.categories?.icon || "✨")}</span></div> <div class="flex-1 min-w-0"><div class="flex items-center gap-2"><h3 class="font-medium text-gray-900 truncate">${escape_html(therapistService.services.name_es || therapistService.services.name)}</h3> `);
        if (!therapistService.is_active) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Pausado</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div> <p class="text-sm text-gray-500">${escape_html(formatPrice(therapistService.price_cents))} · ${escape_html(therapistService.duration_minutes)} min</p></div> <div class="flex items-center gap-2"><button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button> <form method="POST" action="?/toggle"><input type="hidden" name="therapist_service_id"${attr("value", therapistService.id)}/> <button type="submit"${attr_class(`p-2 rounded-lg transition-colors ${stringify(therapistService.is_active ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-green-500 hover:text-green-600 hover:bg-green-50")}`)}${attr("title", therapistService.is_active ? "Pausar" : "Activar")}>`);
        if (therapistService.is_active) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
        }
        $$renderer2.push(`<!--]--></button></form> <form method="POST" action="?/remove"><input type="hidden" name="therapist_service_id"${attr("value", therapistService.id)}/> <button type="submit" class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></form></div></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="bg-white rounded-xl border border-gray-100 p-8 text-center"><div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg></div> <h3 class="text-lg font-medium text-gray-900 mb-2">No tienes servicios configurados</h3> <p class="text-gray-500 mb-4">Agrega servicios del catálogo para que los clientes puedan reservar contigo</p></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="bg-white rounded-xl border border-gray-100"><div class="p-4 border-b border-gray-100"><h2 class="font-semibold text-gray-900">Agregar Servicios</h2> <p class="text-sm text-gray-500">Selecciona los servicios que deseas ofrecer</p></div> <div class="divide-y divide-gray-100"><!--[-->`);
    const each_array_2 = ensure_array_like(servicesByCategory());
    for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
      let group = each_array_2[$$index_3];
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="p-4"><h3 class="text-sm font-medium text-gray-500 mb-3">${escape_html(group.category.icon || "📁")}
							${escape_html(group.category.name_es || group.category.name)}</h3> <div class="grid gap-3"><!--[-->`);
        const each_array_3 = ensure_array_like(group.services);
        for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
          let service = each_array_3[$$index_2];
          const alreadyAdded = myServiceIds.has(service.id);
          $$renderer2.push(`<div${attr_class(`flex items-center gap-4 p-3 rounded-lg border ${stringify(alreadyAdded ? "border-gray-100 bg-gray-50" : "border-gray-200 hover:border-primary-200 hover:bg-primary-50/30")} transition-colors`)}><div class="flex-1 min-w-0"><h4 class="font-medium text-gray-900">${escape_html(service.name_es || service.name)}</h4> `);
          if (service.description) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p class="text-sm text-gray-500 truncate">${escape_html(service.description)}</p>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> <p class="text-xs text-gray-400 mt-1">Precio sugerido: ${escape_html(formatPrice(service.default_price_cents))} · ${escape_html(service.default_duration_minutes)}
											min</p></div> `);
          if (alreadyAdded) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="text-sm text-green-600 font-medium flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Agregado</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">Agregar</button>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
