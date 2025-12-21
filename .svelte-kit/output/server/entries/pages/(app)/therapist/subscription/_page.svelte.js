import { h as head, e as ensure_array_like, a as attr_class, c as attr, s as stringify } from "../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const { currentTier, expiresAt, tiers } = data;
    let upgrading = null;
    let cancelling = false;
    const tierOrder = ["free", "pro", "business", "enterprise"];
    function formatPrice(price) {
      if (price === 0) return "Gratis";
      return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(price);
    }
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
    }
    function getTierColor(tier) {
      switch (tier) {
        case "free":
          return "border-gray-200";
        case "pro":
          return "border-primary-500 ring-2 ring-primary-100";
        case "business":
          return "border-purple-500 ring-2 ring-purple-100";
        case "enterprise":
          return "border-amber-500 ring-2 ring-amber-100";
        default:
          return "border-gray-200";
      }
    }
    function isUpgrade(tier) {
      return tierOrder.indexOf(tier) > tierOrder.indexOf(currentTier);
    }
    function isDowngrade(tier) {
      return tierOrder.indexOf(tier) < tierOrder.indexOf(currentTier);
    }
    head("k28xk2", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Mi Plan - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6"><div><h1 class="text-2xl font-bold text-gray-900">Mi Plan</h1> <p class="text-gray-600 mt-1">Elige el plan que mejor se adapte a tu práctica</p></div> `);
    if (form?.success) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">${escape_html(form.message)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">${escape_html(form.error)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (currentTier !== "free") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl p-6 text-white"><div class="flex items-center justify-between"><div><p class="text-sm opacity-90">Tu plan actual</p> <h2 class="text-2xl font-bold">${escape_html(tiers[currentTier].name)}</h2> `);
      if (expiresAt) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="text-sm opacity-90 mt-1">Renueva el ${escape_html(formatDate(expiresAt))}</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="text-right"><p class="text-3xl font-bold">${escape_html(tiers[currentTier].commission)}%</p> <p class="text-sm opacity-90">comisión</p></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4"><!--[-->`);
    const each_array = ensure_array_like(Object.entries(tiers));
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let [tierId, tier] = each_array[$$index_1];
      $$renderer2.push(`<div${attr_class(`bg-white rounded-xl border-2 p-6 relative ${stringify(getTierColor(tierId))} ${stringify(currentTier === tierId ? "bg-gray-50" : "")}`)}>`);
      if (tierId === "pro") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">Popular</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (currentTier === tierId) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">Actual</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="text-center mb-6"><h3 class="text-lg font-bold text-gray-900">${escape_html(tier.name)}</h3> <div class="mt-2"><span class="text-3xl font-bold text-gray-900">${escape_html(formatPrice(tier.price))}</span> `);
      if (tier.price > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-gray-500">/mes</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <p class="mt-2 text-sm text-gray-600">${escape_html(tier.commission)}% comisión</p></div> <ul class="space-y-3 mb-6"><!--[-->`);
      const each_array_1 = ensure_array_like(tier.features);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let feature = each_array_1[$$index];
        $$renderer2.push(`<li class="flex items-start gap-2 text-sm"><svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-600">${escape_html(feature)}</span></li>`);
      }
      $$renderer2.push(`<!--]--></ul> `);
      if (currentTier === tierId) {
        $$renderer2.push("<!--[-->");
        if (tierId !== "free") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<form method="POST" action="?/cancel"><button type="submit"${attr("disabled", cancelling, true)} class="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm">${escape_html("Cancelar plan")}</button></form>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<div class="py-2 px-4 bg-gray-100 rounded-lg text-center text-gray-500 text-sm">Plan actual</div>`);
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (isUpgrade(tierId)) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<form method="POST" action="?/upgrade"><input type="hidden" name="tier"${attr("value", tierId)}/> <button type="submit"${attr("disabled", upgrading === tierId, true)} class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm">${escape_html(upgrading === tierId ? "Procesando..." : "Mejorar plan")}</button></form>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (isDowngrade(tierId)) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="py-2 px-4 bg-gray-100 rounded-lg text-center text-gray-400 text-sm">Plan inferior</div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="bg-gray-50 rounded-xl p-6"><h3 class="font-semibold text-gray-900 mb-4">Preguntas Frecuentes</h3> <div class="space-y-4 text-sm"><div><p class="font-medium text-gray-900">¿Puedo cambiar de plan en cualquier momento?</p> <p class="text-gray-600 mt-1">Sí, puedes mejorar tu plan en cualquier momento. Los cambios se aplican inmediatamente.</p></div> <div><p class="font-medium text-gray-900">¿Qué pasa si cancelo mi suscripción?</p> <p class="text-gray-600 mt-1">Volverás al plan Free con 10% de comisión. Tus datos y clientes se mantienen.</p></div> <div><p class="font-medium text-gray-900">¿Cómo funciona la comisión?</p> <p class="text-gray-600 mt-1">La comisión se descuenta automáticamente de cada servicio completado antes de transferir
					tu pago.</p></div></div></div></div>`);
  });
}
export {
  _page as default
};
