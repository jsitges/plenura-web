import { h as head, c as attr, a as attr_class, e as ensure_array_like, s as stringify } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let searchQuery = data.filters.query ?? "";
    let selectedCategory = data.filters.categoryId ?? "";
    data.filters.serviceId ?? "";
    data.filters.minRating ?? 0;
    const categoryIcons = {
      "massage": "💆",
      "physiotherapy": "🏃",
      "psychology": "🧠",
      "nutrition": "🥗",
      "yoga": "🧘",
      "spa": "🛁"
    };
    function getCategoryIcon(slug) {
      return categoryIcons[slug] ?? "✨";
    }
    function getMinPrice(therapist) {
      if (!therapist.therapist_services?.length) return 0;
      return Math.min(...therapist.therapist_services.map((s) => s.price_cents)) / 100;
    }
    function formatPrice(price) {
      return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(price);
    }
    head("1s7m6g5", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Buscar Terapeutas - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6"><div><h1 class="text-2xl font-bold text-gray-900">Encuentra tu terapeuta ideal</h1> <p class="text-gray-500 mt-1">Profesionales verificados cerca de ti</p></div> <form class="flex gap-3"><div class="flex-1 relative"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> <input type="text"${attr("value", searchQuery)} placeholder="Buscar por nombre, especialidad..." class="input-wellness pl-10"/></div> <button type="submit" class="btn-primary-gradient px-6">Buscar</button> <button type="button" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg> <span class="hidden sm:inline">Filtros</span></button></form> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide svelte-1s7m6g5"><button type="button"${attr_class(`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${stringify(!selectedCategory ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}`)}>Todos</button> <!--[-->`);
    const each_array_2 = ensure_array_like(data.categories);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let category = each_array_2[$$index_2];
      $$renderer2.push(`<button type="button"${attr_class(`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${stringify(selectedCategory === category.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}`)}><span>${escape_html(getCategoryIcon(category.slug))}</span> <span>${escape_html(category.name)}</span></button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="flex items-center justify-between"><p class="text-sm text-gray-500">${escape_html(data.therapists.length)} terapeuta${escape_html(data.therapists.length !== 1 ? "s" : "")} encontrado${escape_html(data.therapists.length !== 1 ? "s" : "")}</p></div> `);
    if (data.therapists.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"><!--[-->`);
      const each_array_3 = ensure_array_like(data.therapists);
      for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
        let therapist = each_array_3[$$index_4];
        $$renderer2.push(`<a${attr("href", `/therapists/${stringify(therapist.id)}`)} class="card-wellness group hover:border-primary-200"><div class="flex items-start gap-4 mb-4"><div class="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">`);
        if (therapist.users?.avatar_url) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<img${attr("src", therapist.users.avatar_url)}${attr("alt", therapist.users.full_name ?? "")} class="w-full h-full object-cover"/>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<span class="text-2xl text-primary-600">${escape_html((therapist.users?.full_name ?? "?")[0].toUpperCase())}</span>`);
        }
        $$renderer2.push(`<!--]--></div> <div class="flex-1 min-w-0"><h3 class="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">${escape_html(therapist.users?.full_name ?? "Terapeuta")}</h3> <div class="flex items-center gap-1 text-sm"><span class="text-yellow-500">★</span> <span class="font-medium">${escape_html(therapist.rating_avg.toFixed(1))}</span> <span class="text-gray-400">(${escape_html(therapist.rating_count)})</span></div> `);
        if (therapist.years_of_experience) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="text-sm text-gray-500">${escape_html(therapist.years_of_experience)} años de experiencia</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div> `);
        if (therapist.bio) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="text-sm text-gray-600 line-clamp-2 mb-4">${escape_html(therapist.bio)}</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (therapist.therapist_services?.length) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="flex flex-wrap gap-1.5 mb-4"><!--[-->`);
          const each_array_4 = ensure_array_like(therapist.therapist_services.slice(0, 3));
          for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
            let ts = each_array_4[$$index_3];
            $$renderer2.push(`<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">${escape_html(ts.services?.name)}</span>`);
          }
          $$renderer2.push(`<!--]--> `);
          if (therapist.therapist_services.length > 3) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">+${escape_html(therapist.therapist_services.length - 3)} más</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div class="flex items-center justify-between pt-4 border-t border-gray-100"><div><p class="text-xs text-gray-500">Desde</p> <p class="text-lg font-semibold text-primary-600">${escape_html(formatPrice(getMinPrice(therapist)))}</p></div> <span class="text-primary-600 font-medium text-sm group-hover:underline">Ver perfil →</span></div></a>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="text-center py-12"><div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div> <h3 class="text-lg font-medium text-gray-900 mb-2">No encontramos terapeutas</h3> <p class="text-gray-500 mb-6">Intenta ajustar los filtros o busca en otra categoría</p> <button type="button" class="btn-primary-gradient">Limpiar filtros</button></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
