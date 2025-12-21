import { redirect } from "@sveltejs/kit";
const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      throw redirect(303, next);
    }
  }
  throw redirect(303, "/login?error=auth_callback_error");
};
export {
  GET
};
