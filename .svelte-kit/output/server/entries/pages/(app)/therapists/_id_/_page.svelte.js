import { h as head, c as attr, e as ensure_array_like, a as attr_class, s as stringify } from "../../../../../chunks/index2.js";
import { c as createClient } from "../../../../../chunks/client.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    createClient();
    const therapist = data.therapist;
    const dayNames = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado"
    ];
    let selectedService = null;
    let isFavorite = data.isFavorite;
    let favoriteLoading = false;
    function formatPrice(price) {
      return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(price);
    }
    function formatTime(time) {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
    }
    const activeServices = therapist.therapist_services?.filter((ts) => ts.is_active) ?? [];
    head("1xl9819", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(therapist.users?.full_name ?? "Terapeuta")} - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-4xl mx-auto space-y-8"><a href="/therapists" class="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"><svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Volver a búsqueda</a> <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"><div class="bg-gradient-to-r from-primary-500 to-primary-600 h-32"></div> <div class="px-6 pb-6"><div class="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12"><div class="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">`);
    if (therapist.users?.avatar_url) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<img${attr("src", therapist.users.avatar_url)}${attr("alt", therapist.users.full_name ?? "")} class="w-full h-full object-cover"/>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="w-full h-full bg-primary-100 flex items-center justify-center"><span class="text-3xl text-primary-600">${escape_html((therapist.users?.full_name ?? "?")[0].toUpperCase())}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="flex-1"><div class="flex items-start justify-between"><div><h1 class="text-2xl font-bold text-gray-900">${escape_html(therapist.users?.full_name ?? "Terapeuta")}</h1> <div class="flex items-center gap-4 mt-1"><div class="flex items-center gap-1"><span class="text-yellow-500 text-lg">★</span> <span class="font-semibold">${escape_html(therapist.rating_avg.toFixed(1))}</span> <span class="text-gray-400">(${escape_html(therapist.rating_count)} reseñas)</span></div> `);
    if (therapist.years_of_experience) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-gray-400">•</span> <span class="text-gray-600">${escape_html(therapist.years_of_experience)} años exp.</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div> <button type="button"${attr("disabled", favoriteLoading, true)} class="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"${attr("aria-label", isFavorite ? "Quitar de favoritos" : "Agregar a favoritos")}>`);
    if (isFavorite) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></button></div></div></div></div></div> <div class="grid lg:grid-cols-3 gap-8"><div class="lg:col-span-2 space-y-6">`);
    if (therapist.bio) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-white rounded-xl border border-gray-100 p-6"><h2 class="text-lg font-semibold text-gray-900 mb-3">Acerca de mí</h2> <p class="text-gray-600 whitespace-pre-line">${escape_html(therapist.bio)}</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bg-white rounded-xl border border-gray-100 p-6"><h2 class="text-lg font-semibold text-gray-900 mb-4">Servicios</h2> <div class="space-y-3"><!--[-->`);
    const each_array = ensure_array_like(activeServices);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let ts = each_array[$$index];
      $$renderer2.push(`<button type="button"${attr_class(`w-full text-left p-4 rounded-xl border-2 transition-all ${stringify(selectedService === ts.id ? "border-primary-500 bg-primary-50" : "border-gray-100 hover:border-gray-200")}`)}><div class="flex items-center justify-between"><div><h3 class="font-medium text-gray-900">${escape_html(ts.services?.name)}</h3> `);
      if (ts.services?.description) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="text-sm text-gray-500 mt-1">${escape_html(ts.services.description)}</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <p class="text-sm text-gray-400 mt-1">${escape_html(ts.duration_minutes)} minutos</p></div> <div class="text-right"><p class="text-lg font-semibold text-primary-600">${escape_html(formatPrice(ts.price_cents / 100))}</p></div></div></button>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (activeServices.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-gray-500 text-center py-4">No hay servicios disponibles actualmente</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (data.availability.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-white rounded-xl border border-gray-100 p-6"><h2 class="text-lg font-semibold text-gray-900 mb-4">Horario</h2> <div class="space-y-2"><!--[-->`);
      const each_array_1 = ensure_array_like(data.availability);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let slot = each_array_1[$$index_1];
        $$renderer2.push(`<div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><span class="font-medium text-gray-700">${escape_html(dayNames[slot.day_of_week])}</span> <span class="text-gray-600">${escape_html(formatTime(slot.start_time))} - ${escape_html(formatTime(slot.end_time))}</span></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bg-white rounded-xl border border-gray-100 p-6"><h2 class="text-lg font-semibold text-gray-900 mb-4">Reseñas (${escape_html(data.reviews.length)})</h2> `);
    if (data.reviews.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="space-y-4"><!--[-->`);
      const each_array_2 = ensure_array_like(data.reviews);
      for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
        let review = each_array_2[$$index_3];
        $$renderer2.push(`<div class="border-b border-gray-100 last:border-0 pb-4 last:pb-0"><div class="flex items-start gap-3"><div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">`);
        if (review.users?.avatar_url) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<img${attr("src", review.users.avatar_url)} alt="" class="w-full h-full rounded-full object-cover"/>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<span class="text-gray-500 text-sm">${escape_html((review.users?.full_name ?? "?")[0].toUpperCase())}</span>`);
        }
        $$renderer2.push(`<!--]--></div> <div class="flex-1"><div class="flex items-center justify-between"><span class="font-medium text-gray-900">${escape_html(review.users?.full_name ?? "Usuario")}</span> <span class="text-sm text-gray-400">${escape_html(formatDate(review.created_at))}</span></div> <div class="flex items-center gap-0.5 my-1"><!--[-->`);
        const each_array_3 = ensure_array_like(Array(5));
        for (let i = 0, $$length2 = each_array_3.length; i < $$length2; i++) {
          each_array_3[i];
          $$renderer2.push(`<svg${attr_class(`w-4 h-4 ${stringify(i < review.rating ? "text-yellow-400" : "text-gray-200")}`)} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`);
        }
        $$renderer2.push(`<!--]--></div> `);
        if (review.comment) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="text-gray-600 text-sm">${escape_html(review.comment)}</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (review.therapist_response) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-3 bg-gray-50 rounded-lg p-3"><p class="text-sm text-gray-500 font-medium mb-1">Respuesta del terapeuta:</p> <p class="text-sm text-gray-600">${escape_html(review.therapist_response)}</p></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<p class="text-gray-500 text-center py-4">Aún no hay reseñas para este terapeuta</p>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="lg:col-span-1"><div class="bg-white rounded-xl border border-gray-100 p-6 sticky top-24"><h3 class="font-semibold text-gray-900 mb-4">Reservar cita</h3> `);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<p class="text-gray-500 text-sm mb-4">Selecciona un servicio para continuar</p> <button type="button" disabled class="w-full py-3 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">Seleccionar fecha</button>`);
    }
    $$renderer2.push(`<!--]--> <div class="mt-6 pt-6 border-t border-gray-100"><div class="flex items-center gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> <span>Terapeuta verificado</span></div> <div class="flex items-center gap-3 text-sm text-gray-600 mt-2"><svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> <span>Pago seguro</span></div> <div class="flex items-center gap-3 text-sm text-gray-600 mt-2"><svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> <span>Cancelación flexible</span></div></div></div></div></div></div>`);
  });
}
export {
  _page as default
};
