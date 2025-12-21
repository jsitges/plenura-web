import { h as head, a as attr_class, s as stringify, c as attr } from "../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let savingUser = false;
    let savingTherapist = false;
    let savingCerts = false;
    let fullName = data.userProfile?.full_name ?? "";
    let phone = data.userProfile?.phone ?? "";
    let bio = data.therapistProfile?.bio ?? "";
    let yearsOfExperience = data.therapistProfile?.years_of_experience ?? 0;
    let serviceRadiusKm = data.therapistProfile?.service_radius_km ?? 15;
    let certifications = () => {
      const certs = data.therapistProfile?.certification_details;
      if (Array.isArray(certs)) {
        return certs.join(", ");
      }
      return "";
    };
    head("ji58za", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Mi Perfil - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6"><div><h1 class="text-2xl font-bold text-gray-900">Mi Perfil</h1> <p class="text-gray-500">Actualiza tu información personal y profesional</p></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.therapistProfile?.vetting_status !== "approved") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr_class(`rounded-xl p-4 ${stringify(data.therapistProfile?.vetting_status === "pending" ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200")}`)}><div class="flex items-start gap-3">`);
      if (data.therapistProfile?.vetting_status === "pending") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<svg class="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <div><p class="font-medium text-amber-800">Verificación en proceso</p> <p class="text-sm text-amber-600">Tu perfil está siendo revisado. Te notificaremos cuando sea aprobado.</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<svg class="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> <div><p class="font-medium text-red-800">Verificación rechazada</p> <p class="text-sm text-red-600">Por favor, contacta a soporte para más información.</p></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <form method="POST" action="?/updateUser" class="bg-white rounded-xl border border-gray-100"><div class="p-4 border-b border-gray-100"><h2 class="font-semibold text-gray-900">Datos Personales</h2></div> <div class="p-4 space-y-4"><div><label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label> <input type="text" id="full_name" name="full_name"${attr("value", fullName)} required class="input-wellness" placeholder="Tu nombre completo"/></div> <div><label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label> <input type="email" id="email"${attr("value", data.userProfile?.email ?? "")} disabled class="input-wellness bg-gray-50 text-gray-500"/> <p class="text-xs text-gray-500 mt-1">El email no puede ser modificado</p></div> <div><label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label> <input type="tel" id="phone" name="phone"${attr("value", phone)} class="input-wellness" placeholder="+52 55 1234 5678"/></div></div> <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end"><button type="submit"${attr("disabled", savingUser, true)} class="btn-primary-gradient px-6 py-2 disabled:opacity-50">${escape_html("Guardar")}</button></div></form> <form method="POST" action="?/updateTherapist" class="bg-white rounded-xl border border-gray-100"><div class="p-4 border-b border-gray-100"><h2 class="font-semibold text-gray-900">Perfil Profesional</h2></div> <div class="p-4 space-y-4"><div><label for="bio" class="block text-sm font-medium text-gray-700 mb-1">Biografía / Descripción</label> <textarea id="bio" name="bio" rows="4" class="input-wellness resize-none" placeholder="Cuéntanos sobre ti, tu experiencia y enfoque...">`);
    const $$body = escape_html(bio);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea> <p class="text-xs text-gray-500 mt-1">Esta descripción será visible en tu perfil público</p></div> <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label for="years_of_experience" class="block text-sm font-medium text-gray-700 mb-1">Años de experiencia</label> <input type="number" id="years_of_experience" name="years_of_experience"${attr("value", yearsOfExperience)} min="0" max="50" class="input-wellness"/></div> <div><label for="service_radius_km" class="block text-sm font-medium text-gray-700 mb-1">Radio de servicio (km)</label> <input type="number" id="service_radius_km" name="service_radius_km"${attr("value", serviceRadiusKm)} min="1" max="100" class="input-wellness"/> <p class="text-xs text-gray-500 mt-1">Distancia máxima para atención a domicilio</p></div></div></div> <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end"><button type="submit"${attr("disabled", savingTherapist, true)} class="btn-primary-gradient px-6 py-2 disabled:opacity-50">${escape_html("Guardar")}</button></div></form> <form method="POST" action="?/updateCertifications" class="bg-white rounded-xl border border-gray-100"><div class="p-4 border-b border-gray-100"><h2 class="font-semibold text-gray-900">Certificaciones</h2></div> <div class="p-4 space-y-4"><div><label for="certifications" class="block text-sm font-medium text-gray-700 mb-1">Tus certificaciones</label> <textarea id="certifications" name="certifications" rows="3" class="input-wellness resize-none" placeholder="Ej: Masaje Sueco, Reflexología, Aromaterapia...">`);
    const $$body_1 = escape_html(certifications());
    if ($$body_1) {
      $$renderer2.push(`${$$body_1}`);
    }
    $$renderer2.push(`</textarea> <p class="text-xs text-gray-500 mt-1">Separa cada certificación con una coma</p></div></div> <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end"><button type="submit"${attr("disabled", savingCerts, true)} class="btn-primary-gradient px-6 py-2 disabled:opacity-50">${escape_html("Guardar")}</button></div></form> <div class="bg-white rounded-xl border border-gray-100 p-4"><h2 class="font-semibold text-gray-900 mb-4">Estadísticas</h2> <div class="grid grid-cols-2 sm:grid-cols-4 gap-4"><div class="text-center p-3 bg-gray-50 rounded-lg"><p class="text-2xl font-bold text-primary-600">${escape_html(data.therapistProfile?.rating_avg?.toFixed(1) ?? "0.0")}</p> <p class="text-sm text-gray-500">Calificación</p></div> <div class="text-center p-3 bg-gray-50 rounded-lg"><p class="text-2xl font-bold text-primary-600">${escape_html(data.therapistProfile?.rating_count ?? 0)}</p> <p class="text-sm text-gray-500">Reseñas</p></div> <div class="text-center p-3 bg-gray-50 rounded-lg"><p class="text-2xl font-bold text-primary-600 capitalize">${escape_html(data.therapistProfile?.subscription_tier ?? "free")}</p> <p class="text-sm text-gray-500">Plan</p></div> <div class="text-center p-3 bg-gray-50 rounded-lg"><p class="text-2xl font-bold text-primary-600">${escape_html(data.therapistProfile?.years_of_experience ?? 0)}</p> <p class="text-sm text-gray-500">Años exp.</p></div></div></div> <div class="bg-white rounded-xl border border-red-200"><div class="p-4 border-b border-red-100"><h2 class="font-semibold text-red-700">Zona de Peligro</h2></div> <div class="p-4"><div class="flex items-center justify-between"><div><p class="font-medium text-gray-900">Pausar mi cuenta</p> <p class="text-sm text-gray-500">Temporalmente oculta tu perfil de la búsqueda de clientes</p></div> <button type="button" class="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors">Pausar</button></div></div></div></div>`);
  });
}
export {
  _page as default
};
