import { h as head, a as attr_class, c as attr } from "../../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../../chunks/exports.js";
import "../../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const booking = data.booking;
    let paying = false;
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
    function formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    function formatPrice(price) {
      return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(price);
    }
    function getStatusInfo(status) {
      switch (status) {
        case "pending":
          return {
            icon: "clock",
            color: "amber",
            title: "Reserva Pendiente de Pago",
            message: "Realiza el pago para confirmar tu cita"
          };
        case "confirmed":
          return {
            icon: "check",
            color: "green",
            title: "¡Cita Confirmada!",
            message: "Tu pago fue procesado. El terapeuta te espera"
          };
        default:
          return {
            icon: "check",
            color: "green",
            title: "¡Reserva Creada!",
            message: "Tu cita ha sido agendada exitosamente"
          };
      }
    }
    const statusInfo = getStatusInfo(booking.status);
    head("tiv5hv", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Reserva - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-lg mx-auto text-center space-y-6"><div${attr_class("w-20 h-20 rounded-full flex items-center justify-center mx-auto", void 0, {
      "bg-green-100": statusInfo.color === "green",
      "bg-amber-100": statusInfo.color === "amber"
    })}>`);
    if (statusInfo.icon === "check") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg${attr_class("w-10 h-10", void 0, { "text-green-600": statusInfo.color === "green" })} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg${attr_class("w-10 h-10", void 0, { "text-amber-600": statusInfo.color === "amber" })} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></div> <div><h1 class="text-2xl font-bold text-gray-900 mb-2">${escape_html(statusInfo.title)}</h1> <p class="text-gray-600">${escape_html(statusInfo.message)}</p></div> `);
    if (form?.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">${escape_html(form.error)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.success && form?.message) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">${escape_html(form.message)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bg-white rounded-xl border border-gray-100 p-6 text-left"><div class="flex items-center gap-4 mb-6"><div class="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">`);
    if (booking.therapists?.users?.avatar_url) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<img${attr("src", booking.therapists.users.avatar_url)} alt="" class="w-full h-full rounded-xl object-cover"/>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<span class="text-xl text-primary-600">${escape_html((booking.therapists?.users?.full_name ?? "?")[0].toUpperCase())}</span>`);
    }
    $$renderer2.push(`<!--]--></div> <div><h3 class="font-semibold text-gray-900">${escape_html(booking.therapists?.users?.full_name)}</h3> <p class="text-gray-600">${escape_html(booking.therapist_services?.services?.name)}</p></div></div> <div class="space-y-3"><div class="flex items-center gap-3"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> <span class="text-gray-700">${escape_html(formatDate(booking.scheduled_at))}</span></div> <div class="flex items-center gap-3"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <span class="text-gray-700">${escape_html(formatTime(booking.scheduled_at))} - ${escape_html(formatTime(booking.scheduled_end_at))}</span></div> <div class="flex items-center gap-3"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> <span class="text-gray-700">${escape_html(booking.client_address)}</span></div></div> <hr class="my-4"/> <div class="flex justify-between items-center"><span class="font-semibold text-gray-900">Total</span> <span class="text-xl font-bold text-primary-600">${escape_html(formatPrice(booking.price_cents / 100))}</span></div> `);
    if (booking.status === "pending") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<form method="POST" action="?/pay" class="mt-4"><button type="submit"${attr("disabled", paying, true)} class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> Pagar ahora`);
      }
      $$renderer2.push(`<!--]--></button></form> <p class="mt-3 text-xs text-gray-500 text-center">Tu pago estará protegido en escrow hasta que el servicio se complete</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (booking.status === "confirmed") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3"><svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> <span>Pago en escrow - se liberará al completar el servicio</span></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <div class="flex flex-col sm:flex-row gap-3"><a href="/bookings" class="flex-1 btn-primary-gradient py-3 text-center">Ver mis citas</a> <a href="/therapists" class="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center">Buscar más</a></div> <div class="bg-gray-50 rounded-xl p-6 text-left"><h3 class="font-semibold text-gray-900 mb-3">¿Qué sigue?</h3> <ol class="space-y-3 text-sm text-gray-600">`);
    if (booking.status === "pending") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<li class="flex items-start gap-3"><span class="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span> <span>Realiza el pago para confirmar tu cita</span></li> <li class="flex items-start gap-3"><span class="w-6 h-6 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span> <span>Tu pago quedará protegido en escrow</span></li> <li class="flex items-start gap-3"><span class="w-6 h-6 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span> <span>El terapeuta llegará a tu ubicación en la fecha acordada</span></li>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<li class="flex items-start gap-3"><span class="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center flex-shrink-0"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></span> <span>Pago confirmado y protegido</span></li> <li class="flex items-start gap-3"><span class="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span> <span>El terapeuta llegará a tu ubicación en la fecha acordada</span></li> <li class="flex items-start gap-3"><span class="w-6 h-6 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span> <span>Al completar el servicio, el pago se liberará al terapeuta</span></li>`);
    }
    $$renderer2.push(`<!--]--></ol></div></div>`);
  });
}
export {
  _page as default
};
