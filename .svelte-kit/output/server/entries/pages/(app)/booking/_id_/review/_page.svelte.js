import { h as head, c as attr, e as ensure_array_like, a as attr_class, s as stringify } from "../../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../../chunks/exports.js";
import "../../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let rating = 5;
    let comment = "";
    let isPublic = true;
    let submitting = false;
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
    head("azmkya", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Dejar Reseña - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-lg mx-auto">`);
    if (data.existingReview) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-white rounded-xl border border-gray-100 p-6 text-center"><div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div> <h1 class="text-xl font-bold text-gray-900 mb-2">Ya dejaste tu reseña</h1> <p class="text-gray-500 mb-4">Calificaste esta cita con ${escape_html(data.existingReview.rating)} estrellas</p> `);
      if (data.existingReview.comment) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="bg-gray-50 rounded-lg p-4 text-left mb-4"><p class="text-gray-700 italic">"${escape_html(data.existingReview.comment)}"</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <a href="/bookings" class="btn-primary-gradient inline-block px-6 py-2">Ver mis citas</a></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="bg-white rounded-xl border border-gray-100 overflow-hidden"><div class="p-6 border-b border-gray-100 text-center"><h1 class="text-xl font-bold text-gray-900 mb-2">Califica tu experiencia</h1> <p class="text-gray-500">Tu opinión ayuda a otros clientes</p></div> <div class="p-4 bg-gray-50 border-b border-gray-100"><div class="flex items-center gap-4"><div class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">`);
      if (data.booking.therapists.users.avatar_url) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<img${attr("src", data.booking.therapists.users.avatar_url)}${attr("alt", data.booking.therapists.users.full_name)} class="w-full h-full rounded-full object-cover"/>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`${escape_html(data.booking.therapists.users.full_name[0].toUpperCase())}`);
      }
      $$renderer2.push(`<!--]--></div> <div><p class="font-semibold text-gray-900">${escape_html(data.booking.therapists.users.full_name)}</p> <p class="text-sm text-gray-500">${escape_html(data.booking.therapist_services.services.name_es || data.booking.therapist_services.services.name)}</p> <p class="text-xs text-gray-400">${escape_html(formatDate(data.booking.scheduled_at))}</p></div></div></div> <form method="POST" class="p-6 space-y-6"><input type="hidden" name="therapist_id"${attr("value", data.booking.therapist_id)}/> <div class="text-center"><p class="text-sm font-medium text-gray-700 mb-3">¿Cómo fue tu experiencia?</p> <div class="flex justify-center gap-2"><!--[-->`);
      const each_array = ensure_array_like([1, 2, 3, 4, 5]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let star = each_array[$$index];
        $$renderer2.push(`<button type="button" class="p-1 transition-transform hover:scale-110 focus:outline-none"><svg${attr_class(`w-10 h-10 ${stringify(rating >= star ? "text-amber-400" : "text-gray-300")} transition-colors`)} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></button>`);
      }
      $$renderer2.push(`<!--]--></div> <input type="hidden" name="rating"${attr("value", rating)}/> <p class="text-sm text-gray-500 mt-2">`);
      {
        $$renderer2.push("<!--[!-->");
        {
          $$renderer2.push("<!--[!-->");
          {
            $$renderer2.push("<!--[!-->");
            {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`Excelente`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></p></div> <div><label for="comment" class="block text-sm font-medium text-gray-700 mb-1">Cuéntanos más (opcional)</label> <textarea id="comment" name="comment" rows="4" class="input-wellness resize-none" placeholder="¿Qué te gustó? ¿Qué podría mejorar?">`);
      const $$body = escape_html(comment);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></div> <div class="flex items-start gap-3"><input type="checkbox" id="is_public" name="is_public"${attr("checked", isPublic, true)} class="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"/> <div><label for="is_public" class="font-medium text-gray-700 cursor-pointer">Hacer pública mi reseña</label> <p class="text-sm text-gray-500">Tu reseña será visible para otros clientes en el perfil del terapeuta</p></div></div> <div class="flex gap-3"><a href="/bookings" class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium">Cancelar</a> <button type="submit"${attr("disabled", submitting, true)} class="flex-1 btn-primary-gradient py-3 disabled:opacity-50 font-medium">${escape_html("Enviar reseña")}</button></div></form></div> <div class="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4"><h3 class="font-medium text-blue-800 mb-2">Consejos para una buena reseña</h3> <ul class="text-sm text-blue-700 space-y-1"><li>• Sé específico sobre lo que te gustó o no</li> <li>• Menciona aspectos como puntualidad, profesionalismo y resultados</li> <li>• Sé respetuoso y constructivo en tus comentarios</li></ul></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
