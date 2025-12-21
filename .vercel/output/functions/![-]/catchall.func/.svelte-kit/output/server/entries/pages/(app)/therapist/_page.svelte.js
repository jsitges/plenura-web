import { h as head, e as ensure_array_like, c as attr, a as attr_class, s as stringify } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    function formatPrice(cents) {
      return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(cents / 100);
    }
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("es-MX", { weekday: "short", month: "short", day: "numeric" });
    }
    function formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    function getStatusColor(status) {
      return status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
    }
    function getStatusLabel(status) {
      return status === "pending" ? "Pendiente" : "Confirmada";
    }
    data.earnings.lastMonth > 0 ? (data.earnings.thisMonth - data.earnings.lastMonth) / data.earnings.lastMonth * 100 : 0;
    head("10f1h4c", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Dashboard Terapeuta - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6"><div><h1 class="text-2xl font-bold text-gray-900">Dashboard</h1> <p class="text-gray-500">Resumen de tu actividad</p></div> `);
    if (data.stats.pending > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4"><div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0"><svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <div class="flex-1"><p class="font-medium text-amber-800">Tienes ${escape_html(data.stats.pending)} cita${escape_html(data.stats.pending > 1 ? "s" : "")} pendiente${escape_html(data.stats.pending > 1 ? "s" : "")} de confirmar</p> <p class="text-sm text-amber-600">Revisa y confirma las solicitudes de tus clientes</p></div> <a href="/therapist/bookings?filter=pending" class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Ver citas</a></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid grid-cols-2 lg:grid-cols-4 gap-4"><div class="bg-white rounded-xl border border-gray-100 p-4"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div> <div><p class="text-2xl font-bold text-gray-900">${escape_html(data.stats.today)}</p> <p class="text-sm text-gray-500">Hoy</p></div></div></div> <div class="bg-white rounded-xl border border-gray-100 p-4"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div> <div><p class="text-2xl font-bold text-gray-900">${escape_html(data.stats.week)}</p> <p class="text-sm text-gray-500">Esta semana</p></div></div></div> <div class="bg-white rounded-xl border border-gray-100 p-4"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <div><p class="text-2xl font-bold text-gray-900">${escape_html(formatPrice(data.earnings.thisMonth))}</p> <p class="text-sm text-gray-500">Este mes</p></div></div></div> <div class="bg-white rounded-xl border border-gray-100 p-4"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <div><p class="text-2xl font-bold text-gray-900">${escape_html(data.stats.pending)}</p> <p class="text-sm text-gray-500">Pendientes</p></div></div></div></div> <div class="grid lg:grid-cols-2 gap-6"><div class="bg-white rounded-xl border border-gray-100"><div class="p-4 border-b border-gray-100 flex items-center justify-between"><h2 class="font-semibold text-gray-900">Próximas Citas</h2> <a href="/therapist/bookings" class="text-sm text-primary-600 hover:text-primary-700">Ver todas</a></div> <div class="divide-y divide-gray-100">`);
    if (data.upcomingBookings.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(data.upcomingBookings);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let booking = each_array[$$index];
        const b = booking;
        $$renderer2.push(`<div class="p-4 flex items-center gap-4"><div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">`);
        if (b.users?.avatar_url) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<img${attr("src", b.users.avatar_url)} alt="" class="w-full h-full rounded-full object-cover"/>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<span class="text-gray-600 text-sm font-medium">${escape_html((b.users?.full_name ?? "?")[0].toUpperCase())}</span>`);
        }
        $$renderer2.push(`<!--]--></div> <div class="flex-1 min-w-0"><p class="font-medium text-gray-900 truncate">${escape_html(b.users?.full_name)}</p> <p class="text-sm text-gray-500">${escape_html(b.therapist_services?.services?.name)}</p> <p class="text-xs text-gray-400">${escape_html(formatDate(b.scheduled_at))} • ${escape_html(formatTime(b.scheduled_at))}</p></div> <span${attr_class(`px-2 py-1 rounded-full text-xs font-medium ${stringify(getStatusColor(b.status))}`)}>${escape_html(getStatusLabel(b.status))}</span></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="p-8 text-center"><p class="text-gray-500">No tienes citas próximas</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="bg-white rounded-xl border border-gray-100"><div class="p-4 border-b border-gray-100"><h2 class="font-semibold text-gray-900">Reseñas Recientes</h2></div> <div class="divide-y divide-gray-100">`);
    if (data.recentReviews.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(data.recentReviews);
      for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
        let review = each_array_1[$$index_2];
        const r = review;
        $$renderer2.push(`<div class="p-4"><div class="flex items-center gap-3 mb-2"><div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">`);
        if (r.users?.avatar_url) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<img${attr("src", r.users.avatar_url)} alt="" class="w-full h-full rounded-full object-cover"/>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<span class="text-gray-600 text-xs font-medium">${escape_html((r.users?.full_name ?? "?")[0].toUpperCase())}</span>`);
        }
        $$renderer2.push(`<!--]--></div> <div class="flex-1"><p class="font-medium text-gray-900 text-sm">${escape_html(r.users?.full_name)}</p> <div class="flex items-center gap-0.5"><!--[-->`);
        const each_array_2 = ensure_array_like(Array(5));
        for (let i = 0, $$length2 = each_array_2.length; i < $$length2; i++) {
          each_array_2[i];
          $$renderer2.push(`<svg${attr_class(`w-3 h-3 ${stringify(i < r.rating ? "text-yellow-400" : "text-gray-200")}`)} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`);
        }
        $$renderer2.push(`<!--]--></div></div></div> `);
        if (r.comment) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="text-sm text-gray-600 line-clamp-2">${escape_html(r.comment)}</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="p-8 text-center"><p class="text-gray-500">Aún no tienes reseñas</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
  });
}
export {
  _page as default
};
