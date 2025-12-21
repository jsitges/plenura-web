import { h as head, a as attr_class, e as ensure_array_like, s as stringify } from "../../../../../chunks/index2.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const { summary, recentEarnings, subscriptionTier } = data;
    const commissionRates = { free: 10, pro: 5, business: 3, enterprise: 0 };
    const currentCommission = commissionRates[subscriptionTier] ?? 10;
    function formatPrice(cents) {
      return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(cents / 100);
    }
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" });
    }
    function getStatusLabel(status) {
      return status === "completed" ? "Pagado" : "Pendiente";
    }
    function getStatusColor(status) {
      return status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700";
    }
    const growth = summary.lastMonthEarningsCents > 0 ? Math.round((summary.thisMonthEarningsCents - summary.lastMonthEarningsCents) / summary.lastMonthEarningsCents * 100) : summary.thisMonthEarningsCents > 0 ? 100 : 0;
    head("3jg67s", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Mis Ganancias - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6"><div class="flex items-center justify-between"><h1 class="text-2xl font-bold text-gray-900">Mis Ganancias</h1> <a href="/therapist/subscription" class="text-sm text-primary-600 hover:text-primary-700 font-medium">Plan ${escape_html(subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1))} (${escape_html(currentCommission)}%
			comisión)</a></div> <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="bg-white rounded-xl border border-gray-100 p-6"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <span class="text-sm text-gray-600">Total Ganado</span></div> <p class="text-2xl font-bold text-gray-900">${escape_html(formatPrice(summary.totalEarningsCents))}</p> <p class="text-sm text-gray-500 mt-1">${escape_html(summary.completedBookings)} servicios completados</p></div> <div class="bg-white rounded-xl border border-gray-100 p-6"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div> <span class="text-sm text-gray-600">Este Mes</span></div> <p class="text-2xl font-bold text-gray-900">${escape_html(formatPrice(summary.thisMonthEarningsCents))}</p> `);
    if (growth !== 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p${attr_class(`text-sm mt-1 ${stringify(growth >= 0 ? "text-green-600" : "text-red-600")}`)}>${escape_html(growth >= 0 ? "+" : "")}${escape_html(growth)}% vs mes anterior</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<p class="text-sm text-gray-500 mt-1">Sin cambios</p>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="bg-white rounded-xl border border-gray-100 p-6"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <span class="text-sm text-gray-600">En Escrow</span></div> <p class="text-2xl font-bold text-gray-900">${escape_html(formatPrice(summary.pendingPayoutCents))}</p> <p class="text-sm text-gray-500 mt-1">Pendiente de completar</p></div> <div class="bg-white rounded-xl border border-gray-100 p-6"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div> <span class="text-sm text-gray-600">Tu Comisión</span></div> <p class="text-2xl font-bold text-gray-900">${escape_html(currentCommission)}%</p> `);
    if (subscriptionTier !== "enterprise") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<a href="/therapist/subscription" class="text-sm text-primary-600 hover:underline mt-1 block">Reduce tu comisión</a>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<p class="text-sm text-green-600 mt-1">Mejor tarifa disponible</p>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="bg-white rounded-xl border border-gray-100"><div class="p-6 border-b border-gray-100"><h2 class="text-lg font-semibold text-gray-900">Historial de Ganancias</h2></div> `);
    if (recentEarnings.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="divide-y divide-gray-100"><!--[-->`);
      const each_array = ensure_array_like(recentEarnings);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let earning = each_array[$$index];
        $$renderer2.push(`<div class="p-4 sm:p-6 flex items-center justify-between gap-4"><div class="flex-1 min-w-0"><div class="flex items-center gap-3"><p class="font-medium text-gray-900 truncate">${escape_html(earning.client?.full_name ?? "Cliente")}</p> <span${attr_class(`px-2 py-0.5 rounded-full text-xs font-medium ${stringify(getStatusColor(earning.status))}`)}>${escape_html(getStatusLabel(earning.status))}</span></div> <p class="text-sm text-gray-600 mt-0.5">${escape_html(earning.service?.name ?? "Servicio")} - ${escape_html(formatDate(earning.scheduled_at))}</p></div> <div class="text-right"><p class="font-semibold text-gray-900">${escape_html(formatPrice(earning.therapist_payout_cents))}</p> `);
        if (earning.commission_cents > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="text-xs text-gray-500">-${escape_html(formatPrice(earning.commission_cents))} comisión</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="p-12 text-center"><div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <h3 class="text-lg font-medium text-gray-900 mb-2">Sin ganancias aún</h3> <p class="text-gray-500">Completa servicios para ver tus ganancias aquí</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6"><h3 class="font-semibold text-gray-900 mb-3">Cómo funcionan las comisiones</h3> <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm"><div class="bg-white/60 rounded-lg p-3"><p class="font-medium text-gray-900">Free</p> <p class="text-gray-600">10% comisión</p></div> <div class="bg-white/60 rounded-lg p-3"><p class="font-medium text-gray-900">Pro - $299/mes</p> <p class="text-gray-600">5% comisión</p></div> <div class="bg-white/60 rounded-lg p-3"><p class="font-medium text-gray-900">Business - $699/mes</p> <p class="text-gray-600">3% comisión</p></div> <div class="bg-white/60 rounded-lg p-3"><p class="font-medium text-gray-900">Enterprise - $1,299/mes</p> <p class="text-gray-600">0% comisión</p></div></div> <a href="/therapist/subscription" class="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">Mejorar mi plan →</a></div></div>`);
  });
}
export {
  _page as default
};
