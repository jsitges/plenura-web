import { a as createServerSupabaseClient } from "./server.js";
const handle = async ({ event, resolve }) => {
  const supabase = createServerSupabaseClient(event);
  const {
    data: { session }
  } = await supabase.auth.getSession();
  event.locals.supabase = supabase;
  event.locals.session = session;
  event.locals.user = session?.user ?? null;
  if (session?.user) {
    const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single();
    const userProfile = profile;
    event.locals.userProfile = userProfile;
    if (userProfile?.role === "therapist") {
      const { data: therapistProfile } = await supabase.from("therapists").select("*").eq("user_id", session.user.id).single();
      event.locals.therapistProfile = therapistProfile;
    }
  }
  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range" || name === "x-supabase-api-version";
    }
  });
};
export {
  handle
};
