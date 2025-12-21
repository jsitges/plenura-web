import { h as head, c as attr, s as stringify, e as ensure_array_like, a as attr_class } from "../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let selectedSlot = null;
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = /* @__PURE__ */ new Date();
      date.setDate(date.getDate() + i + 1);
      return date.toISOString().split("T")[0];
    });
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-MX", { weekday: "short", month: "short", day: "numeric" });
    }
    function formatTime(isoString) {
      const date = new Date(isoString);
      return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    function formatPrice(price) {
      return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(price);
    }
    head("1vr3nw0", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Nueva Reserva - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-2xl mx-auto space-y-6"><a${attr("href", `/therapists/${stringify(data.therapist.id)}`)} class="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"><svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Volver al perfil</a> <h1 class="text-2xl font-bold text-gray-900">Nueva Reserva</h1> <div class="bg-white rounded-xl border border-gray-100 p-6"><div class="flex items-center gap-4"><div class="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">`);
    if (data.therapist.users?.avatar_url) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<img${attr("src", data.therapist.users.avatar_url)} alt="" class="w-full h-full rounded-xl object-cover"/>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<span class="text-xl text-primary-600">${escape_html((data.therapist.users?.full_name ?? "?")[0].toUpperCase())}</span>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="flex-1"><h3 class="font-semibold text-gray-900">${escape_html(data.therapist.users?.full_name)}</h3> <p class="text-gray-600">${escape_html(data.service.services?.name)}</p> <p class="text-sm text-gray-500">${escape_html(data.service.duration_minutes)} minutos</p></div> <div class="text-right"><p class="text-lg font-bold text-primary-600">${escape_html(formatPrice(data.service.price_cents / 100))}</p></div></div></div> <div class="bg-white rounded-xl border border-gray-100 p-6"><h2 class="font-semibold text-gray-900 mb-4">Selecciona una fecha</h2> <div class="flex gap-2 overflow-x-auto pb-2"><!--[-->`);
    const each_array = ensure_array_like(dates);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let date = each_array[$$index];
      $$renderer2.push(`<button type="button"${attr_class(`flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all text-center min-w-[90px] ${stringify(data.selectedDate === date ? "border-primary-500 bg-primary-50" : "border-gray-100 hover:border-gray-200")}`)}><p class="text-xs text-gray-500 uppercase">${escape_html(formatDate(date).split(" ")[0])}</p> <p class="font-semibold text-gray-900">${escape_html(formatDate(date).split(" ").slice(1).join(" "))}</p></button>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="bg-white rounded-xl border border-gray-100 p-6"><h2 class="font-semibold text-gray-900 mb-4">Horarios disponibles</h2> `);
    if (data.availableSlots.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="grid grid-cols-3 sm:grid-cols-4 gap-2"><!--[-->`);
      const each_array_1 = ensure_array_like(data.availableSlots);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let slot = each_array_1[$$index_1];
        $$renderer2.push(`<button type="button"${attr_class(`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${stringify(selectedSlot === slot ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-100 hover:border-gray-200 text-gray-700")}`)}>${escape_html(formatTime(slot))}</button>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="text-center py-8"><div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <p class="text-gray-500">No hay horarios disponibles para esta fecha</p> <p class="text-sm text-gray-400 mt-1">Prueba con otro día</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
