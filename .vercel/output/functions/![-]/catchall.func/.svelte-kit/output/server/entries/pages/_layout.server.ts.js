const load = async ({ locals }) => {
  return {
    session: locals.session,
    user: locals.user,
    userProfile: locals.userProfile
  };
};
export {
  load
};
