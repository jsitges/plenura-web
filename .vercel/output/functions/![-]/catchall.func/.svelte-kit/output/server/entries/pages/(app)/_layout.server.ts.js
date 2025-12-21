import { redirect } from "@sveltejs/kit";
const load = async ({ locals, url }) => {
  if (!locals.session) {
    throw redirect(303, "/login?redirect=" + encodeURIComponent(url.pathname));
  }
  return {
    session: locals.session,
    user: locals.user,
    userProfile: locals.userProfile,
    therapistProfile: locals.therapistProfile
  };
};
export {
  load
};
