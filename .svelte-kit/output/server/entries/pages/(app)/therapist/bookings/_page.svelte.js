import { h as head, e as ensure_array_like, c as attr, a as attr_class, s as stringify } from "../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const filters = [
      { id: "pending", label: "Pendientes" },
      { id: "upcoming", label: "Próximas" },
      { id: "past", label: "Completadas" },
      { id: "cancelled", label: "Canceladas" }
    ];
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("es-MX", { weekday: "long", month: "long", day: "numeric" });
    }
    function formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    function formatPrice(cents) {
      return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(cents / 100);
    }
    function getStatusColor(status) {
      const colors = {
        pending: "bg-amber-100 text-amber-700",
        confirmed: "bg-green-100 text-green-700",
        completed: "bg-blue-100 text-blue-700",
        cancelled: "bg-red-100 text-red-700",
        no_show: "bg-gray-100 text-gray-700"
      };
      return colors[status] ?? "bg-gray-100 text-gray-700";
    }
    function getStatusLabel(status) {
      const labels = {
        pending: "Pendiente",
        confirmed: "Confirmada",
        completed: "Completada",
        cancelled: "Cancelada",
        no_show: "No asistió"
      };
      return labels[status] ?? status;
    }
    function isPast(dateString) {
      return new Date(dateString) < /* @__PURE__ */ new Date();
    }
    head("1rz17tl", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Mis Citas - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6"><div><h1 class="text-2xl font-bold text-gray-900">Mis Citas</h1> <p class="text-gray-500">Gestiona las reservas de tus clientes</p></div> <div class="flex gap-2 border-b border-gray-200 overflow-x-auto"><!--[-->`);
    const each_array = ensure_array_like(filters);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let filter = each_array[$$index];
      $$renderer2.push(`<a${attr("href", `/therapist/bookings?filter=${stringify(filter.id)}`)}${attr_class(`px-4 py-2 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${stringify(data.filter === filter.id ? "text-primary-600 border-primary-600" : "text-gray-500 border-transparent hover:text-gray-700")}`)}>${escape_html(filter.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.bookings.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="space-y-4"><!--[-->`);
      const each_array_1 = ensure_array_like(data.bookings);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let booking = each_array_1[$$index_1];
        const b = booking;
        $$renderer2.push(`<div class="bg-white rounded-xl border border-gray-100 p-6"><div class="flex flex-col lg:flex-row lg:items-start gap-4"><div class="flex items-start gap-4 flex-1"><div class="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">`);
        if (b.users?.avatar_url) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<img${attr("src", b.users.avatar_url)} alt="" class="w-full h-full rounded-xl object-cover"/>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<span class="text-xl text-gray-600 font-medium">${escape_html((b.users?.full_name ?? "?")[0].toUpperCase())}</span>`);
        }
        $$renderer2.push(`<!--]--></div> <div class="flex-1 min-w-0"><h3 class="font-semibold text-gray-900">${escape_html(b.users?.full_name)}</h3> <p class="text-primary-600 font-medium">${escape_html(b.therapist_services?.services?.name)}</p> <div class="mt-2 space-y-1 text-sm text-gray-600"><div class="flex items-center gap-2"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> <span>${escape_html(formatDate(b.scheduled_at))}</span></div> <div class="flex items-center gap-2"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <span>${escape_html(formatTime(b.scheduled_at))} - ${escape_html(formatTime(b.scheduled_end_at))}</span></div> `);
        if (b.client_address) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="flex items-start gap-2"><svg class="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> <span>${escape_html(b.client_address)}</span></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div> `);
        if (b.notes) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-3 p-3 bg-gray-50 rounded-lg"><p class="text-sm text-gray-500 font-medium mb-1">Notas del cliente:</p> <p class="text-sm text-gray-700">${escape_html(b.notes)}</p></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (b.status === "confirmed" && (b.users?.phone || b.users?.email)) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-3 flex flex-wrap gap-3">`);
          if (b.users?.phone) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<a${attr("href", `tel:${stringify(b.users.phone)}`)} class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> ${escape_html(b.users.phone)}</a>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (b.users?.email) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<a${attr("href", `mailto:${stringify(b.users.email)}`)} class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> Email</a>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div> <div class="flex flex-col items-end gap-3"><span${attr_class(`px-3 py-1 rounded-full text-sm font-medium ${stringify(getStatusColor(b.status))}`)}>${escape_html(getStatusLabel(b.status))}</span> <p class="text-xl font-bold text-gray-900">${escape_html(formatPrice(b.price_cents))}</p></div></div> `);
        if (b.status === "pending") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3"><form method="POST" action="?/confirm"><input type="hidden" name="bookingId"${attr("value", b.id)}/> <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Confirmar</button></form> <form method="POST" action="?/reject"><input type="hidden" name="bookingId"${attr("value", b.id)}/> <button type="submit" class="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">Rechazar</button></form></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (b.status === "confirmed" && isPast(b.scheduled_at)) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3"><form method="POST" action="?/complete"><input type="hidden" name="bookingId"${attr("value", b.id)}/> <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Marcar como completada</button></form> <form method="POST" action="?/noshow"><input type="hidden" name="bookingId"${attr("value", b.id)}/> <button type="submit" class="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">No asistió</button></form></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="bg-white rounded-xl border border-gray-100 p-12 text-center"><div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div> <h3 class="text-lg font-medium text-gray-900 mb-2">`);
      if (data.filter === "pending") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`No tienes citas pendientes`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (data.filter === "upcoming") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`No tienes citas próximas`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (data.filter === "past") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`No tienes citas completadas`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`No tienes citas canceladas`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></h3> <p class="text-gray-500">Las citas aparecerán aquí cuando los clientes te reserven</p></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
