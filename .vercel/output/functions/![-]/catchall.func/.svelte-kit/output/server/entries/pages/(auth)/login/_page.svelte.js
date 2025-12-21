import { h as head, c as attr } from "../../../../chunks/index2.js";
import { c as createClient } from "../../../../chunks/client.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let password = "";
    let loading = false;
    createClient();
    head("8k30lk", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Iniciar Sesión - Plenura</title>`);
      });
    });
    $$renderer2.push(`<div><h1 class="text-2xl font-bold text-gray-900 text-center mb-2">Bienvenido de vuelta</h1> <p class="text-gray-500 text-center mb-8">Ingresa a tu cuenta para continuar</p> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <form class="space-y-5"><div><label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label> <input type="email" id="email"${attr("value", email)} required placeholder="tu@email.com" class="input-wellness"${attr("disabled", loading, true)}/></div> <div><div class="flex items-center justify-between mb-1.5"><label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label> <a href="/forgot-password" class="text-sm text-primary-600 hover:text-primary-700">¿Olvidaste tu contraseña?</a></div> <div class="relative"><input${attr("type", "password")} id="password"${attr("value", password)} required placeholder="••••••••" class="input-wellness pr-10"${attr("disabled", loading, true)}/> <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></button></div></div> <button type="submit"${attr("disabled", loading, true)} class="w-full btn-primary-gradient py-3 disabled:opacity-50 disabled:cursor-not-allowed">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`Iniciar Sesión`);
    }
    $$renderer2.push(`<!--]--></button></form> <div class="relative my-6"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div> <div class="relative flex justify-center text-sm"><span class="px-4 bg-white text-gray-500">o continúa con</span></div></div> <button type="button" class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg> <span class="text-gray-700 font-medium">Google</span></button> <p class="text-center text-sm text-gray-500 mt-8">¿No tienes cuenta? <a href="/register" class="text-primary-600 hover:text-primary-700 font-medium">Regístrate gratis</a></p></div>`);
  });
}
export {
  _page as default
};
