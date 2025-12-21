import { b as store_get, h as head, a as attr_class, u as unsubscribe_stores, s as stringify } from "../../../../chunks/index2.js";
import { c as createClient } from "../../../../chunks/client.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import { p as page } from "../../../../chunks/stores.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("ref") ?? "";
    createClient();
    head("ydeots", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Crear Cuenta - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div><h1 class="text-2xl font-bold text-gray-900 text-center mb-2">Crea tu cuenta</h1> <p class="text-gray-500 text-center mb-8">Únete a la comunidad de bienestar</p> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="space-y-4"><p class="text-sm text-gray-600 text-center mb-4">¿Cómo quieres usar Plenura?</p> <button type="button"${attr_class(`w-full p-4 border-2 rounded-xl text-left transition-all hover:border-primary-500 hover:bg-primary-50 ${stringify(
        "border-primary-500 bg-primary-50"
      )}`)}><div class="flex items-start gap-4"><div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">🧘</div> <div><h3 class="font-semibold text-gray-900">Busco servicios de bienestar</h3> <p class="text-sm text-gray-500 mt-1">Encuentra terapeutas, reserva citas y cuida tu salud</p></div></div></button> <button type="button"${attr_class(`w-full p-4 border-2 rounded-xl text-left transition-all hover:border-secondary-500 hover:bg-secondary-50 ${stringify("border-gray-200")}`)}><div class="flex items-start gap-4"><div class="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center text-2xl">💆</div> <div><h3 class="font-semibold text-gray-900">Soy terapeuta o profesional</h3> <p class="text-sm text-gray-500 mt-1">Ofrece tus servicios y haz crecer tu negocio</p></div></div></button></div> <div class="relative my-6"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div> <div class="relative flex justify-center text-sm"><span class="px-4 bg-white text-gray-500">o regístrate con</span></div></div> <button type="button" class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg> <span class="text-gray-700 font-medium">Google</span></button>`);
    }
    $$renderer2.push(`<!--]--> <p class="text-center text-sm text-gray-500 mt-8">¿Ya tienes cuenta? <a href="/login" class="text-primary-600 hover:text-primary-700 font-medium">Inicia sesión</a></p></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
