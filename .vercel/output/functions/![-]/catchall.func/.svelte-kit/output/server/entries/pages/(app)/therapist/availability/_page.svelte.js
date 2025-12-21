import { h as head, a as attr_class, e as ensure_array_like, c as attr, s as stringify } from "../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const dayNames = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado"
    ];
    let schedule = dayNames.map((_, index) => {
      const existing = data.availability.find((a) => a.day_of_week === index);
      return {
        active: !!existing,
        start: existing?.start_time ?? "09:00",
        end: existing?.end_time ?? "18:00"
      };
    });
    let isAvailable = data.isAvailable;
    let saving = false;
    const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
      const hour = Math.floor(i / 2);
      const minute = i % 2 * 30;
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    });
    head("1br3n9w", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Disponibilidad - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold text-gray-900">Disponibilidad</h1> <p class="text-gray-500">Configura tu horario de atención</p></div> <form method="POST" action="?/toggleAvailable"><button type="submit"${attr_class(`flex items-center gap-3 px-4 py-2 rounded-lg border ${stringify(isAvailable ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200")}`)}><span${attr_class(`w-3 h-3 rounded-full ${stringify(isAvailable ? "bg-green-500" : "bg-gray-400")}`)}></span> <span${attr_class(`font-medium ${stringify(isAvailable ? "text-green-700" : "text-gray-600")}`)}>${escape_html(isAvailable ? "Disponible" : "No disponible")}</span></button></form></div> `);
    if (!isAvailable) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-amber-50 border border-amber-200 rounded-xl p-4"><div class="flex items-start gap-3"><svg class="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> <div><p class="font-medium text-amber-800">No estás visible para los clientes</p> <p class="text-sm text-amber-600">Activa tu disponibilidad para que los clientes puedan reservar contigo</p></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <form method="POST" action="?/save" class="bg-white rounded-xl border border-gray-100"><div class="p-4 border-b border-gray-100"><h2 class="font-semibold text-gray-900">Horario Semanal</h2> <p class="text-sm text-gray-500">Define los días y horarios en los que estás disponible</p></div> <div class="divide-y divide-gray-100"><!--[-->`);
    const each_array = ensure_array_like(dayNames);
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let day = each_array[index];
      $$renderer2.push(`<div class="p-4 flex flex-col sm:flex-row sm:items-center gap-4"><div class="flex items-center gap-3 sm:w-40"><input type="checkbox"${attr("name", `day_${stringify(index)}_active`)}${attr("checked", schedule[index].active, true)} class="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/> <span class="font-medium text-gray-700">${escape_html(day)}</span></div> `);
      if (schedule[index].active) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center gap-3 flex-1">`);
        $$renderer2.select(
          {
            name: `day_${stringify(index)}_start`,
            value: schedule[index].start,
            class: "input-wellness py-2"
          },
          ($$renderer3) => {
            $$renderer3.push(`<!--[-->`);
            const each_array_1 = ensure_array_like(timeSlots);
            for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
              let time = each_array_1[$$index];
              $$renderer3.option({ value: time }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(time)}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
        $$renderer2.push(` <span class="text-gray-500">a</span> `);
        $$renderer2.select(
          {
            name: `day_${stringify(index)}_end`,
            value: schedule[index].end,
            class: "input-wellness py-2"
          },
          ($$renderer3) => {
            $$renderer3.push(`<!--[-->`);
            const each_array_2 = ensure_array_like(timeSlots);
            for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
              let time = each_array_2[$$index_1];
              $$renderer3.option({ value: time }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(time)}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
        $$renderer2.push(`</div> <div class="flex items-center gap-2"><button type="button" class="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap">Copiar a L-V</button> <span class="text-gray-300">|</span> <button type="button" class="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap">Copiar a todos</button></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="text-sm text-gray-400 italic">No disponible</span>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end"><button type="submit"${attr("disabled", saving, true)} class="btn-primary-gradient px-6 py-2 disabled:opacity-50">${escape_html("Guardar cambios")}</button></div></form> <div class="bg-blue-50 border border-blue-200 rounded-xl p-4"><h3 class="font-medium text-blue-800 mb-2">Consejos</h3> <ul class="text-sm text-blue-700 space-y-1"><li>• Los clientes solo pueden reservar dentro de tu horario disponible</li> <li>• Deja tiempo entre citas para desplazamiento</li> <li>• Puedes bloquear días específicos desde tu calendario</li></ul></div></div>`);
  });
}
export {
  _page as default
};
